<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

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
  import { localeFormat, passiveSupported, roundDown } from './utils'
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
  export let prevIcon = '◂'
  export let resetViewBtn = false
  export let resetViewBtnText = '↚'
  export let rtl = false
  export let secondIncrement = 1
  export let selectClass = 's-picker-select'
  export let singlePicker = false
  export let startDate = startOfWeek(new Date())
  export let timePicker = false
  export let timePickerControls = false
  export let timePicker24Hour = true
  export let timePickerSeconds = false
  export let today = new Date()
  export let todayBtn = false
  export let todayBtnText = 'Today'
  export let twoPages = false
  export let weekGuides = false
  export let weekNumbers = false
  export let yearDropdown = true

  /** @todo Implement props/options */
  // export let maxSpan = null;
  // export let predefinedRanges = [];

  let hasSelection = true
  let calendarRef
  let numPages = twoPages ? 2 : 1

  const dispatchEvent = createEventDispatcher()

  // Used for the date-fns format abstraction, localeFormat
  /** @todo This might be better placed into a store. */
  window.__locale__ = locale

  $: tempEndDate = endDate
  $: tempStartDate = startDate
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
    if (!hasSelection && isBefore(tempEndDate, tempStartDate)) {
      return localeFormat(tempEndDate, dateFormat)
    }

    return localeFormat(tempStartDate, dateFormat)
  }
  $: endDateReadout = () => {
    if (!hasSelection) {
      if (isBefore(tempEndDate, tempStartDate)) {
        return localeFormat(tempStartDate, dateFormat)
      }

      return localeFormat(tempEndDate, dateFormat)
    }

    return localeFormat(tempEndDate, dateFormat)
  }
  $: pickerWidth = calendarRef ? numPages * calendarRef.offsetWidth : 0

  // Round and set the hover data temp start & end dates based on start & end date props
  onMount(() => {
    calendarRef = document.querySelector('.s-calendar')

    if (twoPages) {
      onResize() // Initial sizing
      window.addEventListener(
        'resize',
        onResize,
        passiveSupported ? { passive: true } : false
      )
    }

    if (timePicker) {
      tempStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startDate.getHours(),
        roundDown(startDate.getMinutes(), minuteIncrement),
        roundDown(startDate.getSeconds(), secondIncrement)
      )

      tempEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endDate.getHours(),
        roundDown(endDate.getMinutes(), minuteIncrement),
        roundDown(endDate.getSeconds(), secondIncrement)
      )
    }
  })

  onDestroy(() => {
    if (twoPages) {
      window.removeEventListener('resize', onResize)
    }
  })

  const onResize = () => {
    numPages = document.body.scrollWidth <= 2 * calendarRef.offsetWidth ? 1 : 2
  }

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

  const cancel = () => {
    resetState()
    resetView()

    dispatchEvent('cancel', {
      startDate,
      endDate
    })
  }

  const onSelection = ({ detail }) => {
    /**
     * @todo Take into account the min and max dates
     * when the new end date is after max date, set it to max date
     * when the new start date is before min date, set it to min date
     */
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
      // In range mode, if there is currently a selection and the selection
      // event is fired the user must be selecting the start date.
      tempStartDate = isBefore(detailWithStartDateTime, minDate) ? minDate : detailWithStartDateTime
      tempEndDate = isAfter(detailWithEndDateTime, maxDate) ? maxDate : detailWithEndDateTime
      hasSelection = false
    } else {
      // In range mode, if there isn't a selection, the user must be selecting an end date
      // Sorting - Swap start and end dates when the end date is before the start date
      if (isBefore(detailWithEndDateTime, tempStartDate)) {
        if (isSameDay(detailWithEndDateTime, tempStartDate)) {
          tempEndDate = isAfter(tempStartDate, maxDate) ? maxDate : tempStartDate
          tempStartDate = isBefore(detailWithEndDateTime, minDate) ? minDate : detailWithEndDateTime
        } else {
          const newEndDate = new Date(
            tempStartDate.getFullYear(),
            tempStartDate.getMonth(),
            tempStartDate.getDate(),
            tempEndDate.getHours(),
            tempEndDate.getMinutes(),
            tempEndDate.getSeconds()
          )

          tempEndDate = isAfter(newEndDate, maxDate) ? maxDate : newEndDate
          tempStartDate = isBefore(detailWithStartDateTime, minDate) ? minDate : detailWithStartDateTime
        }
      } else {
        tempEndDate = isAfter(detailWithEndDateTime, maxDate) ? maxDate : detailWithEndDateTime
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
      // Only update the year, month, and date when hovering over new dates.
      tempEndDate = new Date(
        detail.getFullYear(),
        detail.getMonth(),
        detail.getDate(),
        tempEndDate.getHours(),
        tempEndDate.getMinutes(),
        tempEndDate.getSeconds()
      )
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

  $: lang = locale
    ? locale.code
    : navigator.languages && navigator.languages.length
    ? navigator.languages[0]
    : navigator.language
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

  /*
    https://webaim.org/resources/contrastchecker/
    WCAG AAA Compliant: #595959 on #FFFFFF background
    WCAG AA Compliant: #757575 on #FFFFFF background
  */
  .s-date-range-picker :global(:not(:disabled).muted) {
    color: #757575;
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

  .s-grid {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .actions-row {
    padding-top: 8px;
    justify-content: flex-end;
    display: flex;
  }

  /*
    Swap border radius of the start and end dates when in rtl
  */
  .s-date-range-picker[dir='rtl'] :global(.end-date::after) {
    border-radius: 100% 0 0 100%;
  }

  .s-date-range-picker[dir='rtl'] :global(.start-date::after) {
    border-radius: 0 100% 100% 0;
  }
</style>

<form
  {lang}
  dir={rtl ? 'rtl' : 'ltr'}
  style={`width: ${pickerWidth}px`}
  class="s-date-range-picker"
  on:submit|preventDefault={apply}>
  <label>{startDateReadout()} to {endDateReadout()}</label>
  <div class="s-grid">
    {#each months as month, index}
      <Calendar
        {btnClass}
        {disabledDates}
        {events}
        {firstDayOfWeek}
        {hasSelection}
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
        {singlePicker}
        {selectClass}
        {tempEndDate}
        {tempStartDate}
        {today}
        {weekGuides}
        {weekNumbers}
        {yearDropdown} />
    {/each}
  </div>

  {#if timePicker}
    <div class="row" style="flex-wrap: wrap;">
      <TimePicker
        {btnClass}
        dateReference={tempStartDate}
        {maxDate}
        {minDate}
        {minuteIncrement}
        on:timeChange={onStartTimeChange}
        {secondIncrement}
        {selectClass}
        {timePickerControls}
        {timePicker24Hour}
        {timePickerSeconds} />

      {#if !singlePicker}
        <TimePicker
          {btnClass}
          dateReference={tempEndDate}
          {maxDate}
          {minDate}
          {minuteIncrement}
          on:timeChange={onEndTimeChange}
          {secondIncrement}
          {selectClass}
          {timePickerControls}
          {timePicker24Hour}
          {timePickerSeconds} />
      {/if}
    </div>
  {/if}
  <div class="actions-row">
    {#if todayBtn}
      <button
        aria-disabled={isSameMonth(today, months[0])}
        aria-label="Show the today's month"
        class={btnClass}
        disabled={isSameMonth(today, months[0])}
        on:click={goToToday}
        title="Show the today's month"
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
        title="Show the current selection's start month"
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
      title="Cancel the current selection and revert to previous start and end
      dates"
      type="button">
      {cancelBtnText}
    </button>

    <button
      aria-disabled={!canApply()}
      aria-label="Apply the current selection"
      class={btnClass}
      disabled={!canApply()}
      on:click={apply}
      title="Apply the current selection"
      type="submit">
      {applyBtnText}
    </button>
  </div>
</form>
