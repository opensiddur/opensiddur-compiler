/* UpdateLicense.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import {DOCUMENT_CONTEXT_SWITCH, TransformerContextChain} from "../Transformer"
import UpdateLicense from "../UpdateLicense"
import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import {CurrentLicenseContext, GlobalLicenseContext} from "../LicenseMetadataContext"

describe("UpdateLicense", () => {
  let realContextLicense

  const mockValue = ""
  const mockDispatch = jest.fn()
  const mockContextLicense = jest.fn()
  const mockContextReader = jest.fn()
  const contextReaderText = "context reader finished"
  const mockNext = jest.fn()

  beforeAll(() => {
    realContextLicense = TransformerMetadata.contextLicense
  })

  beforeEach(() => {
    mockContextLicense.mockReset()
    mockContextReader.mockReset()
    mockNext.mockReset()
    mockDispatch.mockReset()
    // mock next that calls first with the current license context and the global context
    mockNext.mockImplementation((props) => {
      return <GlobalLicenseContext.Consumer>{global =>
        <CurrentLicenseContext.Consumer>{current =>
          mockContextReader(current, global)
        }</CurrentLicenseContext.Consumer>
      }</GlobalLicenseContext.Consumer>
    })
    mockContextReader.mockReturnValue(contextReaderText)
  })

  afterAll(() => {
    TransformerMetadata.contextLicense = realContextLicense
  })

  it("chains next at low level", () => {
    const chain = new TransformerContextChain(0)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    const { container } = render(
      <GlobalLicenseContext.Provider value={{mockValue, mockDispatch}}>
        <CurrentLicenseContext.Provider value={{mockValue, mockDispatch}}>
          <UpdateLicense chain={chain}/>
        </CurrentLicenseContext.Provider>
      </GlobalLicenseContext.Provider>
      )

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})
  })

  it("chains next when the context license and new license are the same", () => {
    const sameLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasSameLicense>text</hasSameLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)

    chain.next = mockNext

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(sameLicenseValue)

    const globalProviderValue = new Set()

    const { container } = render(
      <GlobalLicenseContext.Provider value={{globalProviderValue, mockDispatch}}>
        <CurrentLicenseContext.Provider value={sameLicenseValue}>
          <UpdateLicense nodes={node} chain={chain}/>
        </CurrentLicenseContext.Provider>
      </GlobalLicenseContext.Provider>
      )

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
    expect(mockContextReader.mock.calls[0][0]).toBe(sameLicenseValue)
  })

  it("chains when there is neither a context license nor a new license", () => {
    const noLicenseValue = null

    const node = [text2xml(`<hasNoLicense>text</hasNoLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(noLicenseValue)

    const { container } = render(<UpdateLicense nodes={node} chain={chain}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
  })

  it("renders when there is no context license and there is a new license", async () => {
    const noLicenseValue = null
    const newLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasPdLicense>text</hasPdLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    chain.next = mockNext

    const globalProviderValue = new Set()

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(newLicenseValue)

    const { container, queryByText, getByRole } = render(
      <GlobalLicenseContext.Provider value={{globalState: globalProviderValue, registerGlobalState: mockDispatch}}>
        <CurrentLicenseContext.Provider value={noLicenseValue}>
          <UpdateLicense nodes={node} chain={chain}/>
        </CurrentLicenseContext.Provider>
      </GlobalLicenseContext.Provider>
      )

    expect(container.querySelectorAll("div.UpdateLicense").length).toBe(1)
    expect(queryByText(contextReaderText)).toBeInTheDocument()

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch.mock.calls[0][0]).toBe(newLicenseValue)

    expect(mockContextLicense).toHaveBeenCalledTimes(1)

    expect(mockContextReader).toHaveBeenCalledTimes(1)
    expect(mockContextReader.mock.calls[0][0]).toBe(newLicenseValue)


  })

  it("renders when the context license is different from the new license", () => {
    const oldLicenseValue = "http://www.creativecommons.org/licenses/by/4.0"
    const newLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasPdLicense>text</hasPdLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    chain.next = mockNext

    const globalLicState = new Set([oldLicenseValue])

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(newLicenseValue)

    const { container, queryByText, getByRole } = render(
    <GlobalLicenseContext.Provider value={{globalState: globalLicState, registerGlobalState: mockDispatch}}>
      <CurrentLicenseContext.Provider value={oldLicenseValue}>
        <UpdateLicense nodes={node} chain={chain} />
      </CurrentLicenseContext.Provider>
    </GlobalLicenseContext.Provider>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch.mock.calls[0][0]).toBe(newLicenseValue)

    expect(mockContextReader).toHaveBeenCalledTimes(1)
    expect(mockContextReader.mock.calls[0][0]).toBe(newLicenseValue)
  })
})