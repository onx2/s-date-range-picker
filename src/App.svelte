<script>
  /**
   * USED FOR DEVELOPMENT OF COMPONENT ONLY.
   *
   * Using a svelte wrapper component to manage state allows for svelte-style
   * reactivity, rather than using foobar.$on() and foobar.$set()
   */
  import { endOfWeek, startOfWeek } from "date-fns";
  import SDateRangePicker from "./date-range-picker/SDateRangePicker.svelte";

  let startDate = startOfWeek(new Date());
  let endDate = endOfWeek(new Date());
  let rtl = false;

  function onApply({ detail }) {
    startDate = detail.startDate;
    endDate = detail.endDate;
    console.log("apply", detail);
  }
</script>

<SDateRangePicker
  numPages={2}
  weekGuides={true}
  weekNumbers={true}
  isoWeekNumbers={true}
  {rtl}
  {startDate}
  {endDate}
  on:apply={onApply} />
