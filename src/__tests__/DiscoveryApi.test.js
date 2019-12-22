import DiscoveryApi from '../DiscoveryApi.js'
import {ApiError} from "../BaseApi"

it("correctly parses a valid discovery API HTML", () => {
  const html = `
    <html>
        <head>
            <title>Test Discovery API</title>
            <meta name="startIndex" content="1"/>
            <meta name="itemsPerPage" content="5"/>
            <meta name="totalResults" content="3"/>
        </head>
        <body>
            <ul class="results">
                <li class="result">
                    <a class="document" href="/link/to/document1">first document</a>
                    <a class="alt" property="prop1" href="/link/to/document1/prop1">property 1</a>
                    <a class="alt" property="prop2" href="/link/to/document1?prop2=true">property 2</a>
                </li>
                <li class="result">
                    <a class="document" href="/link/to/document2">second document</a>
                </li>
                <li class="result">
                    <a class="document" href="/link/to/document3">third document</a>
                    <ol class="contexts">
                        <li class="context"><span class="previous">previous </span><span class="match">match</span><span class="following"> following</span></li>
                        <li class="context"><span class="previous">previous two </span><span class="match">match</span><span class="following"> following two</span></li>
                    </ol>
                </li>
            </ul>
        </body>
    </html>`
  const discoveryApi = new DiscoveryApi()
  const result = discoveryApi.parseDiscoveryHtml(html)

  expect(result.startIndex).toBe(1)
  expect(result.endIndex).toBe(3)
  expect(result.itemsPerPage).toBe(5)
  expect(result.totalResults).toBe(3)

  expect(result.items.length).toBe(3)

  expect(result.items[0].title).toBe("first document")
  expect(result.items[0].url).toBe("/link/to/document1")
  expect(result.items[0].prop1).toBe("/link/to/document1/prop1")
  expect(result.items[0].prop2).toBe("/link/to/document1?prop2=true")
  expect(result.items[0].context).toStrictEqual([])

  expect(result.items[1].title).toBe("second document")
  expect(result.items[1].url).toBe("/link/to/document2")
  expect(result.items[1].context).toStrictEqual([])

  expect(result.items[2].title).toBe("third document")
  expect(result.items[2].url).toBe("/link/to/document3")
  expect(result.items[2].context).toStrictEqual(["previous match following", "previous two match following two"])
})

describe("fetching data", () => {
  let windowSpy

  beforeEach(() => {
    fetch.resetMocks();
    windowSpy = jest.spyOn(global, 'window', 'get')

    windowSpy.mockImplementation(() => ({
      location: {
        origin: 'https://test.example.com'
      }
    }))
  })

  afterEach(() => {
    windowSpy.mockRestore()
    global.fetch.mockClear()
  })


  const minimalReturnHtml = `<html>
        <head>
            <title>Test Discovery API</title>
            <meta name="startIndex" content="1"/>
            <meta name="itemsPerPage" content="5"/>
            <meta name="totalResults" content="0"/>
        </head>
        <body>
            <ul class="results"></ul>
        </body>
    </html>`

  const notDiscoveryHtml = `<html>
        <head><title>Not discovery</title></head>
        <body><p>something else</p></body>
    </html>`

  const mockReturnMinimal = minimalReturnHtml

  const expectedMinimalResponse = {
    success: true,
    startIndex: 1,
    itemsPerPage: 5,
    totalResults: 0,
    endIndex: 0,
    items: []
  }

  const mockApiError = ["Bad request", { status: 400 }]

  const mockNetworkError = new TypeError("network error")

  const discoveryApi = new DiscoveryApi()

  it("calls fetch with no query string if none is provided", async () => {
    fetch.mockResponseOnce(mockReturnMinimal)

    await discoveryApi.list("discovery")
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toMatchObject(new URL("https://test.example.com/api/data/discovery?start=1&max-results=100"))
  })

  it("calls fetch with query parameters if they are provided", async () => {
    fetch.mockResponseOnce(mockReturnMinimal)

    await discoveryApi.list("discovery", "query one", 10, 50)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toMatchObject(new URL(
        "https://test.example.com/api/data/discovery?q=query+one&start=10&max-results=50"))
  })

  it("calls fetch with quoted query parameters if they are provided", async () => {
    fetch.mockResponseOnce(mockReturnMinimal)

    await discoveryApi.list("discovery", "\"query one\"", 10, 50)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toMatchObject(new URL(
      "https://test.example.com/api/data/discovery?q=%22query+one%22&start=10&max-results=50"))

  })

  it("fetches and parses discovery data, if everything works right", async () => {
    fetch.mockResponseOnce(mockReturnMinimal)

    let result = await discoveryApi.list("discovery")

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toMatchObject(new URL("https://test.example.com/api/data/discovery?start=1&max-results=100"))
    expect(result).toStrictEqual(expectedMinimalResponse)

  })

  it("returns a failed promise if fetch returns a failed promise",  async () => {
    fetch.mockRejectOnce(mockNetworkError)

    await expect(discoveryApi.list("discovery")).rejects.toMatchObject(new ApiError(false, "fetch failed", "network error"))

  })

  it("returns a failed promise if fetch throws an exception", async () => {
    fetch.mockImplementation( () => { throw new Error("test error") } )

    await expect(discoveryApi.list("discovery")).rejects.toMatchObject(new ApiError(false, "fetch failed", "test error"))

  })

  it("returns a failed promise if the data are not parsable as a discovery API", async () => {
    fetch.mockResponseOnce(notDiscoveryHtml)

    await expect(discoveryApi.list("discovery")).rejects.toMatchObject({success: false, status: "parse failed"})
  })

  it("returns a failed promise if fetch returns not OK",  async () => {
    fetch.mockResponseOnce("Bad request", { status: 400 })

    await expect(discoveryApi.list("discovery")).rejects.toMatchObject(new ApiError(false, "400", "Bad request"))

  })

})