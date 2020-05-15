/* TeiAnchor.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'
import TeiAnchor from "../TeiAnchor"
import {text2xml} from "../TestUtils"

describe("TeiAnchor", () => {
  it("returns an 'a id' element", () => {
    const node = text2xml(`<tei:anchor 
    xmlns:tei="http://www.tei-c.org/ns/1.0" 
    xmlns:jf="http://jewishliturgy.org/ns/jlptei/flat/1.0"
    jf:id="anchor1"/>`).documentElement
    const nodes = [node]
    const { container } = render(<TeiAnchor nodes={nodes}/>)

    const result = container.querySelector("a.TeiAnchor")
    expect(result).toBeInTheDocument()
    expect(result.getAttribute("data-jf-id")).toBe("anchor1")
    expect(result.getAttribute("id")).toMatch(/anchor1_(\d{1,10})/)
  })
})