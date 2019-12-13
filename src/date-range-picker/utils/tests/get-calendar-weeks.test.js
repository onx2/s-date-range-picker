import {
  addDays,
  addYears,
  endOfYear,
  startOfYear,
  subYears,
  startOfDay,
  endOfDay
} from 'date-fns'
import { getCalendarWeeks } from '../index'

const date = addDays(new Date(), 2)
const firstDayOfWeek = 'sunday'
const tempEndDate = endOfDay(addDays(new Date(), 3))
const events = []
const month = new Date()
const singlePicker = false
const tempStartDate = startOfDay(addDays(new Date(), 1))
const today = new Date()
const maxDate = addYears(endOfYear(new Date()), 10)
const minDate = subYears(startOfYear(new Date()), 10)
const disabledDates = []

describe('getCalendarWeeks', () => {
  it('Returns 6 weeks', () => {
    const weeks = getCalendarWeeks({
      date,
      tempEndDate,
      firstDayOfWeek,
      events,
      month,
      singlePicker,
      tempStartDate,
      today,
      maxDate,
      minDate,
      disabledDates
    })

    expect(weeks.length).toStrictEqual(6)
  })
})
