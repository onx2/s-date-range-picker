import { isBefore } from "date-fns";

export function toRange(
  dateLeft: Date,
  dateRight: Date
): { start: Date; end: Date } {
  if (isBefore(dateRight, dateLeft)) {
    return {
      start: dateRight,
      end: dateLeft
    };
  }

  return {
    start: dateLeft,
    end: dateRight
  };
}
