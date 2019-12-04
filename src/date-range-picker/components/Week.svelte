<script>
  import { isBefore, format } from "date-fns";
  import Day from "./Day.svelte";
  import { localeFormat } from "../utils";

  export let isoWeekNumbers;
  export let month;
  export let monthIndicator;
  export let rtl;
  export let week;
  export let weekGuides;
  export let weekNumbers;

  $: weeksFromToday =
    week.weeksFromToday > 0 ? `+${week.weeksFromToday}` : week.weeksFromToday;
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
  aria-label={`${localeFormat(month, 'yyyy')}`}
  class="row"
  role="row"
  on:nextMonth
  on:prevMonth>

  {#if weekGuides && week.weeksFromToday}
    <div class="left-side relative row side-width">
      <span aria-label={`${week.weeksFromToday} weeks from today`}>
        {weeksFromToday}w
      </span>
    </div>
  {/if}

  <div class="row" dir={rtl ? 'rtl' : 'ltr'}>
    {#each week.daysInWeek as day (day.date.toString())}
      <Day {day} {monthIndicator} {rtl} on:selection on:hover on:apply />
    {/each}
  </div>
  {#if weekNumbers || isoWeekNumbers}
    <div class="relative right-side row side-width ">
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
