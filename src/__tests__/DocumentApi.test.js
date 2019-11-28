/* DocumentApi.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import DocumentApi from "../DocumentApi"
import {ApiError} from "../BaseApi"

describe("document API", () => {
  const documentApi = new DocumentApi()

  const mockDocumentName = "mockument"
  const parsableXml = "<testXml>Test XML!</testXml>"
  const parsableHtml = "<html><head><title>Title</title></head><body>body</body></html>"
  const unparsableXml = "<testXml></closeADifferentTag>"

  let windowSpy

  beforeEach(() => {
    windowSpy = jest.spyOn(global, 'window', 'get')

    windowSpy.mockImplementation(() => ({
      location: {
        origin: 'https://test.example.com'
      }
    }))
  })

  afterEach(() => {
    windowSpy.mockRestore()
  })


  it("should fetch and parse an original document from .../combined", async () => {
    const spy = jest.spyOn(documentApi, 'fetchText').mockResolvedValue(parsableXml)

    const result = await documentApi.get(mockDocumentName, "xml", "original")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/original/${mockDocumentName}/combined`))
    expect(result.documentElement.tagName).toBe("testXml")

    spy.mockRestore()
  })

  it("should fetch and parse a document from any other API (say, html)", async () => {
    const spy = jest.spyOn(documentApi, 'fetchText').mockResolvedValue(parsableHtml)

    const result = await documentApi.get(mockDocumentName, "xml", "htmlwazoo")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/htmlwazoo/${mockDocumentName}`))
    expect(result.documentElement.tagName).toBe("html")

    spy.mockRestore()
  })

  it("should fail on unparsable XML", async () => {
    const spy = jest.spyOn(documentApi, 'fetchText').mockResolvedValue(unparsableXml)

    await expect(documentApi.get(mockDocumentName, "xml", "original")).
      rejects.toMatchObject(new ApiError(false, "parse failed", expect.any(String)))

    spy.mockRestore()

  })
})