/* SourceApi
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import BaseApi, {ApiError} from "./BaseApi"

export default class SourceApi extends BaseApi {
  /** Retrieve a source
   * @param source string The source name, URL encoded
   * @return A promise to a document node containing the source text
   */
  async get(userName) {
    const url = new URL(`/api/sources/${source}`, window.location.origin)

    const textDoc = await this.fetchText(url, "xml")

    const markup = new DOMParser().parseFromString(textDoc, "application/xml")
    const error = markup.querySelector("parsererror")

    if (error === null) {
      return markup
    }
    else {
      throw new ApiError(false, "parse failed", error.textContent)
    }
  }
}