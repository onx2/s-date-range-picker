<script>
  import Week from "./Week.svelte";
  import DaysOfWeek from "./DaysOfWeek.svelte";
  import Controls from "./Controls.svelte";
  import { getCalendarWeeks, dayOffset } from "../utils";

  export let disabledDates;
  export let events;
  export let hasSelection;
  export let hoverDate;
  export let firstDayOfWeek;
  export let isoWeekNumbers;
  export let locale;
  export let maxDate;
  export let minDate;
  export let month;
  export let monthDropdown;
  export let monthFormat;
  export let monthIndicator;
  export let pageWidth;
  export let rtl;
  export let singlePicker;
  export let tempEndDate;
  export let tempStartDate;
  export let today;
  export let weekGuides;
  export let weekNumbers;
  export let yearDropdown;

  $: weeks = getCalendarWeeks({
    month,
    firstDayOfWeek,
    locale,
    events,
    disabledDates,
    tempStartDate,
    hoverDate,
    hasSelection,
    minDate,
    maxDate,
    today,
    tempEndDate,
    singlePicker
  });
</script>

<style>
  div {
    padding: 12px 48px;
  }
</style>

<div style={`width: ${pageWidth}px;`}>
  <Controls
    on:pageChange
    on:previousMonth
    on:nextMonth
    {locale}
    {month}
    {monthDropdown}
    {monthFormat}
    {maxDate}
    {minDate}
    {yearDropdown} />
  <DaysOfWeek {firstDayOfWeek} {locale} />
  {#each weeks as week}
    <Week
      on:selection
      on:hover
      {tempEndDate}
      {tempStartDate}
      {week}
      {singlePicker}
      {locale}
      {month}
      {monthIndicator}
      {rtl}
      {weekGuides}
      {weekNumbers}
      {isoWeekNumbers} />
  {/each}
</div>
