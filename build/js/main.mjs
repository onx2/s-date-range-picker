
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
function noop() { }
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_style(node, key, value) {
    node.style.setProperty(key, value);
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.shift()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        while (render_callbacks.length) {
            const callback = render_callbacks.pop();
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_render);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_render.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        remaining: 0,
        callbacks: []
    };
}
function check_outros() {
    if (!outros.remaining) {
        run_all(outros.callbacks);
    }
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.callbacks.push(() => {
            outroing.delete(block);
            if (callback) {
                block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, () => {
        lookup.delete(block.key);
    });
}
function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(changed, child_ctx);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_render } = component.$$;
    fragment.m(target, anchor);
    // onMount happens after the initial afterUpdate. Because
    // afterUpdate callbacks happen in reverse order (inner first)
    // we schedule onMount callbacks before afterUpdate callbacks
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_render.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        if (detaching)
            component.$$.fragment.d(1);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal: not_equal$$1,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_render: [],
        after_render: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_render);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

/**
 * @name toDate
 * @category Common Helpers
 * @summary Convert the given argument to an instance of Date.
 *
 * @description
 * Convert the given argument to an instance of Date.
 *
 * If the argument is an instance of Date, the function returns its clone.
 *
 * If the argument is a number, it is treated as a timestamp.
 *
 * If the argument is none of the above, the function returns Invalid Date.
 *
 * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
 *
 * @param {Date|Number} argument - the value to convert
 * @returns {Date} the parsed date in the local time zone
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Clone the date:
 * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Convert the timestamp to date:
 * const result = toDate(1392098430000)
 * //=> Tue Feb 11 2014 11:30:30
 */
function toDate(argument) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var argStr = Object.prototype.toString.call(argument); // Clone the date

  if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
    // Prevent the date to lose the milliseconds when passed to new Date() in IE10
    return new Date(argument.getTime());
  } else if (typeof argument === 'number' || argStr === '[object Number]') {
    return new Date(argument);
  } else {
    if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"); // eslint-disable-next-line no-console

      console.warn(new Error().stack);
    }

    return new Date(NaN);
  }
}

/**
 * @name isWeekend
 * @category Weekday Helpers
 * @summary Does the given date fall on a weekend?
 *
 * @description
 * Does the given date fall on a weekend?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to check
 * @returns {Boolean} the date falls on a weekend
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Does 5 October 2014 fall on a weekend?
 * var result = isWeekend(new Date(2014, 9, 5))
 * //=> true
 */

function isWeekend(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var day = date.getDay();
  return day === 0 || day === 6;
}

function toInteger(dirtyNumber) {
  if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
    return NaN;
  }

  var number = Number(dirtyNumber);

  if (isNaN(number)) {
    return number;
  }

  return number < 0 ? Math.ceil(number) : Math.floor(number);
}

/**
 * @name addDays
 * @category Day Helpers
 * @summary Add the specified number of days to the given date.
 *
 * @description
 * Add the specified number of days to the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of days to be added
 * @returns {Date} the new date with the days added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 10 days to 1 September 2014:
 * var result = addDays(new Date(2014, 8, 1), 10)
 * //=> Thu Sep 11 2014 00:00:00
 */

function addDays(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var amount = toInteger(dirtyAmount);
  date.setDate(date.getDate() + amount);
  return date;
}

/**
 * @name addMilliseconds
 * @category Millisecond Helpers
 * @summary Add the specified number of milliseconds to the given date.
 *
 * @description
 * Add the specified number of milliseconds to the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be added
 * @returns {Date} the new date with the milliseconds added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
 * var result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:30.750
 */

function addMilliseconds(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var timestamp = toDate(dirtyDate).getTime();
  var amount = toInteger(dirtyAmount);
  return new Date(timestamp + amount);
}

/**
 * @name startOfWeek
 * @category Week Helpers
 * @summary Return the start of a week for the given date.
 *
 * @description
 * Return the start of a week for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the start of a week
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 *
 * @example
 * // The start of a week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
 * //=> Mon Sep 01 2014 00:00:00
 */

function startOfWeek(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
  var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
  var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }

  var date = toDate(dirtyDate);
  var day = date.getDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @name startOfISOWeek
 * @category ISO Week Helpers
 * @summary Return the start of an ISO week for the given date.
 *
 * @description
 * Return the start of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of an ISO week
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of an ISO week for 2 September 2014 11:55:00:
 * var result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */

function startOfISOWeek(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  return startOfWeek(dirtyDate, {
    weekStartsOn: 1
  });
}

/**
 * @name getISOWeekYear
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the ISO week-numbering year of the given date.
 *
 * @description
 * Get the ISO week-numbering year of the given date,
 * which always starts 3 days before the year's first Thursday.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * - The function was renamed from `getISOYear` to `getISOWeekYear`.
 *   "ISO week year" is short for [ISO week-numbering year](https://en.wikipedia.org/wiki/ISO_week_date).
 *   This change makes the name consistent with
 *   locale-dependent week-numbering year helpers, e.g., `getWeekYear`.
 *
 * @param {Date|Number} date - the given date
 * @returns {Number} the ISO week-numbering year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Which ISO-week numbering year is 2 January 2005?
 * var result = getISOWeekYear(new Date(2005, 0, 2))
 * //=> 2004
 */

function getISOWeekYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var year = date.getFullYear();
  var fourthOfJanuaryOfNextYear = new Date(0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  var startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  var fourthOfJanuaryOfThisYear = new Date(0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  var startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

/**
 * @name startOfISOWeekYear
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the start of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the start of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of an ISO week-numbering year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of an ISO week-numbering year for 2 July 2005:
 * var result = startOfISOWeekYear(new Date(2005, 6, 2))
 * //=> Mon Jan 03 2005 00:00:00
 */

function startOfISOWeekYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var year = getISOWeekYear(dirtyDate);
  var fourthOfJanuary = new Date(0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  var date = startOfISOWeek(fourthOfJanuary);
  return date;
}

var MILLISECONDS_IN_MINUTE = 60000;
/**
 * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
 * They usually appear for dates that denote time before the timezones were introduced
 * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
 * and GMT+01:00:00 after that date)
 *
 * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
 * which would lead to incorrect calculations.
 *
 * This function returns the timezone offset in milliseconds that takes seconds in account.
 */

function getTimezoneOffsetInMilliseconds(dirtyDate) {
  var date = new Date(dirtyDate.getTime());
  var baseTimezoneOffset = Math.ceil(date.getTimezoneOffset());
  date.setSeconds(0, 0);
  var millisecondsPartOfTimezoneOffset = date.getTime() % MILLISECONDS_IN_MINUTE;
  return baseTimezoneOffset * MILLISECONDS_IN_MINUTE + millisecondsPartOfTimezoneOffset;
}

/**
 * @name startOfDay
 * @category Day Helpers
 * @summary Return the start of a day for the given date.
 *
 * @description
 * Return the start of a day for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a day
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a day for 2 September 2014 11:55:00:
 * var result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 00:00:00
 */

function startOfDay(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @name getDaysInMonth
 * @category Month Helpers
 * @summary Get the number of days in a month of the given date.
 *
 * @description
 * Get the number of days in a month of the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the given date
 * @returns {Number} the number of days in a month
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // How many days are in February 2000?
 * var result = getDaysInMonth(new Date(2000, 1))
 * //=> 29
 */

function getDaysInMonth(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var year = date.getFullYear();
  var monthIndex = date.getMonth();
  var lastDayOfMonth = new Date(0);
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
  lastDayOfMonth.setHours(0, 0, 0, 0);
  return lastDayOfMonth.getDate();
}

/**
 * @name addMonths
 * @category Month Helpers
 * @summary Add the specified number of months to the given date.
 *
 * @description
 * Add the specified number of months to the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be added
 * @returns {Date} the new date with the months added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 5 months to 1 September 2014:
 * var result = addMonths(new Date(2014, 8, 1), 5)
 * //=> Sun Feb 01 2015 00:00:00
 */

function addMonths(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var amount = toInteger(dirtyAmount);
  var desiredMonth = date.getMonth() + amount;
  var dateWithDesiredMonth = new Date(0);
  dateWithDesiredMonth.setFullYear(date.getFullYear(), desiredMonth, 1);
  dateWithDesiredMonth.setHours(0, 0, 0, 0);
  var daysInMonth = getDaysInMonth(dateWithDesiredMonth); // Set the last day of the new month
  // if the original date was the last day of the longer month

  date.setMonth(desiredMonth, Math.min(daysInMonth, date.getDate()));
  return date;
}

/**
 * @name addWeeks
 * @category Week Helpers
 * @summary Add the specified number of weeks to the given date.
 *
 * @description
 * Add the specified number of week to the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of weeks to be added
 * @returns {Date} the new date with the weeks added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 4 weeks to 1 September 2014:
 * var result = addWeeks(new Date(2014, 8, 1), 4)
 * //=> Mon Sep 29 2014 00:00:00
 */

function addWeeks(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var amount = toInteger(dirtyAmount);
  var days = amount * 7;
  return addDays(dirtyDate, days);
}

/**
 * @name addYears
 * @category Year Helpers
 * @summary Add the specified number of years to the given date.
 *
 * @description
 * Add the specified number of years to the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of years to be added
 * @returns {Date} the new date with the years added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 5 years to 1 September 2014:
 * var result = addYears(new Date(2014, 8, 1), 5)
 * //=> Sun Sep 01 2019 00:00:00
 */

function addYears(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var amount = toInteger(dirtyAmount);
  return addMonths(dirtyDate, amount * 12);
}

/**
 * @name isValid
 * @category Common Helpers
 * @summary Is the given date valid?
 *
 * @description
 * Returns false if argument is Invalid Date and true otherwise.
 * Argument is converted to Date using `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
 * Invalid Date is a Date, whose time value is NaN.
 *
 * Time value of Date: http://es5.github.io/#x15.9.1.1
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * - Now `isValid` doesn't throw an exception
 *   if the first argument is not an instance of Date.
 *   Instead, argument is converted beforehand using `toDate`.
 *
 *   Examples:
 *
 *   | `isValid` argument        | Before v2.0.0 | v2.0.0 onward |
 *   |---------------------------|---------------|---------------|
 *   | `new Date()`              | `true`        | `true`        |
 *   | `new Date('2016-01-01')`  | `true`        | `true`        |
 *   | `new Date('')`            | `false`       | `false`       |
 *   | `new Date(1488370835081)` | `true`        | `true`        |
 *   | `new Date(NaN)`           | `false`       | `false`       |
 *   | `'2016-01-01'`            | `TypeError`   | `false`       |
 *   | `''`                      | `TypeError`   | `false`       |
 *   | `1488370835081`           | `TypeError`   | `true`        |
 *   | `NaN`                     | `TypeError`   | `false`       |
 *
 *   We introduce this change to make *date-fns* consistent with ECMAScript behavior
 *   that try to coerce arguments to the expected type
 *   (which is also the case with other *date-fns* functions).
 *
 * @param {*} date - the date to check
 * @returns {Boolean} the date is valid
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // For the valid date:
 * var result = isValid(new Date(2014, 1, 31))
 * //=> true
 *
 * @example
 * // For the value, convertable into a date:
 * var result = isValid(1393804800000)
 * //=> true
 *
 * @example
 * // For the invalid date:
 * var result = isValid(new Date(''))
 * //=> false
 */

function isValid(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  return !isNaN(date);
}

/**
 * @name isSameDay
 * @category Day Helpers
 * @summary Are the given dates in the same day?
 *
 * @description
 * Are the given dates in the same day?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the first date to check
 * @param {Date|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same day
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Are 4 September 06:00:00 and 4 September 18:00:00 in the same day?
 * var result = isSameDay(new Date(2014, 8, 4, 6, 0), new Date(2014, 8, 4, 18, 0))
 * //=> true
 */

function isSameDay(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeftStartOfDay = startOfDay(dirtyDateLeft);
  var dateRightStartOfDay = startOfDay(dirtyDateRight);
  return dateLeftStartOfDay.getTime() === dateRightStartOfDay.getTime();
}

/**
 * @name differenceInCalendarMonths
 * @category Month Helpers
 * @summary Get the number of calendar months between the given dates.
 *
 * @description
 * Get the number of calendar months between the given dates.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar months
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many calendar months are between 31 January 2014 and 1 September 2014?
 * var result = differenceInCalendarMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 8
 */

function differenceInCalendarMonths(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
  var monthDiff = dateLeft.getMonth() - dateRight.getMonth();
  return yearDiff * 12 + monthDiff;
}

var MILLISECONDS_IN_WEEK = 604800000;
/**
 * @name differenceInCalendarWeeks
 * @category Week Helpers
 * @summary Get the number of calendar weeks between the given dates.
 *
 * @description
 * Get the number of calendar weeks between the given dates.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Number} the number of calendar weeks
 * @throws {TypeError} 2 arguments required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 *
 * @example
 * // How many calendar weeks are between 5 July 2014 and 20 July 2014?
 * var result = differenceInCalendarWeeks(
 *   new Date(2014, 6, 20),
 *   new Date(2014, 6, 5)
 * )
 * //=> 3
 *
 * @example
 * // If the week starts on Monday,
 * // how many calendar weeks are between 5 July 2014 and 20 July 2014?
 * var result = differenceInCalendarWeeks(
 *   new Date(2014, 6, 20),
 *   new Date(2014, 6, 5),
 *   { weekStartsOn: 1 }
 * )
 * //=> 2
 */

function differenceInCalendarWeeks(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var startOfWeekLeft = startOfWeek(dirtyDateLeft, dirtyOptions);
  var startOfWeekRight = startOfWeek(dirtyDateRight, dirtyOptions);
  var timestampLeft = startOfWeekLeft.getTime() - getTimezoneOffsetInMilliseconds(startOfWeekLeft);
  var timestampRight = startOfWeekRight.getTime() - getTimezoneOffsetInMilliseconds(startOfWeekRight); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_WEEK);
}

/**
 * @name differenceInCalendarYears
 * @category Year Helpers
 * @summary Get the number of calendar years between the given dates.
 *
 * @description
 * Get the number of calendar years between the given dates.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the later date
 * @param {Date|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar years
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // How many calendar years are between 31 December 2013 and 11 February 2015?
 * var result = differenceInCalendarYears(
 *   new Date(2015, 1, 11),
 *   new Date(2013, 11, 31)
 * )
 * //=> 2
 */

function differenceInCalendarYears(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  return dateLeft.getFullYear() - dateRight.getFullYear();
}

/**
 * @name eachWeekOfInterval
 * @category Interval Helpers
 * @summary Return the array of weeks within the specified time interval.
 *
 * @description
 * Return the array of weeks within the specified time interval.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Interval} interval - the interval. See [Interval]{@link docs/types/Interval}
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date[]} the array with starts of weeks from the week of the interval start to the week of the interval end
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be 0, 1, ..., 6
 * @throws {RangeError} The start of an interval cannot be after its end
 * @throws {RangeError} Date in interval cannot be `Invalid Date`
 *
 * @example
 * // Each week within interval 6 October 2014 - 23 November 2014:
 * var result = eachWeekOfInterval({
 *   start: new Date(2014, 9, 6),
 *   end: new Date(2014, 10, 23)
 * })
 * //=> [
 * //   Sun Oct 05 2014 00:00:00,
 * //   Sun Oct 12 2014 00:00:00,
 * //   Sun Oct 19 2014 00:00:00,
 * //   Sun Oct 26 2014 00:00:00,
 * //   Sun Nov 02 2014 00:00:00,
 * //   Sun Nov 09 2014 00:00:00,
 * //   Sun Nov 16 2014 00:00:00,
 * //   Sun Nov 23 2014 00:00:00
 * // ]
 */

function eachWeekOfInterval(dirtyInterval, options) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var interval = dirtyInterval || {};
  var startDate = toDate(interval.start);
  var endDate = toDate(interval.end);
  var endTime = endDate.getTime(); // Throw an exception if start date is after end date or if any date is `Invalid Date`

  if (!(startDate.getTime() <= endTime)) {
    throw new RangeError('Invalid interval');
  }

  var startDateWeek = startOfWeek(startDate, options);
  var endDateWeek = startOfWeek(endDate, options); // Some timezones switch DST at midnight, making start of day unreliable in these timezones, 3pm is a safe bet

  startDateWeek.setHours(15);
  endDateWeek.setHours(15);
  endTime = endDateWeek.getTime();
  var weeks = [];
  var currentWeek = startDateWeek;

  while (currentWeek.getTime() <= endTime) {
    currentWeek.setHours(0);
    weeks.push(toDate(currentWeek));
    currentWeek = addWeeks(currentWeek, 1);
    currentWeek.setHours(15);
  }

  return weeks;
}

/**
 * @name endOfMonth
 * @category Month Helpers
 * @summary Return the end of a month for the given date.
 *
 * @description
 * Return the end of a month for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of a month
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of a month for 2 September 2014 11:55:00:
 * var result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 30 2014 23:59:59.999
 */

function endOfMonth(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var month = date.getMonth();
  date.setFullYear(date.getFullYear(), month + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * @name startOfYear
 * @category Year Helpers
 * @summary Return the start of a year for the given date.
 *
 * @description
 * Return the start of a year for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a year for 2 September 2014 11:55:00:
 * var result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Jan 01 2014 00:00:00
 */

function startOfYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var cleanDate = toDate(dirtyDate);
  var date = new Date(0);
  date.setFullYear(cleanDate.getFullYear(), 0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * @name endOfWeek
 * @category Week Helpers
 * @summary Return the end of a week for the given date.
 *
 * @description
 * Return the end of a week for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the end of a week
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 *
 * @example
 * // The end of a week for 2 September 2014 11:55:00:
 * var result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sat Sep 06 2014 23:59:59.999
 *
 * @example
 * // If the week starts on Monday, the end of the week for 2 September 2014 11:55:00:
 * var result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
 * //=> Sun Sep 07 2014 23:59:59.999
 */

function endOfWeek(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
  var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
  var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }

  var date = toDate(dirtyDate);
  var day = date.getDay();
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  date.setDate(date.getDate() + diff);
  date.setHours(23, 59, 59, 999);
  return date;
}

var formatDistanceLocale = {
  lessThanXSeconds: {
    one: 'less than a second',
    other: 'less than {{count}} seconds'
  },
  xSeconds: {
    one: '1 second',
    other: '{{count}} seconds'
  },
  halfAMinute: 'half a minute',
  lessThanXMinutes: {
    one: 'less than a minute',
    other: 'less than {{count}} minutes'
  },
  xMinutes: {
    one: '1 minute',
    other: '{{count}} minutes'
  },
  aboutXHours: {
    one: 'about 1 hour',
    other: 'about {{count}} hours'
  },
  xHours: {
    one: '1 hour',
    other: '{{count}} hours'
  },
  xDays: {
    one: '1 day',
    other: '{{count}} days'
  },
  aboutXMonths: {
    one: 'about 1 month',
    other: 'about {{count}} months'
  },
  xMonths: {
    one: '1 month',
    other: '{{count}} months'
  },
  aboutXYears: {
    one: 'about 1 year',
    other: 'about {{count}} years'
  },
  xYears: {
    one: '1 year',
    other: '{{count}} years'
  },
  overXYears: {
    one: 'over 1 year',
    other: 'over {{count}} years'
  },
  almostXYears: {
    one: 'almost 1 year',
    other: 'almost {{count}} years'
  }
};
function formatDistance(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale[token] === 'string') {
    result = formatDistanceLocale[token];
  } else if (count === 1) {
    result = formatDistanceLocale[token].one;
  } else {
    result = formatDistanceLocale[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'in ' + result;
    } else {
      return result + ' ago';
    }
  }

  return result;
}

function buildFormatLongFn(args) {
  return function (dirtyOptions) {
    var options = dirtyOptions || {};
    var width = options.width ? String(options.width) : args.defaultWidth;
    var format = args.formats[width] || args.formats[args.defaultWidth];
    return format;
  };
}

var dateFormats = {
  full: 'EEEE, MMMM do, y',
  long: 'MMMM do, y',
  medium: 'MMM d, y',
  short: 'MM/dd/yyyy'
};
var timeFormats = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: 'P'
};
function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}

function buildLocalizeFn(args) {
  return function (dirtyIndex, dirtyOptions) {
    var options = dirtyOptions || {};
    var context = options.context ? String(options.context) : 'standalone';
    var valuesArray;

    if (context === 'formatting' && args.formattingValues) {
      var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      var width = options.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      var _defaultWidth = args.defaultWidth;

      var _width = options.width ? String(options.width) : args.defaultWidth;

      valuesArray = args.values[_width] || args.values[_defaultWidth];
    }

    var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex;
    return valuesArray[index];
  };
}

var eraValues = {
  narrow: ['B', 'A'],
  abbreviated: ['BC', 'AD'],
  wide: ['Before Christ', 'Anno Domini']
};
var quarterValues = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  wide: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};
var dayValues = {
  narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
var dayPeriodValues = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mi',
    noon: 'n',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night'
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mi',
    noon: 'n',
    morning: 'in the morning',
    afternoon: 'in the afternoon',
    evening: 'in the evening',
    night: 'at night'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'in the morning',
    afternoon: 'in the afternoon',
    evening: 'in the evening',
    night: 'at night'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'in the morning',
    afternoon: 'in the afternoon',
    evening: 'in the evening',
    night: 'at night'
  }
};

function ordinalNumber(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'

  var rem100 = number % 100;

  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + 'st';

      case 2:
        return number + 'nd';

      case 3:
        return number + 'rd';
    }
  }

  return number + 'th';
}

var localize = {
  ordinalNumber: ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: 'wide'
  })
};

function buildMatchPatternFn(args) {
  return function (dirtyString, dirtyOptions) {
    var string = String(dirtyString);
    var options = dirtyOptions || {};
    var matchResult = string.match(args.matchPattern);

    if (!matchResult) {
      return null;
    }

    var matchedString = matchResult[0];
    var parseResult = string.match(args.parsePattern);

    if (!parseResult) {
      return null;
    }

    var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    return {
      value: value,
      rest: string.slice(matchedString.length)
    };
  };
}

function buildMatchFn(args) {
  return function (dirtyString, dirtyOptions) {
    var string = String(dirtyString);
    var options = dirtyOptions || {};
    var width = options.width;
    var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    var matchResult = string.match(matchPattern);

    if (!matchResult) {
      return null;
    }

    var matchedString = matchResult[0];
    var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    var value;

    if (Object.prototype.toString.call(parsePatterns) === '[object Array]') {
      value = findIndex(parsePatterns, function (pattern) {
        return pattern.test(string);
      });
    } else {
      value = findKey(parsePatterns, function (pattern) {
        return pattern.test(string);
      });
    }

    value = args.valueCallback ? args.valueCallback(value) : value;
    value = options.valueCallback ? options.valueCallback(value) : value;
    return {
      value: value,
      rest: string.slice(matchedString.length)
    };
  };
}

function findKey(object, predicate) {
  for (var key in object) {
    if (object.hasOwnProperty(key) && predicate(object[key])) {
      return key;
    }
  }
}

function findIndex(array, predicate) {
  for (var key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
}

var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary English locale (United States).
 * @language English
 * @iso-639-2 eng
 * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
 * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
 */

var locale = {
  code: 'en-US',
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

/**
 * @name subMilliseconds
 * @category Millisecond Helpers
 * @summary Subtract the specified number of milliseconds from the given date.
 *
 * @description
 * Subtract the specified number of milliseconds from the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be subtracted
 * @returns {Date} the new date with the milliseconds subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 750 milliseconds from 10 July 2014 12:45:30.000:
 * var result = subMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:29.250
 */

function subMilliseconds(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var amount = toInteger(dirtyAmount);
  return addMilliseconds(dirtyDate, -amount);
}

function addLeadingZeros(number, targetLength) {
  var sign = number < 0 ? '-' : '';
  var output = Math.abs(number).toString();

  while (output.length < targetLength) {
    output = '0' + output;
  }

  return sign + output;
}

/*
 * |     | Unit                           |     | Unit                           |
 * |-----|--------------------------------|-----|--------------------------------|
 * |  a  | AM, PM                         |  A* |                                |
 * |  d  | Day of month                   |  D  |                                |
 * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
 * |  m  | Minute                         |  M  | Month                          |
 * |  s  | Second                         |  S  | Fraction of second             |
 * |  y  | Year (abs)                     |  Y  |                                |
 *
 * Letters marked by * are not implemented but reserved by Unicode standard.
 */

var formatters = {
  // Year
  y: function (date, token) {
    // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
    // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
    // |----------|-------|----|-------|-------|-------|
    // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
    // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
    // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
    // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
    // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |
    var signedYear = date.getUTCFullYear(); // Returns 1 for 1 BC (which is year 0 in JavaScript)

    var year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === 'yy' ? year % 100 : year, token.length);
  },
  // Month
  M: function (date, token) {
    var month = date.getUTCMonth();
    return token === 'M' ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d: function (date, token) {
    return addLeadingZeros(date.getUTCDate(), token.length);
  },
  // AM or PM
  a: function (date, token) {
    var dayPeriodEnumValue = date.getUTCHours() / 12 >= 1 ? 'pm' : 'am';

    switch (token) {
      case 'a':
      case 'aa':
      case 'aaa':
        return dayPeriodEnumValue.toUpperCase();

      case 'aaaaa':
        return dayPeriodEnumValue[0];

      case 'aaaa':
      default:
        return dayPeriodEnumValue === 'am' ? 'a.m.' : 'p.m.';
    }
  },
  // Hour [1-12]
  h: function (date, token) {
    return addLeadingZeros(date.getUTCHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H: function (date, token) {
    return addLeadingZeros(date.getUTCHours(), token.length);
  },
  // Minute
  m: function (date, token) {
    return addLeadingZeros(date.getUTCMinutes(), token.length);
  },
  // Second
  s: function (date, token) {
    return addLeadingZeros(date.getUTCSeconds(), token.length);
  },
  // Fraction of second
  S: function (date, token) {
    var numberOfDigits = token.length;
    var milliseconds = date.getUTCMilliseconds();
    var fractionalSeconds = Math.floor(milliseconds * Math.pow(10, numberOfDigits - 3));
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

var MILLISECONDS_IN_DAY = 86400000; // This function will be a part of public API when UTC function will be implemented.
// See issue: https://github.com/date-fns/date-fns/issues/376

function getUTCDayOfYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var timestamp = date.getTime();
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
  var startOfYearTimestamp = date.getTime();
  var difference = timestamp - startOfYearTimestamp;
  return Math.floor(difference / MILLISECONDS_IN_DAY) + 1;
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCISOWeek(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var weekStartsOn = 1;
  var date = toDate(dirtyDate);
  var day = date.getUTCDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function getUTCISOWeekYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var year = date.getUTCFullYear();
  var fourthOfJanuaryOfNextYear = new Date(0);
  fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
  var startOfNextYear = startOfUTCISOWeek(fourthOfJanuaryOfNextYear);
  var fourthOfJanuaryOfThisYear = new Date(0);
  fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
  var startOfThisYear = startOfUTCISOWeek(fourthOfJanuaryOfThisYear);

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCISOWeekYear(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var year = getUTCISOWeekYear(dirtyDate);
  var fourthOfJanuary = new Date(0);
  fourthOfJanuary.setUTCFullYear(year, 0, 4);
  fourthOfJanuary.setUTCHours(0, 0, 0, 0);
  var date = startOfUTCISOWeek(fourthOfJanuary);
  return date;
}

var MILLISECONDS_IN_WEEK$1 = 604800000; // This function will be a part of public API when UTC function will be implemented.
// See issue: https://github.com/date-fns/date-fns/issues/376

function getUTCISOWeek(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var diff = startOfUTCISOWeek(date).getTime() - startOfUTCISOWeekYear(date).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK$1) + 1;
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCWeek(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
  var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
  var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }

  var date = toDate(dirtyDate);
  var day = date.getUTCDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function getUTCWeekYear(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate, dirtyOptions);
  var year = date.getUTCFullYear();
  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

  if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
    throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
  }

  var firstWeekOfNextYear = new Date(0);
  firstWeekOfNextYear.setUTCFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setUTCHours(0, 0, 0, 0);
  var startOfNextYear = startOfUTCWeek(firstWeekOfNextYear, dirtyOptions);
  var firstWeekOfThisYear = new Date(0);
  firstWeekOfThisYear.setUTCFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setUTCHours(0, 0, 0, 0);
  var startOfThisYear = startOfUTCWeek(firstWeekOfThisYear, dirtyOptions);

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCWeekYear(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate);
  var year = getUTCWeekYear(dirtyDate, dirtyOptions);
  var firstWeek = new Date(0);
  firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setUTCHours(0, 0, 0, 0);
  var date = startOfUTCWeek(firstWeek, dirtyOptions);
  return date;
}

var MILLISECONDS_IN_WEEK$2 = 604800000; // This function will be a part of public API when UTC function will be implemented.
// See issue: https://github.com/date-fns/date-fns/issues/376

function getUTCWeek(dirtyDate, options) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var diff = startOfUTCWeek(date, options).getTime() - startOfUTCWeekYear(date, options).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK$2) + 1;
}

var dayPeriodEnum = {
  am: 'am',
  pm: 'pm',
  midnight: 'midnight',
  noon: 'noon',
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
  night: 'night'
  /*
   * |     | Unit                           |     | Unit                           |
   * |-----|--------------------------------|-----|--------------------------------|
   * |  a  | AM, PM                         |  A* | Milliseconds in day            |
   * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
   * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
   * |  d  | Day of month                   |  D  | Day of year                    |
   * |  e  | Local day of week              |  E  | Day of week                    |
   * |  f  |                                |  F* | Day of week in month           |
   * |  g* | Modified Julian day            |  G  | Era                            |
   * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
   * |  i! | ISO day of week                |  I! | ISO week of year               |
   * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
   * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
   * |  l* | (deprecated)                   |  L  | Stand-alone month              |
   * |  m  | Minute                         |  M  | Month                          |
   * |  n  |                                |  N  |                                |
   * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
   * |  p! | Long localized time            |  P! | Long localized date            |
   * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
   * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
   * |  s  | Second                         |  S  | Fraction of second             |
   * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
   * |  u  | Extended year                  |  U* | Cyclic year                    |
   * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
   * |  w  | Local week of year             |  W* | Week of month                  |
   * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
   * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
   * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
   *
   * Letters marked by * are not implemented but reserved by Unicode standard.
   *
   * Letters marked by ! are non-standard, but implemented by date-fns:
   * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
   * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
   *   i.e. 7 for Sunday, 1 for Monday, etc.
   * - `I` is ISO week of year, as opposed to `w` which is local week of year.
   * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
   *   `R` is supposed to be used in conjunction with `I` and `i`
   *   for universal ISO week-numbering date, whereas
   *   `Y` is supposed to be used in conjunction with `w` and `e`
   *   for week-numbering date specific to the locale.
   * - `P` is long localized date format
   * - `p` is long localized time format
   */

};
var formatters$1 = {
  // Era
  G: function (date, token, localize) {
    var era = date.getUTCFullYear() > 0 ? 1 : 0;

    switch (token) {
      // AD, BC
      case 'G':
      case 'GG':
      case 'GGG':
        return localize.era(era, {
          width: 'abbreviated'
        });
      // A, B

      case 'GGGGG':
        return localize.era(era, {
          width: 'narrow'
        });
      // Anno Domini, Before Christ

      case 'GGGG':
      default:
        return localize.era(era, {
          width: 'wide'
        });
    }
  },
  // Year
  y: function (date, token, localize) {
    // Ordinal number
    if (token === 'yo') {
      var signedYear = date.getUTCFullYear(); // Returns 1 for 1 BC (which is year 0 in JavaScript)

      var year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize.ordinalNumber(year, {
        unit: 'year'
      });
    }

    return formatters.y(date, token);
  },
  // Local week-numbering year
  Y: function (date, token, localize, options) {
    var signedWeekYear = getUTCWeekYear(date, options); // Returns 1 for 1 BC (which is year 0 in JavaScript)

    var weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear; // Two digit year

    if (token === 'YY') {
      var twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    } // Ordinal number


    if (token === 'Yo') {
      return localize.ordinalNumber(weekYear, {
        unit: 'year'
      });
    } // Padding


    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function (date, token) {
    var isoWeekYear = getUTCISOWeekYear(date); // Padding

    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function (date, token) {
    var year = date.getUTCFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function (date, token, localize) {
    var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);

    switch (token) {
      // 1, 2, 3, 4
      case 'Q':
        return String(quarter);
      // 01, 02, 03, 04

      case 'QQ':
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th

      case 'Qo':
        return localize.ordinalNumber(quarter, {
          unit: 'quarter'
        });
      // Q1, Q2, Q3, Q4

      case 'QQQ':
        return localize.quarter(quarter, {
          width: 'abbreviated',
          context: 'formatting'
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)

      case 'QQQQQ':
        return localize.quarter(quarter, {
          width: 'narrow',
          context: 'formatting'
        });
      // 1st quarter, 2nd quarter, ...

      case 'QQQQ':
      default:
        return localize.quarter(quarter, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // Stand-alone quarter
  q: function (date, token, localize) {
    var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);

    switch (token) {
      // 1, 2, 3, 4
      case 'q':
        return String(quarter);
      // 01, 02, 03, 04

      case 'qq':
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th

      case 'qo':
        return localize.ordinalNumber(quarter, {
          unit: 'quarter'
        });
      // Q1, Q2, Q3, Q4

      case 'qqq':
        return localize.quarter(quarter, {
          width: 'abbreviated',
          context: 'standalone'
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)

      case 'qqqqq':
        return localize.quarter(quarter, {
          width: 'narrow',
          context: 'standalone'
        });
      // 1st quarter, 2nd quarter, ...

      case 'qqqq':
      default:
        return localize.quarter(quarter, {
          width: 'wide',
          context: 'standalone'
        });
    }
  },
  // Month
  M: function (date, token, localize) {
    var month = date.getUTCMonth();

    switch (token) {
      case 'M':
      case 'MM':
        return formatters.M(date, token);
      // 1st, 2nd, ..., 12th

      case 'Mo':
        return localize.ordinalNumber(month + 1, {
          unit: 'month'
        });
      // Jan, Feb, ..., Dec

      case 'MMM':
        return localize.month(month, {
          width: 'abbreviated',
          context: 'formatting'
        });
      // J, F, ..., D

      case 'MMMMM':
        return localize.month(month, {
          width: 'narrow',
          context: 'formatting'
        });
      // January, February, ..., December

      case 'MMMM':
      default:
        return localize.month(month, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // Stand-alone month
  L: function (date, token, localize) {
    var month = date.getUTCMonth();

    switch (token) {
      // 1, 2, ..., 12
      case 'L':
        return String(month + 1);
      // 01, 02, ..., 12

      case 'LL':
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th

      case 'Lo':
        return localize.ordinalNumber(month + 1, {
          unit: 'month'
        });
      // Jan, Feb, ..., Dec

      case 'LLL':
        return localize.month(month, {
          width: 'abbreviated',
          context: 'standalone'
        });
      // J, F, ..., D

      case 'LLLLL':
        return localize.month(month, {
          width: 'narrow',
          context: 'standalone'
        });
      // January, February, ..., December

      case 'LLLL':
      default:
        return localize.month(month, {
          width: 'wide',
          context: 'standalone'
        });
    }
  },
  // Local week of year
  w: function (date, token, localize, options) {
    var week = getUTCWeek(date, options);

    if (token === 'wo') {
      return localize.ordinalNumber(week, {
        unit: 'week'
      });
    }

    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function (date, token, localize) {
    var isoWeek = getUTCISOWeek(date);

    if (token === 'Io') {
      return localize.ordinalNumber(isoWeek, {
        unit: 'week'
      });
    }

    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function (date, token, localize) {
    if (token === 'do') {
      return localize.ordinalNumber(date.getUTCDate(), {
        unit: 'date'
      });
    }

    return formatters.d(date, token);
  },
  // Day of year
  D: function (date, token, localize) {
    var dayOfYear = getUTCDayOfYear(date);

    if (token === 'Do') {
      return localize.ordinalNumber(dayOfYear, {
        unit: 'dayOfYear'
      });
    }

    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function (date, token, localize) {
    var dayOfWeek = date.getUTCDay();

    switch (token) {
      // Tue
      case 'E':
      case 'EE':
      case 'EEE':
        return localize.day(dayOfWeek, {
          width: 'abbreviated',
          context: 'formatting'
        });
      // T

      case 'EEEEE':
        return localize.day(dayOfWeek, {
          width: 'narrow',
          context: 'formatting'
        });
      // Tu

      case 'EEEEEE':
        return localize.day(dayOfWeek, {
          width: 'short',
          context: 'formatting'
        });
      // Tuesday

      case 'EEEE':
      default:
        return localize.day(dayOfWeek, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // Local day of week
  e: function (date, token, localize, options) {
    var dayOfWeek = date.getUTCDay();
    var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;

    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case 'e':
        return String(localDayOfWeek);
      // Padded numerical value

      case 'ee':
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th

      case 'eo':
        return localize.ordinalNumber(localDayOfWeek, {
          unit: 'day'
        });

      case 'eee':
        return localize.day(dayOfWeek, {
          width: 'abbreviated',
          context: 'formatting'
        });
      // T

      case 'eeeee':
        return localize.day(dayOfWeek, {
          width: 'narrow',
          context: 'formatting'
        });
      // Tu

      case 'eeeeee':
        return localize.day(dayOfWeek, {
          width: 'short',
          context: 'formatting'
        });
      // Tuesday

      case 'eeee':
      default:
        return localize.day(dayOfWeek, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // Stand-alone local day of week
  c: function (date, token, localize, options) {
    var dayOfWeek = date.getUTCDay();
    var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;

    switch (token) {
      // Numerical value (same as in `e`)
      case 'c':
        return String(localDayOfWeek);
      // Padded numerical value

      case 'cc':
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th

      case 'co':
        return localize.ordinalNumber(localDayOfWeek, {
          unit: 'day'
        });

      case 'ccc':
        return localize.day(dayOfWeek, {
          width: 'abbreviated',
          context: 'standalone'
        });
      // T

      case 'ccccc':
        return localize.day(dayOfWeek, {
          width: 'narrow',
          context: 'standalone'
        });
      // Tu

      case 'cccccc':
        return localize.day(dayOfWeek, {
          width: 'short',
          context: 'standalone'
        });
      // Tuesday

      case 'cccc':
      default:
        return localize.day(dayOfWeek, {
          width: 'wide',
          context: 'standalone'
        });
    }
  },
  // ISO day of week
  i: function (date, token, localize) {
    var dayOfWeek = date.getUTCDay();
    var isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    switch (token) {
      // 2
      case 'i':
        return String(isoDayOfWeek);
      // 02

      case 'ii':
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd

      case 'io':
        return localize.ordinalNumber(isoDayOfWeek, {
          unit: 'day'
        });
      // Tue

      case 'iii':
        return localize.day(dayOfWeek, {
          width: 'abbreviated',
          context: 'formatting'
        });
      // T

      case 'iiiii':
        return localize.day(dayOfWeek, {
          width: 'narrow',
          context: 'formatting'
        });
      // Tu

      case 'iiiiii':
        return localize.day(dayOfWeek, {
          width: 'short',
          context: 'formatting'
        });
      // Tuesday

      case 'iiii':
      default:
        return localize.day(dayOfWeek, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // AM or PM
  a: function (date, token, localize) {
    var hours = date.getUTCHours();
    var dayPeriodEnumValue = hours / 12 >= 1 ? 'pm' : 'am';

    switch (token) {
      case 'a':
      case 'aa':
      case 'aaa':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'abbreviated',
          context: 'formatting'
        });

      case 'aaaaa':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'aaaa':
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // AM, PM, midnight, noon
  b: function (date, token, localize) {
    var hours = date.getUTCHours();
    var dayPeriodEnumValue;

    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? 'pm' : 'am';
    }

    switch (token) {
      case 'b':
      case 'bb':
      case 'bbb':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'abbreviated',
          context: 'formatting'
        });

      case 'bbbbb':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'bbbb':
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function (date, token, localize) {
    var hours = date.getUTCHours();
    var dayPeriodEnumValue;

    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }

    switch (token) {
      case 'B':
      case 'BB':
      case 'BBB':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'abbreviated',
          context: 'formatting'
        });

      case 'BBBBB':
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'BBBB':
      default:
        return localize.dayPeriod(dayPeriodEnumValue, {
          width: 'wide',
          context: 'formatting'
        });
    }
  },
  // Hour [1-12]
  h: function (date, token, localize) {
    if (token === 'ho') {
      var hours = date.getUTCHours() % 12;
      if (hours === 0) hours = 12;
      return localize.ordinalNumber(hours, {
        unit: 'hour'
      });
    }

    return formatters.h(date, token);
  },
  // Hour [0-23]
  H: function (date, token, localize) {
    if (token === 'Ho') {
      return localize.ordinalNumber(date.getUTCHours(), {
        unit: 'hour'
      });
    }

    return formatters.H(date, token);
  },
  // Hour [0-11]
  K: function (date, token, localize) {
    var hours = date.getUTCHours() % 12;

    if (token === 'Ko') {
      return localize.ordinalNumber(hours, {
        unit: 'hour'
      });
    }

    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function (date, token, localize) {
    var hours = date.getUTCHours();
    if (hours === 0) hours = 24;

    if (token === 'ko') {
      return localize.ordinalNumber(hours, {
        unit: 'hour'
      });
    }

    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function (date, token, localize) {
    if (token === 'mo') {
      return localize.ordinalNumber(date.getUTCMinutes(), {
        unit: 'minute'
      });
    }

    return formatters.m(date, token);
  },
  // Second
  s: function (date, token, localize) {
    if (token === 'so') {
      return localize.ordinalNumber(date.getUTCSeconds(), {
        unit: 'second'
      });
    }

    return formatters.s(date, token);
  },
  // Fraction of second
  S: function (date, token) {
    return formatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timezoneOffset = originalDate.getTimezoneOffset();

    if (timezoneOffset === 0) {
      return 'Z';
    }

    switch (token) {
      // Hours and optional minutes
      case 'X':
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`

      case 'XXXX':
      case 'XX':
        // Hours and minutes without `:` delimiter
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`

      case 'XXXXX':
      case 'XXX': // Hours and minutes with `:` delimiter

      default:
        return formatTimezone(timezoneOffset, ':');
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timezoneOffset = originalDate.getTimezoneOffset();

    switch (token) {
      // Hours and optional minutes
      case 'x':
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`

      case 'xxxx':
      case 'xx':
        // Hours and minutes without `:` delimiter
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`

      case 'xxxxx':
      case 'xxx': // Hours and minutes with `:` delimiter

      default:
        return formatTimezone(timezoneOffset, ':');
    }
  },
  // Timezone (GMT)
  O: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timezoneOffset = originalDate.getTimezoneOffset();

    switch (token) {
      // Short
      case 'O':
      case 'OO':
      case 'OOO':
        return 'GMT' + formatTimezoneShort(timezoneOffset, ':');
      // Long

      case 'OOOO':
      default:
        return 'GMT' + formatTimezone(timezoneOffset, ':');
    }
  },
  // Timezone (specific non-location)
  z: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timezoneOffset = originalDate.getTimezoneOffset();

    switch (token) {
      // Short
      case 'z':
      case 'zz':
      case 'zzz':
        return 'GMT' + formatTimezoneShort(timezoneOffset, ':');
      // Long

      case 'zzzz':
      default:
        return 'GMT' + formatTimezone(timezoneOffset, ':');
    }
  },
  // Seconds timestamp
  t: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timestamp = Math.floor(originalDate.getTime() / 1000);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function (date, token, _localize, options) {
    var originalDate = options._originalDate || date;
    var timestamp = originalDate.getTime();
    return addLeadingZeros(timestamp, token.length);
  }
};

function formatTimezoneShort(offset, dirtyDelimiter) {
  var sign = offset > 0 ? '-' : '+';
  var absOffset = Math.abs(offset);
  var hours = Math.floor(absOffset / 60);
  var minutes = absOffset % 60;

  if (minutes === 0) {
    return sign + String(hours);
  }

  var delimiter = dirtyDelimiter || '';
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}

function formatTimezoneWithOptionalMinutes(offset, dirtyDelimiter) {
  if (offset % 60 === 0) {
    var sign = offset > 0 ? '-' : '+';
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }

  return formatTimezone(offset, dirtyDelimiter);
}

function formatTimezone(offset, dirtyDelimiter) {
  var delimiter = dirtyDelimiter || '';
  var sign = offset > 0 ? '-' : '+';
  var absOffset = Math.abs(offset);
  var hours = addLeadingZeros(Math.floor(absOffset / 60), 2);
  var minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

function dateLongFormatter(pattern, formatLong) {
  switch (pattern) {
    case 'P':
      return formatLong.date({
        width: 'short'
      });

    case 'PP':
      return formatLong.date({
        width: 'medium'
      });

    case 'PPP':
      return formatLong.date({
        width: 'long'
      });

    case 'PPPP':
    default:
      return formatLong.date({
        width: 'full'
      });
  }
}

function timeLongFormatter(pattern, formatLong) {
  switch (pattern) {
    case 'p':
      return formatLong.time({
        width: 'short'
      });

    case 'pp':
      return formatLong.time({
        width: 'medium'
      });

    case 'ppp':
      return formatLong.time({
        width: 'long'
      });

    case 'pppp':
    default:
      return formatLong.time({
        width: 'full'
      });
  }
}

function dateTimeLongFormatter(pattern, formatLong) {
  var matchResult = pattern.match(/(P+)(p+)?/);
  var datePattern = matchResult[1];
  var timePattern = matchResult[2];

  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong);
  }

  var dateTimeFormat;

  switch (datePattern) {
    case 'P':
      dateTimeFormat = formatLong.dateTime({
        width: 'short'
      });
      break;

    case 'PP':
      dateTimeFormat = formatLong.dateTime({
        width: 'medium'
      });
      break;

    case 'PPP':
      dateTimeFormat = formatLong.dateTime({
        width: 'long'
      });
      break;

    case 'PPPP':
    default:
      dateTimeFormat = formatLong.dateTime({
        width: 'full'
      });
      break;
  }

  return dateTimeFormat.replace('{{date}}', dateLongFormatter(datePattern, formatLong)).replace('{{time}}', timeLongFormatter(timePattern, formatLong));
}

var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

var protectedDayOfYearTokens = ['D', 'DD'];
var protectedWeekYearTokens = ['YY', 'YYYY'];
function isProtectedDayOfYearToken(token) {
  return protectedDayOfYearTokens.indexOf(token) !== -1;
}
function isProtectedWeekYearToken(token) {
  return protectedWeekYearTokens.indexOf(token) !== -1;
}
function throwProtectedError(token) {
  if (token === 'YYYY') {
    throw new RangeError('Use `yyyy` instead of `YYYY` for formatting years; see: https://git.io/fxCyr');
  } else if (token === 'YY') {
    throw new RangeError('Use `yy` instead of `YY` for formatting years; see: https://git.io/fxCyr');
  } else if (token === 'D') {
    throw new RangeError('Use `d` instead of `D` for formatting days of the month; see: https://git.io/fxCyr');
  } else if (token === 'DD') {
    throw new RangeError('Use `dd` instead of `DD` for formatting days of the month; see: https://git.io/fxCyr');
  }
}

// - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
//   (one of the certain letters followed by `o`)
// - (\w)\1* matches any sequences of the same letter
// - '' matches two quote characters in a row
// - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
//   except a single quote symbol, which ends the sequence.
//   Two quote characters do not end the sequence.
//   If there is no matching single quote
//   then the sequence will continue until the end of the string.
// - . matches any single character unmatched by previous parts of the RegExps

var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g; // This RegExp catches symbols escaped by quotes, and also
// sequences of symbols P, p, and the combinations like `PPPPPPPppppp`

var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
/**
 * @name format
 * @category Common Helpers
 * @summary Format the date.
 *
 * @description
 * Return the formatted date string in the given format. The result may vary by locale.
 *
 * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
 * > See: https://git.io/fxCyr
 *
 * The characters wrapped between two single quotes characters (') are escaped.
 * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
 * (see the last example)
 *
 * Format of the string is based on Unicode Technical Standard #35:
 * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * with a few additions (see note 7 below the table).
 *
 * Accepted patterns:
 * | Unit                            | Pattern | Result examples                   | Notes |
 * |---------------------------------|---------|-----------------------------------|-------|
 * | Era                             | G..GGG  | AD, BC                            |       |
 * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
 * |                                 | GGGGG   | A, B                              |       |
 * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
 * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
 * |                                 | yy      | 44, 01, 00, 17                    | 5     |
 * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
 * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
 * |                                 | yyyyy   | ...                               | 3,5   |
 * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
 * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
 * |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
 * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
 * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
 * |                                 | YYYYY   | ...                               | 3,5   |
 * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
 * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
 * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
 * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
 * |                                 | RRRRR   | ...                               | 3,5,7 |
 * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
 * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
 * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
 * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
 * |                                 | uuuuu   | ...                               | 3,5   |
 * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
 * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
 * |                                 | QQ      | 01, 02, 03, 04                    |       |
 * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
 * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
 * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
 * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
 * |                                 | qq      | 01, 02, 03, 04                    |       |
 * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
 * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
 * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
 * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
 * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
 * |                                 | MM      | 01, 02, ..., 12                   |       |
 * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
 * |                                 | MMMM    | January, February, ..., December  | 2     |
 * |                                 | MMMMM   | J, F, ..., D                      |       |
 * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
 * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
 * |                                 | LL      | 01, 02, ..., 12                   |       |
 * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
 * |                                 | LLLL    | January, February, ..., December  | 2     |
 * |                                 | LLLLL   | J, F, ..., D                      |       |
 * | Local week of year              | w       | 1, 2, ..., 53                     |       |
 * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
 * |                                 | ww      | 01, 02, ..., 53                   |       |
 * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
 * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
 * |                                 | II      | 01, 02, ..., 53                   | 7     |
 * | Day of month                    | d       | 1, 2, ..., 31                     |       |
 * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
 * |                                 | dd      | 01, 02, ..., 31                   |       |
 * | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
 * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
 * |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
 * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
 * |                                 | DDDD    | ...                               | 3     |
 * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Su            |       |
 * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
 * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
 * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
 * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
 * |                                 | ii      | 01, 02, ..., 07                   | 7     |
 * |                                 | iii     | Mon, Tue, Wed, ..., Su            | 7     |
 * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
 * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
 * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Su, Sa        | 7     |
 * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
 * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
 * |                                 | ee      | 02, 03, ..., 01                   |       |
 * |                                 | eee     | Mon, Tue, Wed, ..., Su            |       |
 * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
 * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
 * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
 * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
 * |                                 | cc      | 02, 03, ..., 01                   |       |
 * |                                 | ccc     | Mon, Tue, Wed, ..., Su            |       |
 * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
 * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
 * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
 * | AM, PM                          | a..aaa  | AM, PM                            |       |
 * |                                 | aaaa    | a.m., p.m.                        | 2     |
 * |                                 | aaaaa   | a, p                              |       |
 * | AM, PM, noon, midnight          | b..bbb  | AM, PM, noon, midnight            |       |
 * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
 * |                                 | bbbbb   | a, p, n, mi                       |       |
 * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
 * |                                 | BBBB    | at night, in the morning, ...     | 2     |
 * |                                 | BBBBB   | at night, in the morning, ...     |       |
 * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
 * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
 * |                                 | hh      | 01, 02, ..., 11, 12               |       |
 * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
 * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
 * |                                 | HH      | 00, 01, 02, ..., 23               |       |
 * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
 * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
 * |                                 | KK      | 1, 2, ..., 11, 0                  |       |
 * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
 * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
 * |                                 | kk      | 24, 01, 02, ..., 23               |       |
 * | Minute                          | m       | 0, 1, ..., 59                     |       |
 * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
 * |                                 | mm      | 00, 01, ..., 59                   |       |
 * | Second                          | s       | 0, 1, ..., 59                     |       |
 * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
 * |                                 | ss      | 00, 01, ..., 59                   |       |
 * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
 * |                                 | SS      | 00, 01, ..., 99                   |       |
 * |                                 | SSS     | 000, 0001, ..., 999               |       |
 * |                                 | SSSS    | ...                               | 3     |
 * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
 * |                                 | XX      | -0800, +0530, Z                   |       |
 * |                                 | XXX     | -08:00, +05:30, Z                 |       |
 * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
 * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
 * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
 * |                                 | xx      | -0800, +0530, +0000               |       |
 * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
 * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
 * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
 * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
 * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
 * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
 * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
 * | Seconds timestamp               | t       | 512969520                         | 7     |
 * |                                 | tt      | ...                               | 3,7   |
 * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
 * |                                 | TT      | ...                               | 3,7   |
 * | Long localized date             | P       | 05/29/1453                        | 7     |
 * |                                 | PP      | May 29, 1453                      | 7     |
 * |                                 | PPP     | May 29th, 1453                    | 7     |
 * |                                 | PPPP    | Sunday, May 29th, 1453            | 2,7   |
 * | Long localized time             | p       | 12:00 AM                          | 7     |
 * |                                 | pp      | 12:00:00 AM                       | 7     |
 * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
 * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
 * | Combination of date and time    | Pp      | 05/29/1453, 12:00 AM              | 7     |
 * |                                 | PPpp    | May 29, 1453, 12:00:00 AM         | 7     |
 * |                                 | PPPppp  | May 29th, 1453 at ...             | 7     |
 * |                                 | PPPPpppp| Sunday, May 29th, 1453 at ...     | 2,7   |
 * Notes:
 * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
 *    are the same as "stand-alone" units, but are different in some languages.
 *    "Formatting" units are declined according to the rules of the language
 *    in the context of a date. "Stand-alone" units are always nominative singular:
 *
 *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
 *
 *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
 *
 * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
 *    the single quote characters (see below).
 *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
 *    the output will be the same as default pattern for this unit, usually
 *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
 *    are marked with "2" in the last column of the table.
 *
 *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
 *
 *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
 *
 * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
 *    The output will be padded with zeros to match the length of the pattern.
 *
 *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
 *
 * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
 *    These tokens represent the shortest form of the quarter.
 *
 * 5. The main difference between `y` and `u` patterns are B.C. years:
 *
 *    | Year | `y` | `u` |
 *    |------|-----|-----|
 *    | AC 1 |   1 |   1 |
 *    | BC 1 |   1 |   0 |
 *    | BC 2 |   2 |  -1 |
 *
 *    Also `yy` always returns the last two digits of a year,
 *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
 *
 *    | Year | `yy` | `uu` |
 *    |------|------|------|
 *    | 1    |   01 |   01 |
 *    | 14   |   14 |   14 |
 *    | 376  |   76 |  376 |
 *    | 1453 |   53 | 1453 |
 *
 *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
 *    except local week-numbering years are dependent on `options.weekStartsOn`
 *    and `options.firstWeekContainsDate` (compare [getISOWeekYear]{@link https://date-fns.org/docs/getISOWeekYear}
 *    and [getWeekYear]{@link https://date-fns.org/docs/getWeekYear}).
 *
 * 6. Specific non-location timezones are currently unavailable in `date-fns`,
 *    so right now these tokens fall back to GMT timezones.
 *
 * 7. These patterns are not in the Unicode Technical Standard #35:
 *    - `i`: ISO day of week
 *    - `I`: ISO week of year
 *    - `R`: ISO week-numbering year
 *    - `t`: seconds timestamp
 *    - `T`: milliseconds timestamp
 *    - `o`: ordinal number modifier
 *    - `P`: long localized date
 *    - `p`: long localized time
 *
 * 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
 *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://git.io/fxCyr
 *
 * 9. `D` and `DD` tokens represent days of the year but they are ofthen confused with days of the month.
 *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://git.io/fxCyr
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * - The second argument is now required for the sake of explicitness.
 *
 *   ```javascript
 *   // Before v2.0.0
 *   format(new Date(2016, 0, 1))
 *
 *   // v2.0.0 onward
 *   format(new Date(2016, 0, 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
 *   ```
 *
 * - New format string API for `format` function
 *   which is based on [Unicode Technical Standard #35](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table).
 *   See [this post](https://blog.date-fns.org/post/unicode-tokens-in-date-fns-v2-sreatyki91jg) for more details.
 *
 * - Characters are now escaped using single quote symbols (`'`) instead of square brackets.
 *
 * @param {Date|Number} date - the original date
 * @param {String} format - the string of tokens
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @param {Number} [options.firstWeekContainsDate=1] - the day of January, which is
 * @param {Boolean} [options.useAdditionalWeekYearTokens=false] - if true, allows usage of the week-numbering year tokens `YY` and `YYYY`;
 *   see: https://git.io/fxCyr
 * @param {Boolean} [options.useAdditionalDayOfYearTokens=false] - if true, allows usage of the day of year tokens `D` and `DD`;
 *   see: https://git.io/fxCyr
 * @returns {String} the formatted date string
 * @throws {TypeError} 2 arguments required
 * @throws {RangeError} `date` must not be Invalid Date
 * @throws {RangeError} `options.locale` must contain `localize` property
 * @throws {RangeError} `options.locale` must contain `formatLong` property
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
 * @throws {RangeError} use `yyyy` instead of `YYYY` for formatting years; see: https://git.io/fxCyr
 * @throws {RangeError} use `yy` instead of `YY` for formatting years; see: https://git.io/fxCyr
 * @throws {RangeError} use `d` instead of `D` for formatting days of the month; see: https://git.io/fxCyr
 * @throws {RangeError} use `dd` instead of `DD` for formatting days of the month; see: https://git.io/fxCyr
 * @throws {RangeError} format string contains an unescaped latin alphabet character
 *
 * @example
 * // Represent 11 February 2014 in middle-endian format:
 * var result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
 * //=> '02/11/2014'
 *
 * @example
 * // Represent 2 July 2014 in Esperanto:
 * import { eoLocale } from 'date-fns/locale/eo'
 * var result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
 *   locale: eoLocale
 * })
 * //=> '2-a de julio 2014'
 *
 * @example
 * // Escape string by single quote characters:
 * var result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
 * //=> "3 o'clock"
 */

function format(dirtyDate, dirtyFormatStr, dirtyOptions) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var formatStr = String(dirtyFormatStr);
  var options = dirtyOptions || {};
  var locale$1 = options.locale || locale;
  var localeFirstWeekContainsDate = locale$1.options && locale$1.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

  if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
    throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
  }

  var localeWeekStartsOn = locale$1.options && locale$1.options.weekStartsOn;
  var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
  var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

  if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
    throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  }

  if (!locale$1.localize) {
    throw new RangeError('locale must contain localize property');
  }

  if (!locale$1.formatLong) {
    throw new RangeError('locale must contain formatLong property');
  }

  var originalDate = toDate(dirtyDate);

  if (!isValid(originalDate)) {
    throw new RangeError('Invalid time value');
  } // Convert the date in system timezone to the same date in UTC+00:00 timezone.
  // This ensures that when UTC functions will be implemented, locales will be compatible with them.
  // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376


  var timezoneOffset = getTimezoneOffsetInMilliseconds(originalDate);
  var utcDate = subMilliseconds(originalDate, timezoneOffset);
  var formatterOptions = {
    firstWeekContainsDate: firstWeekContainsDate,
    weekStartsOn: weekStartsOn,
    locale: locale$1,
    _originalDate: originalDate
  };
  var result = formatStr.match(longFormattingTokensRegExp).map(function (substring) {
    var firstCharacter = substring[0];

    if (firstCharacter === 'p' || firstCharacter === 'P') {
      var longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale$1.formatLong, formatterOptions);
    }

    return substring;
  }).join('').match(formattingTokensRegExp).map(function (substring) {
    // Replace two single quote characters with one single quote character
    if (substring === "''") {
      return "'";
    }

    var firstCharacter = substring[0];

    if (firstCharacter === "'") {
      return cleanEscapedString(substring);
    }

    var formatter = formatters$1[firstCharacter];

    if (formatter) {
      if (!options.useAdditionalWeekYearTokens && isProtectedWeekYearToken(substring)) {
        throwProtectedError(substring);
      }

      if (!options.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(substring)) {
        throwProtectedError(substring);
      }

      return formatter(utcDate, substring, locale$1.localize, formatterOptions);
    }

    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError('Format string contains an unescaped latin alphabet character `' + firstCharacter + '`');
    }

    return substring;
  }).join('');
  return result;
}

function cleanEscapedString(input) {
  return input.match(escapedStringRegExp)[1].replace(doubleQuoteRegExp, "'");
}

var MILLISECONDS_IN_WEEK$3 = 604800000;
/**
 * @name getISOWeek
 * @category ISO Week Helpers
 * @summary Get the ISO week of the given date.
 *
 * @description
 * Get the ISO week of the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the given date
 * @returns {Number} the ISO week
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Which week of the ISO-week numbering year is 2 January 2005?
 * var result = getISOWeek(new Date(2005, 0, 2))
 * //=> 53
 */

function getISOWeek(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var diff = startOfISOWeek(date).getTime() - startOfISOWeekYear(date).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK$3) + 1;
}

/**
 * @name getWeekYear
 * @category Week-Numbering Year Helpers
 * @summary Get the local week-numbering year of the given date.
 *
 * @description
 * Get the local week-numbering year of the given date.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#Week_numbering
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the given date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @param {1|2|3|4|5|6|7} [options.firstWeekContainsDate=1] - the day of January, which is always in the first week of the year
 * @returns {Number} the local week-numbering year
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
 *
 * @example
 * // Which week numbering year is 26 December 2004 with the default settings?
 * var result = getWeekYear(new Date(2004, 11, 26))
 * //=> 2005
 *
 * @example
 * // Which week numbering year is 26 December 2004 if week starts on Saturday?
 * var result = getWeekYear(new Date(2004, 11, 26), { weekStartsOn: 6 })
 * //=> 2004
 *
 * @example
 * // Which week numbering year is 26 December 2004 if the first week contains 4 January?
 * var result = getWeekYear(new Date(2004, 11, 26), { firstWeekContainsDate: 4 })
 * //=> 2004
 */

function getWeekYear(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var year = date.getFullYear();
  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

  if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
    throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
  }

  var firstWeekOfNextYear = new Date(0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  var startOfNextYear = startOfWeek(firstWeekOfNextYear, dirtyOptions);
  var firstWeekOfThisYear = new Date(0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  var startOfThisYear = startOfWeek(firstWeekOfThisYear, dirtyOptions);

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

/**
 * @name startOfWeekYear
 * @category Week-Numbering Year Helpers
 * @summary Return the start of a local week-numbering year for the given date.
 *
 * @description
 * Return the start of a local week-numbering year.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#Week_numbering
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @param {1|2|3|4|5|6|7} [options.firstWeekContainsDate=1] - the day of January, which is always in the first week of the year
 * @returns {Date} the start of a week-numbering year
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
 *
 * @example
 * // The start of an a week-numbering year for 2 July 2005 with default settings:
 * var result = startOfWeekYear(new Date(2005, 6, 2))
 * //=> Sun Dec 26 2004 00:00:00
 *
 * @example
 * // The start of a week-numbering year for 2 July 2005
 * // if Monday is the first day of week
 * // and 4 January is always in the first week of the year:
 * var result = startOfWeekYear(new Date(2005, 6, 2), {
 *   weekStartsOn: 1,
 *   firstWeekContainsDate: 4
 * })
 * //=> Mon Jan 03 2005 00:00:00
 */

function startOfWeekYear(dirtyDate, dirtyOptions) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate);
  var year = getWeekYear(dirtyDate, dirtyOptions);
  var firstWeek = new Date(0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  var date = startOfWeek(firstWeek, dirtyOptions);
  return date;
}

var MILLISECONDS_IN_WEEK$4 = 604800000;
/**
 * @name getWeek
 * @category Week Helpers
 * @summary Get the local week index of the given date.
 *
 * @description
 * Get the local week index of the given date.
 * The exact calculation depends on the values of
 * `options.weekStartsOn` (which is the index of the first day of the week)
 * and `options.firstWeekContainsDate` (which is the day of January, which is always in
 * the first week of the week-numbering year)
 *
 * Week numbering: https://en.wikipedia.org/wiki/Week#Week_numbering
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the given date
 * @param {Object} [options] - an object with options.
 * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
 * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @param {1|2|3|4|5|6|7} [options.firstWeekContainsDate=1] - the day of January, which is always in the first week of the year
 * @returns {Number} the week
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
 * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
 *
 * @example
 * // Which week of the local week numbering year is 2 January 2005 with default options?
 * var result = getISOWeek(new Date(2005, 0, 2))
 * //=> 2
 *
 * // Which week of the local week numbering year is 2 January 2005,
 * // if Monday is the first day of the week,
 * // and the first week of the year always contains 4 January?
 * var result = getISOWeek(new Date(2005, 0, 2), {
 *   weekStartsOn: 1,
 *   firstWeekContainsDate: 4
 * })
 * //=> 53
 */

function getWeek(dirtyDate, options) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var diff = startOfWeek(date, options).getTime() - startOfWeekYear(date, options).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK$4) + 1;
}

/**
 * @name isAfter
 * @category Common Helpers
 * @summary Is the first date after the second one?
 *
 * @description
 * Is the first date after the second one?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date that should be after the other one to return true
 * @param {Date|Number} dateToCompare - the date to compare with
 * @returns {Boolean} the first date is after the second date
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Is 10 July 1989 after 11 February 1987?
 * var result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
 * //=> true
 */

function isAfter(dirtyDate, dirtyDateToCompare) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var dateToCompare = toDate(dirtyDateToCompare);
  return date.getTime() > dateToCompare.getTime();
}

/**
 * @name isBefore
 * @category Common Helpers
 * @summary Is the first date before the second one?
 *
 * @description
 * Is the first date before the second one?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date that should be before the other one to return true
 * @param {Date|Number} dateToCompare - the date to compare with
 * @returns {Boolean} the first date is before the second date
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Is 10 July 1989 before 11 February 1987?
 * var result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
 * //=> false
 */

function isBefore(dirtyDate, dirtyDateToCompare) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  var dateToCompare = toDate(dirtyDateToCompare);
  return date.getTime() < dateToCompare.getTime();
}

/**
 * @name startOfMinute
 * @category Minute Helpers
 * @summary Return the start of a minute for the given date.
 *
 * @description
 * Return the start of a minute for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a minute
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a minute for 1 December 2014 22:15:45.400:
 * var result = startOfMinute(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:00
 */

function startOfMinute(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  date.setSeconds(0, 0);
  return date;
}

/**
 * @name isSameMinute
 * @category Minute Helpers
 * @summary Are the given dates in the same minute?
 *
 * @description
 * Are the given dates in the same minute?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the first date to check
 * @param {Date|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same minute
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Are 4 September 2014 06:30:00 and 4 September 2014 06:30:15
 * // in the same minute?
 * var result = isSameMinute(
 *   new Date(2014, 8, 4, 6, 30),
 *   new Date(2014, 8, 4, 6, 30, 15)
 * )
 * //=> true
 */

function isSameMinute(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeftStartOfMinute = startOfMinute(dirtyDateLeft);
  var dateRightStartOfMinute = startOfMinute(dirtyDateRight);
  return dateLeftStartOfMinute.getTime() === dateRightStartOfMinute.getTime();
}

/**
 * @name isSameMonth
 * @category Month Helpers
 * @summary Are the given dates in the same month?
 *
 * @description
 * Are the given dates in the same month?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the first date to check
 * @param {Date|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same month
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Are 2 September 2014 and 25 September 2014 in the same month?
 * var result = isSameMonth(new Date(2014, 8, 2), new Date(2014, 8, 25))
 * //=> true
 */

function isSameMonth(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  return dateLeft.getFullYear() === dateRight.getFullYear() && dateLeft.getMonth() === dateRight.getMonth();
}

/**
 * @name startOfSecond
 * @category Second Helpers
 * @summary Return the start of a second for the given date.
 *
 * @description
 * Return the start of a second for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the start of a second
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The start of a second for 1 December 2014 22:15:45.400:
 * var result = startOfSecond(new Date(2014, 11, 1, 22, 15, 45, 400))
 * //=> Mon Dec 01 2014 22:15:45.000
 */

function startOfSecond(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  date.setMilliseconds(0);
  return date;
}

/**
 * @name isSameSecond
 * @category Second Helpers
 * @summary Are the given dates in the same second?
 *
 * @description
 * Are the given dates in the same second?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the first date to check
 * @param {Date|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same second
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Are 4 September 2014 06:30:15.000 and 4 September 2014 06:30.15.500
 * // in the same second?
 * var result = isSameSecond(
 *   new Date(2014, 8, 4, 6, 30, 15),
 *   new Date(2014, 8, 4, 6, 30, 15, 500)
 * )
 * //=> true
 */

function isSameSecond(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeftStartOfSecond = startOfSecond(dirtyDateLeft);
  var dateRightStartOfSecond = startOfSecond(dirtyDateRight);
  return dateLeftStartOfSecond.getTime() === dateRightStartOfSecond.getTime();
}

/**
 * @name isSameYear
 * @category Year Helpers
 * @summary Are the given dates in the same year?
 *
 * @description
 * Are the given dates in the same year?
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} dateLeft - the first date to check
 * @param {Date|Number} dateRight - the second date to check
 * @returns {Boolean} the dates are in the same year
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Are 2 September 2014 and 25 September 2014 in the same year?
 * var result = isSameYear(new Date(2014, 8, 2), new Date(2014, 8, 25))
 * //=> true
 */

function isSameYear(dirtyDateLeft, dirtyDateRight) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var dateLeft = toDate(dirtyDateLeft);
  var dateRight = toDate(dirtyDateRight);
  return dateLeft.getFullYear() === dateRight.getFullYear();
}

/**
 * @name isWithinInterval
 * @category Interval Helpers
 * @summary Is the given date within the interval?
 *
 * @description
 * Is the given date within the interval? (Including start and end.)
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * - The function was renamed from `isWithinRange` to `isWithinInterval`.
 *   This change was made to mirror the use of the word "interval" in standard ISO 8601:2004 terminology:
 *
 *   ```
 *   2.1.3
 *   time interval
 *   part of the time axis limited by two instants
 *   ```
 *
 *   Also, this function now accepts an object with `start` and `end` properties
 *   instead of two arguments as an interval.
 *   This function now throws `RangeError` if the start of the interval is after its end
 *   or if any date in the interval is `Invalid Date`.
 *
 *   ```javascript
 *   // Before v2.0.0
 *
 *   isWithinRange(
 *     new Date(2014, 0, 3),
 *     new Date(2014, 0, 1), new Date(2014, 0, 7)
 *   )
 *
 *   // v2.0.0 onward
 *
 *   isWithinInterval(
 *     new Date(2014, 0, 3),
 *     { start: new Date(2014, 0, 1), end: new Date(2014, 0, 7) }
 *   )
 *   ```
 *
 * @param {Date|Number} date - the date to check
 * @param {Interval} interval - the interval to check
 * @returns {Boolean} the date is within the interval
 * @throws {TypeError} 2 arguments required
 * @throws {RangeError} The start of an interval cannot be after its end
 * @throws {RangeError} Date in interval cannot be `Invalid Date`
 *
 * @example
 * // For the date within the interval:
 * isWithinInterval(new Date(2014, 0, 3), {
 *   start: new Date(2014, 0, 1),
 *   end: new Date(2014, 0, 7)
 * })
 * //=> true
 *
 * @example
 * // For the date outside of the interval:
 * isWithinInterval(new Date(2014, 0, 10), {
 *   start: new Date(2014, 0, 1),
 *   end: new Date(2014, 0, 7)
 * })
 * //=> false
 *
 * @example
 * // For date equal to interval start:
 * isWithinInterval(date, { start, end: date }) // => true
 *
 * @example
 * // For date equal to interval end:
 * isWithinInterval(date, { start: date, end }) // => true
 */

function isWithinInterval(dirtyDate, dirtyInterval) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var interval = dirtyInterval || {};
  var time = toDate(dirtyDate).getTime();
  var startTime = toDate(interval.start).getTime();
  var endTime = toDate(interval.end).getTime(); // Throw an exception if start date is after end date or if any date is `Invalid Date`

  if (!(startTime <= endTime)) {
    throw new RangeError('Invalid interval');
  }

  return time >= startTime && time <= endTime;
}

/**
 * @name subMonths
 * @category Month Helpers
 * @summary Subtract the specified number of months from the given date.
 *
 * @description
 * Subtract the specified number of months from the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of months to be subtracted
 * @returns {Date} the new date with the months subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 5 months from 1 February 2015:
 * var result = subMonths(new Date(2015, 1, 1), 5)
 * //=> Mon Sep 01 2014 00:00:00
 */

function subMonths(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var amount = toInteger(dirtyAmount);
  return addMonths(dirtyDate, -amount);
}

/**
 * @name subYears
 * @category Year Helpers
 * @summary Subtract the specified number of years from the given date.
 *
 * @description
 * Subtract the specified number of years from the given date.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of years to be subtracted
 * @returns {Date} the new date with the years subtracted
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Subtract 5 years from 1 September 2014:
 * var result = subYears(new Date(2014, 8, 1), 5)
 * //=> Tue Sep 01 2009 00:00:00
 */

function subYears(dirtyDate, dirtyAmount) {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present');
  }

  var amount = toInteger(dirtyAmount);
  return addYears(dirtyDate, -amount);
}

function buildMonths({ month, monthFormat, locale }) {
  const thisJanuary = startOfYear(month);

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => {
    const value = addMonths(thisJanuary, i);

    return { value, text: format(value, monthFormat, { locale }) };
  });
}

function buildYears({ minDate, maxDate, locale }) {
  const numYears = differenceInCalendarYears(maxDate, minDate) + 1;
  return [...Array(numYears)].map((_, i) => {
    const value = addYears(minDate, i);
    return { value, text: format(value, "yyyy", { locale }) };
  });
}

const dayOffset = ({ firstDayOfWeek, locale }) =>
  [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ].indexOf(firstDayOfWeek.toLocaleLowerCase(locale));

function isDisabled({ date, maxDate, minDate, disabledDates }) {
  if (disabledDates.some(disabledDate => isSameDay(date, disabledDate))) {
    return true;
  }

  if (isBefore(date, minDate)) {
    return true;
  }

  if (isAfter(date, maxDate)) {
    return true;
  }

  return false;
}

function isEndDate({
  tempEndDate,
  date,
  hoverDate,
  hasSelection,
  tempStartDate
}) {
  if (!hasSelection) {
    if (isAfter(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }

    return isSameDay(date, tempStartDate);
  }

  return isSameDay(date, tempEndDate);
}

function isStartDate({ hasSelection, date, hoverDate, tempStartDate }) {
  if (!hasSelection) {
    if (isBefore(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }
  }

  return isSameDay(date, tempStartDate);
}

function toRange(dateLeft, dateRight) {
  if (isBefore(dateRight, dateLeft)) {
    return {
      start: dateRight,
      end: dateLeft
    };
  }
  return {
    start: dateLeft,
    end: dateRight
  };
}

function getDayMetaData(params) {
  const {
    date,
    tempEndDate,
    events,
    hoverDate,
    hasSelection,
    month,
    singlePicker,
    tempStartDate,
    today,
    maxDate,
    minDate,
    disabledDates
  } = params;

  // Sort the range asc for `isWithinInterval` function.
  const { start, end } = toRange(
    tempStartDate,
    hasSelection ? tempEndDate : hoverDate
  );
  return {
    date,
    events,
    isToday: isSameDay(date, today),
    isWeekend: isWeekend(date),
    isPrevMonth: isSameMonth(subMonths(month, 1), date),
    isNextMonth: isSameMonth(addMonths(month, 1), date),
    isStartDate: isStartDate(params),
    isDisabled: isDisabled({ date, maxDate, minDate, disabledDates }),
    // Used only in range mode
    isEndDate: !singlePicker ? isEndDate(params) : false,
    isWithinSelection: !singlePicker
      ? isWithinInterval(date, { start, end })
      : false
  };
}

const buildWeek = (startDay, getDayMetaDataParams) =>
  [0, 1, 2, 3, 4, 5, 6].map(value =>
    getDayMetaData({ ...getDayMetaDataParams, date: addDays(startDay, value) })
  );

function getCalendarWeeks(getDayMetaDataParams) {
  const { month, locale, firstDayOfWeek, today } = getDayMetaDataParams;
  const weekStartsOn = dayOffset({ firstDayOfWeek, locale });
  const start = startOfWeek(endOfMonth(subMonths(month, 1)));

  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale }
  ).map(date => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale
    }),
    weekNumber: getWeek(date, { weekStartsOn, locale }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }));
}

const getDaysOfWeek = ({ firstDayOfWeek, locale }) =>
  [0, 1, 2, 3, 4, 5, 6].map(value =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset({ firstDayOfWeek, locale })
      }),
      value
    )
  );

const pad = n => (n < 10 ? `0${n}` : n);

const roundDown = (n, p) => Math.floor(n / p) * p;

/* src/date-range-picker/components/Day.svelte generated by Svelte v3.5.3 */

const file = "src/date-range-picker/components/Day.svelte";

// (109:4) {#if monthIndicator}
function create_if_block(ctx) {
	var span, t_value = format(ctx.day.date, 'MMM', { locale: ctx.locale }), t;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "month-indicator svelte-1bfup7i");
			add_location(span, file, 109, 6, 2083);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.day || changed.locale) && t_value !== (t_value = format(ctx.day.date, 'MMM', { locale: ctx.locale }))) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function create_fragment(ctx) {
	var div, button, t0, t1_value = format(ctx.day.date, 'd', { locale: ctx.locale }), t1, button_aria_label_value, button_aria_disabled_value, button_disabled_value, dispose;

	var if_block = (ctx.monthIndicator) && create_if_block(ctx);

	return {
		c: function create() {
			div = element("div");
			button = element("button");
			if (if_block) if_block.c();
			t0 = space();
			t1 = text(t1_value);
			attr(button, "aria-label", button_aria_label_value = format(ctx.day.date, 'EEEE, MMMM co, yyyy', { locale: ctx.locale }));
			attr(button, "aria-disabled", button_aria_disabled_value = ctx.day.isDisabled);
			attr(button, "class", "calendar-cell svelte-1bfup7i");
			button.disabled = button_disabled_value = ctx.day.isDisabled;
			add_location(button, file, 100, 2, 1712);
			attr(div, "class", "svelte-1bfup7i");
			toggle_class(div, "rtl", ctx.rtl);
			toggle_class(div, "today", ctx.day.isToday);
			toggle_class(div, "weekend", ctx.day.isWeekend);
			toggle_class(div, "next-month", ctx.day.isNextMonth);
			toggle_class(div, "prev-month", ctx.day.isPrevMonth);
			toggle_class(div, "start-date", ctx.day.isStartDate);
			toggle_class(div, "end-date", ctx.day.isEndDate);
			toggle_class(div, "within-selection", ctx.day.isWithinSelection);
			add_location(div, file, 91, 0, 1439);

			dispose = [
				listen(button, "click", ctx.click_handler),
				listen(button, "mouseenter", ctx.mouseenter_handler),
				listen(button, "focus", ctx.focus_handler)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, button);
			if (if_block) if_block.m(button, null);
			append(button, t0);
			append(button, t1);
		},

		p: function update(changed, ctx) {
			if (ctx.monthIndicator) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(button, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if ((changed.day || changed.locale) && t1_value !== (t1_value = format(ctx.day.date, 'd', { locale: ctx.locale }))) {
				set_data(t1, t1_value);
			}

			if ((changed.day || changed.locale) && button_aria_label_value !== (button_aria_label_value = format(ctx.day.date, 'EEEE, MMMM co, yyyy', { locale: ctx.locale }))) {
				attr(button, "aria-label", button_aria_label_value);
			}

			if ((changed.day) && button_aria_disabled_value !== (button_aria_disabled_value = ctx.day.isDisabled)) {
				attr(button, "aria-disabled", button_aria_disabled_value);
			}

			if ((changed.day) && button_disabled_value !== (button_disabled_value = ctx.day.isDisabled)) {
				button.disabled = button_disabled_value;
			}

			if (changed.rtl) {
				toggle_class(div, "rtl", ctx.rtl);
			}

			if (changed.day) {
				toggle_class(div, "today", ctx.day.isToday);
				toggle_class(div, "weekend", ctx.day.isWeekend);
				toggle_class(div, "next-month", ctx.day.isNextMonth);
				toggle_class(div, "prev-month", ctx.day.isPrevMonth);
				toggle_class(div, "start-date", ctx.day.isStartDate);
				toggle_class(div, "end-date", ctx.day.isEndDate);
				toggle_class(div, "within-selection", ctx.day.isWithinSelection);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	

  let { locale, day, monthIndicator, rtl } = $$props;

  const dispatchEvent = createEventDispatcher();

	const writable_props = ['locale', 'day', 'monthIndicator', 'rtl'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Day> was created with unknown prop '${key}'`);
	});

	function click_handler() {
		return dispatchEvent('selection', day.date);
	}

	function mouseenter_handler() {
		return dispatchEvent('hover', day.date);
	}

	function focus_handler() {
		return dispatchEvent('hover', day.date);
	}

	$$self.$set = $$props => {
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
		if ('day' in $$props) $$invalidate('day', day = $$props.day);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
	};

	return {
		locale,
		day,
		monthIndicator,
		rtl,
		dispatchEvent,
		click_handler,
		mouseenter_handler,
		focus_handler
	};
}

class Day extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["locale", "day", "monthIndicator", "rtl"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<Day> was created without expected prop 'locale'");
		}
		if (ctx.day === undefined && !('day' in props)) {
			console.warn("<Day> was created without expected prop 'day'");
		}
		if (ctx.monthIndicator === undefined && !('monthIndicator' in props)) {
			console.warn("<Day> was created without expected prop 'monthIndicator'");
		}
		if (ctx.rtl === undefined && !('rtl' in props)) {
			console.warn("<Day> was created without expected prop 'rtl'");
		}
	}

	get locale() {
		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get day() {
		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set day(value) {
		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthIndicator() {
		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthIndicator(value) {
		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rtl() {
		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rtl(value) {
		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/components/Week.svelte generated by Svelte v3.5.3 */

const file$1 = "src/date-range-picker/components/Week.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.day = list[i];
	return child_ctx;
}

// (60:2) {#if weekGuides && week.weeksFromToday}
function create_if_block_3(ctx) {
	var div, span, t0_value = ctx.weeksFromToday(ctx.week), t0, t1, span_aria_label_value;

	return {
		c: function create() {
			div = element("div");
			span = element("span");
			t0 = text(t0_value);
			t1 = text("w");
			attr(span, "aria-label", span_aria_label_value = `${ctx.week.weeksFromToday} weeks from today`);
			attr(span, "class", "svelte-mhpr0y");
			add_location(span, file$1, 61, 6, 1039);
			attr(div, "class", "relative calendar-row side-width left-side svelte-mhpr0y");
			add_location(div, file$1, 60, 4, 976);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, span);
			append(span, t0);
			append(span, t1);
		},

		p: function update(changed, ctx) {
			if ((changed.weeksFromToday || changed.week) && t0_value !== (t0_value = ctx.weeksFromToday(ctx.week))) {
				set_data(t0, t0_value);
			}

			if ((changed.week) && span_aria_label_value !== (span_aria_label_value = `${ctx.week.weeksFromToday} weeks from today`)) {
				attr(span, "aria-label", span_aria_label_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (69:4) {#each week.daysInWeek as day (day.date.toString())}
function create_each_block(key_1, ctx) {
	var first, current;

	var day = new Day({
		props: {
		day: ctx.day,
		locale: ctx.locale,
		monthIndicator: ctx.monthIndicator,
		rtl: ctx.rtl
	},
		$$inline: true
	});
	day.$on("selection", ctx.selection_handler);
	day.$on("hover", ctx.hover_handler);

	return {
		key: key_1,

		first: null,

		c: function create() {
			first = empty();
			day.$$.fragment.c();
			this.first = first;
		},

		m: function mount(target, anchor) {
			insert(target, first, anchor);
			mount_component(day, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var day_changes = {};
			if (changed.week) day_changes.day = ctx.day;
			if (changed.locale) day_changes.locale = ctx.locale;
			if (changed.monthIndicator) day_changes.monthIndicator = ctx.monthIndicator;
			if (changed.rtl) day_changes.rtl = ctx.rtl;
			day.$set(day_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(day.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(day.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(first);
			}

			destroy_component(day, detaching);
		}
	};
}

// (73:2) {#if weekNumbers || isoWeekNumbers}
function create_if_block$1(ctx) {
	var div, t;

	var if_block0 = (ctx.weekNumbers) && create_if_block_2(ctx);

	var if_block1 = (ctx.isoWeekNumbers) && create_if_block_1(ctx);

	return {
		c: function create() {
			div = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "class", "relative calendar-row side-width right-side svelte-mhpr0y");
			add_location(div, file$1, 73, 4, 1390);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t);
			if (if_block1) if_block1.m(div, null);
		},

		p: function update(changed, ctx) {
			if (ctx.weekNumbers) {
				if (if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(div, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (ctx.isoWeekNumbers) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (75:6) {#if weekNumbers}
function create_if_block_2(ctx) {
	var span, t_value = ctx.week.weekNumber, t, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			attr(span, "aria-label", span_aria_label_value = `Week ${ctx.week.weekNumber}`);
			attr(span, "class", "svelte-mhpr0y");
			add_location(span, file$1, 75, 8, 1480);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.week) && t_value !== (t_value = ctx.week.weekNumber)) {
				set_data(t, t_value);
			}

			if ((changed.week) && span_aria_label_value !== (span_aria_label_value = `Week ${ctx.week.weekNumber}`)) {
				attr(span, "aria-label", span_aria_label_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (78:6) {#if isoWeekNumbers}
function create_if_block_1(ctx) {
	var span, t0, t1_value = ctx.week.isoWeekNumber, t1, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t0 = text("i");
			t1 = text(t1_value);
			attr(span, "aria-label", span_aria_label_value = `Week ${ctx.week.isoWeekNumber}`);
			attr(span, "class", "svelte-mhpr0y");
			add_location(span, file$1, 78, 8, 1597);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			append(span, t1);
		},

		p: function update(changed, ctx) {
			if ((changed.week) && t1_value !== (t1_value = ctx.week.isoWeekNumber)) {
				set_data(t1, t1_value);
			}

			if ((changed.week) && span_aria_label_value !== (span_aria_label_value = `Week ${ctx.week.isoWeekNumber}`)) {
				attr(span, "aria-label", span_aria_label_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function create_fragment$1(ctx) {
	var div1, t0, div0, each_blocks = [], each_1_lookup = new Map(), t1, div1_aria_label_value, current;

	var if_block0 = (ctx.weekGuides && ctx.week.weeksFromToday) && create_if_block_3(ctx);

	var each_value = ctx.week.daysInWeek;

	const get_key = ctx => ctx.day.date.toString();

	for (var i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	var if_block1 = (ctx.weekNumbers || ctx.isoWeekNumbers) && create_if_block$1(ctx);

	return {
		c: function create() {
			div1 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div0 = element("div");

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();

			t1 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "calendar-row");
			add_location(div0, file$1, 67, 2, 1169);
			attr(div1, "aria-label", div1_aria_label_value = `${ctx.locale.code} week ${ctx.week.weekNumber}, ${format(ctx.month, 'yyyy', {
    locale: ctx.locale
  })}`);
			attr(div1, "class", "calendar-row");
			add_location(div1, file$1, 53, 0, 800);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t0);
			append(div1, div0);

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div0, null);

			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.weekGuides && ctx.week.weeksFromToday) {
				if (if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					if_block0.m(div1, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			const each_value = ctx.week.daysInWeek;

			group_outros();
			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block, null, get_each_context);
			check_outros();

			if (ctx.weekNumbers || ctx.isoWeekNumbers) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block$1(ctx);
					if_block1.c();
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if ((!current || changed.locale || changed.week || changed.month) && div1_aria_label_value !== (div1_aria_label_value = `${ctx.locale.code} week ${ctx.week.weekNumber}, ${format(ctx.month, 'yyyy', {
    locale: ctx.locale
  })}`)) {
				attr(div1, "aria-label", div1_aria_label_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			for (i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (if_block0) if_block0.d();

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();

			if (if_block1) if_block1.d();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	

  let { locale, isoWeekNumbers, month, monthIndicator, rtl, week, weekGuides, weekNumbers } = $$props;

	const writable_props = ['locale', 'isoWeekNumbers', 'month', 'monthIndicator', 'rtl', 'week', 'weekGuides', 'weekNumbers'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Week> was created with unknown prop '${key}'`);
	});

	function selection_handler(event) {
		bubble($$self, event);
	}

	function hover_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
		if ('isoWeekNumbers' in $$props) $$invalidate('isoWeekNumbers', isoWeekNumbers = $$props.isoWeekNumbers);
		if ('month' in $$props) $$invalidate('month', month = $$props.month);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
		if ('week' in $$props) $$invalidate('week', week = $$props.week);
		if ('weekGuides' in $$props) $$invalidate('weekGuides', weekGuides = $$props.weekGuides);
		if ('weekNumbers' in $$props) $$invalidate('weekNumbers', weekNumbers = $$props.weekNumbers);
	};

	let weeksFromToday;

	$$invalidate('weeksFromToday', weeksFromToday = function(week) {
        if (week.weeksFromToday > 0) {
          return `+${week.weeksFromToday}`;
        }
    
        return week.weeksFromToday;
      });

	return {
		locale,
		isoWeekNumbers,
		month,
		monthIndicator,
		rtl,
		week,
		weekGuides,
		weekNumbers,
		weeksFromToday,
		selection_handler,
		hover_handler
	};
}

class Week extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["locale", "isoWeekNumbers", "month", "monthIndicator", "rtl", "week", "weekGuides", "weekNumbers"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<Week> was created without expected prop 'locale'");
		}
		if (ctx.isoWeekNumbers === undefined && !('isoWeekNumbers' in props)) {
			console.warn("<Week> was created without expected prop 'isoWeekNumbers'");
		}
		if (ctx.month === undefined && !('month' in props)) {
			console.warn("<Week> was created without expected prop 'month'");
		}
		if (ctx.monthIndicator === undefined && !('monthIndicator' in props)) {
			console.warn("<Week> was created without expected prop 'monthIndicator'");
		}
		if (ctx.rtl === undefined && !('rtl' in props)) {
			console.warn("<Week> was created without expected prop 'rtl'");
		}
		if (ctx.week === undefined && !('week' in props)) {
			console.warn("<Week> was created without expected prop 'week'");
		}
		if (ctx.weekGuides === undefined && !('weekGuides' in props)) {
			console.warn("<Week> was created without expected prop 'weekGuides'");
		}
		if (ctx.weekNumbers === undefined && !('weekNumbers' in props)) {
			console.warn("<Week> was created without expected prop 'weekNumbers'");
		}
	}

	get locale() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isoWeekNumbers() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isoWeekNumbers(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get month() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set month(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthIndicator() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthIndicator(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rtl() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rtl(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get week() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set week(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekGuides() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekGuides(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekNumbers() {
		throw new Error("<Week>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekNumbers(value) {
		throw new Error("<Week>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/components/DaysOfWeek.svelte generated by Svelte v3.5.3 */

const file$2 = "src/date-range-picker/components/DaysOfWeek.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.dayOfWeek = list[i];
	return child_ctx;
}

// (19:2) {#each daysOfWeek as dayOfWeek}
function create_each_block$1(ctx) {
	var span, t0_value = format(ctx.dayOfWeek, 'eeeeee', { locale: ctx.locale }), t0, t1, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			attr(span, "class", "calendar-cell svelte-e9ppe7");
			attr(span, "aria-label", span_aria_label_value = format(ctx.dayOfWeek, 'EEEE', { locale: ctx.locale }));
			add_location(span, file$2, 19, 4, 350);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			append(span, t1);
		},

		p: function update(changed, ctx) {
			if ((changed.daysOfWeek || changed.locale) && t0_value !== (t0_value = format(ctx.dayOfWeek, 'eeeeee', { locale: ctx.locale }))) {
				set_data(t0, t0_value);
			}

			if ((changed.daysOfWeek || changed.locale) && span_aria_label_value !== (span_aria_label_value = format(ctx.dayOfWeek, 'EEEE', { locale: ctx.locale }))) {
				attr(span, "aria-label", span_aria_label_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

function create_fragment$2(ctx) {
	var div;

	var each_value = ctx.daysOfWeek;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c: function create() {
			div = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(div, "class", "calendar-row");
			add_location(div, file$2, 17, 0, 285);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.format || changed.daysOfWeek || changed.locale) {
				each_value = ctx.daysOfWeek;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	

  let { firstDayOfWeek, locale } = $$props;

	const writable_props = ['firstDayOfWeek', 'locale'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DaysOfWeek> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('firstDayOfWeek' in $$props) $$invalidate('firstDayOfWeek', firstDayOfWeek = $$props.firstDayOfWeek);
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
	};

	let daysOfWeek;

	$$self.$$.update = ($$dirty = { firstDayOfWeek: 1, locale: 1 }) => {
		if ($$dirty.firstDayOfWeek || $$dirty.locale) { $$invalidate('daysOfWeek', daysOfWeek = getDaysOfWeek({ firstDayOfWeek, locale })); }
	};

	return { firstDayOfWeek, locale, daysOfWeek };
}

class DaysOfWeek extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["firstDayOfWeek", "locale"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.firstDayOfWeek === undefined && !('firstDayOfWeek' in props)) {
			console.warn("<DaysOfWeek> was created without expected prop 'firstDayOfWeek'");
		}
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<DaysOfWeek> was created without expected prop 'locale'");
		}
	}

	get firstDayOfWeek() {
		throw new Error("<DaysOfWeek>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set firstDayOfWeek(value) {
		throw new Error("<DaysOfWeek>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get locale() {
		throw new Error("<DaysOfWeek>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<DaysOfWeek>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/components/Controls.svelte generated by Svelte v3.5.3 */

const file$3 = "src/date-range-picker/components/Controls.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.yr = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.mo = list[i];
	return child_ctx;
}

// (88:4) {:else}
function create_else_block_1(ctx) {
	var span, t_value = format(ctx.month, 'MMMM', { locale: ctx.locale }), t;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$3, 88, 6, 2362);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.month || changed.locale) && t_value !== (t_value = format(ctx.month, 'MMMM', { locale: ctx.locale }))) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (69:4) {#if monthDropdown}
function create_if_block_1$1(ctx) {
	var select, dispose;

	var each_value_1 = ctx.months;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c: function create() {
			select = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			if (ctx.selectedMonth === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			attr(select, "class", "select");
			add_location(select, file$3, 69, 6, 1835);

			dispose = [
				listen(select, "change", ctx.select_change_handler),
				listen(select, "change", ctx.change_handler)
			];
		},

		m: function mount(target, anchor) {
			insert(target, select, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, ctx.selectedMonth);
		},

		p: function update(changed, ctx) {
			if (changed.months || changed.isSameMonth || changed.month || changed.isOptionDisabled) {
				each_value_1 = ctx.months;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
			}

			if (changed.selectedMonth) select_option(select, ctx.selectedMonth);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(select);
			}

			destroy_each(each_blocks, detaching);

			run_all(dispose);
		}
	};
}

// (79:8) {#each months as mo}
function create_each_block_1(ctx) {
	var option, t_value = ctx.mo.text, t, option_value_value, option_selected_value, option_disabled_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = ctx.mo;
			option.value = option.__value;
			option.selected = option_selected_value = isSameMonth(ctx.mo.value, ctx.month);
			option.disabled = option_disabled_value = ctx.isOptionDisabled(ctx.mo.value);
			add_location(option, file$3, 79, 10, 2136);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.months) && t_value !== (t_value = ctx.mo.text)) {
				set_data(t, t_value);
			}

			if ((changed.months) && option_value_value !== (option_value_value = ctx.mo)) {
				option.__value = option_value_value;
			}

			option.value = option.__value;

			if ((changed.months || changed.month) && option_selected_value !== (option_selected_value = isSameMonth(ctx.mo.value, ctx.month))) {
				option.selected = option_selected_value;
			}

			if ((changed.isOptionDisabled || changed.months) && option_disabled_value !== (option_disabled_value = ctx.isOptionDisabled(ctx.mo.value))) {
				option.disabled = option_disabled_value;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (108:4) {:else}
function create_else_block(ctx) {
	var span, t_value = format(ctx.month, 'yyyy', { locale: ctx.locale }), t;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$3, 108, 6, 2949);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.month || changed.locale) && t_value !== (t_value = format(ctx.month, 'yyyy', { locale: ctx.locale }))) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (91:4) {#if yearDropdown}
function create_if_block$2(ctx) {
	var select, dispose;

	var each_value = ctx.years;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c: function create() {
			select = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			if (ctx.selectedYear === void 0) add_render_callback(() => ctx.select_change_handler_1.call(select));
			attr(select, "class", "select");
			add_location(select, file$3, 91, 6, 2450);

			dispose = [
				listen(select, "change", ctx.select_change_handler_1),
				listen(select, "change", ctx.change_handler_1)
			];
		},

		m: function mount(target, anchor) {
			insert(target, select, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, ctx.selectedYear);
		},

		p: function update(changed, ctx) {
			if (changed.years || changed.isSameYear || changed.month || changed.isOptionDisabled) {
				each_value = ctx.years;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.selectedYear) select_option(select, ctx.selectedYear);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(select);
			}

			destroy_each(each_blocks, detaching);

			run_all(dispose);
		}
	};
}

// (99:8) {#each years as yr}
function create_each_block$2(ctx) {
	var option, t_value = ctx.yr.text, t, option_value_value, option_selected_value, option_disabled_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = ctx.yr;
			option.value = option.__value;
			option.selected = option_selected_value = isSameYear(ctx.yr.value, ctx.month);
			option.disabled = option_disabled_value = ctx.isOptionDisabled(ctx.yr.value);
			add_location(option, file$3, 99, 10, 2724);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.years) && t_value !== (t_value = ctx.yr.text)) {
				set_data(t, t_value);
			}

			if ((changed.years) && option_value_value !== (option_value_value = ctx.yr)) {
				option.__value = option_value_value;
			}

			option.value = option.__value;

			if ((changed.years || changed.month) && option_selected_value !== (option_selected_value = isSameYear(ctx.yr.value, ctx.month))) {
				option.selected = option_selected_value;
			}

			if ((changed.isOptionDisabled || changed.years) && option_disabled_value !== (option_disabled_value = ctx.isOptionDisabled(ctx.yr.value))) {
				option.disabled = option_disabled_value;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

function create_fragment$3(ctx) {
	var div, button0, button0_aria_label_value, t0, span, t1, t2, button1, button1_aria_label_value, dispose;

	function select_block_type(ctx) {
		if (ctx.monthDropdown) return create_if_block_1$1;
		return create_else_block_1;
	}

	var current_block_type = select_block_type(ctx);
	var if_block0 = current_block_type(ctx);

	function select_block_type_1(ctx) {
		if (ctx.yearDropdown) return create_if_block$2;
		return create_else_block;
	}

	var current_block_type_1 = select_block_type_1(ctx);
	var if_block1 = current_block_type_1(ctx);

	return {
		c: function create() {
			div = element("div");
			button0 = element("button");
			t0 = space();
			span = element("span");
			if_block0.c();
			t1 = space();
			if_block1.c();
			t2 = space();
			button1 = element("button");
			attr(button0, "class", "select");
			attr(button0, "aria-disabled", ctx.prevBtnDisabled);
			button0.disabled = ctx.prevBtnDisabled;
			attr(button0, "type", "button");
			attr(button0, "aria-label", button0_aria_label_value = `Previous month, ${format(ctx.prevMonth, 'MMMM yyyy', {
      locale: ctx.locale
    })}`);
			add_location(button0, file$3, 56, 2, 1511);
			add_location(span, file$3, 67, 2, 1798);
			attr(button1, "class", "select");
			attr(button1, "aria-disabled", ctx.nextBtnDisabled);
			button1.disabled = ctx.nextBtnDisabled;
			attr(button1, "type", "button");
			attr(button1, "aria-label", button1_aria_label_value = `Next month, ${format(ctx.nextMonth, 'MMMM yyyy', { locale: ctx.locale })}`);
			add_location(button1, file$3, 111, 2, 3020);
			attr(div, "class", "svelte-1lbwxhk");
			add_location(div, file$3, 55, 0, 1503);

			dispose = [
				listen(button0, "click", ctx.click_handler),
				listen(button1, "click", ctx.click_handler_1)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, button0);
			button0.innerHTML = ctx.prevIcon;
			append(div, t0);
			append(div, span);
			if_block0.m(span, null);
			append(span, t1);
			if_block1.m(span, null);
			append(div, t2);
			append(div, button1);
			button1.innerHTML = ctx.nextIcon;
		},

		p: function update(changed, ctx) {
			if (changed.prevIcon) {
				button0.innerHTML = ctx.prevIcon;
			}

			if (changed.prevBtnDisabled) {
				attr(button0, "aria-disabled", ctx.prevBtnDisabled);
				button0.disabled = ctx.prevBtnDisabled;
			}

			if ((changed.prevMonth || changed.locale) && button0_aria_label_value !== (button0_aria_label_value = `Previous month, ${format(ctx.prevMonth, 'MMMM yyyy', {
      locale: ctx.locale
    })}`)) {
				attr(button0, "aria-label", button0_aria_label_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(changed, ctx);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);
				if (if_block0) {
					if_block0.c();
					if_block0.m(span, t1);
				}
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
				if_block1.p(changed, ctx);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type_1(ctx);
				if (if_block1) {
					if_block1.c();
					if_block1.m(span, null);
				}
			}

			if (changed.nextIcon) {
				button1.innerHTML = ctx.nextIcon;
			}

			if (changed.nextBtnDisabled) {
				attr(button1, "aria-disabled", ctx.nextBtnDisabled);
				button1.disabled = ctx.nextBtnDisabled;
			}

			if ((changed.nextMonth || changed.locale) && button1_aria_label_value !== (button1_aria_label_value = `Next month, ${format(ctx.nextMonth, 'MMMM yyyy', { locale: ctx.locale })}`)) {
				attr(button1, "aria-label", button1_aria_label_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block0.d();
			if_block1.d();
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	

  let { locale, month, monthFormat, monthDropdown, maxDate, minDate, nextIcon, prevIcon, yearDropdown } = $$props;

  const disptachEvent = createEventDispatcher();

	const writable_props = ['locale', 'month', 'monthFormat', 'monthDropdown', 'maxDate', 'minDate', 'nextIcon', 'prevIcon', 'yearDropdown'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Controls> was created with unknown prop '${key}'`);
	});

	function click_handler() {
		return disptachEvent('prevMonth');
	}

	function select_change_handler() {
		selectedMonth = select_value(this);
		$$invalidate('selectedMonth', selectedMonth), $$invalidate('month', month), $$invalidate('monthFormat', monthFormat), $$invalidate('locale', locale);
		$$invalidate('months', months), $$invalidate('month', month), $$invalidate('monthFormat', monthFormat), $$invalidate('locale', locale);
	}

	function change_handler() {
		return disptachEvent('pageChange', {
	            incrementAmount: differenceInCalendarMonths(
	              selectedMonth.value,
	              month
	            )
	          });
	}

	function select_change_handler_1() {
		selectedYear = select_value(this);
		$$invalidate('selectedYear', selectedYear), $$invalidate('month', month), $$invalidate('locale', locale);
		$$invalidate('years', years), $$invalidate('minDate', minDate), $$invalidate('maxDate', maxDate), $$invalidate('locale', locale);
	}

	function change_handler_1() {
		return disptachEvent('pageChange', {
	            incrementAmount:
	              differenceInCalendarYears(selectedYear.value, month) * 12
	          });
	}

	function click_handler_1() {
		return disptachEvent('nextMonth');
	}

	$$self.$set = $$props => {
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
		if ('month' in $$props) $$invalidate('month', month = $$props.month);
		if ('monthFormat' in $$props) $$invalidate('monthFormat', monthFormat = $$props.monthFormat);
		if ('monthDropdown' in $$props) $$invalidate('monthDropdown', monthDropdown = $$props.monthDropdown);
		if ('maxDate' in $$props) $$invalidate('maxDate', maxDate = $$props.maxDate);
		if ('minDate' in $$props) $$invalidate('minDate', minDate = $$props.minDate);
		if ('nextIcon' in $$props) $$invalidate('nextIcon', nextIcon = $$props.nextIcon);
		if ('prevIcon' in $$props) $$invalidate('prevIcon', prevIcon = $$props.prevIcon);
		if ('yearDropdown' in $$props) $$invalidate('yearDropdown', yearDropdown = $$props.yearDropdown);
	};

	let selectedMonth, selectedYear, prevMonth, nextMonth, isMaxDate, isMinDate, months, years, nextBtnDisabled, prevBtnDisabled, isOptionDisabled;

	$$self.$$.update = ($$dirty = { month: 1, monthFormat: 1, locale: 1, maxDate: 1, minDate: 1 }) => {
		if ($$dirty.month || $$dirty.monthFormat || $$dirty.locale) { $$invalidate('selectedMonth', selectedMonth = {
        value: month,
        text: format(month, monthFormat, { locale })
      }); }
		if ($$dirty.month || $$dirty.locale) { $$invalidate('selectedYear', selectedYear = { value: month, text: format(month, "yyyy", { locale }) }); }
		if ($$dirty.month) { $$invalidate('prevMonth', prevMonth = subMonths(month, 1)); }
		if ($$dirty.month) { $$invalidate('nextMonth', nextMonth = addMonths(month, 1)); }
		if ($$dirty.month || $$dirty.maxDate) { isMaxDate = isAfter(month, maxDate) || isSameMonth(month, maxDate); }
		if ($$dirty.month || $$dirty.minDate) { isMinDate = isBefore(month, minDate) || isSameMonth(month, minDate); }
		if ($$dirty.month || $$dirty.monthFormat || $$dirty.locale) { $$invalidate('months', months = buildMonths({ month, monthFormat, locale })); }
		if ($$dirty.minDate || $$dirty.maxDate || $$dirty.locale) { $$invalidate('years', years = buildYears({ minDate, maxDate, locale })); }
		if ($$dirty.month || $$dirty.maxDate) { $$invalidate('nextBtnDisabled', nextBtnDisabled = isSameMonth(month, maxDate) || isAfter(month, maxDate)); }
		if ($$dirty.month || $$dirty.minDate) { $$invalidate('prevBtnDisabled', prevBtnDisabled = isSameMonth(month, minDate) || isBefore(month, minDate)); }
		if ($$dirty.minDate || $$dirty.maxDate) { $$invalidate('isOptionDisabled', isOptionDisabled = mo =>
        isBefore(mo, minDate) ||
        (!isSameMonth(mo, minDate) && isAfter(mo, maxDate))); }
	};

	return {
		locale,
		month,
		monthFormat,
		monthDropdown,
		maxDate,
		minDate,
		nextIcon,
		prevIcon,
		yearDropdown,
		disptachEvent,
		selectedMonth,
		selectedYear,
		prevMonth,
		nextMonth,
		months,
		years,
		nextBtnDisabled,
		prevBtnDisabled,
		isOptionDisabled,
		click_handler,
		select_change_handler,
		change_handler,
		select_change_handler_1,
		change_handler_1,
		click_handler_1
	};
}

class Controls extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["locale", "month", "monthFormat", "monthDropdown", "maxDate", "minDate", "nextIcon", "prevIcon", "yearDropdown"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<Controls> was created without expected prop 'locale'");
		}
		if (ctx.month === undefined && !('month' in props)) {
			console.warn("<Controls> was created without expected prop 'month'");
		}
		if (ctx.monthFormat === undefined && !('monthFormat' in props)) {
			console.warn("<Controls> was created without expected prop 'monthFormat'");
		}
		if (ctx.monthDropdown === undefined && !('monthDropdown' in props)) {
			console.warn("<Controls> was created without expected prop 'monthDropdown'");
		}
		if (ctx.maxDate === undefined && !('maxDate' in props)) {
			console.warn("<Controls> was created without expected prop 'maxDate'");
		}
		if (ctx.minDate === undefined && !('minDate' in props)) {
			console.warn("<Controls> was created without expected prop 'minDate'");
		}
		if (ctx.nextIcon === undefined && !('nextIcon' in props)) {
			console.warn("<Controls> was created without expected prop 'nextIcon'");
		}
		if (ctx.prevIcon === undefined && !('prevIcon' in props)) {
			console.warn("<Controls> was created without expected prop 'prevIcon'");
		}
		if (ctx.yearDropdown === undefined && !('yearDropdown' in props)) {
			console.warn("<Controls> was created without expected prop 'yearDropdown'");
		}
	}

	get locale() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get month() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set month(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthFormat() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthFormat(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthDropdown() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthDropdown(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maxDate() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxDate(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get minDate() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minDate(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get nextIcon() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set nextIcon(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get prevIcon() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set prevIcon(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get yearDropdown() {
		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set yearDropdown(value) {
		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/components/Calendar.svelte generated by Svelte v3.5.3 */

const file$4 = "src/date-range-picker/components/Calendar.svelte";

function get_each_context$3(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.week = list[i];
	return child_ctx;
}

// (70:2) {#each weeks as week}
function create_each_block$3(ctx) {
	var current;

	var week = new Week({
		props: {
		week: ctx.week,
		singlePicker: ctx.singlePicker,
		locale: ctx.locale,
		month: ctx.month,
		monthIndicator: ctx.monthIndicator,
		rtl: ctx.rtl,
		weekGuides: ctx.weekGuides,
		weekNumbers: ctx.weekNumbers,
		isoWeekNumbers: ctx.isoWeekNumbers
	},
		$$inline: true
	});
	week.$on("selection", ctx.selection_handler);
	week.$on("hover", ctx.hover_handler);

	return {
		c: function create() {
			week.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(week, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var week_changes = {};
			if (changed.weeks) week_changes.week = ctx.week;
			if (changed.singlePicker) week_changes.singlePicker = ctx.singlePicker;
			if (changed.locale) week_changes.locale = ctx.locale;
			if (changed.month) week_changes.month = ctx.month;
			if (changed.monthIndicator) week_changes.monthIndicator = ctx.monthIndicator;
			if (changed.rtl) week_changes.rtl = ctx.rtl;
			if (changed.weekGuides) week_changes.weekGuides = ctx.weekGuides;
			if (changed.weekNumbers) week_changes.weekNumbers = ctx.weekNumbers;
			if (changed.isoWeekNumbers) week_changes.isoWeekNumbers = ctx.isoWeekNumbers;
			week.$set(week_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(week.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(week.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(week, detaching);
		}
	};
}

function create_fragment$4(ctx) {
	var div, t0, t1, div_style_value, current;

	var controls = new Controls({
		props: {
		prevIcon: ctx.prevIcon,
		nextIcon: ctx.nextIcon,
		locale: ctx.locale,
		month: ctx.month,
		monthDropdown: ctx.monthDropdown,
		monthFormat: ctx.monthFormat,
		maxDate: ctx.maxDate,
		minDate: ctx.minDate,
		yearDropdown: ctx.yearDropdown
	},
		$$inline: true
	});
	controls.$on("pageChange", ctx.pageChange_handler);
	controls.$on("prevMonth", ctx.prevMonth_handler);
	controls.$on("nextMonth", ctx.nextMonth_handler);

	var daysofweek = new DaysOfWeek({
		props: {
		firstDayOfWeek: ctx.firstDayOfWeek,
		locale: ctx.locale
	},
		$$inline: true
	});

	var each_value = ctx.weeks;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			div = element("div");
			controls.$$.fragment.c();
			t0 = space();
			daysofweek.$$.fragment.c();
			t1 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(div, "style", div_style_value = `width: ${ctx.pageWidth}px;`);
			attr(div, "class", "svelte-yh7cpf");
			add_location(div, file$4, 54, 0, 1090);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(controls, div, null);
			append(div, t0);
			mount_component(daysofweek, div, null);
			append(div, t1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			var controls_changes = {};
			if (changed.prevIcon) controls_changes.prevIcon = ctx.prevIcon;
			if (changed.nextIcon) controls_changes.nextIcon = ctx.nextIcon;
			if (changed.locale) controls_changes.locale = ctx.locale;
			if (changed.month) controls_changes.month = ctx.month;
			if (changed.monthDropdown) controls_changes.monthDropdown = ctx.monthDropdown;
			if (changed.monthFormat) controls_changes.monthFormat = ctx.monthFormat;
			if (changed.maxDate) controls_changes.maxDate = ctx.maxDate;
			if (changed.minDate) controls_changes.minDate = ctx.minDate;
			if (changed.yearDropdown) controls_changes.yearDropdown = ctx.yearDropdown;
			controls.$set(controls_changes);

			var daysofweek_changes = {};
			if (changed.firstDayOfWeek) daysofweek_changes.firstDayOfWeek = ctx.firstDayOfWeek;
			if (changed.locale) daysofweek_changes.locale = ctx.locale;
			daysofweek.$set(daysofweek_changes);

			if (changed.weeks || changed.singlePicker || changed.locale || changed.month || changed.monthIndicator || changed.rtl || changed.weekGuides || changed.weekNumbers || changed.isoWeekNumbers) {
				each_value = ctx.weeks;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if ((!current || changed.pageWidth) && div_style_value !== (div_style_value = `width: ${ctx.pageWidth}px;`)) {
				attr(div, "style", div_style_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(controls.$$.fragment, local);

			transition_in(daysofweek.$$.fragment, local);

			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			transition_out(controls.$$.fragment, local);
			transition_out(daysofweek.$$.fragment, local);

			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(controls, );

			destroy_component(daysofweek, );

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	

  let { disabledDates, events, hasSelection, hoverDate, firstDayOfWeek, isoWeekNumbers, locale, maxDate, minDate, month, monthDropdown, monthFormat, monthIndicator, pageWidth, rtl, prevIcon, nextIcon, singlePicker, tempEndDate, tempStartDate, today, weekGuides, weekNumbers, yearDropdown } = $$props;

	const writable_props = ['disabledDates', 'events', 'hasSelection', 'hoverDate', 'firstDayOfWeek', 'isoWeekNumbers', 'locale', 'maxDate', 'minDate', 'month', 'monthDropdown', 'monthFormat', 'monthIndicator', 'pageWidth', 'rtl', 'prevIcon', 'nextIcon', 'singlePicker', 'tempEndDate', 'tempStartDate', 'today', 'weekGuides', 'weekNumbers', 'yearDropdown'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Calendar> was created with unknown prop '${key}'`);
	});

	function pageChange_handler(event) {
		bubble($$self, event);
	}

	function prevMonth_handler(event) {
		bubble($$self, event);
	}

	function nextMonth_handler(event) {
		bubble($$self, event);
	}

	function selection_handler(event) {
		bubble($$self, event);
	}

	function hover_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('disabledDates' in $$props) $$invalidate('disabledDates', disabledDates = $$props.disabledDates);
		if ('events' in $$props) $$invalidate('events', events = $$props.events);
		if ('hasSelection' in $$props) $$invalidate('hasSelection', hasSelection = $$props.hasSelection);
		if ('hoverDate' in $$props) $$invalidate('hoverDate', hoverDate = $$props.hoverDate);
		if ('firstDayOfWeek' in $$props) $$invalidate('firstDayOfWeek', firstDayOfWeek = $$props.firstDayOfWeek);
		if ('isoWeekNumbers' in $$props) $$invalidate('isoWeekNumbers', isoWeekNumbers = $$props.isoWeekNumbers);
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
		if ('maxDate' in $$props) $$invalidate('maxDate', maxDate = $$props.maxDate);
		if ('minDate' in $$props) $$invalidate('minDate', minDate = $$props.minDate);
		if ('month' in $$props) $$invalidate('month', month = $$props.month);
		if ('monthDropdown' in $$props) $$invalidate('monthDropdown', monthDropdown = $$props.monthDropdown);
		if ('monthFormat' in $$props) $$invalidate('monthFormat', monthFormat = $$props.monthFormat);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('pageWidth' in $$props) $$invalidate('pageWidth', pageWidth = $$props.pageWidth);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
		if ('prevIcon' in $$props) $$invalidate('prevIcon', prevIcon = $$props.prevIcon);
		if ('nextIcon' in $$props) $$invalidate('nextIcon', nextIcon = $$props.nextIcon);
		if ('singlePicker' in $$props) $$invalidate('singlePicker', singlePicker = $$props.singlePicker);
		if ('tempEndDate' in $$props) $$invalidate('tempEndDate', tempEndDate = $$props.tempEndDate);
		if ('tempStartDate' in $$props) $$invalidate('tempStartDate', tempStartDate = $$props.tempStartDate);
		if ('today' in $$props) $$invalidate('today', today = $$props.today);
		if ('weekGuides' in $$props) $$invalidate('weekGuides', weekGuides = $$props.weekGuides);
		if ('weekNumbers' in $$props) $$invalidate('weekNumbers', weekNumbers = $$props.weekNumbers);
		if ('yearDropdown' in $$props) $$invalidate('yearDropdown', yearDropdown = $$props.yearDropdown);
	};

	let weeks;

	$$self.$$.update = ($$dirty = { month: 1, firstDayOfWeek: 1, locale: 1, events: 1, disabledDates: 1, tempStartDate: 1, hoverDate: 1, hasSelection: 1, minDate: 1, maxDate: 1, today: 1, tempEndDate: 1, singlePicker: 1 }) => {
		if ($$dirty.month || $$dirty.firstDayOfWeek || $$dirty.locale || $$dirty.events || $$dirty.disabledDates || $$dirty.tempStartDate || $$dirty.hoverDate || $$dirty.hasSelection || $$dirty.minDate || $$dirty.maxDate || $$dirty.today || $$dirty.tempEndDate || $$dirty.singlePicker) { $$invalidate('weeks', weeks = getCalendarWeeks({
        month,
        firstDayOfWeek,
        locale,
        events,
        disabledDates,
        tempStartDate,
        hoverDate,
        hasSelection,
        minDate,
        maxDate,
        today,
        tempEndDate,
        singlePicker
      })); }
	};

	return {
		disabledDates,
		events,
		hasSelection,
		hoverDate,
		firstDayOfWeek,
		isoWeekNumbers,
		locale,
		maxDate,
		minDate,
		month,
		monthDropdown,
		monthFormat,
		monthIndicator,
		pageWidth,
		rtl,
		prevIcon,
		nextIcon,
		singlePicker,
		tempEndDate,
		tempStartDate,
		today,
		weekGuides,
		weekNumbers,
		yearDropdown,
		weeks,
		pageChange_handler,
		prevMonth_handler,
		nextMonth_handler,
		selection_handler,
		hover_handler
	};
}

class Calendar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["disabledDates", "events", "hasSelection", "hoverDate", "firstDayOfWeek", "isoWeekNumbers", "locale", "maxDate", "minDate", "month", "monthDropdown", "monthFormat", "monthIndicator", "pageWidth", "rtl", "prevIcon", "nextIcon", "singlePicker", "tempEndDate", "tempStartDate", "today", "weekGuides", "weekNumbers", "yearDropdown"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.disabledDates === undefined && !('disabledDates' in props)) {
			console.warn("<Calendar> was created without expected prop 'disabledDates'");
		}
		if (ctx.events === undefined && !('events' in props)) {
			console.warn("<Calendar> was created without expected prop 'events'");
		}
		if (ctx.hasSelection === undefined && !('hasSelection' in props)) {
			console.warn("<Calendar> was created without expected prop 'hasSelection'");
		}
		if (ctx.hoverDate === undefined && !('hoverDate' in props)) {
			console.warn("<Calendar> was created without expected prop 'hoverDate'");
		}
		if (ctx.firstDayOfWeek === undefined && !('firstDayOfWeek' in props)) {
			console.warn("<Calendar> was created without expected prop 'firstDayOfWeek'");
		}
		if (ctx.isoWeekNumbers === undefined && !('isoWeekNumbers' in props)) {
			console.warn("<Calendar> was created without expected prop 'isoWeekNumbers'");
		}
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<Calendar> was created without expected prop 'locale'");
		}
		if (ctx.maxDate === undefined && !('maxDate' in props)) {
			console.warn("<Calendar> was created without expected prop 'maxDate'");
		}
		if (ctx.minDate === undefined && !('minDate' in props)) {
			console.warn("<Calendar> was created without expected prop 'minDate'");
		}
		if (ctx.month === undefined && !('month' in props)) {
			console.warn("<Calendar> was created without expected prop 'month'");
		}
		if (ctx.monthDropdown === undefined && !('monthDropdown' in props)) {
			console.warn("<Calendar> was created without expected prop 'monthDropdown'");
		}
		if (ctx.monthFormat === undefined && !('monthFormat' in props)) {
			console.warn("<Calendar> was created without expected prop 'monthFormat'");
		}
		if (ctx.monthIndicator === undefined && !('monthIndicator' in props)) {
			console.warn("<Calendar> was created without expected prop 'monthIndicator'");
		}
		if (ctx.pageWidth === undefined && !('pageWidth' in props)) {
			console.warn("<Calendar> was created without expected prop 'pageWidth'");
		}
		if (ctx.rtl === undefined && !('rtl' in props)) {
			console.warn("<Calendar> was created without expected prop 'rtl'");
		}
		if (ctx.prevIcon === undefined && !('prevIcon' in props)) {
			console.warn("<Calendar> was created without expected prop 'prevIcon'");
		}
		if (ctx.nextIcon === undefined && !('nextIcon' in props)) {
			console.warn("<Calendar> was created without expected prop 'nextIcon'");
		}
		if (ctx.singlePicker === undefined && !('singlePicker' in props)) {
			console.warn("<Calendar> was created without expected prop 'singlePicker'");
		}
		if (ctx.tempEndDate === undefined && !('tempEndDate' in props)) {
			console.warn("<Calendar> was created without expected prop 'tempEndDate'");
		}
		if (ctx.tempStartDate === undefined && !('tempStartDate' in props)) {
			console.warn("<Calendar> was created without expected prop 'tempStartDate'");
		}
		if (ctx.today === undefined && !('today' in props)) {
			console.warn("<Calendar> was created without expected prop 'today'");
		}
		if (ctx.weekGuides === undefined && !('weekGuides' in props)) {
			console.warn("<Calendar> was created without expected prop 'weekGuides'");
		}
		if (ctx.weekNumbers === undefined && !('weekNumbers' in props)) {
			console.warn("<Calendar> was created without expected prop 'weekNumbers'");
		}
		if (ctx.yearDropdown === undefined && !('yearDropdown' in props)) {
			console.warn("<Calendar> was created without expected prop 'yearDropdown'");
		}
	}

	get disabledDates() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabledDates(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get events() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set events(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hasSelection() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hasSelection(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hoverDate() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hoverDate(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get firstDayOfWeek() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set firstDayOfWeek(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isoWeekNumbers() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isoWeekNumbers(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get locale() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maxDate() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxDate(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get minDate() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minDate(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get month() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set month(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthDropdown() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthDropdown(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthFormat() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthFormat(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthIndicator() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthIndicator(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get pageWidth() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set pageWidth(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rtl() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rtl(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get prevIcon() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set prevIcon(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get nextIcon() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set nextIcon(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get singlePicker() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set singlePicker(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tempEndDate() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tempEndDate(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tempStartDate() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tempStartDate(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get today() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set today(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekGuides() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekGuides(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekNumbers() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekNumbers(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get yearDropdown() {
		throw new Error("<Calendar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set yearDropdown(value) {
		throw new Error("<Calendar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/components/TimePicker.svelte generated by Svelte v3.5.3 */

const file$5 = "src/date-range-picker/components/TimePicker.svelte";

function get_each_context$4(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.second = list[i];
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.minute = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.hour = list[i];
	return child_ctx;
}

// (47:4) {#each hours as hour}
function create_each_block_2(ctx) {
	var option, t_value = ctx.hour, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.hour);
			option.value = option.__value;
			add_location(option, file$5, 47, 6, 1208);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.hours) && t_value !== (t_value = ctx.hour)) {
				set_data(t, t_value);
			}

			if ((changed.hours) && option_value_value !== (option_value_value = parseInt(ctx.hour))) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (52:4) {#each minutes as minute}
function create_each_block_1$1(ctx) {
	var option, t_value = ctx.minute, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.minute);
			option.value = option.__value;
			add_location(option, file$5, 52, 6, 1392);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.minutes) && t_value !== (t_value = ctx.minute)) {
				set_data(t, t_value);
			}

			if ((changed.minutes) && option_value_value !== (option_value_value = parseInt(ctx.minute))) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

// (56:2) {#if timePickerSeconds}
function create_if_block$3(ctx) {
	var select, dispose;

	var each_value = ctx.seconds;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	return {
		c: function create() {
			select = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			if (ctx.selectedSecond === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
			attr(select, "class", "select");
			add_location(select, file$5, 56, 4, 1497);

			dispose = [
				listen(select, "change", ctx.select_change_handler),
				listen(select, "change", ctx.timeChange)
			];
		},

		m: function mount(target, anchor) {
			insert(target, select, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, ctx.selectedSecond);
		},

		p: function update(changed, ctx) {
			if (changed.seconds) {
				each_value = ctx.seconds;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			if (changed.selectedSecond) select_option(select, ctx.selectedSecond);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(select);
			}

			destroy_each(each_blocks, detaching);

			run_all(dispose);
		}
	};
}

// (58:6) {#each seconds as second}
function create_each_block$4(ctx) {
	var option, t_value = ctx.second, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.second);
			option.value = option.__value;
			add_location(option, file$5, 58, 8, 1612);
		},

		m: function mount(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.seconds) && t_value !== (t_value = ctx.second)) {
				set_data(t, t_value);
			}

			if ((changed.seconds) && option_value_value !== (option_value_value = parseInt(ctx.second))) {
				option.__value = option_value_value;
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

function create_fragment$5(ctx) {
	var div, select0, t0, select1, t1, dispose;

	var each_value_2 = ctx.hours;

	var each_blocks_1 = [];

	for (var i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	var each_value_1 = ctx.minutes;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	var if_block = (ctx.timePickerSeconds) && create_if_block$3(ctx);

	return {
		c: function create() {
			div = element("div");
			select0 = element("select");

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			select1 = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			if (if_block) if_block.c();
			if (ctx.selectedHour === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
			attr(select0, "class", "select");
			add_location(select0, file$5, 45, 2, 1103);
			if (ctx.selectedMinute === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
			attr(select1, "class", "select");
			add_location(select1, file$5, 50, 2, 1281);
			attr(div, "class", "svelte-18htmwd");
			add_location(div, file$5, 44, 0, 1095);

			dispose = [
				listen(select0, "change", ctx.select0_change_handler),
				listen(select0, "change", ctx.timeChange),
				listen(select1, "change", ctx.select1_change_handler),
				listen(select1, "change", ctx.timeChange)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, select0);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(select0, null);
			}

			select_option(select0, ctx.selectedHour);

			append(div, t0);
			append(div, select1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select1, null);
			}

			select_option(select1, ctx.selectedMinute);

			append(div, t1);
			if (if_block) if_block.m(div, null);
		},

		p: function update(changed, ctx) {
			if (changed.hours) {
				each_value_2 = ctx.hours;

				for (var i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(select0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}
				each_blocks_1.length = each_value_2.length;
			}

			if (changed.selectedHour) select_option(select0, ctx.selectedHour);

			if (changed.minutes) {
				each_value_1 = ctx.minutes;

				for (var i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
			}

			if (changed.selectedMinute) select_option(select1, ctx.selectedMinute);

			if (ctx.timePickerSeconds) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks_1, detaching);

			destroy_each(each_blocks, detaching);

			if (if_block) if_block.d();
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	
  let { minuteIncrement, secondIncrement, timePicker24Hour, timePickerSeconds, dateReference } = $$props;

  const dispatchEvent = createEventDispatcher();

  /** @todo Handle am/pm times */
  function timeChange() {
    const detail = {
      hours: selectedHour,
      minutes: selectedMinute
    };
    detail.seconds = timePickerSeconds ? selectedSecond : 0;

    dispatchEvent("timeChange", detail);
  }

	const writable_props = ['minuteIncrement', 'secondIncrement', 'timePicker24Hour', 'timePickerSeconds', 'dateReference'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TimePicker> was created with unknown prop '${key}'`);
	});

	function select0_change_handler() {
		selectedHour = select_value(this);
		$$invalidate('selectedHour', selectedHour), $$invalidate('dateReference', dateReference);
		$$invalidate('hours', hours), $$invalidate('timePicker24Hour', timePicker24Hour);
	}

	function select1_change_handler() {
		selectedMinute = select_value(this);
		$$invalidate('selectedMinute', selectedMinute), $$invalidate('dateReference', dateReference);
		$$invalidate('minutes', minutes), $$invalidate('minuteIncrement', minuteIncrement);
	}

	function select_change_handler() {
		selectedSecond = select_value(this);
		$$invalidate('selectedSecond', selectedSecond), $$invalidate('dateReference', dateReference);
		$$invalidate('seconds', seconds), $$invalidate('secondIncrement', secondIncrement);
	}

	$$self.$set = $$props => {
		if ('minuteIncrement' in $$props) $$invalidate('minuteIncrement', minuteIncrement = $$props.minuteIncrement);
		if ('secondIncrement' in $$props) $$invalidate('secondIncrement', secondIncrement = $$props.secondIncrement);
		if ('timePicker24Hour' in $$props) $$invalidate('timePicker24Hour', timePicker24Hour = $$props.timePicker24Hour);
		if ('timePickerSeconds' in $$props) $$invalidate('timePickerSeconds', timePickerSeconds = $$props.timePickerSeconds);
		if ('dateReference' in $$props) $$invalidate('dateReference', dateReference = $$props.dateReference);
	};

	let selectedHour, selectedMinute, selectedSecond, hours, minutes, seconds;

	$$self.$$.update = ($$dirty = { dateReference: 1, timePicker24Hour: 1, minuteIncrement: 1, secondIncrement: 1 }) => {
		if ($$dirty.dateReference) { $$invalidate('selectedHour', selectedHour = dateReference.getHours()); }
		if ($$dirty.dateReference) { $$invalidate('selectedMinute', selectedMinute = dateReference.getMinutes()); }
		if ($$dirty.dateReference) { $$invalidate('selectedSecond', selectedSecond = dateReference.getSeconds()); }
		if ($$dirty.timePicker24Hour) { $$invalidate('hours', hours = [...Array(timePicker24Hour ? 24 : 12)].map((_, i) => pad(i))); }
		if ($$dirty.minuteIncrement) { $$invalidate('minutes', minutes = [...Array(60 / minuteIncrement)].map((_, i) =>
        pad(i * minuteIncrement)
      )); }
		if ($$dirty.secondIncrement) { $$invalidate('seconds', seconds = [...Array(60 / secondIncrement)].map((_, i) =>
        pad(i * secondIncrement)
      )); }
	};

	return {
		minuteIncrement,
		secondIncrement,
		timePicker24Hour,
		timePickerSeconds,
		dateReference,
		timeChange,
		selectedHour,
		selectedMinute,
		selectedSecond,
		hours,
		minutes,
		seconds,
		select0_change_handler,
		select1_change_handler,
		select_change_handler
	};
}

class TimePicker extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["minuteIncrement", "secondIncrement", "timePicker24Hour", "timePickerSeconds", "dateReference"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.minuteIncrement === undefined && !('minuteIncrement' in props)) {
			console.warn("<TimePicker> was created without expected prop 'minuteIncrement'");
		}
		if (ctx.secondIncrement === undefined && !('secondIncrement' in props)) {
			console.warn("<TimePicker> was created without expected prop 'secondIncrement'");
		}
		if (ctx.timePicker24Hour === undefined && !('timePicker24Hour' in props)) {
			console.warn("<TimePicker> was created without expected prop 'timePicker24Hour'");
		}
		if (ctx.timePickerSeconds === undefined && !('timePickerSeconds' in props)) {
			console.warn("<TimePicker> was created without expected prop 'timePickerSeconds'");
		}
		if (ctx.dateReference === undefined && !('dateReference' in props)) {
			console.warn("<TimePicker> was created without expected prop 'dateReference'");
		}
	}

	get minuteIncrement() {
		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minuteIncrement(value) {
		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get secondIncrement() {
		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set secondIncrement(value) {
		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timePicker24Hour() {
		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timePicker24Hour(value) {
		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timePickerSeconds() {
		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timePickerSeconds(value) {
		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dateReference() {
		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dateReference(value) {
		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/date-range-picker/SDateRangePicker.svelte generated by Svelte v3.5.3 */

const file$6 = "src/date-range-picker/SDateRangePicker.svelte";

function get_each_context$5(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.month = list[i];
	return child_ctx;
}

// (419:6) {#each months as month}
function create_each_block$5(ctx) {
	var current;

	var calendar = new Calendar({
		props: {
		prevIcon: ctx.prevIcon,
		nextIcon: ctx.nextIcon,
		disabledDates: ctx.disabledDates,
		events: ctx.events,
		hoverDate: ctx.hoverDate,
		hasSelection: ctx.hasSelection,
		firstDayOfWeek: ctx.firstDayOfWeek,
		isoWeekNumbers: ctx.isoWeekNumbers,
		locale: ctx.locale,
		maxDate: ctx.maxDate,
		minDate: ctx.minDate,
		month: ctx.month,
		monthDropdown: ctx.monthDropdown,
		monthFormat: ctx.monthFormat,
		monthIndicator: ctx.monthIndicator,
		pageWidth: ctx.pageWidth,
		rtl: ctx.rtl,
		singlePicker: ctx.singlePicker,
		tempEndDate: ctx.tempEndDate,
		tempStartDate: ctx.tempStartDate,
		today: ctx.today,
		weekGuides: ctx.weekGuides,
		weekNumbers: ctx.weekNumbers,
		yearDropdown: ctx.yearDropdown
	},
		$$inline: true
	});
	calendar.$on("pageChange", ctx.onPageChange);
	calendar.$on("hover", ctx.onHover);
	calendar.$on("selection", ctx.onSelection);
	calendar.$on("prevMonth", ctx.onPrevMonth);
	calendar.$on("nextMonth", ctx.onNextMonth);

	return {
		c: function create() {
			calendar.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(calendar, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var calendar_changes = {};
			if (changed.prevIcon) calendar_changes.prevIcon = ctx.prevIcon;
			if (changed.nextIcon) calendar_changes.nextIcon = ctx.nextIcon;
			if (changed.disabledDates) calendar_changes.disabledDates = ctx.disabledDates;
			if (changed.events) calendar_changes.events = ctx.events;
			if (changed.hoverDate) calendar_changes.hoverDate = ctx.hoverDate;
			if (changed.hasSelection) calendar_changes.hasSelection = ctx.hasSelection;
			if (changed.firstDayOfWeek) calendar_changes.firstDayOfWeek = ctx.firstDayOfWeek;
			if (changed.isoWeekNumbers) calendar_changes.isoWeekNumbers = ctx.isoWeekNumbers;
			if (changed.locale) calendar_changes.locale = ctx.locale;
			if (changed.maxDate) calendar_changes.maxDate = ctx.maxDate;
			if (changed.minDate) calendar_changes.minDate = ctx.minDate;
			if (changed.months) calendar_changes.month = ctx.month;
			if (changed.monthDropdown) calendar_changes.monthDropdown = ctx.monthDropdown;
			if (changed.monthFormat) calendar_changes.monthFormat = ctx.monthFormat;
			if (changed.monthIndicator) calendar_changes.monthIndicator = ctx.monthIndicator;
			if (changed.pageWidth) calendar_changes.pageWidth = ctx.pageWidth;
			if (changed.rtl) calendar_changes.rtl = ctx.rtl;
			if (changed.singlePicker) calendar_changes.singlePicker = ctx.singlePicker;
			if (changed.tempEndDate) calendar_changes.tempEndDate = ctx.tempEndDate;
			if (changed.tempStartDate) calendar_changes.tempStartDate = ctx.tempStartDate;
			if (changed.today) calendar_changes.today = ctx.today;
			if (changed.weekGuides) calendar_changes.weekGuides = ctx.weekGuides;
			if (changed.weekNumbers) calendar_changes.weekNumbers = ctx.weekNumbers;
			if (changed.yearDropdown) calendar_changes.yearDropdown = ctx.yearDropdown;
			calendar.$set(calendar_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(calendar.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(calendar.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(calendar, detaching);
		}
	};
}

// (455:2) {#if timePicker}
function create_if_block$4(ctx) {
	var div, t, current;

	var timepicker = new TimePicker({
		props: {
		dateReference: ctx.tempStartDate,
		minuteIncrement: ctx.minuteIncrement,
		secondIncrement: ctx.secondIncrement,
		timePicker24Hour: ctx.timePicker24Hour,
		timePickerSeconds: ctx.timePickerSeconds
	},
		$$inline: true
	});
	timepicker.$on("timeChange", ctx.onStartTimeChange);

	var if_block = (!ctx.singlePicker) && create_if_block_1$2(ctx);

	return {
		c: function create() {
			div = element("div");
			timepicker.$$.fragment.c();
			t = space();
			if (if_block) if_block.c();
			attr(div, "class", "calendar-row");
			add_location(div, file$6, 455, 4, 11640);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(timepicker, div, null);
			append(div, t);
			if (if_block) if_block.m(div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var timepicker_changes = {};
			if (changed.tempStartDate) timepicker_changes.dateReference = ctx.tempStartDate;
			if (changed.minuteIncrement) timepicker_changes.minuteIncrement = ctx.minuteIncrement;
			if (changed.secondIncrement) timepicker_changes.secondIncrement = ctx.secondIncrement;
			if (changed.timePicker24Hour) timepicker_changes.timePicker24Hour = ctx.timePicker24Hour;
			if (changed.timePickerSeconds) timepicker_changes.timePickerSeconds = ctx.timePickerSeconds;
			timepicker.$set(timepicker_changes);

			if (!ctx.singlePicker) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_1$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(timepicker.$$.fragment, local);

			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(timepicker.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(timepicker, );

			if (if_block) if_block.d();
		}
	};
}

// (465:6) {#if !singlePicker}
function create_if_block_1$2(ctx) {
	var current;

	var timepicker = new TimePicker({
		props: {
		dateReference: ctx.tempEndDate,
		minuteIncrement: ctx.minuteIncrement,
		secondIncrement: ctx.secondIncrement,
		timePicker24Hour: ctx.timePicker24Hour,
		timePickerSeconds: ctx.timePickerSeconds
	},
		$$inline: true
	});
	timepicker.$on("timeChange", ctx.onEndTimeChange);

	return {
		c: function create() {
			timepicker.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(timepicker, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var timepicker_changes = {};
			if (changed.tempEndDate) timepicker_changes.dateReference = ctx.tempEndDate;
			if (changed.minuteIncrement) timepicker_changes.minuteIncrement = ctx.minuteIncrement;
			if (changed.secondIncrement) timepicker_changes.secondIncrement = ctx.secondIncrement;
			if (changed.timePicker24Hour) timepicker_changes.timePicker24Hour = ctx.timePicker24Hour;
			if (changed.timePickerSeconds) timepicker_changes.timePickerSeconds = ctx.timePickerSeconds;
			timepicker.$set(timepicker_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(timepicker.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(timepicker.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(timepicker, detaching);
		}
	};
}

function create_fragment$6(ctx) {
	var div5, div0, label, t0_value = ctx.startDateReadout(), t0, t1, t2_value = ctx.endDateReadout(), t2, t3, div3, div1, t4, div2, t5, t6, div4, button0, t7, button0_disabled_value, t8, button1, t9, button1_disabled_value, t10, button2, t11, button2_disabled_value, t12, button3, t13, button3_disabled_value, div5_style_value, div5_class_value, current, dispose;

	var each_value = ctx.months;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, () => {
		each_blocks[i] = null;
	});

	var if_block = (ctx.timePicker) && create_if_block$4(ctx);

	return {
		c: function create() {
			div5 = element("div");
			div0 = element("div");
			label = element("label");
			t0 = text(t0_value);
			t1 = text(" to ");
			t2 = text(t2_value);
			t3 = space();
			div3 = element("div");
			div1 = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t4 = space();
			div2 = element("div");
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			div4 = element("div");
			button0 = element("button");
			t7 = text("Today");
			t8 = space();
			button1 = element("button");
			t9 = text("↚");
			t10 = space();
			button2 = element("button");
			t11 = text("Cancel");
			t12 = space();
			button3 = element("button");
			t13 = text("Apply");
			add_location(label, file$6, 411, 4, 10565);
			attr(div0, "class", "label-row svelte-hluds2");
			add_location(div0, file$6, 410, 2, 10537);
			attr(div1, "class", "grid svelte-hluds2");
			add_location(div1, file$6, 417, 4, 10749);
			attr(div2, "class", "full-height-scroll");
			add_location(div2, file$6, 451, 4, 11572);
			add_location(div3, file$6, 416, 2, 10739);
			attr(button0, "type", "button");
			attr(button0, "aria-label", "Show the current selection ");
			button0.disabled = button0_disabled_value = isSameMonth(new ctx.Date(), ctx.months[0]);
			attr(button0, "class", "svelte-hluds2");
			add_location(button0, file$6, 476, 4, 12213);
			attr(button1, "type", "button");
			attr(button1, "aria-label", "Show the current selection ");
			button1.disabled = button1_disabled_value = !ctx.canResetView;
			attr(button1, "class", "svelte-hluds2");
			add_location(button1, file$6, 483, 4, 12398);
			attr(button2, "type", "button");
			attr(button2, "aria-label", "Cancel the current selection and revert to previous start and\n      end dates");
			button2.disabled = button2_disabled_value = !ctx.canApply();
			attr(button2, "class", "svelte-hluds2");
			add_location(button2, file$6, 490, 4, 12564);
			attr(button3, "type", "button");
			attr(button3, "aria-label", "Apply the current selection");
			button3.disabled = button3_disabled_value = !ctx.canApply();
			attr(button3, "class", "svelte-hluds2");
			add_location(button3, file$6, 499, 4, 12775);
			set_style(div4, "justify-content", "flex-end");
			set_style(div4, "display", "flex");
			add_location(div4, file$6, 475, 2, 12153);
			attr(div5, "id", id);
			attr(div5, "style", div5_style_value = `width: ${ctx.maxWidth}px`);
			attr(div5, "class", div5_class_value = "" + (ctx.rtl ? 'rtl' : '') + " svelte-hluds2");
			add_location(div5, file$6, 409, 0, 10468);

			dispose = [
				listen(button0, "click", ctx.goToToday),
				listen(button1, "click", ctx.resetView),
				listen(button2, "click", ctx.cancel),
				listen(button3, "click", ctx.apply)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div5, anchor);
			append(div5, div0);
			append(div0, label);
			append(label, t0);
			append(label, t1);
			append(label, t2);
			append(div5, t3);
			append(div5, div3);
			append(div3, div1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			append(div3, t4);
			append(div3, div2);
			append(div5, t5);
			if (if_block) if_block.m(div5, null);
			append(div5, t6);
			append(div5, div4);
			append(div4, button0);
			append(button0, t7);
			append(div4, t8);
			append(div4, button1);
			append(button1, t9);
			append(div4, t10);
			append(div4, button2);
			append(button2, t11);
			append(div4, t12);
			append(div4, button3);
			append(button3, t13);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.startDateReadout) && t0_value !== (t0_value = ctx.startDateReadout())) {
				set_data(t0, t0_value);
			}

			if ((!current || changed.endDateReadout) && t2_value !== (t2_value = ctx.endDateReadout())) {
				set_data(t2, t2_value);
			}

			if (changed.prevIcon || changed.nextIcon || changed.disabledDates || changed.events || changed.hoverDate || changed.hasSelection || changed.firstDayOfWeek || changed.isoWeekNumbers || changed.locale || changed.maxDate || changed.minDate || changed.months || changed.monthDropdown || changed.monthFormat || changed.monthIndicator || changed.pageWidth || changed.rtl || changed.singlePicker || changed.tempEndDate || changed.tempStartDate || changed.today || changed.weekGuides || changed.weekNumbers || changed.yearDropdown || changed.onPageChange || changed.onHover || changed.onSelection || changed.onPrevMonth || changed.onNextMonth) {
				each_value = ctx.months;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div1, null);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if (ctx.timePicker) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div5, t6);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if ((!current || changed.months) && button0_disabled_value !== (button0_disabled_value = isSameMonth(new ctx.Date(), ctx.months[0]))) {
				button0.disabled = button0_disabled_value;
			}

			if ((!current || changed.canResetView) && button1_disabled_value !== (button1_disabled_value = !ctx.canResetView)) {
				button1.disabled = button1_disabled_value;
			}

			if ((!current || changed.canApply) && button2_disabled_value !== (button2_disabled_value = !ctx.canApply())) {
				button2.disabled = button2_disabled_value;
			}

			if ((!current || changed.canApply) && button3_disabled_value !== (button3_disabled_value = !ctx.canApply())) {
				button3.disabled = button3_disabled_value;
			}

			if ((!current || changed.maxWidth) && div5_style_value !== (div5_style_value = `width: ${ctx.maxWidth}px`)) {
				attr(div5, "style", div5_style_value);
			}

			if ((!current || changed.rtl) && div5_class_value !== (div5_class_value = "" + (ctx.rtl ? 'rtl' : '') + " svelte-hluds2")) {
				attr(div5, "class", div5_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div5);
			}

			destroy_each(each_blocks, detaching);

			if (if_block) if_block.d();
			run_all(dispose);
		}
	};
}

const cellWidth = 44;

const id = "s-date-range-picker";

const maxCalsPerPage = 2;

function instance$6($$self, $$props, $$invalidate) {
	

  let { autoApply = false, dateFormat = "MMM dd, yyyy", monthIndicator = true, disabledDates = [], endDate = endOfWeek(new Date()), events = [], firstDayOfWeek = "sunday", isoWeekNumbers = false, locale: locale$1 = locale, maxDate = addYears(new Date(), 10), minDate = subYears(new Date(), 10), monthDropdown = true, monthFormat = "MMMM", numPages = 1, rtl = false, singlePicker = false, startDate = startOfWeek(new Date()), timePicker = true, timePicker24Hour = true, minuteIncrement = 1, secondIncrement = 1, timePickerSeconds = true, prevIcon = "&#9666;", nextIcon = "&#9656;", today = new Date(), weekGuides = false, weekNumbers = false, yearDropdown = true } = $$props;

  let hoverDate = endDate;
  let tempEndDate = endDate;
  let tempStartDate = startDate;
  let hasSelection = true;
  const dispatchEvent = createEventDispatcher();
  const pageWidth = cellWidth * 7;
  const pageWidthWithPadding = pageWidth + 96;

  // Round and set the hover data temp start & end dates based on start & end date props
  onMount(function() {
    if (timePicker) {
      $$invalidate('tempStartDate', tempStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startDate.getHours(),
        roundDown(startDate.getMinutes(), minuteIncrement),
        roundDown(startDate.getSeconds(), secondIncrement)
      ));

      $$invalidate('tempEndDate', tempEndDate = hoverDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endDate.getHours(),
        roundDown(endDate.getMinutes(), minuteIncrement),
        roundDown(endDate.getSeconds(), secondIncrement)
      )); $$invalidate('hoverDate', hoverDate);

      if (
        !isSameSecond(tempStartDate, startDate) ||
        !isSameSecond(tempEndDate, endDate)
      ) {
        console.warn(`
          startDate or endDate is not rounded to the proper minute / second increment. This will lead to
          an inconsistency between the internal state and external state. The "Cancel" and "Apply" button will render
          as enabled. 

          startDate=${startDate}
          endDate=${endDate}
          minuteIncrement=${minuteIncrement}
          secondIncrement=${secondIncrement}
        `);
      }
    }
  });

  // function show() {
  //   dispatchEvent("show");
  // }

  // function hide() {
  //   dispatchEvent("hide");
  // }

  function apply() {
    if (!tempEndDate && !singlePicker) {
      return;
    }

    // if (hideOnApply) {
    //   hide();
    // }

    dispatchEvent("apply", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });
  }

  function goToToday() {
    $$invalidate('months', months = [...Array(numPages)].map((_, i) => addMonths(new Date(), i)));
  }

  function resetView() {
    const resetViewMonth = canApply() ? tempStartDate : startDate;
    $$invalidate('months', months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i)));
  }

  function resetState() {
    $$invalidate('tempStartDate', tempStartDate = startDate);
    $$invalidate('tempEndDate', tempEndDate = endDate);
    $$invalidate('hasSelection', hasSelection = true);
  }

  function cancel() {
    resetState();
    resetView();

    // if (hideOnCancel) {
    //   hide();
    // }

    dispatchEvent("cancel", {
      startDate,
      endDate
    });
  }

  function onSelection({ detail }) {
    if (singlePicker) {
      // Start and end dates are always the same on singlePicker
      $$invalidate('tempStartDate', tempStartDate = tempEndDate = new Date(
        detail.getFullYear(),
        detail.getMonth(),
        detail.getDate(),
        tempStartDate.getHours(),
        tempStartDate.getMinutes(),
        tempStartDate.getSeconds()
      )); $$invalidate('tempEndDate', tempEndDate);
    } else if (hasSelection) {
      // In range mode, if there is currently a selection and the selection
      // event is fired the user must be selecting the startDate
      $$invalidate('tempStartDate', tempStartDate = new Date(
        detail.getFullYear(),
        detail.getMonth(),
        detail.getDate(),
        tempStartDate.getHours(),
        tempStartDate.getMinutes(),
        tempStartDate.getSeconds()
      ));
      $$invalidate('hasSelection', hasSelection = false);
    } else {
      // In range mode, if there isn't a selection, the user must be selecting an endDate
      // Update the start and end dates appropriately based on whether the newly selected date
      // is before the currently selected start date
      if (isBefore(detail, tempStartDate)) {
        $$invalidate('tempEndDate', tempEndDate = new Date(
          tempStartDate.getFullYear(),
          tempStartDate.getMonth(),
          tempStartDate.getDate(),
          tempEndDate.getHours(),
          tempEndDate.getMinutes(),
          tempEndDate.getSeconds()
        ));

        $$invalidate('tempStartDate', tempStartDate = new Date(
          detail.getFullYear(),
          detail.getMonth(),
          detail.getDate(),
          tempStartDate.getHours(),
          tempStartDate.getMinutes(),
          tempStartDate.getSeconds()
        ));
      } else {
        $$invalidate('tempEndDate', tempEndDate = new Date(
          detail.getFullYear(),
          detail.getMonth(),
          detail.getDate(),
          tempEndDate.getHours(),
          tempEndDate.getMinutes(),
          tempEndDate.getSeconds()
        ));
      }

      $$invalidate('hasSelection', hasSelection = true);

      dispatchEvent("selection", {
        startDate: tempStartDate,
        endDate: tempEndDate
      });

      if (autoApply) {
        apply();
      }
    }
  }

  function onHover({ detail }) {
    $$invalidate('hoverDate', hoverDate = detail);
  }

  function onPrevMonth() {
    $$invalidate('months', months = months.map(mo => subMonths(mo, 1)));
  }

  function onNextMonth() {
    $$invalidate('months', months = months.map(mo => addMonths(mo, 1)));
  }

  function onPageChange({ detail: { incrementAmount } }) {
    if (incrementAmount > 0) {
      $$invalidate('months', months = months.map(mo => addMonths(mo, incrementAmount)));
    } else {
      const absIncrementAmount = Math.abs(incrementAmount);
      $$invalidate('months', months = months.map(mo => subMonths(mo, absIncrementAmount)));
    }
  }

  function onStartTimeChange({ detail }) {
    const newDate = new Date(
      tempStartDate.getFullYear(),
      tempStartDate.getMonth(),
      tempStartDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    );

    if (isAfter(newDate, tempEndDate)) {
      $$invalidate('tempStartDate', tempStartDate = tempEndDate);
      $$invalidate('tempEndDate', tempEndDate = newDate);
    } else {
      $$invalidate('tempStartDate', tempStartDate = newDate);
    }
  }

  function onEndTimeChange({ detail }) {
    const newDate = new Date(
      tempEndDate.getFullYear(),
      tempEndDate.getMonth(),
      tempEndDate.getDate(),
      detail.hours,
      detail.minutes,
      detail.seconds
    );

    if (isBefore(newDate, tempStartDate)) {
      $$invalidate('tempEndDate', tempEndDate = tempStartDate);
      $$invalidate('tempStartDate', tempStartDate = newDate);
    } else {
      $$invalidate('tempEndDate', tempEndDate = newDate);
    }
  }

	const writable_props = ['autoApply', 'dateFormat', 'monthIndicator', 'disabledDates', 'endDate', 'events', 'firstDayOfWeek', 'isoWeekNumbers', 'locale', 'maxDate', 'minDate', 'monthDropdown', 'monthFormat', 'numPages', 'rtl', 'singlePicker', 'startDate', 'timePicker', 'timePicker24Hour', 'minuteIncrement', 'secondIncrement', 'timePickerSeconds', 'prevIcon', 'nextIcon', 'today', 'weekGuides', 'weekNumbers', 'yearDropdown'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SDateRangePicker> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('autoApply' in $$props) $$invalidate('autoApply', autoApply = $$props.autoApply);
		if ('dateFormat' in $$props) $$invalidate('dateFormat', dateFormat = $$props.dateFormat);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('disabledDates' in $$props) $$invalidate('disabledDates', disabledDates = $$props.disabledDates);
		if ('endDate' in $$props) $$invalidate('endDate', endDate = $$props.endDate);
		if ('events' in $$props) $$invalidate('events', events = $$props.events);
		if ('firstDayOfWeek' in $$props) $$invalidate('firstDayOfWeek', firstDayOfWeek = $$props.firstDayOfWeek);
		if ('isoWeekNumbers' in $$props) $$invalidate('isoWeekNumbers', isoWeekNumbers = $$props.isoWeekNumbers);
		if ('locale' in $$props) $$invalidate('locale', locale$1 = $$props.locale);
		if ('maxDate' in $$props) $$invalidate('maxDate', maxDate = $$props.maxDate);
		if ('minDate' in $$props) $$invalidate('minDate', minDate = $$props.minDate);
		if ('monthDropdown' in $$props) $$invalidate('monthDropdown', monthDropdown = $$props.monthDropdown);
		if ('monthFormat' in $$props) $$invalidate('monthFormat', monthFormat = $$props.monthFormat);
		if ('numPages' in $$props) $$invalidate('numPages', numPages = $$props.numPages);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
		if ('singlePicker' in $$props) $$invalidate('singlePicker', singlePicker = $$props.singlePicker);
		if ('startDate' in $$props) $$invalidate('startDate', startDate = $$props.startDate);
		if ('timePicker' in $$props) $$invalidate('timePicker', timePicker = $$props.timePicker);
		if ('timePicker24Hour' in $$props) $$invalidate('timePicker24Hour', timePicker24Hour = $$props.timePicker24Hour);
		if ('minuteIncrement' in $$props) $$invalidate('minuteIncrement', minuteIncrement = $$props.minuteIncrement);
		if ('secondIncrement' in $$props) $$invalidate('secondIncrement', secondIncrement = $$props.secondIncrement);
		if ('timePickerSeconds' in $$props) $$invalidate('timePickerSeconds', timePickerSeconds = $$props.timePickerSeconds);
		if ('prevIcon' in $$props) $$invalidate('prevIcon', prevIcon = $$props.prevIcon);
		if ('nextIcon' in $$props) $$invalidate('nextIcon', nextIcon = $$props.nextIcon);
		if ('today' in $$props) $$invalidate('today', today = $$props.today);
		if ('weekGuides' in $$props) $$invalidate('weekGuides', weekGuides = $$props.weekGuides);
		if ('weekNumbers' in $$props) $$invalidate('weekNumbers', weekNumbers = $$props.weekNumbers);
		if ('yearDropdown' in $$props) $$invalidate('yearDropdown', yearDropdown = $$props.yearDropdown);
	};

	let canApply, canResetView, maxWidth, months, pickerWidth, startDateReadout, endDateReadout;

	$$self.$$.update = ($$dirty = { timePicker: 1, timePickerSeconds: 1, tempStartDate: 1, startDate: 1, tempEndDate: 1, endDate: 1, numPages: 1, today: 1, months: 1, pickerWidth: 1, hasSelection: 1, hoverDate: 1, dateFormat: 1, locale: 1 }) => {
		if ($$dirty.timePicker || $$dirty.timePickerSeconds || $$dirty.tempStartDate || $$dirty.startDate || $$dirty.tempEndDate || $$dirty.endDate) { $$invalidate('canApply', canApply = function() {
        if (timePicker) {
          if (timePickerSeconds) {
            return (
              !isSameSecond(tempStartDate, startDate) ||
              !isSameSecond(tempEndDate, endDate)
            );
          }
    
          return (
            !isSameMinute(tempStartDate, startDate) ||
            !isSameMinute(tempEndDate, endDate)
          );
        }
    
        return (
          !isSameDay(tempStartDate, startDate) || !isSameDay(tempEndDate, endDate)
        );
      }); }
		if ($$dirty.numPages || $$dirty.today) { $$invalidate('months', months = [...Array(numPages)].map((_, i) => addMonths(today, i))); }
		if ($$dirty.tempStartDate || $$dirty.months || $$dirty.tempEndDate) { $$invalidate('canResetView', canResetView = !isSameMonth(tempStartDate, months[0]) && tempEndDate); }
		if ($$dirty.numPages) { $$invalidate('pickerWidth', pickerWidth = numPages * pageWidthWithPadding); }
		if ($$dirty.pickerWidth) { $$invalidate('maxWidth', maxWidth =
        pickerWidth >= maxCalsPerPage * pageWidth
          ? maxCalsPerPage * pageWidthWithPadding
          : pickerWidth); }
		if ($$dirty.hasSelection || $$dirty.hoverDate || $$dirty.tempStartDate || $$dirty.dateFormat || $$dirty.locale) { $$invalidate('startDateReadout', startDateReadout = function() {
        if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
          return format(hoverDate, dateFormat, { locale: locale$1 });
        }
    
        return format(tempStartDate, dateFormat, { locale: locale$1 });
      }); }
		if ($$dirty.hasSelection || $$dirty.hoverDate || $$dirty.tempStartDate || $$dirty.dateFormat || $$dirty.locale || $$dirty.tempEndDate) { $$invalidate('endDateReadout', endDateReadout = function() {
        if (!hasSelection) {
          if (isBefore(hoverDate, tempStartDate)) {
            return format(tempStartDate, dateFormat, { locale: locale$1 });
          }
    
          return format(hoverDate, dateFormat, { locale: locale$1 });
        }
    
        return format(tempEndDate, dateFormat, { locale: locale$1 });
      }); }
	};

	return {
		autoApply,
		dateFormat,
		monthIndicator,
		disabledDates,
		endDate,
		events,
		firstDayOfWeek,
		isoWeekNumbers,
		locale: locale$1,
		maxDate,
		minDate,
		monthDropdown,
		monthFormat,
		numPages,
		rtl,
		singlePicker,
		startDate,
		timePicker,
		timePicker24Hour,
		minuteIncrement,
		secondIncrement,
		timePickerSeconds,
		prevIcon,
		nextIcon,
		today,
		weekGuides,
		weekNumbers,
		yearDropdown,
		hoverDate,
		tempEndDate,
		tempStartDate,
		hasSelection,
		pageWidth,
		apply,
		goToToday,
		resetView,
		cancel,
		onSelection,
		onHover,
		onPrevMonth,
		onNextMonth,
		onPageChange,
		onStartTimeChange,
		onEndTimeChange,
		Date,
		canApply,
		canResetView,
		months,
		maxWidth,
		startDateReadout,
		endDateReadout
	};
}

class SDateRangePicker extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["autoApply", "dateFormat", "monthIndicator", "disabledDates", "endDate", "events", "firstDayOfWeek", "isoWeekNumbers", "locale", "maxDate", "minDate", "monthDropdown", "monthFormat", "numPages", "rtl", "singlePicker", "startDate", "timePicker", "timePicker24Hour", "minuteIncrement", "secondIncrement", "timePickerSeconds", "prevIcon", "nextIcon", "today", "weekGuides", "weekNumbers", "yearDropdown"]);
	}

	get autoApply() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set autoApply(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dateFormat() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dateFormat(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthIndicator() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthIndicator(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabledDates() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabledDates(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get endDate() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set endDate(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get events() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set events(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get firstDayOfWeek() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set firstDayOfWeek(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isoWeekNumbers() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isoWeekNumbers(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get locale() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set locale(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maxDate() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxDate(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get minDate() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minDate(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthDropdown() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthDropdown(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get monthFormat() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set monthFormat(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get numPages() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set numPages(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rtl() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rtl(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get singlePicker() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set singlePicker(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get startDate() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set startDate(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timePicker() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timePicker(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timePicker24Hour() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timePicker24Hour(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get minuteIncrement() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set minuteIncrement(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get secondIncrement() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set secondIncrement(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timePickerSeconds() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timePickerSeconds(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get prevIcon() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set prevIcon(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get nextIcon() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set nextIcon(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get today() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set today(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekGuides() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekGuides(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get weekNumbers() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set weekNumbers(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get yearDropdown() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set yearDropdown(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/App.svelte generated by Svelte v3.5.3 */

function create_fragment$7(ctx) {
	var current;

	var sdaterangepicker = new SDateRangePicker({
		props: {
		numPages: 2,
		weekGuides: true,
		weekNumbers: true,
		isoWeekNumbers: true,
		rtl: rtl,
		startDate: ctx.startDate,
		endDate: ctx.endDate
	},
		$$inline: true
	});
	sdaterangepicker.$on("apply", ctx.onApply);

	return {
		c: function create() {
			sdaterangepicker.$$.fragment.c();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(sdaterangepicker, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var sdaterangepicker_changes = {};
			if (changed.rtl) sdaterangepicker_changes.rtl = rtl;
			if (changed.startDate) sdaterangepicker_changes.startDate = ctx.startDate;
			if (changed.endDate) sdaterangepicker_changes.endDate = ctx.endDate;
			sdaterangepicker.$set(sdaterangepicker_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(sdaterangepicker.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(sdaterangepicker.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(sdaterangepicker, detaching);
		}
	};
}

let rtl = false;

function instance$7($$self, $$props, $$invalidate) {
	

  let startDate = startOfWeek(new Date());
  let endDate = endOfWeek(new Date());

  function onApply({ detail }) {
    $$invalidate('startDate', startDate = detail.startDate);
    $$invalidate('endDate', endDate = detail.endDate);
    console.log("apply", detail);
  }

	return { startDate, endDate, onApply };
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
	}
}

const target = document.body;

const app = new App({
  target,
  props: {}
});

export { app, target };
