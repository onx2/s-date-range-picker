import { addDays, subDays } from 'date-fns'
import { isEndDate } from '../index'

const tempEndDate = addDays(new Date(), 2)

describe('isEndDate', () => {
  it('Has selection defaults to date & tempEndDate is same day ', () => {
    const tempStartDate = subDays(new Date(), 2)
    const date = new Date()
    const hasSelection = true
    const result = isEndDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(false)
  })

  it("Doesn't have selection and tempEndDate is after tempStartDate ", () => {
    const tempStartDate = subDays(new Date(), 2)
    const date = tempEndDate
    const hasSelection = false
    const result = isEndDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(true)
  })

  it("Doesn't have selection and tempEndDate is before tempStartDate ", () => {
    const tempStartDate = addDays(new Date(), 5)
    const date = tempEndDate
    const hasSelection = false
    const result = isEndDate({
      tempEndDate,
      date,
      hasSelection,
      tempStartDate
    })

    expect(result).toStrictEqual(false)
  })
})
