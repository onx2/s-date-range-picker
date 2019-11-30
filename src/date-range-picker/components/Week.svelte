<script>
  import { isBefore, format } from "date-fns";
  import Day from "./Day.svelte";

  export let locale;
  export let isoWeekNumbers;
  export let month;
  export let monthIndicator;
  export let rtl;
  export let singlePicker;
  export let tempStartDate;
  export let tempEndDate;
  export let week;
  export let weekGuides;
  export let weekNumbers;

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
      <Day {day} {locale} {monthIndicator} {rtl} on:selection on:hover />
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
