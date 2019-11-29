import { addYears, format, differenceInCalendarYears } from "date-fns";

type params = {
  minDate: Date;
  maxDate: Date;
  locale: Locale;
};
export function buildYears({
  minDate,
  maxDate,
  locale
}: params): { value: Date; text: string }[] {
  const numYears: number = differenceInCalendarYears(maxDate, minDate) + 1;

  return [...Array(numYears)].map((_, i) => {
    const value = addYears(minDate, i);
    return { value, text: format(value, "yyyy", { locale }) };
  });
}
