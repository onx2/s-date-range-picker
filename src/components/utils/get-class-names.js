export const getClassNames = day => {
	const classes = [];

	if (day.isToday) {
		classes.push("today");
	}

	if (day.isWeekend) {
		classes.push("weekend");
	}

	if (day.isStartDate) {
		classes.push("start-date");
	}

	if (day.isEndDate) {
		classes.push("end-date");
	}

	if (day.isWithinSelection) {
		classes.push("within-selection");
	}

	if (day.isPreview) {
		classes.push("preview");
	}

	if (!day.isLastMonth && !day.isNextMonth && !day.isDisabled) {
		classes.push("selectable");
	}

	if (day.isLastMonth) {
		classes.push("last-month");
	}

	if (day.isNextMonth) {
		classes.push("next-month");
	}

	return classes.join(" ");
};
