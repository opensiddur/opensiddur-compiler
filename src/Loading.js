/* Loading.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from "react-loader-spinner"

export default function Loading() {
  return <div className="Loading" role="status"><Loader type="ThreeDots" loading={true} color="black"
                                                        height="1m" width="3em" timeout={1000}/></div>
}
