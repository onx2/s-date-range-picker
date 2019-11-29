import { isSameDay, isBefore } from "date-fns";
export function isEndDate({ endDate, date, hoverDate, startDate }) {
  if (endDate) {
    return isSameDay(date, endDate);
  }
  if (isBefore(hoverDate, startDate)) {
    return isSameDay(date, startDate);
  }
  return isSameDay(date, hoverDate);
}
