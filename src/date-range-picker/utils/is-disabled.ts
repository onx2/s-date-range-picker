import { isAfter, isBefore, isSameDay } from "date-fns";

type params = {
  date: Date;
  maxDate: Date;
  minDate: Date;
  disabledDates: Date[];
};

export function isDisabled({
  date,
  maxDate,
  minDate,
  disabledDates
}: params): boolean {
  if (disabledDates.some(disabledDate => isSameDay(date, disabledDate))) {
    return true;
  }

  if (isBefore(date, minDate)) {
    return true;
  }

  if (isAfter(date, maxDate)) {
    return true;
  }

  return false;
}
