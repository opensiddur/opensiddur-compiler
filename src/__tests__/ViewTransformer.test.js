/* ViewTransformer.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, wait } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import ViewTransformer from "../ViewTransformer"
import DocumentApi from "../DocumentApi"
import Transformer from "../Transformer"

const mockDocGet = jest.fn()
jest.mock("../DocumentApi", () => {
  return jest.fn().mockImplementation( () => {
    return {
      get: mockDocGet
    }
  })
})

describe("ViewTransformer component", () => {
  const mockApply = jest.fn()
  const mockGetFragment = jest.fn()

  let realApply
  let realGetFragment
  beforeAll( () => {
    realApply = Transformer.apply
    realGetFragment = Transformer.getFragment
    Transformer.apply = mockApply
    Transformer.getFragment = mockGetFragment
  })

  afterAll( () => {
    Transformer.apply = realApply
    Transformer.getFragment = realGetFragment
  })

  afterEach(() => {
    mockApply.mockReset()
    mockGetFragment.mockReset()
    mockDocGet.mockReset()
  })

  const docName = "DOCUMENT"
  const fragName = "afragment"
  const docContent = `
       <someXml xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">Document 
           <frag jf:id="afragment">Fragment</frag>
        </someXml>`
  const docContentXml = new DOMParser().parseFromString(docContent,"application/xml")
  const fragmentXml = new DOMParser().parseFromString(
    `<frag xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" jf:id="afragment">Fragment</frag>`,
    "application/xml")
  const transformedDocument = <div className="transformed">Transformed</div>

  it("renders a requested transformed document", async () => {
    mockDocGet.mockResolvedValue(docContentXml)
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} />)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(docName)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe("original")

    await wait()
    expect(mockApply).toHaveBeenCalledTimes(1)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("renders a requested transformed fragment", async () => {
    mockDocGet.mockResolvedValue(docContentXml)
    mockGetFragment.mockReturnValueOnce([fragmentXml])
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} fragment={fragName}/>)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(docName)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe("original")

    await wait()
    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][1]).toBe(fragName)

    expect(mockApply).toHaveBeenCalledTimes(1)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("calls a specified API", async () => {
    const apiName = "otherapi"

    mockDocGet.mockResolvedValue(docContentXml)
    mockGetFragment.mockReturnValueOnce([fragmentXml])
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} fragment={fragName} api={apiName}/>)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(docName)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe(apiName)

    await wait()
    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][1]).toBe(fragName)

    expect(mockApply).toHaveBeenCalledTimes(1)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })
})