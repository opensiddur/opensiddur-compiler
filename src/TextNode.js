/* TextNode
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {META_INLINE_MODE} from "./Transformer"

/**
 * @return {string}
 */

export default function TextNode(props) {
  const metadata = props.metadata
  const xml = props.nodes[0]

  if (metadata.get(META_INLINE_MODE) &&
    xml.parentNode.nodeType === Node.ELEMENT_NODE && // DocumentFragment does not have a parent element
    !xml.parentElement.hasAttribute("jf:stream")) {
    // ignore non-inline data in inline mode
    return ""
  }
  else {
    return xml.wholeText
  }

}