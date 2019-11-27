/* DocumentApi: retrieval of documents
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import BaseApi, {ApiError} from "./DiscoveryApi"

export default class DocumentApi extends BaseApi {

  /** Retrieve a document
   * @param documentName The document name, URL encoded
   * @param format "html" or "xml"
   * @param api default to "original"
   * @return A promise to the document
   */
  async get(documentName, format, api) {
    const thisApi = api || "original"
    const apiSuffix = (thisApi === "original") ? "/combined" : ""
    const url = new URL(`/api/data/${thisApi}/${documentName}${apiSuffix}`, window.location.origin)
    const parseFormat = (format === "xml") ? "application/xml" : "text/html"

    const textDoc = await this.fetchText(url, format)
    try {
      return new DOMParser().parseFromString(textDoc, parseFormat)
    }
    catch (error) {
      throw new ApiError(false, "parse error", error.message)
    }
  }
}