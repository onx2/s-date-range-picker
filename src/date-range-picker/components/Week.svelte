<script>
  import Day from './Day.svelte'
  import { localeFormat } from '../utils'

  export let month
  export let monthIndicator
  export let week
  export let weekGuides
  export let weekNumbers

  $: weeksFromToday =
    week.weeksFromToday > 0 ? `+${week.weeksFromToday}` : week.weeksFromToday
</script>

<div
  aria-label={`${localeFormat(month, 'yyyy')}`}
  class="row"
  role="row"
  on:nextMonth
  on:prevMonth>
  {#if weekGuides}
    <small class="cell muted" aria-label={`${week.weeksFromToday}`}>
      {weeksFromToday}
    </small>
  {/if}
  {#each week.daysInWeek as day (day.date.toString())}
    <Day {day} {monthIndicator} on:apply on:cancel on:hover on:selection />
  {/each}
  {#if weekNumbers}
    <small class="cell muted" aria-label={`${week.weekNumber}`}>
      {week.weekNumber}
    </small>
  {/if}
</div>
