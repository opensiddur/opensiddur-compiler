/* Utils
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
/** Utility to determine if the object is empty
 *
 * @param obj Any object
 * @return {boolean} true if object is empty
 */
export function isEmptyObject(obj) {
  for (const x in obj) return false
  return true
}