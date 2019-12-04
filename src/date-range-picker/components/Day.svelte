<script>
  import { createEventDispatcher } from "svelte";
  import { endOfWeek, isSameMonth, isSameDay, startOfWeek } from "date-fns";
  import { localeFormat } from "../utils";

  export let day;
  export let monthIndicator;
  export let rtl;

  const dispatchEvent = createEventDispatcher();
  let mouseDownDate = null;
  const onKeydown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatchEvent("apply");
    }
  };
  const onMouseUp = date => {
    if (!isSameDay(date, mouseDownDate)) {
      dispatchEvent("selection", date);
    }

    mouseDownDate = null;
  };

  const onMouseDown = date => {
    mouseDownDate = date;
    dispatchEvent("selection", date);
  };
</script>

<style>
  div {
    margin: 2px 0;
  }

  button {
    background-color: transparent;
    border-radius: 100%;
    outline: 0;
    border: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  button:focus {
    box-shadow: 0 0 4px #1565c0;
  }

  .within-selection,
  .end-date,
  .start-date {
    background-color: #bbdefb;
  }

  .end-date {
    border-radius: 0 100% 100% 0;
  }

  .start-date {
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
    transition: opacity 460ms ease;
    opacity: 1;
  }

  .next-month button,
  .prev-month button,
  button:disabled {
    opacity: 0.6;
  }

  /* Swap border radius when in rtl */
  .rtl.end-date {
    border-radius: 100% 0 0 100%;
  }

  .rtl.start-date {
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
  role="gridcell">
  <button
    aria-disabled={day.isDisabled}
    aria-label={localeFormat(day.date, 'EEEE, MMMM co, yyyy')}
    class="cell"
    disabled={day.isDisabled}
    on:keydown={onKeydown}
    on:focus={() => dispatchEvent('hover', day.date)}
    on:mouseenter={() => dispatchEvent('hover', day.date)}
    on:mousedown={() => onMouseDown(day.date)}
    on:mouseup={() => onMouseUp(day.date)}
    type="button">
    {#if monthIndicator}
      <span class="month-indicator">{localeFormat(day.date, 'MMM')}</span>
    {/if}
    {localeFormat(day.date, 'd')}
  </button>
</div>
