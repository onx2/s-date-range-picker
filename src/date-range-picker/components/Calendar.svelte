<script>
  import Controls from './Controls.svelte'
  import DaysOfWeek from './DaysOfWeek.svelte'
  import Week from './Week.svelte'
  import { getCalendarWeeks } from '../utils'

  export let btnClass
  export let disabledDates
  export let events
  export let firstDayOfWeek
  export let hasSelection
  export let hoverDate
  export let maxDate
  export let minDate
  export let month
  export let monthDropdown
  export let monthFormat
  export let monthIndicator
  export let nextIcon
  export let pageNum
  export let prevIcon
  export let rtl
  export let singlePicker
  export let selectClass
  export let tempEndDate
  export let tempStartDate
  export let today
  export let weekGuides
  export let weekNumbers
  export let yearDropdown

  $: weeks = getCalendarWeeks({
    disabledDates,
    events,
    firstDayOfWeek,
    hasSelection,
    hoverDate,
    maxDate,
    minDate,
    month,
    singlePicker,
    tempEndDate,
    tempStartDate,
    today
  })
</script>

<div class="s-calendar">
  <Controls
    {btnClass}
    {maxDate}
    {minDate}
    {month}
    {monthDropdown}
    {monthFormat}
    {nextIcon}
    on:pageChange
    on:prevMonth
    on:nextMonth
    {pageNum}
    {prevIcon}
    {selectClass}
    {yearDropdown} />
  <div role="grid">
    <DaysOfWeek {weekGuides} {weekNumbers} {firstDayOfWeek} />
    {#each weeks as week}
      <Week
        {month}
        {monthIndicator}
        on:apply
        on:cancel
        on:hover
        on:nextMonth
        on:prevMonth
        on:selection
        {rtl}
        {week}
        {weekGuides}
        {weekNumbers} />
    {/each}
  </div>
</div>
