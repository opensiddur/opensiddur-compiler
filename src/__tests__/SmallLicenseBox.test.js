/* SmallLicenseBox.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import '@testing-library/jest-dom/extend-expect'

import { render } from "@testing-library/react"
import {License} from "../SmallLicenseBox"
import SmallLicenseBox from "../SmallLicenseBox"

describe("License class", () => {
  const lic = new License()

  const CC0 = "http://creativecommons.org/publicdomain/zero/1.0"
  const CCBY = "http://creativecommons.org/licenses/by/4.0"
  const CCBYSA = "http://creativecommons.org/licenses/by-sa/4.0"

  test("urlToName converts Creative Commons license URLs to name/version strings", () => {
    const cc0result = lic.urlToName(CC0)

    expect(cc0result).toMatch(/Creative Commons/)
    expect(cc0result).toMatch(/Zero/)
    expect(cc0result).toMatch(/1\.0/)

    const byresult = lic.urlToName(CCBY)
    expect(byresult).toMatch(/Creative Commons/)
    expect(byresult).toMatch(/Attribution/)
    expect(byresult).toMatch(/4\.0/)

    const bysaresult = lic.urlToName(CCBYSA)
    expect(bysaresult).toMatch(/Creative Commons/)
    expect(bysaresult).toMatch(/Attribution/)
    expect(bysaresult).toMatch(/ShareAlike/)
    expect(bysaresult).toMatch(/4\.0/)

  })
})

describe("SmallLicenseBox", () => {
  it("expands and renders the name of the license given by the URL", () => {
    const testLicense = "http://www.creativecommons.org/licenses/by/4.0"
    const { getByText, getByRole } = render(<SmallLicenseBox license={testLicense}/>)

    const licenseText = getByText(/Creative Commons/)
    expect(licenseText.textContent).toMatch(/Attribution/)
    expect(licenseText.textContent).toMatch(/4\.0/)
    expect(licenseText.href).toBe(testLicense)
  })
})