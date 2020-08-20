/* UpdateSettings
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 *
 * Settings are stored in the metadata META_SETTINGS variable.
 * They are stored as a nested map of maps:
 * META_SETTINGS : {
 *  fs_type : {
 *    f_name : VALUE,...
 *  }
 * }
 */
import React, {useEffect, useState} from "react"
import {META_SETTINGS} from "./Transformer"
import DocumentApi from "./DocumentApi"

/** extract an expected feature value
 *
 * @param xml {Node}
 */
function extractFeatureValue(xml) {
  const txt = xml.textContent ? xml.textContent.trim() : ""
  if (xml.nodeType === Node.TEXT_NODE) {
    return txt
  }
  else if (xml.nodeType === Node.ELEMENT_NODE) {
    switch(xml.tagName) {
      case "j:yes":
        return "YES"
      case "j:no":
        return "NO"
      case "j:maybe":
        return "MAYBE"
      case "j:on":
        return "ON"
      case "j:off":
        return "OFF"
      case "tei:binary":
        return txt === "1" || txt.toLowerCase() === "true"
      case "tei:string":
      case "tei:numeric":
        return txt
      case "tei:vColl":
        return Array.from(xml.childNodes)
          .filter( node => node.nodeType === Node.ELEMENT_NODE).map(_ => extractFeatureValue(_))
      case "tei:fs":
        return settingsStructureFromXml([xml])[0]
      case "tei:default":
        console.warn("default settings value is not yet implemented")
        return "MAYBE" //element tei:string { cond:evaluate($node, $params) }
      default:
        return xml.getAttribute("value")
    }
  }

}

export const CONDITIONAL_OPERATOR_PREFIX = "opensiddur-client:operator:"

/** Given a XML node that contains a settings structure, build a JSON object
 * @param {Array<Node>} xmlElements
 */
export function settingsStructureFromXml(xmlElements) {
  return xmlElements.map( (xml) => {
    switch(xml.tagName) {
      case "j:any":
      case "j:all":
      case "j:oneOf":
      case "j:not":
        const operator = CONDITIONAL_OPERATOR_PREFIX + xml.tagName.split(":")[1]
        return {
          [operator] : settingsStructureFromXml(
            Array.from(xml.childNodes).filter( node => node.nodeType === Node.ELEMENT_NODE))
        }
      case "tei:fs":
        const fsType = xml.getAttribute("type")
        return {
          [fsType] : Object.assign({}, ... settingsStructureFromXml(
            Array.from(xml.childNodes).filter( node => node.nodeType === Node.ELEMENT_NODE)))
        }
      case "tei:f":
        const fName = xml.getAttribute("name")
        const children = Array.from(xml.childNodes).
          filter( node => {
            return (
              node.nodeType === Node.TEXT_NODE && node.textContent.trim()
            ) || (
              node.nodeType === Node.ELEMENT_NODE
            )
          })
        return {
          // if there is no possible value, it must come from the element itself
          [fName]: extractFeatureValue(children.length > 0 ? children[0] : xml)
        }
    }
  })
}


/** Parse settings from a single element */
export function parseSettings(xmlElements) {
  return settingsStructureFromXml(xmlElements)[0]
}

/** merge updates into originalSettings.
 * If a setting exists in updates and not in originalSettings, add it
 * If it exists in both, updates overrides originalSettings
 * @return a copy of originalSettings with updates
 */
export function mergeSettings(originalSettings, updates) {
  const updated = JSON.parse(JSON.stringify(originalSettings))
  for (const updateKey of Object.keys(updates)) {
    const originalOfKey = originalSettings.hasOwnProperty(updateKey) ? originalSettings[updateKey] : {}
    updated[updateKey] = Object.assign(originalOfKey, updates[updateKey])
  }
  return updated
}

/** Settings are stored in the metadata prop under META_SETTINGS */
export default function UpdateSettings(props) {
  const xml = props.nodes[0]

  const [nextMetadata, setNextMetadata] = useState(props.metadata)
  const hasUpdates = (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("jf:set"))

  useEffect(() => {
    if (hasUpdates) {
      const currentSettings = props.metadata.get(META_SETTINGS) || {}

      const getSettingsFrom = async (uri) => {
        const settingsXml = await DocumentApi.getUri(uri, props.documentName, props.documentApi)
        return parseSettings(settingsXml)
      }

      const getAllNewSettings = async () => {
        const newSettingsUris = xml.getAttribute("jf:set").split(/\s+/)
        const allNewSettings = await Promise.all(newSettingsUris.map(async (_) => getSettingsFrom(_)))
        const updatedSettings = allNewSettings.reduce(mergeSettings, currentSettings)
        setNextMetadata(props.metadata.set(META_SETTINGS, updatedSettings))
      }

      getAllNewSettings()
    }
  }, [props.metadata, props.documentName, props.documentApi, hasUpdates, xml])

  if (hasUpdates) {
    return (<div className="UpdateSettings">
        { props.chain.nextWithMetadataUpdate(props, nextMetadata) }
      </div>)
  }
  else return props.chain.next(props)
}