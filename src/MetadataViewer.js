/* MetadataViewer
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import React, {useContext} from "react"
import {ActiveContributorContext} from "./ContributorMetadataContext"
import ContributorList from "./ContributorList"

export default function MetadataViewer() {
  const contributorContext = useContext(ActiveContributorContext)

  const deactivate = () => {
    contributorContext.activateState({})
  }

  return <div className="MetadataViewer">
    <button onClick={deactivate}>Close</button>
    <ContributorList contributors={contributorContext.activeState}/>
  </div>
}