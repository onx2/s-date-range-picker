<script>
  /**
   * USED FOR DEVELOPMENT OF COMPONENT ONLY.
   *
   * Using a svelte wrapper component to manage state allows for svelte-style
   * reactivity, rather than using foobar.$on() and foobar.$set()
   */
  import { endOfWeek, startOfWeek } from "date-fns";
  import { enUS, arDZ } from "date-fns/locale";
  import SDateRangePicker from "./date-range-picker/SDateRangePicker.svelte";

  let startDate = startOfWeek(new Date());
  let endDate = endOfWeek(new Date());

  function onApply({ detail }) {
    startDate = detail.startDate;
    endDate = detail.endDate;
    console.log("apply", detail);
  }
</script>

<SDateRangePicker locale={enUS} {startDate} {endDate} on:apply={onApply} />
