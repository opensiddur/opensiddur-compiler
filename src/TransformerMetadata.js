/* TransformerMetadata
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {CONTRIBUTOR_TYPES, TEI_NS} from "./Transformer"
import {ContextSourceInfo} from "./ContextSourceInfo"

export default class TransformerMetadata {
  /** Copy constructor
   *
   * @param md TransformerMetadata to copy (optional)
   */
  constructor(md) {
    this.metadata = md ? this.deepCopy(md.metadata) : {}
  }

  /** Utility function to create a deep copy of an object */
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  set(key, value) {
    const newCopy = new TransformerMetadata(this)
    newCopy.metadata[key] = value
    return newCopy
  }

  get(key) {
    return this.metadata[key]
  }

  // functions to read context from a document

  /** Get the license of a particular xml node
   *
   * @param xml The node
   * @return A license URI
   */
  static contextLicense(xml) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const licenseNode = docNode.getElementsByTagNameNS(TEI_NS, "licence")[0]
    const licenseUri = licenseNode.getAttribute("target")
    return licenseUri
  }

  /** @return the context language of the xml node, if available. If not, return null */
  static contextLanguage(xml) {
    if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("xml:lang")) {
      return xml.getAttribute("xml:lang")
    }
    else if (xml.parentElement != null) {
      return TransformerMetadata.contextLanguage(xml.parentElement)
    }
    else return null
  }

  /** Pick up contributor data from the context
   *
   * @param xml Node in the context document
   * @return Object A contributor structure consisting of type : [list of contributor URIs]
   */
  static contextContributors(xml) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const respStmts = docNode.getElementsByTagNameNS(TEI_NS, "respStmt")
    const changes = docNode.getElementsByTagNameNS(TEI_NS, "change")

    // iterate through all contributors and add them to the contributors by type
    // if no type is given, assume their contributor type code is "edt" (editor)
    const defaultContributorTypeCode = "edt"
    const contributorsByType = {}
    for (const contribType of Object.keys(CONTRIBUTOR_TYPES)) {
      contributorsByType[contribType] = new Set()
    }

    for (const record of respStmts) {
      const resp = record.getElementsByTagNameNS(TEI_NS, "resp")
      const contribType = (resp.length > 0) ? resp[0].getAttribute("key") : defaultContributorTypeCode
      // in each respStmt, there will be an element *not* called resp (it may be name or orgName) that has a @ref
      // attribute with the contributor URI
      const ref = record.querySelectorAll("*[ref]")[0].getAttribute("ref")
      contributorsByType[contribType].add(ref)
    }
    for (const record of changes) {
      const contribType = defaultContributorTypeCode
      const who = record.getAttribute("who")
      contributorsByType[contribType].add(who)
    }
    return contributorsByType
  }

  /** Get a list of source URIs that are applicable to a given document
   *
   * @param xml Node A node within the document
   * @return Array[Object] list of source relative URIs and the relevant scope, or null if no sources found
   */
  static contextSources(xml) {
    const docNode = (xml.nodeType === Node.DOCUMENT_NODE) ? xml : xml.ownerDocument
    const nsResolver = docNode.createNSResolver( docNode.documentElement)
    const sourceIterator = docNode.evaluate("//tei:sourceDesc/tei:bibl", docNode,
      nsResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null)
    let sources = []
    for (let i = 0; i < sourceIterator.snapshotLength; i++) {
      const bibl = sourceIterator.snapshotItem(i)
      const src = docNode.evaluate("tei:ptr[@type='bibl']/@target", bibl, nsResolver, XPathResult.STRING_TYPE).stringValue.split("/")
      const source = src[src.length - 1]
      const biblScope = docNode.evaluate("tei:biblScope", bibl, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
      const scopeFrom = (biblScope === null) ? null : biblScope.getAttribute("from")
      const scopeTo = (biblScope === null) ? null : biblScope.getAttribute("to")
      const scopeUnit = (biblScope === null) ? null : biblScope.getAttribute("unit")
      sources.push(new ContextSourceInfo(source, scopeUnit, scopeFrom, scopeTo))
    }
    return sources.length > 0 ? sources: null
  }

}

/** store an update to document metadata
 *
 */
export class MetadataUpdate {
  constructor(update=null, nextMetadata=null) {
    this.update = update
    this.nextMetadata = nextMetadata
  }
}

/** Given a list of MetadataUpdate, find out what types of updates are present.
 * Assume that updates are given in order of precedence; if no update of that type has already been done, we take the
 * current update
 */
export class MetadataUpdateList {
  constructor(updates = []) {
    this.license = null
    this.language = null
    this.contributors = null
    this.sources = null
    updates.forEach( (mdUpdate) => {
      if (mdUpdate.update) {
        this.license = (!this.license && mdUpdate.update.license) ? mdUpdate.update : this.license
        this.language = (!this.language && mdUpdate.update.lang) ? mdUpdate.update : this.language
        this.contributors = (!this.contributors && mdUpdate.update.contributors) ? mdUpdate.update : this.contributors
        this.sources = (!this.sources && mdUpdate.update.sources) ? mdUpdate.update : this.sources
      }
    })

    this.hasUpdates = updates.some( (upd) => { return upd.update })
  }
}
