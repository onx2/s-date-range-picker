import { isAfter, isBefore, isSameDay } from "date-fns";
export function isDisabled({ date, maxDate, minDate, disabledDates }) {
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
