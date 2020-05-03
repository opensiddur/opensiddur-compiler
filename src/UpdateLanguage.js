/* UpdateLanguage
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import TransformerMetadata from "./TransformerMetadata"
import {LOCATION_CONTEXT_SWITCH, META_LANG} from "./Transformer"


/** standard props are:
 *
 * @param props xmlDoc, node, transformerRecursionFunction, chain, metadata
 * @constructor
 */
export default function UpdateLanguage(props) {
  const xml = props.nodes[0]
  const oldLang = props.metadata.get(META_LANG)
  const newLang = (props.chain.level >= LOCATION_CONTEXT_SWITCH) ? TransformerMetadata.contextLanguage(xml) :
    (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang") && xml.getAttribute("xml:lang"))
  const needsChange = (newLang && (!oldLang || oldLang !== newLang))

  if (needsChange) {
    const nextMetadata = props.metadata.set(META_LANG, newLang)
    return <div className="UpdateLanguage" lang={newLang}>{props.chain.nextWithMetadataUpdate(props, nextMetadata)}</div>
  }
  else {
    return props.chain.next(props)
  }
}