import { isSameDay, isWeekend, isWithinInterval } from "date-fns"
import { isDisabled } from "./is-disabled"
import { isEndDate } from "./is-end-date"
import { isNextMonth } from "./is-next-month"
import { isPrevMonth } from "./is-prev-month"
import { isStartDate } from "./is-start-date"
import { toRange } from "./to-range"

/**
 *
 * @typedef {Object} Day
 * @prop {Date} date
 * @prop {Array} events
 * @prop {boolean} isToday
 * @prop {boolean} isWeekend
 * @prop {boolean} isPrevMonth
 * @prop {boolean} isNextMonth
 * @prop {boolean} isStartDate
 * @prop {boolean} isDisabled
 * @prop {boolean} isEndDate
 * @prop {boolean} isWithinSelection
 */

/**
 *
 * @param {Object} params
 * @prop {Date} date
 * @prop {Date} tempEnd
 * @prop {Date[]} events
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
export const getDayMetaData = params => {
  const {
    date,
    tempEndDate,
    events,
    month,
    singlePicker,
    tempStartDate,
    today,
    maxDate,
    minDate,
    disabledDates
  } = params

  // Sort the range asc for `isWithinInterval` function.
  const { start, end } = toRange(tempStartDate, tempEndDate)

  return {
    date,
    events,
    isToday: isSameDay(date, today),
    isWeekend: isWeekend(date),
    isPrevMonth: isPrevMonth(month, date),
    isNextMonth: isNextMonth(month, date),
    isStartDate: isStartDate(params),
    isDisabled: isDisabled({ date, maxDate, minDate, disabledDates }),
    // Used only in range mode
    isEndDate: isEndDate(params),
    isWithinSelection: !singlePicker
      ? isWithinInterval(date, { start, end })
      : false
  }
}
