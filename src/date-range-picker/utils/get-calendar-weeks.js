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
} from 'date-fns'
import { dayOffset } from './day-offset'
import { getDayMetaData } from './get-day-meta-data'
/**
 *
 * @param {Object} getDayMetaDataParams
 * @prop {Date} date
 * @prop {Date} tempEnd
 * @prop {Date[]} events
 * @prop {Date} month
 * @prop {boolean} singlePicker
 * @prop {Date} tempStart
 * @prop {Date} today
 * @prop {Date} maxDate
 * @prop {Date} minDate
 * @prop {Date[]} disabledDates
 *
 * @returns {Day}
 */

/**
 *
 * @param {Date} start
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Date[]}
 */

const buildWeek = (start, getDayMetaDataParams) =>
  [0, 1, 2, 3, 4, 5, 6].map((_, i) =>
    getDayMetaData({ ...getDayMetaDataParams, date: addDays(start, i) })
  )

/**
 *
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Object[]}
 */
export const getCalendarWeeks = getDayMetaDataParams => {
  const { month, firstDayOfWeek, today } = getDayMetaDataParams
  const weekStartsOn = dayOffset(firstDayOfWeek)
  const start = startOfWeek(endOfMonth(subMonths(month, 1)))

  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale: window.__locale__ }
  ).map(date => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale: window.__locale__
    }),
    weekNumber: getWeek(date, { weekStartsOn }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }))
}
