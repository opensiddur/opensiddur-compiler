/* Search paging component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';

export default function SearchPager(props) {
  /* props:
   * results - The results (include startIndex, endIndex, itemsPerPage)
   * pagingCallback - function(startIndex) - a function that will be called when the start index changes
   */
  if (props.results === undefined) {
    return <div className="SearchPager"/>
  }

  const itemsPerPage = props.results.itemsPerPage
  const totalResults = props.results.totalResults
  const numberOfPages = Math.ceil(totalResults/itemsPerPage)

  const pageToStartIndex = (page) => {
    return (page - 1) * itemsPerPage
  }

  const startIndexToPage = (index) => {
    return Math.floor(numberOfPages * (index - 1)/totalResults) + 1
  }

  const startIndex = props.results.startIndex
  const currentPage = startIndexToPage(startIndex)
  const lastPage = startIndexToPage(totalResults)
  console.log(`sp: ${itemsPerPage} ${totalResults} ${numberOfPages} ${startIndex} ${currentPage} ${lastPage}`)
  /* we'll always show a window of pages in each direction of the current page */
  const pageWindow = 3
  const end = Math.min(currentPage + pageWindow, lastPage)
  const start = Math.max(currentPage - pageWindow, 1)
  const len = Math.floor((end - start)) + 1
  const pagesToShow = len > 0 ? Array(len).fill().map((_, idx) => start + idx) : []
  const fastPage = 10
  const fastBackPage = Math.max(start - fastPage, 1)
  const fastFwdPage = Math.min(start + fastPage, lastPage)

  const handlePaging = (page) => {
    if (page !== currentPage) {
      props.pagingCallback(pageToStartIndex(page))
    }
  }

  return (
    <div className="SearchPager">
      <span className="NumResults">{totalResults} results</span>
      { (pagesToShow.length > 0 && pagesToShow[0] !== 1) && <span className="PagingClick" onClick={() => handlePaging(fastBackPage)}>&lt;&lt;</span> }
      { pagesToShow.map( page => {
        return (
          <span key={page} className="PagingClick" onClick={() => handlePaging(page)}>{
            (page === currentPage) ?
              ("[" + String(page) + "]") :
              String(page)
          }</span>
        )
      })}
      { (pagesToShow.length > 0 && pagesToShow[pagesToShow.length - 1] !== lastPage) &&
        <span className="PagingClick" onClick={() => handlePaging(fastFwdPage)}>&gt;&gt;</span> }

    </div>
  )
}