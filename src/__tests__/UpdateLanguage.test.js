/* UpdateLanguage.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer, {META_LANG} from "../Transformer"
import {text2xml} from "../TestUtils"
import TransformerMetadata from "../TransformerMetadata"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import UpdateLanguage from "../UpdateLanguage"

describe("UpdateLanguage", () => {

  const mockChainNext = jest.fn()
  const mockChainNextWithUpdate = jest.fn()
  const mockChain = {
    next: mockChainNext,
    nextWithMetadataUpdate: mockChainNextWithUpdate
  }

  beforeEach( () => {
    mockChainNext.mockReset()
    mockChainNextWithUpdate.mockReset()
  })

  it("chains the existing metadata when there is no lang metadata and no xml:lang", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const xml = [text2xml(`<test>one</test>`).documentElement]

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(<UpdateLanguage nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
  })

  it("chains the existing lang metadata when there is no xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else").set(META_LANG, "en")
    const xml = [text2xml(`<test>one</test>`).documentElement]

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(<UpdateLanguage nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
  })

  it("returns a new language div wrapper when there is no lang metadata and an xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const expectedMetadata = metadata.set(META_LANG, "en")
    const xml = [text2xml(`<test xml:lang="en">one</test>`).documentElement]

    mockChainNextWithUpdate.mockReturnValue("chained")

    const { container, queryByText } = render(<UpdateLanguage nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(container.querySelector("div.UpdateLanguage[lang='en']")).toBeInTheDocument()

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNextWithUpdate).toHaveBeenCalledTimes(1)
    expect(mockChainNextWithUpdate.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
    expect(mockChainNextWithUpdate.mock.calls[0][1]).toMatchObject(expectedMetadata)
  })

  it("returns a new language div wrapper when there is lang metadata and a different xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else").set(META_LANG, "he")
    const expectedMetadata = metadata.set(META_LANG, "en")
    const xml = [text2xml(`<test xml:lang="en">one</test>`).documentElement]

    mockChainNextWithUpdate.mockReturnValue("chained")

    const { container, queryByText } = render(<UpdateLanguage nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(container.querySelector("div.UpdateLanguage[lang='en']")).toBeInTheDocument()

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNextWithUpdate).toHaveBeenCalledTimes(1)
    expect(mockChainNextWithUpdate.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
    expect(mockChainNextWithUpdate.mock.calls[0][1]).toMatchObject(expectedMetadata)
  })
})
