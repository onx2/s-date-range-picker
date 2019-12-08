<script>
  import { createEventDispatcher } from 'svelte'
  import { endOfDay, isSameSecond, startOfDay } from 'date-fns'
  import { pad, roundDown } from '../utils'

  export let dateReference
  export let minuteIncrement
  export let secondIncrement
  export let timePickerControls
  export let timePicker24Hour
  export let timePickerSeconds

  const dispatchEvent = createEventDispatcher()
  let selectedHour = dateReference.getHours()
  let selectedMinute = dateReference.getMinutes()
  let selectedSecond = dateReference.getSeconds()

  $: endOfDateReferenceDay = endOfDay(dateReference)
  $: hours = [...Array(timePicker24Hour ? 24 : 12)].map((_, i) => pad(i))
  $: minutes = [...Array(60 / minuteIncrement)].map((_, i) =>
    pad(i * minuteIncrement)
  )
  $: seconds = [...Array(60 / secondIncrement)].map((_, i) =>
    pad(i * secondIncrement)
  )
  $: isFirstAvailableTime =
    timePickerControls && isSameSecond(dateReference, startOfDay(dateReference))
  $: isLastAvailableTime =
    timePickerControls &&
    isSameSecond(
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

  /** @todo Handle am/pm times */
  const timeChange = () =>
    dispatchEvent('timeChange', {
      hours: selectedHour,
      minutes: selectedMinute,
      seconds: timePickerSeconds ? selectedSecond : 0
    })

  const timeChangeStartOfDay = () => {
    selectedHour = hours[0]
    selectedMinute = minutes[0]
    selectedSecond = seconds[0]

    timeChange()
  }

  function timeChangeEndOfDay() {
    selectedHour = hours[hours.length - 1]
    selectedMinute = minutes[minutes.length - 1]
    selectedSecond = seconds[seconds.length - 1]

    timeChange()
  }
</script>

<div class="space-center">
  {#if timePickerControls}
    <button
      aria-disabled={isFirstAvailableTime}
      aria-label="First available time"
      class="form-field"
      disabled={isFirstAvailableTime}
      on:click={timeChangeStartOfDay}
      title="First available time"
      type="button">
      {@html '&#8643;'}
    </button>
  {/if}
  <select
    bind:value={selectedHour}
    class="form-field"
    on:change={timeChange}
    title={`${selectedHour} hours`}>
    {#each hours as hour}
      <option value={parseInt(hour)}>{hour}</option>
    {/each}
  </select>
  <select
    bind:value={selectedMinute}
    class="form-field"
    on:change={timeChange}
    title={`${selectedMinute} minutes`}>
    {#each minutes as minute}
      <option value={parseInt(minute)}>{minute}</option>
    {/each}
  </select>
  {#if timePickerSeconds}
    <select
      bind:value={selectedSecond}
      class="form-field"
      on:change={timeChange}
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
      class="form-field"
      disabled={isLastAvailableTime}
      on:click={timeChangeEndOfDay}
      title="Last available time"
      type="button">
      {@html '&#8638;'}
    </button>
  {/if}
</div>
