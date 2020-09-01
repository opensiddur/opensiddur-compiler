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

describe("SourceRecordUtil.joinListOfReactElements", () => {
  it("should return null when an empty list is input", () => {
    const result = SourceRecordUtil.joinListOfReactElements([])

    expect(result).toBeNull()
  })

  it("should return proper BiblioList* elements when everything is provided", () => {
    const array = [
      <span className="one">ONE</span>,
      <span className="two">TWO</span>]
    const { queryByText } = render(SourceRecordUtil.joinListOfReactElements(array, "JOIN", "END", "BEGIN"))

    expect(queryByText("BEGIN") ).toBeInTheDocument()
    expect(queryByText("ONE") ).toBeInTheDocument()
    expect(queryByText("TWO") ).toBeInTheDocument()
    expect(queryByText("JOIN") ).toBeInTheDocument()
    expect(queryByText("END")).toBeInTheDocument()

  })

  it("should return proper BiblioList* elements when optional beginner is omitted", () => {
    const array = [
      <span className="one">ONE</span>,
      <span className="two">TWO</span>]
    const {queryByText} = render(SourceRecordUtil.joinListOfReactElements(array, "JOIN", "END"))

    expect(queryByText("ONE") ).toBeInTheDocument()
    expect(queryByText("TWO") ).toBeInTheDocument()
    expect(queryByText("JOIN") ).toBeInTheDocument()
    expect(queryByText("END")).toBeInTheDocument()
  })
})

describe("SourceRecordUtil.namedList", () => {
  it("produces no list given an empty array", () => {
    const result = SourceRecordUtil.namedList([], "anything")
    expect(result).toBeNull()
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
    const {queryByText} = render(SourceRecordUtil.namedList(nameList, nameType, joiner, ender))

    expect(queryByText("A Name")).toBeInTheDocument()
    expect(queryByText("JOIN")).toBeInTheDocument()
    expect(queryByText("B Name")).toBeInTheDocument()
    expect(queryByText("END")).toBeInTheDocument()
  })
})

describe("SourceRecordUtil.responsibilityList", () => {
  it("returns null given an empty list", () => {
    const result = SourceRecordUtil.responsibilityList([])
    expect(result).toBeNull()
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

    const {container, queryByText, queryAllByText } = render(SourceRecordUtil.responsibilityList(respList, joiner, ender))

    expect(queryByText("Transcriber:")).toBeInTheDocument()
    expect(queryByText("Transcriber One")).toBeInTheDocument()
    expect(queryAllByText("END").length).toBe(2)
    expect(queryByText("Translators:")).toBeInTheDocument()
    expect(queryByText("Translator One")).toBeInTheDocument()
    expect(queryByText("JOIN")).toBeInTheDocument()
    expect(queryByText("Translator Two")).toBeInTheDocument()
  })

})

describe("SourceRecordUtil.titleList", () => {
  it("returns null given an empty list", () => {
    const result = SourceRecordUtil.titleList([])
    expect(result).toBeNull()
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

    const {queryByText, queryAllByText} = render(SourceRecordUtil.titleList(titleList))
    expect(queryByText("Main")).toBeInTheDocument()
    expect(queryAllByText(":").length).toBe(2)
    expect(queryByText("Sub")).toBeInTheDocument()
    expect(queryByText("(")).toBeInTheDocument()
    expect(queryByText("Alt")).toBeInTheDocument()
    expect(queryByText("AltSub")).toBeInTheDocument()
    expect(queryByText(")")).toBeInTheDocument()
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

    const {queryByText} = render(SourceRecordUtil.titleList(titleList))
    expect(queryByText("Main")).toBeInTheDocument()
    expect(queryByText("(")).toBeInTheDocument()
    expect(queryByText("Alt")).toBeInTheDocument()
    expect(queryByText(")")).toBeInTheDocument()
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
  let realSourceGet

  beforeAll( () => {
    realSourceGet = SourceApi.get
    SourceApi.get = mockSourceGet
  })

  afterEach(() => {
    mockSourceGet.mockReset()
  })

  afterAll(() => {
    SourceApi.get = realSourceGet
  })

  it("renders when given full data", async () => {
    const resourceName = "resource"
    const source = {
      resource: resourceName
    }

    mockSourceGet.mockResolvedValue({
      lang: "en",
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

    const { container, queryByText } = render(<SourceRecord source={source} />)
    // TODO: test what should be displayed while loading

    expect(mockSourceGet).toHaveBeenCalledTimes(1)
    expect(mockSourceGet.mock.calls[0][0]).toBe(resourceName)

    await wait()
    expect(container.querySelector("div.SourceRecord[lang=en]")).toBeInTheDocument()
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