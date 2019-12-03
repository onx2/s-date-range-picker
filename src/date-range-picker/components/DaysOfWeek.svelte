<script>
  import { getDaysOfWeek, localeFormat } from "../utils";

  export let firstDayOfWeek;

  $: daysOfWeek = getDaysOfWeek(firstDayOfWeek);
</script>

<style>
  span {
    font-size: 0.8rem;
    color: #999;
  }
</style>

<div class="row" role="row">
  {#each daysOfWeek as dayOfWeek}
    <span
      role="gridcell"
      class="calendar-cell"
      aria-label={localeFormat(dayOfWeek, 'EEEE')}>
      {localeFormat(dayOfWeek, 'eeeeee')}
    </span>
  {/each}
</div>
