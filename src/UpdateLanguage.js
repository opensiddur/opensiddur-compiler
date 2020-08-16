/* UpdateLanguage
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useContext} from "react"
import TransformerMetadata from "./TransformerMetadata"
import {LOCATION_CONTEXT_SWITCH} from "./Transformer"
import {CurrentLanguageContext} from "./LanguageMetadataContext"


/** standard props are:
 *
 * @param props xmlDoc, node, transformerRecursionFunction, chain, metadata
 * @constructor
 */
export default function UpdateLanguage(props) {
  const languageContext = useContext(CurrentLanguageContext)
  const xml = props.nodes[0]
  const oldLang = languageContext
  const newLang = (props.chain.level >= LOCATION_CONTEXT_SWITCH) ? TransformerMetadata.contextLanguage(xml) :
    (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang") && xml.getAttribute("xml:lang"))
  const needsChange = !!(newLang && (!oldLang || oldLang !== newLang))

  if (needsChange) {
    return <div className="UpdateLanguage" lang={newLang}>
      <CurrentLanguageContext.Provider value={newLang}>
        {props.chain.next(props)}
      </CurrentLanguageContext.Provider>
    </div>
  }
  else {
    return props.chain.next(props)
  }
}