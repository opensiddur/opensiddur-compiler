/* SourceList
 * Represent a list of sources
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import SourceRecord from "./SourceRecord"
import "./SourceList.css"

/** Show a list of sources
 *
 * @param props sources: A list of ContextSourceInfo structures
 * @constructor
 */
export default function SourceList(props) {
  const sources = props.sources

  return (<div className="SourceList" lang="en">
    { (sources.length > 0) && <h2>Sources</h2> }
    {
      sources.map( (source) => {
        return <SourceRecord key={source.resource} source={source} />
      })
    }
  </div> )
}