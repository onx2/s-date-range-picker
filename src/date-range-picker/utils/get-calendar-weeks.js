import {
  addDays,
  differenceInCalendarWeeks,
  endOfMonth,
  eachWeekOfInterval,
  getWeek,
  getISOWeek,
  addWeeks,
  subMonths,
  startOfWeek
} from "date-fns";
import { dayOffset } from "./day-offset";
import { getDayMetaData } from "./get-day-meta-data";
/**
 *
 * @param {Object} getDayMetaDataParams
 * @prop {Date} date
 * @prop {Date} tempEndDate
 * @prop {Date[]} events
 * @prop {Date} hoverDate
 * @prop {boolean} hasSelection
 * @prop {Date} month
 * @prop {boolean} singlePicker
 * @prop {Date} tempStartDate
 * @prop {Date} today
 * @prop {Date} maxDate
 * @prop {Date} minDate
 * @prop {Date[]} disabledDates
 *
 * @returns {Day}
 */

/**
 *
 * @param {Date} startDay
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Date[]}
 */
const buildWeek = (startDay, getDayMetaDataParams) =>
  [0, 1, 2, 3, 4, 5, 6].map(value =>
    getDayMetaData({ ...getDayMetaDataParams, date: addDays(startDay, value) })
  );

/**
 *
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Object[]}
 */
export const getCalendarWeeks = getDayMetaDataParams => {
  const { month, firstDayOfWeek, today } = getDayMetaDataParams;
  const weekStartsOn = dayOffset(firstDayOfWeek);
  const start = startOfWeek(endOfMonth(subMonths(month, 1)));

  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale: __locale__ }
  ).map(date => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale: __locale__
    }),
    weekNumber: getWeek(date, { weekStartsOn }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }));
};
