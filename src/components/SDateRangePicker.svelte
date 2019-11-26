<script>
	/*
	 * <<< Component library name ideas >>>
	 * svelterial-ui
	 * sveterial-ui
	 * svelte-material UI
	 * svelte-mat-ui
	 */
	/**
	 * @todo Accessibility (keyboard controls, label, etc... compliance)
	 * @todo Button to open and close picker (maybe a prop to have it inline?)
	 * @todo Handle timezones (there are a few unknown unknowns right now)
	 * 			 It is probably going to be handled just fine via the `today` prop,
	 * 		   but i'd like to verify it works fine with times... Date objects use system time
	 * @todo Build out timePicker mode (24hr)
	 * @todo Multi-page calendar
	 * @todo locales (this might be fine if all pressure to add conversions is on the consumer)
	 * 			 e.g. passing in the locale and correct translations for their predefined ranges...
	 * @todo weekGuides
	 * @todo weekNumbers
	 * @todo isoWeekNumbers
	 * @todo min / maxDate
	 * @todo Month and year dropdowns
	 * @todo autoApply (currently a WIP)
	 * @todo TypeScript support -- is this even possible in SvelteJS?
	 * @todo TESTS TESTS TESTS
	 */

	/* <<< Imports >>> */
	import { createEventDispatcher } from "svelte";
	import { addMonths, endOfWeek, format, isBefore, isSameDay, startOfWeek, subMonths } from "date-fns";
	import { enUS } from "date-fns/locale";
	import { dayOffset, getWeek } from "./utils";
	import Calendar from "./Calendar.svelte";

	/* <<< Private variables >>> */
	const dispatchEvent = createEventDispatcher();
	const id = "s-date-range-picker";
	const weekStart = startOfWeek(new Date());
	const weekEnd = endOfWeek(new Date());

	let hoverDate = weekStart;
	let month = new Date();
	let tempEndDate = weekEnd;
	let tempStartDate = weekStart;

	/* <<< Props >>> */
	export let autoApply = false;
	export let dateFormat = "MMM dd, yyyy";
	// export let disabled = false;
	export let disabledDates = [];
	export let endDate = weekEnd;
	export let events = [];
	export let firstDayOfWeek = "sunday";
	export let hideOnCancel = true;
	export let hideOnApply = true;
	export let isoWeekNumbers = false;
	export let locale = enUS;
	export let maxDate = null;
	export let maxSpan = null;
	export let minDate = null;
	export let monthDropdown = true;
	export let monthFormat = "MMMM";
	// export let predefinedRanges = [];
	export let rtl = false;
	export let singlePicker = false;
	export let startDate = weekStart;
	// export let timePicker = false;
	// export let timePicker24Hour = true;
	// export let timePickerIncrement = 1;
	// export let timePickerSeconds = false;
	export let today = new Date();
	export let weekGuides = false;
	export let weekNumbers = false;
	export let yearDropdown = true;

	/* <<< Computed variables >>> */
	$: canApply = !isSameDay(tempStartDate, startDate) && !isSameDay(tempEndDate, endDate);
	/** @todo Account for the selection not being visible in the view (month) */
	$: canCancel = !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate);
	$: daysOfWeek = getWeek(new Date(), dayOffset(firstDayOfWeek, locale));
	$: startDateReadout = () => {
		if (!tempEndDate) {
			if (isBefore(hoverDate, tempStartDate)) {
				return hoverDate;
			}

			return tempStartDate;
		}

		return tempStartDate;
	};

	$: endDateReadout = () => {
		if (!tempEndDate) {
			if (isBefore(hoverDate, tempStartDate)) {
				return tempStartDate;
			}

			return hoverDate;
		}

		return tempEndDate;
	};

	/* <<< Custom Events >>> */
	const show = () => {
		dispatchEvent("show");
	};

	const hide = () => {
		dispatchEvent("hide");
	};

	const apply = () => {
		if (!tempEndDate && !singlePicker) {
			return;
		}

		// Update "state" of the component
		startDate = tempStartDate;
		endDate = tempEndDate;

		if (hideOnApply) {
			hide();
		}

		// Notify the consumer of SDateRangePicker
		dispatchEvent("apply", {
			startDate,
			endDate
		});
	};

	const cancel = () => {
		// Reset the temp state
		tempStartDate = startDate;
		tempEndDate = endDate;
		month = startDate;

		if (hideOnCancel) {
			hide();
		}

		// Notify the consumer of SDateRangePicker
		dispatchEvent("cancel", {
			startDate,
			endDate
		});
	};

	const onSelection = ({ detail }) => {
		// Update the temporary state with the new selection
		tempStartDate = detail.tempStartDate;
		tempEndDate = detail.tempEndDate;

		// Notify the consumer of SDateRangePicker
		dispatchEvent("selection", {
			startDate: tempStartDate,
			endDate: tempEndDate
		});

		if (autoApply) {
			apply();
		}
	};

	const onHover = ({ detail }) => {
		hoverDate = detail.hoverDate;
	};

	const previousMonth = () => {
		month = subMonths(month, 1);
	};

	const nextMonth = () => {
		month = addMonths(month, 1);
	};
</script>

<style>
	.week-date {
		width: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>

<div {id}>
	<div>{format(startDateReadout(), dateFormat)} to {format(endDateReadout(), dateFormat)}</div>
	<button type="button" on:click={previousMonth}>Previous</button>
	<span>{format(month, `${monthFormat}, yyyy`)}</span>
	<button type="button" on:click={nextMonth}>Next</button>
	<Calendar
		on:hover={onHover}
		on:selection={onSelection}
		{disabledDates}
		{events}
		{hoverDate}
		{firstDayOfWeek}
		{isoWeekNumbers}
		{locale}
		{maxDate}
		{maxSpan}
		{minDate}
		{month}
		{monthDropdown}
		{monthFormat}
		{rtl}
		{singlePicker}
		{tempEndDate}
		{tempStartDate}
		{today}
		{weekGuides}
		{weekNumbers}
		{yearDropdown}>
		{#each daysOfWeek as dayOfWeek (dayOfWeek.toString())}
			<div class="week-date">{format(dayOfWeek, 'eeeeee')}</div>
		{/each}
	</Calendar>

	<button
		type="button"
		aria-label="Cancel the current selection and revert to previous start and end dates"
		aria-controls={id}
		on:click={cancel}
		disabled={!canCancel}>
		Cancel
	</button>
	<button
		type="button"
		aria-label="Apply the current selection"
		aria-controls={id}
		on:click={apply}
		disabled={!canApply}>
		Apply
	</button>
</div>
