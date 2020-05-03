/* Annotate
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {ParsedPtr} from "./Transformer"

/** Annotation:
 *
 * @param props Accepts standard attributes + "attribute" for the name of the annotation attribute
 * @return {string|Array|*[]|*|(*|string|Array|*[])[]}
 * @constructor
 */
export default function Annotate(props) {
  const xml = props.nodes[0]
  const attribute = props.attribute || "jf:annotation"
  if (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute(attribute)) {
    const annotation = xml.getAttribute(attribute)
    const parsedPtr = ParsedPtr.parsePtr(annotation)
    return [
      props.transformerRecursionFunction(parsedPtr.documentName, parsedPtr.fragment, props.metadata, "notes"),
      props.chain.next(props)
    ]
  }
  else return props.chain.next(props)
}