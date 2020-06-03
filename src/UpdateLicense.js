/* UpdateLicense
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {DOCUMENT_CONTEXT_SWITCH, META_LICENSE} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"
import SmallLicenseBox from "./SmallLicenseBox"
import {faGavel} from "@fortawesome/free-solid-svg-icons"
import Expandable from "./Expandable"

/** update the licensing metadata. License data can only change when the document has changed
 * @param props Required props are chain, metadata, node
 */
export default function UpdateLicense(props) {
  const level = props.chain.level
  const full = level >= DOCUMENT_CONTEXT_SWITCH
  const oldLicense = full && props.metadata.get(META_LICENSE)
  const newLicense = full && TransformerMetadata.contextLicense(props.nodes[0])
  const needsChange = full && (newLicense && (!oldLicense || oldLicense !== newLicense))

  if (needsChange) {
    return <div className="UpdateLicense">
      <Expandable icon={faGavel} title="Copyright license">
        <SmallLicenseBox license={newLicense}/>
      </Expandable>
      {
        props.chain.nextWithMetadataUpdate(props, props.metadata.set(META_LICENSE, newLicense))
    }</div>
  }
  else {
    return props.chain.next(props)
  }
}
