/* UpdateContributors
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata from "./TransformerMetadata"
import {DOCUMENT_CONTEXT_SWITCH} from "./Transformer"
import React, {useContext, useEffect} from "react"
import {GlobalContributorContext, CurrentContributorContext} from "./ContributorMetadataContext"

/** Utility to determine if the object is empty
 *
 * @param obj Any object
 * @return {boolean} true if object is empty
 */
function isEmptyObject(obj) {
  for (const x in obj) return false
  return true
}

export default function UpdateContributors(props) {
  const full = props.chain.level >= DOCUMENT_CONTEXT_SWITCH
  const newContributors = full && TransformerMetadata.contextContributors(props.nodes[0])
  const needsChange = full && !isEmptyObject(newContributors)

  const globalContributorContext = useContext(GlobalContributorContext)

  useEffect( () => {
    needsChange && globalContributorContext.registerGlobalState(newContributors)
  }, [needsChange])

  if (needsChange) {
    return (<div className="UpdateContributors">
      <CurrentContributorContext.Provider value={newContributors}>{
        props.chain.next(props)
      }</CurrentContributorContext.Provider></div>)
  }
  else {
    return props.chain.next(props)
  }
}