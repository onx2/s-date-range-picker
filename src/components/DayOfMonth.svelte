<script>
	import { format } from "date-fns";

	export let locale;
	export let day;
	export let weekGuides;
	export let isoWeekNumbers;
</script>

<style>
	button {
		width: 40px;
		height: 40px;
		border: 0;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
	}
	button > div {
		width: 40px;
		height: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 20px;
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.selectable {
		cursor: pointer;
	}
	.within-selection {
		color: green;
		background-color: rgba(0, 255, 0, 0.2);
	}
	.within-selection.end-date {
		border-top-right-radius: 20px;
		border-bottom-right-radius: 20px;
	}
	.within-selection.start-date {
		border-top-left-radius: 20px;
		border-bottom-left-radius: 20px;
	}
	.weekend {
		color: blue;
	}
	.start-date > div,
	.end-date > div {
		color: white;
		background-color: darkgreen;
	}
	.today {
		color: red;
	}
</style>

<button
	aria-label={format(day.date, 'MMMM dd, yyyy', { locale })}
	class:today={day.isToday}
	class:weekend={day.isWeekend}
	class:start-date={day.isStartDate}
	class:end-date={day.isEndDate}
	class:within-selection={day.isWithinSelection}
	class:selectable={!day.isLastMonth && !day.isNextMonth && !day.isDisabled}
	on:click
	on:mouseenter
	disabled={day.isDisabled}>
	<div>{format(day.date, 'd', { locale })}</div>
</button>
