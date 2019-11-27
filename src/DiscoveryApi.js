/* Discovery API class. An Open Siddur discovery API is one that searches or lists elements.

  Discovery APIs return HTML. The head will contain Open Search information:
  <meta name="startIndex" content="1" />
  <meta name="itemsPerPage" content="100" />
  <meta name="totalResults" content="1194" />

  The body will contain results:
  <ul class="results">
    <li class="result">
      <a class="document"
        href="[url]">[document title]</a>
      <a class="alt" property="[some property, like 'access']" href="[url for that property]">[name of property]</a>
      ...
      <ol class="contexts">
        <li class="context"><span class="previous">...</span><span class="match"></span><span class="following"></span></li>
        ...
      </ol>
  </ul>

 The class instance will keep track of current paging and yield

 Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 Licensed under the GNU Lesser General Public License, version 3 or later
 */

const DEFAULT_ITEMS_PER_PAGE = 100

export class ApiError {
  constructor(success, status, error) {
    this.success = success
    this.status = status.toString()
    this.error = error
  }
}

export class BaseApi {
  async fetchText(url, format) {
    let response
    let responseText

    const accept = (format === "xml") ? "application/xml" : "text/html"

    try {
      response = await fetch(url, {
        headers: {
          "Accept": accept
        }
      })
      responseText = await response.text()
    }
    catch (error) {
      throw new ApiError(false, "", error.message)
    }

    if (response.ok) {
      try {
        return responseText
      }
      catch (error) {
        throw new ApiError(false, "parse failed", error.message)
      }
    }
    else {
      const status = response.status
      // this is an API error
      throw new ApiError(false, status, responseText)
    }
  }
}

export default class DiscoveryApi extends BaseApi {

  /* parse an HTML response object */
  parseDiscoveryHtml(responseText) {
    const dom = new DOMParser().parseFromString(responseText, "text/html")
    const startIndex = parseInt(dom.querySelector("meta[name=startIndex]").content)
    const itemsPerPage = parseInt(dom.querySelector("meta[name=itemsPerPage]").content)
    const totalResults = parseInt(dom.querySelector("meta[name=totalResults]").content)
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalResults)
    let items = []
    for (let result of dom.querySelectorAll("li.result")) {
      const document = result.querySelector("a.document")
      const title = document.textContent
      const url = document.href

      let item = {
        title: title,
        url: url,
        context: []
      }

      for (let alt of result.querySelectorAll("a.alt")) {
        const property = alt.attributes.property.value
        const link = alt.href

        item[property] = link
      }

      for (let context of result.querySelectorAll("ol.contexts li.context")) {
        const content = context.textContent
        item.context.push(content)
      }

      items.push(item)
    }

    return {
      success: true,
      startIndex: startIndex,
      itemsPerPage: itemsPerPage,
      totalResults: totalResults,
      endIndex: endIndex,
      items: items
    }
  }

  /* Low level list API function.
   * Returns a promise that either contains a JSON representation of the listed items
   * or contains an error, represented as JSON.
   */
  async list(apiName, queryString="", start=1, itemsPerPage=DEFAULT_ITEMS_PER_PAGE) {
    const url = new URL(`/api/data/${apiName}`, window.location.origin)
    const params = {
      q: queryString,
      start: String(start),
      "max-results": String(itemsPerPage)
    }
    Object.keys(params).forEach(key => {
      if (params[key] !== "") url.searchParams.append(key, params[key])
    })
    let response
    const responseText = await this.fetchText(url)
    try {
      return this.parseDiscoveryHtml(responseText)
    }
    catch (error) {
      throw new ApiError(false, "parse failed", error.message)
    }
  }
}