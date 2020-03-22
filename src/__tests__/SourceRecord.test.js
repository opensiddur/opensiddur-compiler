/* SourceRecord.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render, wait} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import SourceApi, {SourceLevel} from "../SourceApi"
import SourceRecord, {SourceRecordPart, SourceRecordUtil} from "../SourceRecord"
import ContributorRecord from "../ContributorRecord"

const mockSourceGet = jest.fn()
jest.mock("../SourceApi", () => {
  return jest.fn().mockImplementation( () => ({
    get: mockSourceGet
  }))
})

describe("SourceRecordUtil.joinListOfReactElements", () => {
  it("should return an empty list when an empty list is input", () => {
    const result = SourceRecordUtil.joinListOfReactElements([])

    expect(result.length).toBe(0)
  })

  it("should return proper BiblioList* elements when everything is provided", () => {
    const array = [
      <span className="one">ONE</span>,
      <span className="two">TWO</span>]
    const result = SourceRecordUtil.joinListOfReactElements(array, "JOIN", "END", "BEGIN")

    expect(result.length).toBe(5)
    expect(result[0]).toMatchObject(<span className="BiblioListBegin">BEGIN</span> )
    expect(result[1]).toMatchObject(array[0])
    expect(result[2]).toMatchObject(<span className="BiblioListJoin">JOIN</span> )
    expect(result[3]).toMatchObject(array[1])
    expect(result[4]).toMatchObject(<span className="BiblioListEnd">END</span> )

  })

  it("should return proper BiblioList* elements when optional beginner is omitted", () => {
    const array = [
      <span className="one">ONE</span>,
      <span className="two">TWO</span>]
    const result = SourceRecordUtil.joinListOfReactElements(array, "JOIN", "END")

    expect(result.length).toBe(4)
    expect(result[0]).toMatchObject(array[0])
    expect(result[1]).toMatchObject(<span className="BiblioListJoin">JOIN</span> )
    expect(result[2]).toMatchObject(array[1])
    expect(result[3]).toMatchObject(<span className="BiblioListEnd">END</span> )
  })
})

describe("SourceRecordUtil.namedList", () => {
  it("produces no list given an empty array", () => {
    const result = SourceRecordUtil.namedList([], "anything")
    expect(result.length).toBe(0)
  })

  it("produces a list with the given type, joiner and ender", () => {
    const nameList = [{
      name: "A Name"
    },
      {
        name: "B Name"
      }]
    const nameType = "TYPE"
    const joiner = "JOIN"
    const ender = "END"
    const result = SourceRecordUtil.namedList(nameList, nameType, joiner, ender)

    expect(result.length).toBe(4)
    expect(result[0]).toMatchObject(<span className={nameType}>A Name</span>)
    expect(result[1]).toMatchObject(<span className="BiblioListJoin">JOIN</span> )
    expect(result[2]).toMatchObject(<span className={nameType}>B Name</span>)
    expect(result[3]).toMatchObject(<span className="BiblioListEnd">END</span> )
  })
})

describe("SourceRecordUtil.responsibilityList", () => {
  it("returns an empty list given an empty list", () => {
    const result = SourceRecordUtil.responsibilityList([])
    expect(result.length).toBe(0)
  })

  it("produces a list of given responsibility types", () => {
    const respList = [
      {
        resp: "trl",
        name: "Translator One"
      },
      {
        resp: "trc",
        name: "Transcriber One"
      },
      {
        resp: "trl",
        name: "Translator Two"
      }
    ]
    const joiner = "JOIN"
    const ender = "END"

    const result = SourceRecordUtil.responsibilityList(respList, joiner, ender)

    //expect(result.length).toBe(8)
    expect(result[0]).toMatchObject(<span className="BiblioListBegin"><span className="BiblioContributorType">Transcriber: </span></span>)
    expect(result[1]).toMatchObject(<span className="Transcriber">Transcriber One</span> )
    expect(result[2]).toMatchObject(<span className="BiblioListEnd">END</span> )
    expect(result[3]).toMatchObject(<span className="BiblioListBegin"><span className="BiblioContributorType">Translators: </span></span> )
    expect(result[4]).toMatchObject(<span className="Translator">Translator One</span> )
    expect(result[5]).toMatchObject(<span className="BiblioListJoin">JOIN</span> )
    expect(result[6]).toMatchObject(<span className="Translator">Translator Two</span> )
    expect(result[7]).toMatchObject(<span className="BiblioListEnd">END</span> )

  })
})

describe("SourceRecordUtil.titleList", () => {
  it("returns an empty list given an empty list", () => {
    const result = SourceRecordUtil.titleList([])
    expect(result.length).toBe(0)
  })

  it("produces a list of titles when everything is provided", () => {
    const titleList = [
      {
        type: "main",
        lang: "en",
        text: "Main"
      },
      {
        type: "sub",
        lang: "en",
        text: "Sub"
      },
      {
        type: "alt",
        lang: "en",
        text: "Alt"
      },
      {
        type: "alt-sub",
        lang: "en",
        text: "AltSub"
      }
    ]

    const result = SourceRecordUtil.titleList(titleList)
    expect(result[0]).toMatchObject(<span className="title_main" lang="en">Main</span>)
    expect(result[1]).toMatchObject(<span className="BiblioListJoin">:</span>)
    expect(result[2]).toMatchObject(<span className="title_sub" lang="en">Sub</span>)
    expect(result[3]).toMatchObject(<span className="BiblioListEnd"></span>)
    expect(result[4]).toMatchObject(<span className="BiblioListBegin">(</span>)
    expect(result[5]).toMatchObject(<span className="title_alt" lang="en">Alt</span>)
    expect(result[6]).toMatchObject(<span className="BiblioListJoin">:</span>)
    expect(result[7]).toMatchObject(<span className="title_alt-sub" lang="en">AltSub</span>)
    expect(result[8]).toMatchObject(<span className="BiblioListEnd">)</span>)
  })

  it("produces a list of titles when only mains are provided", () => {
    const titleList = [
      {
        type: "main",
        lang: "en",
        text: "Main"
      },
      {
        type: "alt",
        lang: "en",
        text: "Alt"
      }
    ]

    const result = SourceRecordUtil.titleList(titleList)
    expect(result[0]).toMatchObject(<span className="title_main" lang="en">Main</span>)
    expect(result[1]).toMatchObject(<span className="BiblioListEnd"></span>)
    expect(result[2]).toMatchObject(<span className="BiblioListBegin">(</span>)
    expect(result[3]).toMatchObject(<span className="title_alt" lang="en">Alt</span>)
    expect(result[4]).toMatchObject(<span className="BiblioListEnd">)</span>)
  })
})

describe("SourceRecordPart", () => {
  const authorList = [{
    name: "Author One"
  }, {
    name: "Author Two"
  }]

  const editorList = [
    {
      name: "Editor One"
    },
    {
      name: "Editor Two"
    }
  ]

  const titleList = [
    {
      type: "main",
      lang: "en",
      text: "Main"
    },
    {
      type: "alt",
      lang: "en",
      text: "Alt"
    }
  ]

  const respList = [
    {
      resp: "trl",
      name: "Translator One"
    },
    {
      resp: "trc",
      name: "Transcriber One"
    },
    {
      resp: "trl",
      name: "Translator Two"
    }
  ]

  it("combines authors, editors, responsibilities, and titles", () => {
    const inputPart = {
      "authors": authorList,
      "editors": editorList,
      "responsibilities": respList,
      "titles": titleList
    }
    const inputType = "example"

    const { queryByText } = render(<SourceRecordPart type={inputType} part={inputPart}/>)

    // at least check that everyone and everything that should be listed is in there
    expect(queryByText(/Author One/)).toBeInTheDocument()
    expect(queryByText(/Author Two/)).toBeInTheDocument()
    expect(queryByText(/Editor One/)).toBeInTheDocument()
    expect(queryByText(/Editor Two/)).toBeInTheDocument()
    expect(queryByText(/eds/)).toBeInTheDocument()
    expect(queryByText(/Translator One/)).toBeInTheDocument()
    expect(queryByText(/Transcriber One/)).toBeInTheDocument()
    expect(queryByText(/Translator Two/)).toBeInTheDocument()
    expect(queryByText(/Main/)).toBeInTheDocument()
    expect(queryByText(/Alt/)).toBeInTheDocument()
  })
})

describe("SourceRecord", () => {
  afterEach(() => {
    mockSourceGet.mockReset()
  })

  it("renders when given full data", async () => {
    const resourceName = "resource"
    const source = {
      resource: resourceName
    }

    mockSourceGet.mockResolvedValue({
      analytic: {
        titles: [{
          type: "main",
          lang: "en",
          text: "Analytic Title"
        }],
        authors: [{
          name: "Author One"
        }],
        editors: [{
          name: "Editor One"
        }],
        responsibilities: [{
          resp: "trc",
          name: "Transcriber One"
        }]
      },
      monogr: {
        titles: [{
          type: "main",
          lang: "en",
          text: "Monograph Title"
        }],
        authors: [{
          name: "Author Two"
        }],
        editors: [{
          name: "Editor Two"
        }],
        responsibilities: [{
          resp: "trc",
          name: "Transcriber Two"
        }]
      },
      series: {
        titles: [{
          type: "main",
          lang: "en",
          text: "Series Title"
        }],
        authors: [{
          name: "Author Three"
        }],
        editors: [{
          name: "Editor Three"
        }],
        responsibilities: [{
          resp: "trc",
          name: "Transcriber Three"
        }]
      },
      edition: "First",
      publisher: "Publisher",
      publicationPlace: "Place City",
      publicationDate: "1900",
      distributorWeb: "http://somewhere.com",
      distributor: "Distributor Somewhere",
      distributorAccessDate: "Jan 1, 2000",
      copyright: "Copyright Notice",
      note: "Noted"
    })

    const { queryByText } = render(<SourceRecord source={source} />)
    // TODO: test what should be displayed while loading

    expect(mockSourceGet).toHaveBeenCalledTimes(1)
    expect(mockSourceGet.mock.calls[0][0]).toBe(resourceName)

    await wait()
    expect(queryByText("Author One")).toBeInTheDocument()
    expect(queryByText("Author Two")).toBeInTheDocument()
    expect(queryByText("Author Three")).toBeInTheDocument()

    expect(queryByText("Editor One")).toBeInTheDocument()
    expect(queryByText("Editor Two")).toBeInTheDocument()
    expect(queryByText("Editor Three")).toBeInTheDocument()

    expect(queryByText("Transcriber One")).toBeInTheDocument()
    expect(queryByText("Transcriber Two")).toBeInTheDocument()
    expect(queryByText("Transcriber Three")).toBeInTheDocument()

    expect(queryByText("Analytic Title")).toBeInTheDocument()
    expect(queryByText("Monograph Title")).toBeInTheDocument()
    expect(queryByText("Series Title")).toBeInTheDocument()

    expect(queryByText(/First/)).toBeInTheDocument()
    expect(queryByText(/Publisher/)).toBeInTheDocument()
    expect(queryByText(/Place City/)).toBeInTheDocument()
    expect(queryByText(/1900/)).toBeInTheDocument()
    expect(queryByText("Distributor Somewhere")).toBeInTheDocument()
    expect(queryByText("Jan 1, 2000")).toBeInTheDocument()
    expect(queryByText("Copyright Notice")).toBeInTheDocument()
    expect(queryByText("Noted")).toBeInTheDocument()
  })
})