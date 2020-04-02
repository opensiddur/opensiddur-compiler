/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import TransformerMetadata, {MetadataUpdate, MetadataUpdateList} from "./TransformerMetadata"
import MetadataBox from "./MetadataBox"
import {ContextSourceInfo} from "./ContextSourceInfo"
import ViewTransformer from "./ViewTransformer"

// TODO:
// test transform()
// add tracking of text direction on new document?
// add tracking of text direction on new element?
// add license metadata to a global list
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
export const META_CONTRIBUTORS = "contributors"
export const META_SOURCES = "sources"

/** indicates a context switch of an element in document order */
export const ELEMENT_CONTEXT_SWITCH = 0
/** indicates a context switch of an element out of document order (to a new location) */
export const LOCATION_CONTEXT_SWITCH = 1
/** indicates a context switch of an entire document */
export const DOCUMENT_CONTEXT_SWITCH = 2

export const TEI_NS = "http://www.tei-c.org/ns/1.0"
export const J_NS = "http://jewishliturgy.org/ns/jlptei/1.0"
export const JF_NS = "http://jewishliturgy.org/ns/jlptei/flat/1.0"
export const XML_NS = "http://www.w3.org/XML/1998/namespace"

export const NAMESPACES = {
  "tei": TEI_NS,
  "j": J_NS,
  "jf": JF_NS,
  "xml": XML_NS
}

export const CONTRIBUTOR_TYPES = {
  "aut" : "Author",
  "ann" : "Annotator",
  "ctb" : "Contributor",
  "cre" : "Creator",
  "edt" : "Editor",
  "fac" : "Facsimilist",
  "fnd" : "Funder",
  "mrk" : "Markup editor",
  "oth" : "Other",
  "pfr" : "Proofreader",
  "spn" : "Sponsor",
  "trc" : "Transcriber",
  "trl" : "Translator"
}

/** Parse a JLPTEI pointer */
export class ParsedPtr {
  constructor(apiName=null, documentName=null, fragment=null) {
    this.apiName = apiName
    this.documentName = documentName
    this.fragment = fragment
  }

  static parsePtr(ptrTarget) {
    const splitted = ptrTarget.split("#")
    const documentPart = (splitted.length === 1) ? splitted.pop() : splitted[0]
    const docSplit = documentPart.split("/")
    const [documentName, apiName] = [
      (documentPart === "") ? null : docSplit.pop(),
      (documentPart === "") ? null : docSplit.pop()]
    const fragment = (splitted.length === 1) ? null : splitted.pop()
    return new ParsedPtr(apiName, documentName, fragment)
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
   *        Its signature is recursionFunction(documentName, fragment, metadata, apiName='original')
   */
  constructor(contextDocument, contextDocumentName, recursionFunction) {
    
    this.contextDocument = contextDocument
    this.contextDocumentName = contextDocumentName
    this.recursionFunction = recursionFunction
  }

  /** get an id from an xml node
   *
   * @param xml Node the root of the node
   * @param id the id to find
   * @return {Node}
   */
  static getId(xml, id) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    return docNode.evaluate(`//*[@jf:id='${id}' or @xml:id='${id}']`, docNode,
      (x) => { return NAMESPACES[x] }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  static getRange(xml, fragment) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const [ _1, left, right, _2] = fragment.split(/[(,)]/) // range ( left , right )
    const leftNode = Transformer.getId(xml, left)
    const rightNode = Transformer.getId(xml, right)

    if (leftNode === rightNode) {
      // the whole "range" is actually 1 node
      return [leftNode]
    }
    else {
      // Ideally, this would be a StaticRange
      // unfortunately, that is supported on fewer browsers
      const range = docNode.createRange()
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

  /** get a fragment
   * @param xml Node
   * @param fragment string
   * @return a List[Node] containing the fragment
   */
  static getFragment(xml, fragment) {
    return (fragment.startsWith("range")) ?
      Transformer.getRange(xml, fragment) :
      [Transformer.getId(xml, fragment)]
  }



  /** update the "lang" metadata, dependent on the given XML
   * @param newContext We are entering a new context.
   * @return a structure including the next metadata structure and an update attribute, if necessary
   * */
  updateLanguage(xml, metadata, newContext=false) {
    const oldLang = metadata.get(META_LANG)
    const newLang = newContext ? TransformerMetadata.contextLanguage(xml) :
      (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang") && xml.getAttribute("xml:lang"))
    const needsChange = (newLang && (!oldLang || oldLang !== newLang))

    return new MetadataUpdate(
      needsChange ? { lang: newLang} : null,
      needsChange ? metadata.set(META_LANG, newLang) : metadata
    )
  }



  /** update the licensing metadata. License data can only change when the document has changed
   * @return MetadataUpdate structure indicating new metadata and the update
   */
  updateLicense(xml, metadata, full=false) {
    const oldLicense = metadata.get(META_LICENSE)
    const newLicense = full && this.contextLicense(xml)
    const needsChange = full && (newLicense && (!oldLicense || oldLicense !== newLicense))

    return new MetadataUpdate(
      needsChange ? {license: newLicense} : null,
      needsChange ? metadata.set(META_LICENSE, newLicense) : metadata
    )
  }


  /** update the contributors metadata, which can only change when the document has changed
   *
   * @param xml Node context
   * @param metadata TransformerMetadata structure
   * @param full boolean true if the document has been changed
   * @return MetadataUpdate structure indicating new metadata and the update
   */
  updateContributors(xml, metadata, full=false) {
    const newContributors = full && this.contextContributors(xml)
    const needsChange = full && newContributors

    return new MetadataUpdate(needsChange ? { contributors: newContributors } : null,
      needsChange ? metadata.set(META_CONTRIBUTORS, newContributors) : metadata)
  }


  /** update the sources metadata, which can only change when the document has changed
   *
   * @param xml Node context
   * @param metadata TransformerMetadata structure
   * @param full boolean true if the document has been changed
   * @return MetadataUpdate structure indicating new metadata and the update
   */
  updateSources(xml, metadata, full=false) {
    const newSources = full && TransformerMetadata.contextSources(xml)
    const needsChange = full && newSources

    return new MetadataUpdate(needsChange ? { sources: newSources } : null,
      needsChange ? metadata.set(META_SOURCES, newSources) : metadata)
  }

  /** handle common attributes that may return elements */
  commonAttributes(xml, metadata) {
    let returnValue = []
    if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("jf:annotation")) {
      returnValue.push(this.jfAnnotation(xml, metadata))
    }

    return returnValue
  }

  /** handle annotations. The API of the annotation (/data/api...) is referenced in the given attribute */
  jfAnnotation(xml, metadata, attribute="jf:annotation") {
    const annotation = xml.getAttribute(attribute)
    const parsedPtr = ParsedPtr.parsePtr(annotation)
    return this.recursionFunction(parsedPtr.documentName, parsedPtr.fragment, metadata, "notes")
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
      const parsedPtr = ParsedPtr.parsePtr(target)
      const documentName = parsedPtr.documentName
      let content
      if (documentName === null) {
        // the fragment identifies a part of the same document, there is no need to reload
        const thisFragment = this.getFragment(parsedPtr.fragment)
        content = thisFragment.map( (newNode) => {
          return this.apply(newNode, nextMetadata, LOCATION_CONTEXT_SWITCH)
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
    let attributeChildren = this.commonAttributes(xml, metadata)
    let parsedChildren = attributeChildren

    if (xml.hasChildNodes()) {
      let children = xml.childNodes

      for (let i = 0; i < children.length; i++) {
        parsedChildren.push(this.transform(children[i], metadata))
      }
    }
    return parsedChildren
  }

  documentNode(xml, metadata) {
    return this.transform(xml.documentElement, metadata)
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
   * @param contextSwitchLevel One of ELEMENT_CONTEXT_SWITCH, LOCATION_CONTEXT_SWITCH or DOCUMENT_CONTEXT_SWITCH
   * @param f function of newMetadata to perform on the switched context
   * @return Nodes as processed by f and wrapped in a context switch, if necessary
   */
  contextSwitch(newContext, oldMetadata, contextSwitchLevel, f) {
    let updates = []
    updates.unshift(this.updateLanguage(newContext, oldMetadata, contextSwitchLevel >= LOCATION_CONTEXT_SWITCH))
    updates.unshift(this.updateLicense(newContext, updates[0].nextMetadata, contextSwitchLevel >= DOCUMENT_CONTEXT_SWITCH))
    updates.unshift(this.updateContributors(newContext, updates[0].nextMetadata, contextSwitchLevel >= DOCUMENT_CONTEXT_SWITCH))
    updates.unshift(this.updateSources(newContext, updates[0].nextMetadata, contextSwitchLevel >= DOCUMENT_CONTEXT_SWITCH))

    const result = f(updates[0].nextMetadata)

    const contextUpdates = new MetadataUpdateList(updates)
    const hasContextUpdate = contextUpdates.hasUpdates

    if (hasContextUpdate) {
      return (<div className="_context" {...contextUpdates.language}>
        <MetadataBox updates={contextUpdates}/>
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

    return this.contextSwitch(xml, metadata, ELEMENT_CONTEXT_SWITCH, contextFunction)
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

  /** Apply a transform, including a context switch
   * @param xml Node The node to begin applying from
   * @param metadata TransformerMetadata initial metadata
   * @param contextSwitchLevel int one of the context switch types
   */
  apply(xml, metadata=new TransformerMetadata(), contextSwitchLevel=DOCUMENT_CONTEXT_SWITCH) {
    return this.contextSwitch(xml, metadata, contextSwitchLevel, (newMeta) => { return this.transform(xml, newMeta) })
  }


  /** Apply a transform, including a context switch to a list of nodes, treating the first as the major context switch
   * @param xmlList Array[Node] The node to begin applying from
   * @param metadata TransformerMetadata initial metadata
   * @param contextSwitchLevel number one of the context switch types that the list of elements will receive,
   *                           performed on the first element of the list
   */
  applyList(xmlList, metadata=new TransformerMetadata(), contextSwitchLevel=DOCUMENT_CONTEXT_SWITCH) {
    return this.contextSwitch(xmlList[0], metadata, contextSwitchLevel, (newMeta) => {
      return xmlList.map ( (xml) => {
        return this.transform(xml, newMeta)
      })
    })
  }

}