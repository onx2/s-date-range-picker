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
</script>

<style>
  div {
    margin: 2px 0;
  }

  button {
    background-color: transparent;
    cursor: pointer;
    border-radius: 20px;
    outline: 0;
    border: 0;
    padding: 0;
  }

  button:disabled {
    cursor: not-allowed;
  }

  .within-selection {
    background-color: #bbdefb;
  }

  .within-selection.end-date {
    border-radius: 0 20px 20px 0;
  }

  .within-selection.start-date {
    border-radius: 20px 0 0 20px;
  }

  .within-selection.end-date.within-selection.start-date {
    border-radius: 20px;
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
    font-size: 0.48rem;
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
</style>

<div
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
