/* SourceList.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render, wait } from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import SourceList from "../SourceList"

import SourceApi from "../SourceApi"
// this is kind of ugly, since we're mocking something called downstream...
const mockSourceGet = jest.fn()
jest.mock("../SourceApi", () => {
  return jest.fn().mockImplementation( () => ({
    get: mockSourceGet
  }))
})

describe("SourceList", () => {
  afterEach( () => {
    mockSourceGet.mockReset()
  })

  it("lists no sources if none are returned", () => {
    const emptySourceList = []
    mockSourceGet.mockResolvedValue([])

    const { container } = render(<SourceList sources={emptySourceList}/> )
    const cl = container.querySelector(".SourceList")

    expect(cl).toBeInTheDocument()
    expect(cl.childElementCount).toBe(0)
  })

  it("lists a list of sources with a header if any are present", async () => {
    const nonEmptySources = [
      { resource: "one" },
      { resource: "two" }
    ]

    mockSourceGet.mockImplementation( (resource) => {
      if (resource === "one") {
        return {
          monogr : {
            titles: [
              {
                type: "main",
                lang: "en",
                text: "Monograph One"
              }
            ],
            authors: [
              { name: "Monogr Author One" }
            ],
            editors: [],
            responsibilities: []
          }
        }
      }
      else if (resource === "two") {
        return {
          monogr : {
            titles: [
              {
                type: "main",
                lang: "en",
                text: "Monograph Two"
              }
            ],
            authors: [
              { name: "Monogr Author Two" }
            ],
            editors: [],
            responsibilities: []
          }
        }
      }
    })

    const { container, queryByText } = render(<SourceList sources={nonEmptySources}/> )
    await wait()
    const cl = container.querySelector(".SourceList")

    expect(cl).toBeInTheDocument()
    // header
    expect(queryByText("Sources")).toBeInTheDocument()

    // titles
    expect(queryByText("Monograph One")).toBeInTheDocument()
    expect(queryByText("Monograph Two")).toBeInTheDocument()

  })
})