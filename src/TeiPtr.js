/* TeiPtr
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer, {LOCATION_CONTEXT_SWITCH, META_INLINE_MODE, ParsedPtr} from "./Transformer"

export default function TeiPtr(props) {
  const xml = props.nodes[0]
  const metadata = props.metadata
  const type = xml.hasAttribute("type") && xml.attributes["type"].value
  const target = xml.attributes["target"].value
  const inline = type === "inline"
  const nextMetadata = metadata.set(META_INLINE_MODE, inline)
  const nextProps = Object.assign({}, props)
  nextProps.metadata = nextMetadata
  console.log("ptr", target)

  if (type === "url") {
    // tei:ptr is an empty element, html:a is not
    return <a href={target}>{ target }</a>
  }
  else {
    const parsedPtr = ParsedPtr.parsePtr(target)
    const documentName = parsedPtr.documentName
    let content
    if (documentName === null) {
      // the fragment identifies a part of the same document, there is no need to reload
      const thisFragment = Transformer.getFragment(xml.ownerDocument, parsedPtr.fragment)

      content = Transformer.applyTo(thisFragment, nextProps, LOCATION_CONTEXT_SWITCH)
    }
    else {
      content = props.transformerRecursionFunction(documentName, parsedPtr.fragment, nextMetadata)
    }
    return (
      <div className={xml.tagName}>{content}</div>
    )
  }

}