/* DocumentFragment
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import Transformer from "./Transformer"

export default function DocumentFragment(props) {
  return Transformer.traverseChildren(props.nodes[0], props)
}