/* ActiveAnnotationViewer
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {ActiveAnnotationContext} from "./AnnotationMetadataContext"
import React, {useContext} from "react"
import ViewTransformer from "./ViewTransformer"
import {ParsedPtr} from "./Transformer"
import TransformerMetadata from "./TransformerMetadata"

export default function ActiveAnnotationViewer(props) {
  const activeAnnotations = useContext(ActiveAnnotationContext)

  // the active annotation viewer does not have the context metadata
  const metadata = props.metadata || new TransformerMetadata()

  const deactivate = () => {
    activeAnnotations.activateState(new Set())
  }

  return (
    <div className="ActiveAnnotationViewer">
      { (activeAnnotations.activeState.size > 0) && <button onClick={deactivate}>Close</button> }
      {
      [...activeAnnotations.activeState].map( (annotationPtr) => {
        const parsedPtr = ParsedPtr.parsePtr(annotationPtr)
        return <ViewTransformer key={annotationPtr}
                                document={parsedPtr.documentName}
                                fragment={parsedPtr.fragment}
                                metadata={metadata}
                                api={parsedPtr.apiName}/>
      })
    }</div>
  )
}