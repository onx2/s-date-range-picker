import { isWithinInterval } from "date-fns";
import { isStartDate, isEndDate, toRange } from "./index";

export const isPreview = (date, startDate, endDate, hoverDate) => {
	// Destructuring for readability and simplicity with date-fns `isWithinInterval` function.
	const { startDate: start, endDate: end } = toRange(startDate, hoverDate);

	return (
		startDate &&
		!endDate &&
		!isStartDate(date, start) &&
		!isEndDate(date, end) &&
		isWithinInterval(date, { start, end })
	);
};
