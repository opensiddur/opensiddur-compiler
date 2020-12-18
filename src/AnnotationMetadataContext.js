/* AnnotationMetadataContext
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import GenericMetadataContext, {defaultActivationReducer} from "./GenericMetadataContext"

/* Annotation has 3 types of context:
 * Global context, supporting a global list of unique annotations by URI (r/w)
 * Active context, supporting the annotations that apply to the active text in the user-activated local sidebar (r/w)
 * Current context, supporting the annotations that apply to any position in the XML hierarchy (r/o)
 */

// annotations are stored as annotation links
export const GlobalAnnotationContext = React.createContext({})
export const ActiveAnnotationContext = React.createContext(new Set())
export const CurrentAnnotationContext = React.createContext(new Set())

/** Add annotation URIs to the current list
 *
 * @param oldAnnotationList {Set}
 * @param newAnnotationList {Set}
 * @return {Set}
 */
export function currentAnnotationReducer(oldAnnotationList, newAnnotationList) {
  return new Set([...oldAnnotationList, ...newAnnotationList])
}

/** Add linked annotation lists to the current list
 *
 * @param oldAnnotationList {Object}
 * @param newAnnotationList {Object} an object of annotation URI -> id of annotated segment
 */
export function annotationReducer(oldAnnotationList, newAnnotationList) {
  let annotationList = {}
  // loop through the unique keys of the old and new annotation lists and create a new annotation list that
  // combines all the keys
  for (const annotationUri of new Set(Object.keys(oldAnnotationList).concat(Object.keys(newAnnotationList)))) {
    annotationList[annotationUri] = new Set([
      ...(newAnnotationList[annotationUri] || new Set()),
      ...(oldAnnotationList[annotationUri] || new Set())
    ])
  }
  return annotationList
}

/* istanbul ignore next */
export const AnnotationMetadataContext = (props) =>
  GenericMetadataContext(props, GlobalAnnotationContext, ActiveAnnotationContext, annotationReducer,
    defaultActivationReducer, {}, new Set())
