<script>
  import { createEventDispatcher } from "svelte"
  import {
    addMonths,
    differenceInCalendarMonths,
    differenceInCalendarYears,
    isAfter,
    isBefore,
    isSameMonth,
    isSameYear,
    subMonths
  } from "date-fns"
  import { buildMonthDropdown, buildYearDropdown, localeFormat } from "../utils"

  export let btnClass
  export let month
  export let monthFormat
  export let monthDropdown
  export let maxDate
  export let minDate
  export let nextIcon
  export let pageNum
  export let prevIcon
  export let selectClass
  export let yearDropdown

  const disptachEvent = createEventDispatcher()

  let selectedMonth = {
    value: month,
    text: localeFormat(month, monthFormat)
  }
  let selectedYear = { value: month, text: localeFormat(month, "yyyy") }

  $: prevMonth = subMonths(month, 1)
  $: nextMonth = addMonths(month, 1)
  // $: isMax = isAfter(month, maxDate) || isSameMonth(month, maxDate)
  // $: isMin = isBefore(month, minDate) || isSameMonth(month, minDate)
  $: months = buildMonthDropdown(month, monthFormat)
  $: years = buildYearDropdown(minDate, maxDate, pageNum)

  /** @todo Simplify disabling logic */
  $: nextBtnDisabled = isSameMonth(month, maxDate) || isAfter(month, maxDate)
  $: prevBtnDisabled = isSameMonth(month, minDate) || isBefore(month, minDate)

  $: isOptionDisabled = mo =>
    (!isSameMonth(mo, minDate) && isBefore(mo, minDate)) ||
    (!isSameMonth(mo, minDate) && isAfter(mo, maxDate))
</script>

<div class="space-between">
  <button
    aria-disabled={prevBtnDisabled}
    aria-label={`Previous month, ${localeFormat(prevMonth, "MMMM yyyy")}`}
    class={btnClass}
    disabled={prevBtnDisabled}
    on:click={() => disptachEvent("prevMonth")}
    title={`Previous month, ${localeFormat(prevMonth, "MMMM yyyy")}`}
    type="button">
    {@html prevIcon}
  </button>
  <span>
    {#if monthDropdown}
      <select
        aria-label="Month select"
        bind:value={selectedMonth}
        class={selectClass}
        on:change={() => disptachEvent("pageChange", {
            incrementAmount: differenceInCalendarMonths(
              selectedMonth.value,
              month
            )
          })}>
        {#each months as mo}
          <option
            disabled={isOptionDisabled(mo.value)}
            selected={isSameMonth(mo.value, month)}
            value={mo}>
            {mo.text}
          </option>
        {/each}
      </select>
    {:else}
      <small>{localeFormat(month, "MMMM")}</small>
    {/if}
    {#if yearDropdown}
      <select
        aria-label="Year select"
        bind:value={selectedYear}
        class={selectClass}
        on:change={() => disptachEvent("pageChange", {
            incrementAmount:
              differenceInCalendarYears(selectedYear.value, month) * 12
          })}>
        {#each years as yr}
          <option
            disabled={isOptionDisabled(yr.value)}
            selected={isSameYear(yr.value, month)}
            value={yr}>
            {yr.text}
          </option>
        {/each}
      </select>
    {:else}
      <small>{localeFormat(month, "yyyy")}</small>
    {/if}
  </span>
  <button
    aria-disabled={nextBtnDisabled}
    aria-label={`Next month, ${localeFormat(nextMonth, "MMMM yyyy")}`}
    class={btnClass}
    disabled={nextBtnDisabled}
    on:click={() => disptachEvent("nextMonth")}
    title={`Next month, ${localeFormat(nextMonth, "MMMM yyyy")}`}
    type="button">
    {@html nextIcon}
  </button>
</div>
