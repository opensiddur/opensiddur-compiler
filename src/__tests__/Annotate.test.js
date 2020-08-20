/* Annotate.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import Annotate, {isFirstPart} from "../Annotate"

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

    const attributeNames = ["special", "jf:annotation", "jf:conditional-instruction"]

    attributeNames.forEach( (attributeName) => {
      const recursionFunction = jest.fn()
      const doc = text2xml(`<tei:seg 
        xmlns:tei="http://www.tei-c.org/ns/1.0" 
        xmlns:jf="http://jewishliturgy.org/ns/jlptei/1.0/flat" 
        `+ attributeName +`="/data/notes/notationdocument#one">Data</tei:seg>`)
      const xmlNode = [doc.documentElement]

      const { container } = render(<Annotate nodes={xmlNode} metadata={metadata} chain={mockChain}
        transformerRecursionFunction={recursionFunction}
        {... ((attributeName !== "special") ? {} : { attribute: attributeName} )} />)

      expect(recursionFunction).toHaveBeenCalledTimes(1)
      expect(recursionFunction.mock.calls[0][0]).toBe("notationdocument")
      expect(recursionFunction.mock.calls[0][1]).toBe("one")
      expect(recursionFunction.mock.calls[0][2]).toBe(metadata)
      expect(recursionFunction.mock.calls[0][3]).toBe("notes")

      expect(mockChainNext).toHaveBeenCalledTimes(1)
      recursionFunction.mockReset()
      mockChainNext.mockReset()
      cleanup()
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

describe("isFirstPart", () => {
  const xmlNodes = text2xml(`<root xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">
        <noPart>No part!</noPart>
        <differentPart jf:part="diff">diff</differentPart>
        <firstPart jf:part="partOf">first</firstPart>
        <hierarchy>
            <anotherDifferentPart jf:part="diff2">diffy</anotherDifferentPart>
            <secondPart jf:part="partOf">second</secondPart>
        </hierarchy>
        
   </root>`)

  it("returns true when an element node has jf:part and no preceding elements with the same partid", () => {
    const yesItIs = xmlNodes.getElementsByTagNameNS("", "firstPart").item(0)
    const result = isFirstPart(yesItIs)
    expect(result).toBe(true)
  })

  it("returns false when an element node has jf:part and has preceding elements with the same partid", () => {
    const noItIsnt = xmlNodes.getElementsByTagNameNS("", "secondPart").item(0)
    const result = isFirstPart(noItIsnt)
    expect(result).toBe(false)
  })

  it("returns true when the node does not have @jf:part", () => {
    const noPart = xmlNodes.getElementsByTagNameNS("", "noPart").item(0)
    const result = isFirstPart(noPart)
    expect(result).toBe(true)
  })

  it("returns false when the node is not an element node", () => {
    const notAnElement = xmlNodes.getElementsByTagNameNS("", "firstPart").item(0).childNodes.item(0)
    const result = isFirstPart(notAnElement)
    expect(result).toBe(true)
  })
})