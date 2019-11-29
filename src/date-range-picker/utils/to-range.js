import { isBefore } from "date-fns";
export function toRange(dateLeft, dateRight) {
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
