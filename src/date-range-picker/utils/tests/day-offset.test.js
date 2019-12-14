import { dayOffset } from "../index"

describe("dayOffset", () => {
  it("Returns correct index for day of week", () => {
    expect(dayOffset("sunday")).toStrictEqual(0)
    expect(dayOffset("monday")).toStrictEqual(1)
    expect(dayOffset("tuesday")).toStrictEqual(2)
    expect(dayOffset("wednesday")).toStrictEqual(3)
    expect(dayOffset("thursday")).toStrictEqual(4)
    expect(dayOffset("friday")).toStrictEqual(5)
    expect(dayOffset("saturday")).toStrictEqual(6)
  })
})
