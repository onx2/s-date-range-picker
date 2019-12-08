import { isSameMonth, subMonths } from 'date-fns'

export const isPrevMonth = (month, date) =>
  isSameMonth(subMonths(month, 1), date)
