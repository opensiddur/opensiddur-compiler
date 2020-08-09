/* SourceRecord
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import ContextSourceInfo from "./ContextSourceInfo"
import SourceApi from "./SourceApi"
import {CONTRIBUTOR_TYPES} from "./Transformer"

export class SourceRecordUtil {
  static joinListOfReactElements(arr, joiner, ender, beginner) {
    const arrLast = arr.length - 1
    return arr.flatMap( (value, index) => {
      const begin = (index === 0 && beginner) ?
        [<span className="BiblioListBegin">{beginner}</span>] : []
      return begin.concat([value, (index === arrLast) ?
        <span className="BiblioListEnd">{ender}</span> :
        <span className="BiblioListJoin">{joiner}</span>])
    })
  }

  /** Given an array of objects that include a name, produce a list of nameType spans */
  static namedList(arr, nameType, joiner=", ", ender=". ") {
    const arrayList = arr.map( a => <span className={nameType}>{a.name}</span>)
    return (arr.length > 0) ? SourceRecordUtil.joinListOfReactElements(arrayList, joiner, ender) : []
  }

  /** Produce a list of React elements to represent a responsibility list. Each arr object must contain a resp and name */
  static responsibilityList(arr, joiner= ", ", ender = ". ") {
    // group other responsibilities together
    const byResponsibility = new Map()
    arr.forEach( (rsp) => {
      const rspKey = rsp.resp
      const name = rsp.name

      const thisResponsibility = byResponsibility.get(rspKey)
      const nextThisResponsibility = (!thisResponsibility) ? [name] : [...thisResponsibility, name]
      byResponsibility.set(rspKey, nextThisResponsibility)
    })
    // byResponsibility is Map[responsibilityType -> array of names]
    const responsibilities = Array.from(byResponsibility).sort( (first, second) => {
      const key1 = first[0]
      const key2 = second[0]
      return key1 < key2 ? -1 : (key1 > key2) ? 1 : 0
    }).flatMap( rspEntry => {
      const responsibilityKey = rspEntry[0]
      const nameList = rspEntry[1]

      const contributorType = CONTRIBUTOR_TYPES[responsibilityKey]
      const contributorTypeHeading = contributorType + ((nameList.length > 1) ? "s" : "") + ": "
      const names =
        SourceRecordUtil.joinListOfReactElements(nameList.map( n => <span className={contributorType}>{n}</span>),
          joiner,
          ender,
          <span className="BiblioContributorType">{contributorTypeHeading}</span>
        )
      return names
    })

    return responsibilities
  }

  /** Order a list of titles containing { type, lang, text} into react elements */
  static titleList(arr) {
    const titleMap = new Map()
    arr.forEach( (title) => {
      const titleType = title.type
      const titleClass = "title_" + titleType
      const thisTitle = <span lang={title.lang} className={titleClass}>{title.text}</span>
      titleMap.set(titleType, thisTitle)
    })
    const records = SourceRecordUtil.joinListOfReactElements([titleMap.get("main"), titleMap.get("sub")].filter( (t) => t), ":", "")
        .concat(SourceRecordUtil.joinListOfReactElements(
          [titleMap.get("alt"), titleMap.get("alt-main"), titleMap.get("alt-sub")].filter( (t) => t),":", ")", "("))
    
    return records.length > 0 ? records.concat(["."]) : records
  }
}

/** Display a part of a source record that contains responsibilities and titles
 * props: part = the source record part, type = the type of part (analytic, monogr, series) */
export function SourceRecordPart(props) {

  const part = props.part
  const partType = props.type

  const authors = SourceRecordUtil.namedList(part.authors, "author")
  const editors = SourceRecordUtil.namedList(part.editors, "editor", undefined,
    (part.editors.length > 1) ? "eds." : "ed.")

  // group other responsibilities together
  const responsibilities = SourceRecordUtil.responsibilityList(part.responsibilities)

  // the supported title types here are main, alt-main (alt), sub and alt-sub
  const titles = SourceRecordUtil.titleList(part.titles)

  return (<span className={partType}>{
    SourceRecordUtil.joinListOfReactElements(authors.concat(editors).concat(responsibilities).concat(titles), "", "")
  }</span>)
}

/** A record of a source
 *
 * @param props source: A ContextSourceInfo structure
 * @constructor
 */
export default function SourceRecord(props) {
  const resource = props.source.resource
  const [content, setContent] = useState("Loading " + resource + "...")

  const updateSource = () => {
    const fetcher = async () => {
      const sourceData = await SourceApi.get(resource)
      setContent(sourceData)
    }
    fetcher()
  }

  useEffect(() => updateSource(), [resource])

  return (<div className="SourceRecord" key={resource} lang={content.lang}>
    { (content.analytic) && ([<SourceRecordPart part={content.analytic} type="analytic"/>, <i>in</i>])}
    { (content.monogr) && ([<SourceRecordPart part={content.monogr} type="monogr"/>, " " ]) }
    { (content.series) && ([<i>in</i>, <SourceRecordPart part={content.series} type="series"/>, " "]) }
    { (content.edition) && ([<span className="edition">{content.edition}</span>, ". "])}
    { (content.publisher) && (<span className="publisher">{content.publisher}: </span>)}
    { (content.publicationPlace) && ([<span className="publicationPlace">{content.publicationPlace}</span>, ", "])}
    { (content.publicationDate) && ([<span className="publicationDate">{content.publicationDate}</span>, ". "])}
    { (content.distributor || content.distributorWeb) && (
      <span className="distributor">
        { (content.distributorWeb) && ([<a className="distributorWeb" href={content.distributorWeb}>{content.distributor}</a>, " "]) }
        { (!content.distributorWeb) && content.distributor + " "}
        { (content.distributorAccessDate) &&
        SourceRecordUtil.joinListOfReactElements([<span className="distributorAccessDate">{content.distributorAccessDate}</span>], "", ".", ". Accessed ")}
      </span>
    )}
    { (content.copyright) && ([<span className="copyrightNote">{content.copyright}</span>, " " ])}
    { (content.note) && (<span className="biblioNote">{content.note}</span>) }
  </div> )

}