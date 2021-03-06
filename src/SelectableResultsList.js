/* Selectable results (discovery API) list component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from 'react';
import SelectableResult from "./SelectableResult"
import Loading from "./Loading"

export default function SelectableResultsList(props) {
  /* props expected:
  * results - The list of results
  * selectionCallback - A callback function(result) to be called on selection
  */

  return (
    <ul className="SelectableResultsList">{
      (props.results === undefined) ? <li key="0"><Loading/></li> :
      props.results.map(result => {
        const key = result.url.split("/").pop()
        return <SelectableResult key={key} result={result} selectionCallback={props.selectionCallback}/>
      })
    }</ul>)
}