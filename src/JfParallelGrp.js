/* JfParallelGrp
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer, {DOCUMENT_CONTEXT_SWITCH, ELEMENT_CONTEXT_SWITCH, LOCATION_CONTEXT_SWITCH} from "./Transformer"
import "./JfParallelGrp.css"

export default function JfParallelGrp(props) {
  const xml = props.nodes[0]
  const parallelGrps = Transformer.getParallels(xml.ownerDocument, xml).map( (pg) => {
    // DOCUMENT_CONTEXT_SWITCH will force a potential language, sources, licenses switch
    return Transformer.traverseChildren(pg, props, DOCUMENT_CONTEXT_SWITCH)
  })
  const parsedChildren = Transformer.traverseChildren(xml, props, ELEMENT_CONTEXT_SWITCH,
    (xml) => { return xml.nodeType === Node.ELEMENT_NODE })
  return (<div className={xml.tagName}>
    <div className="parallelRow">
    {parsedChildren}
    {parallelGrps}
    </div>
  </div>)
}