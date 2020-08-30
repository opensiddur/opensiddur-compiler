/* InlineModeContext.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
/*
When inline mode is true, it indicates that hierarchy other than text should be ignored. It defaults false
 */

import * as React from "react"

export const InlineMode = React.createContext(false)

/* istanbul ignore next */
export default function InlineModeContext({children}) {
  return (<InlineMode.Provider value={false}>
    {children}
  </InlineMode.Provider>)
}