/* GenericElement
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import Transformer from "./Transformer"
import "./GenericElement.css"

export default function GenericElement(props) {
  const xml = props.nodes[0]
  console.log("element node", xml)
  const parsedChildren = Transformer.traverseChildren(xml, props)
  return (<div className={xml.tagName}>
    {parsedChildren}
  </div>)
}