/* Expandable.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import Expandable from "../Expandable"

describe("Expandable", () => {
  it("displays in the collapsed state, toggles open, then toggles closed", () => {
    const testString = "This is a test"
    const { getByRole, queryByRole } = render(<Expandable icon="bus" title={testString}>
      <div role="child">Child content</div>
    </Expandable>)

    // expect that we're off
    expect(queryByRole("child")).not.toBeInTheDocument()
    fireEvent.click(getByRole("toggle"))

    // test that we toggled on
    expect(queryByRole("child")).toBeInTheDocument()
    fireEvent.click(getByRole("toggle"))

    // test that we toggled off
    expect(queryByRole("child")).not.toBeInTheDocument()
  })
})