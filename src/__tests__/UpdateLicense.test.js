/* UpdateLicense.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {fireEvent, render} from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import {DOCUMENT_CONTEXT_SWITCH, META_LICENSE, TransformerContextChain} from "../Transformer"
import UpdateLicense from "../UpdateLicense"
import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"

describe("UpdateLicense", () => {
  let realContextLicense

  const mockContextLicense = jest.fn()

  beforeAll(() => {
    realContextLicense = TransformerMetadata.contextLicense
  })

  beforeEach(() => {
    mockContextLicense.mockReset()
  })

  afterAll(() => {
    TransformerMetadata.contextLicense = realContextLicense
  })

  it("chains next at low level", () => {
    const chain = new TransformerContextChain(0)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    const { container } = render(<UpdateLicense chain={chain}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})
  })

  it("chains next when the context license and new license are the same", () => {
    const sameLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasSameLicense>text</hasSameLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(sameLicenseValue)

    const metadata = new TransformerMetadata().set(META_LICENSE, sameLicenseValue)

    const { container } = render(<UpdateLicense nodes={node} chain={chain} metadata={metadata}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
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

    const metadata = new TransformerMetadata()

    const { container } = render(<UpdateLicense nodes={node} chain={chain} metadata={metadata}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
  })

  it("renders when there is no context license and there is a new license", () => {
    const noLicenseValue = null
    const newLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasPdLicense>text</hasPdLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(newLicenseValue)

    const metadata = new TransformerMetadata()

    const { container, queryByText, getByRole } = render(<UpdateLicense nodes={node} chain={chain} metadata={metadata}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
    // (1) SmallLicenseBox is called
    fireEvent.click(getByRole("toggle"))
    expect(queryByText(/public domain/i)).toBeInTheDocument()
    // (2) metadata is updated at a lower level
    expect(mockNext.mock.calls[0][0].metadata.get(META_LICENSE)).toBe(newLicenseValue)
  })

  it("renders when the context license is different from the new license", () => {
    const oldLicenseValue = "http://www.creativecommons.org/licenses/by/4.0"
    const newLicenseValue = "http://www.creativecommons.org/publicdomain/zero/1.0"

    const node = [text2xml(`<hasPdLicense>text</hasPdLicense>`).documentElement]
    const chain = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH)
    const mockNext = jest.fn()
    mockNext.mockReturnValue(null)
    chain.next = mockNext

    TransformerMetadata.contextLicense = mockContextLicense
    mockContextLicense.mockReturnValue(newLicenseValue)

    const metadata = new TransformerMetadata().set(META_LICENSE, oldLicenseValue)

    const { container, queryByText, getByRole } = render(<UpdateLicense nodes={node} chain={chain} metadata={metadata}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({ chain: chain})

    expect(mockContextLicense).toHaveBeenCalledTimes(1)
    // (1) SmallLicenseBox is called
    fireEvent.click(getByRole("toggle"))
    expect(queryByText(/public domain/i)).toBeInTheDocument()
    // (2) metadata is updated at a lower level
    expect(mockNext.mock.calls[0][0].metadata.get(META_LICENSE)).toBe(newLicenseValue)

  })
})