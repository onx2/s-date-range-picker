<script>
	import { format } from "date-fns"

	export let dateFormat
	export let disabledDates
	export let events
	export let firstDayOfWeek
	export let isoWeekNumbers
	export let locale
	export let maxDate
	export let maxSpan
	export let minDate
	export let monthDropdown
	export let monthFormat
	export let rtl
	export let tempEndDate
	export let tempStartDate
	export let today
	export let weekGuides
	export let weekNumbers
	export let yearDropdown
</script>

<div>calendar {tempStartDate} through {tempEndDate}</div>
