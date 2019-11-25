import { toRange } from "./index";

export const getRange = (startDate, endDate, hoverDate) => {
	if (startDate && endDate) {
		return toRange(startDate, endDate);
	}

	if (startDate && hoverDate) {
		return toRange(startDate, hoverDate);
	}

	return toRange(startDate, startDate);
};
