/* ContributorList.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render, wait } from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import ContributorList from "../ContributorList"

import UserApi from "../UserApi"
import UserInfo from "../UserInfo"
// this is kind of ugly, since we're mocking something called downstream...
const mockUserGet = jest.fn()

describe("ContributorList", () => {
  let realUserGet

  beforeAll( () => {
    realUserGet = UserApi.get
    UserApi.get = mockUserGet
  })

  beforeEach( () => {
    mockUserGet.mockImplementation( (userName) => {
      return Promise.resolve(new UserInfo(null, userName, null)) } )
  })

  afterEach( () => {
    mockUserGet.mockReset()
  })

  afterAll( () => {
    UserApi.get = realUserGet
  })

  it("lists no contributors if all the types are empty", () => {
    const emptySet = new Set()
    const emptyContributors = {
      "aut" : emptySet,
      "ann" : emptySet,
      "ctb" : emptySet,
      "cre" : emptySet,
      "edt" : emptySet,
      "fac" : emptySet,
      "fnd" : emptySet,
      "mrk" : emptySet,
      "oth" : emptySet,
      "pfr" : emptySet,
      "spn" : emptySet,
      "trc" : emptySet,
      "trl" : emptySet
    }
    const { container } = render(<ContributorList contributors={emptyContributors}/> )
    const cl = container.querySelector(".ContributorList")

    expect(cl).toBeInTheDocument()
    expect(cl.childElementCount).toBe(0)
  })

  it("lists a list of contributors with headers if some of the types are present", async () => {
    const emptySet = new Set()
    const nonEmptyContributors = {
      "aut" : emptySet,
      "ann" : emptySet,
      "ctb" : emptySet,
      "cre" : emptySet,
      "edt" : new Set(["/user/Editor1", "/user/Editor2"]),
      "fac" : emptySet,
      "fnd" : emptySet,
      "mrk" : emptySet,
      "oth" : emptySet,
      "pfr" : emptySet,
      "spn" : emptySet,
      "trc" : new Set(["/user/Transcriber1"]),
      "trl" : emptySet
    }
    const { container, queryByText } = render(<ContributorList contributors={nonEmptyContributors}/> )
    await wait()
    const cl = container.querySelector(".ContributorList")

    expect(cl).toBeInTheDocument()
    expect(queryByText("Contributors")).toBeInTheDocument()
    expect(queryByText("Editors")).toBeInTheDocument()
    expect(queryByText("Transcribers")).toBeInTheDocument()
    expect(queryByText("Authors")).not.toBeInTheDocument()

    expect(queryByText("Editor1")).toBeInTheDocument()
    expect(queryByText("Editor2")).toBeInTheDocument()
    expect(queryByText("Transcriber1")).toBeInTheDocument()

  })
})