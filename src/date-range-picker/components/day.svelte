<script>
  import {
    format,
    isSameMonth,
    isSameDay,
    startOfWeek,
    endOfWeek
  } from "date-fns";

  export let locale;
  export let day;
  export let monthIndicator;
  export let rtl;
</script>

<style>
  div {
    margin: 2px 0;
  }

  button {
    background-color: transparent;
    cursor: pointer;
    border-radius: 100%;
    outline: 0;
    border: 0;
    padding: 0;
  }

  button:disabled {
    cursor: not-allowed;
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

  .within-selection.end-date.within-selection.start-date {
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
    margin-top: -12px;
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
  class:rtl
  class:today={day.isToday}
  class:weekend={day.isWeekend}
  class:next-month={day.isNextMonth}
  class:prev-month={day.isPrevMonth}
  class:start-date={day.isStartDate}
  class:end-date={day.isEndDate}
  class:within-selection={day.isWithinSelection}>
  <button
    aria-label={format(day.date, 'EEEE, MMMM co, yyyy', { locale })}
    aria-disabled={day.isDisabled}
    class="calendar-cell"
    disabled={day.isDisabled}
    on:click
    on:mouseenter
    on:focus>
    {#if monthIndicator}
      <span class="month-indicator">{format(day.date, 'MMM', { locale })}</span>
    {/if}
    {format(day.date, 'd', { locale })}
  </button>
</div>
