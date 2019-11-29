export function dayOffset({ firstDayOfWeek, locale }) {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ].indexOf(firstDayOfWeek.toLocaleLowerCase(locale));
}
