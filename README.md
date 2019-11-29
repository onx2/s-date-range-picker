# svelte-date-range-picker (pre-alpha)

[![CircleCI](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master.svg?style=svg)](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master) A date range picker built in SvelteJS

## Getting Started

- Coming soon...

## Todos
- [ ] Missing Props / Options
- [ ] Tests
- [ ] Linter
- [x] Add TypeScript configuration
- [ ] Convert to TypeScript
- [ ] Documentation / Demo Site
- [ ] Publish to npm
- [ ] Mobile / touch friendly

## Development
- Requires [NodeJS](https://nodejs.org/)
- Clone the repo: `git clone https://github.com/onx2/svelte-date-range-picker.git`
- Enter directory: `cd svelte-date-range-picker`
- Install dpendencies: `npm install`
- Run dev web server: `npm run dev`
- Run tests: `npm run test`
- Run lint: `npm run lint`

## API

### Props / Options

- [x] `autoApply` (boolean)
- [x] `dateFormat` (string)
- [ ] `disabled` (boolean)
- [x] `disabledDates` (Date[])
- [x] `endDate` (Date)
- [ ] `events` (Date[])
- [x] `firstDayOfWeek` (string)
- [x] `hideOnCancel` (boolean)
- [x] `hideOnApply` (boolean)
- [x] `isoWeekNumbers` (boolean)
- [x] `locale` (Locale)
- [ ] `maxDate` (Date)
- [ ] `maxSpan` (number) - in days
- [ ] `minDate` (Date)
- [x] `monthDropdown` (boolean)
- [x] `monthFormat` (string)
- [ ] `predefinedRanges` (Date[])
- [ ] `rtl` (boolean)
- [x] `singlePicker` (boolean)
- [x] `startDate` (Date)
- [ ] `timePicker` (boolean)
- [ ] `timePicker24Hour` (boolean)
- [ ] `timePickerIncrement` (number)
- [ ] `timePickerSeconds` (boolean)
- [x] `today` (Date)
- [x] `weekGuides` (boolean)
- [x] `weekNumbers` (boolean)
- [ ] `yearDropdown` (boolean)

### Events

- `show` Fired after the picker has been shown
- `hide` Fired after the picker has been hidden
- `selection` Fired when a selection is made (start or end date has been chosen)
- `cancel` Fired when the "Cancel" button is clicked
- `apply` Fired when the "Apply" button is clicked

___

Thanks [YogliB](https://github.com/YogliB/svelte-component-template) for the [Svelte](https://svelte.dev/) component template!

This project is using [date-fns](https://date-fns.org/) under the hood for date calculations / manipulation.
