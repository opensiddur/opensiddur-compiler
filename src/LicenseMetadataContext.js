/* LicenseMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {CONTRIBUTOR_TYPES} from "./Transformer"
import GenericMetadataContext, {defaultActivationReducer} from "./GenericMetadataContext"

/* License has 3 types of context:
 * Global context, supporting a global list of licenses (r/w)
 * Active context, supporting the user-activated local sidebar (r/w)
 * Current context, supporting the XML hierarchy (r/o)
 */

// licenses are stored as license URIs
export const GlobalLicenseContext = React.createContext(new Set())
export const ActiveLicenseContext = React.createContext(null)
export const CurrentLicenseContext = React.createContext(null)

/** Add a license to the global list
 *
 * @param oldLicenseList {Set}
 * @param newLicense {String}
 * @return {Set}
 */
const licenseReducer = (oldLicenseList, newLicense) => {
  console.log("whatsit? ", oldLicenseList, "+", newLicense)
  return new Set(oldLicenseList).add(newLicense)
}

export const LicenseMetadataContext = (props) =>
  GenericMetadataContext(props, GlobalLicenseContext, ActiveLicenseContext, licenseReducer,
    defaultActivationReducer, new Set(), null)
