<script>
  import { createEventDispatcher } from "svelte";
  import { pad, roundTo } from "../utils";
  export let minuteIncrement;
  export let secondIncrement;
  export let timePicker24Hour;
  export let timePickerSeconds;
  export let dateReference;

  const dispatchEvent = createEventDispatcher();

  $: selectedHour = dateReference.getHours();
  $: selectedMinute = roundTo(dateReference.getMinutes(), minuteIncrement);
  $: selectedSecond = roundTo(dateReference.getSeconds(), secondIncrement);

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

    dispatchEvent("timeChange", { ...detail });
  }
</script>

<style>
  div {
    padding: 8px 0;
    flex: 1;
    justify-content: center;
    display: flex;
  }
  select {
    padding: 8px 12px;
    background-color: transparent;
    border-radius: 4px;
    margin: 4px;
  }
</style>

<div>
  <select bind:value={selectedHour} on:change={timeChange}>
    {#each hours as hour}
      <option value={hour}>{hour}</option>
    {/each}
  </select>
  <select bind:value={selectedMinute} on:change={timeChange}>
    {#each minutes as minute}
      <option value={minute}>{minute}</option>
    {/each}
  </select>
  {#if timePickerSeconds}
    <select bind:value={selectedSecond} on:change={timeChange}>
      {#each seconds as second}
        <option value={second}>{second}</option>
      {/each}
    </select>
  {/if}

  {#if !timePicker24Hour}
    <select>
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  {/if}
</div>
