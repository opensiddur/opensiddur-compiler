/* Main entry point for the document viewer
 * Takes 1 parameter, which is the document to be viewed.
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {useParams} from "react-router"
import ViewTransformer from "./ViewTransformer"
import TransformerMetadata from "./TransformerMetadata"
import {ContributorMetadataContext} from "./ContributorMetadataContext"
import MetadataViewer from "./MetadataViewer"

export default function Viewer() {
  const {document} = useParams()
  const metadata = new TransformerMetadata()
  // just a placeholder
  return ( <div className="Viewer">
    <ContributorMetadataContext>
      <h1>{document}</h1>
      <div className="LeftSidebar" />
      <div className="Content">
        <ViewTransformer document={document} metadata={metadata}/>
      </div>
      <div className="RightSidebar" >
        <MetadataViewer/>
      </div>
    </ContributorMetadataContext>
  </div>)
}