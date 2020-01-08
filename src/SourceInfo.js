/* SourceInfo
 * Metadata structure passed by Transformer
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
export class SourceInfo {
  constructor(resource, scopeUnit=null, scopeFrom=null, scopeTo=null) {
    this.resource = resource
    this.scope = {
      unit: scopeUnit,
      from: scopeFrom,
      to: scopeTo
    }
  }
}