/* Search paging component
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useState, useEffect} from 'react';

export default function SearchPager(props) {
  /* props:
   * window - The number of pages that should be shown around the current page
   * results - The results (include startIndex, endIndex, itemsPerPage)
   * pagingCallback - function(startIndex) - a function that will be called when the start index changes
   */
  if (props.results === undefined || props.results.totalResults === undefined) {
    return <div className="SearchPager"/>
  }

  const pagerLib = new SearchPagerLib(props.results, parseInt(props.window))

  /* we'll always show a window of pages in each direction of the current page */
  const fastBackPage = 1
  const fastFwdPage = pagerLib.lastPage

  const handlePaging = (page) => {
    if (page !== pagerLib.currentPage) {
      props.pagingCallback(pagerLib.pageToStartIndex(page))
    }
  }

  const pageClass = (page) => {
    return "PagingClick" + ((page === pagerLib.currentPage) ? " Selected" : "" )
  }

  const pagesToShow = pagerLib.pagesToShow()
  return (
    <div className="SearchPager">
      <span className="NumResults"><span className="Number">{pagerLib.totalResults}</span> results</span>
      { pagerLib.showFastReverse() && <span className="PagingClick FastReverse" onClick={() => handlePaging(fastBackPage)}>1&lt;&lt;</span> }
      { pagesToShow.map( page => {
        return (
          <span key={page} className={pageClass(page)} onClick={() => handlePaging(page)}>{
            String(page)
          }</span>
        )
      })}
      { pagerLib.showFastForward() &&
        <span className="PagingClick FastForward" onClick={() => handlePaging(fastFwdPage)}>&gt;&gt;{pagerLib.lastPage}</span> }

    </div>
  )
}

/* Business logic class for the search pager */
export class SearchPagerLib {
  constructor(results, pageWindow) {
    this.itemsPerPage = results.itemsPerPage
    this.totalResults = results.totalResults
    this.pageWindow = pageWindow

    this.startIndex = results.startIndex
    this.currentPage = this.startIndexToPage(this.startIndex)
    this.lastPage = this.numberOfPages()
  }

  numberOfPages() {
    return Math.ceil(this.totalResults/this.itemsPerPage)
  }

  pageToStartIndex(page) {
    return (page - 1) * this.itemsPerPage + 1
  }

  startIndexToPage(index) {
    return Math.floor(this.numberOfPages() * (index - 1)/this.totalResults) + 1
  }

  /* we'll always show a window of pages in each direction of the current page */
  endOfWindow() {
    return Math.min(this.currentPage + this.pageWindow, this.lastPage)
  }

  startOfWindow() {
    return Math.max(this.currentPage - this.pageWindow, 1)
  }

  pagesToShow() {
    const start = this.startOfWindow()
    const len = Math.floor((this.endOfWindow() - start)) + 1
    return len > 0 ? Array(len).fill().map((_, idx) => start + idx) : []
  }

  /* to show a fast reverse to 1, we should not already be displaying 1 */
  showFastReverse() {
    const pagesToShow = this.pagesToShow()
    return (pagesToShow.length > 0 && pagesToShow[0] !== 1)
  }

  showFastForward() {
    const pagesToShow = this.pagesToShow()
    return (pagesToShow.length > 0 && pagesToShow[pagesToShow.length - 1] !== this.lastPage)
  }
}