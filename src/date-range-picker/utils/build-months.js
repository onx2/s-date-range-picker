import { addMonths, format, startOfYear } from "date-fns";

export function buildMonths({ month, monthFormat, locale }) {
  const thisJanuary = startOfYear(month);

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => {
    const value = addMonths(thisJanuary, i);

    return { value, text: format(value, monthFormat, { locale }) };
  });
}
