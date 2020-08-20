/* UpdateContributors.test
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
import {CurrentContributorContext, GlobalContributorContext} from "../ContributorMetadataContext"
import UpdateContributors from "../UpdateContributors"

describe("UpdateContributors", () => {
  const mockRegister = jest.fn()
  const mockChainNext = jest.fn()
  let realContextContributors
  const mockContextContributors = jest.fn()

  const mockChain = {
    next: mockChainNext,
  }


  beforeAll( () => {
    realContextContributors = TransformerMetadata.contextContributors
    TransformerMetadata.contextContributors = mockContextContributors
  })

  beforeEach( () => {
    mockChainNext.mockReset()
    mockRegister.mockReset()
    mockContextContributors.mockReset()
  })

  afterAll( () => {
    TransformerMetadata.contextContributors = realContextContributors
  })

  it("chains when the chain level < DOCUMENT_CONTEXT_SWITCH", () => {
    const contrib = "CONT"
    const xml = [text2xml(`<test>one</test>`).documentElement]
    mockChain["level"] = ELEMENT_CONTEXT_SWITCH

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(
      <GlobalContributorContext.Provider value={{ activeState: contrib, registerGlobalState: mockRegister }}>
        <CurrentContributorContext.Provider value={contrib}>
          <UpdateContributors nodes={xml} chain={mockChain}/>
        </CurrentContributorContext.Provider>
      </GlobalContributorContext.Provider>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })

    expect(mockRegister).toHaveBeenCalledTimes(0)

    expect(mockContextContributors).toHaveBeenCalledTimes(0)
  })

  it("chains the existing metadata when there are no new contributors", () => {
    const contrib = {"aut": "one"}
    const xml = [text2xml(`<test>one</test>`).documentElement]
    mockChain["level"] = DOCUMENT_CONTEXT_SWITCH
    mockContextContributors.mockReturnValue({})

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(
      <GlobalContributorContext.Provider value={{ activeState: contrib, registerGlobalState: mockRegister }}>
        <CurrentContributorContext.Provider value={contrib}>
          <UpdateContributors nodes={xml} chain={mockChain}/>
        </CurrentContributorContext.Provider>
      </GlobalContributorContext.Provider>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockContextContributors).toHaveBeenCalledTimes(1)

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })

    expect(mockRegister).toHaveBeenCalledTimes(0)
  })

  it("registers new contributors when there are new context contributors", () => {
    const contrib = {"aut": "one"}
    const newContrib = {"edt": "two"}
    const xml = [text2xml(`<test>one</test>`).documentElement]
    mockChain["level"] = DOCUMENT_CONTEXT_SWITCH
    mockContextContributors.mockReturnValue(newContrib)

    mockChainNext.mockReturnValue("chained")

    const { queryByText } = render(
      <GlobalContributorContext.Provider value={{ activeState: contrib, registerGlobalState: mockRegister }}>
        <CurrentContributorContext.Provider value={contrib}>
          <UpdateContributors nodes={xml} chain={mockChain}/>
        </CurrentContributorContext.Provider>
      </GlobalContributorContext.Provider>)

    expect(queryByText(/chained/)).toBeInTheDocument()

    expect(mockContextContributors).toHaveBeenCalledTimes(1)

    expect(mockChainNext).toHaveBeenCalledTimes(1)
    expect(mockChainNext.mock.calls[0][0]).toMatchObject({
      nodes: xml,
      chain: mockChain
    })

    expect(mockRegister).toHaveBeenCalledTimes(1)
    expect(mockRegister.mock.calls[0][0]).toMatchObject(newContrib)
  })

})