import { isSameDay, isAfter } from "date-fns";
export function isEndDate({
  tempEndDate,
  date,
  hoverDate,
  hasSelection,
  tempStartDate
}) {
  if (!hasSelection) {
    if (isAfter(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }

    return isSameDay(date, tempStartDate);
  }

  return isSameDay(date, tempEndDate);
}
