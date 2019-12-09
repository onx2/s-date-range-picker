<script>
  import { createEventDispatcher } from 'svelte'
  import {
    endOfDay,
    isAfter,
    isBefore,
    isSameHour,
    isSameMinute,
    isSameSecond,
    startOfDay
  } from 'date-fns'
  import { pad, roundDown } from '../utils'

  export let btnClass
  // Start or end date
  export let dateReference
  export let maxDate
  export let minDate
  export let minuteIncrement
  export let secondIncrement
  export let selectClass
  export let timePickerControls
  export let timePicker24Hour
  export let timePickerSeconds

  const dispatchEvent = createEventDispatcher()

  $: selectedHour = dateReference.getHours()
  $: selectedMinute = dateReference.getMinutes()
  $: selectedSecond = dateReference.getSeconds()
  $: endOfDateReferenceDay = endOfDay(dateReference)
  $: hours = [...Array(timePicker24Hour ? 24 : 12)].map((_, i) => pad(i))
  $: minutes = [...Array(60 / minuteIncrement)].map((_, i) =>
    pad(i * minuteIncrement)
  )
  $: seconds = [...Array(60 / secondIncrement)].map((_, i) =>
    pad(i * secondIncrement)
  )
  $: isFirstAvailableTime = isSameSecond(
    dateReference,
    startOfDay(dateReference)
  )
  $: isLastAvailableTime = isSameSecond(
    dateReference,
    new Date(
      endOfDateReferenceDay.getFullYear(),
      endOfDateReferenceDay.getMonth(),
      endOfDateReferenceDay.getDate(),
      endOfDateReferenceDay.getHours(),
      roundDown(endOfDateReferenceDay.getMinutes(), minuteIncrement),
      roundDown(endOfDateReferenceDay.getSeconds(), secondIncrement)
    )
  )
  $: isHourOptionDisabled = hours => {
    const date = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth(),
      dateReference.getDate(),
      parseInt(hours)
    )
    return (
      (!isSameHour(date, minDate) && isBefore(date, minDate)) ||
      (!isSameHour(date, minDate) && isAfter(date, maxDate))
    )
  }

  $: isMinuteOptionDisabled = minutes => {
    const date = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth(),
      dateReference.getDate(),
      parseInt(selectedHour),
      parseInt(minutes)
    )
    return (
      (!isSameMinute(date, minDate) && isBefore(date, minDate)) ||
      (!isSameMinute(date, minDate) && isAfter(date, maxDate))
    )
  }
</script>

<div class="space-center">
  {#if timePickerControls}
    <button
      aria-disabled={isFirstAvailableTime}
      aria-label="First available time"
      class={btnClass}
      disabled={isFirstAvailableTime}
      on:click={() => dispatchEvent('timeChange', {
          hours: parseInt(hours[0]),
          minutes: parseInt(minutes[0]),
          seconds: parseInt(seconds[0])
        })}
      title="First available time"
      type="button">
      {@html '&#8643;'}
    </button>
  {/if}
  <select
    aria-label="Hour select"
    value={selectedHour}
    class={selectClass}
    on:change={e => dispatchEvent('timeChange', {
        hours: e.target.value,
        minutes: selectedMinute,
        seconds: timePickerSeconds ? selectedSecond : 0
      })}
    title={`${selectedHour} hours`}>
    {#each hours as hour}
      <option value={parseInt(hour)} disabled={isHourOptionDisabled(hour)}>
        {hour}
      </option>
    {/each}
  </select>
  <select
    aria-label="Minute select"
    value={selectedMinute}
    class={selectClass}
    on:change={e => dispatchEvent('timeChange', {
        hours: selectedHour,
        minutes: e.target.value,
        seconds: timePickerSeconds ? selectedSecond : 0
      })}
    title={`${selectedMinute} minutes`}>
    {#each minutes as minute}
      <option
        value={parseInt(minute)}
        disabled={isMinuteOptionDisabled(minute)}>
        {minute}
      </option>
    {/each}
  </select>
  {#if timePickerSeconds}
    <select
      aria-label="Second select"
      value={selectedSecond}
      class={selectClass}
      on:change={e => dispatchEvent('timeChange', {
          hours: selectedHour,
          minutes: selectedMinute,
          seconds: e.target.value
        })}
      title={`${selectedSecond} seconds`}>
      {#each seconds as second}
        <option value={parseInt(second)}>{second}</option>
      {/each}
    </select>
  {/if}

  <!-- {#if !timePicker24Hour}
    <select class="form-field">
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  {/if} -->

  {#if timePickerControls}
    <button
      aria-disabled={isLastAvailableTime}
      aria-label="Last available time"
      class={btnClass}
      disabled={isLastAvailableTime}
      on:click={() => dispatchEvent('timeChange', {
          hours: parseInt(hours[hours.length - 1]),
          minutes: parseInt(minutes[minutes.length - 1]),
          seconds: parseInt(seconds[seconds.length - 1])
        })}
      title="Last available time"
      type="button">
      {@html '&#8638;'}
    </button>
  {/if}
</div>
