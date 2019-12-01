<script>
  import { createEventDispatcher } from "svelte";
  import {
    addMonths,
    differenceInCalendarMonths,
    differenceInCalendarYears,
    isAfter,
    isBefore,
    isSameMonth,
    subMonths,
    isSameYear,
    isWithinInterval
  } from "date-fns";
  import { buildMonths, buildYears, localeFormat } from "../utils";

  export let month;
  export let monthFormat;
  export let monthDropdown;
  export let maxDate;
  export let minDate;
  export let nextIcon;
  export let prevIcon;
  export let yearDropdown;

  const disptachEvent = createEventDispatcher();

  $: selectedMonth = {
    value: month,
    text: localeFormat(month, monthFormat)
  };
  $: selectedYear = { value: month, text: localeFormat(month, "yyyy") };
  $: prevMonth = subMonths(month, 1);
  $: nextMonth = addMonths(month, 1);
  $: isMaxDate = isAfter(month, maxDate) || isSameMonth(month, maxDate);
  $: isMinDate = isBefore(month, minDate) || isSameMonth(month, minDate);
  $: months = buildMonths({ month, monthFormat });
  $: years = buildYears({ minDate, maxDate });
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
    on:click={() => disptachEvent('prevMonth')}
    aria-label={`Previous month, ${localeFormat(prevMonth, 'MMMM yyyy')}`}>
    {@html prevIcon}
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
      <small>{localeFormat(month, 'MMMM')}</small>
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
      <small>{localeFormat(month, 'yyyy')}</small>
    {/if}
  </span>
  <button
    class="select"
    aria-disabled={nextBtnDisabled}
    disabled={nextBtnDisabled}
    type="button"
    on:click={() => disptachEvent('nextMonth')}
    aria-label={`Next month, ${localeFormat(nextMonth, 'MMMM yyyy')}`}>
    {@html nextIcon}
  </button>
</div>
