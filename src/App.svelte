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
  const maxDate = undefined

  function onApply({ detail }) {
    startDate = detail.startDate
    endDate = detail.endDate
    console.log('onApply: ', detail)
  }
</script>

<style lang="scss" global>
  @import "src/date-range-picker/themes/s-date-range-picker.default.scss";
</style>

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="170" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="170" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h117v20H0z"/><path fill="#e05d44" d="M117 0h53v20H117z"/><path fill="url(#b)" d="M0 0h170v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="595" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="1070">Coverage:branches</text><text x="595" y="140" transform="scale(.1)" textLength="1070">Coverage:branches</text><text x="1425" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="430">14.29%</text><text x="1425" y="140" transform="scale(.1)" textLength="430">14.29%</text></g> </svg>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="170" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="170" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h117v20H0z"/><path fill="#e05d44" d="M117 0h53v20H117z"/><path fill="url(#b)" d="M0 0h170v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="595" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="1070">Coverage:functions</text><text x="595" y="140" transform="scale(.1)" textLength="1070">Coverage:functions</text><text x="1425" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="430">20.83%</text><text x="1425" y="140" transform="scale(.1)" textLength="430">20.83%</text></g> </svg>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="146" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="146" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h93v20H0z"/><path fill="#e05d44" d="M93 0h53v20H93z"/><path fill="url(#b)" d="M0 0h146v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="475" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="830">Coverage:lines</text><text x="475" y="140" transform="scale(.1)" textLength="830">Coverage:lines</text><text x="1185" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="430">36.99%</text><text x="1185" y="140" transform="scale(.1)" textLength="430">36.99%</text></g> </svg>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="182" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="182" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h129v20H0z"/><path fill="#e05d44" d="M129 0h53v20H129z"/><path fill="url(#b)" d="M0 0h182v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="655" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="1190">Coverage:statements</text><text x="655" y="140" transform="scale(.1)" textLength="1190">Coverage:statements</text><text x="1545" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="430">38.16%</text><text x="1545" y="140" transform="scale(.1)" textLength="430">38.16%</text></g> </svg>

<SDateRangePicker
  {maxDate}
  weekGuides
  weekNumbers
  {maxDate}
  todayBtn
  {locale}
  twoPages
  resetViewBtn
  timePicker
  timePickerSeconds
  timePickerControls
  startDate={startDate}
  endDate={endDate}
  on:apply={onApply} />
