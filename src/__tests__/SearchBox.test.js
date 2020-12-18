/* Tests for Search box
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from 'react'
import { render, fireEvent, waitForElement } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBox from "../SearchBox"

describe("SearchBox", () => {
  const mockQueryCallback = jest.fn(queryText => queryText)
  const searchBox = <SearchBox placeholder="search" queryCallback={mockQueryCallback}/>
  const submitButtonText = "Find"

  afterEach( () => {
    mockQueryCallback.mockReset()
  })

  it("Returns a blank string when Find is pressed and no query is entered", () => {
    const { getByText } = render(searchBox)
    fireEvent.click(getByText(submitButtonText))
    expect(mockQueryCallback).toHaveBeenCalledTimes(1)
    expect(mockQueryCallback.mock.results[0].value).toBe("");
  })

  it("fires a callback when a new search is performed", () => {
    const queryString = "my query"
    const { getByPlaceholderText, getByText } = render(searchBox)
    userEvent.type(getByPlaceholderText("search"), queryString)

    fireEvent.click(getByText(submitButtonText))
    expect(mockQueryCallback).toHaveBeenCalledTimes(1)
    expect(mockQueryCallback.mock.calls[0][0]).toBe(queryString);
  })

})