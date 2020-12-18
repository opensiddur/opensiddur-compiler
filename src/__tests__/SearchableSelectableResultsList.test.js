/* SearchableSelectableResultsList test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, fireEvent, wait } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'

import SearchableSelectableResultsList from "../SearchableSelectableResultsList"
import DiscoveryApi from "../DiscoveryApi"

const mockDiscoveryList = jest.fn()

describe("Searchable, selectable results list", () => {
  let realDiscoveryList
  const selectionCallback = jest.fn(s => s)

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map( (idx) => {
    return {
      title: `Title ${idx}`,
      url: `/title/t${idx}`
    }
  })

  beforeAll( () => {
    realDiscoveryList = DiscoveryApi.list
    mockDiscoveryList.mockImplementation(
      (apiName, queryString = "", start = 1, itemsPerPage = 5) => {
        return Promise.resolve({
          startIndex: start,
          totalResults: items.length,
          itemsPerPage: itemsPerPage,
          items: items.slice(start - 1, start + itemsPerPage - 1)
        })
      })
    DiscoveryApi.list = mockDiscoveryList
  })

  afterAll(() => {
    DiscoveryApi.list = realDiscoveryList
  })

  const ssrl = <SearchableSelectableResultsList api="discovery" itemsPerPage="5" selectionCallback={selectionCallback} />

  it("loads some data when first rendered", async () => {
    const { getByText, queryByText, getByPlaceholderText } = render(ssrl)

    expect(mockDiscoveryList).toHaveBeenCalledTimes(1)
    expect(mockDiscoveryList.mock.calls[0][0]).toBe("discovery")
    expect(mockDiscoveryList.mock.calls[0][1]).toBe("")
    expect(mockDiscoveryList.mock.calls[0][2]).toBe(1)
    expect(mockDiscoveryList.mock.calls[0][3]).toBe(5)

    await wait()

    // pager
    expect(getByText("1")).toBeInTheDocument()
    expect(getByText("2")).toBeInTheDocument()
    expect(queryByText("3")).not.toBeInTheDocument()

    // selectable titles
    expect(getByText("Title 1")).toBeInTheDocument()
    expect(getByText("Title 5")).toBeInTheDocument()
    expect(queryByText("Title 6")).not.toBeInTheDocument()

    // when selected
    const title2 = getByText("Title 2")
    title2.click()
    expect(selectionCallback).toHaveBeenCalledTimes(1)
    expect(selectionCallback.mock.calls[0][0]).toStrictEqual(items[1])

    // when paged
    const page2 = getByText("2")
    page2.click()
    await wait()
    expect(mockDiscoveryList).toHaveBeenCalledTimes(2)
    expect(mockDiscoveryList.mock.calls[1][0]).toBe("discovery")
    expect(mockDiscoveryList.mock.calls[1][1]).toBe("")
    expect(mockDiscoveryList.mock.calls[1][2]).toBe(6)
    expect(mockDiscoveryList.mock.calls[1][3]).toBe(5)

    // when queried
    const queryBox = getByPlaceholderText(/Search/i)
    const queryButton = getByText("Find")
    userEvent.type(queryBox, "my query")
    queryButton.click()
    await wait()
    expect(mockDiscoveryList).toHaveBeenCalledTimes(3)
    expect(mockDiscoveryList.mock.calls[2][0]).toBe("discovery")
    expect(mockDiscoveryList.mock.calls[2][1]).toBe("my query")
    expect(mockDiscoveryList.mock.calls[2][2]).toBe(1)
    expect(mockDiscoveryList.mock.calls[2][3]).toBe(5)



  })

})