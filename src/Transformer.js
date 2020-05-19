/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import UpdateLanguage from "./UpdateLanguage"
import UpdateLicense from "./UpdateLicense"
import UpdateContributors from "./UpdateContributors"
import UpdateSources from "./UpdateSources"
import DocumentNode from "./DocumentNode"
import TeiHeader from "./TeiHeader"
import TeiPtr from "./TeiPtr"
import TextNode from "./TextNode"
import DocumentFragment from "./DocumentFragment"
import GenericElement from "./GenericElement"
import Annotate from "./Annotate"
import TransformerMetadata from "./TransformerMetadata"
import TeiAnchor from "./TeiAnchor"

// TODO:
// REFACTOR: Transform should become a class with static methods that just switches to which react node to produce
// REFACTOR: metadata updates should be simplified to LanguageUpdate(), SourcesUpdate(), ContributorsUpdate(),
//  each of which may return a metadata update box or only its children
// REFACTOR: use TransformerContextChain instead of contextSwitch()

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

const DEFAULT_CHAIN={
  [DOCUMENT_CONTEXT_SWITCH]: [UpdateLicense, UpdateContributors, UpdateSources],
  [LOCATION_CONTEXT_SWITCH]: [], // also, UpdateSettings, UpdateConditionals...
  [ELEMENT_CONTEXT_SWITCH]: [UpdateLanguage, Annotate]
}

export class TransformerContextChain {
  constructor(level, chain_levels=DEFAULT_CHAIN) {
    this.chain = [
      ((level >= DOCUMENT_CONTEXT_SWITCH) ? chain_levels[DOCUMENT_CONTEXT_SWITCH] : []),
      ((level >= LOCATION_CONTEXT_SWITCH) ? chain_levels[LOCATION_CONTEXT_SWITCH] : []),
      ((level >= ELEMENT_CONTEXT_SWITCH) ? chain_levels[ELEMENT_CONTEXT_SWITCH] : [])
    ].flat()
    this.level = level
  }

  next(props) {
    if (this.chain.length > 0) {
      return React.createElement(this.chain.pop(), props)
    }
    else {
      return Transformer.transform(props)
    }
  }

  /** Continue the chain with a metadata update
   *
   * @param props Props to pass on to the chain
   * @param metadata New metadata
   */
  nextWithMetadataUpdate(props, metadata) {
    const newProps = Object.assign({}, props) // create a shallow copy
    newProps.metadata = metadata
    return this.next(newProps)
  }
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
 * To be used with Transformer, a component must pass the following props:
 *  xmlDoc - the root document being processed
 *  documentName - name of the document
 *  documentApi - API used to retrieve the document
 *  nodes - a list of XML nodes to be be processed with the same context
 *  metadata - a TransformerMetadata structure containing the metadata, as known once the element has been processed
 *  chain - a TransformerContextChain containing the next functions to call before processing the next node
 *  transformerRecursionFunction - the function to call when starting processing a new document
 */
export default class Transformer {
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

  static traverseChildren(xml, props) {
    console.log("traverseChildren: ", xml.hasChildNodes(), Array.from(xml.childNodes))
    if (xml.hasChildNodes()) {
      return Transformer.applyTo(Array.from(xml.childNodes), props, ELEMENT_CONTEXT_SWITCH)
    }
    else return null
  }

  // standardProps.nodes[0] is an element
  static transformElement(standardProps) {
    const xml = standardProps.nodes[0]
    const metadata = standardProps.metadata

    if (metadata.get(META_INLINE_MODE) && xml.hasAttribute("jf:layer-id")) {
      // inline mode and the element is not from the stream - skip it
      return null
    }
    else {
      switch (xml.tagName) {
        case "tei:anchor":
          return <TeiAnchor {...standardProps}/>
        case "tei:teiHeader":
          return <TeiHeader {...standardProps}/>
        case "tei:ptr":
          return <TeiPtr {...standardProps} />
        default:
          return <GenericElement {...standardProps}/>
      }
    }
  }

  /** transform an XML node from JLPTEI to React/HTML
   *
   * @param standardProps The standard props for Transformer
   * @returns {string|Array|[]|*|[]|undefined}
   */
  static transform(standardProps) {
    console.log("***transform", standardProps)
    const xmlList = standardProps.nodes
    return xmlList.map( (xml) => {
      // set the next context node
      const nextProps = Object.assign({}, standardProps)
      nextProps.nodes = [xml]

      switch (xml.nodeType) {
        case Node.DOCUMENT_NODE:
          return <DocumentNode {...nextProps}/>
        case Node.DOCUMENT_FRAGMENT_NODE:
          console.log("document fragment node")
          return <DocumentFragment {...nextProps} />
        case Node.ELEMENT_NODE:
          return Transformer.transformElement(nextProps)
        case Node.TEXT_NODE:
          console.log("text node", xml)
          return <TextNode {...nextProps}/>
        default:
          console.log("wtf? ", xml)
          return null
      }
    })
  }

  /** Apply a transform, including a context switch to a list of nodes, treating the first as the major context switch
   * @param standardProps props required to call Transformer: the chain and xmlDoc are overridden by apply()
   * @param contextSwitchLevel number one of the context switch types that the list of elements will receive,
   *                           performed on the first element of the list
   */
  static apply(standardProps,
        contextSwitchLevel=DOCUMENT_CONTEXT_SWITCH) {
    const firstXml = standardProps.nodes[0]
    const contextSwitch = new TransformerContextChain(contextSwitchLevel)
    console.log("contextSwitch=",contextSwitch)
    const doc = (firstXml.nodeType === Node.DOCUMENT_NODE) ? firstXml : firstXml.ownerDocument
    const props = Object.assign({}, standardProps)
    props.metadata = props.metadata || new TransformerMetadata()
    props.chain = contextSwitch
    props.xmlDoc = doc
    console.log("apply- props",props)
    return contextSwitch.next(props)
  }

  static applyTo(xmlList, standardProps, contextSwitchLevel=ELEMENT_CONTEXT_SWITCH) {
    const props = Object.assign({}, standardProps)
    props.nodes = xmlList
    return Transformer.apply(props, contextSwitchLevel)
  }

}