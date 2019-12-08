import { isSameMonth, addMonths } from 'date-fns'

export const isNextMonth = (thisMonth, date) =>
  isSameMonth(addMonths(thisMonth, 1), date)
