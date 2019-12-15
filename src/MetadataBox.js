/* MetadataBox
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

import SmallLicenseBox from "./SmallLicenseBox"

/** An HTML box that includes changed metadata
 *
 * @param props updates: contains all metadata updates as a MetadataUpdateList objects
 */
export default function MetadataBox(props) {
  console.log("*** Metadata updates=", props)

  return (<div className="MetadataBox">
    {props.updates.license && <SmallLicenseBox license={props.updates.license.license}/>}
  </div>)
}