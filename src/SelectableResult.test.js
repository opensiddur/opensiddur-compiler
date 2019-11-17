/* Test SelectableResult
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import SelectableResult from "./SelectableResult"
import {render} from "@testing-library/react"

describe("SelectableResult", () => {
  const selectionCallback = jest.fn(r => r)
  const testTitle = "Test title"

  afterEach( () => {
    selectionCallback.mockReset()
  })

  it("renders without context and selects", () => {
    const result = {
      title: testTitle
    }
    const selectableResult = <SelectableResult result={result} selectionCallback={selectionCallback} />
    const { container } = render(selectableResult)
    const titleElement = container.querySelector(".SelectableResultTitle")
    expect(titleElement).toBeDefined()
    expect(titleElement.textContent).toBe(testTitle)

    const listElement = container.querySelector(".SelectableResult")
    listElement.click()
    expect(selectionCallback).toHaveBeenCalledTimes(1)
    expect(selectionCallback.mock.calls[0][0]).toMatchObject(result)
  })

  it("renders with search context and selects", () => {
    const context1 = "One"
    const context2 = "Two"
    const result = {
      title: testTitle,
      context: [context1, context2]
    }
    const selectableResult = <SelectableResult result={result} selectionCallback={selectionCallback} />
    const { container } = render(selectableResult)
    const titleElement = container.querySelector(".SelectableResultTitle")
    expect(titleElement).toBeDefined()
    expect(titleElement.textContent).toBe(testTitle)

    const contexts = container.querySelectorAll(".SelectableResultContext")
    expect(contexts.length).toBe(2)
    expect(contexts[0].textContent).toBe(context1)
    expect(contexts[1].textContent).toBe(context2)

    const listElement = container.querySelector(".SelectableResult")
    listElement.click()
    expect(selectionCallback).toHaveBeenCalledTimes(1)
    expect(selectionCallback.mock.calls[0][0]).toMatchObject(result)

  })
})