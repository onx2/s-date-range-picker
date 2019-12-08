import { isAfter } from 'date-fns'

/**
 *
 * @typedef {Object} Range
 * @property {Date} start
 * @property {Date} end
 */
/**
 *
 * @param {Date} date - Date
 * @param {Date} dateToCompare - Date to compare
 *
 *
 * @returns {Range}
 */
export const toRange = (date, dateToCompare) => {
  if (isAfter(date, dateToCompare)) {
    return {
      start: dateToCompare,
      end: date
    }
  }
  return {
    start: date,
    end: dateToCompare
  }
}
