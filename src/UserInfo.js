/* UserInfo
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
export default class UserInfo {
  constructor(id, name, org=null) {
    this.id = id
    this.name = name
    this.org = org
  }
}