/* GenericMetadataContext.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {defaultActivationReducer} from "../GenericMetadataContext"

describe("defaultActivationReducer", () => {
  it("returns the new value", () => {
    const result = defaultActivationReducer("old", "new")
    expect(result).toBe("new")
  })
})
