/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

// TODO:
// test transform()
// add tracking of language on new document
// add tracking of language on new element
// add tracking of text direction on new document
// add tracking of text direction on new element
// add tracking of license metadata on new document
// add license metadata to a global list
// add tracking of contributors by document
// add tracking of contributors in a global list
// add tracking of sources by document
// add tracking of sources in a global list
// display license, contributor, source lists at the end of the document [not in this class]
// add support for tracking settings via jf:set and metadata to a global list
// add support for live conditional evaluation v
// add support for notes (external)
// add support for instructions

/** Holder for the result from @see Transformer.parsePtr */
export class ParsedPtr {
  constructor(apiName=null, documentName=null, fragment=null) {
    this.apiName = apiName
    this.documentName = documentName
    this.fragment = fragment
  }
}

export class TransformerMetadata {
  constructor(md) {
    this.metadata = md ? this.deepCopy(md) : {}
  }

  /** Utility function to create a deep copy of an object */
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  set(key, value) {
    const newCopy = new TransformerMetadata(this.metadata)
    newCopy.metadata[key] = value
    return newCopy
  }

  get(key) {
    return this.metadata[key]
  }

}

/** Primary transformer class for one JLPTEI original XML to React
 * The Transformer keeps track of its context document
 */
export default class Transformer {
  /** Initialize a new Transformer
   *
   * @param contextDocument The XML document
   * @param contextDocumentName The name of the document
   * @param recursionFunction A function to call when recursing to another document.
   *        Its signature is recursionFunction(documentName, fragment, metadata)
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
    return new ParsedPtr(apiName, documentName, fragment)
  }

  /** handle tei:ptr elements */
  teiPtr(xml, metadata) {
    const type = xml.hasAttribute("type") && xml.attributes["type"].value
    const target = xml.attributes["target"].value
    const inline = type === "inline"
    const nextMetadata = metadata.set("inline", inline)
    console.log("ptr", target)

    if (type === "url") {
      // tei:ptr is an empty element, html:a is not
      return <a href={target}>{ target }</a>
    }
    else {
      const parsedPtr = this.parsePtr(target)
      const documentName = parsedPtr.documentName
      let content
      if (documentName === null) {
        // the fragment identifies a part of the same document, there is no need to reload
        const thisFragment = this.getFragment(parsedPtr.fragment)
        content = this.transform(thisFragment, nextMetadata)
      }
      else {
        content = this.recursionFunction(documentName, parsedPtr.fragment, nextMetadata)
      }
      return (
        <div className={xml.tagName}>{content}</div>
      )
    }
  }

  traverseChildren(xml, metadata) {
    let parsedChildren = []
    if (xml.hasChildNodes()) {
      let children = xml.childNodes

      for (let i = 0; i < children.length; i++) {
        parsedChildren.push(this.transform(children[i], metadata))
      }
    }
    return parsedChildren
  }

  documentNode(xml, metadata) {
    return this.transform(xml.documentElement)
  }

  documentFragment(xml, metadata) {
    return this.traverseChildren(xml, metadata)
  }

  teiHeader(xml, metadata) {
    console.log("Skipping header")
    return []
  }

  genericElement(xml, metadata) {
    console.log("element node", xml)
    let parsedChildren = this.traverseChildren(xml, metadata)
    return (<div className={xml.tagName}>
      {parsedChildren}
    </div>)
  }

  textNode(xml, metadata) {
    if (metadata.get("inline") &&
      xml.parentNode.nodeType === Node.ELEMENT_NODE && // DocumentFragment does not have a parent element
      !xml.parentElement.hasAttribute("jf:stream")) {
      // ignore non-inline data in inline mode
      return ""
    }
    else {
      return xml.wholeText
    }
  }

  /** transform an XML node from JLPTEI to React/HTML
   *
   * @param xml {Node} The XML node to start at
   * @param metadata {TransformerMetadata} Data that should be transferred through recursion
   *  inline: if true, we are including an inline ptr and all included text from stream-elements should be included,
   *    but non-stream children should not (no complex structure, just text).
   * @returns {string|Array|[]|*|[]|undefined}
   */
  transform(xml, metadata=new TransformerMetadata()) {
    switch (xml.nodeType) {
      case Node.DOCUMENT_NODE:
        return this.documentNode(xml, metadata)
      case Node.DOCUMENT_FRAGMENT_NODE:
        console.log("document fragment node")
        return this.documentFragment(xml, metadata)
      case Node.ELEMENT_NODE:
        if (metadata.get("inline") && !xml.hasAttribute("jf:stream")) {
          // inline mode and the element is not inline... traverse children
          return this.traverseChildren(xml, metadata)
        }

        switch (xml.tagName) {
          case "tei:teiHeader":
            return this.teiHeader(xml, metadata)
          case "tei:ptr":
            return this.teiPtr(xml, metadata)
          default:
            return this.genericElement(xml, metadata)
        }
      case Node.TEXT_NODE:
        console.log("text node", xml)
        return this.textNode(xml, metadata)
      default:
        console.log("wtf? ", xml)
        return []
    }
  }

}