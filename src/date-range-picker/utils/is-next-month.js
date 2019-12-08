import { isSameMonth, addMonths } from 'date-fns'

export const isNextMonth = (month, date) =>
  isSameMonth(addMonths(month, 1), date)
