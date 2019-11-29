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
import { Day, GetDayMetaDataParams } from "../types";
import { dayOffset } from "./day-offset";
import { getDayMetaData } from "./get-day-meta-data";

function buildWeek(
  startDay: Date,
  getDayMetaDataParams: GetDayMetaDataParams
): Day[] {
  return [0, 1, 2, 3, 4, 5, 6].map(value =>
    getDayMetaData({ ...getDayMetaDataParams, date: addDays(startDay, value) })
  );
}

type CalendarWeek = {
  weeksFromToday: number;
  weekNumber: number;
  isoWeekNumber: number;
  daysInWeek: Day[];
};
export function getCalendarWeeks(
  getDayMetaDataParams: GetDayMetaDataParams
): CalendarWeek[] {
  const { month, locale, firstDayOfWeek, today } = getDayMetaDataParams;
  const weekStartsOn = dayOffset({ firstDayOfWeek, locale });
  const start = startOfWeek(endOfMonth(subMonths(month, 1)));
  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale }
  ).map((date: Date) => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale
    }),
    weekNumber: getWeek(date, { weekStartsOn, locale }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }));
}
