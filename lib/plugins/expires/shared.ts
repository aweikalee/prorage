import { toRawType } from '@vue/shared'
import { deleteActiveExtra, setActiveExtra } from '../extra'

export type ExpiresDateOptions = {
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
  months?: number
  years?: number
}
export type ExpiresDate = number | Date | ExpiresDateOptions

function toTimestamp(value: ExpiresDate) {
  if (typeof value === 'number') {
    return value
  } else if (toRawType(value) === 'Date') {
    return (value as Date).getTime()
  } else {
    const d = new Date()
    const v = value as Required<ExpiresDateOptions>

    if (+v.seconds) d.setSeconds(d.getSeconds() + v.seconds)
    if (+v.minutes) d.setMinutes(d.getMinutes() + v.minutes)
    if (+v.hours) d.setHours(d.getHours() + v.hours)
    if (+v.days) d.setDate(d.getDate() + v.days)
    if (+v.months) d.setMonth(d.getMonth() + v.months)
    if (+v.years) d.setFullYear(d.getFullYear() + v.years)
    return d.getTime()
  }
}

export function setExpires(expires?: ExpiresDate) {
  if (expires) {
    const timestamp = toTimestamp(expires)
    setActiveExtra('expires', timestamp)
  } else {
    deleteActiveExtra('expires')
  }
}
