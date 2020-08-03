/* DocumentApi: retrieval of documents
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import BaseApi, {ApiError} from "./BaseApi"
import {NAMESPACES, ParsedPtr} from "./Transformer"
import {parseSettings} from "./UpdateSettings"

export default class DocumentApi {
  /** get an id from an xml node
   *
   * @param xml {Node} Node the root of the node
   * @param id {string} the id to find
   * @param contextNode {Node} context node for search (if not provided, the xml document is the context node)
   * @return {Node}
   */
  static getId(xml, id, contextNode=null) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const context = contextNode || docNode
    return docNode.evaluate(`descendant-or-self::*[@jf:id='${id}' or @xml:id='${id}']`, context,
      (x) => { return NAMESPACES[x] }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  }

  /** get a range from an xml node
   *
   * @param xml {Node} The XML in which the range resides
   * @param fragment {string} The fragment string
   * @param contextNode {Node} The context in which to look for the range (optional, default xml root)
   * @return {Node[]|[]}
   */
  static getRange(xml, fragment, contextNode = null) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const context = contextNode || docNode
    const [ _1, left, right, _2] = fragment.split(/[(,)]/) // range ( left , right )
    const leftNode = DocumentApi.getId(xml, left, context)
    const rightNode = DocumentApi.getId(xml, right, context)

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
        contextNode || range.commonAncestorContainer,
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
      DocumentApi.getRange(xml, fragment) :
      [DocumentApi.getId(xml, fragment)]
  }

  /** Retrieve a document
   * @param documentName The document name, URL encoded
   * @param format "html" or "xml"
   * @param api default to "original"
   * @param originalSuffix suffix to apply when api="original"; ignored in all other cases
   * @return A promise to the document
   */
  static async get(documentName, format="xml", api="original", originalSuffix="combined") {
    const apiSuffix = (api === "original") ? ("/" + originalSuffix) : ""
    const url = new URL(`/api/data/${api}/${documentName}${apiSuffix}`, window.location.origin)
    const parseFormat = (format === "xml") ? "application/xml" : "text/html"

    const textDoc = await BaseApi.fetchText(url, format)

    const markup = new DOMParser().parseFromString(textDoc, parseFormat)
    const error = markup.querySelector("parsererror")

    if (error === null) {
      return markup
    }
    else {
      throw new ApiError(false, "parse failed", error.textContent)
    }
  }

  /** Get linkages from an original API
   *
   * @param {Document} linkageDoc The XML document returned from the linkages API
   * @return {{[p: string]: string}}  A map of ids to APIs (/api/...)
   */
  static parseLinkagesFromHtml(linkageDoc) {
    const linkageLinks = Array.from(linkageDoc.querySelectorAll("li.result a"))
    const linkObject = linkageLinks.reduce((linkageMap, a) => ({
      ...linkageMap, [a.textContent]:
          a.getAttribute("href").replace(/^\/exist\/restxq/, "")}),
      {})
    return linkObject
  }

  /** Get all linkages
   *
   * @param documentName The document to find linkages for
   * @return {Promise<void>}
   */
  static async linkages(documentName) {
    const linkageDocument = await DocumentApi.get(documentName, "html", "original", "linkage")
    const linkageMap = DocumentApi.parseLinkagesFromHtml(linkageDocument)
    return linkageMap
  }

  /** Get XML directly from a URI (which may have a fragment */
  static async getUri(uri, defaultDocumentName, defaultApi) {
    const parsedUri = ParsedPtr.parsePtr(uri)
    const documentName = parsedUri.documentName || defaultDocumentName
    const documentApi = parsedUri.apiName || defaultApi
    const resource = await DocumentApi.get(documentName, "xml", documentApi)
    const xml = parsedUri.fragment ?
      DocumentApi.getFragment(resource, parsedUri.fragment) : resource.documentElement
    return xml
  }
}