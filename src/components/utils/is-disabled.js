import { addMonths, isAfter, isBefore, isSameDay, isSameMonth, subMonths } from "date-fns";

export const isDisabled = ({ date, maxDate, minDate, month, disabledDates }) => {
	if (isSameMonth(subMonths(date, 1), month)) {
		return true;
	}

	if (isSameMonth(addMonths(date, 1), month)) {
		return true;
	}

	if (disabledDates.length) {
		return disabledDates.some(disabledDate => isSameDay(date, disabledDate));
	}

	return isBefore(date, minDate) || isAfter(date, maxDate);
};
