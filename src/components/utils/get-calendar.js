import { addMonths, getDay, getDaysInMonth, startOfMonth, subMonths } from "date-fns";

import { getMonth, getDayMetaData } from "./index";

export const getCalendar = (month, weekStartsOn = 0, getDayMetaDataParams) => {
	/**
	 * Get the first day of the week for this month as a number and
	 * prevent negatives when subtracting weekStartsOn and wraps around.
	 */
	const lastMonthRef = subMonths(month, 1);
	const firstDay = (7 + getDay(startOfMonth(month)) - weekStartsOn) % 7;
	const thisMonth = getMonth(month).map(m => getDayMetaData({ date: m, month, ...getDayMetaDataParams }));
	const lastMonth = getMonth(lastMonthRef, getDaysInMonth(lastMonthRef) - firstDay).map(m =>
		getDayMetaData({ date: m, month, ...getDayMetaDataParams })
	);
	const nextMonth = getMonth(addMonths(month, 1), 0, 42 - (thisMonth.length + firstDay)).map(m =>
		getDayMetaData({ date: m, month, ...getDayMetaDataParams })
	);

	return [...lastMonth, ...thisMonth, ...nextMonth];
};
