import { isSameDay } from "date-fns";

export const isEndDate = (date, endDate) => {
	if (endDate) {
		return isSameDay(date, endDate);
	}

	return false;
};
