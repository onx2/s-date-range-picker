import {
  addDays,
  addYears,
  endOfYear,
  startOfYear,
  subYears,
  startOfDay,
  endOfDay
} from 'date-fns'
import { getDayMetaData } from '../index'

const date = addDays(new Date('2019-12-12'), 2)
const firstDayOfWeek = 'sunday'
const tempEndDate = endOfDay(addDays(new Date('2019-12-12'), 3))
const events = []
const month = new Date()
const singlePicker = false
const tempStartDate = startOfDay(addDays(new Date('2019-12-12'), 1))
const today = new Date()
const maxDate = addYears(endOfYear(new Date()), 10)
const minDate = subYears(startOfYear(new Date()), 10)
const disabledDates = []

describe('getDayMetaData', () => {
  it('Returns correct meta data', () => {
    const day = getDayMetaData({
      date,
      firstDayOfWeek,
      tempEndDate,
      events,
      month,
      singlePicker,
      tempStartDate,
      today,
      maxDate,
      minDate,
      disabledDates
    })

    expect('date' in day).toStrictEqual(true)
    expect('events' in day).toStrictEqual(true)
    expect('isToday' in day).toStrictEqual(true)
    expect('isWeekend' in day).toStrictEqual(true)
    expect('isPrevMonth' in day).toStrictEqual(true)
    expect('isNextMonth' in day).toStrictEqual(true)
    expect('isStartDate' in day).toStrictEqual(true)
    expect('isDisabled' in day).toStrictEqual(true)
    expect('isEndDate' in day).toStrictEqual(true)
    expect('isWithinSelection' in day).toStrictEqual(true)
  })

  it('isWithinSelection is always false for a single picker', () => {
    const day = getDayMetaData({
      date,
      firstDayOfWeek,
      tempEndDate,
      events,
      month,
      singlePicker: true,
      tempStartDate,
      today,
      maxDate,
      minDate,
      disabledDates
    })

    expect(day.isWithinSelection).toStrictEqual(false)
  })
})
