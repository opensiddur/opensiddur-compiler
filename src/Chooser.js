/* Main chooser
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState} from "react"
import {Link, useHistory} from "react-router-dom"
import SearchableSelectableResultsList from "./SearchableSelectableResultsList"

export default function Chooser() {
  const history = useHistory()

  const handleSelection = (result) => {
    const documentPartOfUrl = result.url.split("/").pop()

    history.push(`/viewer/${documentPartOfUrl}`)
  }

  return (
    <div className="Chooser">
      <SearchableSelectableResultsList api="original" selectionCallback={handleSelection} />
    </div>
  )
}