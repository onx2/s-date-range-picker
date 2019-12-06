<script>
  /**
   * @todo Question: Can this component be divided up into separate components?
   * And if so, should it be?
   *
   * Potential splitting: single vs range, slim vs full (could remove a significant amount of complexity)
   *
   * The TimePicker component could potentially be split out into a separate package that is imported.
   * If it were themeable, it may be easier / make more sense to split it out.
   *
   */
  import { createEventDispatcher, onMount } from "svelte";
  import {
    addMonths,
    addYears,
    subYears,
    differenceInCalendarMonths,
    endOfWeek,
    endOfYear,
    format,
    isAfter,
    isBefore,
    isSameMinute,
    isSameSecond,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfWeek,
    startOfYear,
    subMonths
  } from "date-fns";
  import { localeFormat, roundDown } from "./utils";
  import Calendar from "./components/Calendar.svelte";
  import TimePicker from "./components/TimePicker.svelte";

  export let applyBtnText = "Apply";
  export let autoApply = false;
  export let cancelBtnText = "Cancel";
  export let dateFormat = "MMM dd, yyyy";
  export let disabledDates = [];
  export let endDate = endOfWeek(new Date());
  export let events = [];
  export let firstDayOfWeek = "sunday";
  export let id = `s-date-range-picker-${Math.random()}`;
  export let isoWeekNumbers = false;
  export let locale = undefined;
  export let maxDate = addYears(endOfYear(new Date()), 10);
  export let minDate = subYears(startOfYear(new Date()), 10);
  export let minuteIncrement = 1;
  export let monthDropdown = true;
  export let monthFormat = "MMMM";
  export let monthIndicator = true;
  export let nextIcon = "▸";
  export let numPages = 2;
  export let prevIcon = "◂";
  export let resetViewBtn = false;
  export let resetViewBtnText = "↚";
  export let rtl = false;
  export let secondIncrement = 1;
  export let singlePicker = false;
  export let startDate = startOfWeek(new Date());
  export let timePicker = true;
  export let timePickerControls = false;
  export let timePicker24Hour = true;
  export let timePickerSeconds = true;
  export let today = new Date();
  export let todayBtn = false;
  export let todayBtnText = "Today";
  export let weekGuides = false;
  export let weekNumbers = false;
  export let yearDropdown = true;

  /** @todo Implement props/options */
  // export let disabled = false;
  // export let hideOnCancel = true;
  // export let hideOnApply = true;
  // export let maxSpan = null;
  // export let predefinedRanges = [];

  let hasSelection = true;
  let hoverDate = endDate;
  $: tempEndDate = endDate;
  $: tempStartDate = startDate;

  const cellWidth = 40;
  const dispatchEvent = createEventDispatcher();
  const pageWidth = cellWidth * 7;
  const pageWidthWithPadding = pageWidth + 96;
  const maxCalsPerPage = 2;

  // Used for the date-fns format abstraction, localeFormat
  /** @todo This might be better placed into a store. */
  window.__locale__ = locale;

  $: canApply = () => {
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
  $: startDateReadout = () => {
    if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
      return localeFormat(hoverDate, dateFormat);
    }

    return localeFormat(tempStartDate, dateFormat);
  };
  $: endDateReadout = () => {
    if (!hasSelection) {
      if (isBefore(hoverDate, tempStartDate)) {
        return localeFormat(tempStartDate, dateFormat);
      }

      return localeFormat(hoverDate, dateFormat);
    }

    return localeFormat(tempEndDate, dateFormat);
  };

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

  // const show() =>{
  //   dispatchEvent("show");
  // }

  // const hide() =>{
  //   dispatchEvent("hide");
  // }

  const apply = () => {
    if (!canApply()) {
      return;
    }

    // hideOnApply &&  hide();

    dispatchEvent("apply", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });
  };

  const goToToday = () => {
    months = [...Array(numPages)].map((_, i) => addMonths(today, i));
  };

  const resetView = () => {
    const resetViewMonth = canApply() ? tempStartDate : startDate;
    months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i));
  };

  const resetState = () => {
    tempStartDate = startDate;
    tempEndDate = endDate;
    hasSelection = true;
  };

  const close = () => {
    resetState();
    resetView();
    // hide();
  };

  const cancel = () => {
    resetState();
    resetView();

    // hideOnCancel && hide();

    dispatchEvent("cancel", {
      startDate,
      endDate
    });
  };

  const onSelection = ({ detail }) => {
    const detailWithEndDateTime = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempEndDate.getHours(),
      tempEndDate.getMinutes(),
      tempEndDate.getSeconds()
    );

    const detailWithStartDateTime = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempStartDate.getHours(),
      tempStartDate.getMinutes(),
      tempStartDate.getSeconds()
    );

    if (singlePicker) {
      // Start and end dates are always the same on singlePicker
      tempStartDate = tempEndDate = detailWithEndDateTime;
    } else if (hasSelection) {
      /**
       * In range mode, if there is currently a selection and the selection
       * event is fired the user must be selecting the start date.
       */
      tempStartDate = hoverDate = detailWithStartDateTime;
      hasSelection = false;
    } else {
      // In range mode, if there isn't a selection, the user must be selecting an end date
      // Sorting - Swap start and end dates when the end date is before the start date
      if (isBefore(detailWithEndDateTime, tempStartDate)) {
        if (isSameDay(detailWithEndDateTime, tempStartDate)) {
          tempEndDate = tempStartDate;
          tempStartDate = detailWithEndDateTime;
        } else {
          tempEndDate = new Date(
            tempStartDate.getFullYear(),
            tempStartDate.getMonth(),
            tempStartDate.getDate(),
            tempEndDate.getHours(),
            tempEndDate.getMinutes(),
            tempEndDate.getSeconds()
          );
          tempStartDate = detailWithStartDateTime;
        }
      } else {
        tempEndDate = detailWithEndDateTime;
      }

      hasSelection = true;

      dispatchEvent("selection", {
        startDate: tempStartDate,
        endDate: tempEndDate
      });

      autoApply && apply();
    }
  };

  const onHover = ({ detail }) => {
    if (!hasSelection) {
      hoverDate = detail;
    }
  };

  const onPrevMonth = () => {
    months = months.map(mo => subMonths(mo, 1));
  };

  const onNextMonth = () => {
    console.log("onNextMonth");
    months = months.map(mo => addMonths(mo, 1));
  };

  const onPageChange = ({ detail: { incrementAmount } }) => {
    if (incrementAmount > 0) {
      months = months.map(mo => addMonths(mo, incrementAmount));
    } else {
      const absIncrementAmount = Math.abs(incrementAmount);
      months = months.map(mo => subMonths(mo, absIncrementAmount));
    }
  };

  const onStartTimeChange = ({ detail }) => {
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
  };

  const onEndTimeChange = ({ detail }) => {
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
  };
</script>

<style>
  .s-date-range-picker {
    font-size: 18px;
    background-color: #fff;
    border: 1px solid #d5d5d5;
    border-radius: 6px;
    padding: 0.6em;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .s-date-range-picker :global(.space-between) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .s-date-range-picker :global(.row) {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
  }

  .s-date-range-picker :global(.cell) {
    width: 40px;
    height: 40px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .s-date-range-picker :global(.form-field) {
    background-color: transparent;
    border-radius: 4px;
    border: 1px solid #d5d5d5;
    margin: 1px;
    cursor: pointer;
  }

  .s-date-range-picker :global(select.form-field) {
    padding: 8px;
  }

  .s-date-range-picker :global(button.form-field) {
    padding: 8px 16px;
  }

  .s-date-range-picker :global(button) {
    cursor: pointer;
    user-select: none;
  }

  .s-date-range-picker :global(button:disabled) {
    cursor: not-allowed;
  }

  h1 {
    font-size: 20px;
    margin: 0;
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
  {id}
  on:submit|preventDefault={apply}
  style={`width: ${maxWidth}px`}>
  <div class="space-between">
    <h1>{startDateReadout()} to {endDateReadout()}</h1>
    <button
      aria-label="Close the date range picker"
      class="form-field"
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
          {isoWeekNumbers}
          {maxDate}
          {minDate}
          {month}
          {monthDropdown}
          {monthFormat}
          {monthIndicator}
          {nextIcon}
          pageNum={index}
          on:apply={apply}
          on:hover={onHover}
          on:nextMonth={onNextMonth}
          on:pageChange={onPageChange}
          on:prevMonth={onPrevMonth}
          on:selection={onSelection}
          {pageWidth}
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
        class="form-field"
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
        class="form-field"
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
      class="form-field"
      disabled={!canApply()}
      on:click={cancel}
      type="button">
      {cancelBtnText}
    </button>

    <button
      aria-disabled={!canApply()}
      aria-label="Apply the current selection"
      class="form-field"
      disabled={!canApply()}
      on:click={apply}
      type="submit">
      {applyBtnText}
    </button>
  </div>
</form>
