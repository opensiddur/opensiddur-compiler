/* DocumentApi: retrieval of documents
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import BaseApi, {ApiError} from "./BaseApi"

export default class DocumentApi extends BaseApi {

  /** Retrieve a document
   * @param documentName The document name, URL encoded
   * @param format "html" or "xml"
   * @param api default to "original"
   * @return A promise to the document
   */
  async get(documentName, format="xml", api="original") {
    const apiSuffix = (api === "original") ? "/combined" : ""
    const url = new URL(`/api/data/${api}/${documentName}${apiSuffix}`, window.location.origin)
    const parseFormat = (format === "xml") ? "application/xml" : "text/html"

    const textDoc = await this.fetchText(url, format)

    const markup = new DOMParser().parseFromString(textDoc, parseFormat)
    const error = markup.querySelector("parsererror")

    if (error === null) {
      return markup
    }
    else {
      throw new ApiError(false, "parse failed", error.textContent)
    }
  }
}