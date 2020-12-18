/* AnnotationMetadataContext.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import {currentAnnotationReducer, annotationReducer, AnnotationMetadataContext} from "../AnnotationMetadataContext"

describe("AnnotationMetadataContext.currentAnnotationReducer", () => {
  it("combines the old annotation list with the new list", () => {
    const oldList = new Set(["ab", "cd", "ef"])
    const newList = new Set(["ef", "gh", "ij"])

    const result = currentAnnotationReducer(oldList, newList)
    expect(result.size).toBe(5)
    expect(result).toContain("ab")
    expect(result).toContain("cd")
    expect(result).toContain("ef")
    expect(result).toContain("gh")
    expect(result).toContain("ij")
  })

  it("returns the old list when the new list is empty", () => {
    const oldList = new Set(["ab", "cd", "ef"])
    const newList = []

    const result = currentAnnotationReducer(oldList, newList)
    expect(result.size).toBe(3)
    expect(result).toContain("ab")
    expect(result).toContain("cd")
    expect(result).toContain("ef")
  })

  it("returns the new list when the old list is empty", () => {
    const oldList = []
    const newList = new Set(["ef", "gh", "ij"])

    const result = currentAnnotationReducer(oldList, newList)
    expect(result.size).toBe(3)
    expect(result).toContain("ef")
    expect(result).toContain("gh")
    expect(result).toContain("ij")
  })
})

describe("AnnotationMetadataContext.annotationReducer", () => {
  it("combines a list of annotations with the ids they are associated", () => {
    const oldList = {
      "annuri1": new Set(["id1", "id2"]),
      "annuri2": new Set(["id3"])
    }
    const newList = {
      "annuri2": new Set(["id4"]),
      "annuri3": new Set(["id5"])
    }

    const result = annotationReducer(oldList, newList)

    expect(result["annuri1"]).toContain("id1")
    expect(result["annuri1"]).toContain("id2")
    expect(result["annuri2"]).toContain("id3")
    expect(result["annuri2"]).toContain("id4")
    expect(result["annuri3"]).toContain("id5")
  })

  it("keeps the old list when the new list is blank", () => {
    const oldList = {
      "annuri1": new Set(["id1", "id2"]),
      "annuri2": new Set(["id3"])
    }
    const newList = {}

    const result = annotationReducer(oldList, newList)

    expect(result["annuri1"]).toContain("id1")
    expect(result["annuri1"]).toContain("id2")
    expect(result["annuri2"]).toContain("id3")
  })

  it("keeps the new list when the old list is blank", () => {
    const oldList = {}
    const newList = {
      "annuri2": new Set(["id4"]),
      "annuri3": new Set(["id5"])
    }

    const result = annotationReducer(oldList, newList)

    expect(result["annuri2"]).toContain("id4")
    expect(result["annuri3"]).toContain("id5")
  })
})