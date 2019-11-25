import { addDays, getDaysInMonth, startOfMonth } from "date-fns";

export const getMonth = (date, skip = 0, limit) => {
	const startDay = startOfMonth(date);
	let size = getDaysInMonth(date) - skip;
	size = Math.min(Math.max(size, 0), limit || size);
	size = size < 0 ? getDaysInMonth(date) : size;

	return [...Array(size)].map((v, i) => addDays(startDay, i + skip));
};
