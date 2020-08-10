/* Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import UpdateLanguage from "./UpdateLanguage"
import UpdateLicense from "./UpdateLicense"
import UpdateContributors from "./UpdateContributors"
import UpdateSettings from "./UpdateSettings"
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
import UpdateConditionals from "./UpdateConditionals"
import DocumentApi from "./DocumentApi"
import JfParallelGrp from "./JfParallelGrp"

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
// add styling

export const META_INLINE_MODE = "inline"
export const META_LANG = "lang"
export const META_LICENSE = "license"
export const META_CONTRIBUTORS = "contributors"
export const META_SETTINGS = "settings"
export const META_SOURCES = "sources"

// all system-wide settings are stored here...
export const SETTINGS_OPENSIDDUR = "opensiddur"
// including the selected translations
export const SETTINGS_TRANSLATION = "translation"

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

export function nsResolver(ns) {
  return NAMESPACES[ns] || null
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
  [LOCATION_CONTEXT_SWITCH]: [],
  [ELEMENT_CONTEXT_SWITCH]: [UpdateLanguage, UpdateSettings, UpdateConditionals, Annotate]
}

export class TransformerContextChain {
  constructor(level, chain_levels=DEFAULT_CHAIN, chain=undefined) {
    this.chain = chain ? chain : [
      ((level >= DOCUMENT_CONTEXT_SWITCH) ? chain_levels[DOCUMENT_CONTEXT_SWITCH] : []),
      ((level >= LOCATION_CONTEXT_SWITCH) ? chain_levels[LOCATION_CONTEXT_SWITCH] : []),
      ((level >= ELEMENT_CONTEXT_SWITCH) ? chain_levels[ELEMENT_CONTEXT_SWITCH] : [])
    ].flat()
    this.level = level
  }

  next(props, metadata) {
    const chainLength = this.chain.length
    const nextProps = Object.assign({}, props)
    nextProps.chain = new TransformerContextChain(this.level, null, this.chain.slice(0, -1))
    if (metadata) {
      nextProps.metadata = metadata
    }
    if (chainLength > 0) {
      return React.createElement(this.chain[chainLength - 1], nextProps)
    }
    else {
      return Transformer.transform(nextProps)
    }
  }

  /** Continue the chain with a metadata update
   *
   * @param props Props to pass on to the chain
   * @param metadata New metadata
   */
  nextWithMetadataUpdate(props, metadata) {
    return this.next(props, metadata)
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
  /** Filter xml nodes from child traversal
   *
   * @param xml {Node}
   * @return {boolean} true if node should be traversed
   */
  // TODO: test the traversal filter in traverseChildren
  static traversalFilter(xml) {
    return true
  }

  static traverseChildren(xml, props, level=ELEMENT_CONTEXT_SWITCH,
                          traversalFilter=Transformer.traversalFilter) {
    if (xml.hasChildNodes()) {
      return Transformer.applyTo(Array.from(xml.childNodes).filter(traversalFilter), props, level)
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
        case "j:conditions":
        case "j:links":
        case "j:settings":
        case "jf:concurrent":
          return null
        case "jf:parallelGrp":
          return <JfParallelGrp {...standardProps}/>
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
          //console.log("text node", xml)
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
    const doc = (firstXml.nodeType === Node.DOCUMENT_NODE) ? firstXml : firstXml.ownerDocument
    const props = Object.assign({}, standardProps)
    props.metadata = props.metadata || new TransformerMetadata()
    props.xmlDoc = doc
    return props.nodes.map(node => {
      const contextSwitch = new TransformerContextChain(contextSwitchLevel)
      return contextSwitch.next(Object.assign(props, {
        chain: contextSwitch,
        nodes: [node]
      }))
    })
  }

  static applyTo(xmlList, standardProps, contextSwitchLevel=ELEMENT_CONTEXT_SWITCH) {
    const props = Object.assign({}, standardProps)
    props.nodes = xmlList
    return Transformer.apply(props, contextSwitchLevel)
  }

  // helper functions for redirectFragment. Used for testing, but not part of the public interface
  // of the class
  /** get the node representing the primary document in a linkage document
   *
   * @param parallelDocumentRoots {HTMLCollection}
   * @param primaryDocumentName {string}
   * @return {Element}
   * @private
   */
  static _getPrimaryDocument(parallelDocumentRoots, primaryDocumentName)  {
    for (let ctr = 0; ctr < parallelDocumentRoots.length; ctr++) {
      const documentRoot = parallelDocumentRoots.item(ctr)
      const documentUri = documentRoot.getAttribute("jf:document")
      console.log("****documentUri=", documentUri, " when documentRoot=", documentRoot)
      const documentUriSplit = documentUri.split("/")
      const documentName = documentUriSplit[documentUriSplit.length - 1]
      if (primaryDocumentName === documentName) {
        return documentRoot
      }
    }
    throw Error("In translation redirect, no primary document could be found for " + document)
  }

  /** Find the *other* parallel texts to a given parallel group
   * @param linkageDocument {Document} The linkage document
   * @param parallelGrp {Element} A parallelGrp element
   * @return Array<Element> A list of parallelGrp elements
   */
  static getParallels(linkageDocument, parallelGrp) {
    const target = parallelGrp.getAttribute("target")
    const allParallelGrps = linkageDocument.getElementsByTagNameNS(JF_NS, "parallelGrp")
    let actualParallels = []
    for (let ctr = 0; ctr < allParallelGrps.length; ctr++) {
      const pg = allParallelGrps.item(ctr)
      const pgTarget = pg.getAttribute("target")
      if (pgTarget === target && pg !== parallelGrp) {
        actualParallels.push(pg)
      }
    }
    return actualParallels
  }

  /** Find the borders of the linkage document fragment within the primary document
   *
   * @param primaryDocument {Element}
   * @param fragment {string}
   * @return {Node[]} stream, left and right node *or* one node indicating the whole stream
   * @private
   */
  static _linkageDocumentFragment(primaryDocument, fragment) {
    const stream = primaryDocument.getElementsByTagNameNS(JF_NS, "unflattened").item(0)
    if (fragment == null || fragment === "") {
      // an empty fragment means the primary text stream
      return [stream, null, null]
    }
    else if (fragment.startsWith("range")) {
      const [ _1, left, right, _2] = fragment.split(/[(,)]/) // range ( left , right )
      const leftNode = DocumentApi.getId(primaryDocument, left, primaryDocument)
      const rightNode = DocumentApi.getId(primaryDocument, right, primaryDocument)
      return [stream, leftNode, rightNode]
    }
    else {
      const idNode = DocumentApi.getId(primaryDocument, fragment, primaryDocument)
      return [stream, idNode, idNode]
    }
  }

  /** Mutate a linkage document in-place. The primary document is mutated, such that anything that is
   * not within the bounds of the fragment is removed.
   *
   * @param linkageDocument {Document} The linkage document
   * @param primaryDocument {Element} The primary document
   * @param fragment {string} The fragment
   * @return {Node} the start node of evaluation, with the side effect that linkageDocument may have been mutated
   * @private
   */
  static _mutateLinkageDocument(linkageDocument, primaryDocument, fragment) {
    const [stream, left, right] = Transformer._linkageDocumentFragment(primaryDocument, fragment)
    if (left != null && left !== stream)  {
        // if left is null, we just return the stream
        // if "left" is the stream, then we don't need to mutate - we return the stream
      // there is a range: the linkage document has to be traversed and nodes should be removed unless they are:
      // within the range *or*
      // ancestors of the left node *or*
      // ancestors of the right node

      const iterator = linkageDocument.createNodeIterator(stream, NodeFilter.SHOW_ELEMENT)
      let toRemove = []
      while(iterator.nextNode()) {
        const thisNode = iterator.referenceNode
        const nodeCompareStart = left.compareDocumentPosition(thisNode)
        const nodeCompareEnd = right.compareDocumentPosition(thisNode)

        if (nodeCompareStart === 0 || nodeCompareEnd === 0 ||
          ((nodeCompareStart | nodeCompareEnd) & Node.DOCUMENT_POSITION_CONTAINS) ||
          ( (nodeCompareStart & Node.DOCUMENT_POSITION_FOLLOWING) > 0 &&
            (nodeCompareEnd & Node.DOCUMENT_POSITION_PRECEDING) > 0)
          ) {}
        else {
          toRemove.push(thisNode)
        }
      }

      toRemove.forEach( (_) => _.remove() )
    }

    return stream
  }


  /** Find the fragment from a linkage document
   *
   * @param document {string} The name of the document that was redirected.
   *                      This will determine which parallel text should be considered primary.
   * @param fragment {string} The fragment of the redirect (may be a range)
   * @param linkageDocument {Document} The linkage document node
   */
  static redirectFragment(
    document,
    fragment,
    linkageDocument
  ) {
    /* The input will look like:
    * <jf:parallel-document>
    *   <tei:idno>...</tei:idno>
    *   <tei:TEI jf:document="...">
    *     <tei:text>
    *       <jf:unflattened>
    *         <jf:parallelGrp target="...">
    *           <jf:parallel domain="...">
    *
    * </jf:parallel-document>
    */
    const clone = linkageDocument.cloneNode(true)
    const parallelDocumentRoots = clone.getElementsByTagNameNS(TEI_NS, "TEI")
    const primaryDocument = Transformer._getPrimaryDocument(parallelDocumentRoots, document)
    return Transformer._mutateLinkageDocument(clone, primaryDocument, fragment)
  }

}