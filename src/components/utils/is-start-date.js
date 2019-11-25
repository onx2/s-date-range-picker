import { isSameDay } from "date-fns";

export const isStartDate = (date, startDate) => isSameDay(date, startDate);
