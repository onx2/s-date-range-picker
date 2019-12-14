import { addDays, startOfWeek } from 'date-fns'
import { dayOffset } from './day-offset'

/**
 * @todo Allow changing of week length
 *
 * @param {string} firstDayOfWeek
 *
 * @returns {Date[]}
 */
export const getDaysOfWeek = firstDayOfWeek =>
  [0, 1, 2, 3, 4, 5, 6].map((_, i) =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset(firstDayOfWeek)
      }),
      i
    )
  )
