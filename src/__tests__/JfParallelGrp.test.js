/* JfParallelGrp.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import Transformer, {DOCUMENT_CONTEXT_SWITCH, ELEMENT_CONTEXT_SWITCH} from "../Transformer"
import {text2xml} from "../TestUtils"
import JfParallelGrp from "../JfParallelGrp"

describe("JfParallelGrp", () => {
  let realGetParallels
  let realTraverseChildren
  const mockGetParallels = jest.fn()
  const mockTraverseChildren = jest.fn()

  beforeAll( () => {
    realGetParallels = Transformer.getParallels
    realTraverseChildren = Transformer.traverseChildren
    Transformer.getParallels = mockGetParallels
    Transformer.traverseChildren = mockTraverseChildren
  })

  beforeEach( () => {
    mockGetParallels.mockReset()
    mockTraverseChildren.mockReset()
  })

  afterAll( () => {
    Transformer.traverseChildren = realTraverseChildren
    Transformer.getParallels = realGetParallels
  })

  it("returns a parallel group containing all parallels", () => {
    const node = [text2xml(`<jf:parallelGrp xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0">
        <child1>child 1</child1>text node<child2>child 2</child2>
        </jf:parallelGrp>`).documentElement]
    mockGetParallels.mockReturnValue([text2xml(`<p>parallel 1</p>`).documentElement])
    mockTraverseChildren.mockReturnValueOnce("parsed-original")
    mockTraverseChildren.mockReturnValueOnce("parsed-children")
    const {getByText} = render(<JfParallelGrp nodes={node}/>)

    expect(getByText(/parsed-original/)).toBeInTheDocument()
    expect(getByText(/parsed-children/)).toBeInTheDocument()

    expect(mockGetParallels).toHaveBeenCalledTimes(1)

    expect(mockTraverseChildren).toHaveBeenCalledTimes(2)
    expect(mockTraverseChildren.mock.calls[0][2]).toBe(DOCUMENT_CONTEXT_SWITCH)

    expect(mockTraverseChildren.mock.calls[1][2]).toBe(ELEMENT_CONTEXT_SWITCH)

  })
})