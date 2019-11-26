<script>
	import { SDateRangePicker } from "./components/components.module.js";
	const onEvt = evt => {
		console.log(evt);
	};
</script>

<SDateRangePicker on:apply={onEvt} on:cancel={onEvt} on:show={onEvt} on:hide={onEvt} on:selection={onEvt} />
