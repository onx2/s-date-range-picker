import { addMonths, isAfter, isBefore, isSameMonth, subMonths } from "date-fns";

export const isDisabled = (date, minDate, maxDate, month) => {
	if (isSameMonth(subMonths(date, 1), month)) {
		return true;
	}

	if (isSameMonth(addMonths(date, 1), month)) {
		return true;
	}

	return isBefore(date, minDate) || isAfter(date, maxDate);
};
