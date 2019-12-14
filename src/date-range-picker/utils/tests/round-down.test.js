import { roundDown } from "../index"

describe("roundDown", () => {
  it("Default rounds down to nearest whole number", () => {
    const result = roundDown(4.6)
    expect(result).toStrictEqual(4)
  })

  it("Precision of 0.5", () => {
    const result = roundDown(2.83, 0.5)
    expect(result).toStrictEqual(2.5)
  })
})
