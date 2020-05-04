/* Transformer.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import Transformer, {
  DOCUMENT_CONTEXT_SWITCH,
  ELEMENT_CONTEXT_SWITCH, LOCATION_CONTEXT_SWITCH,
  META_LANG,
  META_LICENSE,
  ParsedPtr,
  TEI_NS, TransformerContextChain
} from "../Transformer"
import TransformerMetadata from "../TransformerMetadata"
import {ContextSourceInfo} from "../ContextSourceInfo"
import {text2xml} from "../TestUtils"

// jsdom / jest document implementation does not support createRange yet, but there seems to be some hope that it
// will happen soon (see https://github.com/jsdom/jsdom/pull/2719 ). For now, we'll ignore the range tests
describe.skip("Transformer.getRange", () => {
  it("should extract a range from siblings", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:anchor jf:id="part0"/>
                    <tei:seg>One</tei:seg>
                    <tei:anchor jf:id="part1"/>
                    <tei:seg>Two</tei:seg>
                    <tei:seg>Three</tei:seg>
                    <tei:anchor jf:id="part2"/>
                    <tei:seg>Four</tei:seg>
                    <tei:anchor jf:id="part3"/>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = Transformer.getRange(xmlDocument, "range(part1,part2)")

    expect(result.childElementCount).toBe(4)
    const children = result.children
    expect(result.children[0].tagName).toBe("tei:anchor")
    expect(result.children[0].getAttribute("jf:id")).toBe("part1")

    expect(result.children[1].tagName).toBe("tei:seg")
    expect(result.children[1].textContent).toBe("Two")

    expect(result.children[2].tagName).toBe("tei:seg")
    expect(result.children[2].textContent).toBe("Three")

    expect(result.children[3].tagName).toBe("tei:anchor")
    expect(result.children[3].getAttribute("jf:id")).toBe("part2")
  })

  it("should extract a range from across hierarchies", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:anchor jf:id="part0"/>
                    <tei:div>
                      <tei:p>
                        <tei:seg jf:id="seg1">One</tei:seg>
                        <tei:anchor jf:id="part1"/>
                        <tei:seg jf:id="seg2">Two</tei:seg>
                      </tei:p>
                      <tei:seg jf:id="seg3">Three</tei:seg>
                      <tei:anchor jf:id="part2"/>
                      <tei:seg jf:id="seg4">Four</tei:seg>
                      <tei:anchor jf:id="part3"/>
                    </tei:div>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = Transformer.getRange(xmlDocument, "range(part1,part2)")

    // test that all of part1, part2, Two and Three exist in the range
    expect(result.querySelector("*[jf:id=part1]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=part2]")).toBeInTheDocument()

    expect(result.querySelector("*[jf:id=seg1]")).not.toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg2]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg3]")).toBeInTheDocument()
    expect(result.querySelector("*[jf:id=seg4]")).not.toBeInTheDocument()
  })
})

describe("Transformer.getId", () => {
  it("should extract a range from siblings", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened jf:id="stream">
                    <tei:seg>Test</tei:seg>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = Transformer.getId(xmlDocument, "stream")

    expect(result.childElementCount).toBe(1)
    const children = result.children
    expect(result.tagName).toBe("jf:unflattened")
    expect(result.getAttribute("jf:id")).toBe("stream")

    expect(result.children[0].tagName).toBe("tei:seg")
    expect(result.children[0].textContent).toBe("Test")
  })

  it("should extract a node by xml:id", () => {
    const xmlDocumentText = `
      <tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0"
               xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
               >
           <tei:teiHeader/>
           <tei:body>
                <jf:unflattened>
                    <tei:seg xml:id="tst">Test</tei:seg>
                </jf:unflattened>
           </tei:body>
      </tei:TEI>
    `
    const xmlDocument = text2xml(xmlDocumentText)
    xmlDocument.normalize()
    const result = Transformer.getId(xmlDocument, "tst")

    expect(result.tagName).toBe("tei:seg")
    expect(result.getAttribute("xml:id")).toBe("tst")
  })
})

describe("Transformer.getFragment", () => {
  const xmlDocument = text2xml("<test/>")
  //const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
  const mockGetId = jest.fn()
  const mockGetRange = jest.fn()
  const realGetId = Transformer.getId
  const realGetRange = Transformer.getRange

  beforeAll( () => {
    Transformer.getId = mockGetId
    Transformer.getRange = mockGetRange
  })

  afterAll( () => {
    Transformer.getId = realGetId
    Transformer.getRange = realGetRange
  })

  const mockFragment = text2xml("<div>id</div>")
  const mockRange = [text2xml("<div>range</div>")]

  beforeEach( () => {
    mockGetId.mockReturnValueOnce(mockFragment)
    mockGetRange.mockReturnValueOnce(mockRange)
  })

  afterEach( () => {
    mockGetId.mockReset()
    mockGetRange.mockReset()
  })

  it("should return a single fragment when given one id", () => {
    const result = Transformer.getFragment(xmlDocument,"fragment")
    expect(mockGetId).toHaveBeenCalledTimes(1)
    expect(mockGetId.mock.calls[0][1]).toBe("fragment")
    expect(result).toStrictEqual([mockFragment])
  })

  it("should return a range when given a range", () => {
    const result = Transformer.getFragment(xmlDocument, "range(left,right)")
    expect(mockGetRange).toHaveBeenCalledTimes(1)
    expect(mockGetRange.mock.calls[0][1]).toBe("range(left,right)")
    expect(result).toBe(mockRange)
  })
})

describe("ParsedPtr.parsePtr", () => {
  const xmlDocument = text2xml("<test/>")

  it("should handle a document and API only", () => {
    const result = ParsedPtr.parsePtr("/data/original/DocumentDestination")
    expect(result).toMatchObject(new ParsedPtr("original", "DocumentDestination"))
  })

  it("should handle a document and API and fragment", () => {
    const result = ParsedPtr.parsePtr("/data/original/DocumentDestination#fragmentDestination")
    expect(result).toMatchObject(
      new ParsedPtr("original", "DocumentDestination", "fragmentDestination"))
  })

  it("should handle a fragment only", () => {
    const result = ParsedPtr.parsePtr("#fragmentDestination")
    expect(result).toMatchObject(
      new ParsedPtr(null, null, "fragmentDestination"))
  })
})

describe("Transformer.traverseChildren", () => {
  const metadata = new TransformerMetadata()
  const props = {
    metadata: metadata
  }
  const mockApplyTo = jest.fn()
  let realApplyTo

  beforeAll( () => {
    realApplyTo = Transformer.applyTo
    Transformer.applyTo = mockApplyTo
  })

  afterEach( () => {
    mockApplyTo.mockReset()
  })

  afterAll( () => {
    Transformer.applyTo = realApplyTo
  })

  it("should return an empty array when the node has no children", () => {
    const emptyChildren = text2xml("<docNode></docNode>").documentElement
    const result = Transformer.traverseChildren(emptyChildren, props)
    expect(mockApplyTo).toHaveBeenCalledTimes(0)
    expect(result).toBeFalsy()
  })

  it("should apply the Transformer to all existing children of an element node", () => {
    const withChildren = text2xml(`<docNode>
      <child1>one</child1>
      two
      <child3>three</child3>
      </docNode>`).documentElement
    withChildren.normalize()
    const result = Transformer.traverseChildren(withChildren, props)
    expect(mockApplyTo).toHaveBeenCalledTimes(1)
    expect(mockApplyTo.mock.calls[0][0]).toMatchObject(withChildren.childNodes)
    expect(mockApplyTo.mock.calls[0][1]).toMatchObject(props)
    expect(mockApplyTo.mock.calls[0][2]).toBe(ELEMENT_CONTEXT_SWITCH)
  })
})

/** A transform component that returns nothing */
function MockTransformComponent(props) {
  return "MOCKED " + props.metadata.get(META_LANG)
}

describe("TransformerContextChain", () => {
  const mockTransform = jest.fn()

  let realTransform

  beforeAll( () => {
    realTransform = Transformer.transform
    Transformer.transform = mockTransform
  })

  afterEach( () => {
    mockTransform.mockReset()
  })

  afterAll( () => {
    Transformer.transform = realTransform
  })

  const testChain = {
    [DOCUMENT_CONTEXT_SWITCH]: [MockTransformComponent, MockTransformComponent],
    [LOCATION_CONTEXT_SWITCH]: [MockTransformComponent, MockTransformComponent],
    [ELEMENT_CONTEXT_SWITCH]: [MockTransformComponent]
  }

  it("stores the level of the chaining and the appropriate switches for document switch", () => {
    const docLevelTcc = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH, testChain)

    expect(docLevelTcc.level).toBe(DOCUMENT_CONTEXT_SWITCH)
    expect(docLevelTcc.chain.length).toBe(5)
    expect(docLevelTcc.chain).toMatchObject([MockTransformComponent, MockTransformComponent, MockTransformComponent, MockTransformComponent, MockTransformComponent])
  })

  it("stores the level of the chaining and the appropriate switches for location switch", () => {
    const locLevelTcc = new TransformerContextChain(LOCATION_CONTEXT_SWITCH, testChain)

    expect(locLevelTcc.level).toBe(LOCATION_CONTEXT_SWITCH)
    expect(locLevelTcc.chain.length).toBe(3)
    expect(locLevelTcc.chain).toMatchObject([MockTransformComponent, MockTransformComponent, MockTransformComponent])
  })

  it("calls the entire chain, followed by the transformer", () => {
    const docLevelTcc = new TransformerContextChain(DOCUMENT_CONTEXT_SWITCH, testChain)
    const props = { metadata: new TransformerMetadata().set(META_LANG, "1") }

    for (const mock of [MockTransformComponent, MockTransformComponent, MockTransformComponent, MockTransformComponent, MockTransformComponent, MockTransformComponent]) {
      const {queryAllByText} = render(docLevelTcc.next(props))
      expect(queryAllByText(/mocked 1/i).length).not.toBe(0)
    }
  })

  it("updates metadata when nextWithMetadataUpdate is called", () => {
    const elemLevelTcc = new TransformerContextChain(ELEMENT_CONTEXT_SWITCH, testChain)
    const originalProps = { metadata: new TransformerMetadata().set(META_LANG, "1") }
    const nextMetadata = new TransformerMetadata().set(META_LANG, "2")
    const propsWithNextMetadata = { metadata: nextMetadata }

    const {queryByText} = render(elemLevelTcc.nextWithMetadataUpdate(originalProps, nextMetadata))
    expect(queryByText(/mocked 2/i)).toBeInTheDocument()

  })
})