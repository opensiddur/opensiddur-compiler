/* Transformer.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import Transformer, {ParsedPtr, TransformerMetadata} from "../Transformer"

const text2xml = (txt) => {
  return new DOMParser().parseFromString(txt, "application/xml")
}

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
    const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
    const result = transformer.getRange("range(part1,part2)")

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
    const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
    const result = transformer.getRange("range(part1,part2)")

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
    const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
    const result = transformer.getId("stream")

    expect(result.childElementCount).toBe(1)
    const children = result.children
    expect(result.tagName).toBe("jf:unflattened")
    expect(result.getAttribute("jf:id")).toBe("stream")

    expect(result.children[0].tagName).toBe("tei:seg")
    expect(result.children[0].textContent).toBe("Test")
  })
})

describe("Transformer.getFragment", () => {
  const xmlDocument = text2xml("<test/>")
  const transformer = new Transformer(xmlDocument, "doc.xml", () => {})
  const mockGetId = jest.fn()
  const mockGetRange = jest.fn()
  transformer.getId = mockGetId
  transformer.getRange = mockGetRange

  const mockFragment = text2xml("<div>id</div>")
  const mockRange = text2xml("<div>range</div>")

  beforeEach( () => {
    mockGetId.mockReturnValueOnce(mockFragment)
    mockGetRange.mockReturnValueOnce(mockRange)
  })

  afterEach( () => {
    mockGetId.mockReset()
    mockGetRange.mockReset()
  })

  it("should return a single fragment when given one id", () => {
    const result = transformer.getFragment("fragment")
    expect(mockGetId).toHaveBeenCalledTimes(1)
    expect(mockGetId.mock.calls[0][0]).toBe("fragment")
    expect(result).toBe(mockFragment)
  })

  it("should return a range when given a range", () => {
    const result = transformer.getFragment("range(left,right)")
    expect(mockGetRange).toHaveBeenCalledTimes(1)
    expect(mockGetRange.mock.calls[0][0]).toBe("range(left,right)")
    expect(result).toBe(mockRange)
  })
})

describe("Transformer.parsePtr", () => {
  const xmlDocument = text2xml("<test/>")
  const transformer = new Transformer(xmlDocument, "doc.xml", () => {})

  it("should handle a document and API only", () => {
    const result = transformer.parsePtr("/data/original/DocumentDestination")
    expect(result).toMatchObject(new ParsedPtr("original", "DocumentDestination"))
  })

  it("should handle a document and API and fragment", () => {
    const result = transformer.parsePtr("/data/original/DocumentDestination#fragmentDestination")
    expect(result).toMatchObject(
      new ParsedPtr("original", "DocumentDestination", "fragmentDestination"))
  })

  it("should handle a fragment only", () => {
    const result = transformer.parsePtr("#fragmentDestination")
    expect(result).toMatchObject(
      new ParsedPtr(null, null, "fragmentDestination"))
  })
})

describe("Transformer.namespaceResolver", () => {
  const xmlDocument = text2xml("<test/>")
  const transformer = new Transformer(xmlDocument, "doc.xml", () => {})

  it("should resolve all namespaces that are required for documents sent to the client", () => {
    expect(transformer.namespaceResolver("tei")).toBe("http://www.tei-c.org/ns/1.0")
    expect(transformer.namespaceResolver("j")).toBe("http://jewishliturgy.org/ns/jlptei/1.0")
    expect(transformer.namespaceResolver("jf")).toBe("http://jewishliturgy.org/ns/jlptei/flat/1.0")
  })
})

describe("Transformer.teiPtr", () => {
  const metadata = new TransformerMetadata()
  const xmlDocument = text2xml("<test/>")
  const recursionFunction = jest.fn()
  const transformer = new Transformer(xmlDocument, "doc.xml", recursionFunction)
  const mockTransform = jest.fn()
  const mockGetFragment = jest.fn()
  transformer.transform = mockTransform
  transformer.getFragment = mockGetFragment

  afterEach( () => {
    recursionFunction.mockReset()
    mockTransform.mockReset()
    mockGetFragment.mockReset()
  })

  it("should return html a for type=url", () => {
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="url" target="http://www.example.com"/>`).documentElement
    const { container } = render(transformer.teiPtr(xmlPtr, metadata))
    const a = container.querySelector("a")
    expect(a).toBeInTheDocument
    expect(a.href).toBe("http://www.example.com/")
    expect(a.textContent).toBe("http://www.example.com")
  })

  it("should recurse to transform when the document is the same as the current document", () => {
    const mockFragmentData = text2xml("<fragment>Fragment</fragment>")
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    mockTransform.mockReturnValueOnce(<div>Transformed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" target="#fragmentInCurrentDocument"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][0]).toBe("fragmentInCurrentDocument")

    expect(mockTransform).toHaveBeenCalledTimes(1)
    expect(mockTransform.mock.calls[0][0]).toBe(mockFragmentData)
    expect(mockTransform.mock.calls[0][1]).toMatchObject(metadata)
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("should recurse to recursionFunction when the document is not the same as the current document", () => {
    const mockFragmentData = text2xml("<fragment>Fragment</fragment>")
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    recursionFunction.mockReturnValueOnce(<div>Recursed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" target="another/document#fragment"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(recursionFunction).toHaveBeenCalledTimes(1)
    expect(recursionFunction.mock.calls[0][0]).toBe("document")
    expect(recursionFunction.mock.calls[0][1]).toBe("fragment")
    expect(recursionFunction.mock.calls[0][2]).toMatchObject(new TransformerMetadata().set("inline", false))
    expect(getByText("Recursed")).toBeInTheDocument()
  })

  it("should pass 'inline' metadata to transform if the pointer is declared to be inline", () => {
    const mockFragmentData = text2xml("<fragment>Fragment</fragment>")
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    mockTransform.mockReturnValueOnce(<div>Transformed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="inline" target="#fragmentInCurrentDocument"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][0]).toBe("fragmentInCurrentDocument")

    expect(mockTransform).toHaveBeenCalledTimes(1)
    expect(mockTransform.mock.calls[0][0]).toBe(mockFragmentData)
    expect(mockTransform.mock.calls[0][1]).toMatchObject(new TransformerMetadata().set("inline", true))
    expect(getByText("Transformed")).toBeInTheDocument()

  })

  it("should pass 'inline' metadata to an external document if the pointer is declared to be inline", () => {
    const mockFragmentData = text2xml("<fragment>Fragment</fragment>")
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    recursionFunction.mockReturnValueOnce(<div>Recursed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="inline" target="another/document#fragment"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(recursionFunction).toHaveBeenCalledTimes(1)
    expect(recursionFunction.mock.calls[0][0]).toBe("document")
    expect(recursionFunction.mock.calls[0][1]).toBe("fragment")
    expect(recursionFunction.mock.calls[0][2]).toMatchObject(new TransformerMetadata().set("inline", true))
    expect(getByText("Recursed")).toBeInTheDocument()

  })
})

describe("Transformer.traverseChildren", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const metadata = new TransformerMetadata()
  const mockTransform = jest.fn()
  transformer.transform = mockTransform

  afterEach( () => {
    mockTransform.mockReset()
  })

  it("should return an empty array when the node has no children", () => {
    const emptyChildren = text2xml("<docNode></docNode>").documentElement
    const result = transformer.traverseChildren(emptyChildren, metadata)
    expect(mockTransform).toHaveBeenCalledTimes(0)
    expect(result).toStrictEqual([])
  })

  it("should transform all existing children of an element node", () => {
    mockTransform.mockImplementation( (node, metadata) => {
      return node.textContent
    })
    const withChildren = text2xml(`<docNode>
      <child1>one</child1>
      two
      <child3>three</child3>
      </docNode>`).documentElement
    withChildren.normalize()
    const result = transformer.traverseChildren(withChildren, metadata)
    expect(mockTransform).toHaveBeenCalledTimes(5) // includes whitespace nodes!
    for (let i = 0; i < 5; i++) {
      expect(mockTransform.mock.calls[i][1]).toMatchObject(metadata)
    }

    expect(result.map( (s) => { return s.trim() })).toStrictEqual(["", "one", "two", "three", ""])
  })
})

describe("Transformer.documentNode", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const metadata = new TransformerMetadata()
  const mockTransform = jest.fn()
  transformer.transform = mockTransform

  it("transforms children", () => {
    mockTransform.mockImplementation( (node, metadata) => {
      return node.textContent
    })
    const docNode = text2xml(`<docNode>
      <child1>one</child1>
      </docNode>`)
    const result = transformer.documentNode(docNode, metadata)
    expect(mockTransform).toHaveBeenCalledTimes(1)

    expect(result).toMatch(/one/i)
  })
})

describe("Transformer.documentFragment", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const metadata = new TransformerMetadata()
  const mockTransform = jest.fn()
  transformer.transform = mockTransform

  it("transforms all children", () => {
    mockTransform.mockImplementation( (node, metadata) => {
      return node.textContent
    })
    const docNode = text2xml(`<docNode>
      <child1>one</child1>
      </docNode>`)
    const docFrag = docNode.documentElement.cloneNode(true)
    const result = transformer.documentFragment(docFrag, metadata)
    expect(mockTransform).toHaveBeenCalledTimes(3) // text before, one, text after

    expect(result.map( (s) => { return s.trim() })).toStrictEqual(["", "one", ""])
  })
})

describe("Transformer.genericElement", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const metadata = new TransformerMetadata()
  const mockTransform = jest.fn()
  transformer.transform = mockTransform

  it("returns a labeled div and recurses", () => {
    mockTransform.mockImplementation( (node, metadata) => {
      return node.textContent
    })
    const ge = text2xml(`<x:genericElement xmlns:x="http://example.com">
      <child1>one</child1>
      <child2>two</child2>
      </x:genericElement>`).documentElement

    const { container, getByText } = render(transformer.genericElement(ge, metadata))
    const geResult = container.querySelector("div")
    expect(geResult.classList.contains("x:genericElement")).toBeTruthy()
    expect(getByText(/one/)).toBeInTheDocument()
    expect(getByText(/two/)).toBeInTheDocument()
  })
})

describe("Transformer.textNode", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const inlineMode = new TransformerMetadata().set("inline", true)

  it("when not in inline mode, copies the text", () => {
    const metadata = new TransformerMetadata()
    const txt = text2xml(`<test>one</test>`).documentElement.firstChild
    const result = transformer.textNode(txt, metadata)
    expect(result).toBe("one")
  })

  it("when in inline mode and the parent is a stream element, copy the text", () => {
    const txt = text2xml(`<test xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" jf:stream="x">one</test>`)
      .documentElement.firstChild
    const result = transformer.textNode(txt, inlineMode)
    expect(result).toBe("one")
  })

  it("when in inline mode and the parent is not a stream element, ignore", () => {
    const txt = text2xml(`<test>one</test>`)
      .documentElement.firstChild
    const result = transformer.textNode(txt, inlineMode)
    expect(result).toBe("")
  })

  it("when in inline mode and the parent is a document fragment, copy", () => {
    const df = document.createDocumentFragment()
    df.appendChild(document.createTextNode("one"))
    const txt = df.firstChild
    const result = transformer.textNode(txt, inlineMode)
    expect(result).toBe("one")
  })


})