/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import MetadataBox from "./MetadataBox"

// TODO:
// test transform()
// add tracking of text direction on new document?
// add tracking of text direction on new element?
// add tracking of license metadata on new document
// add license metadata to a global list
// add tracking of contributors by document
// add tracking of contributors in a global list
// add tracking of sources by document
// add tracking of sources in a global list
// display license, contributor, source lists at the end of the document [not in this class]
// add support for tracking settings via jf:set and metadata to a global list
// add support for live conditional evaluation
// add support for notes (external)
// add support for instructions
// add styling

export const META_INLINE_MODE = "inline"
export const META_LANG = "lang"
export const META_LICENSE = "license"

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
      return [leftNode]
    }
    else {
      // Ideally, this would be a StaticRange
      // unfortunately, that is supported on fewer browsers
      const range = this.contextDocument.createRange()
      range.setStartBefore(leftNode)
      range.setEndAfter(rightNode)

      // this code is derived from https://stackoverflow.com/questions/35475961/how-to-iterate-over-every-node-in-a-selected-range-in-javascript
      // it should return the nodes in the range from their original context instead of as a document fragment
      // like range.cloneContents()
      const nodeIterator = document.createNodeIterator(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ALL, // pre-filter
        {
          // custom filter
          acceptNode: function (node) {
            const inRange = range.intersectsNode(node)

            return inRange ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
          }
        }
      );

      let nodesInRange = []
      let nodeSet = new Set()
      while (nodeIterator.nextNode()) {
        const thisNode = nodeIterator.referenceNode
        const nodeCompareStart = leftNode.compareDocumentPosition(thisNode)
        const nodeCompareEnd = rightNode.compareDocumentPosition(thisNode)

        const isStartNode = nodeCompareStart === 0
        const isEndNode = nodeCompareEnd === 0
        const isBeforeStartNode = (nodeCompareStart & Node.DOCUMENT_POSITION_PRECEDING) > 0
        const isAfterEndNode = (nodeCompareEnd & Node.DOCUMENT_POSITION_FOLLOWING) > 0 &&
          (nodeCompareEnd & Node.DOCUMENT_POSITION_CONTAINED_BY) === 0

        const keep = (isStartNode || isEndNode || (!isBeforeStartNode && !isAfterEndNode))

        if (keep) {
          if (!nodeSet.has(thisNode.parentNode)) {
            nodesInRange.push(thisNode)
          }
          nodeSet = nodeSet.add(thisNode)
        }

      }

      return nodesInRange
    }
  }

  getId(id) {
    return this.contextDocument.evaluate(`//*[@jf:id='${id}']`, this.contextDocument,
      (x) => this.namespaceResolver(x), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  /** get a fragment
   * @return a List[Node] containing the fragment
   */
  getFragment(fragment) {
    return (fragment.startsWith("range")) ?
      this.getRange(fragment) :
      [this.getId(fragment)]
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

  /** update the "lang" metadata, dependent on the given XML
   * @param newContext We are entering a new context.
   * @return a structure including the next metadata structure and an update attribute, if necessary
   * */
  updateLanguage(xml, metadata, newContext=false) {
    const oldLang = metadata.get(META_LANG)
    const newLang = newContext ? this.contextLanguage(xml) :
      (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang") && xml.getAttribute("xml:lang"))
    const needsChange = (newLang && (!oldLang || oldLang !== newLang))

    return {
      update: needsChange ? { lang: newLang} : null,
      nextMetadata: needsChange ? metadata.set(META_LANG, newLang) : metadata
    }

  }

  /** @return the context language of the xml node, if available. If not, return null */
  contextLanguage(xml) {
    if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang")) {
      return xml.getAttribute("xml:lang")
    }
    else if (xml.parentElement != null) {
      return this.contextLanguage(xml.parentElement)
    }
    else return null
  }

  /** update the licensing metadata. License data can only change when the document has changed
   * @return a structure indicating new metadata and the update
   */
  updateLicense(xml, metadata, full=false) {
    const oldLicense = metadata.get(META_LICENSE)
    const newLicense = full && this.contextLicense(xml)
    const needsChange = full && (newLicense && (!oldLicense || oldLicense !== newLicense))

    return {
      update: needsChange ? {license: newLicense} : null,
      nextMetadata: needsChange ? metadata.set(META_LICENSE, newLicense) : metadata
    }
  }

  /** Get the license of a particular xml node
   *
   * @param xml The node
   * @return A license URI
   */
  contextLicense(xml) {
    const docNode = xml.ownerDocument
    const licenseNode = docNode.querySelector("licence")
    const licenseUri = licenseNode.getAttribute("target")
    return licenseUri
  }

  /** handle tei:ptr elements */
  teiPtr(xml, metadata) {
    const type = xml.hasAttribute("type") && xml.attributes["type"].value
    const target = xml.attributes["target"].value
    const inline = type === "inline"
    const nextMetadata = metadata.set(META_INLINE_MODE, inline)
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
        content = thisFragment.map( (newNode) => {
          return this.apply(newNode, nextMetadata)
        } )
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
    if (metadata.get(META_INLINE_MODE) &&
      xml.parentNode.nodeType === Node.ELEMENT_NODE && // DocumentFragment does not have a parent element
      !xml.parentElement.hasAttribute("jf:stream")) {
      // ignore non-inline data in inline mode
      return ""
    }
    else {
      return xml.wholeText
    }
  }

  /** Perform a context switch (new document, skip to another part of the document)
   * @param newContext new context node
   * @param oldMetadata metadata before the context switch
   * @param full true if a full context switch is required
   * @param f function of newMetadata to perform on the switched context
   * @return Nodes as processed by f and wrapped in a context switch, if necessary
   */
  contextSwitch(newContext, oldMetadata, full, f) {
    const languageUpdate = this.updateLanguage(newContext, oldMetadata, full)
    let nextMetadata = languageUpdate.nextMetadata

    const licenseUpdate = this.updateLicense(newContext, nextMetadata, full)
    nextMetadata = licenseUpdate.nextMetadata

    const result = f(nextMetadata)

    const hasContextUpdate = languageUpdate.update || licenseUpdate.update

    if (hasContextUpdate) {
      return (<div className="_context" {...languageUpdate.update}>
        <MetadataBox metadata={nextMetadata}/>
        {result}
      </div>)
    }
    else {
      return result
    }
  }

  elementNode(xml, metadata) {
    const contextFunction = (nextMetadata) => {
      let returnValue

      if (metadata.get(META_INLINE_MODE) && !xml.hasAttribute("jf:stream")) {
        // inline mode and the element is not inline... traverse children
        returnValue = this.traverseChildren(xml, nextMetadata)
      }
      else {
        switch (xml.tagName) {
          case "tei:teiHeader":
            returnValue = this.teiHeader(xml, nextMetadata)
            break
          case "tei:ptr":
            returnValue = this.teiPtr(xml, nextMetadata)
            break
          default:
            returnValue = this.genericElement(xml, nextMetadata)
            break
        }
      }
      return returnValue
    }

    return this.contextSwitch(xml, metadata, false, contextFunction)
  }

  /** transform an XML node from JLPTEI to React/HTML
   *
   * @param xml {Node} The XML node to start at
   * @param metadata {TransformerMetadata} Data that should be transferred through recursion
   *  inline: if true, we are including an inline ptr and all included text from stream-elements should be included,
   *    but non-stream children should not (no complex structure, just text).
   *  lang: language code of the context
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
        return this.elementNode(xml, metadata)
      case Node.TEXT_NODE:
        console.log("text node", xml)
        return this.textNode(xml, metadata)
      default:
        console.log("wtf? ", xml)
        return []
    }
  }

  /** Apply a transform, including a context switch */
  apply(xml, metadata=new TransformerMetadata()) {
    return this.contextSwitch(xml, metadata, true, (newMeta) => { return this.transform(xml, newMeta) })
  }

}