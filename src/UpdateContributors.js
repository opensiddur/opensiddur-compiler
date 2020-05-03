/* UpdateContributors
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata from "./TransformerMetadata"
import {DOCUMENT_CONTEXT_SWITCH, META_CONTRIBUTORS} from "./Transformer"
import ContributorList from "./ContributorList"
import React from "react"

export default function UpdateContributors(props) {
  const full = props.chain.level >= DOCUMENT_CONTEXT_SWITCH
  const newContributors = full && TransformerMetadata.contextContributors(props.nodes[0])
  const needsChange = full && newContributors

  if (needsChange) {
    const nextMetadata = props.metadata.set(META_CONTRIBUTORS, newContributors)

    return <div className="UpdateContributors">
      <ContributorList contributors={newContributors} />
      {props.chain.nextWithMetadataUpdate(props, nextMetadata)}
    </div>
  }
  else {
    return props.chain.next(props)
  }
}