/* UpdateLicense
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useContext, useEffect} from "react"
import {DOCUMENT_CONTEXT_SWITCH} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"
import {CurrentLicenseContext, GlobalLicenseContext} from "./LicenseMetadataContext"

/** update the licensing metadata. License data can only change when the document has changed
 * @param props Required props are chain, metadata, node
 */
export default function UpdateLicense(props) {
  const globalLicenseContext = useContext(GlobalLicenseContext)
  const currentLicenseContext = useContext(CurrentLicenseContext)

  const level = props.chain.level
  const full = level >= DOCUMENT_CONTEXT_SWITCH
  const oldLicense = full && currentLicenseContext
  const newLicense = full && TransformerMetadata.contextLicense(props.nodes[0])
  const needsChange = !!(full && (newLicense && (!oldLicense || oldLicense !== newLicense)))

  useEffect( () => {
    needsChange && newLicense && globalLicenseContext.registerGlobalState(newLicense)
  }, [needsChange])

  if (needsChange) {
    return <div className="UpdateLicense">
      <CurrentLicenseContext.Provider value={newLicense}>
      {
        props.chain.next(props)
    }</CurrentLicenseContext.Provider>
    </div>
  }
  else {
     return props.chain.next(props)
  }
}
