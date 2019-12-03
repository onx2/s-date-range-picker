import { addYears, differenceInCalendarYears } from "date-fns";
import { localeFormat } from "./locale-format";

/**
 *
 * @param {Date} minDate
 * @param {Date} maxDate
 *
 * @returns {Date[]}
 */
export const buildYears = (minDate, maxDate) => {
  const numYears = differenceInCalendarYears(maxDate, minDate) + 1;
  return [...Array(numYears)].map((_, i) => {
    const value = addYears(minDate, i);
    return { value, text: localeFormat(value, "yyyy") };
  });
};
