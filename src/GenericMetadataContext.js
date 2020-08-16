/* GenericMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useMemo, useReducer} from "react"

export const defaultActivationReducer = (oldValue, newValue) => {
  return newValue
}

export default function GenericMetadataContext(
  props, globalContext, activationContext, globalStateReducer, activationReducer=defaultActivationReducer,
  globalInitializer = {},
  activationInitializer = {}) {

  const [globalState, registerGlobalState] = useReducer(globalStateReducer, globalInitializer)

  const globalContextValue = useMemo(() => {
    return { globalState, registerGlobalState }
  }, [globalState, registerGlobalState])

  const [activeState, activateState] = useReducer(activationReducer, activationInitializer)

  const activeContextValue = useMemo(() => {
    return { activeState, activateState }
  }, [activeState, activateState])

  return <globalContext.Provider value={globalContextValue}>
    <activationContext.Provider value={activeContextValue}>
      {props.children}
    </activationContext.Provider>
  </globalContext.Provider>
}