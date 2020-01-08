/* SourceRecord
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import SourceInfo from "./SourceInfo"
import SourceApi from "./SourceApi"

/** A record of a source
 *
 * @param props source: A SourceInfo structure
 * @constructor
 */
export default function SourceRecord(props) {
  const sourceApi = new SourceApi()
  const resource = props.source.resource
  const [content, setContent] = useState("Loading " + resource + "...")

  const updateSource = () => {
    const fetcher = async () => {
      const sourceData = await sourceApi.get(resource)

      setContent(sourceData)
    }
    fetcher()
  }

  useEffect(() => updateContributor(), [resource])


  return (<div className="SourceRecord" key={resource}>
    {recordData}
  </div> )

}