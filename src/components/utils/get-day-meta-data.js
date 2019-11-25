import { isSameDay, isWeekend, isSameMonth, isWithinInterval, subMonths, addMonths } from "date-fns";

import { isStartDate, isEndDate, isDisabled, toRange } from "./index";

export const getDayMetaData = params => {
	const { date, startDate, hoverDate, minDate, maxDate, month, today, endDate, singlePicker } = params;
	const { start, end } = toRange(startDate, endDate || hoverDate);
	// isWithinSelection(date, startDate, endDate || hoverDate)
	return {
		date,
		isToday: isSameDay(date, today),
		isWeekend: isWeekend(date),
		isLastMonth: isSameMonth(subMonths(date, 1), month),
		isNextMonth: isSameMonth(addMonths(date, 1), month),
		isStartDate: isStartDate(params),
		isDisabled: isDisabled(params),
		// Used only in range mode
		isEndDate: !singlePicker ? isEndDate(params) : false,
		isWithinSelection: !singlePicker ? isWithinInterval(date, { start, end }) : false
	};
};
