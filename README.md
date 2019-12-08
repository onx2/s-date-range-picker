# s-date-range-picker (alpha)

[![CircleCI](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master.svg?style=svg)](https://circleci.com/gh/onx2/svelte-date-range-picker/tree/master) A date range picker built in SvelteJS

## Getting Started

**In a Svelte App**

- npm: `npm i s-date-range-picker`
- yarn: `yarn add s-date-range-picker`

```svelte
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

## Development

- Requires [NodeJS](https://nodejs.org/)
- Clone the repo: `git clone https://github.com/onx2/svelte-date-range-picker.git`
- Enter directory: `cd svelte-date-range-picker`
- Install dpendencies: `yarn`
- Run dev web server: `yarn serve`
- Run tests: `yarn test` _(No tests yet)_
- Run format: `yarn format`
- Run linter: `yarn lint`
- Run build: `yarn build`

## API

### Props / Options
```javascript
applyBtnText = "Apply"; // (string)
cancelBtnText = "Camcel"; // (string)
dateFormat = "MMM dd, yyyy"; // (string) [options](https://date-fns.org/v2.8.1/docs/format)
disabledDates = []; // (Date[])
endDate = endOfWeek(new Date()); // (Date)
firstDayOfWeek = "sunday"; // (string)
isoWeekNumbers = false; // (boolean)
locale = undefined; // (Locale) date-fns defaults to the system locale.
maxDate = addYears(new Date(), 10); // (Date)
minDate = subYears(new Date(), 10); // (Date)
monthDropdown = false; // (boolean)
monthFormat = "MMMM"; // (string) [options](https://date-fns.org/v2.8.1/docs/format)
nextIcon = "&#9656;"; // (html | string) - ▸
prevIcon = "&#9666;"; // (html | string) - ◂
resetViewBtn = false; // (boolean)
resetViewBtnText = "&#8602;"; // (html | string) - ↚
rtl = false; // (boolean)
singlePicker = false; // (boolean)
startDate = startOfWeek(new Date()); // (Date)
timePicker = false; // (boolean)
timePickerControls = false; // (boolean)
timePickerIncrement = 1; // (number)
timePickerSeconds = false; // (boolean)
today = new Date(); // (Date) Used as a reference in predefinedRanges and for underlining in calendar
todayBtn = false; // (boolean)
todayBtnText = "Today"; // (string)
weekGuides = false; // (boolean) Distance in calendar weeks from today
weekNumbers = false; // (boolean) Local week numbers
yearDropdown = false; // (boolean)
```

### Events
- [x] `selection` Fired when a selection is made (start or end date has been chosen)
- [x] `cancel` Fired when the "Cancel" button is clicked
- [x] `apply` Fired when the "Apply" button is clicked

---

Thanks [geakstr](https://github.com/geakstr/svelte-3-rollup-typescript-vscode) for the [Svelte](https://svelte.dev/) component template!

This project is using [date-fns](https://date-fns.org/) under the hood for date calculations / manipulation.
