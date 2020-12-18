/* UpdateLanguage.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useContext} from "react"
import Transformer, {META_LANG} from "../Transformer"
import {text2xml} from "../TestUtils"
import TransformerMetadata from "../TransformerMetadata"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import UpdateLanguage from "../UpdateLanguage"
import {CurrentLanguageContext} from "../LanguageMetadataContext"

describe("UpdateLanguage", () => {

  const mockChainNext = jest.fn()
  const mockChain = {
    next: mockChainNext
  }
  const chainReturn = "chained"
  const mockContextReport = jest.fn()

  beforeEach( () => {
    mockChainNext.mockReset()
    mockContextReport.mockReset()
    mockChainNext.mockImplementation( () => {
      return <CurrentLanguageContext.Consumer>{ lang =>
        mockContextReport(lang) || chainReturn
      }</CurrentLanguageContext.Consumer>
    })
  })

  it("chains when there is no lang metadata and no xml:lang", () => {
    const xml = [text2xml(`<test>one</test>`).documentElement]

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(<UpdateLanguage nodes={xml} chain={mockChain}/>)

    expect(queryByText(chainReturn)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })
  })

  it("chains when there is existing lang metadata and there is no xml:lang attribute", () => {
    const lang = "xx"
    const xml = [text2xml(`<test>one</test>`).documentElement]

    const { queryByText } = render(
      <CurrentLanguageContext.Provider value={lang}>
        <UpdateLanguage nodes={xml} chain={mockChain}/>
      </CurrentLanguageContext.Provider>
    )
    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })
    expect(mockContextReport).toHaveBeenCalledTimes(1)
    expect(mockContextReport.mock.calls[0][0]).toBe(lang)
  })

  it("returns a new language div wrapper when there is no lang metadata and an xml:lang attribute", () => {
    const newLang = "en"
    const xml = [text2xml(`<test xml:lang="en">one</test>`).documentElement]

    const { container, queryByText } = render(
      <CurrentLanguageContext.Provider value={null}>
        <UpdateLanguage nodes={xml} chain={mockChain}/>
      </CurrentLanguageContext.Provider>)

    expect(container.querySelector("div.UpdateLanguage[lang='en']")).toBeInTheDocument()

    expect(queryByText(chainReturn)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })

    expect(mockContextReport).toHaveBeenCalledTimes(1)
    expect(mockContextReport.mock.calls[0][0]).toBe(newLang)
  })

  it("returns a new language div wrapper when there is lang metadata and a different xml:lang attribute", () => {
    const oldLang = "he"
    const newLang = "en"
    const xml = [text2xml(`<test xml:lang="en">one</test>`).documentElement]

    const { container, queryByText } = render(
      <CurrentLanguageContext.Provider value={oldLang}>
      <UpdateLanguage nodes={xml} chain={mockChain}/>
      </CurrentLanguageContext.Provider>
    )

    expect(container.querySelector("div.UpdateLanguage[lang='en']")).toBeInTheDocument()

    expect(queryByText(chainReturn)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })

    expect(mockContextReport).toHaveBeenCalledTimes(1)
    expect(mockContextReport.mock.calls[0][0]).toBe(newLang)
  })
})
