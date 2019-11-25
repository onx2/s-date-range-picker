import { isWithinInterval } from "date-fns";
import { toRange } from "./index";

export const isWithinSelection = (date, startDate, endDate) => {
	const range = toRange(startDate, endDate);

	return isWithinInterval(date, {
		start: range.startDate,
		end: range.endDate
	});
};
