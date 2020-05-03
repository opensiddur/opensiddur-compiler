/* UpdateSources
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {DOCUMENT_CONTEXT_SWITCH, META_SOURCES} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"
import SourceList from "./SourceList"

export default function UpdateSources(props) {
  const metadata = props.metadata
  const full = props.chain.level >= DOCUMENT_CONTEXT_SWITCH
  const newSources = full && TransformerMetadata.contextSources(props.nodes[0])
  const needsChange = full && newSources

  if (needsChange) {
    const nextMetadata = metadata.set(META_SOURCES, newSources)
    return <div className="UpdateSources">
      <SourceList sources={newSources} />
      { props.chain.nextWithMetadataUpdate(props, nextMetadata) }
    </div>
  }
  else {
    return props.chain.next(props)
  }

}