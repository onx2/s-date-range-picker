import { addDays, startOfWeek } from "date-fns";
import { dayOffset } from "./day-offset";
export const getDaysOfWeek = ({ firstDayOfWeek }) =>
  [0, 1, 2, 3, 4, 5, 6].map((_, i) =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset({ firstDayOfWeek })
      }),
      i
    )
  );
