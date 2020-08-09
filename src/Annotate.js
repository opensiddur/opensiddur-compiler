/* Annotate
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {nsResolver, ParsedPtr} from "./Transformer"

/** Determine if the given XML is a part, and, if so, if it is the first part
 * @param xml {Node}
 */
// TODO: test this!
export function isFirstPart(xml) {
  if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("jf:part")) {
    const partId = xml.getAttribute("jf:part")
    return (!xml.ownerDocument.evaluate(`preceding::*[@jf:part='${partId}']`,
      xml, nsResolver, XPathResult.BOOLEAN_TYPE, null).booleanValue)
  }
  else return false
}

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

  if (annotationPtr && isFirstPart(xml)) {
    const parsedPtr = ParsedPtr.parsePtr(annotationPtr)
    return [
      props.transformerRecursionFunction(parsedPtr.documentName, parsedPtr.fragment, props.metadata, "notes"),
      props.chain.next(props)
    ]
  }
  else return props.chain.next(props)
}