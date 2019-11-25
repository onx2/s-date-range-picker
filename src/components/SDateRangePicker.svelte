<script>
	/*
	 * <<< Component library name ideas >>>
	 * svelterial-ui
	 * sveterial-ui
	 * svelte-material UI
	 * svelte-mat-ui
	 */

	/* <<< Imports >>> */
	import { createEventDispatcher, onMount } from "svelte";
	import {
		addDays,
		addMonths,
		endOfWeek,
		format,
		isSameDay,
		isValid,
		parseISO,
		startOfWeek,
		subMonths
	} from "date-fns";
	import Calendar from "./Calendar.svelte";

	/* <<< Private variables >>> */
	const dispatchEvent = createEventDispatcher();
	const id = "s-date-range-picker";
	let month = new Date();
	let tempEndDate = endOfWeek(new Date());
	let tempStartDate = startOfWeek(new Date());

	/* <<< Props >>> */
	export let autoApply = false;
	export let dateFormat = "yyyy-MM-dd";
	export let disabled = false;
	export let disabledDates = [];
	export let endDate = endOfWeek(new Date());
	export let events = [];
	export let firstDayOfWeek = "sunday";
	export let isoWeekNumbers = false;
	export let locale = null;
	export let maxDate = null;
	export let maxSpan = null;
	export let minDate = null;
	export let monthDropdown = true;
	export let monthFormat = "MMMM";
	export let predefinedRanges = [];
	export let rtl = false;
	export let singlePicker = false;
	export let startDate = startOfWeek(new Date());
	export let timePicker = false;
	export let timePicker24Hour = true;
	export let timePickerIncrement = 1;
	export let timePickerSeconds = false;
	export let today = new Date();
	export let weekGuides = false;
	export let weekNumbers = false;
	export let yearDropdown = true;

	$: canApply = () => !isSameDay(tempStartDate, startDate) && !isSameDay(tempEndDate, endDate);
	$: canCancel = () => !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate);

	/* <<< Startup >>> */
	onMount(() => {
		// Always use lowercase (increases the performance of the dayOffset() function)
		firstDayOfWeek = firstDayOfWeek.toLocaleLowerCase();
	});

	/* <<< Custom Events >>> */
	const show = () => {
		dispatchEvent("show");
	};

	const hide = () => {
		dispatchEvent("hide");
	};

	const apply = () => {
		/**
		 * When autoApply is true, every onSelection event fires apply()
		 * but the enDate is undefined and the singlePicker prop is false
		 * apply() shouldn't be called.
		 *
		 * apply() must output a startDate and endDate.
		 */
		if (!tempEndDate) {
			return;
		}

		// Update "state" of the component
		startDate = tempStartDate;
		endDate = tempEndDate;

		// Notify the consumer of SDateRangePicker
		dispatchEvent("change", {
			startDate,
			endDate
		});
	};

	const cancel = () => {
		// Reset the temp state
		tempStartDate = startDate;
		tempEndDate = endDate;

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

		console.log("onSelection", detail);
		// Notify the consumer of SDateRangePicker
		dispatchEvent("selection", {
			startDate: tempStartDate,
			endDate: tempEndDate
		});

		if (autoApply) {
			apply();
		}
	};

	const onHover = ({ detail: { hoverDate } }) => {
		console.log("SDateRangePicker hover", hoverDate);
	};

	const previousMonth = () => {
		console.log("previousMonth", format(month, "MMM"));
		month = subMonths(month, 1);
		console.log("previousMonth", format(month, "MMM"));
	};

	const nextMonth = () => {
		console.log("nextMonth", format(month, "MMM"));
		month = addMonths(month, 1);
		console.log("nextMonth", format(month, "MMM"));
	};
</script>

<div {id}>
	<button type="button" on:click={previousMonth}>Previous</button>
	<span>{format(month, `${monthFormat}, yyyy`)}</span>
	<button type="button" on:click={nextMonth}>Next</button>
	<Calendar
		on:hover={onHover}
		on:selection={onSelection}
		{dateFormat}
		{disabledDates}
		{events}
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
		{yearDropdown} />

	<button
		type="button"
		aria-label="Cancel the current selection and revert to previous start and end dates"
		aria-controls={id}
		on:click={cancel}
		disabled={!canCancel()}>
		Cancel
	</button>
	<button
		type="button"
		aria-label="Apply the current selection"
		aria-controls={id}
		on:click={apply}
		disabled={!canApply()}>
		Apply
	</button>
</div>
