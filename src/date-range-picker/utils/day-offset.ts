type params = {
  firstDayOfWeek: string;
  locale: Locale;
};

export function dayOffset({
  firstDayOfWeek,
  locale
}: params): 0 | 5 | 1 | 2 | 3 | 4 | 6 {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ].indexOf((firstDayOfWeek as any).toLocaleLowerCase(locale)) as
    | 0
    | 5
    | 1
    | 2
    | 3
    | 4
    | 6;
}
