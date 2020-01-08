/* Transformer.test.js
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import Transformer, {DOCUMENT_CONTEXT_SWITCH, META_LANG, META_LICENSE, ParsedPtr, TEI_NS} from "../Transformer"
import TransformerMetadata from "../TransformerMetadata"
import {ContextSourceInfo} from "../ContextSourceInfo"

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
    const result = transformer.getFragment("fragment")
    expect(mockGetId).toHaveBeenCalledTimes(1)
    expect(mockGetId.mock.calls[0][0]).toBe("fragment")
    expect(result).toStrictEqual([mockFragment])
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
  transformer.apply = mockTransform
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
    const mockFragment = text2xml("<fragment>Fragment</fragment>")
    const mockFragmentData = [mockFragment]
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    mockTransform.mockReturnValueOnce(<div>Transformed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" target="#fragmentInCurrentDocument"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][0]).toBe("fragmentInCurrentDocument")

    expect(mockTransform).toHaveBeenCalledTimes(1)
    expect(mockTransform.mock.calls[0][0]).toBe(mockFragment)
    expect(mockTransform.mock.calls[0][1]).toMatchObject(metadata)
    expect(getByText("Transformed")).toBeInTheDocument()
  })

  it("should recurse to recursionFunction when the document is not the same as the current document", () => {
    const mockFragment = text2xml("<fragment>Fragment</fragment>")
    const mockFragmentData = [mockFragment]
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
    const mockFragment = text2xml("<fragment>Fragment</fragment>")
    const mockFragmentData = [mockFragment]
    mockGetFragment.mockReturnValueOnce(mockFragmentData)
    mockTransform.mockReturnValueOnce(<div>Transformed</div>)
    const xmlPtr = text2xml(
      `<tei:ptr xmlns:tei="http://www.tei-c.org/ns/1.0" type="inline" target="#fragmentInCurrentDocument"/>`).documentElement
    const { getByText } = render(transformer.teiPtr(xmlPtr, metadata))

    expect(mockGetFragment).toHaveBeenCalledTimes(1)
    expect(mockGetFragment.mock.calls[0][0]).toBe("fragmentInCurrentDocument")

    expect(mockTransform).toHaveBeenCalledTimes(1)
    expect(mockTransform.mock.calls[0][0]).toBe(mockFragment)
    expect(mockTransform.mock.calls[0][1]).toMatchObject(new TransformerMetadata().set("inline", true))
    expect(getByText("Transformed")).toBeInTheDocument()

  })

  it("should pass 'inline' metadata to an external document if the pointer is declared to be inline", () => {
    const mockFragmentData = [text2xml("<fragment>Fragment</fragment>")]
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

describe("Transformer.updateLanguage", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})

  it("returns the existing empty metadata and no update when there is no lang metadata and no xml:lang", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const xml = text2xml(`<test>one</test>`).documentElement
    const result = transformer.updateLanguage(xml, metadata)
    expect(result).toMatchObject({ update: null, nextMetadata: metadata })
  })

  it("returns the existing lang metadata when there is no xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else").set(META_LANG, "en")
    const xml = text2xml(`<test>one</test>`).documentElement
    const result = transformer.updateLanguage(xml, metadata)
    expect(result).toMatchObject({ update: null, nextMetadata: metadata })
  })

  it("returns a new language when there is no lang metadata and an xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const xml = text2xml(`<test xml:lang="he">one</test>`).documentElement
    const result = transformer.updateLanguage(xml, metadata)
    expect(result).toMatchObject({ update: { lang: "he" }, nextMetadata: metadata.set(META_LANG, "he") })
  })

  it("returns a new language when there is lang metadata and a different xml:lang attribute", () => {
    const metadata = new TransformerMetadata().set("something", "else")
    const enMetadata = metadata.set(META_LANG, "en")
    const heMetadata = metadata.set(META_LANG, "he")
    const xml = text2xml(`<test xml:lang="he">one</test>`).documentElement
    const result = transformer.updateLanguage(xml, enMetadata)
    expect(result).toMatchObject({ update: { lang: "he" }, nextMetadata: heMetadata })
  })
})

describe("Transformer.contextLicense", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const CC0 = "http://creativecommons.org/publicdomain/zero/1.0"
  const doc = text2xml(`<tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0">
    <tei:teiHeader>
        <tei:publicationStmt>
            <tei:availability>
                <tei:licence target="${CC0}"/>    
            </tei:availability>
        </tei:publicationStmt>
    </tei:teiHeader>
    <tei:body>
        <tei:div xml:id="text">Text</tei:div>
    </tei:body>
  </tei:TEI>`)

  it("returns the license URL from the document context", () => {
    const lic = transformer.contextLicense(doc)
    expect(lic).toBe(CC0)
  })

  it("returns the license URL from a subordinate element context", () => {
    const elem = doc.getElementsByTagName("tei:div")[0]
    const lic = transformer.contextLicense(elem)
    expect(lic).toBe(CC0)
  })
})

describe("Transformer.contextSwitch", () => {
  const transformer = new Transformer(text2xml("<test/>"), "doc.xml", () => {})
  const mockUpdateLanguage = jest.fn()
  transformer.updateLanguage = mockUpdateLanguage
  const mockUpdateLicense = jest.fn()
  transformer.updateLicense = mockUpdateLicense
  const mockUpdateContributors = jest.fn()
  transformer.updateContributors = mockUpdateContributors
  const mockLicense = "http://creativecommons.org/publicdomain/zero/1.0"
  const mockOldMetadata = new TransformerMetadata().set("old", true)
  const mockMetadata = new TransformerMetadata().set("mocked", true).set(META_LICENSE, mockLicense)
  const newContext = text2xml("<newContext>new</newContext>").documentElement
  const mockFReturn = <div className="result"/>
  const mockF = jest.fn()

  afterEach( () => {
    mockF.mockReset()
    mockUpdateLanguage.mockReset()
    mockUpdateLicense.mockReset()
    mockUpdateContributors.mockReset()
  })

  it("returns a wrapper container when a context update has happened due to changed language", () => {
    const mockLang = "new"
    mockUpdateLanguage.mockReturnValue({ update: { "lang": mockLang }, nextMetadata: mockMetadata})
    mockUpdateLicense.mockReturnValue({ update: null, nextMetadata: mockMetadata })
    mockUpdateContributors.mockReturnValue({ update: null, nextMetadata: mockMetadata })
    mockF.mockReturnValue(mockFReturn)
    const { container } = render(transformer.contextSwitch(newContext, mockOldMetadata, DOCUMENT_CONTEXT_SWITCH, mockF))

    expect(mockUpdateLanguage).toHaveBeenCalledTimes(1)
    expect(mockUpdateLanguage.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateLanguage.mock.calls[0][1]).toMatchObject(mockOldMetadata)
    expect(mockUpdateLanguage.mock.calls[0][2]).toBe(true)

    expect(mockUpdateLicense).toHaveBeenCalledTimes(1)
    expect(mockUpdateLicense.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateLicense.mock.calls[0][1]).toMatchObject(mockMetadata)
    expect(mockUpdateLicense.mock.calls[0][2]).toBe(true)

    expect(mockUpdateContributors).toHaveBeenCalledTimes(1)
    expect(mockUpdateContributors.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateContributors.mock.calls[0][1]).toMatchObject(mockMetadata)
    expect(mockUpdateContributors.mock.calls[0][2]).toBe(true)

    expect(mockF).toHaveBeenCalledTimes(1)
    expect(mockF.mock.calls[0][0]).toMatchObject(mockMetadata)

    const result = container.querySelector("div")
    const resultChild = container.querySelector("div .result")
    const metadataBox = container.querySelector("div.MetadataBox")

    expect(result).toBeInTheDocument()
    expect(result.getAttribute("lang")).toBe(mockLang)
    expect(resultChild).toBeInTheDocument()
    expect(metadataBox).toBeInTheDocument()
  })

  it("returns the return value of f when no context update has changed language", () => {
    const mockLang = "new"
    mockUpdateLanguage.mockReturnValue({ update: null, nextMetadata: mockMetadata})
    mockUpdateLicense.mockReturnValue({ update: null, nextMetadata: mockMetadata })
    mockUpdateContributors.mockReturnValue({ update: null, nextMetadata: mockMetadata })
    mockF.mockReturnValue(mockFReturn)
    const result = transformer.contextSwitch(newContext, mockOldMetadata, DOCUMENT_CONTEXT_SWITCH, mockF)

    expect(mockUpdateLanguage).toHaveBeenCalledTimes(1)
    expect(mockUpdateLanguage.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateLanguage.mock.calls[0][1]).toMatchObject(mockOldMetadata)
    expect(mockUpdateLanguage.mock.calls[0][2]).toBe(true)

    expect(mockUpdateLicense).toHaveBeenCalledTimes(1)
    expect(mockUpdateLicense.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateLicense.mock.calls[0][1]).toMatchObject(mockMetadata)
    expect(mockUpdateLicense.mock.calls[0][2]).toBe(true)

    expect(mockUpdateContributors).toHaveBeenCalledTimes(1)
    expect(mockUpdateContributors.mock.calls[0][0]).toMatchObject(newContext)
    expect(mockUpdateContributors.mock.calls[0][1]).toMatchObject(mockMetadata)
    expect(mockUpdateContributors.mock.calls[0][2]).toBe(true)

    expect(mockF).toHaveBeenCalledTimes(1)
    expect(mockF.mock.calls[0][0]).toMatchObject(mockMetadata)

    expect(result).toStrictEqual(mockFReturn)
  })
})

describe("Transformer.contextContributors", () => {
  it("reads all contributors from the given context", () => {
    const doc = text2xml(`<tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0">
        <tei:teiHeader>
            <tei:titleStmt>
                <tei:respStmt>
                    <tei:resp key="aut">Author</tei:resp>
                    <tei:name ref="/user/AnAuthor">A Author</tei:name>                
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="ann">Annotator</tei:resp>
                    <tei:name ref="/user/AnAnnotator">B Annotator</tei:name>                
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="ctb">Contributor</tei:resp>
                    <tei:name ref="/user/AContributor">C Contributor</tei:name>                
                </tei:respStmt>
                <!-- for creators, we'll make sure of what happens when 2 are listed -->
                <tei:respStmt>
                    <tei:resp key="cre">Creator</tei:resp>
                    <tei:name ref="/user/ACreator1">D Creator One</tei:name>                
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="cre">Creator</tei:resp>
                    <tei:name ref="/user/BCreator2">E Creator Two</tei:name>                
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="edt">Editor</tei:resp>
                    <tei:name ref="/user/AnEditor">F Editor</tei:name>                
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="fac">Facsimilist</tei:resp>
                    <tei:orgName ref="/user/Facsimilist">Facsimilist Organization</tei:orgName>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="fnd">Funder</tei:resp>
                    <tei:orgName ref="/user/Funder">Funder Organization</tei:orgName>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="mrk">Markup editor</tei:resp>
                    <tei:name ref="/user/MarkupGuy">Markup Editor</tei:name>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="oth">Other</tei:resp>
                    <tei:name ref="/user/TheOtherGuy">Not Sure What He Did</tei:name>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="pfr">Proofreader</tei:resp>
                    <tei:name ref="/user/AProofreader">Proofreader</tei:name>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="spn">Sponsor</tei:resp>
                    <tei:orgName ref="/user/SponsorOrg">Sponsor Organization</tei:orgName>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="trc">Transcriber</tei:resp>
                    <tei:name ref="/user/ATranscriber">Transcriber</tei:name>
                </tei:respStmt>
                <tei:respStmt>
                    <tei:resp key="trl">Translator</tei:resp>
                    <tei:name ref="/user/ATranslator">Translator Gal</tei:name>
                </tei:respStmt>
            </tei:titleStmt>
            <tei:revisionDesc>
                <tei:change type="edited" who="/user/AnotherEditor">Edited by someone else</tei:change>
                <tei:change type="edited" who="/user/AnEditor">Edited by same guy who edited</tei:change>
                <tei:change type="created" who="/user/AnEditor">Created by the same guy who edited</tei:change>
            </tei:revisionDesc>
        </tei:teiHeader>
        <tei:body>
            <tei:div xml:id="text">Text!</tei:div>
        </tei:body>
    </tei:TEI>`)

    const xmlNode = doc.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", "div")[0]
    const transformer = new Transformer(doc, "doc.xml", () => {})

    const testExpectations = (result) => {
      expect(result.hasOwnProperty("aut")).toBeTruthy()
      expect(result.hasOwnProperty("ann")).toBeTruthy()
      expect(result.hasOwnProperty("ctb")).toBeTruthy()
      expect(result.hasOwnProperty("cre")).toBeTruthy()
      expect(result.hasOwnProperty("edt")).toBeTruthy()
      expect(result.hasOwnProperty("fac")).toBeTruthy()
      expect(result.hasOwnProperty("fnd")).toBeTruthy()
      expect(result.hasOwnProperty("mrk")).toBeTruthy()
      expect(result.hasOwnProperty("oth")).toBeTruthy()
      expect(result.hasOwnProperty("pfr")).toBeTruthy()
      expect(result.hasOwnProperty("spn")).toBeTruthy()
      expect(result.hasOwnProperty("trc")).toBeTruthy()
      expect(result.hasOwnProperty("trl")).toBeTruthy()
      expect(result["aut"]).toMatchObject(new Set(["/user/AnAuthor"]))
      expect(result["ann"]).toMatchObject(new Set(["/user/AnAnnotator"]))
      expect(result["ctb"]).toMatchObject(new Set(["/user/AContributor"]))
      expect(result["cre"]).toMatchObject(new Set(["/user/ACreator1", "/user/BCreator2"]))
      expect(result["edt"]).toMatchObject(new Set(["/user/AnEditor", "/user/AnotherEditor"]))
      expect(result["fac"]).toMatchObject(new Set(["/user/Facsimilist"]))
      expect(result["fnd"]).toMatchObject(new Set(["/user/Funder"]))
      expect(result["mrk"]).toMatchObject(new Set(["/user/MarkupGuy"]))
      expect(result["oth"]).toMatchObject(new Set(["/user/TheOtherGuy"]))
      expect(result["pfr"]).toMatchObject(new Set(["/user/AProofreader"]))
      expect(result["spn"]).toMatchObject(new Set(["/user/SponsorOrg"]))
      expect(result["trc"]).toMatchObject(new Set(["/user/ATranscriber"]))
      expect(result["trl"]).toMatchObject(new Set(["/user/ATranslator"]))
    }

    const fromInsideNode = transformer.contextContributors(xmlNode)
    testExpectations(fromInsideNode)


    const fromDocumentNode = transformer.contextContributors(doc)
    testExpectations(fromDocumentNode)
  })

  describe("Transformer.contextSources", () => {
    it("returns empty list when the document has no listed sources", () => {
      const docNoSources = text2xml(`<tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0">
        <tei:teiHeader>
            <tei:sourceDesc>                
            </tei:sourceDesc>
        </tei:teiHeader>
        <tei:body>
            <tei:div xml:id="text">Text!</tei:div>
        </tei:body>
      </tei:TEI>`)
      const result = Transformer.contextSources(docNoSources)

      expect(result).toBeNull()
    })


    it("returns a list of sources when the document has them", () => {
      const docWithSources = text2xml(`<tei:TEI xmlns:tei="http://www.tei-c.org/ns/1.0">
        <tei:teiHeader>
            <tei:sourceDesc> 
                <tei:bibl>
                    <!-- this source has no scope -->
                    <tei:ptr type="bibl" target="/data/sources/Test%20Source%201"/>
                </tei:bibl>               
                <tei:bibl>
                        <tei:ptr type="bibl" target="/data/sources/Test%20Source%202"/>
                        <tei:ptr type="somethingelse" target="somewhere_else"/>
                        <tei:biblScope unit="pages" from="5" to="10"/>
                </tei:bibl>
            </tei:sourceDesc>
        </tei:teiHeader>
        <tei:body>
            <tei:div xml:id="text">Text!</tei:div>
        </tei:body>
      </tei:TEI>`)
      // the same result should come if we call from either a document or node context
      const contextNodes = [docWithSources, docWithSources.getElementsByTagNameNS(TEI_NS, "div")[0]]

      const expectedResult = [
        new ContextSourceInfo("Test%20Source%201"),
        new ContextSourceInfo("Test%20Source%202", "pages", "5",  "10" )
      ]

      contextNodes.forEach((contextNode) => {
        const result = Transformer.contextSources(contextNode)

        expect(result.length).toBe(2)
        expect(result).toMatchObject(expectedResult)
      })

    })
  })

})