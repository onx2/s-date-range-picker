import {
  isSameDay,
  isWeekend,
  isSameMonth,
  isWithinInterval,
  subMonths,
  addMonths
} from "date-fns";
import { isDisabled } from "./is-disabled";
import { isEndDate } from "./is-end-date";
import { isStartDate } from "./is-start-date";
import { toRange } from "./to-range";
export function getDayMetaData(params) {
  const {
    date,
    endDate,
    events,
    hoverDate,
    month,
    singlePicker,
    startDate,
    today,
    maxDate,
    minDate,
    disabledDates
  } = params;
  const { start, end } = toRange(startDate, endDate || hoverDate);
  return {
    date,
    events,
    isToday: isSameDay(date, today),
    isWeekend: isWeekend(date),
    isPrevMonth: isSameMonth(subMonths(month, 1), date),
    isNextMonth: isSameMonth(addMonths(month, 1), date),
    isStartDate: isStartDate(params),
    isDisabled: isDisabled({ date, maxDate, minDate, disabledDates }),
    // Used only in range mode
    isEndDate: !singlePicker ? isEndDate(params) : false,
    isWithinSelection: !singlePicker
      ? isWithinInterval(date, { start, end })
      : false
  };
}
