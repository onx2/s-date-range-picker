import {addYears, endOfYear, startOfYear, subYears, format } from "date-fns"
import { buildYearDropdown } from '../index'

const maxDate = addYears(endOfYear(new Date()), 10)
const minDate = subYears(startOfYear(new Date()), 10)

describe('buildYearDropdown', () => {
  it('Is within min and max years', () => {
    const pageNum = 1
    const result = buildYearDropdown(minDate, maxDate, pageNum)
    const minYear = format(minDate, "yyyy")
    const maxYear = format(addYears(maxDate, pageNum), "yyyy")

    expect(result[0].text).toStrictEqual(minYear)
    expect(result[result.length - 1].text).toStrictEqual(maxYear)
  })
})
