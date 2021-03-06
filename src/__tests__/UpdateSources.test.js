/* UpdateSources.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import UpdateSources from "../UpdateSources"
import {DOCUMENT_CONTEXT_SWITCH, ELEMENT_CONTEXT_SWITCH, LOCATION_CONTEXT_SWITCH, META_SOURCES} from "../Transformer"
import React from "react"

describe("UpdateSources", () => {
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

  it("chains the existing metadata when the chain level < DOCUMENT_CONTEXT_SWITCH", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const xml = [text2xml(`<test>one</test>`).documentElement]
    mockChain["level"] = ELEMENT_CONTEXT_SWITCH

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(<UpdateSources nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
  })

  it("chains the existing metadata when there are no new sources", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const xml = [text2xml(`<test>one</test>`).documentElement]
    mockChain["level"] = DOCUMENT_CONTEXT_SWITCH

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(<UpdateSources nodes={xml} metadata={metadata} chain={mockChain}/>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      metadata: metadata,
      chain: mockChain
    })
  })

  test.skip("lists new sources when there are new context sources", () => {
    // TODO: figure out how to write this test
  })

})