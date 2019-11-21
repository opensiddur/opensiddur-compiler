/* Main chooser
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState} from "react"
import {Link} from "react-router-dom"
import SearchableSelectableResultsList from "./SearchableSelectableResultsList"

export default function Chooser() {
  const blankSelection = {
    title: "",
    link: ""
  }
  const [selected, setSelected] = useState(blankSelection)

  const clearSelection = () => {
    setSelected(blankSelection)
  }

  const handleSelection = (result) => {
    const documentPartOfUrl = result.url.split("/").pop()

    setSelected({
      title: result.title,
      link: `/viewer/${documentPartOfUrl}`
    })
  }

  return (
    <div className="Chooser">
      {
        (selected.title &&
          <div className="ChooserSelected">
            <Link to={selected.link}>View: {selected.title}</Link>
            <button onClick={clearSelection}>X</button>
          </div>
        )
      }
      <SearchableSelectableResultsList api="original" selectionCallback={handleSelection} />
    </div>
  )
}