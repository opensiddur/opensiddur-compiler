/* MetadataViewer
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import React, {useContext} from "react"
import {ActiveContributorContext} from "./ContributorMetadataContext"
import ContributorList from "./ContributorList"
import SourceList from "./SourceList"
import {ActiveLicenseContext} from "./LicenseMetadataContext"
import SmallLicenseBox from "./SmallLicenseBox"
import {ActiveSourcesContext} from "./SourcesMetadataContext"

export default function MetadataViewer() {
  const contributorContext = useContext(ActiveContributorContext)
  const licenseContext = useContext(ActiveLicenseContext)
  const sourceContext = useContext(ActiveSourcesContext)

  const deactivate = () => {
    contributorContext.activateState({})
    licenseContext.activateState(null)
    sourceContext.activateState(null)
  }

  return <div className="MetadataViewer">
    <button onClick={deactivate}>Close</button>
    { licenseContext.activeState && <SmallLicenseBox license={licenseContext.activeState}/>}
    { sourceContext.activeState && <SourceList sources={sourceContext.activeState}/>}
    <ContributorList contributors={contributorContext.activeState}/>
  </div>
}