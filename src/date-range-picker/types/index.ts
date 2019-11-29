export type GetDayMetaDataParams = {
  date: Date;
  endDate: Date;
  events: Date[];
  hoverDate: Date;
  month: Date;
  singlePicker: boolean;
  startDate: Date;
  today: Date;
  locale: Locale;
  firstDayOfWeek: string;
  maxDate: Date;
  minDate: Date;
  disabledDates: Date[];
};

export type Day = {
  date: Date;
  events: Date[];
  isToday: boolean;
  isWeekend: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  isStartDate: boolean;
  isDisabled: boolean;
  isEndDate: boolean;
  isWithinSelection: boolean;
};
