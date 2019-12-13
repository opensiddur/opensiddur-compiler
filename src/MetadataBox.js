/* MetadataBox
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

import SmallLicenseBox from "./SmallLicenseBox"
import {META_LICENSE} from "./Transformer"

/** An HTML box that includes changed metadata
 *
 * @param props metadata: contains all metadata
 */
export default function MetadataBox(props) {
  return (<div className="MetadataBox">
    <SmallLicenseBox license={props.metadata.get(META_LICENSE)}/>
  </div>)
}