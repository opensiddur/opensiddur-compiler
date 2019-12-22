/* TransformerMetadata
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
export default class TransformerMetadata {
  /** Copy constructor
   *
   * @param md TransformerMetadata to copy (optional)
   */
  constructor(md) {
    this.metadata = md ? this.deepCopy(md.metadata) : {}
  }

  /** Utility function to create a deep copy of an object */
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj))
  }

  set(key, value) {
    const newCopy = new TransformerMetadata(this)
    newCopy.metadata[key] = value
    return newCopy
  }

  get(key) {
    return this.metadata[key]
  }

}

/** store an update to document metadata
 *
 */
export class MetadataUpdate {
  constructor(update=null, nextMetadata=null) {
    this.update = update
    this.nextMetadata = nextMetadata
  }
}

/** Given a list of MetadataUpdate, find out what types of updates are present.
 * Assume that updates are given in order of precedence; if no update of that type has already been done, we take the
 * current update
 */
export class MetadataUpdateList {
  constructor(updates = []) {
    this.license = null
    this.language = null
    this.contributors = null
    updates.forEach( (mdUpdate) => {
      if (mdUpdate.update) {
        this.license = (!this.license && mdUpdate.update.license) ? mdUpdate.update : this.license
        this.language = (!this.language && mdUpdate.update.lang) ? mdUpdate.update : this.language
        this.contributors = (!this.contributors && mdUpdate.update.contributors) ? mdUpdate.update : this.contributors
      }
    })

    this.hasUpdates = updates.some( (upd) => { return upd.update })
  }
}
