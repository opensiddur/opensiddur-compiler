/* DocumentFragment.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import TransformerMetadata from "../TransformerMetadata"
import {text2xml} from "../TestUtils"
import Transformer from "../Transformer"
import DocumentFragment from "../DocumentFragment"

describe("DocumentFragment", () => {
  const mockTraverse = jest.fn()
  let realTraverse

  beforeAll( () => {
    realTraverse = Transformer.traverseChildren
    Transformer.traverseChildren = mockTraverse
    mockTraverse.mockReturnValue(null)
  })

  afterEach( () => {
    mockTraverse.mockReset()
  })

  afterAll( () => {
    Transformer.applyTo = realTraverse
  })

  it("applies the traversal transform on the document fragment", () => {
    const node = text2xml(`<docElement>some text here</docElement>`).documentElement
    const df = document.createDocumentFragment()
    df.appendChild(node)
    const nodes = [df]
    const metadata = new TransformerMetadata()
    const { container } = render(<DocumentFragment nodes={nodes} metadata={metadata} />)

    expect(mockTraverse).toHaveBeenCalledTimes(1)
    expect(mockTraverse.mock.calls[0][0].nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE)
    expect(mockTraverse.mock.calls[0][1]).toMatchObject({ metadata: metadata })
  })
})