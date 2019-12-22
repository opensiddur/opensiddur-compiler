/* ContributorRecord.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, wait } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import ContributorRecord from "../ContributorRecord"

import UserApi from "../UserApi"
import UserInfo from "../UserInfo"

const mockUserGet = jest.fn()
jest.mock("../UserApi", () => {
  return jest.fn().mockImplementation( () => ({
      get: mockUserGet
  }))
})

describe("ContributorRecord component", () => {
  afterEach(() => {
    mockUserGet.mockReset()
  })

  const userName = "testuser"
  const userText = "Mr Test User"
  const orgText = "Mock Organization"

  it("renders a user with name only", async () => {

    const infoWithNameOnly = new UserInfo("testuser", userText)

    mockUserGet.mockResolvedValue(infoWithNameOnly)

    const { getByText } = render(<ContributorRecord user={userName} />)
    expect(getByText(userName)).toBeInTheDocument()

    expect(mockUserGet).toHaveBeenCalledTimes(1)
    expect(mockUserGet.mock.calls[0][0]).toBe(userName)

    await wait()
    expect(getByText(userText)).toBeInTheDocument()
  })

  it("renders an organization name only", async () => {

    const infoWithOrgOnly = new UserInfo("testuser", null, orgText)

    mockUserGet.mockResolvedValue(infoWithOrgOnly)

    const { getByText } = render(<ContributorRecord user={userName} />)
    expect(getByText(userName)).toBeInTheDocument()

    expect(mockUserGet).toHaveBeenCalledTimes(1)
    expect(mockUserGet.mock.calls[0][0]).toBe(userName)

    await wait()
    expect(getByText(orgText)).toBeInTheDocument()
  })

  it("renders a name and organization name", async () => {

    const infoWithBoth = new UserInfo("testuser", userText, orgText)

    mockUserGet.mockResolvedValue(infoWithBoth)

    const { getByText } = render(<ContributorRecord user={userName} />)
    expect(getByText(userName)).toBeInTheDocument()

    expect(mockUserGet).toHaveBeenCalledTimes(1)
    expect(mockUserGet.mock.calls[0][0]).toBe(userName)

    await wait()
    expect(getByText(new RegExp(userText))).toBeInTheDocument()
    expect(getByText(new RegExp(orgText))).toBeInTheDocument()
  })
})