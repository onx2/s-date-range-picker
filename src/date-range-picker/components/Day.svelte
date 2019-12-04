<script>
  import { createEventDispatcher } from "svelte";
  import {
    addDays,
    addMonths,
    addWeeks,
    endOfWeek,
    isAfter,
    isBefore,
    isSameMonth,
    isSameDay,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks
  } from "date-fns";
  import { localeFormat } from "../utils";

  export let day;
  export let monthIndicator;
  export let rtl;

  let mouseDownDate = null;

  const dispatchEvent = createEventDispatcher();

  // Enter should submit / apply the selection, not activate a button.
  const onKeydown = (e, date) => {
    let newDate = date;

    switch (e.code) {
      case "Enter":
      case "NumpadEnter":
        dispatchEvent("apply");
        return;
      case "Space":
        dispatchEvent("selection", date);
        return;
      case "ArrowUp":
        newDate = subWeeks(date, 1);
        break;
      case "ArrowDown":
        newDate = addWeeks(date, 1);
        break;
      case "ArrowRight":
        newDate = addDays(date, 1);
        break;
      case "ArrowLeft":
        newDate = subDays(date, 1);
        break;
      case "PageDown":
        newDate = subMonths(date, 1);
        break;
      case "PageUp":
        newDate = addMonths(date, 1);
        break;
      default:
        return;
    }

    /** @todo Flip page when focusing on an element that isn't visible */
    const el = document.getElementById(localeFormat(newDate, "yyyy-MM-dd"));
    // Graceful failure until page flipping functionality is implemented.
    if (!el) {
      // Handle page flipping if the element isn't found
      return;
    }

    dispatchEvent("hover", newDate);
    el.focus();
  };

  const onMouseUp = (e, date) => {
    if (e.button === 0) {
      if (!isSameDay(date, mouseDownDate)) {
        dispatchEvent("selection", date);
        // Set the focus state to the last selected date.
        // This happens automatically via a "click", but not on "mouseup"
        document.getElementById(localeFormat(date, "yyyy-MM-dd")).focus();
      }

      mouseDownDate = null;
    }
  };

  const onMouseDown = (e, date) => {
    // Only continue if the left mouse button was clicked
    if (e.button === 0) {
      mouseDownDate = date;
      dispatchEvent("selection", date);
    }
  };

  // Prevent id duplication when showing multiple pages
  const id =
    !day.isNextMonth && !day.isPrevMonth
      ? localeFormat(day.date, "yyyy-MM-dd")
      : undefined;
</script>

<style>
  div::after {
    content: "";
    top: 0;
    width: 44px;
    height: 44px;
    position: absolute;
    background-color: #bbdefb;
    opacity: 0;
  }

  div {
    position: relative;
    overflow: hidden;
  }

  div.within-selection:not(.start-date):not(.end-date)::after {
    opacity: 1;
  }

  div.within-selection::after {
    transition: opacity 440ms ease;
  }

  .end-date:after,
  .start-date:after {
    opacity: 1;
  }
  button {
    background-color: transparent;
    border-radius: 100%;
    outline: 0;
    border: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
    z-index: 1;
  }

  button:focus {
    box-shadow: inset 0 0 0 1px #1565c0;
  }

  .end-date::after {
    border-radius: 0 100% 100% 0;
  }

  .start-date::after {
    border-radius: 100% 0 0 100%;
  }

  .end-date.start-date {
    border-radius: 100%;
  }

  .today {
    text-decoration: underline;
  }

  .start-date button,
  .end-date button,
  button:not(:disabled):hover {
    background-color: #1565c0;
    color: white;
  }

  .month-indicator {
    font-size: 0.6rem;
    top: 4px;
    position: absolute;
    opacity: 0;
  }

  button:not(:disabled):hover .month-indicator,
  .start-date .month-indicator,
  .end-date .month-indicator {
    transition: opacity 440ms ease;
    opacity: 1;
  }

  .next-month button,
  .prev-month button,
  button:disabled {
    opacity: 0.6;
  }

  /* Swap border radius when in rtl */
  .rtl.end-date::after {
    border-radius: 100% 0 0 100%;
  }

  .rtl.start-date::after {
    border-radius: 0 100% 100% 0;
  }
</style>

<div
  class:end-date={day.isEndDate}
  class:today={day.isToday}
  class:next-month={day.isNextMonth}
  class:prev-month={day.isPrevMonth}
  class:rtl
  class:start-date={day.isStartDate}
  class:weekend={day.isWeekend}
  class:within-selection={day.isWithinSelection}
  on:keydown={e => onKeydown(e, day.date)}
  on:mouseenter={() => dispatchEvent('hover', day.date)}
  on:mousedown={e => onMouseDown(e, day.date)}
  on:mouseup={e => onMouseUp(e, day.date)}
  role="gridcell">
  <button
    aria-disabled={day.isDisabled}
    aria-label={localeFormat(day.date, 'EEEE, MMMM co, yyyy')}
    class="cell"
    disabled={day.isDisabled}
    {id}
    type="button">
    {#if monthIndicator}
      <span class="month-indicator">{localeFormat(day.date, 'MMM')}</span>
    {/if}
    {localeFormat(day.date, 'd')}
  </button>
</div>
