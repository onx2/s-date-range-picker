<script>
  import { createEventDispatcher } from "svelte";
  import {
    addMonths,
    differenceInCalendarMonths,
    differenceInCalendarYears,
    format,
    isAfter,
    isBefore,
    isSameMonth,
    subMonths,
    isSameYear
  } from "date-fns";
  import { buildMonths, buildYears } from "../utils";

  export let locale;
  export let month;
  export let monthFormat;
  export let monthDropdown;
  export let maxDate;
  export let minDate;
  export let nextIcon = "N";
  export let previousIcon = "P";
  export let yearDropdown;

  const disptachEvent = createEventDispatcher();

  $: selectedMonth = {
    value: month,
    text: format(month, monthFormat, { locale })
  };
  $: selectedYear = { value: month, text: format(month, "yyyy", { locale }) };
  $: previousMonth = subMonths(month, 1);
  $: nextMonth = addMonths(month, 1);
  $: isMaxDate = isAfter(month, maxDate) || isSameMonth(month, maxDate);
  $: isMinDate = isBefore(month, minDate) || isSameMonth(month, minDate);
  $: months = buildMonths({ month, monthFormat, locale });
  $: years = buildYears({ minDate, maxDate, locale });
  $: nextBtnDisabled = isSameMonth(month, maxDate) || isAfter(month, maxDate);
  $: prevBtnDisabled = isSameMonth(month, minDate) || isBefore(month, minDate);

  $: isOptionDisabled = mo =>
    isBefore(mo, minDate) ||
    (!isSameMonth(mo, minDate) && isAfter(mo, maxDate));
</script>

<style>
  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>

<div>
  <button
    class="select"
    aria-disabled={prevBtnDisabled}
    disabled={prevBtnDisabled}
    type="button"
    on:click={() => disptachEvent('previousMonth')}
    aria-label={`Previous month, ${format(previousMonth, 'MMMM yyyy', {
      locale
    })}`}>
    {previousIcon}
  </button>
  <span>
    {#if monthDropdown}
      <select
        class="select"
        bind:value={selectedMonth}
        on:change={() => disptachEvent('pageChange', {
            incrementAmount: differenceInCalendarMonths(
              selectedMonth.value,
              month
            )
          })}>
        {#each months as mo}
          <option
            value={mo}
            selected={isSameMonth(mo.value, month)}
            disabled={isOptionDisabled(mo.value)}>
            {mo.text}
          </option>
        {/each}
      </select>
    {:else}
      <span>{format(month, 'MMMM', { locale })}</span>
    {/if}
    {#if yearDropdown}
      <select
        class="select"
        bind:value={selectedYear}
        on:change={() => disptachEvent('pageChange', {
            incrementAmount:
              differenceInCalendarYears(selectedYear.value, month) * 12
          })}>
        {#each years as yr}
          <option
            value={yr}
            selected={isSameYear(yr.value, month)}
            disabled={isOptionDisabled(yr.value)}>
            {yr.text}
          </option>
        {/each}
      </select>
    {:else}
      <span>{format(month, 'yyyy', { locale })}</span>
    {/if}
  </span>
  <button
    class="select"
    aria-disabled={nextBtnDisabled}
    disabled={nextBtnDisabled}
    type="button"
    on:click={() => disptachEvent('nextMonth')}
    aria-label={`Next month, ${format(nextMonth, 'MMMM yyyy', { locale })}`}>
    {nextIcon}
  </button>
</div>
