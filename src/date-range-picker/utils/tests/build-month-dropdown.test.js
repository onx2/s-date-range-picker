import { buildMonthDropdown } from "../index"

describe("buildMonthDropdown", () => {
  const months = buildMonthDropdown(new Date(), "MMMM")
  it("Should return an array", () => {
    expect(months).toBeInstanceOf(Array)
  })

  it("Should return 12 months", () => {
    expect(months.length).toStrictEqual(12)
  })
})
