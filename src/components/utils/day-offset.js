export const dayOffset = (dayName, locale) =>
	["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(
		dayName.toLocaleLowerCase(locale)
	);
