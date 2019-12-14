import { getDaysOfWeek } from '../index'

describe('getDaysOfWeek', () => {
  it('Returns an array of 7 dates', () => {
    const firstDayOfWeek = 'sunday'
    const result = getDaysOfWeek(firstDayOfWeek)

    expect(result.length).toStrictEqual(7)
  })

  it('Starts with the first day of week', () => {
    const firstDayOfWeek = 'tuesday'
    const result = getDaysOfWeek(firstDayOfWeek)

    expect(format(result[0], 'EEEE')).toStrictEqual('Tuesday')
  })
})
