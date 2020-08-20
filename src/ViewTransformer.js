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
import Transformer, {META_INLINE_MODE, META_SETTINGS, SETTINGS_OPENSIDDUR, SETTINGS_TRANSLATION} from "./Transformer"
import DocumentApi from "./DocumentApi"

/** Independently testable utility functions */
export class ViewTransformerUtils {
  /**
   *
   * @param document {string} The name of the document to check for a redirect
   * @param api {string} The API of the document
   * @param metadata {TransformerMetadata}
   * @return The active translation redirect (as an API path to a linkage document), or null
   */
  static async translationRedirect(document, api, metadata) {
    const settings = metadata.get(META_SETTINGS)
    if (settings && api === "original") {
      // the translation redirect can be a string or a list of strings.
      const translationSetting = (settings[SETTINGS_OPENSIDDUR] || {})[SETTINGS_TRANSLATION] || []
      const activeTranslationLinkages = Array.isArray(translationSetting) ? translationSetting : [translationSetting]
      if (activeTranslationLinkages.length === 0) {
        return null
      } else {
        const linkages = await DocumentApi.linkages(document)
        const firstMatchingTranslation = activeTranslationLinkages.find(atl => linkages[atl])
        console.log("activeTranslationLinkages =", activeTranslationLinkages, " first match = ", firstMatchingTranslation, " return = ", linkages[firstMatchingTranslation])
        return linkages[firstMatchingTranslation] || null
      }
    }
    else return null
  }
}

export default function ViewTransformer(props) {
  const document = props.document
  const api = props.api || "original"
  const fragment = (props.fragment) ? decodeURIComponent(props.fragment) : null
  const metadata = props.metadata

  const originalSuffix = metadata.get(META_INLINE_MODE) === true ? "flat" : "combined"

  const [content, setContent] = useState()

  const transformerRecursionFunction = (document, fragment, metadata, apiName=api) => {
    return <ViewTransformer document={document} fragment={fragment} metadata={metadata} api={apiName}/>
  }

  useEffect(() => {
    const fetcher = async () => {
      const hasTranslationRedirect = await ViewTransformerUtils.translationRedirect(document, api, metadata)
      const redirectedContent = async () => {
        console.log("Document ", document, " has a translation redirect to ", hasTranslationRedirect)
        const linkageDocumentName = hasTranslationRedirect.split("/").pop()
        const redirectContent = await DocumentApi.get(linkageDocumentName, "xml", "linkage", "combined")
        redirectContent.normalize()
        return [Transformer.redirectFragment(document, fragment, redirectContent)]
      }
      const unredirectedContent =  async () => {
        const docContent = await DocumentApi.get(document, "xml", api, originalSuffix)
        docContent.normalize()
        return fragment ? DocumentApi.getFragment(docContent, fragment) : [docContent]
      }

      const rawContent = await (hasTranslationRedirect ? redirectedContent() : unredirectedContent())

      setContent(rawContent)
    }
    fetcher()
  }, [document, api, fragment, metadata, originalSuffix])

  const transformed = content ?
    Transformer.apply({
      documentName: document,
      documentApi: api,
      nodes: content,
      transformerRecursionFunction: transformerRecursionFunction,
      metadata: props.metadata
    }) : <div>Loading...</div>

  return <div className="ViewTransformer">{transformed}</div>
}