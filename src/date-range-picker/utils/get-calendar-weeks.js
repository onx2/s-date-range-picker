import {
  addDays,
  differenceInCalendarWeeks,
  endOfMonth,
  eachWeekOfInterval,
  getWeek,
  getISOWeek,
  addWeeks,
  subMonths,
  startOfWeek
} from "date-fns";
import { dayOffset } from "./day-offset";
import { getDayMetaData } from "./get-day-meta-data";
function buildWeek(startDay, getDayMetaDataParams) {
  return [0, 1, 2, 3, 4, 5, 6].map(value =>
    getDayMetaData(
      Object.assign(Object.assign({}, getDayMetaDataParams), {
        date: addDays(startDay, value)
      })
    )
  );
}
export function getCalendarWeeks(getDayMetaDataParams) {
  const { month, locale, firstDayOfWeek, today } = getDayMetaDataParams;
  const weekStartsOn = dayOffset({ firstDayOfWeek, locale });
  const start = startOfWeek(endOfMonth(subMonths(month, 1)));
  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale }
  ).map(date => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale
    }),
    weekNumber: getWeek(date, { weekStartsOn, locale }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }));
}
