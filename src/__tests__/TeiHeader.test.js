/* TeiHeader.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import TeiHeader from "../TeiHeader"

describe("teiHeader", () => {
  it("does not render anything", () => {

    const nodeList = []
    const { container } = render(<TeiHeader nodes={nodeList}/>)
    expect(container.hasChildNodes()).toBe(false)
  })
})