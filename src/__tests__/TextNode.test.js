/* TextNode.test.js
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React from "react"
import {render} from "@testing-library/react"
import '@testing-library/jest-dom/extend-expect'

import {text2xml} from "../TestUtils"
import TextNode from "../TextNode"
import {ActiveContributorContext, CurrentContributorContext} from "../ContributorMetadataContext"
import {ActiveLicenseContext, CurrentLicenseContext} from "../LicenseMetadataContext"
import {ActiveSourcesContext, CurrentSourcesContext} from "../SourcesMetadataContext"

describe("TextNode", () => {
  const txt = [text2xml(`<test>one</test>`).documentElement.firstChild]

  it("returns nothing on empty text", () => {
    const { container } = render(<TextNode nodes={[new Text("")]}/>)

    expect(container).toBeEmpty()
  })


  it("copies the text", () => {
    const { queryByText } = render(<TextNode nodes={txt}/>)

    expect(queryByText(/one/)).toBeInTheDocument()
  })

  it("activates contextual information on click", () => {
    const currentContributor = "CONT"
    const contributorActivate = jest.fn()

    const currentLicense = "LIC"
    const licenseActivate = jest.fn()

    const currentSources = "SRC"
    const sourcesActivate = jest.fn()

    const { queryByText } = render(
      <ActiveContributorContext.Provider value={{activeState: null, activateState: contributorActivate}}>
        <CurrentContributorContext.Provider value={currentContributor}>
          <ActiveLicenseContext.Provider value={{activeState: null, activateState: licenseActivate}}>
            <CurrentLicenseContext.Provider value={currentLicense}>
              <ActiveSourcesContext.Provider value={{activeState: null, activateState: sourcesActivate}}>
                <CurrentSourcesContext.Provider value={currentSources}>
                  <TextNode nodes={txt}/>
                </CurrentSourcesContext.Provider>
              </ActiveSourcesContext.Provider>
            </CurrentLicenseContext.Provider>
          </ActiveLicenseContext.Provider>
        </CurrentContributorContext.Provider>
      </ActiveContributorContext.Provider>
      )

    const text = queryByText(/one/)
    expect(text).toBeInTheDocument()

    text.click()
    expect(contributorActivate).toHaveBeenCalledTimes(1)
    expect(contributorActivate.mock.calls[0][0]).toBe(currentContributor)

    expect(licenseActivate).toHaveBeenCalledTimes(1)
    expect(licenseActivate.mock.calls[0][0]).toBe(currentLicense)

    expect(sourcesActivate).toHaveBeenCalledTimes(1)
    expect(sourcesActivate.mock.calls[0][0]).toBe(currentSources)
  })
})
