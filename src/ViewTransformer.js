/* ViewTransformer
 * Transform a JLPTEI document or document fragment into a React UI
 * props:
 * * document: The document name (URL encoded)
 * * fragment: The document fragment (URL encoded)
 * * metadata: Metadata associated with the
 * * * inline: Whether the transformer should read only elements in streams or all hierarchy
 * * api (optional): API to use to load the document
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import Transformer, {META_INLINE_MODE} from "./Transformer"
import DocumentApi from "./DocumentApi"

export default function ViewTransformer(props) {
  const document = props.document
  const api = props.api || "original"
  const fragment = (props.fragment) ? decodeURIComponent(props.fragment) : null

  const originalSuffix = props.metadata.get(META_INLINE_MODE) === true ? "flat" : "combined"

  const [content, setContent] = useState(<div>Loading...</div>)

  const transformerRecursionFunction = (document, fragment, metadata, apiName=api) => {
    return <ViewTransformer document={document} fragment={fragment} metadata={metadata} api={apiName}/>
  }

  const updateDocument = () => {
    const fetcher = async () => {
      const docContent = await DocumentApi.get(document, "xml", api, originalSuffix)
      docContent.normalize()
      const contentToTransform = fragment ? DocumentApi.getFragment(docContent, fragment) : [docContent]
      const transformed = Transformer.apply({
        documentName: document,
        documentApi: api,
        nodes: contentToTransform,
        transformerRecursionFunction: transformerRecursionFunction,
        metadata: props.metadata
      })

      setContent(transformed)
    }
    fetcher()
  }

  useEffect(() => updateDocument(), [document, fragment])

  return <div className="ViewTransformer">{content}</div>
}