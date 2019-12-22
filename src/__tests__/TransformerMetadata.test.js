/* TransformerMetadata.test
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import TransformerMetadata, { MetadataUpdate, MetadataUpdateList } from "../TransformerMetadata"

describe("TransformerMetadata", () => {
  it("constructs a copy of the original, given an existing metadata", () => {
    const tm1 = new TransformerMetadata().set("one", 1)
    const tm2 = new TransformerMetadata(tm1)

    expect(tm2).toMatchObject(tm1)
  })

  test("set and get are inverses", () => {
    const tm = new TransformerMetadata()
    const tm1 = tm.set("one", 1)

    expect(tm1.get("one")).toBe(1)
  })
})

describe("MetadataUpdateList", () => {
  it("records no updates if no updates are provided", () => {
    const mdul = new MetadataUpdateList()

    expect(mdul.hasUpdates).toBeFalsy()
  })

  it("records 2 updates if both language and license are provided", () => {
    const languageChange = { lang: "LA"}
    const licenseChange = { license: "LIC"}
    const mdul = new MetadataUpdateList([
      new MetadataUpdate(languageChange, null),
      new MetadataUpdate(licenseChange, null)
    ])

    expect(mdul.hasUpdates).toBeTruthy()
    expect(mdul.language).toMatchObject(languageChange)
    expect(mdul.license).toMatchObject(licenseChange)
  })

  it("records 1 update if only 1 update (language) is provided", () => {
    const languageChange = { lang: "LA"}
    const mdul = new MetadataUpdateList([
      new MetadataUpdate(languageChange, null),
      new MetadataUpdate(null, null)
    ])

    expect(mdul.hasUpdates).toBeTruthy()
    expect(mdul.language).toMatchObject(languageChange)
    expect(mdul.license).toBeFalsy()
  })

  it("records an update if contributors are updated", () => {
    const contributorChange = { contributors: { "edt" : new Set("a")}}
    const mdul = new MetadataUpdateList([
      new MetadataUpdate(contributorChange, null)
    ])

    expect(mdul.hasUpdates).toBeTruthy()
    expect(mdul.contributors).toMatchObject(contributorChange)
  })
})