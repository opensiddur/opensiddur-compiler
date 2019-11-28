/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

/** Primary transformer class for one JLPTEI original XML to React
 * The Transformer keeps track of its context document
 */
export default class Transformer {
  /** Initialize a new Transformer
   *
   * @param contextDocument The XML document
   * @param contextDocumentName The name of the document
   * @param recursionFunction A function to call when recursing to another document.
   *        Its signature is recursionFunction(documentName, fragment)
   */
  constructor(contextDocument, contextDocumentName, recursionFunction) {
    this.NAMESPACES = {
      "tei": "http://www.tei-c.org/ns/1.0",
      "j": "http://jewishliturgy.org/ns/jlptei/1.0",
      "jf": "http://jewishliturgy.org/ns/jlptei/flat/1.0"
    }
    this.contextDocument = contextDocument
    this.contextDocumentName = contextDocumentName
    this.recursionFunction = recursionFunction
  }

  namespaceResolver(ns) {
    return this.NAMESPACES[ns]
  }

  getRange(fragment) {
    const [ _1, left, right, _2] = fragment.split(/[(,)]/) // range ( left , right )
    const leftNode = this.getId(left)
    const rightNode = this.getId(right)

    if (leftNode === rightNode) {
      // the whole "range" is actually 1 node
      return leftNode
    }
    else {
      // we return a DocumentFragment containing the range, which ideally would be a StaticRange
      // unfortunately, that is supported on fewer browsers
      const range = this.contextDocument.createRange()
      range.setStartBefore(leftNode)
      range.setEndAfter(rightNode)

      return range.cloneContents()
    }
  }

  getId(id) {
    return this.contextDocument.evaluate(`//*[@jf:id='${id}']`, this.contextDocument,
      (x) => this.namespaceResolver(x), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  getFragment(fragment) {
    return (fragment.startsWith("range")) ?
      this.getRange(fragment) :
      this.getId(fragment)
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
      return this.recursionFunction(documentName, parsedPtr.fragment)
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