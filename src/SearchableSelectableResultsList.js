/* Searchable selectable results (discovery API) list component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';
import DiscoveryApi from "./DiscoveryApi"
import SearchBox from "./SearchBox"
import SelectableResultsList from "./SelectableResultsList"

export default function SearchableSelectableResultsList(props) {
  /* props expected:
  * api: which discovery API to list results for
  * selectionCallback - callback to be called when a selection is made
  */
  const discoveryApi = new DiscoveryApi()

  // these will be used on the next fetch
  const [startIndex, setStartIndex] = useState(1)
  const itemsPerPage = 100
  const [endIndex, setEndIndex] = useState(null)
  const [totalResults, setTotalResults] = useState(null)
  const [resultData, setResultData] = useState([])
  const [queryString, setQueryString] = useState("")

  const fetchListData = () => {
    if (totalResults == null || startIndex < totalResults) {
      const fetcher = async () => {
        const newResults = await discoveryApi.list(props.api, queryString, startIndex, itemsPerPage)

        //setStartIndex(newResults.endIndex + 1)
        //setEndIndex(newResults.endIndex)
        //setTotalResults(newResults.totalResults)
        setResultData(newResults.items)
      }

      fetcher()
    }
  }

  useEffect(() => fetchListData())

  const queryCallback = (newQueryString) => {
    if (newQueryString !== queryString) {
      setQueryString(newQueryString)
    }
  }

  return (
    <div className="SearchableSelectableResultsList">
      <SearchBox queryCallback={queryCallback} />
      <SelectableResultsList results={resultData} selectionCallback={props.selectionCallback}/>
    </div>
  )
}