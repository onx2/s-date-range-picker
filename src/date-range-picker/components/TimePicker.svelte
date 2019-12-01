<script>
  import { createEventDispatcher } from "svelte";
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
  function timeChange() {
    const detail = {
      hours: selectedHour,
      minutes: selectedMinute
    };
    detail.seconds = timePickerSeconds ? selectedSecond : 0;

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
  <select class="select" bind:value={selectedHour} on:change={timeChange}>
    {#each hours as hour}
      <option value={parseInt(hour)}>{hour}</option>
    {/each}
  </select>
  <select class="select" bind:value={selectedMinute} on:change={timeChange}>
    {#each minutes as minute}
      <option value={parseInt(minute)}>{minute}</option>
    {/each}
  </select>
  {#if timePickerSeconds}
    <select class="select" bind:value={selectedSecond} on:change={timeChange}>
      {#each seconds as second}
        <option value={parseInt(second)}>{second}</option>
      {/each}
    </select>
  {/if}

  <!-- {#if !timePicker24Hour}
    <select class="select">
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  {/if} -->
</div>
