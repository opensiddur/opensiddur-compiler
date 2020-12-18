/* GenericMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useMemo, useReducer} from "react"

export const defaultActivationReducer = (oldValue, newValue) => {
  return newValue
}

/* istanbul ignore next */
/** Set up the global and activation metadata contexts, given the contexts themselves, reducers, and initializers
 *
 * @param children Child React components
 * @param globalContext global context, returned from React.createContext
 * @param activationContext activation context, returned from React.createContext
 * @param globalStateReducer A function that takes 2 parameters: (priorState, newState) and joins them into the
 *                           next global state
 * @param activationReducer A function that takes 2 parameters: (priorState, newState) and joins them into the
 *                          next active state
 * @param globalInitializer The initial value of the global state
 * @param activationInitializer The initial value of the activate state
 * @return {*}
 * @constructor
 */
export default function GenericMetadataContext(
  {children}, globalContext, activationContext, globalStateReducer, activationReducer=defaultActivationReducer,
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
      {children}
    </activationContext.Provider>
  </globalContext.Provider>
}