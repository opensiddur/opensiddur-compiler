/* Chooser test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render, wait} from '@testing-library/react'
import Chooser from "./Chooser"
import {Router} from "react-router-dom"
import {createBrowserHistory, createMemoryHistory} from "history"
import '@testing-library/jest-dom/extend-expect'

import DiscoveryApi from "./DiscoveryApi"
import {waitForElement} from "@testing-library/dom"

const mockDiscoveryList = jest.fn()
jest.mock("./DiscoveryApi", () => {
  return jest.fn().mockImplementation( () => {
    return {
      list: mockDiscoveryList
    }
  })
})


describe("Chooser", () => {
  // TODO: I copied this from SearchableSelectableResultsList.test
  // we should have the mock in its own file, since I'm using it more than once
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map( (idx) => {
    return {
      title: `Title ${idx}`,
      url: `http://website/title/t${idx}`
    }
  })

  beforeAll( () => {
    mockDiscoveryList.mockImplementation(
      (apiName, queryString = "", start = 1, itemsPerPage = 5) => {
        return Promise.resolve({
          startIndex: start,
          totalResults: items.length,
          itemsPerPage: itemsPerPage,
          items: items.slice(start - 1, start + itemsPerPage - 1)
        })
      })
  })


  it("should not display a selection when first rendered, " +
    "then should display the selection once selected, " +
    "then should clear the selection if cleared" +
    "then display a different selection if selected" +
    "then should route to the viewer when the selection ", async () => {
    const history = createBrowserHistory()
    const { container, getByText, queryByText } = render(<Router history={history}><Chooser /></Router>)

    await wait()
    expect(queryByText("View: ")).not.toBeInTheDocument()

    getByText("Title 1").click()
    const selector = queryByText(/View: /i)
    expect(selector).toBeInTheDocument()
    expect(selector).toHaveTextContent("View: Title 1")

    getByText("X").click()
    const selectorHidden = queryByText(/View: /i)
    expect(selectorHidden).not.toBeInTheDocument()

    getByText("Title 2").click()
    const selector2 = queryByText(/View: /i)
    expect(selector2).toBeInTheDocument()
    expect(selector2).toHaveTextContent("View: Title 2")

    const link = queryByText("View: Title 2")
    expect(link).toBeInTheDocument()

    link.click()
    await wait()
    expect(history.location.pathname).toBe("/viewer/t2")
  })

})