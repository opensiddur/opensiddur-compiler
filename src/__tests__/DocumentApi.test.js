/* DocumentApi.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import DocumentApi from "../DocumentApi"
import BaseApi, {ApiError} from "../BaseApi"
import {text2xml} from "../TestUtils"
import Transformer from "../Transformer"

describe("document API", () => {
  const mockDocumentName = "mockument"
  const parsableXml = "<testXml>Test XML!</testXml>"
  const parsableHtml = "<html><head><title>Title</title></head><body>body</body></html>"
  const unparsableXml = "<testXml></closeADifferentTag>"

  const mockFetchText = jest.fn()

  let realFetchText
  let windowSpy

  beforeAll(() => {
    realFetchText = BaseApi.fetchText
    BaseApi.fetchText = mockFetchText
  })

  beforeEach(() => {
    windowSpy = jest.spyOn(global, 'window', 'get')

    windowSpy.mockImplementation(() => ({
      location: {
        origin: 'https://test.example.com'
      }
    }))

    mockFetchText.mockReset()
  })

  afterEach(() => {
    windowSpy.mockRestore()
  })

  afterAll( () => {
    BaseApi.fetchText = realFetchText
  })


  it("should fetch and parse an original document from .../combined", async () => {
    const spy = mockFetchText.mockResolvedValue(parsableXml)

    const result = await DocumentApi.get(mockDocumentName, "xml", "original")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/original/${mockDocumentName}/combined`))
    expect(result.documentElement.tagName).toBe("testXml")

    spy.mockRestore()
  })

  it("should fetch and parse an original document from a custom suffix", async () => {
    const spy = mockFetchText.mockResolvedValue(parsableXml)

    const result = await DocumentApi.get(mockDocumentName, "xml", "original", "suffix")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/original/${mockDocumentName}/suffix`))
    expect(result.documentElement.tagName).toBe("testXml")

    spy.mockRestore()
  })

  it("should fetch and parse a document from any other API (say, html)", async () => {
    const spy = mockFetchText.mockResolvedValue(parsableHtml)

    const result = await DocumentApi.get(mockDocumentName, "xml", "htmlwazoo")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/htmlwazoo/${mockDocumentName}`))
    expect(result.documentElement.tagName).toBe("html")

    spy.mockRestore()
  })

  it("should fail on unparsable XML", async () => {
    const spy = mockFetchText.mockResolvedValue(unparsableXml)

    await expect(DocumentApi.get(mockDocumentName, "xml", "original")).
      rejects.toMatchObject(new ApiError(false, "parse failed", expect.any(String)))

    spy.mockRestore()

  })
})

// jsdom / jest document implementation does not support createRange yet, but there seems to be some hope that it
// will happen soon (see https://github.com/jsdom/jsdom/pull/2719 ). For now, we'll ignore the range tests
describe.skip("DocumentApi.getRange", () => {
  it("should extract a range from siblings", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:anchor jf:id="part0"/>
                    <tei:seg>One</tei:seg>
                    <tei:anchor jf:id="part1"/>
                    <tei:seg>Two</tei:seg>
                    <tei:seg>Three</tei:seg>
                    <tei:anchor jf:id="part2"/>
                    <tei:seg>Four</tei:seg>
                    <tei:anchor jf:id="part3"/>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = DocumentApi.getRange(xmlDocument, "range(part1,part2)")

    expect(result.childElementCount).toBe(4)
    const children = result.children
    expect(result.children[0].tagName).toBe("tei:anchor")
    expect(result.children[0].getAttribute("jf:id")).toBe("part1")

    expect(result.children[1].tagName).toBe("tei:seg")
    expect(result.children[1].textContent).toBe("Two")

    expect(result.children[2].tagName).toBe("tei:seg")
    expect(result.children[2].textContent).toBe("Three")

    expect(result.children[3].tagName).toBe("tei:anchor")
    expect(result.children[3].getAttribute("jf:id")).toBe("part2")
  })

  it("should extract a range from across hierarchies", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:anchor jf:id="part0"/>
                    <tei:div>
                      <tei:p>
                        <tei:seg jf:id="seg1">One</tei:seg>
                        <tei:anchor jf:id="part1"/>
                        <tei:seg jf:id="seg2">Two</tei:seg>
                      </tei:p>
                      <tei:seg jf:id="seg3">Three</tei:seg>
                      <tei:anchor jf:id="part2"/>
                      <tei:seg jf:id="seg4">Four</tei:seg>
                      <tei:anchor jf:id="part3"/>
                    </tei:div>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = DocumentApi.getRange(xmlDocument, "range(part1,part2)")

    // test that all of part1, part2, Two and Three exist in the range
    expect(result.querySelector("*[jf:id=part1]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=part2]")).toBeInTheDocument()

    expect(result.querySelector("*[jf:id=seg1]")).not.toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg2]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg3]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg4]")).not.toBeInTheDocument()
  })
})

describe("DocumentApi.getId", () => {
  it("should extract a range from siblings", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened jf:id="stream">
                    <tei:seg>Test</tei:seg>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = DocumentApi.getId(xmlDocument, "stream")

    expect(result.childElementCount).toBe(1)
    const children = result.children
    expect(result.tagName).toBe("jf:unflattened")
    expect(result.getAttribute("jf:id")).toBe("stream")

    expect(result.children[0].tagName).toBe("tei:seg")
    expect(result.children[0].textContent).toBe("Test")
  })

  it("should extract a node by xml:id", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:seg xml:id="tst">Test</tei:seg>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = DocumentApi.getId(xmlDocument, "tst")

    expect(result.tagName).toBe("tei:seg")
    expect(result.getAttribute("xml:id")).toBe("tst")
  })
})

describe("DocumentApi.getFragment", () => {
  const xmlDocument = text2xml("<test/>")
  //const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
  const mockGetId = jest.fn()
  const mockGetRange = jest.fn()
  const realGetId = DocumentApi.getId
  const realGetRange = DocumentApi.getRange

  beforeAll( () => {
    DocumentApi.getId = mockGetId
    DocumentApi.getRange = mockGetRange
  })

  afterAll( () => {
    DocumentApi.getId = realGetId
    DocumentApi.getRange = realGetRange
  })

  const mockFragment = text2xml("<div>id</div>")
  const mockRange = [text2xml("<div>range</div>")]

  beforeEach( () => {
    mockGetId.mockReturnValueOnce(mockFragment)
    mockGetRange.mockReturnValueOnce(mockRange)
  })

  afterEach( () => {
    mockGetId.mockReset()
    mockGetRange.mockReset()
  })

  it("should return a single fragment when given one id", () => {
    const result = DocumentApi.getFragment(xmlDocument,"fragment")
    expect(mockGetId).toHaveBeenCalledTimes(1)
    expect(mockGetId.mock.calls[0][1]).toBe("fragment")
    expect(result).toStrictEqual([mockFragment])
  })

  it("should return a range when given a range", () => {
    const result = DocumentApi.getFragment(xmlDocument, "range(left,right)")
    expect(mockGetRange).toHaveBeenCalledTimes(1)
    expect(mockGetRange.mock.calls[0][1]).toBe("range(left,right)")
    expect(result).toBe(mockRange)
  })
})
