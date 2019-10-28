/* Discovery List component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';
import DiscoveryApi from "./DiscoveryApi"

export default function DiscoveryList(props) {
  /* props expected:
  * api: which discovery API to list results for
  * q: query string
  */
  const discoveryApi = new DiscoveryApi()

  // these will be used on the next fetch
  const [startIndex, setStartIndex] = useState(1)
  const itemsPerPage = 100
  const [endIndex, setEndIndex] = useState(null)
  const [totalResults, setTotalResults] = useState(null)
  const [resultData, setResultData] = useState([])

  const fetchListData = () => {
    if (totalResults == null || startIndex < totalResults) {
      const fetcher = async () => {
        const newResults = await discoveryApi.list(props.api, props.q, startIndex, itemsPerPage)

        //setStartIndex(newResults.endIndex + 1)
        //setEndIndex(newResults.endIndex)
        //setTotalResults(newResults.totalResults)
        setResultData(newResults.items)
      }

      fetcher()
    }
  }

  useEffect(() => fetchListData())

  return (
    <ul>{
      resultData.map(result => {
        const key = result.url.split("/").pop()
        return <li key={key}><a href={result.url}>{result.title}</a></li>
      })
    }</ul>)
}