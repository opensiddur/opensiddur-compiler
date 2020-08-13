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

const contributorReducer = (oldContributorList, newContributorList) => {
  let contributorsByType = {}
  for (const contribType of Object.keys(CONTRIBUTOR_TYPES)) {
    contributorsByType[contribType] = new Set([
      ...(oldContributorList[contribType] || new Set()),
      ...(newContributorList[contribType] || new Set())
    ])
  }
  return contributorsByType
}

const activationReducer = (acs, newContributorList) => {
  return newContributorList
}

export const ContributorMetadataContext = (props) =>
  GenericMetadataContext(props, GlobalContributorContext, ActiveContributorContext, contributorReducer, activationReducer)

export function GenericMetadataContext(props, globalContext, activationContext, globalStateReducer, activationReducer) {

  const [globalState, registerGlobalState] = useReducer(globalStateReducer, {})

  const globalContextValue = useMemo(() => {
    return { globalState, registerGlobalState }
  }, [globalState, registerGlobalState])

  const [activeState, activateState] = useReducer( activationReducer, {})

  const activeContextValue = useMemo(() => {
    return { activeState, activateState };
  }, [activeState, activateState]);

  return <globalContext.Provider value={globalContextValue}>
    <activationContext.Provider value={activeContextValue}>
      {props.children}
    </activationContext.Provider>
  </globalContext.Provider>
}