/* ViewTransformer
 * Transform a JLPTEI document or document fragment into a React UI
 * props:
 * * document: The document name (URL encoded)
 * * fragment: The document fragment (URL encoded)
 * * settings: Record of conditional settings [not yet implemented]
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import DocumentApi from "./DocumentApi"

/** Primary transformer class for one JLPTEI original XML to React
 * The Transformer keeps track of its context document
 */
class Transformer {
  constructor(contextDocument, contextDocumentName) {
    this.NAMESPACES = {
      "tei": "http://www.tei-c.org/ns/1.0",
      "j": "http://jewishliturgy.org/ns/jlptei/1.0",
      "jf": "http://jewishliturgy.org/ns/jlptei/flat/1.0"
    }
    this.contextDocument = contextDocument
    this.contextDocumentName = contextDocumentName
  }

  namespaceResolver(ns) {
    return this.NAMESPACES[ns]
  }

  getRange(xmlDocument, fragment) {
    const [ _1, left, right, _2] = fragment.split(/[(,)]/) // range ( left , right )
    const leftNode = this.getId(xmlDocument, left)
    const rightNode = this.getId(xmlDocument, right)

    if (leftNode === rightNode) {
      // the whole "range" is actually 1 node
      return leftNode
    }
    else {
      // we return a DocumentFragment containing the range, which ideally would be a StaticRange
      // unfortunately, that is supported on fewer browsers
      const range = xmlDocument.createRange()
      range.setStartBefore(leftNode)
      range.setEndAfter(rightNode)

      return range.cloneContents()
    }
  }

  getId(xmlDocument, id) {
    return xmlDocument.evaluate(`//*[@jf:id='${id}']`, xmlDocument,
      (x) => this.namespaceResolver(x), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  getFragment(xmlDocument, fragment) {
    return (fragment.startsWith("range")) ?
      this.getRange(xmlDocument, fragment) :
      this.getId(xmlDocument, fragment)
  }

  parsePtr(ptrTarget) {
    const splitted = ptrTarget.split("#")
    const documentPart = (splitted.length === 1) ? splitted.pop() : splitted[0]
    const docSplit = documentPart.split("/")
    const [documentName, apiName] = [
      (documentPart === "") ? null : docSplit.pop(),
      (documentPart === "") ? null : docSplit.pop()]
    const fragment = (splitted.length === 1) ? null : splitted.pop()
    return {
      api: apiName,
      documentName: documentName,
      fragment: fragment
    }
  }

  /** handle tei:ptr elements */
  teiPtr(xml) {
    const isUrlPtr = xml.hasAttribute("type") && xml.attributes["type"].value === "url"
    const target = xml.attributes["target"].value
    console.log("ptr", target)

    if (isUrlPtr) {
      const transformedChildren = (xml.hasChildNodes() && this.transform(xml.childNodes)) || target
      return <a href={target}>{ transformedChildren }</a>
    }
    else {
      const parsedPtr = this.parsePtr(target)
      const documentName = parsedPtr.documentName || this.contextDocumentName
      return <ViewTransformer document={documentName} fragment={parsedPtr.fragment}/>
    }
  }

  transform(xml) {
    const traverseChildren = () => {
      let parsedChildren = []
      if (xml.hasChildNodes()) {
        let children = xml.childNodes

        for (let i = 0; i < children.length; i++) {
          parsedChildren.push(this.transform(children[i]))
        }
      }
      return parsedChildren
    }

    switch (xml.nodeType) {
      case Node.DOCUMENT_NODE:
        console.log("document node")
        return this.transform(xml.documentElement)
      case Node.DOCUMENT_FRAGMENT_NODE:
        console.log("document fragment node")
        let parsedChildren = traverseChildren()
        return (<div className="DocumentFragment">
          {parsedChildren}
        </div>)
      case Node.ELEMENT_NODE:
        switch (xml.tagName) {
          case "tei:teiHeader":
            console.log("Skipping header")
            return []
          case "tei:ptr":
            return this.teiPtr(xml)
          default:
            console.log("element node", xml)
            let parsedChildren = traverseChildren()
            return (<div className={xml.tagName}>
              {parsedChildren}
            </div>)
        }
      case Node.TEXT_NODE:
        console.log("text node", xml)
        return xml.wholeText
      default:
        console.log("wtf? ", xml)
        return []
    }
  }

}

export default function ViewTransformer(props) {
  const document = props.document
  const api = "original"
  const fragment = (props.fragment) ? decodeURIComponent(props.fragment) : null
  const docApi = new DocumentApi()

  const [content, setContent] = useState(<div>Loading...</div>)

  const updateDocument = () => {
    const fetcher = async () => {
      const docContent = await docApi.get(document, "xml", api)
      docContent.normalize()
      const transformer = new Transformer(docContent, props.document)
      const contentToTransform = fragment ? transformer.getFragment(docContent, fragment) : docContent
      console.log("contentToTransform for ", props.document, "#", props.fragment, "=", contentToTransform)
      setContent(transformer.transform(contentToTransform))
    }
    fetcher()
  }

  useEffect(() => updateDocument(), [document, fragment])

  return <div className="ViewTransformer">{content}</div>
}