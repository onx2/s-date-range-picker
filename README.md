# svelte-date-range-picker

[![CircleCI](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master.svg?style=svg)](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master) A date range picker built in SvelteJS

# Getting Started

- Consuming the component

# API

## Props / Options

- `autoApply` (boolean) _WIP_
- `dateFormat` (string)
- `disabled` (boolean)
- `disabledDates` (Date[])
- `endDate` (Date)
- `events` (Date[]) _WIP_
- `firstDayOfWeek` (string)
- `hideOnCancel` (boolean)
- `hideOnApply` (boolean)
- `isoWeekNumbers` (boolean) _WIP_
- `locale` (Locale)
- `maxDate` (Date) _WIP_
- `maxSpan` (number) - in days  _WIP_
- `minDate` (Date) _WIP_
- `monthDropdown` (boolean) _WIP_
- `monthFormat` (string)
- `predefinedRanges` (Date[]) _WIP_
- `rtl` (boolean) _WIP_
- `singlePicker` (boolean) _WIP_
- `startDate` (Date)
- `timePicker` (boolean) _WIP_
- `timePicker24Hour` (boolean) _WIP_
- `timePickerIncrement` (number) _WIP_
- `timePickerSeconds` (boolean) _WIP_
- `today` (Date) _WIP_
- `weekGuides` (boolean) _WIP_
- `weekNumbers` (boolean) _WIP_
- `yearDropdown` (boolean) _WIP_

## Events

- `show` Fired after the picker has been shown
- `hide` Fired after the picker has been hidden
- `selection` Fired when a selection is made (start or end date has been chosen)
- `cancel` Fired when the "Cancel" button is clicked
- `apply` Fired when the "Apply" button is clicked

Thanks [YogliB](https://github.com/YogliB/svelte-component-template) for the [Svelte](https://svelte.dev/) component template!
