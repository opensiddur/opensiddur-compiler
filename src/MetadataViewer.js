/* MetadataViewer
 * includes ActiveMetadataViewer and GlobalMetadataViewer
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import React, {useContext} from "react"
import {ActiveContributorContext, GlobalContributorContext} from "./ContributorMetadataContext"
import ContributorList from "./ContributorList"
import SourceList from "./SourceList"
import {ActiveLicenseContext, GlobalLicenseContext} from "./LicenseMetadataContext"
import LicenseList from "./LicenseList"
import {ActiveSourcesContext, GlobalSourcesContext} from "./SourcesMetadataContext"

export function ActiveMetadataViewer({ children }) {
  const contributorContext = useContext(ActiveContributorContext)
  const licenseContext = useContext(ActiveLicenseContext)
  const sourceContext = useContext(ActiveSourcesContext)

  const deactivate = () => {
    contributorContext.activateState({})
    licenseContext.activateState(null)
    sourceContext.activateState(null)
  }

  return <div className="ActiveMetadataViewer">
    <button onClick={deactivate}>Close</button>
    { children }
    { licenseContext.activeState && <LicenseList licenses={[licenseContext.activeState]}/>}
    { sourceContext.activeState && <SourceList sources={sourceContext.activeState}/>}
    <ContributorList contributors={contributorContext.activeState}/>
  </div>
}


export function GlobalMetadataViewer({ children }) {
  const contributorContext = useContext(GlobalContributorContext)
  const licenseContext = useContext(GlobalLicenseContext)
  const sourceContext = useContext(GlobalSourcesContext)

  return <div className="GlobalMetadataViewer">
    {children}
    <LicenseList licenses={licenseContext.globalState}/>
    <SourceList sources={sourceContext.globalState}/>
    <ContributorList contributors={contributorContext.globalState}/>
  </div>
}