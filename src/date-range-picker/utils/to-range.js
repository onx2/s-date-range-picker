import { isAfter } from "date-fns"

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
  let start = date
  let end = dateToCompare

  if (isAfter(date, dateToCompare)) {
    start = dateToCompare
    end = date
  }

  return { start, end }
}
