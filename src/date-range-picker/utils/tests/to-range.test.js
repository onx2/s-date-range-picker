import { addDays, subDays  } from 'date-fns'
import { toRange } from '../index'

const date = new Date()

describe('toRange', () => {
  it('Date is after date to compare, start is dateToCompare', () => {
    const dateToCompare = subDays(new Date(), 2)
    const result = toRange(date, dateToCompare)

    expect(result.start).toStrictEqual(dateToCompare)
  })

  it('Date is before date to compare, start is date', () => {
    const dateToCompare = addDays(new Date(), 2)
    const result = toRange(date, dateToCompare)

    expect(result.start).toStrictEqual(date)
  })
})
