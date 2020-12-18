/* GenericElement.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {text2xml} from "../TestUtils"
import Transformer from "../Transformer"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import GenericElement from "../GenericElement"
import TransformerMetadata from "../TransformerMetadata"

describe("GenericElement", () => {
  const mockTraverse = jest.fn()
  let realTraverse
  beforeAll( () => {
    realTraverse = Transformer.traverseChildren
    Transformer.traverseChildren = mockTraverse
  })

  beforeEach( () => {
    mockTraverse.mockReset()
  })

  afterAll( () => {
    Transformer.traverseChildren = realTraverse
  })

  it("traverses the children of the given node", () => {
    const nodes = [text2xml(`<test><child1>one</child1><child2>child</child2></test>`).documentElement]
    const metadata = new TransformerMetadata().set("test", "testValue")
    const mockReturn = "traversed"
    mockTraverse.mockReturnValue(mockReturn)

    const { container, queryByText } = render(<GenericElement nodes={nodes} metadata={metadata}/>)

    expect(mockTraverse).toHaveBeenCalledTimes(1)
    expect(mockTraverse.mock.calls[0][0]).toMatchObject(nodes[0])
    expect(mockTraverse.mock.calls[0][1]).toMatchObject({
      nodes: nodes,
      metadata: metadata
    })

    expect(container.querySelector("div.test")).toBeInTheDocument()

    expect(queryByText(mockReturn)).toBeInTheDocument()
  })
})