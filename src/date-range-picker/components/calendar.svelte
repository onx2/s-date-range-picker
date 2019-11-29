<script>
  import { getCalendarWeeks, dayOffset } from "../utils/index";
  import Week from "./week.svelte";
  import DaysOfWeek from "./days-of-week.svelte";
  import Controls from "./controls.svelte";

  export let disabledDates;
  export let events;
  export let hoverDate;
  export let firstDayOfWeek;
  export let isoWeekNumbers;
  export let locale;
  export let maxDate;
  export let minDate;
  export let month;
  export let monthFormat;
  export let monthIndicator;
  export let singlePicker;
  export let tempEndDate;
  export let tempStartDate;
  export let today;
  export let weekGuides;
  export let weekNumbers;

  $: weeks = getCalendarWeeks({
    month,
    firstDayOfWeek,
    locale,
    events,
    disabledDates,
    startDate: tempStartDate,
    hoverDate,
    minDate,
    maxDate,
    today,
    endDate: tempEndDate,
    singlePicker
  });
</script>

<style>
  div {
    width: 280px;
    padding: 48px;
  }
</style>

<div>
  <Controls
    on:pageChange
    on:previousMonth
    on:nextMonth
    {locale}
    {month}
    {monthFormat}
    {maxDate}
    {minDate} />
  <DaysOfWeek {firstDayOfWeek} {locale} />
  {#each weeks as week}
    <Week
      {tempEndDate}
      {tempStartDate}
      {week}
      {singlePicker}
      {locale}
      {month}
      {monthIndicator}
      {weekGuides}
      {weekNumbers}
      {isoWeekNumbers}
      on:selection
      on:hover />
  {/each}
</div>
