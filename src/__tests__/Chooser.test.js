/* Chooser test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render, wait} from '@testing-library/react'
import Chooser from "../Chooser"
import {Router} from "react-router-dom"
import {createBrowserHistory, createMemoryHistory} from "history"
import '@testing-library/jest-dom/extend-expect'

import DiscoveryApi from "../DiscoveryApi"
import {waitForElement} from "@testing-library/dom"

const mockDiscoveryList = jest.fn()


describe("Chooser", () => {
  // TODO: I copied this from SearchableSelectableResultsList.test
  // we should have the mock in its own file, since I'm using it more than once
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map( (idx) => {
    return {
      title: `Title ${idx}`,
      url: `http://website/title/t${idx}`
    }
  })

  let realDiscoveryList

  beforeAll( () => {
    realDiscoveryList = DiscoveryApi.list
    DiscoveryApi.list = mockDiscoveryList

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

  afterAll( () => {
    DiscoveryApi.list = realDiscoveryList
  })

  it("should not display a selection when first rendered, " +
    "then should route to the viewer when the selection is selected ", async () => {
    const history = createBrowserHistory()
    const { container, getByText, queryByText } = render(<Router history={history}><Chooser /></Router>)

    await wait()
    getByText("Title 1").click()
    expect(history.location.pathname).toBe("/viewer/t1")
  })

})