/* Main entry point for the document viewer
 * Takes 1 parameter, which is the document to be viewed.
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from 'react'
import {useParams} from "react-router"

export default function Viewer() {
  const { document } = useParams()
  // just a placeholder
  return <div className="Viewer">Document chosen: {document} </div>
}