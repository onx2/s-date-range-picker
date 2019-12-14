import { addDays } from 'date-fns'
import { isNextMonth } from '../index'

const date = addDays(new Date(), 2)
const thisMonth = new Date()

describe('isNextMonth', () => {
  it('Is the selected date the same month as the next one', () => {
    const result = isNextMonth(thisMonth, date)

    expect(result).toStrictEqual(false)
  })
})
