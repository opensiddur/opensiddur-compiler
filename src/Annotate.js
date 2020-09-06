/* Annotate
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {nsResolver, ParsedPtr} from "./Transformer"
import {
  ActiveAnnotationContext,
  CurrentAnnotationContext,
  currentAnnotationReducer,
  GlobalAnnotationContext
} from "./AnnotationMetadataContext"
import React, {useContext, useEffect, useMemo} from "react"

/** Determine if the given XML is a part, and, if so, if it is the first part
 * @param xml {Node}
 */
export function isFirstPart(xml) {
  if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("jf:part")) {
    const partId = xml.getAttribute("jf:part")
    return (!xml.ownerDocument.evaluate(`preceding::*[@jf:part='${partId}']`,
      xml, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue)
  }
  else return true
}

export const ANNOTATION_MARK = "\u26ac"

/** Annotation:
 *
 * @param props Accepts standard attributes + "attribute" for the name of the annotation attribute
 * @return {string|Array|*[]|*|(*|string|Array|*[])[]}
 * @constructor
 */
export default function Annotate(props) {
  const xml = props.nodes[0]
  const annotationPtr = (xml.nodeType === Node.ELEMENT_NODE) && (
    [ // get the first nonempty attribute
      props.attribute && xml.hasAttribute(props.attribute) && xml.getAttribute(props.attribute),
      xml.hasAttribute("jf:annotation") && xml.getAttribute("jf:annotation"),
      xml.hasAttribute("jf:conditional-instruction") && xml.getAttribute("jf:conditional-instruction")
    ].filter(_ => _)[0]
  )
  const isInstruction = (xml.nodeType === Node.ELEMENT_NODE && (
    xml.hasAttribute("jf:conditional-instruction") ||
      xml.tagName === "jf:instruction"
  ))
  const currentAnnotations = useContext(CurrentAnnotationContext)
  const globalAnnotations = useContext(GlobalAnnotationContext)
  const activeAnnotations = useContext(ActiveAnnotationContext)

  const activate = () => {
    activeAnnotations.activateState(new Set([annotationPtr]))
  }
  const randomId = useMemo( () => {
    return "annotate_" + Math.floor(Math.random()*10000000000).toString()
  }, [])

  useEffect( () => {
    annotationPtr && globalAnnotations.registerGlobalState({[annotationPtr]: new Set([randomId])})
  }, [annotationPtr, randomId])

  if (annotationPtr) {
    const parsedPtr = ParsedPtr.parsePtr(annotationPtr)
    const annotationMarker = <sup onClick={activate}>{ANNOTATION_MARK}</sup>
    const firstPart = isFirstPart(xml)

    return (
      <div className="Annotate" id={randomId}>
        <CurrentAnnotationContext.Provider
          value={currentAnnotationReducer(currentAnnotations, new Set([annotationPtr]))}>
          { !isInstruction && firstPart && <span className="AnnotationMarker">{annotationMarker}</span>}
          { isInstruction && firstPart && props.transformerRecursionFunction(parsedPtr.documentName, parsedPtr.fragment, props.metadata, "notes") }
          { props.chain.next(props) }
        </CurrentAnnotationContext.Provider>
      </div>
    )
  }
  else return props.chain.next(props)
}