import { addDays } from "date-fns"
import { isPrevMonth } from "../index"

const date = addDays(new Date(), 2)
const thisMonth = new Date()

describe("isPrevMonth", () => {
  it("Is the selected date the same month as the prev one", () => {
    const result = isPrevMonth(thisMonth, date)

    expect(result).toStrictEqual(false)
  })
})
