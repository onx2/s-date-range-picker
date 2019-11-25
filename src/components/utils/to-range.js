import { isBefore } from "date-fns";

export const toRange = (startDate, endDate) => {
	if (!endDate) {
		return {
			startDate,
			endDate: startDate
		};
	}

	// Swap startDate and endDate values when endDate is before startDate.
	if (isBefore(endDate, startDate)) {
		return {
			startDate: endDate,
			endDate: startDate
		};
	}

	return {
		startDate,
		endDate
	};
};
