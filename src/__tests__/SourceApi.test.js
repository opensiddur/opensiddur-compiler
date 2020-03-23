/* SourceApi.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import "@testing-library/react"
import SourceApi, {Source, SourceLevel, SourceReader} from "../SourceApi"
import {TEI_NS} from "../Transformer"
import DocumentApi from "../DocumentApi"
import {ApiError} from "../BaseApi"

const text2xml = (txt) => {
  return new DOMParser().parseFromString(txt, "application/xml")
}

// this is used in 2 tests
const fullSource = `<tei:biblStruct xmlns:tei="http://www.tei-c.org/ns/1.0" xml:lang="en">
        <tei:analytic>
            <tei:title type="main">Analytic title</tei:title>
            <tei:title xml:lang="he-Latn" type="alt">Analytic Transliteration</tei:title>
            <tei:title type="sub">Analytic Subtitle</tei:title>
            <tei:title type="sub-alt" xml:lang="he-Latn">Analytic Subtitle transliterated</tei:title>
            <tei:author>Analytic Author</tei:author>
            <tei:editor>Analytic Editor</tei:editor>
            <tei:respStmt>
                <tei:resp key="trl">Transliterator</tei:resp>
                <tei:name>Analytic Trans Literator</tei:name>
            </tei:respStmt>
        </tei:analytic>
        <tei:monogr>
            <tei:title>Monograph Main title</tei:title>
            <tei:author>Monogr Author One</tei:author>
            <tei:author>Monogr Author Two</tei:author>
            <tei:edition>Second</tei:edition>
            <tei:biblScope unit="page" from="10" to="20"/>
            <tei:imprint>
                <tei:publisher>Publisher</tei:publisher>
                <tei:pubPlace>Some, Where</tei:pubPlace>
                <tei:date>2000</tei:date>
                <tei:distributor>
                    <tei:name>Distributor</tei:name>
                    <tei:ref type="url" target="http://books.somewhere.com">Somewhere Books</tei:ref>
                    <tei:date type="access">2001-03-14</tei:date>
                </tei:distributor>
            </tei:imprint>
            <tei:note>Just a note</tei:note>
            <tei:note type="copyright"><tei:ref target="license">Copyright License</tei:ref></tei:note>
            <tei:idno type="archive.org">ABook</tei:idno>
        </tei:monogr>
        <tei:series>
            <tei:title>Series Main title</tei:title>
            <tei:editor>Series Editor One</tei:editor>
            <tei:editor>Series Editor Two</tei:editor>
        </tei:series>
    </tei:biblStruct>`

describe('SourceReader', () => {
  test("readTitle parses a title", () => {
    const title = text2xml(
      `<tei:title xmlns:tei="http://www.tei-c.org/ns/1.0" type="alt-sub" xml:lang="en">Test title</tei:title>`).documentElement
    const result = SourceReader.readTitle(title)
    expect(result).toMatchObject({
      type: "alt-sub",
      lang: "en",
      text: "Test title"
    })
  })

  test("readTitle parses a title with default type", () => {
    const title = text2xml(
      `<tei:title xmlns:tei="http://www.tei-c.org/ns/1.0" xml:lang="en">Test title</tei:title>`).documentElement
    const result = SourceReader.readTitle(title)
    expect(result).toMatchObject({
      type: "main",
      lang: "en",
      text: "Test title"
    })
  })

  test("readName parses a name", () => {
    const name = text2xml(
      `<tei:name xmlns:tei="http://www.tei-c.org/ns/1.0">Test Name</tei:name>`).documentElement
    const result = SourceReader.readName(name)
    expect(result).toMatchObject({
      name: "Test Name"
    })
  })

  test("readName parses a name that is broken up into first/link/last", () => {
    const name = text2xml(
      `<tei:name xmlns:tei="http://www.tei-c.org/ns/1.0"><tei:forename>Test</tei:forename> <tei:nameLink>de</tei:nameLink><tei:surname>Name</tei:surname></tei:name>`).documentElement
    const result = SourceReader.readName(name)
    expect(result).toMatchObject({
      name: "Test deName"
    })
  })

  test("readResponsibility parses a responsibility", () => {
    const rsp = text2xml(
      `<tei:respStmt xmlns:tei="http://www.tei-c.org/ns/1.0">
                <tei:resp key="aut">Authored by</tei:resp>
                <tei:name>Test Name</tei:name>
            </tei:respStmt>`).documentElement
    const result = SourceReader.readResponsibility(rsp)
    expect(result).toMatchObject({
      name: "Test Name",
      resp: "aut"
    })
  })

  test("readScope parses a biblScope", () => {
    const scp = text2xml(
      `<tei:biblScope xmlns:tei="http://www.tei-c.org/ns/1.0" from="1" to="2" unit="page"/>`).documentElement
    const result = SourceReader.readScope(scp)
    expect(result).toMatchObject({
      from: "1",
      to: "2",
      unit: "page"
    })
  })

  test("readIdno parses an idno", () => {
    const idno = text2xml(
      `<tei:idno xmlns:tei="http://www.tei-c.org/ns/1.0" type="archive.org">x1</tei:idno>`).documentElement
    const result = SourceReader.readIdno(idno)
    expect(result).toMatchObject({
      type: "archive.org",
      id: "x1"
    })

  })
});

describe("SourceLevel", () => {
  it("handles the case where all data is present", () => {
    const data = text2xml(`<tei:biblStruct xmlns:tei="http://www.tei-c.org/ns/1.0" xml:lang="en">
        <tei:analytic>
            <tei:title type="main">Main title</tei:title>
            <tei:title xml:lang="he-Latn" type="alt">Transliteration</tei:title>
            <tei:title type="sub">Subtitle</tei:title>
            <tei:title type="sub-alt" xml:lang="he-Latn">Subtitle transliterated</tei:title>
            <tei:author>Author 1</tei:author>
            <tei:author>Author 2</tei:author>
            <tei:editor>Editor 1</tei:editor>
            <tei:editor>Editor 2</tei:editor>
            <tei:respStmt>
                <tei:resp key="trl">Transliterator</tei:resp>
                <tei:name>Trans Literator</tei:name>
            </tei:respStmt>
        </tei:analytic>
    </tei:biblStruct>`)
    const analyticElement = data.getElementsByTagNameNS(TEI_NS, "analytic").item(0)
    const sourceLevel = new SourceLevel(analyticElement)
    expect(sourceLevel).toMatchObject(
      {
        titles: [
          {
            type: "main",
            lang: "en",
            text: "Main title"
          },
          {
            type: "alt",
            lang: "he-Latn",
            text: "Transliteration"
          },
          {
            type: "sub",
            lang: "en",
            text: "Subtitle"
          },
          {
            type: "sub-alt",
            lang: "he-Latn",
            text: "Subtitle transliterated"
          }
        ],
        authors: [
          {name: "Author 1"},
          {name: "Author 2"}
        ],
        editors: [
          {name: "Editor 1"},
          {name: "Editor 2"}
        ],
        responsibilities: [
          {
            resp: "trl",
            name: "Trans Literator"
          }
        ]
      }
    )
  })

  it("handles missing data by returning empty arrays", () => {
    const data = text2xml(`<tei:biblStruct xmlns:tei="http://www.tei-c.org/ns/1.0" xml:lang="en">
        <tei:analytic>
            <tei:title type="main">Main title</tei:title>
            <tei:title xml:lang="he-Latn" type="alt">Transliteration</tei:title>
            <tei:author>Author 1</tei:author>
            <tei:author>Author 2</tei:author>
        </tei:analytic>
    </tei:biblStruct>`)
    const analyticElement = data.getElementsByTagNameNS(TEI_NS, "analytic").item(0)
    const sourceLevel = new SourceLevel(analyticElement)
    expect(sourceLevel).toMatchObject(
      {
        titles: [
          {
            type: "main",
            lang: "en",
            text: "Main title"
          },
          {
            type: "alt",
            lang: "he-Latn",
            text: "Transliteration"
          }
        ],
        authors: [
          {name: "Author 1"},
          {name: "Author 2"}
        ],
        editors: [],
        responsibilities: []
      }
    )
  })
})

describe("Source", () => {
  it("records a full biblStruct's data", () => {
    const data = text2xml(fullSource)
    const result = new Source(data)
    expect(result).toMatchObject({
      analytic: {
        titles: [
          {
            type: "main",
            lang: "en",
            text: "Analytic title"
          },
          {
            type: "alt",
            lang: "he-Latn",
            text: "Analytic Transliteration"
          },
          {
            type: "sub",
            lang: "en",
            text: "Analytic Subtitle"
          },
          {
            type: "sub-alt",
            lang: "he-Latn",
            text: "Analytic Subtitle transliterated"
          }
        ],
        authors: [
          {name: "Analytic Author"}
        ],
        editors: [
          {name: "Analytic Editor"}
        ],
        responsibilities: [
          {
            resp: "trl",
            name: "Analytic Trans Literator"
          }
        ]
      },
      monogr : {
        titles: [
          {
            type: "main",
            lang: "en",
            text: "Monograph Main title"
          }
        ],
        authors: [
          { name: "Monogr Author One" },
          { name: "Monogr Author Two" }
        ],
        editors: [],
        responsibilities: []
      },
      series: {
        titles: [
          {
            type: "main",
            lang: "en",
            text: "Series Main title"
          }
        ],
        authors: [],
        editors: [
          { name: "Series Editor One"},
          { name: "Series Editor Two"}
        ],
        responsibilities: []
      },
      edition: "Second",
      scope: {
        unit: "page",
        from: "10",
        to: "20"
      },
      publisher: "Publisher",
      publicationPlace: "Some, Where",
      publicationDate: "2000",
      distributor: "Distributor",
      distributorWeb: "http://books.somewhere.com",
      distributorAccessDate: "2001-03-14",
      note: "Just a note",
      copyright: "Copyright License",
      source: {
        id: "ABook",
        type: "archive.org"
      }
    })
  })
})

describe("source API", () => {
  const sourceApi = new SourceApi()

  const mockSourceName = "mocksource"
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


  it("should fetch and parse a source document", async () => {
    const spy = jest.spyOn(sourceApi, 'fetchText').mockResolvedValue(fullSource)

    const result = await sourceApi.get(mockSourceName)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/api/data/sources/${mockSourceName}`))
    expect(result).toMatchObject({
      source: { // this should be enough to tell us whether we got the right parsed document
        id: "ABook",
        type: "archive.org"
      }
    })

    spy.mockRestore()
  })

  it("should fail on unparsable XML", async () => {
    const spy = jest.spyOn(sourceApi, 'fetchText').mockResolvedValue(unparsableXml)

    await expect(sourceApi.get(mockSourceName)).
    rejects.toMatchObject(new ApiError(false, "parse failed", expect.any(String)))

    spy.mockRestore()

  })
})