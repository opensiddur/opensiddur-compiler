/* UpdateSources
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useContext, useEffect} from "react"
import {DOCUMENT_CONTEXT_SWITCH} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"
import {CurrentSourcesContext, GlobalSourcesContext} from "./SourcesMetadataContext"

export default function UpdateSources(props) {
  const globalSourcesContext = useContext(GlobalSourcesContext)

  const full = props.chain.level >= DOCUMENT_CONTEXT_SWITCH
  const newSources = full && TransformerMetadata.contextSources(props.nodes[0])
  const needsChange = !!(full && newSources)

  useEffect( () => {
    newSources && globalSourcesContext.registerGlobalState(newSources)
  }, [needsChange])

  if (needsChange) {
    return <div className="UpdateSources">
      <CurrentSourcesContext.Provider value={newSources}>
      { props.chain.next(props) }
      </CurrentSourcesContext.Provider>
    </div>
  }
  else {
    return props.chain.next(props)
  }

}