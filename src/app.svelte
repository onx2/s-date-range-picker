<script>
  /**
   * USED FOR DEVELOPMENT OF COMPONENT ONLY.
   *
   * Using a svelte wrapper component to manage state allows for svelte-style
   * reactivity, rather than using foobar.$on() and foobar.$set()
   */
  import { addDays } from "date-fns";
  import SDateRangePicker from "./date-range-picker/s-date-range-picker.svelte";

  let startDate = new Date();
  let endDate = addDays(new Date(), 7);

  function onApply({ detail }) {
    startDate = detail.startDate;
    endDate = detail.endDate;
    console.log("apply", detail);
  }
</script>

<SDateRangePicker numPages={4} {startDate} {endDate} on:apply={onApply} />
