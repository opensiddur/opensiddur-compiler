/* FetchCache.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {ApiError} from "../BaseApi"
import {clearCache, fetchCache} from "../FetchCache"

describe("fetchCache", () => {

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

  it("calls fetch with an XML Accept header when called with format=xml and returns the content as text;" +
    " the second call is cached", async () => {
    fetch.mockResponseOnce(mockReturnXmlMinimal)

    const result = await fetchCache(mockUrl, "xml")
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toBe(mockUrl)
    expect(fetch.mock.calls[0][1]).toMatchObject({headers: { Accept: "application/xml" }})
    expect(result).toBe(mockReturnXmlMinimal)

    global.fetch.mockClear()
    const result2 = await fetchCache(mockUrl, "xml")
    expect(global.fetch).toHaveBeenCalledTimes(0)
    expect(result2).toBe(mockReturnXmlMinimal)
  })

  it("fails with a fetch error on network error twice", async () => {
    fetch.mockRejectOnce(mockNetworkError)

    await expect(fetchCache(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "fetch failed", "network error"))
    await expect(fetchCache(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "fetch failed", "network error"))
  })


  it("fails with an API error when the API returns a failed response twice", async () => {
    fetch.mockResponseOnce("Bad request", { status: 400 })
    await expect(fetchCache(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "400", "Bad request"))
    await expect(fetchCache(mockUrl, "xml")).rejects.toMatchObject(new ApiError(false, "400", "Bad request"))
  })

})