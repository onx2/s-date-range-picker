import { isBefore } from "date-fns";

export const toRange = (dateLeft, dateRight) => {
	if (!dateRight) {
		return {
			start: dateLeft,
			end: dateLeft
		};
	}

	// Swap startDate and endDate values when endDate is before startDate.
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
};
