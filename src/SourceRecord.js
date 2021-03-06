/* SourceRecord
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {Fragment, useEffect, useState} from "react"
import SourceApi from "./SourceApi"
import {CONTRIBUTOR_TYPES} from "./Transformer"

export class SourceRecordUtil {
  static joinListOfReactElements(arr, joiner, ender, beginner) {
    const arrLast = arr.length - 1
    return (arr.length > 0) ? (<Fragment>
        {beginner && <span className="BiblioListBegin">{beginner}</span>}
        { arr.map( (value, index) => {
          return (
            <Fragment key={index}>
              {value}
              { (index < arrLast) && <span className="BiblioListJoin">{joiner}</span> }
            </Fragment>
          )
        })}
        { ender && <span className="BiblioListEnd">{ender}</span> }
      </Fragment>
    ) : null
  }

  /** Given an array of objects that include a name, produce a list of nameType spans */
  static namedList(arr, nameType, joiner=", ", ender=". ") {
    const arrayList = arr.map( a => <span className={nameType}>{a.name}</span>)
    return SourceRecordUtil.joinListOfReactElements(arrayList, joiner, ender)
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
    }).flatMap( (rspEntry, index) => {
      const responsibilityKey = rspEntry[0]
      const nameList = rspEntry[1]

      const contributorType = CONTRIBUTOR_TYPES[responsibilityKey]
      const contributorTypeHeading = contributorType + ((nameList.length > 1) ? "s" : "") + ": "
      return (<Fragment key={index}>{
        SourceRecordUtil.joinListOfReactElements(nameList.map( n => <span className={contributorType}>{n}</span>),
          joiner,
          ender,
          <span className="BiblioContributorType">{contributorTypeHeading}</span>
        )}
      </Fragment>)
    })

    return (responsibilities.length > 0) ? <>{responsibilities}</> : null
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
    const title = SourceRecordUtil.joinListOfReactElements(
      [titleMap.get("main"), titleMap.get("sub")].filter( (t) => t), ":", "")
    const alt = SourceRecordUtil.joinListOfReactElements(
      [titleMap.get("alt"), titleMap.get("alt-main"), titleMap.get("alt-sub")].filter( (t) => t),":", ")", "(")
    
    return (title || alt) ? (
      <Fragment>
        {title}
        {alt}
        {"."}
      </Fragment>
    ) : null
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

  return (<span className={partType}>
    {authors}
    {editors}
    {responsibilities}
    {titles}
  }</span>)
}

/** A record of a source
 *
 * @param props source: A ContextSourceInfo structure
 * @constructor
 */
export default function SourceRecord(props) {
  const resource = props.source.resource
  const [content, setContent] = useState({})

  useEffect(() => {
    const fetcher = async () => {
      const sourceData = await SourceApi.get(resource)
      setContent(sourceData)
    }
    fetcher()
  }, [resource])

  return (<div className="SourceRecord" key={resource} lang={content.lang}>
    { (content.analytic) && (
      <Fragment>
        <SourceRecordPart part={content.analytic} type="analytic"/> <i>in</i>
      </Fragment>)}
    { (content.monogr) && (
      <Fragment>
        <SourceRecordPart part={content.monogr} type="monogr"/>
        <span>{" "}</span>
      </Fragment>) }
    { (content.series) && (
      <Fragment>
        <i>in</i>
        <SourceRecordPart part={content.series} type="series"/>
        <span>{" "}</span>
      </Fragment>) }
    { (content.edition) && (
      <Fragment>
        <span className="edition">{content.edition}</span>
        <span>{". "}</span>
      </Fragment>)}
    { (content.publisher) && (<span className="publisher">{content.publisher}: </span>)}
    { (content.publicationPlace) && (
      <Fragment>
        <span className="publicationPlace">{content.publicationPlace}</span>
        <span>{", "}</span>
      </Fragment>)}
    { (content.publicationDate) && (
      <Fragment>
        <span className="publicationDate">{content.publicationDate}</span>
        <span>{". "}</span>
      </Fragment>)}
    { (content.distributor || content.distributorWeb) && (
      <span className="distributor">
        { (content.distributorWeb) ?
          <a className="distributorWeb" href={content.distributorWeb}>{content.distributor}</a> :
          content.distributor }
        { <span>" "</span>}
        { (content.distributorAccessDate) &&
        SourceRecordUtil.joinListOfReactElements([<span className="distributorAccessDate">{content.distributorAccessDate}</span>], "", ".", ". Accessed ")}
      </span>
    )}
    { (content.copyright) && (
      <Fragment>
        <span className="copyrightNote">{content.copyright}</span>
        <span>{" "}</span>
      </Fragment>)}
    { (content.note) && (<span className="biblioNote">{content.note}</span>) }
  </div> )

}