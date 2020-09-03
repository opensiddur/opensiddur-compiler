/* FetchCache
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {ApiError} from "./BaseApi"

const FORMAT_XML = "xml"
const FORMAT_HTML = "html"
const ACCEPTED_FORMATS = [FORMAT_XML, FORMAT_HTML]

const MIMETYPE_XML = "application/xml"
const MIMETYPE_HTML = "text/html"

// the CACHE stores the returned data (response text)
// it is keyed on [[url, format]]
let CACHE = {}


const PROGRESS_DONE = 0
const PROGRESS_WAIT = 1
const PROGRESS_ERROR = -1

// IN_PROGRESS keeps the CACHE state:
// it is keyed on [[url, format]]
let IN_PROGRESS = {}

const TIMEOUT_MS = 500

export function clearCache() {
  CACHE = {}
  IN_PROGRESS = {}
}

export async function fetchCache(url, format) {
  const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (IN_PROGRESS[[url, format]] === PROGRESS_WAIT) {
    console.log("fetchCache: Timing out waiting for", url, format)
  }
  while (IN_PROGRESS[[url, format]] === PROGRESS_WAIT) {
    await timeout(TIMEOUT_MS)
  }

  if (IN_PROGRESS[[url, format]] === PROGRESS_DONE) {
    console.log("fetchCache: Returning from cache", url, format)
    return CACHE[[url, format]]
  }
  else if (IN_PROGRESS[[url, format]] === PROGRESS_ERROR) {
    console.log("fetchCache: Throwing error from cache", url, format)
    throw CACHE[[url, format]]
  }
  else {
    let response
    let responseText

    try {
      console.log("fetchCache: Loading from network", url, format)
      IN_PROGRESS[[url, format]] = PROGRESS_WAIT
      const accept = (format === FORMAT_XML) ? MIMETYPE_XML : MIMETYPE_HTML

      response = await fetch(url, {
        headers: {
          "Accept": accept
        }
      })
      responseText = await response.text()
    } catch (error) {
      const exception = new ApiError(false, "fetch failed", error.message)
      CACHE[[url, format]] = exception
      IN_PROGRESS[[url, format]] = PROGRESS_ERROR
      throw exception
    }

    if (response.ok) {
      CACHE[[url, format]] = responseText
      IN_PROGRESS[[url, format]] = PROGRESS_DONE
      return responseText
    }
    else {
      const status = response.status
      // this is an API error
      const exception = new ApiError(false, status, responseText)
      CACHE[[url, format]] = exception
      IN_PROGRESS[[url, format]] = PROGRESS_ERROR
      throw exception
    }
  }
}