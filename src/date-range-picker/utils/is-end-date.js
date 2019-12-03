import { isSameDay, isAfter } from "date-fns";

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} hoverDate
 * @property {Date} tempStart
 * @property {Date} tempEnd
 *
 * @returns {boolean}
 */
export const isEndDate = ({
  tempEndDate,
  date,
  hoverDate,
  hasSelection,
  tempStartDate
}) => {
  if (!hasSelection) {
    if (isAfter(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }

    return isSameDay(date, tempStartDate);
  }

  return isSameDay(date, tempEndDate);
};
