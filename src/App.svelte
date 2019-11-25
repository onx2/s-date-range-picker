<script>
	import { SDateRangePicker } from "./components/components.module.js"
	const onChange = evt => {
		console.log(evt)
	}
</script>

<style>

</style>

<SDateRangePicker on:change={onChange} />
