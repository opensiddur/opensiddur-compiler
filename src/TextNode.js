/* TextNode
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {ActiveContributorContext, CurrentContributorContext} from "./ContributorMetadataContext"
import {useContext} from "react"

export default function TextNode(props) {
  const xml = props.nodes[0]
  const content = xml.wholeText || null

  const activeContributorContext = useContext(ActiveContributorContext)
  const currentContributorContext = useContext(CurrentContributorContext)

  const activate = () => {
    activeContributorContext.activateState(currentContributorContext)
  }

  if (content) {
    return <span onClick={activate}>{content}</span>
  }
  else return null
}