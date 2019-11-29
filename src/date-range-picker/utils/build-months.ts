import { addMonths, format, startOfYear } from "date-fns";

type params = {
  month: Date;
  monthFormat: string;
  locale: Locale;
};

export function buildMonths({
  month,
  monthFormat,
  locale
}: params): { value: Date; text: string }[] {
  const thisJanuary = startOfYear(month);

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i: number) => {
    const value: Date = addMonths(thisJanuary, i);

    return { value, text: format(value, monthFormat, { locale }) };
  });
}
