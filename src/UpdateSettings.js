/* UpdateSettings
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

/** extract an expected feature value
 *
 * @param xml {Node}
 */
function extractFeatureValue(xml) {
  if (xml.nodeType === Node.TEXT_NODE) {
    return xml.textContent
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
        return xml.textContent === "1" || xml.textContent === "true"
      case "tei:string":
      case "tei:numeric":
        return xml.textContent
      case "tei:vColl":
        // TODO: vColl should create an array of values
        return settingsStructureFromXml(Array.from(xml.childNodes).filter( node => node.nodeType === Node.ELEMENT_NODE))
      case "tei:default":
        console.warn("default settings value is not yet implemented")
        return "MAYBE" //element tei:string { cond:evaluate($node, $params) }
      default:
        return xml.getAttribute("value")
    }
  }

}

/** Given a XML node that contains a settings structure, build a JSON object
 * @param {Array<Element>} xmlElements
 */
function settingsStructureFromXml(xmlElements) {
  return xmlElements.map( (xml) => {
    switch(xml.tagName) {
      case "tei:fs":
        const fsType = xml.getAttribute("type")
        return {
          [fsType] : Object.assign({}, ... settingsStructureFromXml(
            Array.from(xml.childNodes).filter( node => node.nodeType === Node.ELEMENT_NODE)))
        }
      case "tei:f":
        const fName = xml.getAttribute("name")
        return {
          [fName]: extractFeatureValue(xml.firstChild)
        }
    }
  })
}

/** Settings are stored in the metadata prop under META_SETTINGS */
export default function UpdateSettings(props) {

}