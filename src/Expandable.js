/* Expandable
 *
 * Component that shows an icon that can be expanded for more information
 *
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState} from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import "./Expandable.css"

export default function Expandable({ icon, title, children }) {
  const [isExpanded, setExpanded] = useState(false)

  const toggleExpanded = () => setExpanded(!isExpanded)

  return (
    <div className="Expandable">
      <button className={isExpanded ? "expanded" : "collapsed"} role="toggle" title={title} onClick={toggleExpanded}>
        <FontAwesomeIcon icon={icon}/>
      </button>
      {isExpanded &&
      <div className="ExpandableContent">
        {children}
      </div>
      }
    </div>
  )
}