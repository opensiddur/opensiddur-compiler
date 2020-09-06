/* Search box component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState} from 'react';
import "./SearchBox.css"

export default function SearchBox(props) {
  /* props:
   * placeholder - the placeholder text
   * queryCallback - the function that should be called when a new search string is selected.
   *                 Takes 1 parameter (a string)
   */
  const queryCallback = props.queryCallback
  const [query, setQuery] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault();
    queryCallback(query)
  }

  return (
    <form className="SearchBox" onSubmit={handleSubmit}>
      <label>
        <input
          type="search"
          placeholder={props.placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}/>
      </label>
      <input type="submit" value="Find" />
    </form>
  )
}