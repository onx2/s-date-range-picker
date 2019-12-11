<script>
  /**
   * USED FOR DEVELOPMENT OF COMPONENT ONLY.
   *
   * Using a svelte wrapper component to manage state allows for svelte-style
   * reactivity, rather than using foobar.$on() and foobar.$set()
   */
  import {
    addHours,
    endOfWeek,
    startOfWeek,
    startOfDay,
    endOfDay
  } from 'date-fns'
  import * as locales from 'date-fns/locale'
  import SDateRangePicker from './date-range-picker/SDateRangePicker.svelte'

  const random = false

  const localesArray = Object.keys(locales).map(i => locales[i])
  const locale = random
    ? localesArray[Math.floor(Math.random() * localesArray.length)]
    : undefined
  const singlePicker = false
  let startDate = singlePicker
    ? startOfDay(new Date())
    : startOfWeek(new Date())
  let endDate = singlePicker ? startDate : endOfWeek(new Date())
  let monthDropdown = random ? Boolean(Math.floor(Math.random() * 2)) : true
  let yearDropdown = random ? Boolean(Math.floor(Math.random() * 2)) : true
  let todayBtn = random ? Boolean(Math.floor(Math.random() * 2)) : true
  let resetViewBtn = random ? Boolean(Math.floor(Math.random() * 2)) : true
  const maxDate = addHours(endDate, 3)

  function onApply({ detail }) {
    startDate = detail.startDate
    endDate = detail.endDate
    console.log('onApply: ', detail, maxDate)
  }
</script>

<style lang="scss" global>
  @import "src/date-range-picker/themes/s-date-range-picker.default.scss";
</style>

<SDateRangePicker
  {maxDate}
  weekGuides
  weekNumbers
  {maxDate}
  todayBtn
  {locale}
  twoPages
  resetViewBtn
  timePicker={false}
  timePickerSeconds
  timePickerControls
  startDate={startDate}
  endDate={endDate}
  on:apply={onApply} />
