import { isSameDay, isBefore } from "date-fns";

type params = {
  endDate: Date;
  date: Date;
  hoverDate: Date;
  startDate: Date;
};

export function isEndDate({
  endDate,
  date,
  hoverDate,
  startDate
}: params): boolean {
  if (endDate) {
    return isSameDay(date, endDate);
  }

  if (isBefore(hoverDate, startDate)) {
    return isSameDay(date, startDate);
  }

  return isSameDay(date, hoverDate);
}
