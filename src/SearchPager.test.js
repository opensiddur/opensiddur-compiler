/* SearchPager test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, fireEvent, waitForElement } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchPager, {SearchPagerLib} from "./SearchPager"

describe("Search pager helper library", () => {
  const defaultWindow = 10
  const defaultItemsPerPage = 20
  const defaultStartIndex = 1
  const defaultResults = {
    totalResults: defaultItemsPerPage,
    startIndex: defaultStartIndex,
    itemsPerPage: defaultItemsPerPage
  }

  test("numberOfPages() returns 0 when there are no results", () => {
    const results = {
      totalResults: 0,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)

    expect(pagerLib.numberOfPages()).toBe(0)
  })

  test("numberOfPages() returns 1 when there are fewer than 1 page of results", () => {
    const results = {
      totalResults: 19,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)

    expect(pagerLib.numberOfPages()).toBe(1)
  })

  test("numberOfPages() returns correctly when the items per page is evenly divisible by the total items", () => {
    const results = {
      totalResults: defaultItemsPerPage * 3,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)

    expect(pagerLib.numberOfPages()).toBe(3)
  })

  test("numberOfPages() returns correctly when the items per page is not divisible by the total items", () => {
    const results = {
      totalResults: defaultItemsPerPage * 3 + 1,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)

    expect(pagerLib.numberOfPages()).toBe(4)
  })

  test("pageToStartIndex() returns correct start indexes for various pages", () => {
    const pagerLib = new SearchPagerLib(defaultResults, defaultWindow)
    expect(pagerLib.pageToStartIndex(1)).toBe(1)
    expect(pagerLib.pageToStartIndex(2)).toBe(defaultItemsPerPage + 1)
  })

  test("startIndexToPage() returns correct pages for various indices", () => {
    const pagerLib = new SearchPagerLib(defaultResults, defaultWindow)
    expect(pagerLib.startIndexToPage(1)).toBe(1)
    expect(pagerLib.startIndexToPage(defaultItemsPerPage + 1)).toBe(2)
    expect(pagerLib.startIndexToPage(defaultItemsPerPage * 2 - 1)).toBe(2)
  })

  test("endOfWindow() returns the full window if there are enough pages", () => {
    const windowSize = 5
    const results = {
      totalResults: defaultItemsPerPage * 7,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }

    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.endOfWindow()).toBe(6)
  })

  test("endOfWindow() returns the last page if there are not enough pages", () => {
    const windowSize = 10
    const results = {
      totalResults: defaultItemsPerPage * 5,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.endOfWindow()).toBe(5)
  })

  test("startOfWindow() returns the first page if there are not enough pages", () => {
    const windowSize = 10
    const results = {
      totalResults: defaultItemsPerPage * 5,
      startIndex: defaultStartIndex + defaultItemsPerPage * 4,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.startOfWindow()).toBe(1)
  })

  test("startOfWindow() returns the beginning of the window if there are enough pages", () => {
    const windowSize = 2
    const results = {
      totalResults: defaultItemsPerPage * 5,
      startIndex: defaultStartIndex + defaultItemsPerPage * 3, // page 4
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.startOfWindow()).toBe(2)
  })

  test("pagesToShow() returns all the pages within the window", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage * 20,
      startIndex: defaultStartIndex + defaultItemsPerPage * 9, // page 10
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.pagesToShow()).toStrictEqual([7, 8, 9, 10, 11, 12, 13])
  })

  test("pagesToShow() window is cut off on the left side", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage * 20,
      startIndex: defaultStartIndex + defaultItemsPerPage, // page 2
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.pagesToShow()).toStrictEqual([1, 2, 3, 4, 5])
  })

  test("pagesToShow() window is cut off on the right side", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage * 20,
      startIndex: defaultStartIndex + defaultItemsPerPage * 18, // page 19
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.pagesToShow()).toStrictEqual([16, 17, 18, 19, 20])
  })

  test("showFastReverse() returns false if there are no pages to show", () => {
    const results = {
      totalResults: 0,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)
    expect(pagerLib.showFastReverse()).toBeFalsy()
  })

  test("showFastReverse() returns false if page 1 is shown", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage - 1,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.showFastReverse()).toBeFalsy()
  })

  test("showFastReverse() returns true if page 1 is not shown", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage * 20,
      startIndex: defaultStartIndex + defaultItemsPerPage * 4, // page 5
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.showFastReverse()).toBeTruthy()
  })

  test("showFastForward() returns false if there are no pages to show", () => {
    const results = {
      totalResults: 0,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, defaultWindow)
    expect(pagerLib.showFastForward()).toBeFalsy()
  })

  test("showFastForward() returns false if the last page is shown", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage - 1,
      startIndex: defaultStartIndex,
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.showFastForward()).toBeFalsy()
  })

  test("showFastForward() returns true if the last page is not shown", () => {
    const windowSize = 3
    const results = {
      totalResults: defaultItemsPerPage * 20,
      startIndex: defaultStartIndex + defaultItemsPerPage * 4, // page 5
      itemsPerPage: defaultItemsPerPage
    }
    const pagerLib = new SearchPagerLib(results, windowSize)
    expect(pagerLib.showFastForward()).toBeTruthy()
  })

})

describe("Search results pager", () => {
  const pagingCallback = jest.fn(page => page)
  const searchPager = (results) => <SearchPager window="10" pagingCallback={pagingCallback} results={results}/>

  afterEach( () => {
    pagingCallback.mockReset()
  })

  it("returns an empty div on undefined results", () => {
    const { container } = render(searchPager(undefined))
    const pagerDiv = container.querySelector("div.SearchPager")
    expect(pagerDiv).toBeDefined()
    expect(pagerDiv.childElementCount).toBe(0)
  })

  it("returns an empty div on empty results", () => {
    const results = {}
    const { container } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")
    expect(pagerDiv).toBeDefined()
    expect(pagerDiv.childElementCount).toBe(0)
  })

  it("renders a result counter when there is a valid discovery API results, but no results to render", () => {
    const results = {}
    const { container } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")
    expect(pagerDiv).toBeDefined()
    expect(pagerDiv.childElementCount).toBe(0)
  })

  test("when there is only 1 page of results", () => {
    const results = {
      startIndex: 1,
      totalResults: 5,
      itemsPerPage: 20
    }
    const { container } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")

    const resultsCount = pagerDiv.querySelector(".NumResults .Number")
    expect(resultsCount).toBeDefined()
    expect(resultsCount.textContent).toEqual("5")

    const pagingClicks = pagerDiv.querySelectorAll(".PagingClick")
    expect(pagingClicks.length).toBe(1) // shows that the fast fwd and fast reverse buttons are not there
    expect(pagingClicks[0].textContent).toBe("1")
    expect(pagingClicks[0].classList.contains("Selected"))

    // firing a click does nothing because the current page isn't changing
    fireEvent.click(pagingClicks[0])
    expect(pagingCallback).toHaveBeenCalledTimes(0)
  })

  test("starting at page 1...", () => {
    const results = {
      startIndex: 1,
      totalResults: 1000,
      itemsPerPage: 20
    }
    const {container, getByText } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")

    const resultsCount = pagerDiv.querySelector(".NumResults .Number")
    expect(resultsCount).toBeDefined()
    expect(resultsCount.textContent).toEqual("1000")

    // initially shows being on page 1
    const pagingClicks = pagerDiv.querySelectorAll(".PagingClick")
    expect(pagingClicks.length).toBe(12) // shows page 1 + 10 pages + a fast fwd button
    expect(pagingClicks[0].textContent).toBe("1")
    expect(pagingClicks[0].classList.contains("Selected")).toBeTruthy()

    const pageTen = getByText("10")
    expect(pageTen.classList.contains("Selected")).toBeFalsy()
    pageTen.click()
    expect(pagingCallback).toHaveBeenCalledTimes(1)
    expect(pagingCallback.mock.calls[0][0]).toBe(9*20 + 1)
  })

  test("going from page 15", () => {
    const results = {
      startIndex: 14 * 20 + 1,
      totalResults: 1000,
      itemsPerPage: 20
    }
    const {container, getByText } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")

    // click again to move forward
    const pageFifteen = getByText("15")
    expect(pageFifteen.classList.contains("Selected")).toBeTruthy()
    const pagingClicks = pagerDiv.querySelectorAll(".PagingClick")
    expect(pagingClicks.length).toBe(1 + 10 + 10 + 2) // shows page 15 + 10 pages each way + a fast fwd button + a fast reverse

    pagingClicks.forEach(pagingClick => {
      if (pagingClick.textContent !== "15") {
        expect(pagingClick.classList.contains("Selected")).toBeFalsy()
      } else {
        expect(pagingClick.classList.contains("Selected")).toBeTruthy()
      }
    })

    // the fast fwd and reverse buttons are shown
    expect(pagingClicks[0].classList.contains("FastReverse")).toBeTruthy()
    expect(pagingClicks[pagingClicks.length - 1].classList.contains("FastForward")).toBeTruthy()

    // clicking fast reverse fires an event
    pagingClicks[0].click()
    expect(pagingCallback).toHaveBeenCalledTimes(1)
    expect(pagingCallback.mock.calls[0][0]).toBe(1)
  })

  test("the fast forward button", () => {
    const results = {
      startIndex: 1,
      totalResults: 1000,
      itemsPerPage: 20
    }
    const {container } = render(searchPager(results))
    const pagerDiv = container.querySelector("div.SearchPager")

    // initially shows being on page 1
    const pagingClicks = pagerDiv.querySelectorAll(".PagingClick")

    // clicking fast forward fires an event and moves the selection
    pagingClicks[pagingClicks.length - 1].click()

    expect(pagingCallback).toHaveBeenCalledTimes(1)
    expect(pagingCallback.mock.calls[0][0]).toBe(1000-20 + 1)
  })
})