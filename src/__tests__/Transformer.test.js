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