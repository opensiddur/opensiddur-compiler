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
  ELEMENT_CONTEXT_SWITCH, JF_NS, LOCATION_CONTEXT_SWITCH,
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

describe("Transformer._getPrimaryDocument", () => {
  const documentRoots = `<roots xmlns:tei="http://www.tei-c.org/ns/1.0" 
        xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">
    <tei:TEI jf:document="/data/original/secondaryDocument">dot...</tei:TEI>
    <tei:TEI jf:document="/data/original/primaryDocument">dot...</tei:TEI> 
  </roots>`
  const documentRootsXml = text2xml(documentRoots)
  const documentRootsCollection = documentRootsXml.getElementsByTagNameNS(TEI_NS, "TEI")
  
  it("throws an exception when no primary document can be found", () => {
    const noDocument = "none"
    expect( () =>  {
      Transformer._getPrimaryDocument(documentRootsCollection, noDocument)
      }).toThrow(Error)
  })
  
  it("returns the root of the document when the primary document is found", () => {
    const yesDocument = "primaryDocument"
    const result = Transformer._getPrimaryDocument(documentRootsCollection, yesDocument)
    expect(result.tagName).toBe("tei:TEI")
    expect(result.getAttribute("jf:document")).toBe("/data/original/primaryDocument")
  })
})

describe("Transformer.getParallels", () => {
  const hasParallels = `
    <jf:parallel-document 
      xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
      xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0" 
      xmlns:tei="http://www.tei-c.org/ns/1.0">
      <tei:TEI jf:document="/data/original/documentA">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="stream">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p1">From document one para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p2">From document one para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(fiveA,sixA) /data/original/documentB#range(fiveB,sixB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p3">This one has no parallel</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
      <tei:TEI jf:document="/data/original/documentB">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="stream">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p1">From document two para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p2">From document two para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
    </jf:parallel-document>
  `
  const hasParallelsXml = text2xml(hasParallels)

  it("returns the matching parallelGrp if it exists", () => {
    const existingParGroup = hasParallelsXml.getElementsByTagNameNS(JF_NS, "parallelGrp").item(0)
    // just making sure this test is working right...
    expect(existingParGroup.getElementsByTagNameNS(TEI_NS, "p").item(0).getAttribute("jf:id")).toBe("d1p1")
    const result = Transformer.getParallels(hasParallelsXml, existingParGroup)

    expect(result.length).toBe(1)
    expect(result[0].tagName).toBe("jf:parallelGrp")
    expect(result[0].getElementsByTagNameNS(TEI_NS, "p").item(0).getAttribute("jf:id")).toBe("d2p1")
  })

  it("returns empty if the matching parallelGrp does not exists", () => {
    const notExistingParGroup = hasParallelsXml.getElementsByTagNameNS(JF_NS, "parallelGrp").item(2)
    // just making sure this test is working right...
    expect(notExistingParGroup.getElementsByTagNameNS(TEI_NS, "p").item(0).getAttribute("jf:id")).toBe("d1p3")
    const result = Transformer.getParallels(hasParallelsXml, notExistingParGroup)

    expect(result.length).toBe(0)
  })
})

describe("Transformer._linkageDocumentFragment", () => {
  const parallelDoc = `
    <jf:parallel-document 
      xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
      xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0" 
      xmlns:tei="http://www.tei-c.org/ns/1.0">
      <tei:TEI jf:document="/data/original/documentA">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="streamA">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p1">From document one para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p2">From document one para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(fiveA,sixA) /data/original/documentB#range(fiveB,sixB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p3">From document one para three</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
      <tei:TEI jf:document="/data/original/documentB">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="streamB">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p1">From document two para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p2">From document two para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p3">From document two para three</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
    </jf:parallel-document>
  `
  const parallelDocXml = text2xml(parallelDoc)
  const primaryDocument = parallelDocXml.getElementsByTagNameNS(TEI_NS, "TEI").item(0)
  // fail if the test is messed up
  expect(primaryDocument.getAttribute("jf:document")).toBe("/data/original/documentA")

  it("returns the whole stream if the fragment is empty or null", () => {
    ["", null].forEach( (frag) => {
      const [stream, left, right] = Transformer._linkageDocumentFragment(primaryDocument, frag)
      expect(stream.getAttribute("jf:id")).toBe("streamA")
      expect(left).toBeNull()
      expect(right).toBeNull()
    })
  })

  it("returns the stream, left and right node if a range is given", () => {
    const [stream, left, right] = Transformer._linkageDocumentFragment(primaryDocument, "range(d1p1,d1p2)")
    expect(stream.getAttribute("jf:id")).toBe("streamA")
    expect(left.getAttribute("jf:id")).toBe("d1p1")
    expect(right.getAttribute("jf:id")).toBe("d1p2")
  })

  it("returns the stream, left and right node (which are the same) if a single fragment id is given", () => {
    const [stream, left, right] = Transformer._linkageDocumentFragment(primaryDocument, "d1p3")
    expect(stream.getAttribute("jf:id")).toBe("streamA")
    expect(left.getAttribute("jf:id")).toBe("d1p3")
    expect(right.getAttribute("jf:id")).toBe("d1p3")
  })
})

describe("Transformer._mutateLinkageDocument", () => {
  const parallelDoc = `
    <jf:parallel-document 
      xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
      xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0" 
      xmlns:tei="http://www.tei-c.org/ns/1.0">
      <tei:TEI jf:document="/data/original/documentA">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="streamA">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p1">From document one para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p2">From document one para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(fiveA,sixA) /data/original/documentB#range(fiveB,sixB)">
                    <jf:parallel domain="/data/original/documentA#stream">
                        <tei:p jf:id="d1p3">From document one para three</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
      <tei:TEI jf:document="/data/original/documentB">
        <tei:teiHeader>...</tei:teiHeader>
        <tei:text>
            <jf:unflattened jf:id="streamB">
                <jf:parallelGrp target="/data/original/documentA#range(oneA,twoA) /data/original/documentB#range(oneB,twoB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p1">From document two para one</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p2">From document two para two</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
                <jf:parallelGrp target="/data/original/documentA#range(threeA,fourA) /data/original/documentB#range(threeB,fourB)">
                    <jf:parallel domain="/data/original/documentB#stream">
                        <tei:p jf:id="d2p3">From document two para three</tei:p>
                    </jf:parallel>
                </jf:parallelGrp>
            </jf:unflattened>
        </tei:text>
      </tei:TEI>
    </jf:parallel-document>
  `
  let parallelDocXml
  let primaryDocument

  beforeEach( () => {
    parallelDocXml = text2xml(parallelDoc)
    primaryDocument = parallelDocXml.getElementsByTagNameNS(TEI_NS, "TEI").item(0)

    // fail if the test is messed up
    expect(primaryDocument.getAttribute("jf:document")).toBe("/data/original/documentA")
  })


  it("selects the whole stream if the fragment is blank", () => {
    const result = Transformer._mutateLinkageDocument(parallelDocXml, primaryDocument, "")
    expect(result.getAttribute("jf:id")).toBe("streamA")
    const ps = result.getElementsByTagNameNS(TEI_NS, "p")
    expect(ps.length).toBe(3)
    const expectedIds = ["d1p1", "d1p2", "d1p3"]
    for (let ctr = 0; ctr < expectedIds.length; ctr++) {
      expect(ps.item(ctr).getAttribute("jf:id")).toBe(expectedIds[ctr])
    }
  })

  it("selects part of the stream if the fragment is an id", () => {
    const result = Transformer._mutateLinkageDocument(parallelDocXml, primaryDocument, "d1p2")
    expect(result.getAttribute("jf:id")).toBe("streamA")
    const pgs = result.getElementsByTagNameNS(JF_NS, "parallelGrp")
    expect(pgs.length).toBe(1)
    const ps = result.getElementsByTagNameNS(TEI_NS, "p")
    expect(ps.length).toBe(1)
    expect(ps.item(0).getAttribute("jf:id")).toBe("d1p2")
  })


  it("selects part of the stream if the fragment is a range", () => {
    const result = Transformer._mutateLinkageDocument(parallelDocXml, primaryDocument, "range(d1p2,d1p3)")
    expect(result.getAttribute("jf:id")).toBe("streamA")
    const pgs = result.getElementsByTagNameNS(JF_NS, "parallelGrp")
    expect(pgs.length).toBe(2)
    const ps = result.getElementsByTagNameNS(TEI_NS, "p")
    expect(ps.length).toBe(2)
    expect(ps.item(0).getAttribute("jf:id")).toBe("d1p2")
    expect(ps.item(1).getAttribute("jf:id")).toBe("d1p3")
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