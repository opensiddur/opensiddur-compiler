/* DocumentNode.test
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
import DocumentNode from "../DocumentNode"

describe("DocumentNode", () => {
  const mockApplyTo = jest.fn()
  let realApplyTo

  beforeAll( () => {
    realApplyTo = Transformer.applyTo
    Transformer.applyTo = mockApplyTo
    mockApplyTo.mockReturnValue(null)
  })

  afterEach( () => {
    mockApplyTo.mockReset()
  })

  afterAll( () => {
    Transformer.applyTo = realApplyTo
  })

  it("applies the Transformer on the document element", () => {
    const nodes = [text2xml(`<docElement>some text here</docElement>`)]
    const metadata = new TransformerMetadata()
    const { container } = render(<DocumentNode nodes={nodes} metadata={metadata} />)

    expect(mockApplyTo).toHaveBeenCalledTimes(1)
    expect(mockApplyTo.mock.calls[0][0][0].tagName).toBe("docElement")
    expect(mockApplyTo.mock.calls[0][1]).toMatchObject({ metadata: metadata })
  })
})