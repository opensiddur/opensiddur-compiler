/* Contributor
 * Display a contributor, given its URI.
 * props: user: the URI of the contributor
 *
 * Copyright 2019 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import UserApi from "./UserApi"
import UserInfo from "./UserInfo"

export default function ContributorRecord(props) {
  const userName = props.user
  const [content, setContent] = useState(new UserInfo(userName, userName, null))

  useEffect( () => {
    const fetcher = async () => {
      const userInfo = await UserApi.get(userName)
      setContent(userInfo)
    }
    fetcher()
  }, [userName])

  const recordData = (content.name && content.org) ?
    content.name + ", " + content.org :
    (content.name) ? content.name : content.org

  return (<div className="ContributorRecord" key={content.id}>
    {recordData}
  </div> )
}