/* JfParallelGrp
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {Fragment} from "react"
import Transformer, {DOCUMENT_CONTEXT_SWITCH, ELEMENT_CONTEXT_SWITCH} from "./Transformer"
import "./JfParallelGrp.css"

export default function JfParallelGrp(props) {
  const xml = props.nodes[0]
  const parallelGrps = Transformer.getParallels(xml.ownerDocument, xml).map( (pg) => {
    // DOCUMENT_CONTEXT_SWITCH will force a potential language, sources, licenses switch
    return Transformer.traverseChildren(pg, props, DOCUMENT_CONTEXT_SWITCH)
  })
  const parsedChildren = Transformer.traverseChildren(xml, props, ELEMENT_CONTEXT_SWITCH,
    (xml) => { return xml.nodeType === Node.ELEMENT_NODE })
  // the 2 fragments here will avoid duplicated keys in the parsed children and parallel groups
  return (<div className={xml.tagName}>
    <div className="parallelRow">
      <Fragment>
        {parsedChildren}
      </Fragment>
      <Fragment>
        {parallelGrps}
      </Fragment>
    </div>
  </div>)
}