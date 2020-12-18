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
import {ActiveMetadataViewer, GlobalMetadataViewer} from "./MetadataViewer"
import {LicenseMetadataContext} from "./LicenseMetadataContext"
import {SourcesMetadataContext} from "./SourcesMetadataContext"
import {AnnotationMetadataContext} from "./AnnotationMetadataContext"
import ActiveAnnotationViewer from "./ActiveAnnotationViewer"
import InlineModeContext from "./InlineModeContext"

export default function Viewer() {
  const {document} = useParams()
  const metadata = new TransformerMetadata()
  // just a placeholder
  return ( <div className="Viewer">
    <AnnotationMetadataContext>
      <ContributorMetadataContext>
        <InlineModeContext>
          <LicenseMetadataContext>
            <SourcesMetadataContext>
              <div className="LeftSidebar" >
                <ActiveAnnotationViewer/>
              </div>
              <div className="Content">
                <h1>{document}</h1>
                <ViewTransformer document={document} metadata={metadata}/>
                <GlobalMetadataViewer/>
              </div>
              <div className="RightSidebar" >
                <ActiveMetadataViewer/>
              </div>
            </SourcesMetadataContext>
          </LicenseMetadataContext>
        </InlineModeContext>
      </ContributorMetadataContext>
    </AnnotationMetadataContext>
  </div>)
}