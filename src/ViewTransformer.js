/* ViewTransformer
 * Transform a JLPTEI document or document fragment into a React UI
 * props:
 * * document: The document name (URL encoded)
 * * fragment: The document fragment (URL encoded)
 * * metadata: Metadata associated with the
 * * * inline: Whether the transformer should read only elements in streams or all hierarchy
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import Transformer from "./Transformer"
import DocumentApi from "./DocumentApi"

export default function ViewTransformer(props) {
  const document = props.document
  const api = "original"
  const fragment = (props.fragment) ? decodeURIComponent(props.fragment) : null
  const docApi = new DocumentApi()

  const [content, setContent] = useState(<div>Loading...</div>)

  const transformerRecursionFunction = (document, fragment, metadata) => {
    return <ViewTransformer document={document} fragment={fragment} metadata={metadata}/>
  }

  const updateDocument = () => {
    const fetcher = async () => {
      const docContent = await docApi.get(document, "xml", api)
      docContent.normalize()
      const transformer = new Transformer(docContent, props.document, transformerRecursionFunction)
      const contentToTransform = fragment ? transformer.getFragment(fragment) : [docContent]
      const transformed = transformer.applyList(contentToTransform, props.metadata)

      setContent(transformed)
    }
    fetcher()
  }

  useEffect(() => updateDocument(), [document, fragment])

  return <div className="ViewTransformer">{content}</div>
}