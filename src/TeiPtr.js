/* TeiPtr
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer, {LOCATION_CONTEXT_SWITCH, ParsedPtr} from "./Transformer"
import DocumentApi from "./DocumentApi"
import {InlineMode} from "./InlineModeContext"

export default function TeiPtr(props) {
  const xml = props.nodes[0]
  const metadata = props.metadata
  const type = xml.hasAttribute("type") && xml.attributes["type"].value
  const target = xml.attributes["target"].value
  const inline = type === "inline"

  if (type === "url") {
    // tei:ptr is an empty element, html:a is not
    return <a href={target}>{ target }</a>
  }
  else {
    const parsedPtr = ParsedPtr.parsePtr(target)
    const documentName = parsedPtr.documentName
    let content
    if (documentName === null && !inline) {
      // the fragment identifies a part of the same document, there is no need to reload
      const thisFragment = DocumentApi.getFragment(xml.ownerDocument, parsedPtr.fragment)

      content = Transformer.applyTo(thisFragment, props, LOCATION_CONTEXT_SWITCH)
    }
    else {
      content = props.transformerRecursionFunction(documentName || props.documentName, parsedPtr.fragment, metadata)
    }
    return (
      <div className={xml.tagName}>
        <InlineMode.Provider value={inline}>{content}</InlineMode.Provider>
      </div>
    )
  }

}