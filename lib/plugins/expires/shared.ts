import { toRawType } from '@vue/shared'
import { useExtra } from '../extra'

export type ExpiresDateOptions = {
  milliseconds?: number
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

    if (+v.years) d.setFullYear(d.getFullYear() + v.years)
    if (+v.months) d.setMonth(d.getMonth() + v.months)
    if (+v.days) d.setDate(d.getDate() + v.days)
    if (+v.hours) d.setHours(d.getHours() + v.hours)
    if (+v.minutes) d.setMinutes(d.getMinutes() + v.minutes)
    if (+v.seconds) d.setSeconds(d.getSeconds() + v.seconds)
    if (+v.milliseconds) d.setMilliseconds(d.getMilliseconds() + v.milliseconds)
    return d.getTime()
  }
}

export function useExpires<T>(value: T, expires: ExpiresDate): T {
  const timestamp = toTimestamp(expires)

  return useExtra(value, {
    expires: timestamp,
  })
}
