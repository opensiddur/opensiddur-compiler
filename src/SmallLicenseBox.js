/* SmallLicenseBox
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

export class License {
  constructor() {

    this.licenses = {
      "zero" : "Creative Commons Zero Public Domain Declaration",
      "by": "Creative Commons Attribution License",
      "by-sa": "Creative Commons Attribution ShareAlike License"
    }
  }

  /** Map a License URL to a license name and version
   * @param license the URL of the Creative Commons license
   * @return string name and version string
   */
  urlToName(license) {
    const url = new URL(license)

    console.assert(url.hostname.endsWith("creativecommons.org"),
      "Only Creative Commons Licenses are supported. Got " + license)

    const pathParts = url.pathname.split("/").filter((s) => s !== "")
    const licenseType = pathParts[1]
    const version = pathParts[2]

    return this.licenses[licenseType] + " " + version
  }

}

/** Display a license link and text, given a license URL
 *
 * @param props license: license URL for a supported Creative Commons License
 * @constructor
 */
export default function SmallLicenseBox(props) {
  //console.log("***props =", props)
  const licenseName = new License().urlToName(props.license)

  return (<div className="LicenseBox">License: <a href={props.license}>{licenseName}</a></div>)
}