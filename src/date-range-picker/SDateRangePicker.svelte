<script>
  import { createEventDispatcher, onMount } from "svelte";
  import {
    addMonths,
    addYears,
    subYears,
    differenceInCalendarMonths,
    endOfWeek,
    format,
    isAfter,
    isBefore,
    isSameMinute,
    isSameSecond,
    isSameDay,
    isSameMonth,
    startOfWeek,
    subMonths
  } from "date-fns";
  import { roundDown, localeFormat } from "./utils";
  import Calendar from "./components/Calendar.svelte";
  import TimePicker from "./components/TimePicker.svelte";

  export let autoApply = false;
  export let dateFormat = "MMM dd, yyyy";
  export let monthIndicator = true;
  // export let disabled = false;
  export let disabledDates = [];
  export let endDate = endOfWeek(new Date());
  export let events = [];
  export let firstDayOfWeek = "sunday";
  // export let hideOnCancel = true;
  // export let hideOnApply = true;
  export let isoWeekNumbers = false;
  export let locale;
  export let maxDate = addYears(new Date(), 10);
  // export let maxSpan = null;
  export let minDate = subYears(new Date(), 10);
  export let monthDropdown = false;
  export let monthFormat = "MMMM";
  export let numPages = 1;
  // export let predefinedRanges = [];
  export let rtl = false;
  export let singlePicker = false;
  export let startDate = startOfWeek(new Date());
  export let timePicker = false;
  export let timePicker24Hour = true;
  export let minuteIncrement = 1;
  export let secondIncrement = 1;
  export let timePickerSeconds = false;
  export let prevIcon = "&#9666;";
  export let nextIcon = "&#9656;";
  export let today = new Date();
  export let weekGuides = false;
  export let weekNumbers = false;
  export let yearDropdown = false;
  export let applyBtnText = "Apply";
  export let cancelBtnText = "Cancel";
  export let todayBtnText = "Today";
  export let todayBtn = false;
  export let resetViewBtnText = "&#8602;";
  export let resetViewBtn = false;
  export let id = `s-date-range-picker-${Math.random()}`;

  let hoverDate = endDate;
  let tempEndDate = endDate;
  let tempStartDate = startDate;
  let hasSelection = true;

  const dispatchEvent = createEventDispatcher();
  const cellWidth = 44;
  const maxCalsPerPage = 2;
  const pageWidth = cellWidth * 7;
  const pageWidthWithPadding = pageWidth + 96;

  // Used for the date-fns format abstraction, localeFormat
  window.__locale__ = locale;

  $: canApply = function() {
    if (!hasSelection) {
      return false;
    }

    if (timePicker) {
      if (timePickerSeconds) {
        return (
          !isSameSecond(tempStartDate, startDate) ||
          !isSameSecond(tempEndDate, endDate)
        );
      }

      return (
        !isSameMinute(tempStartDate, startDate) ||
        !isSameMinute(tempEndDate, endDate)
      );
    }

    return (
      !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate)
    );
  };

  $: canResetView = !isSameMonth(tempStartDate, months[0]) && tempEndDate;
  $: maxWidth =
    pickerWidth >= maxCalsPerPage * pageWidth
      ? maxCalsPerPage * pageWidthWithPadding
      : pickerWidth;
  $: months = [...Array(numPages)].map((_, i) => addMonths(today, i));
  $: pickerWidth = numPages * pageWidthWithPadding;
  $: startDateReadout = function() {
    if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
      return localeFormat(hoverDate, dateFormat);
    }

    return localeFormat(tempStartDate, dateFormat);
  };
  $: endDateReadout = function() {
    if (!hasSelection) {
      if (isBefore(hoverDate, tempStartDate)) {
        return localeFormat(tempStartDate, dateFormat);
      }

      return localeFormat(hoverDate, dateFormat);
    }

    return localeFormat(tempEndDate, dateFormat);
  };

  // Round and set the hover data temp start & end dates based on start & end date props
  onMount(function() {
    if (timePicker) {
      tempStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startDate.getHours(),
        roundDown(startDate.getMinutes(), minuteIncrement),
        roundDown(startDate.getSeconds(), secondIncrement)
      );

      tempEndDate = hoverDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endDate.getHours(),
        roundDown(endDate.getMinutes(), minuteIncrement),
        roundDown(endDate.getSeconds(), secondIncrement)
      );
    }
  });

  // function show() {
  //   dispatchEvent("show");
  // }

  // function hide() {
  //   dispatchEvent("hide");
  // }

  function apply() {
    if (!canApply()) {
      return;
    }
    // if (hideOnApply) {
    //   hide();
    // }

    dispatchEvent("apply", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });
  }

  function goToToday() {
    months = [...Array(numPages)].map((_, i) => addMonths(new Date(), i));
  }

  function resetView() {
    const resetViewMonth = canApply() ? tempStartDate : startDate;
    months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i));
  }

  function resetState() {
    tempStartDate = startDate;
    tempEndDate = endDate;
    hasSelection = true;
  }

  function close() {
    resetState();
    resetView();
    // hide();
  }

  function cancel() {
    resetState();
    resetView();

    // if (hideOnCancel) {
    //   hide();
    // }

    dispatchEvent("cancel", {
      startDate,
      endDate
    });
  }

  function onSelection({ detail }) {
    const newEndDate = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempEndDate.getHours(),
      tempEndDate.getMinutes(),
      tempEndDate.getSeconds()
    );

    if (singlePicker) {
      // Start and end dates are always the same on singlePicker
      tempStartDate = tempEndDate = newEndDate;
    } else if (hasSelection) {
      // In range mode, if there is currently a selection and the selection
      // event is fired the user must be selecting the startDate
      tempStartDate = new Date(
        detail.getFullYear(),
        detail.getMonth(),
        detail.getDate(),
        tempStartDate.getHours(),
        tempStartDate.getMinutes(),
        tempStartDate.getSeconds()
      );
      hasSelection = false;
    } else {
      // In range mode, if there isn't a selection, the user must be selecting an endDate
      // Update the start and end dates appropriately based on whether the newly selected date
      // is before the currently selected start date
      if (isBefore(newEndDate, tempStartDate)) {
        tempEndDate = tempStartDate;
        tempStartDate = newEndDate;
      } else {
        tempEndDate = newEndDate;
      }

      hasSelection = true;

      dispatchEvent("selection", {
        startDate: tempStartDate,
        endDate: tempEndDate
      });

      if (autoApply) {
        apply();
      }
    }
  }

  function onHover({ detail }) {
    hoverDate = detail;
  }

  function onPrevMonth() {
    months = months.map(mo => subMonths(mo, 1));
  }

  function onNextMonth() {
    months = months.map(mo => addMonths(mo, 1));
  }

  function onPageChange({ detail: { incrementAmount } }) {
    if (incrementAmount > 0) {
      months = months.map(mo => addMonths(mo, incrementAmount));
    } else {
      const absIncrementAmount = Math.abs(incrementAmount);
      months = months.map(mo => subMonths(mo, absIncrementAmount));
    }
  }

  function onStartTimeChange({ detail }) {
    const newDate = new Date(
      tempStartDate.getFullYear(),
      tempStartDate.getMonth(),
      tempStartDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    );

    if (isAfter(newDate, tempEndDate)) {
      tempStartDate = tempEndDate;
      tempEndDate = newDate;
    } else {
      tempStartDate = newDate;
    }
  }

  function onEndTimeChange({ detail }) {
    const newDate = new Date(
      tempEndDate.getFullYear(),
      tempEndDate.getMonth(),
      tempEndDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    );

    if (isBefore(newDate, tempStartDate)) {
      tempEndDate = tempStartDate;
      tempStartDate = newDate;
    } else {
      tempEndDate = newDate;
    }
  }
  function foo() {
    console.log("foo");
  }
</script>

<style>
  .s-date-range-picker {
    font-size: 18px;
    margin: 2em;
    background-color: #fff;
    border: 1px solid #d5d5d5;
    border-radius: 6px;
    padding: 1em;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .s-date-range-picker :global(.calendar-row) {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
  }

  .s-date-range-picker :global(.calendar-cell) {
    width: 44px;
    height: 44px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .s-date-range-picker :global(.select) {
    padding: 8px 12px;
    background-color: transparent;
    border-radius: 4px;
    border: 1px solid #d5d5d5;
    margin: 1px;
    cursor: pointer;
  }
  .rtl {
    direction: rtl;
  }
  .s-date-range-picker :global(button) {
    cursor: pointer;
  }
  .s-date-range-picker :global(button:disabled) {
    cursor: not-allowed;
  }
  button {
    margin: 4px;
    background-color: transparent;
    border: 1px solid #d5d5d5;
    padding: 8px 12px;
    border-radius: 4px;
  }

  button:disabled {
    cursor: not-allowed;
  }
</style>

<form
  on:submit|preventDefault={foo}
  {id}
  style={`width: ${maxWidth}px`}
  class={rtl ? 'rtl s-date-range-picker' : 's-date-range-picker'}>
  <div class="label-row">
    <label>{startDateReadout()} to {endDateReadout()}</label>
    <!-- <button type="close" disabled={!canApply()} on:click={() => close()}>
      x
    </button> -->
  </div>
  <div>
    <div class="grid">
      {#each months as month}
        <Calendar
          on:pageChange={onPageChange}
          on:hover={onHover}
          on:selection={onSelection}
          on:prevMonth={onPrevMonth}
          on:nextMonth={onNextMonth}
          on:apply={apply}
          {prevIcon}
          {nextIcon}
          {disabledDates}
          {events}
          {hoverDate}
          {hasSelection}
          {firstDayOfWeek}
          {isoWeekNumbers}
          {maxDate}
          {minDate}
          {month}
          {monthDropdown}
          {monthFormat}
          {monthIndicator}
          {pageWidth}
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
    <div class="calendar-row">
      <TimePicker
        on:timeChange={onStartTimeChange}
        dateReference={tempStartDate}
        {minuteIncrement}
        {secondIncrement}
        {timePicker24Hour}
        {timePickerSeconds} />

      {#if !singlePicker}
        <TimePicker
          on:timeChange={onEndTimeChange}
          dateReference={tempEndDate}
          {minuteIncrement}
          {secondIncrement}
          {timePicker24Hour}
          {timePickerSeconds} />
      {/if}
    </div>
  {/if}
  <div style="justify-content: flex-end; display: flex;">
    {#if todayBtn}
      <button
        type="button"
        aria-label="Show the current selection "
        on:click={goToToday}
        disabled={isSameMonth(new Date(), months[0])}>
        {todayBtnText}
      </button>
    {/if}
    {#if resetViewBtn}
      <button
        type="button"
        aria-label="Show the current selection "
        on:click={resetView}
        disabled={!canResetView}>
        {@html resetViewBtnText}
      </button>
    {/if}
    <button
      type="button"
      aria-label="Cancel the current selection and revert to previous start and
      end dates"
      on:click={cancel}
      aria-disabled={!canApply()}
      disabled={!canApply()}>
      {cancelBtnText}
    </button>

    <button
      aria-label="Apply the current selection"
      on:click={apply}
      aria-disabled={!canApply()}
      disabled={!canApply()}>
      {applyBtnText}
    </button>
  </div>
</form>
