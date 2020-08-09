/* JfParallelGrp
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer, {LOCATION_CONTEXT_SWITCH} from "./Transformer"
import "./JfParallelGrp.css"

export default function JfParallelGrp(props) {
  const xml = props.nodes[0]
  const parallelGrps = Transformer.getParallels(xml.ownerDocument, xml).map( (pg) => {
    // TODO: each other parallel group might need a forced context switch
    // LOCATION_CONTEXT_SWITCH will force a language switch, but sources, licenses are not referenced correctly
    return Transformer.traverseChildren(pg, props, LOCATION_CONTEXT_SWITCH)
  })
  const parsedChildren = Transformer.traverseChildren(xml, props)
  return (<div className={xml.tagName}>
    <div className="parallelRow">
    {parsedChildren}
    {parallelGrps}
    </div>
  </div>)
}