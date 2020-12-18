/* TeiPtr.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import DocumentApi from "../DocumentApi"
import Transformer, {LOCATION_CONTEXT_SWITCH, META_INLINE_MODE} from "../Transformer"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import React, {useContext} from "react"
import TeiPtr from "../TeiPtr"
import {InlineMode} from "../InlineModeContext"

describe("TeiPtr", () => {
  const metadata = new TransformerMetadata()
  const xmlDocument = text2xml("<test/>")
  const recursionFunction = jest.fn()
  const mockApplyTo = jest.fn()
  const mockGetFragment = jest.fn()
  const mockContextReader = jest.fn()
  let realApplyTo
  let realGetFragment

  beforeAll( () => {
    realApplyTo = Transformer.applyTo
    realGetFragment = DocumentApi.getFragment

    Transformer.applyTo = mockApplyTo
    DocumentApi.getFragment = mockGetFragment
  })

  afterAll( () => {
    Transformer.applyTo = realApplyTo
    DocumentApi.getFragment = realGetFragment
  })

  afterEach( () => {
    recursionFunction.mockReset()
    mockApplyTo.mockReset()
    mockGetFragment.mockReset()
    mockContextReader.mockReset()
  })

  it("should return html a for type=url", () => {
    const xmlPtr = [text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="url" target="http://www.example.com"/>`).documentElement]
    const { container } = render(<TeiPtr nodes={xmlPtr} metadata={metadata}/>)

    const a = container.querySelector("a")
    expect(a).toBeInTheDocument
    expect(a.href).toBe("http://www.example.com/")
    expect(a.textContent).toBe("http://www.example.com")
  })

  it("should recurse to transform when the document is the same as the current document", () => {
    const mockFragment = text2xml("<fragment>Fragment</fragment>")
    const mockFragmentData = [mockFragment]
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    mockApplyTo.mockReturnValueOnce(<div>Transformed</div>)
    const xmlPtr = [text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" target="#fragmentInCurrentDocument"/>`).documentElement]
    const { getByText } = render(<TeiPtr nodes={xmlPtr} metadata={metadata}/>)

    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][1]).toBe("fragmentInCurrentDocument")

    expect(mockApplyTo).toHaveBeenCalledTimes(1)
    expect(mockApplyTo.mock.calls[0][0]).toBe(mockFragmentData)
    expect(mockApplyTo.mock.calls[0][1]).toMatchObject(metadata)
    expect(mockApplyTo.mock.calls[0][2]).toBe(LOCATION_CONTEXT_SWITCH)
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("should recurse to recursionFunction when the document is not the same as the current document", () => {
    const mockFragment = text2xml("<fragment>Fragment</fragment>")
    const mockFragmentData = [mockFragment]
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    recursionFunction.mockReturnValueOnce(<div>Recursed</div>)
    const xmlPtr = [text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" target="another/document#fragment"/>`).documentElement]
    const { getByText } = render(<TeiPtr nodes={xmlPtr} metadata={metadata} transformerRecursionFunction={recursionFunction}/>)

    expect(recursionFunction).toHaveBeenCalledTimes(1)
    expect(recursionFunction.mock.calls[0][0]).toBe("document")
    expect(recursionFunction.mock.calls[0][1]).toBe("fragment")
    expect(getByText("Recursed")).toBeInTheDocument()
  })

  it("should go to inline mode if the pointer is declared to be inline", () => {
    recursionFunction.mockImplementationOnce(() => {
      return <InlineMode.Consumer>{ (inlineMode) =>
        mockContextReader(inlineMode) || <div>Recursed</div>
      }</InlineMode.Consumer>
    })
    const xmlPtr = [text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="inline" target="#fragmentInCurrentDocument"/>`).documentElement]
    const { getByText } = render(<TeiPtr nodes={xmlPtr} metadata={metadata} documentName="document"
                                         transformerRecursionFunction={recursionFunction} />)

    expect(recursionFunction).toHaveBeenCalledTimes(1)
    expect(recursionFunction.mock.calls[0][0]).toBe("document")
    expect(recursionFunction.mock.calls[0][1]).toBe("fragmentInCurrentDocument")
    expect(getByText("Recursed")).toBeInTheDocument()

    expect(mockContextReader).toHaveBeenCalledTimes(1)
    expect(mockContextReader.mock.calls[0][0]).toBe(true)
  })

  it("should go to inline mode in an external document if the pointer is declared to be inline", () => {
    const mockFragmentData = [text2xml("<fragment>Fragment</fragment>")]
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    recursionFunction.mockImplementationOnce(() => {
      return <InlineMode.Consumer>{ (inlineMode) =>
        mockContextReader(inlineMode) || <div>Recursed</div>
      }</InlineMode.Consumer>
    })
    const xmlPtr = [text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="inline" target="another/document#fragment"/>`).documentElement]
    const { getByText } = render(<TeiPtr nodes={xmlPtr} metadata={metadata} transformerRecursionFunction={recursionFunction}/>)

    expect(recursionFunction).toHaveBeenCalledTimes(1)
    expect(recursionFunction.mock.calls[0][0]).toBe("document")
    expect(recursionFunction.mock.calls[0][1]).toBe("fragment")
    expect(getByText("Recursed")).toBeInTheDocument()

    expect(mockContextReader).toHaveBeenCalledTimes(1)
    expect(mockContextReader.mock.calls[0][0]).toBe(true)
  })
})
