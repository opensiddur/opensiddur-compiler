/* ContributorList
 * Represent a list of contributors
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import ContributorRecord from "./ContributorRecord"

export const TYPE_CODES = {
  "aut" : "Author",
  "ann" : "Annotator",
  "ctb" : "Contributor",
  "cre" : "Creator",
  "edt" : "Editor",
  "fac" : "Facsimilist",
  "fnd" : "Funder",
  "mrk" : "Markup editor",
  "oth" : "Other",
  "pfr" : "Proofreader",
  "spn" : "Sponsor",
  "trc" : "Transcriber",
  "trl" : "Translator"
}

/** Show a list of contributors
 *
 * @param props contributors: An object containing a list of sets by contributor type code
 * @constructor
 */
export default function ContributorList(props) {
  const contributors = props.contributors

  const records = Object.keys(contributors).filter( (contribType ) => {
    return contributors[contribType].size > 0
  }).map( (contribType) => {
    const crecords = Array.from(contributors[contribType]).sort().map( (contributorApi) => {
      const userName = contributorApi.split("/").reverse()[0]
      const key = contribType + "_" + userName

      return <ContributorRecord user={userName} key={key}/>
    })
    const headerValue = TYPE_CODES[contribType] + "s"
    return [
      <h3>{headerValue}</h3>,
      crecords
    ]
  })

  return (<div className="ContributorList" lang="en">
    { (records.length > 0) && <h2>Contributors</h2> }
    {records}
  </div> )
}