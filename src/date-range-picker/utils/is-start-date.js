import { isSameDay, isBefore } from 'date-fns'

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} tempStartDate
 *
 * @returns {boolean}
 */
export const isStartDate = ({
  hasSelection,
  date,
  tempEndDate,
  tempStartDate
}) => {
  if (!hasSelection && isBefore(tempEndDate, tempStartDate)) {
    return isSameDay(date, tempEndDate)
  }

  return isSameDay(date, tempStartDate)
}
