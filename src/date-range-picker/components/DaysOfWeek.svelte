<script>
  import { getDaysOfWeek, localeFormat } from "../utils"

  export let firstDayOfWeek
  export let weekGuides
  export let weekNumbers

  $: daysOfWeek = getDaysOfWeek(firstDayOfWeek)
</script>

<div class="row" role="row">
  {#if weekGuides}
    <div class="cell" />
  {/if}
  {#each daysOfWeek as dayOfWeek}
    <small
      aria-label={localeFormat(dayOfWeek, "EEEE")}
      class="cell muted"
      role="gridcell">
      {localeFormat(dayOfWeek, "eeeeee")}
    </small>
  {/each}
  {#if weekNumbers}
    <div class="cell" />
  {/if}
</div>
