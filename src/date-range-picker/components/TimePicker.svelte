<script>
  import { createEventDispatcher } from "svelte";
  import { isSameSecond, startOfDay, endOfDay } from "date-fns";
  import { pad, roundDown } from "../utils";

  export let minuteIncrement;
  export let secondIncrement;
  export let timePicker24Hour;
  export let timePickerSeconds;
  export let dateReference;

  const dispatchEvent = createEventDispatcher();

  $: selectedHour = dateReference.getHours();
  $: selectedMinute = dateReference.getMinutes();
  $: selectedSecond = dateReference.getSeconds();

  $: hours = [...Array(timePicker24Hour ? 24 : 12)].map((_, i) => pad(i));
  $: minutes = [...Array(60 / minuteIncrement)].map((_, i) =>
    pad(i * minuteIncrement)
  );
  $: seconds = [...Array(60 / secondIncrement)].map((_, i) =>
    pad(i * secondIncrement)
  );

  /** @todo Handle am/pm times */
  const timeChange = () => {
    const detail = {
      hours: selectedHour,
      minutes: selectedMinute
    };
    detail.seconds = timePickerSeconds ? selectedSecond : 0;

    dispatchEvent("timeChange", detail);
  };

  $: isFirstAvailableTime = isSameSecond(
    dateReference,
    startOfDay(dateReference)
  );
  $: isLastAvailableTime = isSameSecond(dateReference, endOfDay(dateReference));

  const timeChangeStartOfDay = () => {
    selectedHour = hours[0];
    selectedMinute = minutes[0];
    selectedSecond = seconds[0];

    const detail = {
      hours: selectedHour,
      minutes: selectedMinute,
      seconds: selectedSecond
    };

    dispatchEvent("timeChange", detail);
  };

  function timeChangeEndOfDay() {
    selectedHour = hours[hours.length - 1];
    selectedMinute = minutes[minutes.length - 1];
    selectedSecond = seconds[seconds.length - 1];

    const detail = {
      hours: selectedHour,
      minutes: selectedMinute,
      seconds: selectedSecond
    };

    dispatchEvent("timeChange", detail);
  }
</script>

<style>
  div {
    padding: 8px 0;
    flex: 1;
    justify-content: center;
    display: flex;
  }
</style>

<div>

  <button
    aria-label="Last first time"
    type="button"
    class="form-field"
    disabled={isFirstAvailableTime}
    aria-disabled={isFirstAvailableTime}
    on:click={timeChangeStartOfDay}>
    {@html '&#8643;'}
  </button>
  <select class="form-field" bind:value={selectedHour} on:change={timeChange}>
    {#each hours as hour}
      <option value={parseInt(hour)}>{hour}</option>
    {/each}
  </select>
  <select class="form-field" bind:value={selectedMinute} on:change={timeChange}>
    {#each minutes as minute}
      <option value={parseInt(minute)}>{minute}</option>
    {/each}
  </select>
  {#if timePickerSeconds}
    <select
      class="form-field"
      bind:value={selectedSecond}
      on:change={timeChange}>
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

  <button
    aria-label="Last available time"
    type="button"
    class="form-field"
    disabled={isLastAvailableTime}
    aria-disabled={isLastAvailableTime}
    on:click={timeChangeEndOfDay}>
    {@html '&#8638;'}
  </button>
</div>
