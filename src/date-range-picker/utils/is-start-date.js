import { isSameDay, isBefore } from "date-fns";

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} hoverDate
 * @property {Date} tempStartDate
 *
 * @returns {boolean}
 */
export const isStartDate = ({
  hasSelection,
  date,
  hoverDate,
  tempStartDate
}) => {
  if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
    return isSameDay(date, hoverDate);
  }

  return isSameDay(date, tempStartDate);
};
