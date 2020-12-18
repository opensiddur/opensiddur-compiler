/* ActiveAnnotationViewer.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import ActiveAnnotationViewer from "../ActiveAnnotationViewer"
import {ActiveAnnotationContext} from "../AnnotationMetadataContext"
import DocumentApi from "../DocumentApi"
import InlineModeContext, {InlineMode} from "../InlineModeContext"
import {wait} from "@testing-library/dom"
import {text2xml} from "../TestUtils"
import {LicenseMetadataContext} from "../LicenseMetadataContext"
import {ContributorMetadataContext} from "../ContributorMetadataContext"

describe("ActiveAnnotationViewer", () => {
  const mockActivate = jest.fn()
  const mockDocumentGet = jest.fn()
  let realDocumentGet

  beforeAll( () => {
    realDocumentGet = DocumentApi.get
    DocumentApi.get = mockDocumentGet
  })

  beforeEach(() => {
    mockActivate.mockReset()
    mockDocumentGet.mockReset()
  })

  afterAll(() => {
    DocumentApi.get = realDocumentGet
  })

  it("does not show a button when there are no annotations", () => {
    const { queryByText } = render(
      <ActiveAnnotationContext.Provider value={{ activateState: mockActivate, activeState: new Set()}}>
        <ActiveAnnotationViewer />
      </ActiveAnnotationContext.Provider>)

    expect(queryByText("Close")).not.toBeInTheDocument()
  })

  it("displays active annotations and deactivates them when a button is pressed", async () => {
    const active1 = "/data/notes/one"
    const active2 = "/data/notes/two"
    const initialActives = new Set([active1, active2])

    mockDocumentGet.mockImplementation(async (document, format, api, suffix) => {
      return text2xml(`<tei:note xmlns:tei="http://www.tei-c.org/ns/1.0">Note from ` + document + `</tei:note>`)
    })

    const { container, queryByText } = render(
      <ContributorMetadataContext>
        <LicenseMetadataContext>
          <InlineModeContext>
            <ActiveAnnotationContext.Provider value={{ activateState: mockActivate, activeState: initialActives}}>
              <ActiveAnnotationViewer />
            </ActiveAnnotationContext.Provider>
          </InlineModeContext>
        </LicenseMetadataContext>
      </ContributorMetadataContext>)

    await wait()
    expect(queryByText("Note from one")).toBeInTheDocument()
    expect(queryByText("Note from two")).toBeInTheDocument()

    const button = queryByText("Close")
    expect(button).toBeInTheDocument()
    button.click()

    expect(mockActivate).toHaveBeenCalledTimes(1)
    expect(mockActivate.mock.calls[0][0]).toMatchObject(new Set())
  })

})