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

	button:disabled {
		opacity: 0.55;
	}
</style>

<button on:click on:mouseenter disabled={day.isDisabled}>{format(day.date, 'd', { locale })}</button>
