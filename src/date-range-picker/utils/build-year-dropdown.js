import { addYears, differenceInCalendarYears } from 'date-fns'
import { localeFormat } from './locale-format'

/**
 *
 * @param {Date} min - Earliest allowed date
 * @param {Date} max - Latest allowed date
 * @param {number} pageNum - Each page starts a month later than the last
 *
 * @returns {Date[]}
 */
export const buildYearDropdown = (min, max, pageNum) => {
  const numYrs = differenceInCalendarYears(max, min) + pageNum + 1
  return [...Array(numYrs)].map((_, i) => {
    const value = addYears(min, i)
    return { value, text: localeFormat(value, 'yyyy') }
  })
}
