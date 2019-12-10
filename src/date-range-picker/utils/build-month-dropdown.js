import { addMonths, startOfYear } from 'date-fns'
import { localeFormat } from './locale-format'

/**
 *
 * @param {Date} mo - Month
 * @param {string} format - Format of the month
 *
 * @returns {Date[]}
 */
export const buildMonthDropdown = (mo, format) => {
  const yrStart = startOfYear(mo)

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => {
    const value = addMonths(yrStart, i)

    return { value, text: localeFormat(value, format) }
  })
}
