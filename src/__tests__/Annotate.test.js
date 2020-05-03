/* Annotate.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import Annotate from "../Annotate"

describe("Annotate", () => {
  const mockChainNext = jest.fn()
  const mockChain = {
    next: mockChainNext
  }

  beforeEach( () => {
    mockChainNext.mockReset()
    mockChainNext.mockReturnValue("CHAINED")
  })

  it("recurses through the referenced annotation using the 'notes' API", () => {
    const metadata = new TransformerMetadata()

    const attributeNames = ["jf:annotation", "jf:conditional-instruction"]

    attributeNames.forEach( (attributeName) => {
      const recursionFunction = jest.fn()
      const doc = text2xml(`<tei:seg 
        xmlns:tei="http://www.tei-c.org/ns/1.0" 
        xmlns:jf="http://jewishliturgy.org/ns/jlptei/1.0/flat" 
        `+ attributeName +`="/data/notes/notationdocument#one">Data</tei:seg>`)
      const xmlNode = [doc.documentElement]

      const { container } = render(<Annotate nodes={xmlNode} metadata={metadata} chain={mockChain}
        transformerRecursionFunction={recursionFunction}
        {... ((attributeName === "jf:annotation") ? {} : { attribute: attributeName} )} />)

      expect(recursionFunction).toHaveBeenCalledTimes(1)
      expect(recursionFunction.mock.calls[0][0]).toBe("notationdocument")
      expect(recursionFunction.mock.calls[0][1]).toBe("one")
      expect(recursionFunction.mock.calls[0][2]).toBe(metadata)
      expect(recursionFunction.mock.calls[0][3]).toBe("notes")

      expect(mockChainNext).toHaveBeenCalledTimes(1)
      recursionFunction.mockReset()
      mockChainNext.mockReset()
    })

  })

  it("chains next if there is no annotation attribute", () => {
    const metadata = new TransformerMetadata()

    const recursionFunction = jest.fn()
    const doc = text2xml(`<tei:seg 
      xmlns:tei="http://www.tei-c.org/ns/1.0" 
      >Data</tei:seg>`)
    const xmlNode = [doc.documentElement]

    const { container } = render(<Annotate nodes={xmlNode} metadata={metadata} chain={mockChain}
                                           transformerRecursionFunction={recursionFunction}
                                            />)

    expect(recursionFunction).toHaveBeenCalledTimes(0)
    expect(mockChainNext).toHaveBeenCalledTimes(1)
  })
})
