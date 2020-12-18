/* Utils.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {isEmptyObject} from "../Utils"

describe("isEmptyObject", () => {
  it("returns true when the argument is an empty object", () => {
    expect(isEmptyObject({})).toBeTruthy()
  })

  it("returns false when the argument is a non empty object", () => {
    expect(isEmptyObject({ x: 1})).toBeFalsy()
  })
})