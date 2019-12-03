import { addMonths, startOfYear } from "date-fns";
import { localeFormat } from "./locale-format";

/**
 *
 * @param {Date} minDate
 * @param {string} monthFormat
 *
 * @returns {Date[]}
 */
export const buildMonths = (month, monthFormat) => {
  const thisJanuary = startOfYear(month);

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => {
    const value = addMonths(thisJanuary, i);

    return { value, text: localeFormat(value, monthFormat) };
  });
};
