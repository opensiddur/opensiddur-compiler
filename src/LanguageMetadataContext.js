/* LanguageMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

/* Language has only 1 types of context:
 * Current context, supporting the XML hierarchy (r/o)
 */

// languages are stored as strings
export const CurrentLanguageContext = React.createContext(null)