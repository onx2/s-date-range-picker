# s-date-range-picker (alpha)

[![CircleCI](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master.svg?style=svg)](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master) A date range picker built in SvelteJS

## Getting Started

**In a Svelte App**

- npm: `npm i s-date-range-picker`
- yarn: `yarn add s-date-range-picker`

```
<script>
  import SDateRangePicker from "s-date-range-picker";
  
  // Manage start and end props from main app component
  let startDate = new Date();
  let endDate = new Date();
  
  // Update state on apply event
  function onApply({ detail }) {
    startDate = detail.startDate;
    endDate = detail.endDate;
  }
</script>

<SDateRangePicker {startDate} {endDate} on:apply={onApply} />
```
## Screenshot (defaults)
![Svelte Date Range Picker 2019-11-30](https://i.ibb.co/fktvn56/Screenshot-from-2019-12-01-17-47-59.png)

## Todos
- [x] Publish to npm
- [ ] Add the missing Props / Options
- [ ] Tests
- [ ] Linter
- [ ] Styling
- [ ] Show & hide functionality _(probably in the form of a button w/ popover)_
- [ ] Documentation / Demo Site
- [ ] Mobile / touch friendly
- [ ] Optimizations / reduce bundle size
- [ ] Accessibility review / updates

## Development
- Requires [NodeJS](https://nodejs.org/)
- Clone the repo: `git clone https://github.com/onx2/svelte-date-range-picker.git`
- Enter directory: `cd svelte-date-range-picker`
- Install dpendencies: `yarn`
- Run dev web server: `yarn serve`
- Run tests: `yarn test` _(No tests yet)_
- Run linter: `yarn lint` _(No linter yet)_

## API

### Props / Options
**Implemented but still being reviewed / developed**
- [x] `autoApply = false` (boolean)
- [x] `dateFormat = "MMM dd, yyyy"` (string) [options](https://date-fns.org/v2.8.1/docs/format)
- [x] `disabledDates = []` (Date[])
- [x] `endDate = endOfWeek(new Date())` (Date)
- [x] `firstDayOfWeek = "sunday"` (string)
- [x] `hideOnCancel = false` (boolean)
- [x] `hideOnApply = false` (boolean)
- [x] `isoWeekNumbers = false` (boolean)
- [x] `locale = undefined` (Locale) `date-fns` defaults to the system locale.
- [x] `maxDate = addYears(new Date(), 10)` (Date)
- [x] `minDate = subYears(new Date(), 10)` (Date)
- [x] `monthDropdown = false` (boolean)
- [x] `monthFormat = "MMMM"` (string) [options](https://date-fns.org/v2.8.1/docs/format)
- [x] `rtl = false` (boolean)
- [x] `singlePicker = false` (boolean)
- [x] `startDate = startOfWeek(new Date())` (Date)
- [x] `timePicker = false` (boolean)
- [x] `timePickerIncrement = 1` (number)
- [x] `timePickerSeconds = false` (boolean)
- [x] `today = new Date()` (Date) Used as a reference in `predefinedRanges` and for underlining in calendar
- [x] `prevIcon = "&#9666;"` (html | string) - ◂
- [x] `nextIcon = "&#9656;"` (html | string) - ▸
- [x] `weekGuides = false` (boolean) Distance in calendar weeks from today
- [x] `weekNumbers = false` (boolean) Local week numbers
- [x] `yearDropdown = false` (boolean)
- [x] `applyBtnText = "Apply"` (string)
- [x] `cancelBtnText = "Camcel"` (string)
- [x] `todayBtnText = "Today"` (string)
- [x] `todayBtn = false` (boolean)
- [x] `timePickerControls = false` (boolean)
- [x] `resetViewBtnText = "&#8602;"` (html | string) - ↚
- [x] `resetViewBtn = false` (boolean)
- [x] `id = "s-date-range-picker-" + Math.random()` (string)

**Not implemented - todo**
- [ ] `timePicker24Hour = true` (boolean)
- [ ] `predefinedRanges = []` (Date[])
- [ ] `maxSpan = Infinity` (number)
- [ ] `events = []` (Date[])
- [ ] `disabled = false` (boolean)

### Events

- [ ] `show` Fired after the picker has been shown
- [ ] `hide` Fired after the picker has been hidden
- [x] `selection` Fired when a selection is made (start or end date has been chosen)
- [x] `cancel` Fired when the "Cancel" button is clicked
- [x] `apply` Fired when the "Apply" button is clicked

___

Thanks [geakstr](https://github.com/geakstr/svelte-3-rollup-typescript-vscode) for the [Svelte](https://svelte.dev/) component template!

This project is using [date-fns](https://date-fns.org/) under the hood for date calculations / manipulation.
