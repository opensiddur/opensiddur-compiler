/* UserApi
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */

import BaseApi, {ApiError} from "./BaseApi"
import UserInfo from "./UserInfo"
import {TEI_NS} from "./Transformer"


export default class UserApi extends BaseApi {
  /** Return a JSON structure with the user information
   * @param markup DocumentNode document containing the user info
   * @return UserInfo from the markup
   */
  parseUserData(markup) {
    const textIfPresent = (elementName) => {
      const tag = markup.getElementsByTagNameNS(TEI_NS, elementName)
      return (tag.length > 0) ? tag[0].textContent : null
    }

    const id = markup.getElementsByTagNameNS(TEI_NS, "idno")[0].textContent
    const name = textIfPresent("name")
    const org = textIfPresent("orgName")

    return new UserInfo(id, name, org)
  }

  /** Retrieve a user
   * @param userName string The user name, URL encoded
   * @return A promise to the parsed UserInfo structure
   */
  async get(userName) {
    const url = new URL(`/api/user/${userName}`, window.location.origin)

    const textDoc = await this.fetchText(url, "xml")

    const markup = new DOMParser().parseFromString(textDoc, "application/xml")
    const error = markup.querySelector("parsererror")

    if (error === null) {
      return this.parseUserData(markup)
    }
    else {
      throw new ApiError(false, "parse failed", error.textContent)
    }
  }
}