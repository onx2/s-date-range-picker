import { isBefore } from "date-fns";

/**
 *
 * @typedef {Object} Range
 * @property {Date} start
 * @property {Date} end
 */
/**
 *
 * @param {Date} dateLeft - Date
 * @param {Date} dateRight - Date to compare
 *
 *
 * @returns {Range}
 */
export const toRange = (dateLeft, dateRight) => {
  if (isBefore(dateRight, dateLeft)) {
    return {
      start: dateRight,
      end: dateLeft
    };
  }
  return {
    start: dateLeft,
    end: dateRight
  };
};
