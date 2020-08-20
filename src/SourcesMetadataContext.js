/* SourcesMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import GenericMetadataContext, {defaultActivationReducer} from "./GenericMetadataContext"


// source lists are stored as lists of ContextSourceInfo structures
export const GlobalSourcesContext = React.createContext([])
export const ActiveSourcesContext = React.createContext(null)
export const CurrentSourcesContext = React.createContext([])

/** Add sources to a global list
 *
 * @param oldSourceList {Array<ContextSourceInfo>}
 * @param newSourceList {Array<ContextSourceInfo>}
 * @return {Array<ContextSourceInfo>}
 */
export function sourcesReducer(oldSourceList, newSourceList) {
  let reduced = [...oldSourceList] // copy oldSourceList

  let sourceResources = new Set(reduced.map ( (sc) => sc.resource ))
  newSourceList.forEach( (sc) => {
    if (!sourceResources.has(sc.resource)) {
      reduced.push(sc)
      sourceResources.add(sc.resource)
    }
  })

  return reduced
}

/* istanbul ignore next */
export const SourcesMetadataContext = (props) =>
  GenericMetadataContext(props, GlobalSourcesContext, ActiveSourcesContext, sourcesReducer, defaultActivationReducer,
    [], null)
