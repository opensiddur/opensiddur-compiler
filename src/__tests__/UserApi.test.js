/* UserApi.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import UserApi from "../UserApi"
import UserInfo from "../UserInfo"
import {ApiError} from "../BaseApi"

describe("user API", () => {
  const userApi = new UserApi()

  const mockUserName = "mockuser"
  const parsableUserXml = `<tei:contributor xmlns:tei="http://www.tei-c.org/ns/1.0">
    <tei:idno>identifier</tei:idno>
    <tei:name>Test User</tei:name>
  </tei:contributor>`
  const parsableOrgXml = `<tei:contributor xmlns:tei="http://www.tei-c.org/ns/1.0">
    <tei:idno>identifier</tei:idno>
    <tei:orgName>Test Organization</tei:orgName>
  </tei:contributor>`
  const unparsableXml = "<testXml></closeADifferentTag>"

  let windowSpy

  beforeEach(() => {
    windowSpy = jest.spyOn(global, 'window', 'get')

    windowSpy.mockImplementation(() => ({
      location: {
        origin: 'https://test.example.com'
      }
    }))
  })

  afterEach(() => {
    windowSpy.mockRestore()
  })


  it("should fetch and parse a contributor record", async () => {
    const spy = jest.spyOn(userApi, 'fetchText').mockResolvedValue(parsableUserXml)

    const result = await userApi.get(mockUserName)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/user/${mockUserName}`))
    expect(result).toMatchObject(new UserInfo("identifier", "Test User"))

    spy.mockRestore()
  })

  it("should fetch and parse a organization record", async () => {
    const spy = jest.spyOn(userApi, 'fetchText').mockResolvedValue(parsableOrgXml)

    const result = await userApi.get(mockUserName)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatchObject(
      new URL(`https://test.example.com/user/${mockUserName}`))
    expect(result).toMatchObject(new UserInfo("identifier", null, "Test Organization"))

    spy.mockRestore()
  })

  it("should fail on unparsable XML", async () => {
    const spy = jest.spyOn(userApi, 'fetchText').mockResolvedValue(unparsableXml)

    await expect(userApi.get(mockUserName)).
    rejects.toMatchObject(new ApiError(false, "parse failed", expect.any(String)))

    spy.mockRestore()

  })
})