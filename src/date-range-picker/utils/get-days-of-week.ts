import { addDays, startOfWeek } from "date-fns";
import { dayOffset } from "./day-offset";

type params = {
  firstDayOfWeek: string;
  locale: Locale;
};

export function getDaysOfWeek({ firstDayOfWeek, locale }: params): Date[] {
  return [0, 1, 2, 3, 4, 5, 6].map(value =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset({ firstDayOfWeek, locale })
      }),
      value
    )
  );
}
