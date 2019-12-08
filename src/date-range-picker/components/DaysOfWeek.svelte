<script>
  import { getDaysOfWeek, localeFormat } from '../utils'

  export let firstDayOfWeek

  $: daysOfWeek = getDaysOfWeek(firstDayOfWeek)
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
      aria-label={localeFormat(dayOfWeek, 'EEEE')}
      class="cell"
      role="gridcell">
      {localeFormat(dayOfWeek, 'eeeeee')}
    </span>
  {/each}
</div>
