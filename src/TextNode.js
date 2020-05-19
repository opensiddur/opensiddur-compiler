/* TextNode
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
/**
 * @return {string}
 */

export default function TextNode(props) {
  const xml = props.nodes[0]

  return xml.wholeText
}