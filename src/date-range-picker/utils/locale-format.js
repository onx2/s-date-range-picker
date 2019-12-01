import { format } from "date-fns";

export const localeFormat = (date, dateFormat) =>
  format(date, dateFormat, { locale: __locale__ });
