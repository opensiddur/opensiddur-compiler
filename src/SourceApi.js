/* SourceApi
 * Copyright 2019-2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import BaseApi, {ApiError} from "./BaseApi"
import {TEI_NS} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"

export class SourceReader {
  /** Generate a title structure from title markup */
  static readTitle(title) {
    const type = (title.hasAttribute("type")) ? title.getAttribute("type") : "main"
    const text = title.textContent
    const lang = TransformerMetadata.contextLanguage(title)

    return {
      type: type,
      text: text,
      lang: lang
    }
  }

  /** Generate a name structure from name markup */
  static readName(name) {
    return { name: name.textContent }
  }

  /** Generate a responsibility record from tei:respStmt */
  static readResponsibility(resp) {
    const respKey = resp.getElementsByTagNameNS(TEI_NS, "resp").item(0).getAttribute("key")
    const name = resp.getElementsByTagNameNS(TEI_NS, "name").item(0)
    return {
      name: SourceReader.readName(name).name,
      resp: respKey
    }
  }

  /** parse a biblScope */
  static readScope(biblScope) {
    const scopeFrom = (biblScope === null) ? null : biblScope.getAttribute("from")
    const scopeTo = (biblScope === null) ? null : biblScope.getAttribute("to")
    const scopeUnit = (biblScope === null) ? null : biblScope.getAttribute("unit")
    return {
      from: scopeFrom,
      to: scopeTo,
      unit: scopeUnit
    }
  }

  /** parse a source identifier */
  static readIdno(idno) {
    const id = idno.textContent
    const type = idno.getAttribute("type")
    return {
      id: id,
      type: type
    }
  }
}

export class SourceLevel {

  /** Hold common information kept at all levels (analytic, monogr, series */
  constructor(markup) {
    const authors = markup.getElementsByTagNameNS(TEI_NS, "author")
    const editors = markup.getElementsByTagNameNS(TEI_NS, "editor")
    const responsibilities = markup.getElementsByTagNameNS(TEI_NS, "respStmt")
    const titles = markup.getElementsByTagNameNS(TEI_NS, "title")

    return {
      titles: [...titles].map( (title) => {
        return SourceReader.readTitle(title)
      }, this),
      authors: [...authors].map((author) => {
        return SourceReader.readName(author)
      }, this),
      editors: [...editors].map( (editor) => {
        return SourceReader.readName(editor)
      }, this),
      responsibilities: [...responsibilities].map( (resp) => {
        return SourceReader.readResponsibility(resp)
      }, this)
    }
  }
}

export class Source {

  /** Parse a bibl record into a structure similar to what would be generated by the app's "Source" tab
   *
   * @param markup DocumentNode The XML markup
   * @return Source
   */
  constructor(markup) {
    const docElement = markup.ownerDocument == null ? markup.documentElement : markup.ownerDocument.documentElement
    const nsResolver = markup.createNSResolver(docElement)

    const analytic = markup.getElementsByTagNameNS(TEI_NS, "analytic").item(0)
    const monogr = markup.getElementsByTagNameNS(TEI_NS, "monogr").item(0)
    const series = markup.getElementsByTagNameNS(TEI_NS, "series").item(0)

    const edition = markup.getElementsByTagNameNS(TEI_NS, "edition").item(0)
    const scope = markup.getElementsByTagNameNS(TEI_NS, "biblScope").item(0)
    const imprint = markup.getElementsByTagNameNS(TEI_NS, "imprint").item(0)

    const publisher = imprint.getElementsByTagNameNS(TEI_NS, "publisher").item(0)
    const publicationPlace = imprint.getElementsByTagNameNS(TEI_NS, "pubPlace").item(0)
    const publicationDate = markup.evaluate("tei:date", imprint, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

    const distributor = imprint.getElementsByTagNameNS(TEI_NS, "distributor").item(0)
    const distributorWeb = distributor.getElementsByTagNameNS(TEI_NS, "ref").item(0)
    const distributorName = distributor.getElementsByTagNameNS(TEI_NS, "name").item(0) || distributorWeb
    const distributorAccessDate = distributor.getElementsByTagNameNS(TEI_NS, "date").item(0) // must be type ='access'

    const note = markup.evaluate("//tei:note[not(@type)]", markup, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    const copyright = markup.evaluate("//tei:note[@type='copyright']", markup, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    const source = markup.getElementsByTagNameNS(TEI_NS, "idno").item(0)

    return {
      analytic: (analytic === null) ? null : new SourceLevel(analytic),
      monogr: (monogr === null) ? null : new SourceLevel(monogr),
      series: (series === null) ? null : new SourceLevel(series),
      edition: (edition === null) ? null : edition.textContent,
      scope: (scope === null) ? null : SourceReader.readScope(scope),
      publisher: (publisher === null) ? null : publisher.textContent,
      publicationPlace: (publicationPlace === null) ? null : publicationPlace.textContent,
      publicationDate: (publicationDate === null) ? null: publicationDate.textContent,
      distributor: (distributorName === null) ? null : distributorName.textContent,
      distributorWeb: (distributorWeb === null) ? null : distributorWeb.getAttribute("target"),
      distributorAccessDate: (distributorAccessDate === null) ? null : distributorAccessDate.textContent,
      note: (note === null) ? null : note.textContent,
      copyright: (copyright === null) ? null: copyright.textContent,
      source: (source === null) ? null : SourceReader.readIdno(source)
    }
  }
}

export default class SourceApi extends BaseApi {
  /** Retrieve a source
   * @param source string The source name, URL encoded
   * @return A promise to a Source containing the source information
   */
  async get(source) {
    const url = new URL(`/api/data/sources/${source}`, window.location.origin)

    const textDoc = await this.fetchText(url, "xml")

    const markup = new DOMParser().parseFromString(textDoc, "application/xml")
    const error = markup.querySelector("parsererror")

    if (error === null) {
      return new Source(markup)
    }
    else {
      throw new ApiError(false, "parse failed", error.textContent)
    }
  }
}