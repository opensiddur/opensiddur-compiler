/* LicenseList
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

/** List licenses
 *
 * @param licenses {Iterable} An iterable of licenses
 * @return {*}
 * @constructor
 */
export default function LicenseList({licenses}) {
  const lic = new License()
  const licenseNames = Array.from(licenses).map ( (L) => { return {url: L, name: lic.urlToName(L) } })

  return (<div className="LicenseList">
    { licenseNames.length > 0 && <h2>{licenseNames.length === 1 ? "License" : "Licenses"}</h2>}
    <ul>
    { licenseNames.map ( ({url, name}) => {
        return <li key={url}><a href={url}>{name}</a></li>
      }
      )
    }
    </ul>
  </div> )
}