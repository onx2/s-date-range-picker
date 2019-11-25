import { addDays, startOfWeek } from "date-fns";

export const getWeek = (weekStartsOn = 0) => {
	const startDay = startOfWeek(new Date(), { weekStartsOn });

	return [0, 1, 2, 3, 4, 5, 6].map(value => addDays(startDay, value));
};
