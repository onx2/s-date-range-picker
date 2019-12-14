import { pad } from "../index"

describe("pad", () => {
  it("Add 0 in front of number when below 10", () => {
    const result = pad(4)
    expect(result).toStrictEqual("04")
  })

  it("Return number as is if above 9", () => {
    const result = pad(10)
    expect(result).toStrictEqual(10)
  })
})
