<script>
  import { createEventDispatcher } from "svelte"
  import { isSameDay } from "date-fns"
  import Controls from "./Controls.svelte"
  import DaysOfWeek from "./DaysOfWeek.svelte"
  import Week from "./Week.svelte"
  import { getCalendarWeeks, getTouchTarget } from "../utils"

  export let btnClass
  export let disabledDates
  export let events
  export let firstDayOfWeek
  export let hasSelection
  export let maxDate
  export let minDate
  export let month
  export let monthDropdown
  export let monthFormat
  export let monthIndicator
  export let nextIcon
  export let pageNum
  export let prevIcon
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
    maxDate,
    minDate,
    month,
    singlePicker,
    tempEndDate,
    tempStartDate,
    today
  })

  const dispatchEvent = createEventDispatcher()

  const onTouchmove = e => {
    const target = getTouchTarget(e)
    if ("data-date" in target.attributes && !target.disabled) {
      const valueArray = target.attributes["data-date"].value.split("-")
      const newDate = new Date(
        valueArray[0],
        parseInt(valueArray[1]) - 1,
        valueArray[2]
      )
      // Prevent unnecessary updates
      if (!isSameDay(newDate, tempEndDate)) {
        dispatchEvent("hover", newDate)
      }
    }
  }

  const onTouchStart = e => {
    // e.preventDefault() is used to prevent mouse events from firing
    // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
    e.preventDefault()
    if ("data-date" in e.target.attributes && !e.target.disabled) {
      const valueArray = e.target.attributes["data-date"].value.split("-")
      dispatchEvent(
        "selection",
        new Date(valueArray[0], parseInt(valueArray[1]) - 1, valueArray[2])
      )
    }
  }

  const onTouchEnd = e => {
    // e.preventDefault() is used to prevent mouse events from firing
    // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
    e.preventDefault()
    const target = getTouchTarget(e)
    if ("data-date" in target.attributes && !target.disabled) {
      const valueArray = target.attributes["data-date"].value.split("-")
      const newDate = new Date(
        valueArray[0],
        parseInt(valueArray[1]) - 1,
        valueArray[2]
      )

      if (!isSameDay(newDate, tempStartDate) && !hasSelection) {
        dispatchEvent("selection", newDate)
      }
    }
  }
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
  <div
    role="grid"
    on:touchmove|passive={onTouchmove}
    on:touchstart={onTouchStart}
    on:touchend={onTouchEnd}>
    <DaysOfWeek {weekGuides} {weekNumbers} {firstDayOfWeek} />
    {#each weeks as week}
      <Week
        {monthIndicator}
        on:apply
        on:cancel
        on:hover
        on:nextMonth
        on:prevMonth
        on:selection
        {week}
        {weekGuides}
        {weekNumbers} />
    {/each}
  </div>
</div>
