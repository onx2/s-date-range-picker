<script>
  import { createEventDispatcher } from "svelte";
  import { isBefore, format } from "date-fns";
  import Day from "./day.svelte";

  export let week;
  export let month;
  export let monthIndicator;
  export let locale;
  export let weekGuides;
  export let weekNumbers;
  export let isoWeekNumbers;
  export let tempStartDate;
  export let tempEndDate;
  export let singlePicker;

  const dispatchEvent = new createEventDispatcher();

  function onClick(date) {
    if (singlePicker) {
      dispatchEvent("selection", { tempStartDate: date, tempEndDate: date });
    } else if (tempStartDate && tempEndDate) {
      dispatchEvent("selection", {
        tempStartDate: date,
        tempEndDate: undefined
      });
    } else {
      if (isBefore(date, tempStartDate)) {
        dispatchEvent("selection", {
          tempStartDate: date,
          tempEndDate: tempStartDate
        });
      } else {
        dispatchEvent("selection", { tempStartDate, tempEndDate: date });
      }
    }
  }

  function onHover(hoverDate) {
    dispatchEvent("hover", { hoverDate });
  }

  $: weeksFromToday = function(week) {
    if (week.weeksFromToday > 0) {
      return `+${week.weeksFromToday}`;
    }

    return week.weeksFromToday;
  };
</script>

<style>
  .relative {
    position: relative;
  }

  span {
    font-size: 0.7rem;
    color: #999;
  }

  .side-width {
    width: 20px;
  }

  .side-width span {
    position: absolute;
  }

  .left-side span {
    left: -36px;
  }

  .right-side span:first-child {
    left: 4px;
  }

  .right-side span:nth-child(2) {
    left: 24px;
  }
</style>

<div
  aria-label={`${locale.code} week ${week.weekNumber}, ${format(month, 'yyyy', {
    locale
  })}`}
  class="calendar-row">

  {#if weekGuides && week.weeksFromToday}
    <div class="relative calendar-row side-width left-side">
      <span aria-label={`${week.weeksFromToday} weeks from today`}>
        {weeksFromToday(week)}w
      </span>
    </div>
  {/if}

  <div class="calendar-row">
    {#each week.daysInWeek as day (day.date.toString())}
      <Day
        {day}
        {monthIndicator}
        {locale}
        on:click={() => onClick(day.date)}
        on:mouseenter={() => onHover(day.date)}
        on:focus={() => onHover(day.date)} />
    {/each}
  </div>
  {#if weekNumbers || isoWeekNumbers}
    <div class="relative calendar-row side-width right-side">
      {#if weekNumbers}
        <span aria-label={`Week ${week.weekNumber}`}>{week.weekNumber}</span>
      {/if}
      {#if isoWeekNumbers}
        <span aria-label={`Week ${week.isoWeekNumber}`}>
          i{week.isoWeekNumber}
        </span>
      {/if}
    </div>
  {/if}
</div>
