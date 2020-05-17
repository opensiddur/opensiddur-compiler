/* TextNode.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import {text2xml} from "../TestUtils"
import TextNode from "../TextNode"

describe("TextNode", () => {
  it("copies the text", () => {
    const txt = [text2xml(`<test>one</test>`).documentElement.firstChild]
    const { queryByText } = render(<TextNode nodes={txt}/>)

    expect(queryByText(/one/)).toBeInTheDocument()
  })
})
