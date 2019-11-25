<script>
	import { createEventDispatcher } from "svelte";
	import { format, isBefore } from "date-fns";
	import { dayOffset, getCalendar, getDayMetaData } from "./utils";
	import DayOfMonth from "./DayOfMonth.svelte";

	export let disabledDates;
	export let events;
	export let hoverDate;
	export let firstDayOfWeek;
	export let isoWeekNumbers;
	export let locale;
	export let maxDate;
	export let maxSpan;
	export let minDate;
	export let month;
	export let monthDropdown;
	export let monthFormat;
	export let rtl;
	export let singlePicker;
	export let tempEndDate;
	export let tempStartDate;
	export let today;
	export let weekGuides;
	export let weekNumbers;
	export let yearDropdown;

	const dispatchEvent = new createEventDispatcher();

	const onClick = day => {
		if (singlePicker) {
			dispatchEvent("selection", { tempStartDate: day.date, tempEndDate: day.date });
		} else if (tempStartDate && tempEndDate) {
			dispatchEvent("selection", { tempStartDate: day.date, tempEndDate: undefined });
		} else {
			if (isBefore(day.date, tempStartDate)) {
				dispatchEvent("selection", { tempStartDate: day.date, tempEndDate: tempStartDate });
			} else {
				dispatchEvent("selection", { tempStartDate, tempEndDate: day.date });
			}
		}
	};

	const onHover = day => {
		dispatchEvent("hover", { hoverDate: day.date });
	};

	$: calendarDays = getCalendar({
		month,
		weekStartsOn: dayOffset(firstDayOfWeek),
		disabledDates,
		startDate: tempStartDate,
		hoverDate,
		minDate,
		maxDate,
		today,
		endDate: tempEndDate,
		singlePicker
	});
</script>

<style>
	.calendar {
		display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap;
		width: 280px;
	}
</style>

<div class="calendar">
	<slot />
	{#each calendarDays as day (day.date.toString())}
		<DayOfMonth
			{locale}
			{day}
			{weekGuides}
			{isoWeekNumbers}
			on:click={() => onClick(day)}
			on:mouseenter={() => onHover(day)} />
	{/each}
</div>
