/* UpdateSources
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {DOCUMENT_CONTEXT_SWITCH, META_SOURCES} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"
import SourceList from "./SourceList"
import Expandable from "./Expandable"
import {faBookOpen} from "@fortawesome/free-solid-svg-icons"

export default function UpdateSources(props) {
  const metadata = props.metadata
  const full = props.chain.level >= DOCUMENT_CONTEXT_SWITCH
  const newSources = full && TransformerMetadata.contextSources(props.nodes[0])
  const needsChange = full && newSources

  if (needsChange) {
    const nextMetadata = metadata.set(META_SOURCES, newSources)
    return <div className="UpdateSources">
      <Expandable icon={faBookOpen} title="Source list">
        <SourceList sources={newSources} />
      </Expandable>
      { props.chain.nextWithMetadataUpdate(props, nextMetadata) }
    </div>
  }
  else {
    return props.chain.next(props)
  }

}