import { isSameMonth, subMonths } from 'date-fns'

export const isPrevMonth = (thisMonth, date) =>
  isSameMonth(subMonths(thisMonth, 1), date)
