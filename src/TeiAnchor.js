/* TeiAnchor.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"

export default function TeiAnchor(props) {
  const digits = 10
  const node=props.nodes[0]
  const id=node.getAttribute("jf:id")
  // an anchor's id my be repeated and there is no uniqueness guarantee
  // the HTML anchor id will be the jf:id + a random string
  // the original id will be preserved in data-jf-id
  const randomString = Math.floor(Math.random()*Math.pow(10, digits)).toString()
  return (
    <a className="TeiAnchor" id={id + "_" + randomString} data-jf-id={id}/>
  )
}