/* Searchable selectable results (discovery API) list component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';
import DiscoveryApi from "./DiscoveryApi"
import SearchBox from "./SearchBox"
import SelectableResultsList from "./SelectableResultsList"
import SearchPager from "./SearchPager"

export default function SearchableSelectableResultsList(props) {
  /* props expected:
  * api: which discovery API to list results for
  * selectionCallback - callback to be called when a selection is made
  */
  const discoveryApi = new DiscoveryApi()

  // these will be used on the next fetch
  const [startIndex, setStartIndex] = useState(1)
  const itemsPerPage = 100
  const [resultData, setResultData] = useState({})
  const [queryString, setQueryString] = useState("")

  const fetchListData = () => {
    const fetcher = async () => {
      const newResults = await discoveryApi.list(props.api, queryString, startIndex, itemsPerPage)
      setResultData(newResults)
    }

    fetcher()
  }

  useEffect(() => fetchListData(), [queryString, startIndex])

  const queryCallback = (newQueryString) => {
    if (newQueryString !== queryString) {
      setQueryString(newQueryString)
      setStartIndex(1)
    }
  }

  const pagingCallback = (newStartIndex) => {
    setStartIndex(newStartIndex)
  }

  return (
    <div className="SearchableSelectableResultsList">
      <SearchBox placeholder="Search..." queryCallback={queryCallback} />
      <SearchPager results={resultData} pagingCallback={pagingCallback} />
      <SelectableResultsList results={resultData.items} selectionCallback={props.selectionCallback}/>
    </div>
  )
}