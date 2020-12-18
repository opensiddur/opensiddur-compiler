/* UpdateConditionals.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import UpdateConditionals, {
  all,
  oneOf,
  not,
  any,
  CONDITIONAL_NO,
  CONDITIONAL_ON,
  CONDITIONAL_YES,
  CONDITIONAL_MAYBE,
  CONDITIONAL_OFF,
  evaluate
} from "../UpdateConditionals"
import {text2xml} from "../TestUtils"
import {META_SETTINGS, TransformerContextChain} from "../Transformer"
import {cleanup, render, wait} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import TransformerMetadata from "../TransformerMetadata"
import DocumentApi from "../DocumentApi"

describe("all", () => {
  /*
      If any of the conditions evaluate to no, all evaluates to no.
    If all of the conditions evaluate to yes or maybe, all evaluates to maybe.
    If all of the conditions evaluate to yes, all evaluates to yes.
   */
  test("if all of the conditions evaluate to yes, all evaluates to yes", () => {
    expect(all([CONDITIONAL_YES, CONDITIONAL_YES, CONDITIONAL_YES])).toBe(CONDITIONAL_YES)
    expect(all([CONDITIONAL_ON, CONDITIONAL_ON, CONDITIONAL_ON])).toBe(CONDITIONAL_ON)
  })

  test("if all of the conditions evaluate to yes or maybe, all evaluates to maybe", () => {
    expect(all([CONDITIONAL_YES, CONDITIONAL_MAYBE, CONDITIONAL_YES])).toBe(CONDITIONAL_MAYBE)
  })

  test("if any of the conditions evaluate to no, all evaluates to no", () => {
    expect(all([CONDITIONAL_YES, CONDITIONAL_NO, CONDITIONAL_YES])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_MAYBE, CONDITIONAL_NO, CONDITIONAL_YES])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_MAYBE, CONDITIONAL_NO, CONDITIONAL_MAYBE])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_OFF, CONDITIONAL_OFF, CONDITIONAL_ON])).toBe(CONDITIONAL_OFF)
  })

  test("all of empty array", () => {
    expect(all([])).toBe(CONDITIONAL_NO)
  })
})

describe("oneOf", () => {
  /*
    Indicates that the conditional should evaluate to YES/MAYBE if exactly one of the subordinate feature values do.
    If one of the conditions evaluates to yes and all others evaluate to no, oneOf evaluates to yes.
    If one of the conditions evaluates to maybe and all others evaluate to no, oneOf evaluates to maybe.
    If all of the conditions evaluate to no, oneOf evaluates to no.
   */
  test("If one of the conditions evaluates to yes and all others evaluate to no, oneOf evaluates to yes.", () => {
    expect(oneOf([CONDITIONAL_YES, CONDITIONAL_NO, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(oneOf([CONDITIONAL_NO, CONDITIONAL_YES, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(oneOf([CONDITIONAL_ON, CONDITIONAL_OFF, CONDITIONAL_OFF])).toBe(CONDITIONAL_ON)
  })

  test("If more than one condition evaluates to yes or maybe, oneOf evaluates to no", () => {
    expect(oneOf([CONDITIONAL_YES, CONDITIONAL_YES, CONDITIONAL_NO])).toBe(CONDITIONAL_NO)
    expect(oneOf([CONDITIONAL_YES, CONDITIONAL_MAYBE, CONDITIONAL_NO])).toBe(CONDITIONAL_NO)
    expect(oneOf([CONDITIONAL_ON, CONDITIONAL_ON, CONDITIONAL_OFF])).toBe(CONDITIONAL_OFF)
  })

  test("If one of the conditions evaluates to maybe and all others evaluate to no, oneOf evaluates to maybe.", () => {
    expect(oneOf([CONDITIONAL_MAYBE, CONDITIONAL_NO, CONDITIONAL_NO])).toBe(CONDITIONAL_MAYBE)
    expect(oneOf([CONDITIONAL_NO, CONDITIONAL_MAYBE, CONDITIONAL_NO])).toBe(CONDITIONAL_MAYBE)
    expect(oneOf([CONDITIONAL_OFF, CONDITIONAL_MAYBE, CONDITIONAL_OFF])).toBe(CONDITIONAL_MAYBE)
  })

  test("If all of the conditions evaluate to no, oneOf evaluates to no.", () => {
    expect(oneOf([CONDITIONAL_NO, CONDITIONAL_NO, CONDITIONAL_NO])).toBe(CONDITIONAL_NO)
    expect(oneOf([CONDITIONAL_OFF, CONDITIONAL_OFF, CONDITIONAL_OFF])).toBe(CONDITIONAL_OFF)
  })

  test("oneOf of empty array", () => {
    expect(oneOf([])).toBe(CONDITIONAL_NO)
  })
})

describe("any", () => {
  /*
    Indicates that the conditional should evaluate to yes or maybe if any of the subordinate feature values do.
    If any of the conditions evaluate to yes, any evaluates to yes.
    If any of the conditions evaluate to maybe and none evaluate to yes, any evaluates to maybe.
    If all of the conditions evaluate to no, any evaluates to no.
   */
  test("If any of the conditions evaluate to yes, any evaluates to yes.", () => {
    expect(any([CONDITIONAL_YES, CONDITIONAL_NO, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(any([CONDITIONAL_NO, CONDITIONAL_YES, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(any([CONDITIONAL_YES, CONDITIONAL_YES, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(any([CONDITIONAL_MAYBE, CONDITIONAL_YES, CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(any([CONDITIONAL_ON, CONDITIONAL_OFF, CONDITIONAL_OFF])).toBe(CONDITIONAL_ON)
    expect(any([CONDITIONAL_ON, CONDITIONAL_OFF, CONDITIONAL_ON])).toBe(CONDITIONAL_ON)
  })

  test("If any of the conditions evaluate to maybe and none evaluate to yes, any evaluates to maybe.", () => {
    expect(any([CONDITIONAL_NO, CONDITIONAL_MAYBE, CONDITIONAL_NO])).toBe(CONDITIONAL_MAYBE)
  })

  test("If all of the conditions evaluate to no, any evaluates to no.", () => {
    expect(any([CONDITIONAL_NO, CONDITIONAL_NO, CONDITIONAL_NO])).toBe(CONDITIONAL_NO)
    expect(any([CONDITIONAL_OFF, CONDITIONAL_OFF, CONDITIONAL_OFF])).toBe(CONDITIONAL_OFF)
  })

  test("any of empty array", () => {
    expect(any([])).toBe(CONDITIONAL_NO)
  })
})


describe("not", () => {
  /* Indicates that the conditional should evaluate to the negation of its content.
    not yes is no. not no is yes. not maybe is maybe.
   */
  test("not does negation", () => {
    expect(not([CONDITIONAL_YES])).toBe(CONDITIONAL_NO)
    expect(not([CONDITIONAL_NO])).toBe(CONDITIONAL_YES)
    expect(not([CONDITIONAL_MAYBE])).toBe(CONDITIONAL_MAYBE)
    expect(not([CONDITIONAL_ON])).toBe(CONDITIONAL_OFF)
    expect(not([CONDITIONAL_OFF])).toBe(CONDITIONAL_ON)
  })

  test("if all of the conditions evaluate to yes or maybe, all evaluates to maybe", () => {
    expect(all([CONDITIONAL_YES, CONDITIONAL_MAYBE, CONDITIONAL_YES])).toBe(CONDITIONAL_MAYBE)
  })

  test("if any of the conditions evaluate to no, all evaluates to no", () => {
    expect(all([CONDITIONAL_YES, CONDITIONAL_NO, CONDITIONAL_YES])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_MAYBE, CONDITIONAL_NO, CONDITIONAL_YES])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_MAYBE, CONDITIONAL_NO, CONDITIONAL_MAYBE])).toBe(CONDITIONAL_NO)
    expect(all([CONDITIONAL_OFF, CONDITIONAL_OFF, CONDITIONAL_ON])).toBe(CONDITIONAL_OFF)
  })

  test("not of empty array", () => {
    expect(not([])).toBe(CONDITIONAL_YES)
  })
})

describe("evaluate", () => {
  const settings = {
    fs1: { f1: "YES"},
    fs2: { f2: "NO"}
  }

  it("handles a simple evaluation to yes", () => {
    const condition = settings
    const result = evaluate(condition, settings)

    expect(result).toBe(CONDITIONAL_YES)
  })

  it("handles a simple evaluation to no", () => {
    const condition = {
      fs1: { f1: "NO" }
    }
    const result = evaluate(condition, settings)

    expect(result).toBe(CONDITIONAL_NO)
  })

  it("handles a simple evaluation to maybe", () => {
    const settings = {
      fs3: { f3: "MAYBE" }
    }
    const condition = {
      fs3: { f3: "YES" }
    }
    const result = evaluate(condition, settings)

    expect(result).toBe(CONDITIONAL_MAYBE)
  })

  it("handles a simple evaluation of an array", () => {
    const condition = [{ fs1: { f1: "YES"}}, { fs2: { f2: "NO"}}]
    const result = evaluate(condition, settings)

    expect(result).toBe(CONDITIONAL_YES)
  })
})

describe("UpdateConditionals", () => {
  const settingsY = {
    fs1: { f1: "YES" }
  }

  const settingsN = {
    fs1: { f1: "NO" }
  }

  const settingsM = {
    fs1: { f1: "MAYBE" }
  }

  const condition = text2xml(`<tei:fs type="fs1" 
    xmlns:tei="http://www.teic-c.org/ns/1.0"
    xmlns:j="http://jewishliturgy.org/ns/jlptei/1.0">
        <tei:f name="f1"><j:yes/></tei:f>
    </tei:fs>`).documentElement

  const nextChain = jest.fn()

  let realGetUri
  const mockGetUri = jest.fn()

  beforeAll( () => {
    realGetUri = DocumentApi.getUri
    DocumentApi.getUri = mockGetUri
  })

  beforeEach( () => {
    mockGetUri.mockReset()
    nextChain.mockReset()
    cleanup()
  })

  afterAll( () => {
    DocumentApi.getUri = realGetUri
  })

  const docName = "mydoc"
  const docApi = "original"

  it("passes through if there are no conditions", () => {
    const hasNoUpdates = text2xml(`<hasNoUpdates><child>child text</child></hasNoUpdates>`).documentElement
    const chain = new TransformerContextChain(0, null, [nextChain])
    const initialMetadata = new TransformerMetadata().set(META_SETTINGS, settingsY)

    nextChain.mockReturnValue("Chained")

    const { queryByText } = render(<UpdateConditionals nodes={[hasNoUpdates]} metadata={initialMetadata} chain={chain}/>)

    expect(nextChain).toHaveBeenCalled()
    expect(nextChain.mock.calls[0][0]).toMatchObject({
      metadata: initialMetadata
    })

    expect(queryByText("Chained")).toBeInTheDocument()
  })

  it("turns children off if the condition evaluates to NO", async () => {
    const hasUpdates = text2xml(`<hasUpdates xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" 
        jf:conditionals="/data/conditionals/evaluatesTo#no"><child>child text</child></hasUpdates>`).documentElement
    const chain = new TransformerContextChain(0, null, [nextChain])
    const initialMetadata = new TransformerMetadata().set(META_SETTINGS, settingsN)

    nextChain.mockReturnValue("Chained")

    mockGetUri.mockResolvedValue([condition])

    const { container, queryByText } = render(<UpdateConditionals
      nodes={[hasUpdates]} metadata={initialMetadata} chain={chain}
      documentName={docName} documentApi={docApi}/>)

    expect(mockGetUri).toHaveBeenCalledTimes(1)
    expect(mockGetUri.mock.calls[0][0]).toBe("/data/conditionals/evaluatesTo#no")
    expect(mockGetUri.mock.calls[0][1]).toBe(docName)
    expect(mockGetUri.mock.calls[0][2]).toBe(docApi)

    await wait()

    expect(queryByText("Chained")).not.toBeInTheDocument()
    expect(container.querySelector(".UpdateConditionals.ConditionalNo")).toBeInTheDocument()
  })

  const evalsTo = async (settingsX, conditionalClass) => {
    const hasUpdates = text2xml(`<hasUpdates xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" 
        jf:conditionals="/data/conditionals/evaluatesTo#something"><child>child text</child></hasUpdates>`).documentElement
    const chain = new TransformerContextChain(0, null, [nextChain])
    const initialMetadata = new TransformerMetadata().set(META_SETTINGS, settingsX)

    nextChain.mockReturnValue("Chained")

    mockGetUri.mockResolvedValue([condition])

    const { container, queryByText } = render(<UpdateConditionals
      nodes={[hasUpdates]} metadata={initialMetadata} chain={chain}
      documentName={docName} documentApi={docApi}/>)

    await wait(() => mockGetUri.toHaveBeenCalledTimes(2))

    expect(mockGetUri.mock.calls[0][0]).toBe("/data/conditionals/evaluatesTo#something")
    expect(mockGetUri.mock.calls[0][1]).toBe(docName)
    expect(mockGetUri.mock.calls[0][2]).toBe(docApi)

    expect(queryByText("Chained")).toBeInTheDocument()
    expect(container.querySelector(".UpdateConditionals .Conditional" + conditionalClass)).toBeInTheDocument()
  }

  it("passes to children if the condition evaluates to YES", () => {
    evalsTo(settingsY, "Yes")
  })

  it("passes to children if the condition evaluates to MAYBE", () => {
    evalsTo(settingsM, "Maybe")
  })

})