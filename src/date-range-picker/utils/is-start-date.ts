import { isSameDay, isBefore } from "date-fns";

type params = {
  endDate: Date;
  date: Date;
  hoverDate: Date;
  startDate: Date;
};

export function isStartDate({
  endDate,
  date,
  hoverDate,
  startDate
}: params): boolean {
  if (!endDate) {
    if (isBefore(hoverDate, startDate)) {
      return isSameDay(date, hoverDate);
    }
  }

  return isSameDay(date, startDate);
}
