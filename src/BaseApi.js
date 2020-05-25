/* Base class with boilerplate for all API calling classes
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

const FORMAT_XML = "xml"
const FORMAT_HTML = "html"
const ACCEPTED_FORMATS = [FORMAT_XML, FORMAT_HTML]

const MIMETYPE_XML = "application/xml"
const MIMETYPE_HTML = "text/html"

export class ApiError {
  constructor(success, status, error) {
    this.success = success
    this.status = status.toString()
    this.error = error
  }
}

export default class BaseApi {
  static async fetchText(url, format) {
    console.assert(ACCEPTED_FORMATS.includes(format), `format '${format}' must be in ACCEPTED_FORMATS`)

    let response
    let responseText

    const accept = (format === FORMAT_XML) ? MIMETYPE_XML : MIMETYPE_HTML

    try {
      response = await fetch(url, {
        headers: {
          "Accept": accept
        }
      })
      responseText = await response.text()
    }
    catch (error) {
      throw new ApiError(false, "fetch failed", error.message)
    }

    if (response.ok) {
      return responseText
    }
    else {
      const status = response.status
      // this is an API error
      throw new ApiError(false, status, responseText)
    }
  }
}
