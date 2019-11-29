<script>
  import { getCalendarWeeks, dayOffset } from "../utils";
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
    startDate: tempStartDate,
    hoverDate,
    minDate,
    maxDate,
    today,
    endDate: tempEndDate,
    singlePicker
  });

  $: padding = !weekGuides && !isoWeekNumbers && !weekNumbers ? 12 : 48;
</script>

<style>
  .rtl {
    direction: rtl;
  }
</style>

<div
  style={`width: ${pageWidth}px; padding: ${padding}px;`}
  class={rtl ? 'rtl' : ''}>
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
      {isoWeekNumbers}
      on:selection
      on:hover />
  {/each}
</div>
