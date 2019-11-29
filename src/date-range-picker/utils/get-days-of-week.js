import { addDays, startOfWeek } from "date-fns";
import { dayOffset } from "./day-offset";
export function getDaysOfWeek({ firstDayOfWeek, locale }) {
  return [0, 1, 2, 3, 4, 5, 6].map(value =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset({ firstDayOfWeek, locale })
      }),
      value
    )
  );
}
