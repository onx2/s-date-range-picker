# s-date-range-picker (pre-alpha)

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
## Current look
![Svelte Date Range Picker 2019-11-30](https://i.ibb.co/wSnckY9/Screenshot-from-2019-11-30-17-29-57.png)

## Todos
- [ ] Add the missing Props / Options
- [ ] Tests
- [ ] Linter
- [ ] Styling
- [ ] Show & hide functionality _(probably in the form of a button w/ popover)_
- [ ] Documentation / Demo Site
- [x] Publish to npm
- [ ] Mobile / touch friendly
- [ ] Optimizations / reduce bundle size

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

- [x] `autoApply` (boolean)
- [x] `dateFormat` (string) [options](https://date-fns.org/v2.8.1/docs/format)
- [ ] `disabled` (boolean)
- [x] `disabledDates` (Date[])
- [x] `endDate` (Date)
- [ ] `events` (Date[])
- [x] `firstDayOfWeek` (string)
- [x] `hideOnCancel` (boolean)
- [x] `hideOnApply` (boolean)
- [x] `isoWeekNumbers` (boolean)
- [x] `locale` (Locale)
- [x] `maxDate` (Date)
- [ ] `maxSpan` (number) - in days
- [x] `minDate` (Date)
- [x] `monthDropdown` (boolean)
- [x] `monthFormat` (string) [options](https://date-fns.org/v2.8.1/docs/format)
- [ ] `predefinedRanges` (Date[])
- [x] `rtl` (boolean)
- [x] `singlePicker` (boolean)
- [x] `startDate` (Date)
- [x] `timePicker` (boolean)
- [ ] `timePicker24Hour` (boolean)
- [x] `timePickerIncrement` (number)
- [x] `timePickerSeconds` (boolean)
- [x] `today` (Date)
- [x] `weekGuides` (boolean)
- [x] `weekNumbers` (boolean)
- [x] `yearDropdown` (boolean)
- [x] `applyBtnText` (string)
- [x] `cancelBtnText` (string)
- [x] `todayBtnText` (string)
- [x] `todayBtn` (boolean)
- [x] `resetViewBtnText` (string)
- [x] `resetViewBtn` (boolean)
- [x] `id` (string)
### Events

- `show` Fired after the picker has been shown
- `hide` Fired after the picker has been hidden
- `selection` Fired when a selection is made (start or end date has been chosen)
- `cancel` Fired when the "Cancel" button is clicked
- `apply` Fired when the "Apply" button is clicked

___

Thanks [geakstr](https://github.com/geakstr/svelte-3-rollup-typescript-vscode) for the [Svelte](https://svelte.dev/) component template!

This project is using [date-fns](https://date-fns.org/) under the hood for date calculations / manipulation.
