<script>
  import { createEventDispatcher } from "svelte";
  import {
    addMonths,
    addYears,
    subYears,
    differenceInCalendarMonths,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    startOfWeek,
    subMonths
  } from "date-fns";
  import { enUS } from "date-fns/locale";
  import Calendar from "./components/Calendar.svelte";

  export let autoApply = false;
  export let dateFormat = "MMM dd, yyyy";
  export let monthIndicator = true;
  // export let disabled = false;
  export let disabledDates = [];
  export let endDate = new Date();
  export let events = [];
  export let firstDayOfWeek = "sunday";
  export let hideOnCancel = true;
  export let hideOnApply = true;
  export let isoWeekNumbers = false;
  export let locale = enUS;
  export let maxDate = addYears(new Date(), 10);
  // export let maxSpan = null;
  export let minDate = subYears(new Date(), 10);
  export let monthDropdown = true;
  export let monthFormat = "MMMM";
  export let numPages = 1;
  // export let predefinedRanges = [];
  export let rtl = false;
  export let singlePicker = false;
  export let startDate = startOfWeek(new Date());
  // export let timePicker = false;
  // export let timePicker24Hour = true;
  // export let timePickerIncrement = 1;
  // export let timePickerSeconds = false;
  export let today = new Date();
  export let weekGuides = false;
  export let weekNumbers = false;
  export let yearDropdown = true;

  let hoverDate = startDate;
  let tempEndDate = endDate;
  let tempStartDate = startDate;

  const cellWidth = 44;
  const dispatchEvent = createEventDispatcher();
  const id = "s-date-range-picker";
  const maxCalsPerPage = 2;
  const pageWidth = cellWidth * 7;
  const pageWidthWithPadding =
    pageWidth + (!weekGuides && !isoWeekNumbers && !weekNumbers ? 24 : 96);

  $: canApply =
    (!isSameDay(tempStartDate, startDate) ||
      !isSameDay(tempEndDate, endDate)) &&
    tempEndDate;
  $: canCancel =
    !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate);
  $: canResetView = !isSameMonth(tempStartDate, months[0]) && tempEndDate;
  $: maxWidth =
    pickerWidth >= maxCalsPerPage * pageWidth
      ? maxCalsPerPage * pageWidthWithPadding
      : pickerWidth;
  $: months = [...Array(numPages)].map((_, i) => addMonths(today, i));
  $: pickerWidth = numPages * pageWidthWithPadding;
  $: startDateReadout = function() {
    if (!tempEndDate && isBefore(hoverDate, tempStartDate)) {
      return format(hoverDate, dateFormat, { locale });
    }

    return format(tempStartDate, dateFormat, { locale });
  };
  $: endDateReadout = function() {
    if (!tempEndDate) {
      if (isBefore(hoverDate, tempStartDate)) {
        return format(tempStartDate, dateFormat, { locale });
      }

      return format(hoverDate, dateFormat, { locale });
    }

    return format(tempEndDate, dateFormat, { locale });
  };

  function show() {
    dispatchEvent("show");
  }

  function hide() {
    dispatchEvent("hide");
  }

  function apply() {
    if (!tempEndDate && !singlePicker) {
      return;
    }

    if (hideOnApply) {
      hide();
    }

    dispatchEvent("apply", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });
  }

  function resetView() {
    const resetViewMonth = canApply ? tempStartDate : startDate;
    months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i));
  }

  function resetState() {
    tempStartDate = startDate;
    tempEndDate = endDate;
  }

  function close() {
    resetState();
    resetView();
    hide();
  }

  function cancel() {
    resetState();
    resetView();

    if (hideOnCancel) {
      hide();
    }

    dispatchEvent("cancel", {
      startDate,
      endDate
    });
  }

  function onSelection({ detail }) {
    tempStartDate = detail.tempStartDate;
    tempEndDate = detail.tempEndDate;

    dispatchEvent("selection", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });

    if (autoApply) {
      apply();
    }
  }

  function onHover({ detail }) {
    hoverDate = detail.hoverDate;
  }

  function onPreviousMonth() {
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
</script>

<style>
  #s-date-range-picker {
    font-size: 18px;
    margin: 2em;
    border: 1px solid #999;
    border-radius: 6px;
    padding: 1em;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
  }

  #s-date-range-picker :global(.calendar-row) {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
  }

  #s-date-range-picker :global(.calendar-cell) {
    width: 44px;
    height: 44px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<div {id} style={`width: ${maxWidth}px`}>
  <div>
    <label>{startDateReadout()} to {endDateReadout()}</label>
    <!-- <button type="close" disabled={!canCancel} on:click={() => close()}>
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
          on:previousMonth={onPreviousMonth}
          on:nextMonth={onNextMonth}
          {disabledDates}
          {events}
          {hoverDate}
          {firstDayOfWeek}
          {isoWeekNumbers}
          {locale}
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
  <div>Time picker row</div>
  <div>
    <button
      type="button"
      aria-label="Show the current selection "
      aria-controls={id}
      on:click={resetView}
      disabled={!canResetView}>
      {`<${canResetView ? '0' : '-'}>`}
    </button>
    <button
      type="button"
      aria-label="Cancel the current selection and revert to previous start and
      end dates"
      aria-controls={id}
      on:click={cancel}
      disabled={!canCancel}>
      Cancel
    </button>

    <button
      type="button"
      aria-label="Apply the current selection"
      aria-controls={id}
      on:click={apply}
      disabled={!canApply}>
      Apply
    </button>
  </div>
</div>
