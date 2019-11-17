/* test SelectableResultsList
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import SelectableResultsList from "./SelectableResultsList"

describe("SelectableResultsList", () => {
  const selectionCallback = jest.fn(s => s)

  it("shows Loading when there is no data", () => {
    const results = undefined
    const selectableResultsList = <SelectableResultsList results={results} selectionCallback={selectionCallback} />
    const { container, getByText } = render(selectableResultsList)
    const loadMessage = getByText("Loading...")
    expect(loadMessage).toBeDefined()
    expect(container.getElementsByTagName("li").length).toBe(1)
  })

  it("renders results and passes on selections", () => {
    const item1 = {
      title: "Title One",
      url: "/title/one"
    }
    const item2 = {
      title: "Title Two",
      url: "/title/two"
    }
    const results = [item1, item2]

    const selectableResultsList = <SelectableResultsList results={results} selectionCallback={selectionCallback} />
    const { container, getByText } = render(selectableResultsList)
    const resultTwo = getByText("Title Two")
    expect(resultTwo).toBeDefined()
    resultTwo.click()
    expect(selectionCallback).toHaveBeenCalledTimes(1)
    expect(selectionCallback.mock.calls[0][0]).toStrictEqual(item2)
  })
})