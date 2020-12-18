/* BaseApi.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import BaseApi, {ApiError} from "../BaseApi"
import {clearCache} from "../FetchCache"

describe("fetching data", () => {

  beforeEach(() => {
    clearCache()
    fetch.resetMocks();
  })

  afterEach(() => {
    global.fetch.mockClear()
  })

  const mockUrl = "http://test.example.com"

  const mockReturnXmlMinimal = "<someXml/>"

  const mockReturnHtmlMinimal = "<html></html>"

  const mockApiError = ["Bad request", { status: 400 }]

  const mockNetworkError = new TypeError("network error")

  it("calls fetch with an XML Accept header when called with format=xml and returns the content as text", async () => {
    fetch.mockResponseOnce(mockReturnXmlMinimal)

    const result = await BaseApi.fetchText(mockUrl, "xml")
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(mockUrl)
    expect(fetch.mock.calls[0][1]).toMatchObject({headers: { Accept: "application/xml" }})
    expect(result).toBe(mockReturnXmlMinimal)
  })

  it("calls fetch with an HTML Accept header when called with format=html and returns the content as text", async () => {
    fetch.mockResponseOnce(mockReturnHtmlMinimal)

    const result = await BaseApi.fetchText(mockUrl, "html")
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(mockUrl)
    expect(fetch.mock.calls[0][1]).toMatchObject({headers: { Accept: "text/html" }})
    expect(result).toBe(mockReturnHtmlMinimal)
  })

  it("fails with a fetch error on network error", async () => {
    fetch.mockRejectOnce(mockNetworkError)

    await expect(BaseApi.fetchText(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "fetch failed", "network error"))
  })


  it("fails with an API error when the API returns a failed response", async () => {
    fetch.mockResponseOnce("Bad request", { status: 400 })
    await expect(BaseApi.fetchText(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "400", "Bad request"))
  })

})