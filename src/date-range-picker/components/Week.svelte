<script>
  import Day from "./Day.svelte"

  export let monthIndicator
  export let week
  export let weekGuides
  export let weekNumbers

  $: weeksFromToday =
    week.weeksFromToday > 0 ? `+${week.weeksFromToday}` : week.weeksFromToday
</script>

<div class="row" role="row" on:nextMonth on:prevMonth>
  {#if weekGuides}
    <small
      aria-label={`${week.weeksFromToday} weeks from today`}
      class="cell muted"
      title={`${week.weeksFromToday} weeks from today`}>
      {weeksFromToday}
    </small>
  {/if}
  {#each week.daysInWeek as day (day.date.toString())}
    <Day {day} {monthIndicator} on:apply on:cancel on:hover on:selection />
  {/each}
  {#if weekNumbers}
    <small
      aria-label={`Week ${week.weekNumber}`}
      class="cell muted"
      title={`Week ${week.weekNumber}`}>
      {week.weekNumber}
    </small>
  {/if}
</div>
