import { addYears, format, differenceInCalendarYears } from "date-fns";
export function buildYears({ minDate, maxDate, locale }) {
  const numYears = differenceInCalendarYears(maxDate, minDate) + 1;
  return [...Array(numYears)].map((_, i) => {
    const value = addYears(minDate, i);
    return { value, text: format(value, "yyyy", { locale }) };
  });
}
