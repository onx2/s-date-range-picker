import { isSameDay, isBefore } from "date-fns";
export function isStartDate({ endDate, date, hoverDate, startDate }) {
  if (!endDate) {
    if (isBefore(hoverDate, startDate)) {
      return isSameDay(date, hoverDate);
    }
  }
  return isSameDay(date, startDate);
}
