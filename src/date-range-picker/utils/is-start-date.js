import { isSameDay, isBefore } from "date-fns";
export function isStartDate({ hasSelection, date, hoverDate, tempStartDate }) {
  if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
    return isSameDay(date, hoverDate);
  }

  return isSameDay(date, tempStartDate);
}
