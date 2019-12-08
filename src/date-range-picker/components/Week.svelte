<script>
  import { isBefore, format } from 'date-fns'
  import Day from './Day.svelte'
  import { localeFormat } from '../utils'

  export let month
  export let monthIndicator
  export let rtl
  export let week
  export let weekGuides
  export let weekNumbers

  $: weeksFromToday =
    week.weeksFromToday > 0 ? `+${week.weeksFromToday}` : week.weeksFromToday
</script>

<style>
  /* .relative {
    position: relative;
  }

  .side-width small {
    position: absolute;
  }

  .left-side small {
    left: -36px;
  }

  .right-side small:first-child {
    left: 4px;
  } */
</style>

<div
  aria-label={`${localeFormat(month, 'yyyy')}`}
  class="row"
  role="row"
  on:nextMonth
  on:prevMonth>

  <div class="row" dir={rtl ? 'rtl' : 'ltr'}>
    {#if weekGuides}
      <small class="cell muted" aria-label={`${week.weeksFromToday} weeks from today`}>
        {weeksFromToday}w
      </small>
    {/if}
    {#each week.daysInWeek as day (day.date.toString())}
      <Day
        {day}
        {monthIndicator}
        {rtl}
        on:apply
        on:cancel
        on:hover
        on:selection />
    {/each}
    {#if weekNumbers}
      <small class="cell muted" aria-label={`Week ${week.weekNumber}`}>{week.weekNumber}</small>
    {/if}
  </div>
</div>
