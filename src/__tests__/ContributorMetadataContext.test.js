/* ContributorMetadataContext.test
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import {contributorReducer} from "../ContributorMetadataContext"

describe("contributorReducer", () => {
  const list1 = {
    "aut" : new Set(["Author 1"]),
    "ann" : new Set(),
    "ctb" : new Set("Contributor 1"),
    "cre" : new Set(),
    "edt" : new Set(["Editor 1"]),
    "fac" : new Set(),
    "fnd" : new Set(),
    "mrk" : new Set(),
    "oth" : null,
    "pfr" : null,
    "spn" : null,
    "trc" : new Set(["Transcriber 1", "Transcriber 2"]),
    "trl" : null
  }

  const list1NoNull = {
    "aut" : new Set(["Author 1"]),
    "ann" : new Set(),
    "ctb" : new Set("Contributor 1"),
    "cre" : new Set(),
    "edt" : new Set(["Editor 1"]),
    "fac" : new Set(),
    "fnd" : new Set(),
    "mrk" : new Set(),
    "oth" : new Set(),
    "pfr" : new Set(),
    "spn" : new Set(),
    "trc" : new Set(["Transcriber 1", "Transcriber 2"]),
    "trl" : new Set()
  }

  const list2 = {
    "aut" : new Set(["Author 2"]), // author has no overlap
    "ann" : new Set(),
    "ctb" : new Set("Contributor 1"), // contributor is all overlap
    "cre" : new Set(),
    "edt" : new Set(["Editor 1", "Editor 2"]), // editor is a superset
    "fac" : new Set(),
    "fnd" : new Set(),
    "mrk" : new Set(),
    "oth" : null,
    "pfr" : null,
    "spn" : new Set("Sponsor 1"), // sponsor is non-null
    "trc" : new Set(["Transcriber 2"]), // transcriber is a subset
    "trl" : null
  }

  const listUnion = {
    "aut" : new Set(["Author 1", "Author 2"]), // author has no overlap
    "ann" : new Set(),
    "ctb" : new Set("Contributor 1"), // contributor is all overlap
    "cre" : new Set(),
    "edt" : new Set(["Editor 1", "Editor 2"]), // editor is a superset
    "fac" : new Set(),
    "fnd" : new Set(),
    "mrk" : new Set(),
    "oth" : new Set(),
    "pfr" : new Set(),
    "spn" : new Set("Sponsor 1"), // sponsor is non-null
    "trc" : new Set(["Transcriber 1", "Transcriber 2"]), // transcriber is a subset
    "trl" : new Set()
  }

  it("returns the content of the new list when there is no old one", () => {
    const result = contributorReducer({}, list1)
    expect(result).toMatchObject(list1NoNull)
  })

  it("returns the content of the old list when there is no new one", () => {
    const result = contributorReducer(list1, {})
    expect(result).toMatchObject(list1NoNull)
  })

  it("returns the union of the two lists when both exist", () => {
    const result = contributorReducer(list2, list1)
    expect(result).toMatchObject(listUnion)
  })
})