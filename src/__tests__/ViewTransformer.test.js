/* ViewTransformer.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, wait } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import ViewTransformer, {ViewTransformerUtils} from "../ViewTransformer"
import DocumentApi from "../DocumentApi"
import Transformer, {META_INLINE_MODE, META_SETTINGS, SETTINGS_OPENSIDDUR, SETTINGS_TRANSLATION} from "../Transformer"
import TransformerMetadata from "../TransformerMetadata"

const mockDocGet = jest.fn()

describe("ViewTransformer component", () => {
  const mockApply = jest.fn()
  const mockGetFragment = jest.fn()
  const mockUtilsTranslationRedirect = jest.fn()
  const mockRedirectFragment = jest.fn()

  let realDocGet
  let realApply
  let realGetFragment
  let realViewTransformerUtilsTranslationRedirect
  let realRedirectFragment
  beforeAll( () => {
    realApply = Transformer.apply
    realGetFragment = DocumentApi.getFragment
    realDocGet = DocumentApi.get
    realViewTransformerUtilsTranslationRedirect = ViewTransformerUtils.translationRedirect
    realRedirectFragment = Transformer.redirectFragment
    Transformer.apply = mockApply
    DocumentApi.getFragment = mockGetFragment
    DocumentApi.get = mockDocGet
    ViewTransformerUtils.translationRedirect = mockUtilsTranslationRedirect
    Transformer.redirectFragment = mockRedirectFragment
  })

  afterAll( () => {
    Transformer.apply = realApply
    DocumentApi.getFragment = realGetFragment
    DocumentApi.get = realDocGet
    ViewTransformerUtils.translationRedirect = realViewTransformerUtilsTranslationRedirect
    Transformer.redirectFragment = realRedirectFragment
  })

  afterEach(() => {
    mockApply.mockReset()
    mockGetFragment.mockReset()
    mockDocGet.mockReset()
    mockUtilsTranslationRedirect.mockReset()
    mockRedirectFragment.mockReset()
  })

  const docName = "DOCUMENT"
  const fragName = "afragment"
  const docContent = `
       <someXml xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">Document 
           <frag jf:id="afragment">Fragment</frag>
        </someXml>`
  const docContentXml = new DOMParser().parseFromString(docContent,"application/xml")

  const transContent = `
       <transXml xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">Linkage 
           <frag jf:id="afragment">Fragment</frag>
        </transXml>`
  const transContentXml = new DOMParser().parseFromString(docContent,"application/xml")

  const fragmentXml = new DOMParser().parseFromString(
    `<frag xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" jf:id="afragment">Fragment</frag>`,
    "application/xml")
  const transformedDocument = <div className="transformed">Transformed</div>

  const metadata = new TransformerMetadata()
  const inlineMode = new TransformerMetadata().set(META_INLINE_MODE, true)

  it("renders a requested transformed document with no translation redirect", async () => {
    mockUtilsTranslationRedirect.mockResolvedValue(null)
    mockDocGet.mockResolvedValue(docContentXml)
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} metadata={metadata} />)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    await wait()
    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(docName)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe("original")

    await wait()
    expect(mockApply).toHaveBeenCalledTimes(1)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("renders a requested transformed document with translation redirect", async () => {
    const redirectDocument = "redirectedTo"

    mockUtilsTranslationRedirect.mockResolvedValue(redirectDocument)
    mockDocGet.mockResolvedValue(docContentXml)
    mockRedirectFragment.mockResolvedValue(transContentXml)
    mockApply.mockReturnValueOnce(transformedDocument)


    const { getByText } = render(<ViewTransformer document={docName} metadata={metadata} />)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    await wait()
    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(redirectDocument)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe("linkage")
    expect(mockDocGet.mock.calls[0][3]).toBe("combined")

    await wait()
    expect(mockApply).toHaveBeenCalledTimes(1)
    expect(mockApply.mock.calls[0][0].nodes).toMatchObject(transContentXml)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("renders a requested transformed fragment with no redirect", async () => {
    mockUtilsTranslationRedirect.mockResolvedValue(null)
    mockDocGet.mockResolvedValue(docContentXml)
    mockGetFragment.mockReturnValueOnce([fragmentXml])
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} metadata={metadata} fragment={fragName}/>)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    await wait()
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

  it("renders a requested transformed document in inline mode", async () => {
    mockUtilsTranslationRedirect.mockResolvedValue(null)
    mockDocGet.mockResolvedValue(docContentXml)
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} metadata={inlineMode} />)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    await wait()
    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe(docName)
    expect(mockDocGet.mock.calls[0][1]).toBe("xml")
    expect(mockDocGet.mock.calls[0][2]).toBe("original")
    expect(mockDocGet.mock.calls[0][3]).toBe("flat")

    await wait()
    expect(mockApply).toHaveBeenCalledTimes(1)
    await wait()
    expect(getByText("Transformed")).toBeInTheDocument()
  })


  it("calls a specified API", async () => {
    const apiName = "otherapi"

    mockUtilsTranslationRedirect.mockResolvedValue(null)
    mockDocGet.mockResolvedValue(docContentXml)
    mockGetFragment.mockReturnValueOnce([fragmentXml])
    mockApply.mockReturnValueOnce(transformedDocument)

    const { getByText } = render(<ViewTransformer document={docName} metadata={metadata} fragment={fragName} api={apiName}/>)
    expect(getByText(/Loading/i)).toBeInTheDocument()

    await wait()
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

describe("ViewTransformerUtils.translationRedirect", () => {
  const mockLinkages = jest.fn()
  const docName = "document"
  const originalApi = "original"
  const otherApi = "other"
  const translationId = "trans"
  const otherTranslationid = "other"
  const noTranslationSetting = new TransformerMetadata().set(META_SETTINGS, {
    [SETTINGS_OPENSIDDUR]: {
      "something_else": ""
    }
  })
  const translationSetting = new TransformerMetadata().set(META_SETTINGS, {
    [SETTINGS_OPENSIDDUR]: {
      [SETTINGS_TRANSLATION]: translationId
    }
  })
  const otherTranslationSetting = new TransformerMetadata().set(META_SETTINGS, {
    [SETTINGS_OPENSIDDUR]: {
      [SETTINGS_TRANSLATION]: [otherTranslationid]
    }
  })

  let realDocumentApiLinkages
  beforeAll(() => {
    realDocumentApiLinkages = DocumentApi.linkages
    DocumentApi.linkages = mockLinkages
  })

  afterAll(() => {
    DocumentApi.linkages = realDocumentApiLinkages
  })

  afterEach(() => {
    mockLinkages.mockReset()
  })

  it("does not redirect if there are no settings", async () => {
    const result = await ViewTransformerUtils.translationRedirect(docName, originalApi, new TransformerMetadata())
    expect(result).toBeNull()
  })

  it("does not redirect if API is not original", async () => {
    const result = await ViewTransformerUtils.translationRedirect(docName, otherApi, translationSetting)
    expect(result).toBeNull()
  })

  it("it does not redirect if there are no active translations", async () => {
    const result = await ViewTransformerUtils.translationRedirect(docName, otherApi, noTranslationSetting)
    expect(result).toBeNull()
  })

  it("does not redirect if there is no linkage from the active translation", async () => {
    const noLinkages = { otherTranslationid: "/path/to/document" }

    mockLinkages.mockResolvedValue(noLinkages)
    const result = await ViewTransformerUtils.translationRedirect(docName, originalApi, translationSetting)
    expect(mockLinkages).toHaveBeenCalledTimes(1)
    expect(mockLinkages.mock.calls[0][0]).toBe(docName)

    expect(result).toBeNull()
  })

  it("does redirect if there is a linkage from the active translation", async () => {
    const translationName = "/path/to/document"
    const yesLinkages = { [translationId]: translationName }

    mockLinkages.mockResolvedValue(yesLinkages)
    const result = await ViewTransformerUtils.translationRedirect(docName, originalApi, translationSetting)
    expect(mockLinkages).toHaveBeenCalledTimes(1)
    expect(mockLinkages.mock.calls[0][0]).toBe(docName)

    expect(result).toBe(translationName)
  })
})