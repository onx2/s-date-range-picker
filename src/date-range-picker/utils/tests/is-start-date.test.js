import { addDays, subDays } from "date-fns"
import { isStartDate } from "../index"

const date = new Date()

describe("isStartDate", () => {
  it("Has selection and temp end is before temp start, check against tempEndDate", () => {
    const tempStartDate = addDays(new Date(), 2)
    const tempEndDate = subDays(new Date(), 2)
    const hasSelection = true
    const result = isStartDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(false)
  })

  it("Doesn't have selection and temp end is before temp start, check against tempEndDate", () => {
    const tempStartDate = new Date()
    const tempEndDate = subDays(new Date(), 2)
    const hasSelection = false
    const result = isStartDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(false)
  })

  it("Doesn't have selection and temp end is after temp start, check against tempStart", () => {
    const tempStartDate = subDays(new Date(), 2)
    const tempEndDate = new Date()
    const hasSelection = false
    const result = isStartDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(false)
  })
})
