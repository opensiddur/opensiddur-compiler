/* LicenseMetadataContext.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {licenseReducer} from "../LicenseMetadataContext"

describe("licenseReducer", () => {
  it("adds a new license to a global list once", () => {
    const set1 = null
    const lic1 = "LIC1"
    const lic2 = "LIC2"

    const result1 = licenseReducer(set1, lic1)
    expect(result1).toContain(lic1)

    const result2 = licenseReducer(result1, lic2)
    expect(result2).toContain(lic1)
    expect(result2).toContain(lic2)
    expect(result1).not.toContain(lic2) // make sure we don't change prior results
  })
})