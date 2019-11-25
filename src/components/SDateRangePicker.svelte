<script>
	// Component library name ideas:
	// svelterial-ui
	// sveterial-ui
	// svelte-material UI
	// svelte-mat-ui

	// Imports
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		endOfWeek,
		format,
		formatRFC3339,
		isValid,
		parseISO,
		startOfWeek,
	} from 'date-fns';
	import SCalendar from './SCalendar.svelte';

	const dispatchEvent = createEventDispatcher();

	// Props
	export let autoApply = false;
	export let id = 's-date-range-picker';
	export let dateFormat = 'yyyy-MM-dd';
	export let disabled = false;
	export let disabledDates = [];
	export let endDate = endOfWeek(new Date());
	export let events = [];
	export let firstDayOfWeek = 'sunday';
	export let isoWeekNumbers = false;
	export let locale = null;
	export let maxDate = null;
	export let maxSpan = null;
	export let minDate = null;
	export let monthDropdown = true;
	export let monthFormat = 'MMMM';
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

	// Startup
	onMount(() => {
		console.log(formatRFC3339(new Date()));

		firstDayOfWeek = firstDayOfWeek.toLocaleLowerCase();
	});

	// Custom Events
	/**
	 * @param {string} eventName
	 * @param {object} payload
	 *
	 * @returns {undefined}
	 */
	const dispatchCustomEvent = (eventName, payload) => {
		dispatch(eventName, {
			bubbles: true,
			cancelable: false,
			detail: payload,
		});
	};

	const beforeShow = () => {
		const payload = {};

		dispatchCustomEvent('beforeShow', payload);
	};

	const show = () => {
		const payload = {};

		dispatchCustomEvent('show', payload);
	};

	const beforeHide = () => {
		const payload = {};

		dispatchCustomEvent('beforeHide', payload);
	};

	const hide = () => {
		const payload = {};

		dispatchCustomEvent('hide', payload);
	};

	const beforeApply = () => {
		const payload = {};

		dispatchCustomEvent('beforeApply', payload);
	};

	const apply = () => {
		const payload = {};

		dispatchCustomEvent('apply', payload);
	};

	const beforeCancel = () => {
		const payload = {};

		dispatchCustomEvent('beforeCancel', payload);
	};

	const cancel = () => {
		const payload = {};

		dispatchCustomEvent('cancel', payload);
	};
</script>

<div {id}>
	Hello world!
	<SCalendar
		{dateFormat}
		{disabledDates}
		{endDate}
		{events}
		{firstDayOfWeek}
		{isoWeekNumbers}
		{locale}
		{maxDate}
		{maxSpan}
		{minDate}
		{monthDropdown}
		{monthFormat}
		{rtl}
		{startDate}
		{today}
		{weekGuides}
		{weekNumbers}
		{yearDropdown} />
</div>
