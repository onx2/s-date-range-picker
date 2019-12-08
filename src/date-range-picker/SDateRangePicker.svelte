<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    addMonths,
    addYears,
    subYears,
    endOfWeek,
    endOfYear,
    isAfter,
    isBefore,
    isSameMinute,
    isSameSecond,
    isSameDay,
    isSameMonth,
    startOfWeek,
    startOfYear,
    subMonths
  } from 'date-fns'
  import { localeFormat, roundDown } from './utils'
  import Calendar from './components/Calendar.svelte'
  import TimePicker from './components/TimePicker.svelte'

  export let applyBtnText = 'Apply'
  export let btnClass = 's-picker-btn'
  export let cancelBtnText = 'Cancel'
  export let dateFormat = 'MMM dd, yyyy'
  export let disabledDates = []
  export let endDate = endOfWeek(new Date())
  export let events = []
  export let firstDayOfWeek = 'sunday'
  export let locale = undefined
  export let maxDate = addYears(endOfYear(new Date()), 10)
  export let minDate = subYears(startOfYear(new Date()), 10)
  export let minuteIncrement = 1
  export let monthDropdown = true
  export let monthFormat = 'MMMM'
  export let monthIndicator = true
  export let nextIcon = '▸'
  export let numPages = 2
  export let prevIcon = '◂'
  export let resetViewBtn = false
  export let resetViewBtnText = '↚'
  export let rtl = false
  export let secondIncrement = 1
  // export let selectClass = ''
  export let singlePicker = false
  export let startDate = startOfWeek(new Date())
  export let timePicker = false
  export let timePickerControls = false
  export let timePicker24Hour = true
  export let timePickerSeconds = false
  export let today = new Date()
  export let todayBtn = false
  export let todayBtnText = 'Today'
  export let weekGuides = false
  export let weekNumbers = false
  export let yearDropdown = true

  /** @todo Implement props/options */
  // export let disabled = false;
  // export let maxSpan = null;
  // export let predefinedRanges = [];

  let hasSelection = true
  let hoverDate = endDate
  $: tempEndDate = endDate
  $: tempStartDate = startDate

  const dispatchEvent = createEventDispatcher()

  // Used for the date-fns format abstraction, localeFormat
  /** @todo This might be better placed into a store. */
  window.__locale__ = locale

  $: canApply = () => {
    if (!hasSelection) {
      return false
    }

    if (timePicker) {
      if (timePickerSeconds) {
        return (
          !isSameSecond(tempStartDate, startDate) ||
          !isSameSecond(tempEndDate, endDate)
        )
      }

      return (
        !isSameMinute(tempStartDate, startDate) ||
        !isSameMinute(tempEndDate, endDate)
      )
    }

    return (
      !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate)
    )
  }
  $: canResetView = !isSameMonth(tempStartDate, months[0]) && tempEndDate
  $: months = [...Array(numPages)].map((_, i) => addMonths(today, i))
  $: startDateReadout = () => {
    if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
      return localeFormat(hoverDate, dateFormat)
    }

    return localeFormat(tempStartDate, dateFormat)
  }
  $: endDateReadout = () => {
    if (!hasSelection) {
      if (isBefore(hoverDate, tempStartDate)) {
        return localeFormat(tempStartDate, dateFormat)
      }

      return localeFormat(hoverDate, dateFormat)
    }

    return localeFormat(tempEndDate, dateFormat)
  }

  // Round and set the hover data temp start & end dates based on start & end date props
  onMount(() => {
    if (timePicker) {
      tempStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startDate.getHours(),
        roundDown(startDate.getMinutes(), minuteIncrement),
        roundDown(startDate.getSeconds(), secondIncrement)
      )

      tempEndDate = hoverDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endDate.getHours(),
        roundDown(endDate.getMinutes(), minuteIncrement),
        roundDown(endDate.getSeconds(), secondIncrement)
      )
    }
  })

  const apply = () => {
    if (!canApply()) {
      return
    }

    dispatchEvent('apply', {
      startDate: tempStartDate,
      endDate: tempEndDate
    })
  }

  const goToToday = () => {
    months = [...Array(numPages)].map((_, i) => addMonths(today, i))
  }

  const resetView = () => {
    const resetViewMonth = canApply() ? tempStartDate : startDate
    months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i))
  }

  const resetState = () => {
    tempStartDate = startDate
    tempEndDate = endDate
    hasSelection = true
  }

  const close = () => {
    resetState()
    resetView()
  }

  const cancel = () => {
    resetState()
    resetView()

    dispatchEvent('cancel', {
      startDate,
      endDate
    })
  }

  const onSelection = ({ detail }) => {
    const detailWithEndDateTime = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempEndDate.getHours(),
      tempEndDate.getMinutes(),
      tempEndDate.getSeconds()
    )

    const detailWithStartDateTime = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempStartDate.getHours(),
      tempStartDate.getMinutes(),
      tempStartDate.getSeconds()
    )

    if (singlePicker) {
      // Start and end dates are always the same on singlePicker
      tempStartDate = tempEndDate = detailWithEndDateTime
    } else if (hasSelection) {
      /**
       * In range mode, if there is currently a selection and the selection
       * event is fired the user must be selecting the start date.
       */
      tempStartDate = hoverDate = detailWithStartDateTime
      hasSelection = false
    } else {
      // In range mode, if there isn't a selection, the user must be selecting an end date
      // Sorting - Swap start and end dates when the end date is before the start date
      if (isBefore(detailWithEndDateTime, tempStartDate)) {
        if (isSameDay(detailWithEndDateTime, tempStartDate)) {
          tempEndDate = tempStartDate
          tempStartDate = detailWithEndDateTime
        } else {
          tempEndDate = new Date(
            tempStartDate.getFullYear(),
            tempStartDate.getMonth(),
            tempStartDate.getDate(),
            tempEndDate.getHours(),
            tempEndDate.getMinutes(),
            tempEndDate.getSeconds()
          )
          tempStartDate = detailWithStartDateTime
        }
      } else {
        tempEndDate = detailWithEndDateTime
      }

      hasSelection = true

      dispatchEvent('selection', {
        startDate: tempStartDate,
        endDate: tempEndDate
      })
    }
  }

  const onHover = ({ detail }) => {
    if (!hasSelection) {
      hoverDate = detail
    }
  }

  const onPrevMonth = () => {
    months = months.map(mo => subMonths(mo, 1))
  }

  const onNextMonth = () => {
    months = months.map(mo => addMonths(mo, 1))
  }

  const onPageChange = ({ detail: { incrementAmount } }) => {
    if (incrementAmount > 0) {
      months = months.map(mo => addMonths(mo, incrementAmount))
    } else {
      const absIncrementAmount = Math.abs(incrementAmount)
      months = months.map(mo => subMonths(mo, absIncrementAmount))
    }
  }

  const onStartTimeChange = ({ detail }) => {
    const newDate = new Date(
      tempStartDate.getFullYear(),
      tempStartDate.getMonth(),
      tempStartDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    )

    if (isAfter(newDate, tempEndDate)) {
      tempStartDate = tempEndDate
      tempEndDate = newDate
    } else {
      tempStartDate = newDate
    }
  }

  const onEndTimeChange = ({ detail }) => {
    const newDate = new Date(
      tempEndDate.getFullYear(),
      tempEndDate.getMonth(),
      tempEndDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    )

    if (isBefore(newDate, tempStartDate)) {
      tempEndDate = tempStartDate
      tempStartDate = newDate
    } else {
      tempEndDate = newDate
    }
  }
</script>

<style>
  .s-date-range-picker :global(.space-between) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .s-date-range-picker :global(small) {
    font-size: 0.68rem;
  }

  .s-date-range-picker :global(.space-center) {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .s-date-range-picker :global(.muted) {
    opacity: 0.4;
  }

  .s-date-range-picker :global(.row) {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  .s-date-range-picker :global(.cell) {
    width: 40px;
    height: 40px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .rtl {
    direction: rtl;
  }

  .actions-row {
    padding-top: 8px;
    justify-content: flex-end;
    display: flex;
  }
</style>

<form
  class={rtl ? 'rtl s-date-range-picker' : 's-date-range-picker'}
  on:submit|preventDefault={apply}>
  <div class="space-between">
    <label>{startDateReadout()} to {endDateReadout()}</label>
    <button
      aria-label="Close the date range picker"
      class={btnClass}
      disabled={!canApply()}
      on:click={close}
      type="close">
      &times;
    </button>
  </div>
  <div>
    <div class="grid">
      {#each months as month, index}
        <Calendar
          {disabledDates}
          {events}
          {firstDayOfWeek}
          {hasSelection}
          {hoverDate}
          {maxDate}
          {minDate}
          {month}
          {monthDropdown}
          {monthFormat}
          {monthIndicator}
          {nextIcon}
          pageNum={index}
          on:apply={apply}
          on:cancel={cancel}
          on:hover={onHover}
          on:nextMonth={onNextMonth}
          on:pageChange={onPageChange}
          on:prevMonth={onPrevMonth}
          on:selection={onSelection}
          {prevIcon}
          {rtl}
          {singlePicker}
          {tempEndDate}
          {tempStartDate}
          {today}
          {weekGuides}
          {weekNumbers}
          {yearDropdown} />
      {/each}
    </div>
    <div class="full-height-scroll" />
  </div>

  {#if timePicker}
    <div class="row">
      <TimePicker
        dateReference={tempStartDate}
        {minuteIncrement}
        on:timeChange={onStartTimeChange}
        {secondIncrement}
        {timePickerControls}
        {timePicker24Hour}
        {timePickerSeconds} />

      {#if !singlePicker && numPages >= 2}
        <TimePicker
          dateReference={tempEndDate}
          {minuteIncrement}
          on:timeChange={onEndTimeChange}
          {secondIncrement}
          {timePickerControls}
          {timePicker24Hour}
          {timePickerSeconds} />
      {/if}
    </div>
    {#if !singlePicker && numPages === 1}
      <div class="row">
        <TimePicker
          dateReference={tempEndDate}
          {minuteIncrement}
          on:timeChange={onEndTimeChange}
          {secondIncrement}
          {timePickerControls}
          {timePicker24Hour}
          {timePickerSeconds} />
      </div>
    {/if}
  {/if}
  <div class="actions-row">
    {#if todayBtn}
      <button
        aria-disabled={isSameMonth(today, months[0])}
        aria-label="Show the today's month"
        class={btnClass}
        disabled={isSameMonth(today, months[0])}
        on:click={goToToday}
        type="button">
        {todayBtnText}
      </button>
    {/if}
    {#if resetViewBtn}
      <button
        aria-disabled={!canResetView}
        aria-label="Show the current selection's start month"
        class={btnClass}
        disabled={!canResetView}
        on:click={resetView}
        type="button">
        {@html resetViewBtnText}
      </button>
    {/if}
    <button
      aria-disabled={!canApply()}
      aria-label="Cancel the current selection and revert to previous start and
      end dates"
      class={btnClass}
      disabled={!canApply()}
      on:click={cancel}
      type="button">
      {cancelBtnText}
    </button>

    <button
      aria-disabled={!canApply()}
      aria-label="Apply the current selection"
      class={btnClass}
      disabled={!canApply()}
      on:click={apply}
      type="submit">
      {applyBtnText}
    </button>
  </div>
</form>
