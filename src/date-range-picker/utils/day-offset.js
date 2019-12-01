export const dayOffset = ({ firstDayOfWeek }) =>
  [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ].indexOf(firstDayOfWeek.toLocaleLowerCase(__locale__));
