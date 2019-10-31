/* Result component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';

export default function SelectableResult(props) {
  /* props:
   * result - the result that should be displayed
   * selectionCallback - the callback function(result) that is called when this result is selected
   */
  const result = props.result

  const handleClick = () => {
    props.selectionCallback(result)
  }

  return (
    <li className="SelectableResult" onClick={handleClick}>
      <span>{result.title}</span>
      <ol className="SelectableResultContexts">{
        result.context.map( (con, index) => {
          return <li key={index} className="SelectableResultContext">{con}</li>
        })
      }</ol>
    </li>
  )
}