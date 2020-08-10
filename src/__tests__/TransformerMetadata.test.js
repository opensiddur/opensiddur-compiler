/* TransformerMetadata.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata, { MetadataUpdate, MetadataUpdateList } from "../TransformerMetadata"
import Transformer, {TEI_NS} from "../Transformer"
import {text2xml} from "../TestUtils"
import {ContextSourceInfo} from "../ContextSourceInfo"

describe("TransformerMetadata", () => {
  it("constructs a copy of the original, given an existing metadata", () => {
    const tm1 = new TransformerMetadata().set("one", 1)
    const tm2 = new TransformerMetadata(tm1)

    expect(tm2).toMatchObject(tm1)
  })

  test("set and get are inverses", () => {
    const tm = new TransformerMetadata()
    const tm1 = tm.set("one", 1)

    expect(tm1.get("one")).toBe(1)
  })
})

describe("TransformerMetadata.contextTEIRoot", () => {
  const testDoc = text2xml(`<notTEI xmlns:tei="http://www.tei-c.org/ns/1.0">
        <isNotARootNode>isn't one</isNotARootNode>
        <containsARootNode>
            <tei:TEI xml:id="IAMTEI">
                <containedByARootNode/>
            </tei:TEI>
        </containsARootNode>
    </notTEI>`)

  it("returns the document node when the parameter is a document node", () => {
    const result = TransformerMetadata.contextTEIRoot(testDoc)
    expect(result).toBe(testDoc)
  })

  it("returns the ancestor document node when the parameter has no TEI ancestor", () => {
    const notADocNode = testDoc.getElementsByTagName("isNotARootNode").item(0)
    const result = TransformerMetadata.contextTEIRoot(notADocNode)
    expect(result).toBe(testDoc)
  })

  it("returns the ancestor TEI element when the parameter has one", () => {
    const notADocNode = testDoc.getElementsByTagName("containedByARootNode").item(0)
    const result = TransformerMetadata.contextTEIRoot(notADocNode)
    expect(result.tagName).toBe("tei:TEI")
  })
})

describe("TransformerMetadata.contextLicense", () => {
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
    const lic = TransformerMetadata.contextLicense(doc)
    expect(lic).toBe(CC0)
  })

  it("returns the license URL from a subordinate element context", () => {
    const elem = doc.getElementsByTagName("tei:div")[0]
    const lic = TransformerMetadata.contextLicense(elem)
    expect(lic).toBe(CC0)
  })
})

describe("TransformerMetadata.contextSources", () => {
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
    const result = TransformerMetadata.contextSources(docNoSources)

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
      const result = TransformerMetadata.contextSources(contextNode)

      expect(result.length).toBe(2)
      expect(result).toMatchObject(expectedResult)
    })

  })
})

describe("TransformerMetadata.contextContributors", () => {
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

    const fromInsideNode = TransformerMetadata.contextContributors(xmlNode)
    testExpectations(fromInsideNode)


    const fromDocumentNode = TransformerMetadata.contextContributors(doc)
    testExpectations(fromDocumentNode)
  })
})

