/* Conditional
 * Copyright 2020 Efraim Feinstein <efraim@opensiddur.org>
 * Open Siddur Project
 * Licensed under the GNU Lesser General Public License, version 3 or later
 */
import React, {useEffect, useState} from "react"
import {META_SETTINGS} from "./Transformer"
import DocumentApi from "./DocumentApi"
import {CONDITIONAL_OPERATOR_PREFIX, parseSettings} from "./UpdateSettings"

export const CONDITIONAL_YES = 1
export const CONDITIONAL_MAYBE = 0
export const CONDITIONAL_NO = -1
export const CONDITIONAL_ON = 1
export const CONDITIONAL_OFF = -1

const conditionalValueMap = {
  "YES": CONDITIONAL_YES,
  "NO": CONDITIONAL_NO,
  "MAYBE": CONDITIONAL_MAYBE,
  "ON": CONDITIONAL_ON,
  "OFF": CONDITIONAL_OFF
}

const allTruthTable = {
  [CONDITIONAL_YES]: {
    [CONDITIONAL_YES]: CONDITIONAL_YES,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_ON,
    [CONDITIONAL_OFF]: CONDITIONAL_OFF
  },
  [CONDITIONAL_NO]: {
    [CONDITIONAL_YES]: CONDITIONAL_NO,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_NO,
    [CONDITIONAL_ON]: CONDITIONAL_NO,
    [CONDITIONAL_OFF]: CONDITIONAL_NO
  },
  [CONDITIONAL_MAYBE]: {
    [CONDITIONAL_YES]: CONDITIONAL_MAYBE,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_MAYBE,
    [CONDITIONAL_OFF]: CONDITIONAL_OFF
  },
  [CONDITIONAL_ON]: {
    [CONDITIONAL_YES]: CONDITIONAL_YES,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_ON,
    [CONDITIONAL_OFF]: CONDITIONAL_OFF
  },
  [CONDITIONAL_OFF]: {
    [CONDITIONAL_YES]: CONDITIONAL_OFF,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_OFF,
    [CONDITIONAL_ON]: CONDITIONAL_OFF,
    [CONDITIONAL_OFF]: CONDITIONAL_OFF
  },
}

export function all(conditionsList) {
  if (conditionsList.length === 0) {
    return CONDITIONAL_NO
  }
  else {
    return conditionsList.reduce((accum, current) => allTruthTable[accum][current])
  }
}

export function oneOf(conditionsList) {
  const counts =  conditionsList.reduce( (accum, current) => {
    return {
      yes: accum.yes + (current === CONDITIONAL_YES ? 1 : 0),
      maybe: accum.maybe + (current === CONDITIONAL_MAYBE ? 1 : 0),
      no: accum.no + (current === CONDITIONAL_NO ? 1 : 0),
    }
    }, {
      yes: 0, maybe: 0, no: 0
    })
  const sum = counts.yes + counts.maybe

  return (
    (counts.yes === 1 && sum === 1) ? CONDITIONAL_YES :
      (counts.maybe === 1 && sum === 1) ? CONDITIONAL_MAYBE :
        (counts.yes + counts.no + counts.maybe > 0) ? CONDITIONAL_NO :
          CONDITIONAL_OFF
  )
}

export function any(conditions) {
  let finalValue = CONDITIONAL_NO

  for (let condition of conditions) {
    switch (condition) {
      case CONDITIONAL_MAYBE:
        finalValue = CONDITIONAL_MAYBE
        break
      case CONDITIONAL_YES:
        return CONDITIONAL_YES
      case CONDITIONAL_ON:
        return CONDITIONAL_ON
    }
  }
  return finalValue
}

export function not(conditions) {
  const input = all(conditions)
  switch (input) {
    case CONDITIONAL_YES:
      return CONDITIONAL_NO
    case CONDITIONAL_NO:
      return  CONDITIONAL_YES
    case CONDITIONAL_MAYBE:
      return CONDITIONAL_MAYBE
    case CONDITIONAL_ON:
      return CONDITIONAL_OFF
    case CONDITIONAL_OFF:
      return CONDITIONAL_ON
  }
}

const evaluationMap = { // map a condition, setting pair to its result
  [CONDITIONAL_YES] : { // condition YES, setting...
    [CONDITIONAL_YES] : CONDITIONAL_YES,
    [CONDITIONAL_NO]: CONDITIONAL_NO,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_YES,
    [CONDITIONAL_OFF]: CONDITIONAL_NO
  },
  [CONDITIONAL_NO] : {
    [CONDITIONAL_YES] : CONDITIONAL_NO,
    [CONDITIONAL_NO]: CONDITIONAL_YES,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_NO,
    [CONDITIONAL_OFF]: CONDITIONAL_YES
  },
  [CONDITIONAL_MAYBE] : {
    [CONDITIONAL_YES] : CONDITIONAL_MAYBE,
    [CONDITIONAL_NO]: CONDITIONAL_MAYBE,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_MAYBE,
    [CONDITIONAL_OFF]: CONDITIONAL_MAYBE
  },
  [CONDITIONAL_ON] : {
    [CONDITIONAL_YES] : CONDITIONAL_ON,
    [CONDITIONAL_NO]: CONDITIONAL_OFF,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_ON,
    [CONDITIONAL_OFF]: CONDITIONAL_OFF
  },
  [CONDITIONAL_OFF] : {
    [CONDITIONAL_YES] : CONDITIONAL_OFF,
    [CONDITIONAL_NO]: CONDITIONAL_ON,
    [CONDITIONAL_MAYBE]: CONDITIONAL_MAYBE,
    [CONDITIONAL_ON]: CONDITIONAL_OFF,
    [CONDITIONAL_OFF]: CONDITIONAL_ON
  },
}

/** Evaluate a set of conditions given current settings. If more than one condition is in conditions,
 * combine them using the given combinator function */
export function evaluate(conditions, settings, combinator=all) {
  if (Array.isArray(conditions)) {
    return combinator(conditions.map(_ => evaluate(_, settings)))
  }
  else { // conditions must be an object
    return all(Object.keys(conditions).map(fs => {
      const conditionFs = conditions[fs]
      switch (fs) {
        case CONDITIONAL_OPERATOR_PREFIX + "all":
          return evaluate(conditionFs, settings, all)
        case CONDITIONAL_OPERATOR_PREFIX + "oneOf":
          return evaluate(conditionFs, settings, oneOf)
        case CONDITIONAL_OPERATOR_PREFIX + "not":
          return not(evaluate(conditionFs, settings, all))
        case CONDITIONAL_OPERATOR_PREFIX + "any":
          return evaluate(conditionFs, settings, any)
        default:
          // conditionFs is a conditional feature structure containing f's.
          return combinator(Object.keys(conditionFs).map(f => {
            const currentSetting = conditionalValueMap[settings[fs][f]] // TODO: default values?
            const condition = conditionalValueMap[conditionFs[f]]
            return evaluationMap[condition][currentSetting]
          }))
      }
    }))
  }
}

const conditionalClass = {
  [CONDITIONAL_YES]: "ConditionalYes",
  [CONDITIONAL_NO]: "ConditionalNo",
  [CONDITIONAL_MAYBE]: "ConditionalMaybe",
  [CONDITIONAL_ON]: "ConditionalYes",
  [CONDITIONAL_OFF]: "ConditionalNo"
}

export default function UpdateConditionals(props) {
  const xml = props.nodes[0]
  const hasUpdates = (xml.nodeType === Node.ELEMENT_NODE && xml.hasAttribute("jf:conditionals"))
  // this state holds the parsed conditions
  const [conditions, setConditions] = useState([])
  // this state holds the evaluation
  const [conditionalEvaluation, setConditionalEvaluation] = useState(CONDITIONAL_YES)
  const settings = props.metadata.get(META_SETTINGS)

  const fetchConditions = () => {
    const getConditionsFrom = async (uri) => {
      const conditionsXml = await DocumentApi.getUri(uri, props.documentName, props.documentApi)
      return parseSettings(conditionsXml)
    }

    const getAllConditions = async () => {
      const conditionsUris = xml.getAttribute("jf:conditionals").split(/\s+/)
      const allConditions = await Promise.all(conditionsUris.map(async (_) => getConditionsFrom(_)))
      setConditions(allConditions)
    }
    if (hasUpdates) {
      getAllConditions()
    }
  }

  const evaluations = () => {
    setConditionalEvaluation(evaluate(conditions, settings))
  }

  useEffect(() => fetchConditions(), [props.metadata])
  useEffect(() => evaluations(), [conditions])

  if (hasUpdates) {
    return (<div className={`UpdateConditionals ${conditionalClass[conditionalEvaluation]}`}>
      { conditionalEvaluation !== CONDITIONAL_NO &&  props.chain.next(props) }
    </div>)
  }
  else return props.chain.next(props)
}