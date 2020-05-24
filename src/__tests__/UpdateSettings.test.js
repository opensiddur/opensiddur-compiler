/* UpdateSettings.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {text2xml} from "../TestUtils"
import UpdateSettings, {mergeSettings, parseSettings} from "../UpdateSettings"
import TransformerMetadata from "../TransformerMetadata"
import {cleanup, render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import DocumentApi from "../DocumentApi"
import {META_SETTINGS} from "../Transformer"

describe("parseSettings", () => {
  it("parses all types of settings structures", () => {
    const settingsXml = text2xml(`
    <tei:fs
      type="settings" 
      xmlns:tei="http://www.tei-c.org/ns/1.0" 
      xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0">
      <tei:f name="yes"><j:yes/></tei:f>
      <tei:f name="no"><j:no/></tei:f>
      <tei:f name="maybe"><j:maybe/></tei:f>
      <tei:f name="on"><j:on/></tei:f>
      <tei:f name="off"><j:off/></tei:f>
      <tei:f name="binary1"><tei:binary>1</tei:binary></tei:f>
      <tei:f name="binary0"><tei:binary>false</tei:binary></tei:f>
      <tei:f name="string"><tei:string>STRINGY</tei:string></tei:f>
      <tei:f name="numeric"><tei:numeric>100</tei:numeric></tei:f>
      <tei:f name="coll">
        <tei:vColl>
            <tei:string>ONE</tei:string>
            <tei:string>TWO</tei:string>  
        </tei:vColl>
      </tei:f>
      <tei:f name="complex">
        <tei:fs type="complex_type">
            <tei:f name="feature">value</tei:f>
        </tei:fs>
      </tei:f>
      <tei:f name="literal">literal text</tei:f>
      <tei:f name="default"><tei:default/></tei:f>
      <tei:f name="value" value="my_value"/>
    </tei:fs>`).documentElement

    const result=parseSettings([settingsXml])

    const expected = {
      settings: {
        yes: "YES",
        no: "NO",
        maybe: "MAYBE",
        on: "ON",
        off: "OFF",
        binary1: true,
        binary0: false,
        string: "STRINGY",
        numeric: "100",
        coll: ["ONE", "TWO"],
        complex: {
          complex_type : {
            feature: "value"
          }
        },
        literal: "literal text",
        //default: "MAYBE",
        value: "my_value"
      }
    }

    expect(result).toMatchObject([expected])
  })
})

describe("mergeSettings", () => {
  it("returns all new settings if there are no old settings", () => {
    const newSettings = {
      s1: {
        f1: "v1",
        f2: "v2"
      },
      s2: {
        f1: "v3"
      }
    }

    const oldSettings = {}

    const result = mergeSettings(oldSettings, newSettings)

    const expected = newSettings

    expect(result).toMatchObject(expected)
  })

  it("returns updated settings if there are any with the same type/name", () => {
    const oldSettings = {
      s1: {
        f1: "v1",
        f2: "v2"
      },
      s2: {
        f1: "v3"
      }
    }

    const newSettings = {
      s1: {
        f1: "vnew"
      },
      s3: {
        f4: "v4"
      }
    }

    const result = mergeSettings(oldSettings, newSettings)

    const expected = {
      s1: {
        f1: "vnew",
        f2: "v2"
      },
      s2: {
        f1: "v3"
      },
      s3: {
        f4: "v4"
      }
    }

    expect(result).toMatchObject(expected)
  })

  it("returns all old settings if there are no new settings", () => {
    const oldSettings = {
      s1: {
        f1: "v1",
        f2: "v2"
      },
      s2: {
        f1: "v3"
      }
    }

    const result = mergeSettings(oldSettings, {})

    const expected = oldSettings

    expect(result).toMatchObject(expected)
  })
});

describe("UpdateSettings", () => {
  const mockNext = jest.fn()
  const mockNextWithMetadataUpdate = jest.fn()
  const mockDocGet = jest.fn()
  const mockGetFragment = jest.fn()

  const mockChain = {
    next: mockNext,
    nextWithMetadataUpdate: mockNextWithMetadataUpdate
  }

  let realGetFragment
  let realDocGet

  beforeAll(() => {
    realGetFragment = DocumentApi.getFragment
    realDocGet = DocumentApi.get
    DocumentApi.getFragment = mockGetFragment
    DocumentApi.get = mockDocGet
    })

  afterEach( () => {
    mockNext.mockReset()
    mockNextWithMetadataUpdate.mockReset()
    mockDocGet.mockReset()
    mockGetFragment.mockReset()
    cleanup()
  } )

  afterAll(() => {
    DocumentApi.getFragment = realGetFragment
    DocumentApi.get = realDocGet
  })

  it("updates the metadata when new settings are available", () => {
    const nodes = text2xml(`<node xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
            jf:set="/data/original/document#fragment"
            >Child</node>`).documentElement

    const oldSettings = {
      s1: {
        f1: "YES"
      }
    }
    const oldMetadata = new TransformerMetadata().set(META_SETTINGS, oldSettings)

    const newSettings = {
      s2: {
        f2: "YES"
      }
    }

    const combinedSettings = {
      s1: {
        f1: "YES"
      },
      s2: {
        f2: "YES"
      }
    }

    const expectedMetadata = new TransformerMetadata().set(META_SETTINGS, combinedSettings)

    const mockReturn = "chained"

    mockNextWithMetadataUpdate.mockReturnValue(mockReturn)

    const mockSettings = text2xml(`<tei:x xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0">
      <tei:fs type="s2" xml:id="fragment">
        <tei:f name="f2"><j:yes/></tei:f>
      </tei:fs>
    </tei:x>`)
    console.log(mockSettings)
    mockDocGet.mockResolvedValue(mockSettings)
    mockGetFragment.mockReturnValue(mockSettings.documentElement.firstChild)

    const { queryByText } = render(<UpdateSettings nodes={[nodes]} metadata={oldMetadata} chain={mockChain} documentApi="original"/>)

    expect(mockDocGet).toHaveBeenCalledTimes(1)
    expect(mockDocGet.mock.calls[0][0]).toBe("document")
    expect(mockDocGet.mock.calls[0][2]).toBe("original")

    expect(mockGetFragment).toHaveBeenCalledTimes(1)

    expect(mockNextWithMetadataUpdate).toHaveBeenCalledTimes(1)
    expect(mockNextWithMetadataUpdate.mock.calls[0][0]).toMatchObject({ nodes: [nodes] })
    expect(mockNextWithMetadataUpdate.mock.calls[0][1]).toMatchObject(expectedMetadata)

    expect(queryByText(mockReturn)).toBeInTheDocument()
  })

  it("passes to children when there are no new settings", () => {
    const nodes = text2xml(`<node>Child</node>`).documentElement
    const metadata = new TransformerMetadata().set("something", "value")
    const mockReturn = "chained"

    mockNext.mockReturnValue(mockReturn)

    const { queryByText } = render(<UpdateSettings nodes={[nodes]} metadata={metadata} chain={mockChain}/>)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext.mock.calls[0][0]).toMatchObject({
      nodes: [nodes],
      metadata: metadata
    })

    expect(queryByText(mockReturn)).toBeInTheDocument()
  })
})