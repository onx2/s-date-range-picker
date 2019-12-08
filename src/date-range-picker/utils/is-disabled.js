import { isAfter, isBefore, isSameDay } from 'date-fns'

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} maxDate
 * @property {Date} minDate
 * @property {Date[]} disabledDates
 *
 * @returns {boolean}
 */
export const isDisabled = ({ date, maxDate, minDate, disabledDates }) => {
  if (disabledDates.some(disabledDate => isSameDay(date, disabledDate))) {
    return true
  }

  if (isBefore(date, minDate)) {
    return true
  }

  if (isAfter(date, maxDate)) {
    return true
  }

  return false
}
