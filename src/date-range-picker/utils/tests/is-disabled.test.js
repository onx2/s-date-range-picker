import { addDays, addYears, endOfYear, startOfYear, subYears } from "date-fns"
import { isDisabled } from "../index"

const maxDate = addYears(endOfYear(new Date()), 10)
const minDate = subYears(startOfYear(new Date()), 10)

describe("isDisabled", () => {
  it("Marks a day enabled when within min/max bounds", () => {
    const disabledDates = []
    const date = addDays(new Date(), 2)
    const result = isDisabled({ date, minDate, maxDate, disabledDates })
    expect(result).toStrictEqual(false)
  })

  it("Allows for an array of disabled dates", () => {
    const disabledDates = [addDays(new Date(), 2)]
    const date = addDays(new Date(), 2)
    const result = isDisabled({ date, minDate, maxDate, disabledDates })
    expect(result).toStrictEqual(true)
  })

  it("Marks a day enabled when before min", () => {
    const disabledDates = []
    const date = subYears(new Date(), 11)
    const result = isDisabled({ date, minDate, maxDate, disabledDates })
    expect(result).toStrictEqual(true)
  })

  it("Marks a day enabled when after max", () => {
    const disabledDates = []
    const date = addYears(new Date(), 11)
    const result = isDisabled({ date, minDate, maxDate, disabledDates })
    expect(result).toStrictEqual(true)
  })
})
