<script>
	import { createEventDispatcher } from "svelte";
	import { format } from "date-fns";
	import { dayOffset, getCalendar, getDayMetaData } from "./utils";
	import DayOfMonth from "./DayOfMonth.svelte";

	export let dateFormat;
	export let disabledDates;
	export let events;
	export let firstDayOfWeek;
	export let isoWeekNumbers;
	export let locale;
	export let maxDate;
	export let maxSpan;
	export let minDate;
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
	let hoverDate = null;
	const dispatchEvent = new createEventDispatcher();

	// This should be a prop to handle
	const month = new Date();
	const calendarDays = getCalendar(month, dayOffset(firstDayOfWeek), {
		startDate: tempStartDate,
		hoverDate,
		minDate,
		maxDate,
		today,
		endDate: tempEndDate,
		singlePicker
	});

	const onClick = day => {
		console.log("onClick", day);
		// todo create a selection object
		// dispatchEvent("selection", { data: day.date });
	};

	function onHover(day) {
		hoverDate = day.date;
		dispatchEvent("hover", { hoverDate });
	}
</script>

<style>
	div.calendar {
		display: flex;
		justify-content: space-evenly;
		flex-wrap: wrap;
		width: 280px;
	}
</style>

<div>{tempStartDate} - {tempEndDate}</div>

<div class="calendar">
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
