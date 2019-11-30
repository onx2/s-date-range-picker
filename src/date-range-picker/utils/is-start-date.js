import { isSameDay, isBefore } from "date-fns";
export function isStartDate({ hasSelection, date, hoverDate, tempStartDate }) {
  if (!hasSelection) {
    if (isBefore(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }
  }

  return isSameDay(date, tempStartDate);
}
