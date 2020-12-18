/* SourcesMetadataContext.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {ContextSourceInfo} from "../ContextSourceInfo"
import {sourcesReducer} from "../SourcesMetadataContext"

describe("sourcesReducer", () => {
  const srcList1 = [
    new ContextSourceInfo("R1"),
    new ContextSourceInfo("R2"),
  ]
  const srcList2 = [
    new ContextSourceInfo("R2"),
    new ContextSourceInfo("R3"),
  ]

  const srcUnion = [
    new ContextSourceInfo("R1"),
    new ContextSourceInfo("R2"),
    new ContextSourceInfo("R3"),
  ]

  it("returns the old source list if the new one is empty", () => {
    const result = sourcesReducer(srcList1, [])
    expect(result).toMatchObject(srcList1)
  })

  it("combines the new and old source lists if they have any overlap", () => {
    const result = sourcesReducer(srcList1, srcList2)
    expect(result).toMatchObject(srcUnion)
    expect(srcList1).toBe(srcList1)
  })
})