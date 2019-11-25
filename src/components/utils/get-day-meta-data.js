import { isSameDay, isWeekend, isSameMonth, subMonths, addMonths } from "date-fns";

import { getRange, isWithinSelection, isStartDate, isEndDate, isPreview, isDisabled } from "./index";

export const getDayMetaData = params => {
	const { date, startDate, hoverDate, minDate, maxDate, month, today, endDate, singlePicker } = params;
	const range = getRange(startDate, endDate, hoverDate);

	return {
		date,
		isToday: isSameDay(date, today),
		isWeekend: isWeekend(date),
		isLastMonth: isSameMonth(subMonths(date, 1), month),
		isNextMonth: isSameMonth(addMonths(date, 1), month),
		isStartDate: isStartDate(date, startDate),
		isEndDate: !singlePicker ? isEndDate(date, range.endDate) : false,
		isWithinSelection: !singlePicker ? isWithinSelection(date, startDate, endDate || hoverDate) : false,
		isPreview: !singlePicker ? isPreview(date, startDate, endDate, hoverDate) : false,
		isDisabled: isDisabled(date, minDate, maxDate, month)
	};
};
