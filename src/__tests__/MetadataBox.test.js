/* MetadataBox.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import MetadataBox from "../MetadataBox"
import {MetadataUpdate, MetadataUpdateList} from "../TransformerMetadata"

describe("MetadataBox", () => {
  it("displays an empty box given no updates", () => {
    const noUpdates = new MetadataUpdateList()
    const { container } = render(<MetadataBox updates={noUpdates}/>)

    expect(container.querySelector(".MetadataBox").childElementCount).toBe(0)
  })

  it("displays a license box when a license update is present", () => {
    const licenseUpdate = new MetadataUpdateList([
      new MetadataUpdate({ license: "http://creativecommons.org/publicdomain/zero/1.0"})])
    const { getByText } = render(<MetadataBox updates={licenseUpdate}/>)

    expect(getByText(/License/)).toBeInTheDocument()
  })
})