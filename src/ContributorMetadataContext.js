/* ContributorMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useMemo, useReducer} from "react"
import {CONTRIBUTOR_TYPES} from "./Transformer"

/* Contributors has 3 types of context:
 * Global context, supporting a global bibliography (r/w)
 * Active context, supporting the user-activated local sidebar (r/w)
 * Current context, supporting the XML hierarchy (r/o)
 */

// contributor lists are stored as
// { contributorType: Set(contributorUri) }
export const GlobalContributorContext = React.createContext({})
export const ActiveContributorContext = React.createContext({})
export const CurrentContributorContext = React.createContext({})

export default function ContributorMetadataContext(props) {

  const [globalContributorState, registerGlobalContributorState] = useReducer( (oldContributorList, newContributorList) => {
    let contributorsByType = {}
    for (const contribType of Object.keys(CONTRIBUTOR_TYPES)) {
      contributorsByType[contribType] = new Set([
        ...(oldContributorList[contribType] || new Set()),
        ...(newContributorList[contribType] || new Set())
      ])
    }
    return contributorsByType
  }, {})

  const globalContributorContextValue = useMemo(() => {
    return { globalContributorState, registerGlobalContributorState }
  }, [globalContributorState, registerGlobalContributorState])

  const [activeContributorState, activateContributorState] = useReducer( (acs, newContributorList) => {
    return newContributorList
  }, {})

  const activeContributorContextValue = useMemo(() => {
    return { activeContributorState, activateContributorState };
  }, [activeContributorState, activateContributorState]);

  return <GlobalContributorContext.Provider value={globalContributorContextValue}>
    <ActiveContributorContext.Provider value={activeContributorContextValue}>
      {props.children}
    </ActiveContributorContext.Provider>
  </GlobalContributorContext.Provider>
}