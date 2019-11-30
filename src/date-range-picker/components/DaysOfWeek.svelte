<script>
  import { format } from "date-fns";
  import { getDaysOfWeek } from "../utils";

  export let firstDayOfWeek;
  export let locale;

  $: daysOfWeek = getDaysOfWeek({ firstDayOfWeek, locale });
</script>

<style>
  span {
    font-size: 0.8rem;
    color: #999;
  }
</style>

<div class="calendar-row">
  {#each daysOfWeek as dayOfWeek}
    <span
      class="calendar-cell"
      aria-label={format(dayOfWeek, 'EEEE', { locale })}>
      {format(dayOfWeek, 'eeeeee', { locale })}
    </span>
  {/each}
</div>
