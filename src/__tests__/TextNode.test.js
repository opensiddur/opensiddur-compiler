/* TextNode.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import {text2xml} from "../TestUtils"
import TransformerMetadata from "../TransformerMetadata"
import TextNode from "../TextNode"
import {META_INLINE_MODE} from "../Transformer"

describe("TextNode", () => {
  const inlineMode = new TransformerMetadata().set(META_INLINE_MODE, true)

  it("when not in inline mode, copies the text", () => {
    const metadata = new TransformerMetadata()
    const txt = [text2xml(`<test>one</test>`).documentElement.firstChild]
    const { queryByText } = render(<TextNode metadata={metadata} nodes={txt}/>)

    expect(queryByText(/one/)).toBeInTheDocument()
  })

  it("when in inline mode and the parent is a stream element, copy the text", () => {
    const txt = [text2xml(`<test xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0" jf:stream="x">one</test>`)
      .documentElement.firstChild]
    const { queryByText } = render(<TextNode metadata={inlineMode} nodes={txt}/>)

    expect(queryByText(/one/)).toBeInTheDocument()
  })

  it("when in inline mode and the parent is not a stream element, ignore", () => {
    const txt = [text2xml(`<test>one</test>`)
      .documentElement.firstChild]
    const { queryByText } = render(<TextNode metadata={inlineMode} nodes={txt}/>)

    expect( queryByText(/one/)).not.toBeInTheDocument()
  })

  it("when in inline mode and the parent is a document fragment, copy", () => {
    const df = document.createDocumentFragment()
    df.appendChild(document.createTextNode("one"))
    const txt = [df.firstChild]
    const { queryByText } = render(<TextNode metadata={inlineMode} nodes={txt}/>)

    expect(queryByText(/one/)).toBeInTheDocument()
  })


})
