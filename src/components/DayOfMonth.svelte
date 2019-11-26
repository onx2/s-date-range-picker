<script>
	import { format, isSameMonth } from "date-fns";

	export let locale;
	export let day;
	export let weekGuides;
	export let isoWeekNumbers
</script>

<style>
	div {
		width: 40px;
		height: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	div.disabled {
		cursor: not-allowed;
	}
	button {
		cursor: inherit;
		width: 40px;
		height: 40px;
		border-radius: 20px;
		border: 0;
		outline: 0;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
	}
	.selectable {
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.within-selection {
		color: lightgreen;
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
	.start-date > button,
	.end-date > button {
		color: white;
		background-color: green;
	}
	.today button {
		text-decoration: underline;
	}
</style>

<div
	class:disabled={day.isDisabled}
	class:today={day.isToday}
	class:weekend={day.isWeekend}
	class:start-date={day.isStartDate}
	class:end-date={day.isEndDate}
	class:within-selection={day.isWithinSelection}
	class:selectable={!day.isLastMonth && !day.isNextMonth && !day.isDisabled}>
	<button
		aria-label={format(day.date, 'MMMM dd, yyyy', { locale })}
		on:click
		on:mouseenter
		on:focus
		disabled={day.isDisabled}>
		{format(day.date, 'd', { locale })}
	</button>
</div>
