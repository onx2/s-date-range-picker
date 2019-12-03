
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
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
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

function startOfDay$1(dirtyDate) {
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

  var dateLeftStartOfDay = startOfDay$1(dirtyDateLeft);
  var dateRightStartOfDay = startOfDay$1(dirtyDateRight);
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
 * @name endOfDay
 * @category Day Helpers
 * @summary Return the end of a day for the given date.
 *
 * @description
 * Return the end of a day for the given date.
 * The result will be in the local timezone.
 *
 * ### v2.0.0 breaking changes:
 *
 * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
 *
 * @param {Date|Number} date - the original date
 * @returns {Date} the end of a day
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // The end of a day for 2 September 2014 11:55:00:
 * var result = endOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 23:59:59.999
 */

function endOfDay(dirtyDate) {
  if (arguments.length < 1) {
    throw new TypeError('1 argument required, but only ' + arguments.length + ' present');
  }

  var date = toDate(dirtyDate);
  date.setHours(23, 59, 59, 999);
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

var formatDistanceLocale$1 = {
  lessThanXSeconds: {
    one: 'minder as \'n sekonde',
    other: 'minder as {{count}} sekondes'
  },
  xSeconds: {
    one: '1 sekonde',
    other: '{{count}} sekondes'
  },
  halfAMinute: '\'n halwe minuut',
  lessThanXMinutes: {
    one: 'minder as \'n minuut',
    other: 'minder as {{count}} minute'
  },
  xMinutes: {
    one: '\'n minuut',
    other: '{{count}} minute'
  },
  aboutXHours: {
    one: 'ongeveer 1 uur',
    other: 'ongeveer {{count}} ure'
  },
  xHours: {
    one: '1 uur',
    other: '{{count}} ure'
  },
  xDays: {
    one: '1 dag',
    other: '{{count}} dae'
  },
  aboutXMonths: {
    one: 'ongeveer 1 maand',
    other: 'ongeveer {{count}} maande'
  },
  xMonths: {
    one: '1 maand',
    other: '{{count}} maande'
  },
  aboutXYears: {
    one: 'ongeveer 1 jaar',
    other: 'ongeveer {{count}} jaar'
  },
  xYears: {
    one: '1 jaar',
    other: '{{count}} jaar'
  },
  overXYears: {
    one: 'meer as 1 jaar',
    other: 'meer as {{count}} jaar'
  },
  almostXYears: {
    one: 'byna 1 jaar',
    other: 'byna {{count}} jaar'
  }
};
function formatDistance$1(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$1[token] === 'string') {
    result = formatDistanceLocale$1[token];
  } else if (count === 1) {
    result = formatDistanceLocale$1[token].one;
  } else {
    result = formatDistanceLocale$1[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'oor ' + result;
    } else {
      return result + ' gelede';
    }
  }

  return result;
}

var dateFormats$1 = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'yyyy/MM/dd'
};
var timeFormats$1 = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$1 = {
  full: "{{date}} 'om' {{time}}",
  long: "{{date}} 'om' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$1 = {
  date: buildFormatLongFn({
    formats: dateFormats$1,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$1,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$1,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$1 = {
  lastWeek: "'verlede' eeee 'om' p",
  yesterday: "'gister om' p",
  today: "'vandag om' p",
  tomorrow: "'môre om' p",
  nextWeek: "eeee 'om' p",
  other: 'P'
};
function formatRelative$1(token) {
  return formatRelativeLocale$1[token];
}

var eraValues$1 = {
  narrow: ['vC', 'nC'],
  abbreviated: ['vC', 'nC'],
  wide: ['voor Christus', 'na Christus']
};
var quarterValues$1 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['K1', 'K2', 'K3', 'K4'],
  wide: ['1ste kwartaal', '2de kwartaal', '3de kwartaal', '4de kwartaal']
};
var monthValues$1 = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
  wide: ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie', 'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember']
};
var dayValues$1 = {
  narrow: ['S', 'M', 'D', 'W', 'D', 'V', 'S'],
  short: ['So', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Sa'],
  abbreviated: ['Son', 'Maa', 'Din', 'Woe', 'Don', 'Vry', 'Sat'],
  wide: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag']
};
var dayPeriodValues$1 = {
  narrow: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'middaguur',
    morning: 'oggend',
    afternoon: 'middag',
    evening: 'laat middag',
    night: 'aand'
  },
  abbreviated: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'middaguur',
    morning: 'oggend',
    afternoon: 'middag',
    evening: 'laat middag',
    night: 'aand'
  },
  wide: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'middaguur',
    morning: 'oggend',
    afternoon: 'middag',
    evening: 'laat middag',
    night: 'aand'
  }
};
var formattingDayPeriodValues$1 = {
  narrow: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'uur die middag',
    morning: 'uur die oggend',
    afternoon: 'uur die middag',
    evening: 'uur die aand',
    night: 'uur die aand'
  },
  abbreviated: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'uur die middag',
    morning: 'uur die oggend',
    afternoon: 'uur die middag',
    evening: 'uur die aand',
    night: 'uur die aand'
  },
  wide: {
    am: 'vm',
    pm: 'nm',
    midnight: 'middernag',
    noon: 'uur die middag',
    morning: 'uur die oggend',
    afternoon: 'uur die middag',
    evening: 'uur die aand',
    night: 'uur die aand'
  }
};

function ordinalNumber$1(dirtyNumber) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;

  if (rem100 < 20) {
    switch (rem100) {
      case 1:
      case 8:
        return number + 'ste';

      default:
        return number + 'de';
    }
  }

  return number + 'ste';
}

var localize$1 = {
  ordinalNumber: ordinalNumber$1,
  era: buildLocalizeFn({
    values: eraValues$1,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$1,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$1,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$1,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$1,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$1,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$1 = /^(\d+)(ste|de)?/i;
var parseOrdinalNumberPattern$1 = /\d+/i;
var matchEraPatterns$1 = {
  narrow: /^([vn]\.? ?C\.?)/,
  abbreviated: /^([vn]\. ?C\.?)/,
  wide: /^((voor|na) Christus)/
};
var parseEraPatterns$1 = {
  any: [/^v/, /^n/]
};
var matchQuarterPatterns$1 = {
  narrow: /^[1234]/i,
  abbreviated: /^K[1234]/i,
  wide: /^[1234](st|d)e kwartaal/i
};
var parseQuarterPatterns$1 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$1 = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(Jan|Feb|Mrt|Apr|Mei|Jun|Jul|Aug|Sep|Okt|Nov|Dec)\.?/i,
  wide: /^(Januarie|Februarie|Maart|April|Mei|Junie|Julie|Augustus|September|Oktober|November|Desember)/i
};
var parseMonthPatterns$1 = {
  narrow: [/^J/i, /^F/i, /^M/i, /^A/i, /^M/i, /^J/i, /^J/i, /^A/i, /^S/i, /^O/i, /^N/i, /^D/i],
  any: [/^Jan/i, /^Feb/i, /^Mrt/i, /^Apr/i, /^Mei/i, /^Jun/i, /^Jul/i, /^Aug/i, /^Sep/i, /^Okt/i, /^Nov/i, /^Dec/i]
};
var matchDayPatterns$1 = {
  narrow: /^[smdwv]/i,
  short: /^(So|Ma|Di|Wo|Do|Vr|Sa)/i,
  abbreviated: /^(Son|Maa|Din|Woe|Don|Vry|Sat)/i,
  wide: /^(Sondag|Maandag|Dinsdag|Woensdag|Donderdag|Vrydag|Saterdag)/i
};
var parseDayPatterns$1 = {
  narrow: [/^S/i, /^M/i, /^D/i, /^W/i, /^D/i, /^V/i, /^S/i],
  any: [/^So/i, /^Ma/i, /^Di/i, /^Wo/i, /^Do/i, /^Vr/i, /^Sa/i]
};
var matchDayPeriodPatterns$1 = {
  any: /^(vm|nm|middernag|(?:uur )?die (oggend|middag|aand))/i
};
var parseDayPeriodPatterns$1 = {
  any: {
    am: /^vm/i,
    pm: /^nm/i,
    midnight: /^middernag/i,
    noon: /^middaguur/i,
    morning: /oggend/i,
    afternoon: /middag/i,
    evening: /laat middag/i,
    night: /aand/i
  }
};
var match$1 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$1,
    parsePattern: parseOrdinalNumberPattern$1,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$1,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$1,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$1,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$1,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$1,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$1,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$1,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$1,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$1,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$1,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Afrikaans locale.
 * @language Afrikaans
 * @iso-639-2 afr
 * @author Marnus Weststrate [@marnusw]{@link https://github.com/marnusw}
 */

var locale$1 = {
  code: 'af',
  formatDistance: formatDistance$1,
  formatLong: formatLong$1,
  formatRelative: formatRelative$1,
  localize: localize$1,
  match: match$1,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$2 = {
  lessThanXSeconds: {
    one: 'أقل من ثانية واحدة',
    two: 'أقل من ثانتين',
    threeToTen: 'أقل من {{count}} ثواني',
    other: 'أقل من {{count}} ثانية'
  },
  xSeconds: {
    one: 'ثانية واحدة',
    two: 'ثانتين',
    threeToTen: '{{count}} ثواني',
    other: '{{count}} ثانية'
  },
  halfAMinute: 'نصف دقيقة',
  lessThanXMinutes: {
    one: 'أقل من دقيقة',
    two: 'أقل من دقيقتين',
    threeToTen: 'أقل من {{count}} دقائق',
    other: 'أقل من {{count}} دقيقة'
  },
  xMinutes: {
    one: 'دقيقة واحدة',
    two: 'دقيقتين',
    threeToTen: '{{count}} دقائق',
    other: '{{count}} دقيقة'
  },
  aboutXHours: {
    one: 'ساعة واحدة تقريباً',
    two: 'ساعتين تقريباً',
    threeToTen: '{{count}} ساعات تقريباً',
    other: '{{count}} ساعة تقريباً'
  },
  xHours: {
    one: 'ساعة واحدة',
    two: 'ساعتين',
    threeToTen: '{{count}} ساعات',
    other: '{{count}} ساعة'
  },
  xDays: {
    one: 'يوم واحد',
    two: 'يومين',
    threeToTen: '{{count}} أيام',
    other: '{{count}} يوم'
  },
  aboutXMonths: {
    one: 'شهر واحد تقريباً',
    two: 'شهرين تقريباً',
    threeToTen: '{{count}} أشهر تقريباً',
    other: '{{count}} شهر تقريباً'
  },
  xMonths: {
    one: 'شهر واحد',
    two: 'شهرين',
    threeToTen: '{{count}} أشهر',
    other: '{{count}} شهر'
  },
  aboutXYears: {
    one: 'عام واحد تقريباً',
    two: 'عامين تقريباً',
    threeToTen: '{{count}} أعوام تقريباً',
    other: '{{count}} عام تقريباً'
  },
  xYears: {
    one: 'عام واحد',
    two: 'عامين',
    threeToTen: '{{count}} أعوام',
    other: '{{count}} عام'
  },
  overXYears: {
    one: 'أكثر من عام',
    two: 'أكثر من عامين',
    threeToTen: 'أكثر من {{count}} أعوام',
    other: 'أكثر من {{count}} عام'
  },
  almostXYears: {
    one: 'عام واحد تقريباً',
    two: 'عامين تقريباً',
    threeToTen: '{{count}} أعوام تقريباً',
    other: '{{count}} عام تقريباً'
  }
};
function formatDistance$2(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$2[token] === 'string') {
    result = formatDistanceLocale$2[token];
  } else if (count === 1) {
    result = formatDistanceLocale$2[token].one;
  } else if (count === 2) {
    result = formatDistanceLocale$2[token].two;
  } else if (count <= 10) {
    result = formatDistanceLocale$2[token].threeToTen.replace('{{count}}', count);
  } else {
    result = formatDistanceLocale$2[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'في خلال ' + result;
    } else {
      return 'منذ ' + result;
    }
  }

  return result;
}

var dateFormats$2 = {
  full: 'EEEE, MMMM do, y',
  long: 'MMMM do, y',
  medium: 'MMM d, y',
  short: 'MM/dd/yyyy'
};
var timeFormats$2 = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$2 = {
  full: "{{date}} 'عند' {{time}}",
  long: "{{date}} 'عند' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$2 = {
  date: buildFormatLongFn({
    formats: dateFormats$2,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$2,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$2,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$2 = {
  lastWeek: "'أخر' eeee 'عند' p",
  yesterday: "'أمس عند' p",
  today: "'اليوم عند' p",
  tomorrow: "'غداً عند' p",
  nextWeek: "eeee 'عند' p",
  other: 'P'
};
function formatRelative$2(token, _date, _baseDate, _options) {
  return formatRelativeLocale$2[token];
}

var eraValues$2 = {
  narrow: ['ق', 'ب'],
  abbreviated: ['ق.م.', 'ب.م.'],
  wide: ['قبل الميلاد', 'بعد الميلاد']
};
var quarterValues$2 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['ر1', 'ر2', 'ر3', 'ر4'],
  wide: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع']
};
var monthValues$2 = {
  narrow: ['ج', 'ف', 'م', 'أ', 'م', 'ج', 'ج', 'أ', 'س', 'أ', 'ن', 'د'],
  abbreviated: ['جانـ', 'فيفـ', 'مارس', 'أفريل', 'مايـ', 'جوانـ', 'جويـ', 'أوت', 'سبتـ', 'أكتـ', 'نوفـ', 'ديسـ'],
  wide: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};
var dayValues$2 = {
  narrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  abbreviated: ['أحد', 'اثنـ', 'ثلا', 'أربـ', 'خميـ', 'جمعة', 'سبت'],
  wide: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};
var dayPeriodValues$2 = {
  narrow: {
    am: 'ص',
    pm: 'م',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  },
  abbreviated: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  },
  wide: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  }
};
var formattingDayPeriodValues$2 = {
  narrow: {
    am: 'ص',
    pm: 'م',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'في الصباح',
    afternoon: 'بعد الظـهر',
    evening: 'في المساء',
    night: 'في الليل'
  },
  abbreviated: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'في الصباح',
    evening: 'في المساء',
    night: 'في الليل'
  },
  wide: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    afternoon: 'بعد الظـهر',
    evening: 'في المساء',
    night: 'في الليل'
  }
};

function ordinalNumber$2(dirtyNumber) {
  return String(dirtyNumber);
}

var localize$2 = {
  ordinalNumber: ordinalNumber$2,
  era: buildLocalizeFn({
    values: eraValues$2,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$2,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$2,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$2,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$2,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$2,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$2 = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern$2 = /\d+/i;
var matchEraPatterns$2 = {
  narrow: /^(ق|ب)/i,
  abbreviated: /^(ق\.?\s?م\.?|ق\.?\s?م\.?\s?|a\.?\s?d\.?|c\.?\s?)/i,
  wide: /^(قبل الميلاد|قبل الميلاد|بعد الميلاد|بعد الميلاد)/i
};
var parseEraPatterns$2 = {
  any: [/^قبل/i, /^بعد/i]
};
var matchQuarterPatterns$2 = {
  narrow: /^[1234]/i,
  abbreviated: /^ر[1234]/i,
  wide: /^الربع [1234]/i
};
var parseQuarterPatterns$2 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$2 = {
  narrow: /^[جفمأسند]/i,
  abbreviated: /^(جان|فيف|مار|أفر|ماي|جوا|جوي|أوت|سبت|أكت|نوف|ديس)/i,
  wide: /^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/i
};
var parseMonthPatterns$2 = {
  narrow: [/^ج/i, /^ف/i, /^م/i, /^أ/i, /^م/i, /^ج/i, /^ج/i, /^أ/i, /^س/i, /^أ/i, /^ن/i, /^د/i],
  any: [/^جان/i, /^فيف/i, /^مار/i, /^أفر/i, /^ماي/i, /^جوا/i, /^جوي/i, /^أوت/i, /^سبت/i, /^أكت/i, /^نوف/i, /^ديس/i]
};
var matchDayPatterns$2 = {
  narrow: /^[حنثرخجس]/i,
  short: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
  abbreviated: /^(أحد|اثن|ثلا|أرب|خمي|جمعة|سبت)/i,
  wide: /^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
};
var parseDayPatterns$2 = {
  narrow: [/^ح/i, /^ن/i, /^ث/i, /^ر/i, /^خ/i, /^ج/i, /^س/i],
  wide: [/^الأحد/i, /^الاثنين/i, /^الثلاثاء/i, /^الأربعاء/i, /^الخميس/i, /^الجمعة/i, /^السبت/i],
  any: [/^أح/i, /^اث/i, /^ث/i, /^أر/i, /^خ/i, /^ج/i, /^س/i]
};
var matchDayPeriodPatterns$2 = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns$2 = {
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
var match$2 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$2,
    parsePattern: parseOrdinalNumberPattern$2,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$2,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$2,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$2,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$2,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$2,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$2,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$2,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$2,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$2,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$2,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Arabic locale (Modern Standard Arabic ).
 * @language Modern Standard Arabic (Algeria) [ar-dz]
 * @iso-639-2 ara
 * @author Badreddine Boumaza [@badre429]{@link https://github.com/badre429}
 * @author Ahmed ElShahat [@elshahat]{@link https://github.com/elshahat}
 */

var locale$2 = {
  code: 'ar-DZ',
  formatDistance: formatDistance$2,
  formatLong: formatLong$2,
  formatRelative: formatRelative$2,
  localize: localize$2,
  match: match$2,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$3 = {
  lessThanXSeconds: {
    one: 'أقل من ثانية واحدة',
    two: 'أقل من ثانتين',
    threeToTen: 'أقل من {{count}} ثواني',
    other: 'أقل من {{count}} ثانية'
  },
  xSeconds: {
    one: 'ثانية واحدة',
    two: 'ثانتين',
    threeToTen: '{{count}} ثواني',
    other: '{{count}} ثانية'
  },
  halfAMinute: 'نصف دقيقة',
  lessThanXMinutes: {
    one: 'أقل من دقيقة',
    two: 'أقل من دقيقتين',
    threeToTen: 'أقل من {{count}} دقائق',
    other: 'أقل من {{count}} دقيقة'
  },
  xMinutes: {
    one: 'دقيقة واحدة',
    two: 'دقيقتين',
    threeToTen: '{{count}} دقائق',
    other: '{{count}} دقيقة'
  },
  aboutXHours: {
    one: 'ساعة واحدة تقريباً',
    two: 'ساعتين تقريباً',
    threeToTen: '{{count}} ساعات تقريباً',
    other: '{{count}} ساعة تقريباً'
  },
  xHours: {
    one: 'ساعة واحدة',
    two: 'ساعتين',
    threeToTen: '{{count}} ساعات',
    other: '{{count}} ساعة'
  },
  xDays: {
    one: 'يوم واحد',
    two: 'يومين',
    threeToTen: '{{count}} أيام',
    other: '{{count}} يوم'
  },
  aboutXMonths: {
    one: 'شهر واحد تقريباً',
    two: 'شهرين تقريباً',
    threeToTen: '{{count}} أشهر تقريباً',
    other: '{{count}} شهر تقريباً'
  },
  xMonths: {
    one: 'شهر واحد',
    two: 'شهرين',
    threeToTen: '{{count}} أشهر',
    other: '{{count}} شهر'
  },
  aboutXYears: {
    one: 'عام واحد تقريباً',
    two: 'عامين تقريباً',
    threeToTen: '{{count}} أعوام تقريباً',
    other: '{{count}} عام تقريباً'
  },
  xYears: {
    one: 'عام واحد',
    two: 'عامين',
    threeToTen: '{{count}} أعوام',
    other: '{{count}} عام'
  },
  overXYears: {
    one: 'أكثر من عام',
    two: 'أكثر من عامين',
    threeToTen: 'أكثر من {{count}} أعوام',
    other: 'أكثر من {{count}} عام'
  },
  almostXYears: {
    one: 'عام واحد تقريباً',
    two: 'عامين تقريباً',
    threeToTen: '{{count}} أعوام تقريباً',
    other: '{{count}} عام تقريباً'
  }
};
function formatDistance$3(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$3[token] === 'string') {
    result = formatDistanceLocale$3[token];
  } else if (count === 1) {
    result = formatDistanceLocale$3[token].one;
  } else if (count === 2) {
    result = formatDistanceLocale$3[token].two;
  } else if (count <= 10) {
    result = formatDistanceLocale$3[token].threeToTen.replace('{{count}}', count);
  } else {
    result = formatDistanceLocale$3[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'في خلال ' + result;
    } else {
      return 'منذ ' + result;
    }
  }

  return result;
}

var dateFormats$3 = {
  full: 'EEEE, MMMM do, y',
  long: 'MMMM do, y',
  medium: 'MMM d, y',
  short: 'MM/dd/yyyy'
};
var timeFormats$3 = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$3 = {
  full: "{{date}} 'عند' {{time}}",
  long: "{{date}} 'عند' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$3 = {
  date: buildFormatLongFn({
    formats: dateFormats$3,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$3,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$3,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$3 = {
  lastWeek: "'أخر' eeee 'عند' p",
  yesterday: "'أمس عند' p",
  today: "'اليوم عند' p",
  tomorrow: "'غداً عند' p",
  nextWeek: "eeee 'عند' p",
  other: 'P'
};
function formatRelative$3(token, _date, _baseDate, _options) {
  return formatRelativeLocale$3[token];
}

var eraValues$3 = {
  narrow: ['ق', 'ب'],
  abbreviated: ['ق.م.', 'ب.م.'],
  wide: ['قبل الميلاد', 'بعد الميلاد']
};
var quarterValues$3 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['ر1', 'ر2', 'ر3', 'ر4'],
  wide: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع']
};
var monthValues$3 = {
  narrow: ['ي', 'ف', 'م', 'أ', 'م', 'ي', 'ي', 'أ', 'س', 'أ', 'ن', 'د'],
  abbreviated: ['ينا', 'فبر', 'مارس', 'أبريل', 'مايو', 'يونـ', 'يولـ', 'أغسـ', 'سبتـ', 'أكتـ', 'نوفـ', 'ديسـ'],
  wide: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};
var dayValues$3 = {
  narrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  abbreviated: ['أحد', 'اثنـ', 'ثلا', 'أربـ', 'خميـ', 'جمعة', 'سبت'],
  wide: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};
var dayPeriodValues$3 = {
  narrow: {
    am: 'ص',
    pm: 'م',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  },
  abbreviated: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  },
  wide: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءاً',
    night: 'ليلاً'
  }
};
var formattingDayPeriodValues$3 = {
  narrow: {
    am: 'ص',
    pm: 'م',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'في الصباح',
    afternoon: 'بعد الظـهر',
    evening: 'في المساء',
    night: 'في الليل'
  },
  abbreviated: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    morning: 'في الصباح',
    evening: 'في المساء',
    night: 'في الليل'
  },
  wide: {
    am: 'ص',
    pm: 'م',
    midnight: 'نصف الليل',
    noon: 'ظهر',
    afternoon: 'بعد الظـهر',
    evening: 'في المساء',
    night: 'في الليل'
  }
};

function ordinalNumber$3(dirtyNumber) {
  return String(dirtyNumber);
}

var localize$3 = {
  ordinalNumber: ordinalNumber$3,
  era: buildLocalizeFn({
    values: eraValues$3,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$3,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$3,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$3,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$3,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$3,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$3 = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern$3 = /\d+/i;
var matchEraPatterns$3 = {
  narrow: /^(ق|ب)/i,
  abbreviated: /^(ق\.?\s?م\.?|ق\.?\s?م\.?\s?|a\.?\s?d\.?|c\.?\s?)/i,
  wide: /^(قبل الميلاد|قبل الميلاد|بعد الميلاد|بعد الميلاد)/i
};
var parseEraPatterns$3 = {
  any: [/^قبل/i, /^بعد/i]
};
var matchQuarterPatterns$3 = {
  narrow: /^[1234]/i,
  abbreviated: /^ر[1234]/i,
  wide: /^الربع [1234]/i
};
var parseQuarterPatterns$3 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$3 = {
  narrow: /^[يفمأمسند]/i,
  abbreviated: /^(ين|ف|مار|أب|ماي|يون|يول|أغ|س|أك|ن|د)/i,
  wide: /^(ين|ف|مار|أب|ماي|يون|يول|أغ|س|أك|ن|د)/i
};
var parseMonthPatterns$3 = {
  narrow: [/^ي/i, /^ف/i, /^م/i, /^أ/i, /^م/i, /^ي/i, /^ي/i, /^أ/i, /^س/i, /^أ/i, /^ن/i, /^د/i],
  any: [/^ين/i, /^ف/i, /^مار/i, /^أب/i, /^ماي/i, /^يون/i, /^يول/i, /^أغ/i, /^س/i, /^أك/i, /^ن/i, /^د/i]
};
var matchDayPatterns$3 = {
  narrow: /^[حنثرخجس]/i,
  short: /^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
  abbreviated: /^(أحد|اثن|ثلا|أرب|خمي|جمعة|سبت)/i,
  wide: /^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
};
var parseDayPatterns$3 = {
  narrow: [/^ح/i, /^ن/i, /^ث/i, /^ر/i, /^خ/i, /^ج/i, /^س/i],
  wide: [/^الأحد/i, /^الاثنين/i, /^الثلاثاء/i, /^الأربعاء/i, /^الخميس/i, /^الجمعة/i, /^السبت/i],
  any: [/^أح/i, /^اث/i, /^ث/i, /^أر/i, /^خ/i, /^ج/i, /^س/i]
};
var matchDayPeriodPatterns$3 = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns$3 = {
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
var match$3 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$3,
    parsePattern: parseOrdinalNumberPattern$3,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$3,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$3,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$3,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$3,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$3,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$3,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$3,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$3,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$3,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$3,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Arabic locale (Sauid Arabic).
 * @language Arabic
 * @iso-639-2 ara
 * @author Dhaifallah Alwadani [@dalwadani]{@link https://github.com/dalwadani}
 */

var locale$3 = {
  code: 'ar-SA',
  formatDistance: formatDistance$3,
  formatLong: formatLong$3,
  formatRelative: formatRelative$3,
  localize: localize$3,
  match: match$3,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

function declension(scheme, count) {
  // scheme for count=1 exists
  if (scheme.one !== undefined && count === 1) {
    return scheme.one;
  }

  var rem10 = count % 10;
  var rem100 = count % 100; // 1, 21, 31, ...

  if (rem10 === 1 && rem100 !== 11) {
    return scheme.singularNominative.replace('{{count}}', count); // 2, 3, 4, 22, 23, 24, 32 ...
  } else if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) {
    return scheme.singularGenitive.replace('{{count}}', count); // 5, 6, 7, 8, 9, 10, 11, ...
  } else {
    return scheme.pluralGenitive.replace('{{count}}', count);
  }
}

function buildLocalizeTokenFn(scheme) {
  return function (count, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        if (scheme.future) {
          return declension(scheme.future, count);
        } else {
          return 'праз ' + declension(scheme.regular, count);
        }
      } else {
        if (scheme.past) {
          return declension(scheme.past, count);
        } else {
          return declension(scheme.regular, count) + ' таму';
        }
      }
    } else {
      return declension(scheme.regular, count);
    }
  };
}

var formatDistanceLocale$4 = {
  lessThanXSeconds: buildLocalizeTokenFn({
    regular: {
      one: 'менш за секунду',
      singularNominative: 'менш за {{count}} секунду',
      singularGenitive: 'менш за {{count}} секунды',
      pluralGenitive: 'менш за {{count}} секунд'
    },
    future: {
      one: 'менш, чым праз секунду',
      singularNominative: 'менш, чым праз {{count}} секунду',
      singularGenitive: 'менш, чым праз {{count}} секунды',
      pluralGenitive: 'менш, чым праз {{count}} секунд'
    }
  }),
  xSeconds: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} секунда',
      singularGenitive: '{{count}} секунды',
      pluralGenitive: '{{count}} секунд'
    },
    past: {
      singularNominative: '{{count}} секунду таму',
      singularGenitive: '{{count}} секунды таму',
      pluralGenitive: '{{count}} секунд таму'
    },
    future: {
      singularNominative: 'праз {{count}} секунду',
      singularGenitive: 'праз {{count}} секунды',
      pluralGenitive: 'праз {{count}} секунд'
    }
  }),
  halfAMinute: function (_, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'праз паўхвіліны';
      } else {
        return 'паўхвіліны таму';
      }
    }

    return 'паўхвіліны';
  },
  lessThanXMinutes: buildLocalizeTokenFn({
    regular: {
      one: 'менш за хвіліну',
      singularNominative: 'менш за {{count}} хвіліну',
      singularGenitive: 'менш за {{count}} хвіліны',
      pluralGenitive: 'менш за {{count}} хвілін'
    },
    future: {
      one: 'менш, чым праз хвіліну',
      singularNominative: 'менш, чым праз {{count}} хвіліну',
      singularGenitive: 'менш, чым праз {{count}} хвіліны',
      pluralGenitive: 'менш, чым праз {{count}} хвілін'
    }
  }),
  xMinutes: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} хвіліна',
      singularGenitive: '{{count}} хвіліны',
      pluralGenitive: '{{count}} хвілін'
    },
    past: {
      singularNominative: '{{count}} хвіліну таму',
      singularGenitive: '{{count}} хвіліны таму',
      pluralGenitive: '{{count}} хвілін таму'
    },
    future: {
      singularNominative: 'праз {{count}} хвіліну',
      singularGenitive: 'праз {{count}} хвіліны',
      pluralGenitive: 'праз {{count}} хвілін'
    }
  }),
  aboutXHours: buildLocalizeTokenFn({
    regular: {
      singularNominative: 'каля {{count}} гадзіны',
      singularGenitive: 'каля {{count}} гадзін',
      pluralGenitive: 'каля {{count}} гадзін'
    },
    future: {
      singularNominative: 'прыблізна праз {{count}} гадзіну',
      singularGenitive: 'прыблізна праз {{count}} гадзіны',
      pluralGenitive: 'прыблізна праз {{count}} гадзін'
    }
  }),
  xHours: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} гадзіна',
      singularGenitive: '{{count}} гадзіны',
      pluralGenitive: '{{count}} гадзін'
    },
    past: {
      singularNominative: '{{count}} гадзіну таму',
      singularGenitive: '{{count}} гадзіны таму',
      pluralGenitive: '{{count}} гадзін таму'
    },
    future: {
      singularNominative: 'праз {{count}} гадзіну',
      singularGenitive: 'праз {{count}} гадзіны',
      pluralGenitive: 'праз {{count}} гадзін'
    }
  }),
  xDays: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} дзень',
      singularGenitive: '{{count}} дні',
      pluralGenitive: '{{count}} дзён'
    }
  }),
  aboutXMonths: buildLocalizeTokenFn({
    regular: {
      singularNominative: 'каля {{count}} месяца',
      singularGenitive: 'каля {{count}} месяцаў',
      pluralGenitive: 'каля {{count}} месяцаў'
    },
    future: {
      singularNominative: 'прыблізна праз {{count}} месяц',
      singularGenitive: 'прыблізна праз {{count}} месяцы',
      pluralGenitive: 'прыблізна праз {{count}} месяцаў'
    }
  }),
  xMonths: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} месяц',
      singularGenitive: '{{count}} месяцы',
      pluralGenitive: '{{count}} месяцаў'
    }
  }),
  aboutXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: 'каля {{count}} года',
      singularGenitive: 'каля {{count}} гадоў',
      pluralGenitive: 'каля {{count}} гадоў'
    },
    future: {
      singularNominative: 'прыблізна праз {{count}} год',
      singularGenitive: 'прыблізна праз {{count}} гады',
      pluralGenitive: 'прыблізна праз {{count}} гадоў'
    }
  }),
  xYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: '{{count}} год',
      singularGenitive: '{{count}} гады',
      pluralGenitive: '{{count}} гадоў'
    }
  }),
  overXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: 'больш за {{count}} год',
      singularGenitive: 'больш за {{count}} гады',
      pluralGenitive: 'больш за {{count}} гадоў'
    },
    future: {
      singularNominative: 'больш, чым праз {{count}} год',
      singularGenitive: 'больш, чым праз {{count}} гады',
      pluralGenitive: 'больш, чым праз {{count}} гадоў'
    }
  }),
  almostXYears: buildLocalizeTokenFn({
    regular: {
      singularNominative: 'амаль {{count}} год',
      singularGenitive: 'амаль {{count}} гады',
      pluralGenitive: 'амаль {{count}} гадоў'
    },
    future: {
      singularNominative: 'амаль праз {{count}} год',
      singularGenitive: 'амаль праз {{count}} гады',
      pluralGenitive: 'амаль праз {{count}} гадоў'
    }
  })
};
function formatDistance$4(token, count, options) {
  options = options || {};
  return formatDistanceLocale$4[token](count, options);
}

var dateFormats$4 = {
  full: "EEEE, d MMMM y 'г.'",
  long: "d MMMM y 'г.'",
  medium: "d MMM y 'г.'",
  short: 'dd.MM.y'
};
var timeFormats$4 = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$4 = {
  any: '{{date}}, {{time}}'
};
var formatLong$4 = {
  date: buildFormatLongFn({
    formats: dateFormats$4,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$4,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$4,
    defaultWidth: 'any'
  })
};

// See issue: https://github.com/date-fns/date-fns/issues/376

function isSameUTCWeek(dirtyDateLeft, dirtyDateRight, options) {
  if (arguments.length < 2) {
    throw new TypeError('2 argument required, but only ' + arguments.length + ' present');
  }

  var dateLeftStartOfWeek = startOfUTCWeek(dirtyDateLeft, options);
  var dateRightStartOfWeek = startOfUTCWeek(dirtyDateRight, options);
  return dateLeftStartOfWeek.getTime() === dateRightStartOfWeek.getTime();
}

var accusativeWeekdays = ['нядзелю', 'панядзелак', 'аўторак', 'сераду', 'чацвер', 'пятніцу', 'суботу'];

function lastWeek(day) {
  var weekday = accusativeWeekdays[day];

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у мінулую " + weekday + " а' p";

    case 1:
    case 2:
    case 4:
      return "'у мінулы " + weekday + " а' p";
  }
}

function thisWeek(day) {
  var weekday = accusativeWeekdays[day];
  return "'у " + weekday + " а' p";
}

function nextWeek(day) {
  var weekday = accusativeWeekdays[day];

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у наступную " + weekday + " а' p";

    case 1:
    case 2:
    case 4:
      return "'у наступны " + weekday + " а' p";
  }
}

var formatRelativeLocale$4 = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek(day);
    } else {
      return lastWeek(day);
    }
  },
  yesterday: "'учора а' p",
  today: "'сёння а' p",
  tomorrow: "'заўтра а' p",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek(day);
    } else {
      return nextWeek(day);
    }
  },
  other: 'P'
};
function formatRelative$4(token, date, baseDate, options) {
  var format = formatRelativeLocale$4[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$4 = {
  narrow: ['да н.э.', 'н.э.'],
  abbreviated: ['да н. э.', 'н. э.'],
  wide: ['да нашай эры', 'нашай эры']
};
var quarterValues$4 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-ы кв.', '2-і кв.', '3-і кв.', '4-ы кв.'],
  wide: ['1-ы квартал', '2-і квартал', '3-і квартал', '4-ы квартал']
};
var monthValues$4 = {
  narrow: ['С', 'Л', 'С', 'К', 'М', 'Ч', 'Л', 'Ж', 'В', 'К', 'Л', 'С'],
  abbreviated: ['студз.', 'лют.', 'сак.', 'крас.', 'май', 'чэрв.', 'ліп.', 'жн.', 'вер.', 'кастр.', 'ліст.', 'снеж.'],
  wide: ['студзень', 'люты', 'сакавік', 'красавік', 'май', 'чэрвень', 'ліпень', 'жнівень', 'верасень', 'кастрычнік', 'лістапад', 'снежань']
};
var formattingMonthValues = {
  narrow: ['С', 'Л', 'С', 'К', 'М', 'Ч', 'Л', 'Ж', 'В', 'К', 'Л', 'С'],
  abbreviated: ['студз.', 'лют.', 'сак.', 'крас.', 'мая', 'чэрв.', 'ліп.', 'жн.', 'вер.', 'кастр.', 'ліст.', 'снеж.'],
  wide: ['студзеня', 'лютага', 'сакавіка', 'красавіка', 'мая', 'чэрвеня', 'ліпеня', 'жніўня', 'верасня', 'кастрычніка', 'лістапада', 'снежня']
};
var dayValues$4 = {
  narrow: ['Н', 'П', 'А', 'С', 'Ч', 'П', 'С'],
  short: ['нд', 'пн', 'аў', 'ср', 'чц', 'пт', 'сб'],
  abbreviated: ['нядз', 'пан', 'аўт', 'сер', 'чац', 'пят', 'суб'],
  wide: ['нядзеля', 'панядзелак', 'аўторак', 'серада', 'чацвер', 'пятніца', 'субота']
};
var dayPeriodValues$4 = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўн.',
    noon: 'поўд.',
    morning: 'ран.',
    afternoon: 'дзень',
    evening: 'веч.',
    night: 'ноч'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўн.',
    noon: 'поўд.',
    morning: 'ран.',
    afternoon: 'дзень',
    evening: 'веч.',
    night: 'ноч'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўнач',
    noon: 'поўдзень',
    morning: 'раніца',
    afternoon: 'дзень',
    evening: 'вечар',
    night: 'ноч'
  }
};
var formattingDayPeriodValues$4 = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўн.',
    noon: 'поўд.',
    morning: 'ран.',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночы'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўн.',
    noon: 'поўд.',
    morning: 'ран.',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночы'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'поўнач',
    noon: 'поўдзень',
    morning: 'раніцы',
    afternoon: 'дня',
    evening: 'вечара',
    night: 'ночы'
  }
};

function ordinalNumber$4(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var number = Number(dirtyNumber);
  var suffix;
  /** Though it's an incorrect ordinal form of a date we use it here for consistency with other similar locales (ru, uk)
   *  For date-month combinations should be used `d` formatter.
   *  Correct:   `d MMMM` (4 верасня)
   *  Incorrect: `do MMMM` (4-га верасня)
   *
   *  But following the consistency leads to mistakes for literal uses of `do` formatter (ordinal day of month).
   *  So for phrase "5th day of month" (`do дзень месяца`)
   *  library will produce:            `5-га дзень месяца`
   *  but correct spelling should be:  `5-ы дзень месяца`
   *
   *  So I guess there should be a stand-alone and a formatting version of "day of month" formatters
   */

  if (unit === 'date') {
    suffix = '-га';
  } else if (unit === 'hour' || unit === 'minute' || unit === 'second') {
    suffix = '-я';
  } else {
    suffix = (number % 10 === 2 || number % 10 === 3) && number % 100 !== 12 && number % 100 !== 13 ? '-і' : '-ы';
  }

  return number + suffix;
}

var localize$4 = {
  ordinalNumber: ordinalNumber$4,
  era: buildLocalizeFn({
    values: eraValues$4,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$4,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$4,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$4,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$4,
    defaultWidth: 'any',
    formattingValues: formattingDayPeriodValues$4,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$4 = /^(\d+)(-?(е|я|га|і|ы|ае|ая|яя|шы|гі|ці|ты|мы))?/i;
var parseOrdinalNumberPattern$4 = /\d+/i;
var matchEraPatterns$4 = {
  narrow: /^((да )?н\.?\s?э\.?)/i,
  abbreviated: /^((да )?н\.?\s?э\.?)/i,
  wide: /^(да нашай эры|нашай эры|наша эра)/i
};
var parseEraPatterns$4 = {
  any: [/^д/i, /^н/i]
};
var matchQuarterPatterns$4 = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](-?[ыі]?)? кв.?/i,
  wide: /^[1234](-?[ыі]?)? квартал/i
};
var parseQuarterPatterns$4 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$4 = {
  narrow: /^[слкмчжв]/i,
  abbreviated: /^(студз|лют|сак|крас|ма[йя]|чэрв|ліп|жн|вер|кастр|ліст|снеж)\.?/i,
  wide: /^(студзен[ья]|лют(ы|ага)|сакавіка?|красавіка?|ма[йя]|чэрвен[ья]|ліпен[ья]|жні(вень|ўня)|верас(ень|ня)|кастрычніка?|лістапада?|снеж(ань|ня))/i
};
var parseMonthPatterns$4 = {
  narrow: [/^с/i, /^л/i, /^с/i, /^к/i, /^м/i, /^ч/i, /^л/i, /^ж/i, /^в/i, /^к/i, /^л/i, /^с/i],
  any: [/^ст/i, /^лю/i, /^са/i, /^кр/i, /^ма/i, /^ч/i, /^ліп/i, /^ж/i, /^в/i, /^ка/i, /^ліс/i, /^сн/i]
};
var matchDayPatterns$4 = {
  narrow: /^[нпасч]/i,
  short: /^(нд|ня|пн|па|аў|ат|ср|се|чц|ча|пт|пя|сб|су)\.?/i,
  abbreviated: /^(нядз?|ндз|пнд|пан|аўт|срд|сер|чцв|чац|птн|пят|суб).?/i,
  wide: /^(нядзел[яі]|панядзел(ак|ка)|аўтор(ак|ка)|серад[аы]|чацв(ер|ярга)|пятніц[аы]|субот[аы])/i
};
var parseDayPatterns$4 = {
  narrow: [/^н/i, /^п/i, /^а/i, /^с/i, /^ч/i, /^п/i, /^с/i],
  any: [/^н/i, /^п[ан]/i, /^а/i, /^с[ер]/i, /^ч/i, /^п[ят]/i, /^с[уб]/i]
};
var matchDayPeriodPatterns$4 = {
  narrow: /^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
  abbreviated: /^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
  wide: /^([дп]п|поўнач|поўдзень|раніц[аы]|дзень|дня|вечара?|ночы?)/i
};
var parseDayPeriodPatterns$4 = {
  any: {
    am: /^дп/i,
    pm: /^пп/i,
    midnight: /^поўн/i,
    noon: /^поўд/i,
    morning: /^р/i,
    afternoon: /^д[зн]/i,
    evening: /^в/i,
    night: /^н/i
  }
};
var match$4 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$4,
    parsePattern: parseOrdinalNumberPattern$4,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$4,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$4,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$4,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$4,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$4,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$4,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$4,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$4,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$4,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$4,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Belarusian locale.
 * @language Belarusian
 * @iso-639-2 bel
 * @author Kiryl Anokhin [@alyrik]{@link https://github.com/alyrik}
 * @author Martin Wind [@arvigeus]{@link https://github.com/mawi12345}
 */

var locale$4 = {
  code: 'be',
  formatDistance: formatDistance$4,
  formatLong: formatLong$4,
  formatRelative: formatRelative$4,
  localize: localize$4,
  match: match$4,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$5 = {
  lessThanXSeconds: {
    one: 'по-малко от секунда',
    other: 'по-малко от {{count}} секунди'
  },
  xSeconds: {
    one: '1 секунда',
    other: '{{count}} секунди'
  },
  halfAMinute: 'половин минута',
  lessThanXMinutes: {
    one: 'по-малко от минута',
    other: 'по-малко от {{count}} минути'
  },
  xMinutes: {
    one: '1 минута',
    other: '{{count}} минути'
  },
  aboutXHours: {
    one: 'около час',
    other: 'около {{count}} часа'
  },
  xHours: {
    one: '1 час',
    other: '{{count}} часа'
  },
  xDays: {
    one: '1 ден',
    other: '{{count}} дни'
  },
  aboutXMonths: {
    one: 'около месец',
    other: 'около {{count}} месеца'
  },
  xMonths: {
    one: '1 месец',
    other: '{{count}} месеца'
  },
  aboutXYears: {
    one: 'около година',
    other: 'около {{count}} години'
  },
  xYears: {
    one: '1 година',
    other: '{{count}} години'
  },
  overXYears: {
    one: 'над година',
    other: 'над {{count}} години'
  },
  almostXYears: {
    one: 'почти година',
    other: 'почти {{count}} години'
  }
};
function formatDistance$5(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$5[token] === 'string') {
    result = formatDistanceLocale$5[token];
  } else if (count === 1) {
    result = formatDistanceLocale$5[token].one;
  } else {
    result = formatDistanceLocale$5[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'след ' + result;
    } else {
      return 'преди ' + result;
    }
  }

  return result;
}

var dateFormats$5 = {
  full: 'EEEE, dd MMMM yyyy',
  long: 'dd MMMM yyyy',
  medium: 'dd MMM yyyy',
  short: 'dd/MM/yyyy'
};
var timeFormats$5 = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$5 = {
  any: '{{date}} {{time}}'
};
var formatLong$5 = {
  date: buildFormatLongFn({
    formats: dateFormats$5,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$5,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$5,
    defaultWidth: 'any'
  })
};

var weekdays = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];

function lastWeek$1(day) {
  var weekday = weekdays[day];

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'миналата " + weekday + " в' p";

    case 1:
    case 2:
    case 4:
    case 5:
      return "'миналия " + weekday + " в' p";
  }
}

function thisWeek$1(day) {
  var weekday = weekdays[day];

  if (day === 2
  /* Tue */
  ) {
      return "'във " + weekday + " в' p";
    } else {
    return "'в " + weekday + " в' p";
  }
}

function nextWeek$1(day) {
  var weekday = weekdays[day];

  switch (day) {
    case 0:
    case 3:
    case 6:
      return "'следващата " + weekday + " в' p";

    case 1:
    case 2:
    case 4:
    case 5:
      return "'следващия " + weekday + " в' p";
  }
}

var formatRelativeLocale$5 = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$1(day);
    } else {
      return lastWeek$1(day);
    }
  },
  yesterday: "'вчера в' p",
  today: "'днес в' p",
  tomorrow: "'утре в' p",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$1(day);
    } else {
      return nextWeek$1(day);
    }
  },
  other: 'P'
};
function formatRelative$5(token, date, baseDate, options) {
  var format = formatRelativeLocale$5[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$5 = {
  narrow: ['пр.н.е.', 'н.е.'],
  abbreviated: ['преди н. е.', 'н. е.'],
  wide: ['преди новата ера', 'новата ера']
};
var quarterValues$5 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-ви кв.', '2-ри кв.', '3-ти кв.', '4-ти кв.'],
  wide: ['1-ви квартал', '2-ри квартал', '3-ти квартал', '4-ти квартал']
};
var monthValues$5 = {
  short: ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'],
  wide: ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']
};
var dayValues$5 = {
  narrow: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  short: ['нед', 'пон', 'вто', 'сря', 'чет', 'пет', 'съб'],
  wide: ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота']
};
var dayPeriodValues$5 = {
  wide: {
    am: 'преди обяд',
    pm: 'след обяд',
    midnight: 'в полунощ',
    noon: 'на обяд',
    morning: 'сутринта',
    afternoon: 'следобед',
    evening: 'вечерта',
    night: 'през нощта'
  }
};

function isFeminine(unit) {
  return unit === 'year' || unit === 'week' || unit === 'minute' || unit === 'second';
}

function numberWithSuffix(number, unit, masculine, feminine) {
  var suffix = isFeminine(unit) ? feminine : masculine;
  return number + '-' + suffix;
}

function ordinalNumber$5(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var number = Number(dirtyNumber);

  if (number === 0) {
    return numberWithSuffix(0, unit, 'ев', 'ева');
  } else if (number % 1000 === 0) {
    return numberWithSuffix(number, unit, 'ен', 'на');
  } else if (number % 100 === 0) {
    return numberWithSuffix(number, unit, 'тен', 'тна');
  }

  var rem100 = number % 100;

  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return numberWithSuffix(number, unit, 'ви', 'ва');

      case 2:
        return numberWithSuffix(number, unit, 'ри', 'ра');

      case 7:
      case 8:
        return numberWithSuffix(number, unit, 'ми', 'ма');
    }
  }

  return numberWithSuffix(number, unit, 'ти', 'та');
}

var localize$5 = {
  ordinalNumber: ordinalNumber$5,
  era: buildLocalizeFn({
    values: eraValues$5,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$5,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$5,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$5,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$5,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$5 = /^(\d+)(-?[врмт][аи]|-?т?(ен|на)|-?(ев|ева))?/i;
var parseOrdinalNumberPattern$5 = /\d+/i;
var matchEraPatterns$5 = {
  narrow: /^((пр)?н\.?\s?е\.?)/i,
  abbreviated: /^((пр)?н\.?\s?е\.?)/i,
  wide: /^(преди новата ера|новата ера|нова ера)/i
};
var parseEraPatterns$5 = {
  any: [/^п/i, /^н/i]
};
var matchQuarterPatterns$5 = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](-?[врт]?и?)? кв.?/i,
  wide: /^[1234](-?[врт]?и?)? квартал/i
};
var parseQuarterPatterns$5 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchDayPatterns$5 = {
  narrow: /^(нд|пн|вт|ср|чт|пт|сб)/i,
  short: /^(нед|пон|вто|сря|чет|пет|съб)/i,
  wide: /^(неделя|понеделник|вторник|сряда|четвъртък|петък|събота)/i
};
var parseDayPatterns$5 = {
  narrow: [/^нд/i, /^пн/i, /^вт/i, /^ср/i, /^чт/i, /^пт/i, /^сб/i],
  any: [/^н[ед]/i, /^п[он]/i, /^вт/i, /^ср/i, /^ч[ет]/i, /^п[ет]/i, /^с[ъб]/i]
};
var matchMonthPatterns$5 = {
  short: /^(яну|фев|мар|апр|май|юни|юли|авг|сеп|окт|ное|дек)/i,
  wide: /^(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/i
};
var parseMonthPatterns$5 = {
  any: [/^я/i, /^ф/i, /^мар/i, /^ап/i, /^май/i, /^юн/i, /^юл/i, /^ав/i, /^се/i, /^окт/i, /^но/i, /^де/i]
};
var matchDayPeriodPatterns$5 = {
  any: /^(преди о|след о|в по|на о|през|веч|сут|следо)/i
};
var parseDayPeriodPatterns$5 = {
  any: {
    am: /^преди о/i,
    pm: /^след о/i,
    midnight: /^в пол/i,
    noon: /^на об/i,
    morning: /^сут/i,
    afternoon: /^следо/i,
    evening: /^веч/i,
    night: /^през н/i
  }
};
var match$5 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$5,
    parsePattern: parseOrdinalNumberPattern$5,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$5,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$5,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$5,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$5,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$5,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$5,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$5,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$5,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$5,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$5,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Bulgarian locale.
 * @language Bulgarian
 * @iso-639-2 bul
 * @author Nikolay Stoynov [@arvigeus]{@link https://github.com/arvigeus}
 * @author Tsvetan Ovedenski [@fintara]{@link https://github.com/fintara}
 */

var locale$5 = {
  code: 'bg',
  formatDistance: formatDistance$5,
  formatLong: formatLong$5,
  formatRelative: formatRelative$5,
  localize: localize$5,
  match: match$5,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var numberValues = {
  locale: {
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
    '0': '০'
  },
  number: {
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
    '০': '0'
  }
};
var eraValues$6 = {
  narrow: ['খ্রিঃপূঃ', 'খ্রিঃ'],
  abbreviated: ['খ্রিঃপূর্ব', 'খ্রিঃ'],
  wide: ['খ্রিস্টপূর্ব', 'খ্রিস্টাব্দ']
};
var quarterValues$6 = {
  narrow: ['১', '২', '৩', '৪'],
  abbreviated: ['১ত্রৈ', '২ত্রৈ', '৩ত্রৈ', '৪ত্রৈ'],
  wide: ['১ম ত্রৈমাসিক', '২য় ত্রৈমাসিক', '৩য় ত্রৈমাসিক', '৪র্থ ত্রৈমাসিক']
};
var monthValues$6 = {
  narrow: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'],
  abbreviated: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'],
  wide: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
};
var dayValues$6 = {
  narrow: ['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'],
  short: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'],
  abbreviated: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'],
  wide: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার ', 'শুক্রবার', 'শনিবার']
};
var dayPeriodValues$6 = {
  narrow: {
    am: 'পূ',
    pm: 'অপ',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  },
  abbreviated: {
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  },
  wide: {
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  }
};
var formattingDayPeriodValues$5 = {
  narrow: {
    am: 'পূ',
    pm: 'অপ',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  },
  abbreviated: {
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  },
  wide: {
    am: 'পূর্বাহ্ন',
    pm: 'অপরাহ্ন',
    midnight: 'মধ্যরাত',
    noon: 'মধ্যাহ্ন',
    morning: 'সকাল',
    afternoon: 'বিকাল',
    evening: 'সন্ধ্যা',
    night: 'রাত'
  }
};

function dateOrdinalNumber(number, localeNumber) {
  if (number > 18 && number <= 31) {
    return localeNumber + 'শে';
  } else {
    switch (number) {
      case 1:
        return localeNumber + 'লা';

      case 2:
      case 3:
        return localeNumber + 'রা';

      case 4:
        return localeNumber + 'ঠা';

      default:
        return localeNumber + 'ই';
    }
  }
}

function ordinalNumber$6(dirtyNumber, dirtyOptions) {
  var number = localize$6.localeToNumber(dirtyNumber);
  var localeNumber = localize$6.numberToLocale(number);
  var unit = dirtyOptions.unit;

  if (unit === 'date') {
    return dateOrdinalNumber(number, localeNumber);
  }

  if (number > 10 || number === 0) return localeNumber + 'তম';
  var rem10 = number % 10;

  switch (rem10) {
    case 2:
    case 3:
      return localeNumber + 'য়';

    case 4:
      return localeNumber + 'র্থ';

    case 6:
      return localeNumber + 'ষ্ঠ';

    case 1:
    case 5:
    case 7:
    case 8:
    case 9:
    case 0:
      return localeNumber + 'ম';
  }
}

function localeToNumber(locale) {
  var number = locale.toString().replace(/[১২৩৪৫৬৭৮৯০]/g, function (match) {
    return numberValues.number[match];
  });
  return Number(number);
}

function numberToLocale(number) {
  return number.toString().replace(/\d/g, function (match) {
    return numberValues.locale[match];
  });
}

var localize$6 = {
  localeToNumber: localeToNumber,
  numberToLocale: numberToLocale,
  ordinalNumber: ordinalNumber$6,
  era: buildLocalizeFn({
    values: eraValues$6,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$6,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$6,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$6,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$6,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$5,
    defaultFormattingWidth: 'wide'
  })
};

var formatDistanceLocale$6 = {
  lessThanXSeconds: {
    one: 'প্রায় ১ সেকেন্ড',
    other: 'প্রায় {{count}} সেকেন্ড'
  },
  xSeconds: {
    one: '১ সেকেন্ড',
    other: '{{count}} সেকেন্ড'
  },
  halfAMinute: 'আধ মিনিট',
  lessThanXMinutes: {
    one: 'প্রায় ১ মিনিট',
    other: 'প্রায় {{count}} মিনিট'
  },
  xMinutes: {
    one: '১ মিনিট',
    other: '{{count}} মিনিট'
  },
  aboutXHours: {
    one: 'প্রায় ১ ঘন্টা',
    other: 'প্রায় {{count}} ঘন্টা'
  },
  xHours: {
    one: '১ ঘন্টা',
    other: '{{count}} ঘন্টা'
  },
  xDays: {
    one: '১ দিন',
    other: '{{count}} দিন'
  },
  aboutXMonths: {
    one: 'প্রায় ১ মাস',
    other: 'প্রায় {{count}} মাস'
  },
  xMonths: {
    one: '১ মাস',
    other: '{{count}} মাস'
  },
  aboutXYears: {
    one: 'প্রায় ১ বছর',
    other: 'প্রায় {{count}} বছর'
  },
  xYears: {
    one: '১ বছর',
    other: '{{count}} বছর'
  },
  overXYears: {
    one: '১ বছরের বেশি',
    other: '{{count}} বছরের বেশি'
  },
  almostXYears: {
    one: 'প্রায় ১ বছর',
    other: 'প্রায় {{count}} বছর'
  }
};
function formatDistance$6(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$6[token] === 'string') {
    result = formatDistanceLocale$6[token];
  } else if (count === 1) {
    result = formatDistanceLocale$6[token].one;
  } else {
    result = formatDistanceLocale$6[token].other.replace('{{count}}', localize$6.numberToLocale(count));
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' এর মধ্যে';
    } else {
      return result + ' আগে';
    }
  }

  return result;
}

var dateFormats$6 = {
  full: 'EEEE, MMMM do, y',
  long: 'MMMM do, y',
  medium: 'MMM d, y',
  short: 'MM/dd/yyyy'
};
var timeFormats$6 = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$6 = {
  full: "{{date}} {{time}} 'সময়'",
  long: "{{date}} {{time}} 'সময়'",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$6 = {
  date: buildFormatLongFn({
    formats: dateFormats$6,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$6,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$6,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$6 = {
  lastWeek: "'গত' eeee 'সময়' p",
  yesterday: "'গতকাল' 'সময়' p",
  today: "'আজ' 'সময়' p",
  tomorrow: "'আগামীকাল' 'সময়' p",
  nextWeek: "eeee 'সময়' p",
  other: 'P'
};
function formatRelative$6(token, _date, _baseDate, _options) {
  return formatRelativeLocale$6[token];
}

var matchOrdinalNumberPattern$6 = /^(\d+)(ম|য়|র্থ|ষ্ঠ|শে|ই|তম)?/i;
var parseOrdinalNumberPattern$6 = /\d+/i;
var matchEraPatterns$6 = {
  narrow: /^(খ্রিঃপূঃ|খ্রিঃ)/i,
  abbreviated: /^(খ্রিঃপূর্ব|খ্রিঃ)/i,
  wide: /^(খ্রিস্টপূর্ব|খ্রিস্টাব্দ)/i
};
var parseEraPatterns$6 = {
  narrow: [/^খ্রিঃপূঃ/i, /^খ্রিঃ/i],
  abbreviated: [/^খ্রিঃপূর্ব/i, /^খ্রিঃ/i],
  wide: [/^খ্রিস্টপূর্ব/i, /^খ্রিস্টাব্দ/i]
};
var matchQuarterPatterns$6 = {
  narrow: /^[১২৩৪]/i,
  abbreviated: /^[১২৩৪]ত্রৈ/i,
  wide: /^[১২৩৪](ম|য়|র্থ)? ত্রৈমাসিক/i
};
var parseQuarterPatterns$6 = {
  any: [/১/i, /২/i, /৩/i, /৪/i]
};
var matchMonthPatterns$6 = {
  narrow: /^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
  abbreviated: /^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
  wide: /^(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i
};
var parseMonthPatterns$6 = {
  any: [/^জানু/i, /^ফেব্রু/i, /^মার্চ/i, /^এপ্রিল/i, /^মে/i, /^জুন/i, /^জুলাই/i, /^আগস্ট/i, /^সেপ্ট/i, /^অক্টো/i, /^নভে/i, /^ডিসে/i]
};
var matchDayPatterns$6 = {
  narrow: /^(র|সো|ম|বু|বৃ|শু|শ)+/i,
  short: /^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
  abbreviated: /^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
  wide: /^(রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার |শুক্রবার|শনিবার)+/i
};
var parseDayPatterns$6 = {
  narrow: [/^র/i, /^সো/i, /^ম/i, /^বু/i, /^বৃ/i, /^শু/i, /^শ/i],
  short: [/^রবি/i, /^সোম/i, /^মঙ্গল/i, /^বুধ/i, /^বৃহ/i, /^শুক্র/i, /^শনি/i],
  abbreviated: [/^রবি/i, /^সোম/i, /^মঙ্গল/i, /^বুধ/i, /^বৃহ/i, /^শুক্র/i, /^শনি/i],
  wide: [/^রবিবার/i, /^সোমবার/i, /^মঙ্গলবার/i, /^বুধবার/i, /^বৃহস্পতিবার /i, /^শুক্রবার/i, /^শনিবার/i]
};
var matchDayPeriodPatterns$6 = {
  narrow: /^(পূ|অপ|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
  abbreviated: /^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
  wide: /^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i
};
var parseDayPeriodPatterns$6 = {
  any: {
    am: /^পূ/i,
    pm: /^অপ/i,
    midnight: /^মধ্যরাত/i,
    noon: /^মধ্যাহ্ন/i,
    morning: /সকাল/i,
    afternoon: /বিকাল/i,
    evening: /সন্ধ্যা/i,
    night: /রাত/i
  }
};
var match$6 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$6,
    parsePattern: parseOrdinalNumberPattern$6,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$6,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$6,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$6,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$6,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$6,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$6,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$6,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$6,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$6,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$6,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Bengali locale.
 * @language Bengali
 * @iso-639-2 ben
 * @author Touhidur Rahman [@touhidrahman]{@link https://github.com/touhidrahman}
 * @author Farhad Yasir [@nutboltu]{@link https://github.com/nutboltu}
 */

var locale$6 = {
  code: 'bn',
  formatDistance: formatDistance$6,
  formatLong: formatLong$6,
  formatRelative: formatRelative$6,
  localize: localize$6,
  match: match$6,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

/**
 * Davant de les xifres que es diuen amb vocal inicial, 1 i 11, s'apostrofen els articles el i la i la preposició de igual que si estiguessin escrits amb lletres.
 *    l'1 de juliol ('l'u')
 *    l'11 de novembre ('l'onze')
 *    l'11a clàusula del contracte ('l'onzena')
 *    la contractació d'11 jugadors ('d'onze')
 *    l'aval d'11.000 socis ('d'onze mil')
 *
 * Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=apostrofaci%25F3+davant+xifres&action=Principal&method=detall_completa&numPagina=1&idHit=11236&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=11236&titol=apostrofaci%F3%20davant%20de%20xifres%20%2F%20apostrofaci%F3%20davant%20de%201%20i%2011&numeroResultat=1&clickLink=detall&tipusCerca=cerca.normes
 */
var formatDistanceLocale$7 = {
  lessThanXSeconds: {
    one: "menys d'un segon",
    eleven: "menys d'onze segons",
    other: 'menys de {{count}} segons'
  },
  xSeconds: {
    one: '1 segon',
    other: '{{count}} segons'
  },
  halfAMinute: 'mig minut',
  lessThanXMinutes: {
    one: "menys d'un minut",
    eleven: "menys d'onze minuts",
    other: 'menys de {{count}} minuts'
  },
  xMinutes: {
    one: '1 minut',
    other: '{{count}} minuts'
  },
  aboutXHours: {
    one: 'aproximadament una hora',
    other: 'aproximadament {{count}} hores'
  },
  xHours: {
    one: '1 hora',
    other: '{{count}} hores'
  },
  xDays: {
    one: '1 dia',
    other: '{{count}} dies'
  },
  aboutXMonths: {
    one: 'aproximadament un mes',
    other: 'aproximadament {{count}} mesos'
  },
  xMonths: {
    one: '1 mes',
    other: '{{count}} mesos'
  },
  aboutXYears: {
    one: 'aproximadament un any',
    other: 'aproximadament {{count}} anys'
  },
  xYears: {
    one: '1 any',
    other: '{{count}} anys'
  },
  overXYears: {
    one: "més d'un any",
    eleven: "més d'onze anys",
    other: 'més de {{count}} anys'
  },
  almostXYears: {
    one: 'gairebé un any',
    other: 'gairebé {{count}} anys'
  }
};
function formatDistance$7(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$7[token] === 'string') {
    result = formatDistanceLocale$7[token];
  } else if (count === 1) {
    result = formatDistanceLocale$7[token].one;
  } else if (count === 11 && formatDistanceLocale$7[token].eleven) {
    result = formatDistanceLocale$7[token].eleven;
  } else {
    result = formatDistanceLocale$7[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'en ' + result;
    } else {
      return 'fa ' + result;
    }
  }

  return result;
}

var dateFormats$7 = {
  full: "EEEE, d 'de' MMMM y",
  long: "d 'de' MMMM y",
  medium: 'd MMM y',
  short: 'dd/MM/y'
};
var timeFormats$7 = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$7 = {
  full: "{{date}} 'a les' {{time}}",
  long: "{{date}} 'a les' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$7 = {
  date: buildFormatLongFn({
    formats: dateFormats$7,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$7,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$7,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$7 = {
  lastWeek: "'el' eeee 'passat a la' LT",
  yesterday: "'ahir a la' p",
  today: "'avui a la' p",
  tomorrow: "'demà a la' p",
  nextWeek: "eeee 'a la' p",
  other: 'P'
};
var formatRelativeLocalePlural = {
  lastWeek: "'el' eeee 'passat a les' p",
  yesterday: "'ahir a les' p",
  today: "'avui a les' p",
  tomorrow: "'demà a les' p",
  nextWeek: "eeee 'a les' p",
  other: 'P'
};
function formatRelative$7(token, date, _baseDate, _options) {
  if (date.getUTCHours() !== 1) {
    return formatRelativeLocalePlural[token];
  }

  return formatRelativeLocale$7[token];
}

/**
 * General information
 * Reference: https://aplicacions.llengua.gencat.cat
 * Reference: https://www.uoc.edu/portal/ca/servei-linguistic/convencions/abreviacions/simbols/simbols-habituals.html
 */

/**
 * Abans de Crist: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abans+de+crist&action=Principal&method=detall_completa&numPagina=1&idHit=6876&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=6876&titol=abans%20de%20Crist%20(abreviatura)%20/%20abans%20de%20Crist%20(sigla)&numeroResultat=1&clickLink=detall&tipusCerca=cerca.fitxes
 * Desprest de Crist: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=despr%E9s+de+crist&action=Principal&method=detall_completa&numPagina=1&idHit=6879&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=6879&titol=despr%E9s%20de%20Crist%20(sigla)%20/%20despr%E9s%20de%20Crist%20(abreviatura)&numeroResultat=1&clickLink=detall&tipusCerca=cerca.fitxes
 */

var eraValues$7 = {
  narrow: ['aC', 'dC'],
  abbreviated: ['a. de C.', 'd. de C.'],
  wide: ['abans de Crist', 'després de Crist']
};
var quarterValues$7 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1r trimestre', '2n trimestre', '3r trimestre', '4t trimestre']
  /**
   * Dins d'un text convé fer servir la forma sencera dels mesos, ja que sempre és més clar el mot sencer que l'abreviatura, encara que aquesta sigui força coneguda.
   * Cal reservar, doncs, les abreviatures per a les llistes o classificacions, els gràfics, les taules o quadres estadístics, els textos publicitaris, etc.
   *
   * Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abreviacions+mesos&action=Principal&method=detall_completa&numPagina=1&idHit=8402&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=8402&titol=abreviatures%20dels%20mesos%20de%20l%27any&numeroResultat=5&clickLink=detall&tipusCerca=cerca.fitxes
   */

};
var monthValues$7 = {
  narrow: ['GN', 'FB', 'MÇ', 'AB', 'MG', 'JN', 'JL', 'AG', 'ST', 'OC', 'NV', 'DS'],

  /**
   * Les abreviatures dels mesos de l'any es formen seguint una de les normes generals de formació d'abreviatures.
   * S'escriu la primera síl·laba i les consonants de la síl·laba següent anteriors a la primera vocal.
   * Els mesos de març, maig i juny no s'abreugen perquè són paraules d'una sola síl·laba.
   */
  abbreviated: ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'],
  wide: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre']
  /**
   * Les abreviatures dels dies de la setmana comencen totes amb la lletra d.
   * Tot seguit porten la consonant següent a la i, excepte en el cas de dimarts, dimecres i diumenge, en què aquesta consonant és la m i, per tant, hi podria haver confusió.
   * Per evitar-ho, s'ha substituït la m per una t (en el cas de dimarts), una c (en el cas de dimecres) i una g (en el cas de diumenge), respectivament.
   *
   * Seguint la norma general d'ús de les abreviatures, les dels dies de la setmana sempre porten punt final.
   * Igualment, van amb la primera lletra en majúscula quan la paraula sencera també hi aniria.
   * En canvi, van amb la primera lletra en minúscula quan la inicial de la paraula sencera també hi aniria.
   *
   * Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abreviatures+dies&action=Principal&method=detall_completa&numPagina=1&idHit=8387&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=8387&titol=abreviatures%20dels%20dies%20de%20la%20setmana&numeroResultat=1&clickLink=detall&tipusCerca=cerca.tot
   */

};
var dayValues$7 = {
  narrow: ['dg.', 'dl.', 'dt.', 'dm.', 'dj.', 'dv.', 'ds.'],
  short: ['dg.', 'dl.', 'dt.', 'dm.', 'dj.', 'dv.', 'ds.'],
  abbreviated: ['dg.', 'dl.', 'dt.', 'dm.', 'dj.', 'dv.', 'ds.'],
  wide: ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte']
  /**
   * Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?action=Principal&method=detall&input_cercar=parts+del+dia&numPagina=1&database=FITXES_PUB&idFont=12801&idHit=12801&tipusFont=Fitxes+de+l%27Optimot&numeroResultat=1&databases_avansada=&categories_avansada=&clickLink=detall&titol=Nom+de+les+parts+del+dia&tematica=&tipusCerca=cerca.fitxes
   */

};
var dayPeriodValues$7 = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'mitjanit',
    noon: 'migdia',
    morning: 'matí',
    afternoon: 'tarda',
    evening: 'vespre',
    night: 'nit'
  },
  abbreviated: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'mitjanit',
    noon: 'migdia',
    morning: 'matí',
    afternoon: 'tarda',
    evening: 'vespre',
    night: 'nit'
  },
  wide: {
    am: 'ante meridiem',
    pm: 'post meridiem',
    midnight: 'mitjanit',
    noon: 'migdia',
    morning: 'matí',
    afternoon: 'tarda',
    evening: 'vespre',
    night: 'nit'
  }
};
var formattingDayPeriodValues$6 = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'de la mitjanit',
    noon: 'del migdia',
    morning: 'del matí',
    afternoon: 'de la tarda',
    evening: 'del vespre',
    night: 'de la nit'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'de la mitjanit',
    noon: 'del migdia',
    morning: 'del matí',
    afternoon: 'de la tarda',
    evening: 'del vespre',
    night: 'de la nit'
  },
  wide: {
    am: 'ante meridiem',
    pm: 'post meridiem',
    midnight: 'de la mitjanit',
    noon: 'del migdia',
    morning: 'del matí',
    afternoon: 'de la tarda',
    evening: 'del vespre',
    night: 'de la nit'
  }
  /**
   * Quan van en singular, els nombres ordinals es representen, en forma d’abreviatura, amb la xifra seguida de l’última lletra del mot desplegat.
   * És optatiu posar punt després de la lletra.
   *
   * Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/pdf/abrevia.pdf#page=18
   *
   * @param {Number} dirtyNumber
   * @param {Object} [_dirtyOptions]
   */

};

function ordinalNumber$7(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;

  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + 'r';

      case 2:
        return number + 'n';

      case 3:
        return number + 'r';

      case 4:
        return number + 't';
    }
  }

  return number + 'è';
}

var localize$7 = {
  ordinalNumber: ordinalNumber$7,
  era: buildLocalizeFn({
    values: eraValues$7,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$7,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$7,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$7,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$7,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$6,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$7 = /^(\d+)(è|r|n|r|t)?/i;
var parseOrdinalNumberPattern$7 = /\d+/i;
var matchEraPatterns$7 = {
  narrow: /^(aC|dC)/i,
  abbreviated: /^(a. de C.|d. de C.)/i,
  wide: /^(abans de Crist|despr[eé]s de Crist)/i
};
var parseEraPatterns$7 = {
  narrow: [/^aC/i, /^dC/i],
  abbreviated: [/^(a. de C.)/i, /^(d. de C.)/i],
  wide: [/^(abans de Crist)/i, /^(despr[eé]s de Crist)/i]
};
var matchQuarterPatterns$7 = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](è|r|n|r|t)? trimestre/i
};
var parseQuarterPatterns$7 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$7 = {
  narrow: /^(GN|FB|MÇ|AB|MG|JN|JL|AG|ST|OC|NV|DS)/i,
  abbreviated: /^(gen.|febr.|març|abr.|maig|juny|jul.|ag.|set.|oct.|nov.|des.)/i,
  wide: /^(gener|febrer|març|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre)/i
};
var parseMonthPatterns$7 = {
  narrow: [/^GN/i, /^FB/i, /^MÇ/i, /^AB/i, /^MG/i, /^JN/i, /^JL/i, /^AG/i, /^ST/i, /^OC/i, /^NV/i, /^DS/i],
  abbreviated: [/^gen./i, /^febr./i, /^març/i, /^abr./i, /^maig/i, /^juny/i, /^jul./i, /^ag./i, /^set./i, /^oct./i, /^nov./i, /^des./i],
  wide: [/^gener/i, /^febrer/i, /^març/i, /^abril/i, /^maig/i, /^juny/i, /^juliol/i, /^agost/i, /^setembre/i, /^octubre/i, /^novembre/i, /^desembre/i]
};
var matchDayPatterns$7 = {
  narrow: /^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
  short: /^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
  abbreviated: /^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
  wide: /^(diumenge|dilluns|dimarts|dimecres|dijous|divendres|dissabte)/i
};
var parseDayPatterns$7 = {
  narrow: [/^dg./i, /^dl./i, /^dt./i, /^dm./i, /^dj./i, /^dv./i, /^ds./i],
  abbreviated: [/^dg./i, /^dl./i, /^dt./i, /^dm./i, /^dj./i, /^dv./i, /^ds./i],
  wide: [/^diumenge/i, /^dilluns/i, /^dimarts/i, /^dimecres/i, /^dijous/i, /^divendres/i, /^disssabte/i]
};
var matchDayPeriodPatterns$7 = {
  narrow: /^(a|p|mn|md|(del|de la) (matí|tarda|vespre|nit))/i,
  abbreviated: /^([ap]\.?\s?m\.?|mitjanit|migdia|(del|de la) (matí|tarda|vespre|nit))/i,
  wide: /^(ante meridiem|post meridiem|mitjanit|migdia|(del|de la) (matí|tarda|vespre|nit))/i
};
var parseDayPeriodPatterns$7 = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mitjanit/i,
    noon: /^migdia/i,
    morning: /matí/i,
    afternoon: /tarda/i,
    evening: /vespre/i,
    night: /nit/i
  }
};
var match$7 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$7,
    parsePattern: parseOrdinalNumberPattern$7,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$7,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$7,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$7,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$7,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$7,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$7,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$7,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$7,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$7,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$7,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Catalan locale.
 * @language Catalan
 * @iso-639-2 cat
 * @author Guillermo Grau [@guigrpa]{@link https://github.com/guigrpa}
 * @author Alex Vizcaino [@avizcaino]{@link https://github.com/avizcaino}
 */

var locale$7 = {
  code: 'ca',
  formatDistance: formatDistance$7,
  formatLong: formatLong$7,
  formatRelative: formatRelative$7,
  localize: localize$7,
  match: match$7,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};
 // throw new Error('ca locale is currently unavailable. Please check the progress of converting this locale to v2.0.0 in this issue on Github: TBA')

var formatDistanceLocale$8 = {
  lessThanXSeconds: {
    one: {
      regular: 'méně než vteřina',
      past: 'před méně než vteřinou',
      future: 'za méně než vteřinu'
    },
    few: {
      regular: 'méně než {{count}} vteřiny',
      past: 'před méně než {{count}} vteřinami',
      future: 'za méně než {{count}} vteřiny'
    },
    many: {
      regular: 'méně než {{count}} vteřin',
      past: 'před méně než {{count}} vteřinami',
      future: 'za méně než {{count}} vteřin'
    }
  },
  xSeconds: {
    one: {
      regular: 'vteřina',
      past: 'před vteřinou',
      future: 'za vteřinu'
    },
    few: {
      regular: '{{count}} vteřiny',
      past: 'před {{count}} vteřinami',
      future: 'za {{count}} vteřiny'
    },
    many: {
      regular: '{{count}} vteřin',
      past: 'před {{count}} vteřinami',
      future: 'za {{count}} vteřin'
    }
  },
  halfAMinute: {
    other: {
      regular: 'půl minuty',
      past: 'před půl minutou',
      future: 'za půl minuty'
    }
  },
  lessThanXMinutes: {
    one: {
      regular: 'méně než minuta',
      past: 'před méně než minutou',
      future: 'za méně než minutu'
    },
    few: {
      regular: 'méně než {{count}} minuty',
      past: 'před méně než {{count}} minutami',
      future: 'za méně než {{count}} minuty'
    },
    many: {
      regular: 'méně než {{count}} minut',
      past: 'před méně než {{count}} minutami',
      future: 'za méně než {{count}} minut'
    }
  },
  xMinutes: {
    one: {
      regular: 'minuta',
      past: 'před minutou',
      future: 'za minutu'
    },
    few: {
      regular: '{{count}} minuty',
      past: 'před {{count}} minutami',
      future: 'za {{count}} minuty'
    },
    many: {
      regular: '{{count}} minut',
      past: 'před {{count}} minutami',
      future: 'za {{count}} minut'
    }
  },
  aboutXHours: {
    one: {
      regular: 'přibližně hodina',
      past: 'přibližně před hodinou',
      future: 'přibližně za hodinu'
    },
    few: {
      regular: 'přibližně {{count}} hodiny',
      past: 'přibližně před {{count}} hodinami',
      future: 'přibližně za {{count}} hodiny'
    },
    many: {
      regular: 'přibližně {{count}} hodin',
      past: 'přibližně před {{count}} hodinami',
      future: 'přibližně za {{count}} hodin'
    }
  },
  xHours: {
    one: {
      regular: 'hodina',
      past: 'před hodinou',
      future: 'za hodinu'
    },
    few: {
      regular: '{{count}} hodiny',
      past: 'před {{count}} hodinami',
      future: 'za {{count}} hodiny'
    },
    many: {
      regular: '{{count}} hodin',
      past: 'před {{count}} hodinami',
      future: 'za {{count}} hodin'
    }
  },
  xDays: {
    one: {
      regular: 'den',
      past: 'před dnem',
      future: 'za den'
    },
    few: {
      regular: '{{count}} dni',
      past: 'před {{count}} dny',
      future: 'za {{count}} dny'
    },
    many: {
      regular: '{{count}} dní',
      past: 'před {{count}} dny',
      future: 'za {{count}} dní'
    }
  },
  aboutXMonths: {
    one: {
      regular: 'přibližně měsíc',
      past: 'přibližně před měsícem',
      future: 'přibližně za měsíc'
    },
    few: {
      regular: 'přibližně {{count}} měsíce',
      past: 'přibližně před {{count}} měsíci',
      future: 'přibližně za {{count}} měsíce'
    },
    many: {
      regular: 'přibližně {{count}} měsíců',
      past: 'přibližně před {{count}} měsíci',
      future: 'přibližně za {{count}} měsíců'
    }
  },
  xMonths: {
    one: {
      regular: 'měsíc',
      past: 'před měsícem',
      future: 'za měsíc'
    },
    few: {
      regular: '{{count}} měsíce',
      past: 'před {{count}} měsíci',
      future: 'za {{count}} měsíce'
    },
    many: {
      regular: '{{count}} měsíců',
      past: 'před {{count}} měsíci',
      future: 'za {{count}} měsíců'
    }
  },
  aboutXYears: {
    one: {
      regular: 'přibližně rok',
      past: 'přibližně před rokem',
      future: 'přibližně za rok'
    },
    few: {
      regular: 'přibližně {{count}} roky',
      past: 'přibližně před {{count}} roky',
      future: 'přibližně za {{count}} roky'
    },
    many: {
      regular: 'přibližně {{count}} roků',
      past: 'přibližně před {{count}} roky',
      future: 'přibližně za {{count}} roků'
    }
  },
  xYears: {
    one: {
      regular: 'rok',
      past: 'před rokem',
      future: 'za rok'
    },
    few: {
      regular: '{{count}} roky',
      past: 'před {{count}} roky',
      future: 'za {{count}} roky'
    },
    many: {
      regular: '{{count}} roků',
      past: 'před {{count}} roky',
      future: 'za {{count}} roků'
    }
  },
  overXYears: {
    one: {
      regular: 'více než rok',
      past: 'před více než rokem',
      future: 'za více než rok'
    },
    few: {
      regular: 'více než {{count}} roky',
      past: 'před více než {{count}} roky',
      future: 'za více než {{count}} roky'
    },
    many: {
      regular: 'více než {{count}} roků',
      past: 'před více než {{count}} roky',
      future: 'za více než {{count}} roků'
    }
  },
  almostXYears: {
    one: {
      regular: 'skoro rok',
      past: 'skoro před rokem',
      future: 'skoro za rok'
    },
    few: {
      regular: 'skoro {{count}} roky',
      past: 'skoro před {{count}} roky',
      future: 'skoro za {{count}} roky'
    },
    many: {
      regular: 'skoro {{count}} roků',
      past: 'skoro před {{count}} roky',
      future: 'skoro za {{count}} roků'
    }
  }
};
function formatDistance$8(token, count, options) {
  options = options || {};
  var scheme = formatDistanceLocale$8[token]; // cs pluralization

  var pluralToken;

  if (typeof scheme.other === 'object') {
    pluralToken = 'other';
  } else if (count === 1) {
    pluralToken = 'one';
  } else if (count > 1 && count < 5 || count === 0) {
    pluralToken = 'few';
  } else {
    pluralToken = 'many';
  } // times


  var suffixExist = options.addSuffix === true;
  var comparison = options.comparison;
  var timeToken;

  if (suffixExist && comparison === -1) {
    timeToken = 'past';
  } else if (suffixExist && comparison === 1) {
    timeToken = 'future';
  } else {
    timeToken = 'regular';
  }

  return scheme[pluralToken][timeToken].replace('{{count}}', count);
}

var dateFormats$8 = {
  full: 'EEEE, d. MMMM yyyy',
  long: 'd. MMMM yyyy',
  medium: 'd.M.yyyy',
  short: 'd.M.yy'
};
var timeFormats$8 = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$8 = {
  full: "{{date}} 'v' {{time}}",
  long: "{{date}} 'v' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$8 = {
  date: buildFormatLongFn({
    formats: dateFormats$8,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$8,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$8,
    defaultWidth: 'full'
  })
};

var accusativeWeekdays$1 = ['neděli', 'pondělí', 'úterý', 'středu', 'čtvrtek', 'pátek', 'sobotu'];
var formatRelativeLocale$8 = {
  lastWeek: "'poslední' eeee 've' p",
  yesterday: "'včera v' p",
  today: "'dnes v' p",
  tomorrow: "'zítra v' p",
  nextWeek: function (date, _baseDate, _options) {
    var day = date.getUTCDay();
    return "'v " + accusativeWeekdays$1[day] + " o' p";
  },
  other: 'P'
};
function formatRelative$8(token, date, baseDate, options) {
  var format = formatRelativeLocale$8[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$8 = {
  narrow: ['př. n. l.', 'n. l.'],
  abbreviated: ['př. n. l.', 'n. l.'],
  wide: ['před naším letopočtem', 'našeho letopočtu']
};
var quarterValues$8 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1. čtvrtletí', '2. čtvrtletí', '3. čtvrtletí', '4. čtvrtletí'],
  wide: ['1. čtvrtletí', '2. čtvrtletí', '3. čtvrtletí', '4. čtvrtletí']
};
var monthValues$8 = {
  narrow: ['L', 'Ú', 'B', 'D', 'K', 'Č', 'Č', 'S', 'Z', 'Ř', 'L', 'P'],
  abbreviated: ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'],
  wide: ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
};
var formattingMonthValues$1 = {
  narrow: ['L', 'Ú', 'B', 'D', 'K', 'Č', 'Č', 'S', 'Z', 'Ř', 'L', 'P'],
  abbreviated: ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'],
  wide: ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']
};
var dayValues$8 = {
  narrow: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
  short: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
  abbreviated: ['ned', 'pon', 'úte', 'stř', 'čtv', 'pát', 'sob'],
  wide: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']
};
var dayPeriodValues$8 = {
  narrow: {
    am: 'dop.',
    pm: 'odp.',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  },
  abbreviated: {
    am: 'dop.',
    pm: 'odp.',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  },
  wide: {
    am: 'dopoledne',
    pm: 'odpoledne',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  }
};
var formattingDayPeriodValues$7 = {
  narrow: {
    am: 'dop.',
    pm: 'odp.',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  },
  abbreviated: {
    am: 'dop.',
    pm: 'odp.',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  },
  wide: {
    am: 'dopoledne',
    pm: 'odpoledne',
    midnight: 'půlnoc',
    noon: 'poledne',
    morning: 'ráno',
    afternoon: 'odpoledne',
    evening: 'večer',
    night: 'noc'
  }
};

function ordinalNumber$8(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$8 = {
  ordinalNumber: ordinalNumber$8,
  era: buildLocalizeFn({
    values: eraValues$8,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$8,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$8,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$1,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$8,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$8,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$7,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$8 = /^(\d+)\.?/i;
var parseOrdinalNumberPattern$8 = /\d+/i;
var matchEraPatterns$8 = {
  narrow: /^(p[řr]ed Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
  abbreviated: /^(pe[řr]ed Kr\.|pe[řr]ed n\. l\.|po Kr\.|n\. l\.)/i,
  wide: /^(p[řr]ed Kristem|pred na[šs][íi]m letopo[čc]tem|po Kristu|na[šs]eho letopo[čc]tu)/i
};
var parseEraPatterns$8 = {
  any: [/^p[řr]/i, /^(po|n)/i]
};
var matchQuarterPatterns$8 = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]\. [čc]tvrtlet[íi]/i,
  wide: /^[1234]\. [čc]tvrtlet[íi]/i
};
var parseQuarterPatterns$8 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$8 = {
  narrow: /^[lúubdkčcszřrlp]/i,
  abbreviated: /^(led|[úu]no|b[řr]e|dub|kv[ěe]|[čc]vn|[čc]vc|srp|z[áa][řr]|[řr][íi]j|lis|pro)/i,
  wide: /^(leden|ledna|[úu]nora?|b[řr]ezen|b[řr]ezna|duben|dubna|kv[ěe]ten|kv[ěe]tna|[čc]erven(ec|ce)?|[čc]ervna|srpen|srpna|z[áa][řr][íi]|[řr][íi]jen|[řr][íi]jna|listopad(a|u)?|prosinec|prosince)/i
};
var parseMonthPatterns$8 = {
  narrow: [/^l/i, /^[úu]/i, /^b/i, /^d/i, /^k/i, /^[čc]/i, /^[čc]/i, /^s/i, /^z/i, /^[řr]/i, /^l/i, /^p/i],
  any: [/^led/i, /^[úu]n/i, /^b[řr]e/i, /^dub/i, /^kv[ěe]/i, /^[čc]vn|[čc]erven(?!\w)|[čc]ervna/i, /^[čc]vc|[čc]erven(ec|ce)/i, /^srp/i, /^z[áa][řr]/i, /^[řr][íi]j/i, /^lis/i, /^pro/i]
};
var matchDayPatterns$8 = {
  narrow: /^[npuúsčps]/i,
  short: /^(ne|po|[úu]t|st|[čc]t|p[áa]|so)/i,
  abbreviated: /^(ne|po|[úu]t|st|[čc]t|p[áa]|so)/i,
  wide: /^(ned[ěe]le|pond[ěe]l[íi]|[úu]ter[ýy]|st[řr]eda|[čc]tvrtek|p[áa]tek|sobota)/i
};
var parseDayPatterns$8 = {
  narrow: [/^n/i, /^p/i, /^[úu]/i, /^s/i, /^[čc]/i, /^p/i, /^s/i],
  any: [/^ne/i, /^po/i, /^ut/i, /^st/i, /^[čc]t/i, /^p/i, /^so/i]
};
var matchDayPeriodPatterns$8 = {
  any: /^dopoledne|dop\.?|odpoledne|odp\.?|půlnoc|poledne|r[áa]no|odpoledne|ve[čc]er|(v )?noci/i
};
var parseDayPeriodPatterns$8 = {
  any: {
    am: /^dop/i,
    pm: /^odp/i,
    midnight: /^p[ůu]lnoc/i,
    noon: /^poledne/i,
    morning: /r[áa]no/i,
    afternoon: /odpoledne/i,
    evening: /ve[čc]er/i,
    night: /noc/i
  }
};
var match$8 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$8,
    parsePattern: parseOrdinalNumberPattern$8,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$8,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$8,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$8,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$8,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$8,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$8,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$8,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$8,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$8,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$8,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Czech locale.
 * @language Czech
 * @iso-639-2 ces
 * @author David Rus [@davidrus]{@link https://github.com/davidrus}
 * @author Pavel Hrách [@SilenY]{@link https://github.com/SilenY}
 * @author Jozef Bíroš [@JozefBiros]{@link https://github.com/JozefBiros}
 */

var locale$8 = {
  code: 'cs',
  formatDistance: formatDistance$8,
  formatLong: formatLong$8,
  formatRelative: formatRelative$8,
  localize: localize$8,
  match: match$8,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$9 = {
  lessThanXSeconds: {
    one: 'llai na eiliad',
    other: 'llai na {{count}} eiliad'
  },
  xSeconds: {
    one: '1 eiliad',
    other: '{{count}} eiliad'
  },
  halfAMinute: 'hanner munud',
  lessThanXMinutes: {
    one: 'llai na munud',
    two: 'llai na 2 funud',
    other: 'llai na {{count}} munud'
  },
  xMinutes: {
    one: '1 funud',
    two: '2 funud',
    other: '{{count}} munud'
  },
  aboutXHours: {
    one: 'tua 1 awr',
    other: 'tua {{count}} awr'
  },
  xHours: {
    one: '1 awr',
    other: '{{count}} awr'
  },
  xDays: {
    one: '1 diwrnod',
    other: '{{count}} diwrnod'
  },
  aboutXMonths: {
    one: 'tua 1 mis',
    two: 'tua 2 fis',
    other: 'tua {{count}} mis'
  },
  xMonths: {
    one: '1 mis',
    two: '2 fis',
    other: '{{count}} mis'
  },
  aboutXYears: {
    one: 'tua 1 flwyddyn',
    two: 'tua 2 flynedd',
    other: 'tua {{count}} mlynedd'
  },
  xYears: {
    one: '1 flwyddyn',
    two: '2 flynedd',
    other: '{{count}} mlynedd'
  },
  overXYears: {
    one: 'dros 1 flwyddyn',
    two: 'dros 2 flynedd',
    other: 'dros {{count}} mlynedd'
  },
  almostXYears: {
    one: 'bron 1 flwyddyn',
    two: 'bron 2 flynedd',
    other: 'bron {{count}} mlynedd'
  }
};
function formatDistance$9(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$9[token] === 'string') {
    result = formatDistanceLocale$9[token];
  } else if (count === 1) {
    result = formatDistanceLocale$9[token].one;
  } else if (count === 2 && !!formatDistanceLocale$9[token].two) {
    result = formatDistanceLocale$9[token].two;
  } else {
    result = formatDistanceLocale$9[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'mewn ' + result;
    } else {
      return result + ' yn ôl';
    }
  }

  return result;
}

var dateFormats$9 = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'dd/MM/yyyy'
};
var timeFormats$9 = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$9 = {
  full: "{{date}} 'am' {{time}}",
  long: "{{date}} 'am' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$9 = {
  date: buildFormatLongFn({
    formats: dateFormats$9,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$9,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$9,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$9 = {
  lastWeek: "eeee 'diwethaf am' p",
  yesterday: "'ddoe am' p",
  today: "'heddiw am' p",
  tomorrow: "'yfory am' p",
  nextWeek: "eeee 'am' p",
  other: 'P'
};
function formatRelative$9(token, _date, _baseDate, _options) {
  return formatRelativeLocale$9[token];
}

var eraValues$9 = {
  narrow: ['C', 'O'],
  abbreviated: ['CC', 'OC'],
  wide: ['Cyn Crist', 'Ar ôl Crist']
};
var quarterValues$9 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Ch1', 'Ch2', 'Ch3', 'Ch4'],
  wide: ['Chwarter 1af', '2ail chwarter', '3ydd chwarter', '4ydd chwarter'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$9 = {
  narrow: ['I', 'Ch', 'Ma', 'E', 'Mi', 'Me', 'G', 'A', 'Md', 'H', 'T', 'Rh'],
  abbreviated: ['Ion', 'Chwe', 'Maw', 'Ebr', 'Mai', 'Meh', 'Gor', 'Aws', 'Med', 'Hyd', 'Tach', 'Rhag'],
  wide: ['Ionawr', 'Chwefror', 'Mawrth', 'Ebrill', 'Mai', 'Mehefin', 'Gorffennaf', 'Awst', 'Medi', 'Hydref', 'Tachwedd', 'Rhagfyr']
};
var dayValues$9 = {
  narrow: ['S', 'Ll', 'M', 'M', 'I', 'G', 'S'],
  short: ['Su', 'Ll', 'Ma', 'Me', 'Ia', 'Gw', 'Sa'],
  abbreviated: ['Sul', 'Llun', 'Maw', 'Mer', 'Iau', 'Gwe', 'Sad'],
  wide: ['dydd Sul', 'dydd Llun', 'dydd Mawrth', 'dydd Mercher', 'dydd Iau', 'dydd Gwener', 'dydd Sadwrn']
};
var dayPeriodValues$9 = {
  narrow: {
    am: 'b',
    pm: 'h',
    midnight: 'hn',
    noon: 'hd',
    morning: 'bore',
    afternoon: 'prynhawn',
    evening: "gyda'r nos",
    night: 'nos'
  },
  abbreviated: {
    am: 'yb',
    pm: 'yh',
    midnight: 'hanner nos',
    noon: 'hanner dydd',
    morning: 'bore',
    afternoon: 'prynhawn',
    evening: "gyda'r nos",
    night: 'nos'
  },
  wide: {
    am: 'y.b.',
    pm: 'y.h.',
    midnight: 'hanner nos',
    noon: 'hanner dydd',
    morning: 'bore',
    afternoon: 'prynhawn',
    evening: "gyda'r nos",
    night: 'nos'
  }
};
var formattingDayPeriodValues$8 = {
  narrow: {
    am: 'b',
    pm: 'h',
    midnight: 'hn',
    noon: 'hd',
    morning: 'yn y bore',
    afternoon: 'yn y prynhawn',
    evening: "gyda'r nos",
    night: 'yn y nos'
  },
  abbreviated: {
    am: 'yb',
    pm: 'yh',
    midnight: 'hanner nos',
    noon: 'hanner dydd',
    morning: 'yn y bore',
    afternoon: 'yn y prynhawn',
    evening: "gyda'r nos",
    night: 'yn y nos'
  },
  wide: {
    am: 'y.b.',
    pm: 'y.h.',
    midnight: 'hanner nos',
    noon: 'hanner dydd',
    morning: 'yn y bore',
    afternoon: 'yn y prynhawn',
    evening: "gyda'r nos",
    night: 'yn y nos'
  }
};

function ordinalNumber$9(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);

  if (number < 20) {
    switch (number) {
      case 0:
        return number + 'fed';

      case 1:
        return number + 'af';

      case 2:
        return number + 'ail';

      case 3:
      case 4:
        return number + 'ydd';

      case 5:
      case 6:
        return number + 'ed';

      case 7:
      case 8:
      case 9:
      case 10:
      case 12:
      case 15:
      case 18:
        return number + 'fed';

      case 11:
      case 13:
      case 14:
      case 16:
      case 17:
      case 19:
        return number + 'eg';
    }
  } else if (number >= 50 && number <= 60 || number === 80 || number >= 100) {
    return number + 'fed';
  }

  return number + 'ain';
}

var localize$9 = {
  ordinalNumber: ordinalNumber$9,
  era: buildLocalizeFn({
    values: eraValues$9,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$9,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$9,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$9,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$9,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$8,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$9 = /^(\d+)(af|ail|ydd|ed|fed|eg|ain)?/i;
var parseOrdinalNumberPattern$9 = /\d+/i;
var matchEraPatterns$9 = {
  narrow: /^(c|o)/i,
  abbreviated: /^(c\.?\s?c\.?|o\.?\s?c\.?)/i,
  wide: /^(cyn christ|ar ôl crist|ar ol crist)/i
};
var parseEraPatterns$9 = {
  wide: [/^c/i, /^(ar ôl crist|ar ol crist)/i],
  any: [/^c/i, /^o/i]
};
var matchQuarterPatterns$9 = {
  narrow: /^[1234]/i,
  abbreviated: /^ch[1234]/i,
  wide: /^(chwarter 1af)|([234](ail|ydd)? chwarter)/i
};
var parseQuarterPatterns$9 = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$9 = {
  narrow: /^(i|ch|m|e|g|a|h|t|rh)/i,
  abbreviated: /^(ion|chwe|maw|ebr|mai|meh|gor|aws|med|hyd|tach|rhag)/i,
  wide: /^(ionawr|chwefror|mawrth|ebrill|mai|mehefin|gorffennaf|awst|medi|hydref|tachwedd|rhagfyr)/i
};
var parseMonthPatterns$9 = {
  narrow: [/^i/i, /^ch/i, /^m/i, /^e/i, /^m/i, /^m/i, /^g/i, /^a/i, /^m/i, /^h/i, /^t/i, /^rh/i],
  any: [/^io/i, /^ch/i, /^maw/i, /^e/i, /^mai/i, /^meh/i, /^g/i, /^a/i, /^med/i, /^h/i, /^t/i, /^rh/i]
};
var matchDayPatterns$9 = {
  narrow: /^(s|ll|m|i|g)/i,
  short: /^(su|ll|ma|me|ia|gw|sa)/i,
  abbreviated: /^(sul|llun|maw|mer|iau|gwe|sad)/i,
  wide: /^dydd (sul|llun|mawrth|mercher|iau|gwener|sadwrn)/i
};
var parseDayPatterns$9 = {
  narrow: [/^s/i, /^ll/i, /^m/i, /^m/i, /^i/i, /^g/i, /^s/i],
  wide: [/^dydd su/i, /^dydd ll/i, /^dydd ma/i, /^dydd me/i, /^dydd i/i, /^dydd g/i, /^dydd sa/i],
  any: [/^su/i, /^ll/i, /^ma/i, /^me/i, /^i/i, /^g/i, /^sa/i]
};
var matchDayPeriodPatterns$9 = {
  narrow: /^(b|h|hn|hd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i,
  any: /^(y\.?\s?[bh]\.?|hanner nos|hanner dydd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i
};
var parseDayPeriodPatterns$9 = {
  any: {
    am: /^b|(y\.?\s?b\.?)/i,
    pm: /^h|(y\.?\s?h\.?)|(yr hwyr)/i,
    midnight: /^hn|hanner nos/i,
    noon: /^hd|hanner dydd/i,
    morning: /bore/i,
    afternoon: /prynhawn/i,
    evening: /^gyda'r nos$/i,
    night: /blah/i
  }
};
var match$9 = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$9,
    parsePattern: parseOrdinalNumberPattern$9,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$9,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$9,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$9,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$9,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$9,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$9,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$9,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$9,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$9,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$9,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Welsh locale.
 * @language Welsh
 * @iso-639-2 cym
 * @author Elwyn Malethan [@elmomalmo]{@link https://github.com/elmomalmo}
 */

var locale$9 = {
  code: 'cy',
  formatDistance: formatDistance$9,
  formatLong: formatLong$9,
  formatRelative: formatRelative$9,
  localize: localize$9,
  match: match$9,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$a = {
  lessThanXSeconds: {
    one: 'mindre end ét sekund',
    other: 'mindre end {{count}} sekunder'
  },
  xSeconds: {
    one: '1 sekund',
    other: '{{count}} sekunder'
  },
  halfAMinute: 'ét halvt minut',
  lessThanXMinutes: {
    one: 'mindre end ét minut',
    other: 'mindre end {{count}} minutter'
  },
  xMinutes: {
    one: '1 minut',
    other: '{{count}} minutter'
  },
  aboutXHours: {
    one: 'cirka 1 time',
    other: 'cirka {{count}} timer'
  },
  xHours: {
    one: '1 time',
    other: '{{count}} timer'
  },
  xDays: {
    one: '1 dag',
    other: '{{count}} dage'
  },
  aboutXMonths: {
    one: 'cirka 1 måned',
    other: 'cirka {{count}} måneder'
  },
  xMonths: {
    one: '1 måned',
    other: '{{count}} måneder'
  },
  aboutXYears: {
    one: 'cirka 1 år',
    other: 'cirka {{count}} år'
  },
  xYears: {
    one: '1 år',
    other: '{{count}} år'
  },
  overXYears: {
    one: 'over 1 år',
    other: 'over {{count}} år'
  },
  almostXYears: {
    one: 'næsten 1 år',
    other: 'næsten {{count}} år'
  }
};
function formatDistance$a(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$a[token] === 'string') {
    result = formatDistanceLocale$a[token];
  } else if (count === 1) {
    result = formatDistanceLocale$a[token].one;
  } else {
    result = formatDistanceLocale$a[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' siden';
    }
  }

  return result;
}

var dateFormats$a = {
  full: "EEEE 'den' d. MMMM y",
  long: 'd. MMMM y',
  medium: 'd. MMM y',
  short: 'dd/MM/y'
};
var timeFormats$a = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$a = {
  full: "{{date}} 'kl'. {{time}}",
  long: "{{date}} 'kl'. {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$a = {
  date: buildFormatLongFn({
    formats: dateFormats$a,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$a,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$a,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$a = {
  lastWeek: "'sidste' eeee 'kl.' p",
  yesterday: "'i går kl.' p",
  today: "'i dag kl.' p",
  tomorrow: "'i morgen kl.' p",
  nextWeek: "'på' eeee 'kl.' p",
  other: 'P'
};
function formatRelative$a(token, _date, _baseDate, _options) {
  return formatRelativeLocale$a[token];
}

var eraValues$a = {
  narrow: ['fvt', 'vt'],
  abbreviated: ['f.v.t.', 'v.t.'],
  wide: ['før vesterlandsk tidsregning', 'vesterlandsk tidsregning']
};
var quarterValues$a = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1. kvt.', '2. kvt.', '3. kvt.', '4. kvt.'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var monthValues$a = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  wide: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'] // Note that 'Days - abbreviated - Formatting' has periods at the end.
  // https://www.unicode.org/cldr/charts/32/summary/da.html#1760
  // This makes grammatical sense in danish, as most abbreviations have periods.

};
var dayValues$a = {
  narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  short: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'],
  abbreviated: ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'],
  wide: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag']
};
var dayPeriodValues$a = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'morgen',
    afternoon: 'eftermiddag',
    evening: 'aften',
    night: 'nat'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'morgen',
    afternoon: 'eftermiddag',
    evening: 'aften',
    night: 'nat'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'morgen',
    afternoon: 'eftermiddag',
    evening: 'aften',
    night: 'nat'
  }
};
var formattingDayPeriodValues$9 = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'om morgenen',
    afternoon: 'om eftermiddagen',
    evening: 'om aftenen',
    night: 'om natten'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'om morgenen',
    afternoon: 'om eftermiddagen',
    evening: 'om aftenen',
    night: 'om natten'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnat',
    noon: 'middag',
    morning: 'om morgenen',
    afternoon: 'om eftermiddagen',
    evening: 'om aftenen',
    night: 'om natten'
  }
};

function ordinalNumber$a(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$a = {
  ordinalNumber: ordinalNumber$a,
  era: buildLocalizeFn({
    values: eraValues$a,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$a,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$a,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$a,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$a,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$9,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$a = /^(\d+)(\.)?/i;
var parseOrdinalNumberPattern$a = /\d+/i;
var matchEraPatterns$a = {
  narrow: /^(fKr|fvt|eKr|vt)/i,
  abbreviated: /^(f\.Kr\.?|f\.v\.t\.?|e\.Kr\.?|v\.t\.)/i,
  wide: /^(f.Kr.|før vesterlandsk tidsregning|e.Kr.|vesterlandsk tidsregning)/i
};
var parseEraPatterns$a = {
  any: [/^f/i, /^(v|e)/i]
};
var matchQuarterPatterns$a = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]. kvt\./i,
  wide: /^[1234]\.? kvartal/i
};
var parseQuarterPatterns$a = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$a = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/i,
  wide: /^(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)/i
};
var parseMonthPatterns$a = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$a = {
  narrow: /^[smtofl]/i,
  short: /^(søn.|man.|tir.|ons.|tor.|fre.|lør.)/i,
  abbreviated: /^(søn|man|tir|ons|tor|fre|lør)/i,
  wide: /^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i
};
var parseDayPatterns$a = {
  narrow: [/^s/i, /^m/i, /^t/i, /^o/i, /^t/i, /^f/i, /^l/i],
  any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i]
};
var matchDayPeriodPatterns$a = {
  narrow: /^(a|p|midnat|middag|(om) (morgenen|eftermiddagen|aftenen|natten))/i,
  any: /^([ap]\.?\s?m\.?|midnat|middag|(om) (morgenen|eftermiddagen|aftenen|natten))/i
};
var parseDayPeriodPatterns$a = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /midnat/i,
    noon: /middag/i,
    morning: /morgen/i,
    afternoon: /eftermiddag/i,
    evening: /aften/i,
    night: /nat/i
  }
};
var match$a = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$a,
    parsePattern: parseOrdinalNumberPattern$a,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$a,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$a,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$a,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$a,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$a,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$a,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$a,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$a,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$a,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$a,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Danish locale.
 * @language Danish
 * @iso-639-2 dan
 * @author Mathias Wøbbe [@MathiasKandelborg]{@link https://github.com/MathiasKandelborg}
 * @author Anders B. Hansen [@Andersbiha]{@link https://github.com/Andersbiha}
 * @author [@kgram]{@link https://github.com/kgram}
 * @author [@stefanbugge]{@link https://github.com/stefanbugge}
 */

var locale$a = {
  code: 'da',
  formatDistance: formatDistance$a,
  formatLong: formatLong$a,
  formatRelative: formatRelative$a,
  localize: localize$a,
  match: match$a,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$b = {
  lessThanXSeconds: {
    standalone: {
      one: 'weniger als eine Sekunde',
      other: 'weniger als {{count}} Sekunden'
    },
    withPreposition: {
      one: 'weniger als einer Sekunde',
      other: 'weniger als {{count}} Sekunden'
    }
  },
  xSeconds: {
    standalone: {
      one: 'eine Sekunde',
      other: '{{count}} Sekunden'
    },
    withPreposition: {
      one: 'einer Sekunde',
      other: '{{count}} Sekunden'
    }
  },
  halfAMinute: {
    standalone: 'eine halbe Minute',
    withPreposition: 'einer halben Minute'
  },
  lessThanXMinutes: {
    standalone: {
      one: 'weniger als eine Minute',
      other: 'weniger als {{count}} Minuten'
    },
    withPreposition: {
      one: 'weniger als einer Minute',
      other: 'weniger als {{count}} Minuten'
    }
  },
  xMinutes: {
    standalone: {
      one: 'eine Minute',
      other: '{{count}} Minuten'
    },
    withPreposition: {
      one: 'einer Minute',
      other: '{{count}} Minuten'
    }
  },
  aboutXHours: {
    standalone: {
      one: 'etwa eine Stunde',
      other: 'etwa {{count}} Stunden'
    },
    withPreposition: {
      one: 'etwa einer Stunde',
      other: 'etwa {{count}} Stunden'
    }
  },
  xHours: {
    standalone: {
      one: 'eine Stunde',
      other: '{{count}} Stunden'
    },
    withPreposition: {
      one: 'einer Stunde',
      other: '{{count}} Stunden'
    }
  },
  xDays: {
    standalone: {
      one: 'ein Tag',
      other: '{{count}} Tage'
    },
    withPreposition: {
      one: 'einem Tag',
      other: '{{count}} Tagen'
    }
  },
  aboutXMonths: {
    standalone: {
      one: 'etwa ein Monat',
      other: 'etwa {{count}} Monate'
    },
    withPreposition: {
      one: 'etwa einem Monat',
      other: 'etwa {{count}} Monaten'
    }
  },
  xMonths: {
    standalone: {
      one: 'ein Monat',
      other: '{{count}} Monate'
    },
    withPreposition: {
      one: 'einem Monat',
      other: '{{count}} Monaten'
    }
  },
  aboutXYears: {
    standalone: {
      one: 'etwa ein Jahr',
      other: 'etwa {{count}} Jahre'
    },
    withPreposition: {
      one: 'etwa einem Jahr',
      other: 'etwa {{count}} Jahren'
    }
  },
  xYears: {
    standalone: {
      one: 'ein Jahr',
      other: '{{count}} Jahre'
    },
    withPreposition: {
      one: 'einem Jahr',
      other: '{{count}} Jahren'
    }
  },
  overXYears: {
    standalone: {
      one: 'mehr als ein Jahr',
      other: 'mehr als {{count}} Jahre'
    },
    withPreposition: {
      one: 'mehr als einem Jahr',
      other: 'mehr als {{count}} Jahren'
    }
  },
  almostXYears: {
    standalone: {
      one: 'fast ein Jahr',
      other: 'fast {{count}} Jahre'
    },
    withPreposition: {
      one: 'fast einem Jahr',
      other: 'fast {{count}} Jahren'
    }
  }
};
function formatDistance$b(token, count, options) {
  options = options || {};
  var usageGroup = options.addSuffix ? formatDistanceLocale$b[token].withPreposition : formatDistanceLocale$b[token].standalone;
  var result;

  if (typeof usageGroup === 'string') {
    result = usageGroup;
  } else if (count === 1) {
    result = usageGroup.one;
  } else {
    result = usageGroup.other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'in ' + result;
    } else {
      return 'vor ' + result;
    }
  }

  return result;
}

var dateFormats$b = {
  full: 'EEEE, do MMMM y',
  // Montag, 7. Januar 2018
  long: 'do MMMM y',
  // 7. Januar 2018
  medium: 'do MMM. y',
  // 7. Jan. 2018
  short: 'dd.MM.y' // 07.01.2018

};
var timeFormats$b = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$b = {
  full: "{{date}} 'um' {{time}}",
  long: "{{date}} 'um' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$b = {
  date: buildFormatLongFn({
    formats: dateFormats$b,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$b,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$b,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$b = {
  lastWeek: "'letzten' eeee 'um' p",
  yesterday: "'gestern um' p",
  today: "'heute um' p",
  tomorrow: "'morgen um' p",
  nextWeek: "eeee 'um' p",
  other: 'P'
};
function formatRelative$b(token, _date, _baseDate, _options) {
  return formatRelativeLocale$b[token];
}

var eraValues$b = {
  narrow: ['v.Chr.', 'n.Chr.'],
  abbreviated: ['v.Chr.', 'n.Chr.'],
  wide: ['vor Christus', 'nach Christus']
};
var quarterValues$b = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'] // Note: in German, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$b = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  wide: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
};
var dayValues$b = {
  narrow: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
  short: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  abbreviated: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
  wide: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] // https://www.unicode.org/cldr/charts/32/summary/de.html#1881

};
var dayPeriodValues$b = {
  narrow: {
    am: 'vm.',
    pm: 'nm.',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'Morgen',
    afternoon: 'Nachm.',
    evening: 'Abend',
    night: 'Nacht'
  },
  abbreviated: {
    am: 'vorm.',
    pm: 'nachm.',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'Morgen',
    afternoon: 'Nachmittag',
    evening: 'Abend',
    night: 'Nacht'
  },
  wide: {
    am: 'vormittags',
    pm: 'nachmittags',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'Morgen',
    afternoon: 'Nachmittag',
    evening: 'Abend',
    night: 'Nacht'
  }
};
var formattingDayPeriodValues$a = {
  narrow: {
    am: 'vm.',
    pm: 'nm.',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'morgens',
    afternoon: 'nachm.',
    evening: 'abends',
    night: 'nachts'
  },
  abbreviated: {
    am: 'vorm.',
    pm: 'nachm.',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'morgens',
    afternoon: 'nachmittags',
    evening: 'abends',
    night: 'nachts'
  },
  wide: {
    am: 'vormittags',
    pm: 'nachmittags',
    midnight: 'Mitternacht',
    noon: 'Mittag',
    morning: 'morgens',
    afternoon: 'nachmittags',
    evening: 'abends',
    night: 'nachts'
  }
};

function ordinalNumber$b(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$b = {
  ordinalNumber: ordinalNumber$b,
  era: buildLocalizeFn({
    values: eraValues$b,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$b,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$b,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$b,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$b,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$a,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$b = /^(\d+)(\.)?/i;
var parseOrdinalNumberPattern$b = /\d+/i;
var matchEraPatterns$b = {
  narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
};
var parseEraPatterns$b = {
  any: [/^v/i, /^n/i]
};
var matchQuarterPatterns$b = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? Quartal/i
};
var parseQuarterPatterns$b = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$b = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez)/i,
  wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
};
var parseMonthPatterns$b = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mär/i, /^ap/i, /^mai/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$b = {
  narrow: /^[smdmf]/i,
  short: /^(so|mo|di|mi|do|fr|sa)/i,
  abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
  wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
};
var parseDayPatterns$b = {
  any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns$b = {
  narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
};
var parseDayPeriodPatterns$b = {
  any: {
    am: /^v/i,
    pm: /^n/i,
    midnight: /^Mitte/i,
    noon: /^Mitta/i,
    morning: /morgens/i,
    afternoon: /nachmittags/i,
    // will never be matched. Afternoon is matched by `pm`
    evening: /abends/i,
    night: /nachts/i // will never be matched. Night is matched by `pm`

  }
};
var match$b = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$b,
    parsePattern: parseOrdinalNumberPattern$b,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$b,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$b,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$b,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$b,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$b,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$b,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$b,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$b,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$b,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$b,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary German locale.
 * @language German
 * @iso-639-2 deu
 * @author Thomas Eilmsteiner [@DeMuu]{@link https://github.com/DeMuu}
 * @author Asia [@asia-t]{@link https://github.com/asia-t}
 * @author Van Vuong Ngo [@vanvuongngo]{@link https://github.com/vanvuongngo}
 * @author RomanErnst [@pex]{@link https://github.com/pex}
 * @author Philipp Keck [@Philipp91]{@link https://github.com/Philipp91}
 */

var locale$b = {
  code: 'de',
  formatDistance: formatDistance$b,
  formatLong: formatLong$b,
  formatRelative: formatRelative$b,
  localize: localize$b,
  match: match$b,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$c = {
  lessThanXSeconds: {
    one: 'λιγότερο από ένα δευτερόλεπτο',
    other: 'λιγότερο από {{count}} δευτερόλεπτα'
  },
  xSeconds: {
    one: '1 δευτερόλεπτο',
    other: '{{count}} δευτερόλεπτα'
  },
  halfAMinute: 'μισό λεπτό',
  lessThanXMinutes: {
    one: 'λιγότερο από ένα λεπτό',
    other: 'λιγότερο από {{count}} λεπτά'
  },
  xMinutes: {
    one: '1 λεπτό',
    other: '{{count}} λεπτά'
  },
  aboutXHours: {
    one: 'περίπου 1 ώρα',
    other: 'περίπου {{count}} ώρες'
  },
  xHours: {
    one: '1 ώρα',
    other: '{{count}} ώρες'
  },
  xDays: {
    one: '1 ημέρα',
    other: '{{count}} ημέρες'
  },
  aboutXMonths: {
    one: 'περίπου 1 μήνας',
    other: 'περίπου {{count}} μήνες'
  },
  xMonths: {
    one: '1 μήνας',
    other: '{{count}} μήνες'
  },
  aboutXYears: {
    one: 'περίπου 1 χρόνο',
    other: 'περίπου {{count}} χρόνια'
  },
  xYears: {
    one: '1 χρόνο',
    other: '{{count}} χρόνια'
  },
  overXYears: {
    one: 'πάνω από 1 χρόνο',
    other: 'πάνω από {{count}} χρόνια'
  },
  almostXYears: {
    one: 'περίπου 1 χρόνο',
    other: 'περίπου {{count}} χρόνια'
  }
};
function formatDistance$c(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$c[token] === 'string') {
    result = formatDistanceLocale$c[token];
  } else if (count === 1) {
    result = formatDistanceLocale$c[token].one;
  } else {
    result = formatDistanceLocale$c[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'σε ' + result;
    } else {
      return result + ' πριν';
    }
  }

  return result;
}

var dateFormats$c = {
  full: 'EEEE, d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'd/M/yy'
};
var timeFormats$c = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$c = {
  full: '{{date}} - {{time}}',
  long: '{{date}} - {{time}}',
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$c = {
  date: buildFormatLongFn({
    formats: dateFormats$c,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$c,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$c,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$c = {
  lastWeek: "'την προηγούμενη' eeee 'στις' p",
  yesterday: "'χθες στις' p",
  today: "'σήμερα στις' p",
  tomorrow: "'αύριο στις' p",
  nextWeek: "eeee 'στις' p",
  other: 'P'
};
function formatRelative$c(token, _date, _baseDate, _options) {
  return formatRelativeLocale$c[token];
}

var eraValues$c = {
  narrow: ['πΧ', 'μΧ'],
  abbreviated: ['π.Χ.', 'μ.Χ.'],
  wide: ['προ Χριστού', 'μετά Χριστόν']
};
var quarterValues$c = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Τ1', 'Τ2', 'Τ3', 'Τ4'],
  wide: ['1ο τρίμηνο', '2ο τρίμηνο', '3ο τρίμηνο', '4ο τρίμηνο']
};
var monthValues$c = {
  narrow: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'],
  abbreviated: ['Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'],
  wide: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος']
};
var formattingMonthValues$2 = {
  narrow: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'],
  abbreviated: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
  wide: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
};
var dayValues$c = {
  narrow: ['Κ', 'Δ', 'T', 'Τ', 'Π', 'Π', 'Σ'],
  short: ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πέ', 'Πα', 'Σά'],
  abbreviated: ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'],
  wide: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο']
};
var dayPeriodValues$c = {
  narrow: {
    am: 'πμ',
    pm: 'μμ',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  },
  abbreviated: {
    am: 'π.μ.',
    pm: 'μ.μ.',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  },
  wide: {
    am: 'π.μ.',
    pm: 'μ.μ.',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  }
};

function ordinalNumber$c(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (unit === 'year' || unit === 'month') {
    suffix = 'ος';
  } else if (unit === 'week' || unit === 'dayOfYear' || unit === 'day' || unit === 'hour' || unit === 'date') {
    suffix = 'η';
  } else {
    suffix = 'ο';
  }

  return dirtyNumber + suffix;
}

var localize$c = {
  ordinalNumber: ordinalNumber$c,
  era: buildLocalizeFn({
    values: eraValues$c,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$c,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$c,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$2,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$c,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$c,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$c = /^(\d+)(ος|η|ο)?/i;
var parseOrdinalNumberPattern$c = /\d+/i;
var matchEraPatterns$c = {
  narrow: /^(πΧ|μΧ)/i,
  abbreviated: /^(π\.?\s?χ\.?|π\.?\s?κ\.?\s?χ\.?|μ\.?\s?χ\.?|κ\.?\s?χ\.?)/i,
  wide: /^(προ Χριστο(ύ|υ)|πριν απ(ό|ο) την Κοιν(ή|η) Χρονολογ(ί|ι)α|μετ(ά|α) Χριστ(ό|ο)ν|Κοιν(ή|η) Χρονολογ(ί|ι)α)/i
};
var parseEraPatterns$c = {
  any: [/^π/i, /^(μ|κ)/i]
};
var matchQuarterPatterns$c = {
  narrow: /^[1234]/i,
  abbreviated: /^τ[1234]/i,
  wide: /^[1234]ο? τρ(ί|ι)μηνο/i
};
var parseQuarterPatterns$c = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$c = {
  narrow: /^[ιφμαμιιασονδ]/i,
  abbreviated: /^(ιαν|φεβ|μ[άα]ρ|απρ|μ[άα][ιΐ]|ιο[ύυ]ν|ιο[ύυ]λ|α[ύυ]γ|σεπ|οκτ|νο[έε]|δεκ)/i,
  wide: /^(μ[άα][ιΐ]|α[ύυ]γο[υύ]στ)(ος|ου)|(ιανου[άα]ρ|φεβρου[άα]ρ|μ[άα]ρτ|απρ[ίι]λ|ιο[ύυ]ν|ιο[ύυ]λ|σεπτ[έε]μβρ|οκτ[ώω]βρ|νο[έε]μβρ|δεκ[έε]μβρ)(ιος|ίου)/i
};
var parseMonthPatterns$c = {
  narrow: [/^ι/i, /^φ/i, /^μ/i, /^α/i, /^μ/i, /^ι/i, /^ι/i, /^α/i, /^σ/i, /^ο/i, /^ν/i, /^δ/i],
  any: [/^ια/i, /^φ/i, /^μ[άα]ρ/i, /^απ/i, /^μ[άα][ιΐ]/i, /^ιο[ύυ]ν/i, /^ιο[ύυ]λ/i, /^α[ύυ]/i, /^σ/i, /^ο/i, /^ν/i, /^δ/i]
};
var matchDayPatterns$c = {
  narrow: /^[κδτπσ]/i,
  short: /^(κυ|δε|τρ|τε|π[εέ]|π[αά]|σ[αά])/i,
  abbreviated: /^(κυρ|δευ|τρι|τετ|πεμ|παρ|σαβ)/i,
  wide: /^(κυριακ(ή|η)|δευτ(έ|ε)ρα|τρ(ί|ι)τη|τετ(ά|α)ρτη|π(έ|ε)μπτη|παρασκευ(ή|η)|σ(ά|α)ββατο)/i
};
var parseDayPatterns$c = {
  narrow: [/^κ/i, /^δ/i, /^τ/i, /^τ/i, /^π/i, /^π/i, /^σ/i],
  any: [/^κ/i, /^δ/i, /^τρ/i, /^τε/i, /^π[εέ]/i, /^π[αά]/i, /^σ/i]
};
var matchDayPeriodPatterns$c = {
  narrow: /^(πμ|μμ|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i,
  any: /^([πμ]\.?\s?μ\.?|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i
};
var parseDayPeriodPatterns$c = {
  any: {
    am: /^πμ|π\.\s?μ\./i,
    pm: /^μμ|μ\.\s?μ\./i,
    midnight: /^μεσάν/i,
    noon: /^μεσημ(έ|ε)/i,
    morning: /πρω(ί|ι)/i,
    afternoon: /απ(ό|ο)γευμα/i,
    evening: /βρ(ά|α)δυ/i,
    night: /ν(ύ|υ)χτα/i
  }
};
var match$c = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$c,
    parsePattern: parseOrdinalNumberPattern$c,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$c,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$c,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$c,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$c,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$c,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$c,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$c,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$c,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$c,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$c,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Greek locale.
 * @language Greek
 * @iso-639-2 ell
 * @author Fanis Katsimpas [@fanixk]{@link https://github.com/fanixk}
 * @author Theodoros Orfanidis [@teoulas]{@link https://github.com/teoulas}
 */

var locale$c = {
  code: 'el',
  formatDistance: formatDistance$c,
  formatLong: formatLong$c,
  formatRelative: formatRelative$c,
  localize: localize$c,
  match: match$c,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var dateFormats$d = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'dd/MM/yyyy'
};
var timeFormats$d = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$d = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$d = {
  date: buildFormatLongFn({
    formats: dateFormats$d,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$d,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$d,
    defaultWidth: 'full'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary English locale (Australia).
 * @language English
 * @iso-639-2 eng
 * @author Julien Malige [@JulienMalige]{@link https://github.com/JulienMalige}
 */

var locale$d = {
  code: 'en-AU',
  formatDistance: formatDistance,
  formatLong: formatLong$d,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$d = {
  lessThanXSeconds: {
    one: 'less than a second',
    other: 'less than {{count}} seconds'
  },
  xSeconds: {
    one: 'a second',
    other: '{{count}} seconds'
  },
  halfAMinute: 'half a minute',
  lessThanXMinutes: {
    one: 'less than a minute',
    other: 'less than {{count}} minutes'
  },
  xMinutes: {
    one: 'a minute',
    other: '{{count}} minutes'
  },
  aboutXHours: {
    one: 'about an hour',
    other: 'about {{count}} hours'
  },
  xHours: {
    one: 'an hour',
    other: '{{count}} hours'
  },
  xDays: {
    one: 'a day',
    other: '{{count}} days'
  },
  aboutXMonths: {
    one: 'about a month',
    other: 'about {{count}} months'
  },
  xMonths: {
    one: 'a month',
    other: '{{count}} months'
  },
  aboutXYears: {
    one: 'about a year',
    other: 'about {{count}} years'
  },
  xYears: {
    one: 'a year',
    other: '{{count}} years'
  },
  overXYears: {
    one: 'over a year',
    other: 'over {{count}} years'
  },
  almostXYears: {
    one: 'almost a year',
    other: 'almost {{count}} years'
  }
};
function formatDistance$d(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$d[token] === 'string') {
    result = formatDistanceLocale$d[token];
  } else if (count === 1) {
    result = formatDistanceLocale$d[token].one;
  } else {
    result = formatDistanceLocale$d[token].other.replace('{{count}}', count);
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

var dateFormats$e = {
  full: 'EEEE, MMMM do, yyyy',
  long: 'MMMM do, yyyy',
  medium: 'MMM d, yyyy',
  short: 'yyyy-MM-dd'
};
var timeFormats$e = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$e = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$e = {
  date: buildFormatLongFn({
    formats: dateFormats$e,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$e,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$e,
    defaultWidth: 'full'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary English locale (Canada).
 * @language English
 * @iso-639-2 eng
 * @author Mark Owsiak [@markowsiak]{@link https://github.com/markowsiak}
 * @author Marco Imperatore [@mimperatore]{@link https://github.com/mimperatore}
 */

var locale$e = {
  code: 'en-CA',
  formatDistance: formatDistance$d,
  formatLong: formatLong$e,
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

var dateFormats$f = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'dd/MM/yyyy'
};
var timeFormats$f = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$f = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$f = {
  date: buildFormatLongFn({
    formats: dateFormats$f,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$f,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$f,
    defaultWidth: 'full'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary English locale (United Kingdom).
 * @language English
 * @iso-639-2 eng
 * @author Alex [@glintik]{@link https://github.com/glintik}
 */

var locale$f = {
  code: 'en-GB',
  formatDistance: formatDistance,
  formatLong: formatLong$f,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$e = {
  lessThanXSeconds: {
    one: 'malpli ol sekundo',
    other: 'malpli ol {{count}} sekundoj'
  },
  xSeconds: {
    one: '1 sekundo',
    other: '{{count}} sekundoj'
  },
  halfAMinute: 'duonminuto',
  lessThanXMinutes: {
    one: 'malpli ol minuto',
    other: 'malpli ol {{count}} minutoj'
  },
  xMinutes: {
    one: '1 minuto',
    other: '{{count}} minutoj'
  },
  aboutXHours: {
    one: 'proksimume 1 horo',
    other: 'proksimume {{count}} horoj'
  },
  xHours: {
    one: '1 horo',
    other: '{{count}} horoj'
  },
  xDays: {
    one: '1 tago',
    other: '{{count}} tagoj'
  },
  aboutXMonths: {
    one: 'proksimume 1 monato',
    other: 'proksimume {{count}} monatoj'
  },
  xMonths: {
    one: '1 monato',
    other: '{{count}} monatoj'
  },
  aboutXYears: {
    one: 'proksimume 1 jaro',
    other: 'proksimume {{count}} jaroj'
  },
  xYears: {
    one: '1 jaro',
    other: '{{count}} jaroj'
  },
  overXYears: {
    one: 'pli ol 1 jaro',
    other: 'pli ol {{count}} jaroj'
  },
  almostXYears: {
    one: 'preskaŭ 1 jaro',
    other: 'preskaŭ {{count}} jaroj'
  }
};
function formatDistance$e(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$e[token] === 'string') {
    result = formatDistanceLocale$e[token];
  } else if (count === 1) {
    result = formatDistanceLocale$e[token].one;
  } else {
    result = formatDistanceLocale$e[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'post ' + result;
    } else {
      return 'antaŭ ' + result;
    }
  }

  return result;
}

var dateFormats$g = {
  full: "EEEE, do 'de' MMMM y",
  long: 'y-MMMM-dd',
  medium: 'y-MMM-dd',
  short: 'yyyy-MM-dd'
};
var timeFormats$g = {
  full: "Ho 'horo kaj' m:ss zzzz",
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$g = {
  any: '{{date}} {{time}}'
};
var formatLong$g = {
  date: buildFormatLongFn({
    formats: dateFormats$g,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$g,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$g,
    defaultWidth: 'any'
  })
};

var formatRelativeLocale$d = {
  lastWeek: "'pasinta' eeee 'je' p",
  yesterday: "'hieraŭ je' p",
  today: "'hodiaŭ je' p",
  tomorrow: "'morgaŭ je' p",
  nextWeek: "eeee 'je' p",
  other: 'P'
};
function formatRelative$d(token, _date, _baseDate, _options) {
  return formatRelativeLocale$d[token];
}

var eraValues$d = {
  narrow: ['aK', 'pK'],
  abbreviated: ['a.K.E.', 'p.K.E.'],
  wide: ['antaŭ Komuna Erao', 'Komuna Erao']
};
var quarterValues$d = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['K1', 'K2', 'K3', 'K4'],
  wide: ['1-a kvaronjaro', '2-a kvaronjaro', '3-a kvaronjaro', '4-a kvaronjaro']
};
var monthValues$d = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aŭg', 'sep', 'okt', 'nov', 'dec'],
  wide: ['januaro', 'februaro', 'marto', 'aprilo', 'majo', 'junio', 'julio', 'aŭgusto', 'septembro', 'oktobro', 'novembro', 'decembro']
};
var dayValues$d = {
  narrow: ['D', 'L', 'M', 'M', 'Ĵ', 'V', 'S'],
  short: ['di', 'lu', 'ma', 'me', 'ĵa', 've', 'sa'],
  abbreviated: ['dim', 'lun', 'mar', 'mer', 'ĵaŭ', 'ven', 'sab'],
  wide: ['dimanĉo', 'lundo', 'mardo', 'merkredo', 'ĵaŭdo', 'vendredo', 'sabato']
};
var dayPeriodValues$d = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'noktomezo',
    noon: 'tagmezo',
    morning: 'matene',
    afternoon: 'posttagmeze',
    evening: 'vespere',
    night: 'nokte'
  },
  abbreviated: {
    am: 'a.t.m.',
    pm: 'p.t.m.',
    midnight: 'noktomezo',
    noon: 'tagmezo',
    morning: 'matene',
    afternoon: 'posttagmeze',
    evening: 'vespere',
    night: 'nokte'
  },
  wide: {
    am: 'antaŭtagmeze',
    pm: 'posttagmeze',
    midnight: 'noktomezo',
    noon: 'tagmezo',
    morning: 'matene',
    afternoon: 'posttagmeze',
    evening: 'vespere',
    night: 'nokte'
  }
};

function ordinalNumber$d(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '-a';
}

var localize$d = {
  ordinalNumber: ordinalNumber$d,
  era: buildLocalizeFn({
    values: eraValues$d,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$d,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$d,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$d,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$d,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$d = /^(\d+)(-?a)?/i;
var parseOrdinalNumberPattern$d = /\d+/i;
var matchEraPatterns$d = {
  narrow: /^([ap]k)/i,
  abbreviated: /^([ap]\.?\s?k\.?\s?e\.?)/i,
  wide: /^((antaǔ |post )?komuna erao)/i
};
var parseEraPatterns$d = {
  any: [/^a/i, /^[kp]/i]
};
var matchQuarterPatterns$d = {
  narrow: /^[1234]/i,
  abbreviated: /^k[1234]/i,
  wide: /^[1234](-?a)? kvaronjaro/i
};
var parseQuarterPatterns$d = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$d = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|maj|jun|jul|a(ŭ|ux|uh|u)g|sep|okt|nov|dec)/i,
  wide: /^(januaro|februaro|marto|aprilo|majo|junio|julio|a(ŭ|ux|uh|u)gusto|septembro|oktobro|novembro|decembro)/i
};
var parseMonthPatterns$d = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^a(u|ŭ)/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$d = {
  narrow: /^[dlmĵjvs]/i,
  short: /^(di|lu|ma|me|(ĵ|jx|jh|j)a|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|(ĵ|jx|jh|j)a(ŭ|ux|uh|u)|ven|sab)/i,
  wide: /^(diman(ĉ|cx|ch|c)o|lundo|mardo|merkredo|(ĵ|jx|jh|j)a(ŭ|ux|uh|u)do|vendredo|sabato)/i
};
var parseDayPatterns$d = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^(j|ĵ)/i, /^v/i, /^s/i],
  any: [/^d/i, /^l/i, /^ma/i, /^me/i, /^(j|ĵ)/i, /^v/i, /^s/i]
};
var matchDayPeriodPatterns$d = {
  narrow: /^([ap]|(posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo])/i,
  abbreviated: /^([ap][.\s]?t[.\s]?m[.\s]?|(posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo])/i,
  wide: /^(anta(ŭ|ux)tagmez|posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo]/i
};
var parseDayPeriodPatterns$d = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^noktom/i,
    noon: /^t/i,
    morning: /^m/i,
    afternoon: /^posttagmeze/i,
    evening: /^v/i,
    night: /^n/i
  }
};
var match$d = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$d,
    parsePattern: parseOrdinalNumberPattern$d,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$d,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$d,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$d,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$d,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$d,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$d,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$d,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$d,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$d,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$d,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Esperanto locale.
 * @language Esperanto
 * @iso-639-2 epo
 * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
 */

var locale$g = {
  code: 'eo',
  formatDistance: formatDistance$e,
  formatLong: formatLong$g,
  formatRelative: formatRelative$d,
  localize: localize$d,
  match: match$d,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$f = {
  lessThanXSeconds: {
    one: 'menos de un segundo',
    other: 'menos de {{count}} segundos'
  },
  xSeconds: {
    one: '1 segundo',
    other: '{{count}} segundos'
  },
  halfAMinute: 'medio minuto',
  lessThanXMinutes: {
    one: 'menos de un minuto',
    other: 'menos de {{count}} minutos'
  },
  xMinutes: {
    one: '1 minuto',
    other: '{{count}} minutos'
  },
  aboutXHours: {
    one: 'alrededor de 1 hora',
    other: 'alrededor de {{count}} horas'
  },
  xHours: {
    one: '1 hora',
    other: '{{count}} horas'
  },
  xDays: {
    one: '1 día',
    other: '{{count}} días'
  },
  aboutXMonths: {
    one: 'alrededor de 1 mes',
    other: 'alrededor de {{count}} meses'
  },
  xMonths: {
    one: '1 mes',
    other: '{{count}} meses'
  },
  aboutXYears: {
    one: 'alrededor de 1 año',
    other: 'alrededor de {{count}} años'
  },
  xYears: {
    one: '1 año',
    other: '{{count}} años'
  },
  overXYears: {
    one: 'más de 1 año',
    other: 'más de {{count}} años'
  },
  almostXYears: {
    one: 'casi 1 año',
    other: 'casi {{count}} años'
  }
};
function formatDistance$f(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$f[token] === 'string') {
    result = formatDistanceLocale$f[token];
  } else if (count === 1) {
    result = formatDistanceLocale$f[token].one;
  } else {
    result = formatDistanceLocale$f[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'en ' + result;
    } else {
      return 'hace ' + result;
    }
  }

  return result;
}

var dateFormats$h = {
  full: "EEEE, d 'de' MMMM y",
  long: "d 'de' MMMM y",
  medium: 'd MMM y',
  short: 'dd/MM/y'
};
var timeFormats$h = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$h = {
  full: "{{date}} 'a las' {{time}}",
  long: "{{date}} 'a las' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$h = {
  date: buildFormatLongFn({
    formats: dateFormats$h,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$h,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$h,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$e = {
  lastWeek: "'el' eeee 'pasado a la' LT",
  yesterday: "'ayer a la' p",
  today: "'hoy a la' p",
  tomorrow: "'mañana a la' p",
  nextWeek: "eeee 'a la' p",
  other: 'P'
};
var formatRelativeLocalePlural$1 = {
  lastWeek: "'el' eeee 'pasado a las' p",
  yesterday: "'ayer a las' p",
  today: "'hoy a las' p",
  tomorrow: "'mañana a las' p",
  nextWeek: "eeee 'a las' p",
  other: 'P'
};
function formatRelative$e(token, date, _baseDate, _options) {
  if (date.getUTCHours() !== 1) {
    return formatRelativeLocalePlural$1[token];
  }

  return formatRelativeLocale$e[token];
}

var eraValues$e = {
  narrow: ['AC', 'DC'],
  abbreviated: ['AC', 'DC'],
  wide: ['antes de cristo', 'después de cristo']
};
var quarterValues$e = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues$e = {
  narrow: ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  wide: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};
var dayValues$e = {
  narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
  short: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'],
  abbreviated: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sab'],
  wide: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
};
var dayPeriodValues$e = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'mañana',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noche'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'medianoche',
    noon: 'mediodia',
    morning: 'mañana',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noche'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'medianoche',
    noon: 'mediodia',
    morning: 'mañana',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noche'
  }
};
var formattingDayPeriodValues$b = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'de la mañana',
    afternoon: 'de la tarde',
    evening: 'de la tarde',
    night: 'de la noche'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'medianoche',
    noon: 'mediodia',
    morning: 'de la mañana',
    afternoon: 'de la tarde',
    evening: 'de la tarde',
    night: 'de la noche'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'medianoche',
    noon: 'mediodia',
    morning: 'de la mañana',
    afternoon: 'de la tarde',
    evening: 'de la tarde',
    night: 'de la noche'
  }
};

function ordinalNumber$e(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + 'º';
}

var localize$e = {
  ordinalNumber: ordinalNumber$e,
  era: buildLocalizeFn({
    values: eraValues$e,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$e,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$e,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$e,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$e,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$b,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$e = /^(\d+)(º)?/i;
var parseOrdinalNumberPattern$e = /\d+/i;
var matchEraPatterns$e = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
  wide: /^(antes de cristo|antes de la era com[uú]n|despu[eé]s de cristo|era com[uú]n)/i
};
var parseEraPatterns$e = {
  any: [/^ac/i, /^dc/i],
  wide: [/^(antes de cristo|antes de la era com[uú]n)/i, /^(despu[eé]s de cristo|era com[uú]n)/i]
};
var matchQuarterPatterns$e = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º)? trimestre/i
};
var parseQuarterPatterns$e = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$e = {
  narrow: /^[efmajsond]/i,
  abbreviated: /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
  wide: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
};
var parseMonthPatterns$e = {
  narrow: [/^e/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^en/i, /^feb/i, /^mar/i, /^abr/i, /^may/i, /^jun/i, /^jul/i, /^ago/i, /^sep/i, /^oct/i, /^nov/i, /^dic/i]
};
var matchDayPatterns$e = {
  narrow: /^[dlmjvs]/i,
  short: /^(do|lu|ma|mi|ju|vi|sa)/i,
  abbreviated: /^(dom|lun|mar|mie|jue|vie|sab)/i,
  wide: /^(domingo|lunes|martes|miercoles|jueves|viernes|s[áa]bado)/i
};
var parseDayPatterns$e = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^do/i, /^lu/i, /^ma/i, /^mi/i, /^ju/i, /^vi/i, /^sa/i]
};
var matchDayPeriodPatterns$e = {
  narrow: /^(a|p|mn|md|(de la|a las) (mañana|tarde|noche))/i,
  any: /^([ap]\.?\s?m\.?|medianoche|mediodia|(de la|a las) (mañana|tarde|noche))/i
};
var parseDayPeriodPatterns$e = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn/i,
    noon: /^md/i,
    morning: /mañana/i,
    afternoon: /tarde/i,
    evening: /tarde/i,
    night: /noche/i
  }
};
var match$e = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$e,
    parsePattern: parseOrdinalNumberPattern$e,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$e,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$e,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$e,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$e,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$e,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$e,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$e,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$e,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$e,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$e,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Spanish locale.
 * @language Spanish
 * @iso-639-2 spa
 * @author Juan Angosto [@juanangosto]{@link https://github.com/juanangosto}
 * @author Guillermo Grau [@guigrpa]{@link https://github.com/guigrpa}
 * @author Fernando Agüero [@fjaguero]{@link https://github.com/fjaguero}
 * @author Gastón Haro [@harogaston]{@link https://github.com/harogaston}
 * @author Yago Carballo [@YagoCarballo]{@link https://github.com/YagoCarballo}
 */

var locale$h = {
  code: 'es',
  formatDistance: formatDistance$f,
  formatLong: formatLong$h,
  formatRelative: formatRelative$e,
  localize: localize$e,
  match: match$e,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$g = {
  lessThanXSeconds: {
    standalone: {
      one: 'vähem kui üks sekund',
      other: 'vähem kui {{count}} sekundit'
    },
    withPreposition: {
      one: 'vähem kui ühe sekundi',
      other: 'vähem kui {{count}} sekundi'
    }
  },
  xSeconds: {
    standalone: {
      one: 'üks sekund',
      other: '{{count}} sekundit'
    },
    withPreposition: {
      one: 'ühe sekundi',
      other: '{{count}} sekundi'
    }
  },
  halfAMinute: {
    standalone: 'pool minutit',
    withPreposition: 'poole minuti'
  },
  lessThanXMinutes: {
    standalone: {
      one: 'vähem kui üks minut',
      other: 'vähem kui {{count}} minutit'
    },
    withPreposition: {
      one: 'vähem kui ühe minuti',
      other: 'vähem kui {{count}} minuti'
    }
  },
  xMinutes: {
    standalone: {
      one: 'üks minut',
      other: '{{count}} minutit'
    },
    withPreposition: {
      one: 'ühe minuti',
      other: '{{count}} minuti'
    }
  },
  aboutXHours: {
    standalone: {
      one: 'umbes üks tund',
      other: 'umbes {{count}} tundi'
    },
    withPreposition: {
      one: 'umbes ühe tunni',
      other: 'umbes {{count}} tunni'
    }
  },
  xHours: {
    standalone: {
      one: 'üks tund',
      other: '{{count}} tundi'
    },
    withPreposition: {
      one: 'ühe tunni',
      other: '{{count}} tunni'
    }
  },
  xDays: {
    standalone: {
      one: 'üks päev',
      other: '{{count}} päeva'
    },
    withPreposition: {
      one: 'ühe päeva',
      other: '{{count}} päeva'
    }
  },
  aboutXMonths: {
    standalone: {
      one: 'umbes üks kuu',
      other: 'umbes {{count}} kuud'
    },
    withPreposition: {
      one: 'umbes ühe kuu',
      other: 'umbes {{count}} kuu'
    }
  },
  xMonths: {
    standalone: {
      one: 'üks kuu',
      other: '{{count}} kuud'
    },
    withPreposition: {
      one: 'ühe kuu',
      other: '{{count}} kuu'
    }
  },
  aboutXYears: {
    standalone: {
      one: 'umbes üks aasta',
      other: 'umbes {{count}} aastat'
    },
    withPreposition: {
      one: 'umbes ühe aasta',
      other: 'umbes {{count}} aasta'
    }
  },
  xYears: {
    standalone: {
      one: 'üks aasta',
      other: '{{count}} aastat'
    },
    withPreposition: {
      one: 'ühe aasta',
      other: '{{count}} aasta'
    }
  },
  overXYears: {
    standalone: {
      one: 'rohkem kui üks aasta',
      other: 'rohkem kui {{count}} aastat'
    },
    withPreposition: {
      one: 'rohkem kui ühe aasta',
      other: 'rohkem kui {{count}} aasta'
    }
  },
  almostXYears: {
    standalone: {
      one: 'peaaegu üks aasta',
      other: 'peaaegu {{count}} aastat'
    },
    withPreposition: {
      one: 'peaaegu ühe aasta',
      other: 'peaaegu {{count}} aasta'
    }
  }
};
function formatDistance$g(token, count, options) {
  options = options || {};
  var usageGroup = options.addSuffix ? formatDistanceLocale$g[token].withPreposition : formatDistanceLocale$g[token].standalone;
  var result;

  if (typeof usageGroup === 'string') {
    result = usageGroup;
  } else if (count === 1) {
    result = usageGroup.one;
  } else {
    result = usageGroup.other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' pärast';
    } else {
      return result + ' eest';
    }
  }

  return result;
}

var dateFormats$i = {
  full: 'eeee, d. MMMM y',
  long: 'd. MMMM y',
  medium: 'd. MMM y',
  short: 'dd.MM.y'
};
var timeFormats$i = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$i = {
  full: "{{date}} 'kell' {{time}}",
  long: "{{date}} 'kell' {{time}}",
  medium: '{{date}}. {{time}}',
  short: '{{date}}. {{time}}'
};
var formatLong$i = {
  date: buildFormatLongFn({
    formats: dateFormats$i,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$i,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$i,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$f = {
  lastWeek: "'eelmine' eeee 'kell' p",
  yesterday: "'eile kell' p",
  today: "'täna kell' p",
  tomorrow: "'homme kell' p",
  nextWeek: "'järgmine' eeee 'kell' p",
  other: 'P'
};
function formatRelative$f(token, _date, _baseDate, _options) {
  return formatRelativeLocale$f[token];
}

var eraValues$f = {
  narrow: ['e.m.a', 'm.a.j'],
  abbreviated: ['e.m.a', 'm.a.j'],
  wide: ['enne meie ajaarvamist', 'meie ajaarvamise järgi']
};
var quarterValues$f = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['K1', 'K2', 'K3', 'K4'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var monthValues$f = {
  narrow: ['J', 'V', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jaan', 'veebr', 'märts', 'apr', 'mai', 'juuni', 'juuli', 'aug', 'sept', 'okt', 'nov', 'dets'],
  wide: ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember']
};
var dayValues$f = {
  narrow: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  short: ['P', 'E', 'T', 'K', 'N', 'R', 'L'],
  abbreviated: ['pühap.', 'esmasp.', 'teisip.', 'kolmap.', 'neljap.', 'reede.', 'laup.'],
  wide: ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev', 'neljapäev', 'reede', 'laupäev']
};
var dayPeriodValues$f = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'kesköö',
    noon: 'keskpäev',
    morning: 'hommik',
    afternoon: 'pärastlõuna',
    evening: 'õhtu',
    night: 'öö'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'kesköö',
    noon: 'keskpäev',
    morning: 'hommik',
    afternoon: 'pärastlõuna',
    evening: 'õhtu',
    night: 'öö'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'kesköö',
    noon: 'keskpäev',
    morning: 'hommik',
    afternoon: 'pärastlõuna',
    evening: 'õhtu',
    night: 'öö'
  }
};
var formattingDayPeriodValues$c = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'keskööl',
    noon: 'keskpäeval',
    morning: 'hommikul',
    afternoon: 'pärastlõunal',
    evening: 'õhtul',
    night: 'öösel'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'keskööl',
    noon: 'keskpäeval',
    morning: 'hommikul',
    afternoon: 'pärastlõunal',
    evening: 'õhtul',
    night: 'öösel'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'keskööl',
    noon: 'keskpäeval',
    morning: 'hommikul',
    afternoon: 'pärastlõunal',
    evening: 'õhtul',
    night: 'öösel'
  }
};

function ordinalNumber$f(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$f = {
  ordinalNumber: ordinalNumber$f,
  era: buildLocalizeFn({
    values: eraValues$f,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$f,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$f,
    formattingValues: monthValues$f,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$f,
    formattingValues: dayValues$f,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$f,
    formattingValues: formattingDayPeriodValues$c,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$f = /^\d+\./i;
var parseOrdinalNumberPattern$f = /\d+/i;
var matchEraPatterns$f = {
  narrow: /^(e\.m\.a|m\.a\.j|eKr|pKr)/i,
  abbreviated: /^(e\.m\.a|m\.a\.j|eKr|pKr)/i,
  wide: /^(enne meie ajaarvamist|meie ajaarvamise järgi|enne Kristust|pärast Kristust)/i
};
var parseEraPatterns$f = {
  any: [/^e/i, /^(m|p)/i]
};
var matchQuarterPatterns$f = {
  narrow: /^[1234]/i,
  abbreviated: /^K[1234]/i,
  wide: /^[1234](\.)? kvartal/i
};
var parseQuarterPatterns$f = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$f = {
  narrow: /^[jvmasond]/i,
  abbreviated: /^('jaan|veebr|märts|apr|mai|juuni|juuli|aug|sept|okt|nov|dets')/i,
  wide: /^('jaanuar|veebruar|märts|aprill|mai|juuni|juuli|august|september|oktoober|november|detsember')/i
};
var parseMonthPatterns$f = {
  narrow: [/^j/i, /^v/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^v/i, /^mär/i, /^ap/i, /^mai/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$f = {
  narrow: /^[petknrl]/i,
  short: /^[petknrl]/i,
  abbreviated: /^(püh?|esm?|tei?|kolm?|nel?|ree?|laup?)\.?/i,
  wide: /^('pühapäev|esmaspäev|teisipäev|kolmapäev|neljapäev|reede|laupäev')/i
};
var parseDayPatterns$f = {
  any: [/^p/i, /^e/i, /^t/i, /^k/i, /^n/i, /^r/i, /^l/i]
};
var matchDayPeriodPatterns$f = {
  any: /^(am|pm|kesköö|keskpäev|hommik|pärastlõuna|õhtu|öö)/i
};
var parseDayPeriodPatterns$f = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^keskö/i,
    noon: /^keskp/i,
    morning: /hommik/i,
    afternoon: /pärastlõuna/i,
    evening: /õhtu/i,
    night: /öö/i
  }
};
var match$f = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$f,
    parsePattern: parseOrdinalNumberPattern$f,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$f,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$f,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$f,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$f,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$f,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$f,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$f,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$f,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$f,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$f,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Estonian locale.
 * @language Estonian
 * @iso-639-2 est
 * @author Priit Hansen [@HansenPriit]{@link https://github.com/priithansen}
 */

var locale$i = {
  code: 'et',
  formatDistance: formatDistance$g,
  formatLong: formatLong$i,
  formatRelative: formatRelative$f,
  localize: localize$f,
  match: match$f,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$h = {
  lessThanXSeconds: {
    one: 'کمتر از یک ثانیه',
    other: 'کمتر از {{count}} ثانیه'
  },
  xSeconds: {
    one: '1 ثانیه',
    other: '{{count}} ثانیه'
  },
  halfAMinute: 'نیم دقیقه',
  lessThanXMinutes: {
    one: 'کمتر از یک دقیقه',
    other: 'کمتر از {{count}} دقیقه'
  },
  xMinutes: {
    one: '1 دقیقه',
    other: '{{count}} دقیقه'
  },
  aboutXHours: {
    one: 'حدود 1 ساعت',
    other: 'حدود {{count}} ساعت'
  },
  xHours: {
    one: '1 ساعت',
    other: '{{count}} ساعت'
  },
  xDays: {
    one: '1 روز',
    other: '{{count}} روز'
  },
  aboutXMonths: {
    one: 'حدود 1 ماه',
    other: 'حدود {{count}} ماه'
  },
  xMonths: {
    one: '1 ماه',
    other: '{{count}} ماه'
  },
  aboutXYears: {
    one: 'حدود 1 سال',
    other: 'حدود {{count}} سال'
  },
  xYears: {
    one: '1 سال',
    other: '{{count}} سال'
  },
  overXYears: {
    one: 'بیشتر از 1 سال',
    other: 'بیشتر از {{count}} سال'
  },
  almostXYears: {
    one: 'نزدیک 1 سال',
    other: 'نزدیک {{count}} سال'
  }
};
function formatDistance$h(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$h[token] === 'string') {
    result = formatDistanceLocale$h[token];
  } else if (count === 1) {
    result = formatDistanceLocale$h[token].one;
  } else {
    result = formatDistanceLocale$h[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'در ' + result;
    } else {
      return result + ' قبل';
    }
  }

  return result;
}

var dateFormats$j = {
  full: 'EEEE do MMMM y',
  long: 'do MMMM y',
  medium: 'd MMM y',
  short: 'yyyy/MM/dd'
};
var timeFormats$j = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$j = {
  full: "{{date}} 'در' {{time}}",
  long: "{{date}} 'در' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$j = {
  date: buildFormatLongFn({
    formats: dateFormats$j,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$j,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$j,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$g = {
  lastWeek: "eeee 'گذشته در' p",
  yesterday: "'دیروز در' p",
  today: "'امروز در' p",
  tomorrow: "'فردا در' p",
  nextWeek: "eeee 'در' p",
  other: 'P'
};
function formatRelative$g(token, _date, _baseDate, _options) {
  return formatRelativeLocale$g[token];
}

var eraValues$g = {
  narrow: ['ق', 'ب'],
  abbreviated: ['ق.م.', 'ب.م.'],
  wide: ['قبل از میلاد', 'بعد از میلاد']
};
var quarterValues$g = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['س‌م1', 'س‌م2', 'س‌م3', 'س‌م4'],
  wide: ['سه‌ماهه 1', 'سه‌ماهه 2', 'سه‌ماهه 3', 'سه‌ماهه 4'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$g = {
  narrow: ['ژ', 'ف', 'م', 'آ', 'م', 'ج', 'ج', 'آ', 'س', 'ا', 'ن', 'د'],
  abbreviated: ['ژانـ', 'فور', 'مارس', 'آپر', 'می', 'جون', 'جولـ', 'آگو', 'سپتـ', 'اکتـ', 'نوامـ', 'دسامـ'],
  wide: ['ژانویه', 'فوریه', 'مارس', 'آپریل', 'می', 'جون', 'جولای', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر']
};
var dayValues$g = {
  narrow: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  short: ['1ش', '2ش', '3ش', '4ش', '5ش', 'ج', 'ش'],
  abbreviated: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  wide: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
};
var dayPeriodValues$g = {
  narrow: {
    am: 'ق',
    pm: 'ب',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'ص',
    afternoon: 'ب.ظ.',
    evening: 'ع',
    night: 'ش'
  },
  abbreviated: {
    am: 'ق.ظ.',
    pm: 'ب.ظ.',
    midnight: 'نیمه‌شب',
    noon: 'ظهر',
    morning: 'صبح',
    afternoon: 'بعدازظهر',
    evening: 'عصر',
    night: 'شب'
  },
  wide: {
    am: 'قبل‌ازظهر',
    pm: 'بعدازظهر',
    midnight: 'نیمه‌شب',
    noon: 'ظهر',
    morning: 'صبح',
    afternoon: 'بعدازظهر',
    evening: 'عصر',
    night: 'شب'
  }
};
var formattingDayPeriodValues$d = {
  narrow: {
    am: 'ق',
    pm: 'ب',
    midnight: 'ن',
    noon: 'ظ',
    morning: 'ص',
    afternoon: 'ب.ظ.',
    evening: 'ع',
    night: 'ش'
  },
  abbreviated: {
    am: 'ق.ظ.',
    pm: 'ب.ظ.',
    midnight: 'نیمه‌شب',
    noon: 'ظهر',
    morning: 'صبح',
    afternoon: 'بعدازظهر',
    evening: 'عصر',
    night: 'شب'
  },
  wide: {
    am: 'قبل‌ازظهر',
    pm: 'بعدازظهر',
    midnight: 'نیمه‌شب',
    noon: 'ظهر',
    morning: 'صبح',
    afternoon: 'بعدازظهر',
    evening: 'عصر',
    night: 'شب'
  }
};

function ordinalNumber$g(dirtyNumber) {
  return String(dirtyNumber);
}

var localize$g = {
  ordinalNumber: ordinalNumber$g,
  era: buildLocalizeFn({
    values: eraValues$g,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$g,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$g,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$g,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$g,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$d,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$g = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern$g = /\d+/i;
var matchEraPatterns$g = {
  narrow: /^(ق|ب)/i,
  abbreviated: /^(ق\.?\s?م\.?|ق\.?\s?د\.?\s?م\.?|م\.?\s?|د\.?\s?م\.?)/i,
  wide: /^(قبل از میلاد|قبل از دوران مشترک|میلادی|دوران مشترک|بعد از میلاد)/i
};
var parseEraPatterns$g = {
  any: [/^قبل/i, /^بعد/i]
};
var matchQuarterPatterns$g = {
  narrow: /^[1234]/i,
  abbreviated: /^س‌م[1234]/i,
  wide: /^سه‌ماهه [1234]/i
};
var parseQuarterPatterns$g = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$g = {
  narrow: /^[جژفمآاماسند]/i,
  abbreviated: /^(جنو|ژانـ|ژانویه|فوریه|فور|مارس|آوریل|آپر|مه|می|ژوئن|جون|جول|جولـ|ژوئیه|اوت|آگو|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نوامـ|دسامبر|دسامـ|دسم)/i,
  wide: /^(ژانویه|جنوری|فبروری|فوریه|مارچ|مارس|آپریل|اپریل|ایپریل|آوریل|مه|می|ژوئن|جون|جولای|ژوئیه|آگست|اگست|آگوست|اوت|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نومبر|دسامبر|دسمبر)/i
};
var parseMonthPatterns$g = {
  narrow: [/^(ژ|ج)/i, /^ف/i, /^م/i, /^(آ|ا)/i, /^م/i, /^(ژ|ج)/i, /^(ج|ژ)/i, /^(آ|ا)/i, /^س/i, /^ا/i, /^ن/i, /^د/i],
  any: [/^ژا/i, /^ف/i, /^ما/i, /^آپ/i, /^(می|مه)/i, /^(ژوئن|جون)/i, /^(ژوئی|جول)/i, /^(اوت|آگ)/i, /^س/i, /^(اوک|اک)/i, /^ن/i, /^د/i]
};
var matchDayPatterns$g = {
  narrow: /^[شیدسچپج]/i,
  short: /^(ش|ج|1ش|2ش|3ش|4ش|5ش)/i,
  abbreviated: /^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i,
  wide: /^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i
};
var parseDayPatterns$g = {
  narrow: [/^ی/i, /^دو/i, /^س/i, /^چ/i, /^پ/i, /^ج/i, /^ش/i],
  any: [/^(ی|1ش|یکشنبه)/i, /^(د|2ش|دوشنبه)/i, /^(س|3ش|سه‌شنبه)/i, /^(چ|4ش|چهارشنبه)/i, /^(پ|5ش|پنجشنبه)/i, /^(ج|جمعه)/i, /^(ش|شنبه)/i]
};
var matchDayPeriodPatterns$g = {
  narrow: /^(ب|ق|ن|ظ|ص|ب.ظ.|ع|ش)/i,
  abbreviated: /^(ق.ظ.|ب.ظ.|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i,
  wide: /^(قبل‌ازظهر|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i
};
var parseDayPeriodPatterns$g = {
  any: {
    am: /^(ق|ق.ظ.|قبل‌ازظهر)/i,
    pm: /^(ب|ب.ظ.|بعدازظهر)/i,
    midnight: /^(‌نیمه‌شب|ن)/i,
    noon: /^(ظ|ظهر)/i,
    morning: /(ص|صبح)/i,
    afternoon: /(ب|ب.ظ.|بعدازظهر)/i,
    evening: /(ع|عصر)/i,
    night: /(ش|شب)/i
  }
};
var match$g = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$g,
    parsePattern: parseOrdinalNumberPattern$g,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$g,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$g,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$g,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$g,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$g,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$g,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$g,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$g,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$g,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$g,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Persian/Farsi locale (Iran).
 * @language Persian
 * @iso-639-2 ira
 * @author Morteza Ziyae [@mort3za]{@link https://github.com/mort3za}
 */

var locale$j = {
  code: 'fa-IR',
  formatDistance: formatDistance$h,
  formatLong: formatLong$j,
  formatRelative: formatRelative$g,
  localize: localize$g,
  match: match$g,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

function futureSeconds(text) {
  return text.replace(/sekuntia?/, 'sekunnin');
}

function futureMinutes(text) {
  return text.replace(/minuuttia?/, 'minuutin');
}

function futureHours(text) {
  return text.replace(/tuntia?/, 'tunnin');
}

function futureDays(text) {
  return text.replace(/päivää?/, 'päivän');
}

function futureMonths(text) {
  return text.replace(/(kuukausi|kuukautta)/, 'kuukauden');
}

function futureYears(text) {
  return text.replace(/(vuosi|vuotta)/, 'vuoden');
}

var formatDistanceLocale$i = {
  lessThanXSeconds: {
    one: 'alle sekunti',
    other: 'alle {{count}} sekuntia',
    futureTense: futureSeconds
  },
  xSeconds: {
    one: 'sekunti',
    other: '{{count}} sekuntia',
    futureTense: futureSeconds
  },
  halfAMinute: {
    one: 'puoli minuuttia',
    other: 'puoli minuuttia',
    futureTense: function (_text) {
      return 'puolen minuutin';
    }
  },
  lessThanXMinutes: {
    one: 'alle minuutti',
    other: 'alle {{count}} minuuttia',
    futureTense: futureMinutes
  },
  xMinutes: {
    one: 'minuutti',
    other: '{{count}} minuuttia',
    futureTense: futureMinutes
  },
  aboutXHours: {
    one: 'noin tunti',
    other: 'noin {{count}} tuntia',
    futureTense: futureHours
  },
  xHours: {
    one: 'tunti',
    other: '{{count}} tuntia',
    futureTense: futureHours
  },
  xDays: {
    one: 'päivä',
    other: '{{count}} päivää',
    futureTense: futureDays
  },
  aboutXMonths: {
    one: 'noin kuukausi',
    other: 'noin {{count}} kuukautta',
    futureTense: futureMonths
  },
  xMonths: {
    one: 'kuukausi',
    other: '{{count}} kuukautta',
    futureTense: futureMonths
  },
  aboutXYears: {
    one: 'noin vuosi',
    other: 'noin {{count}} vuotta',
    futureTense: futureYears
  },
  xYears: {
    one: 'vuosi',
    other: '{{count}} vuotta',
    futureTense: futureYears
  },
  overXYears: {
    one: 'yli vuosi',
    other: 'yli {{count}} vuotta',
    futureTense: futureYears
  },
  almostXYears: {
    one: 'lähes vuosi',
    other: 'lähes {{count}} vuotta',
    futureTense: futureYears
  }
};
function formatDistance$i(token, count, options) {
  options = options || {};
  var distance = formatDistanceLocale$i[token];
  var result = count === 1 ? distance.one : distance.other.replace('{{count}}', count);

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return distance.futureTense(result) + ' kuluttua';
    } else {
      return result + ' sitten';
    }
  }

  return result;
}

var dateFormats$k = {
  full: 'eeee d. MMMM y',
  long: 'd. MMMM y',
  medium: 'd. MMM y',
  short: 'd.M.y'
};
var timeFormats$k = {
  full: 'HH.mm.ss zzzz',
  long: 'HH.mm.ss z',
  medium: 'HH.mm.ss',
  short: 'HH.mm'
};
var dateTimeFormats$k = {
  full: "{{date}} 'klo' {{time}}",
  long: "{{date}} 'klo' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$k = {
  date: buildFormatLongFn({
    formats: dateFormats$k,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$k,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$k,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$h = {
  lastWeek: "'viime' eeee 'klo' p",
  yesterday: "'eilen klo' p",
  today: "'tänään klo' p",
  tomorrow: "'huomenna klo' p",
  nextWeek: "'ensi' eeee 'klo' p",
  other: 'P'
};
function formatRelative$h(token, _date, _baseDate, _options) {
  return formatRelativeLocale$h[token];
}

var eraValues$h = {
  narrow: ['eaa.', 'jaa.'],
  abbreviated: ['eaa.', 'jaa.'],
  wide: ['ennen ajanlaskun alkua', 'jälkeen ajanlaskun alun']
};
var quarterValues$h = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1. kvartaali', '2. kvartaali', '3. kvartaali', '4. kvartaali']
};
var monthValues$h = {
  narrow: ['T', 'H', 'M', 'H', 'T', 'K', 'H', 'E', 'S', 'L', 'M', 'J'],
  abbreviated: ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'],
  wide: ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu']
};
var formattingMonthValues$3 = {
  narrow: monthValues$h.narrow,
  abbreviated: monthValues$h.abbreviated,
  wide: monthValues$h.wide.map(function (name) {
    return name + 'ta';
  })
};
var dayValues$h = {
  narrow: ['S', 'M', 'T', 'K', 'T', 'P', 'L'],
  short: ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'],
  abbreviated: ['sunn.', 'maan.', 'tiis.', 'kesk.', 'torst.', 'perj.', 'la'],
  wide: ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai']
};
var formattingDayValues = {
  narrow: dayValues$h.narrow,
  short: dayValues$h.short,
  abbreviated: dayValues$h.abbreviated,
  wide: dayValues$h.wide.map(function (name) {
    return name + 'na';
  })
};
var dayPeriodValues$h = {
  narrow: {
    am: 'ap',
    pm: 'ip',
    midnight: 'keskiyö',
    noon: 'keskipäivä',
    morning: 'ap',
    afternoon: 'ip',
    evening: 'illalla',
    night: 'yöllä'
  },
  abbreviated: {
    am: 'ap',
    pm: 'ip',
    midnight: 'keskiyö',
    noon: 'keskipäivä',
    morning: 'ap',
    afternoon: 'ip',
    evening: 'illalla',
    night: 'yöllä'
  },
  wide: {
    am: 'ap',
    pm: 'ip',
    midnight: 'keskiyöllä',
    noon: 'keskipäivällä',
    morning: 'aamupäivällä',
    afternoon: 'iltapäivällä',
    evening: 'illalla',
    night: 'yöllä'
  }
};

function ordinalNumber$h(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$h = {
  ordinalNumber: ordinalNumber$h,
  era: buildLocalizeFn({
    values: eraValues$h,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$h,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$h,
    formattingValues: formattingMonthValues$3,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$h,
    formattingValues: formattingDayValues,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$h,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$h = /^(\d+)(\.)/i;
var parseOrdinalNumberPattern$h = /\d+/i;
var matchEraPatterns$h = {
  narrow: /^(e|j)/i,
  abbreviated: /^(eaa.|jaa.)/i,
  wide: /^(ennen ajanlaskun alkua|jälkeen ajanlaskun alun)/i
};
var parseEraPatterns$h = {
  any: [/^e/i, /^j/i]
};
var matchQuarterPatterns$h = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234]\.? kvartaali/i
};
var parseQuarterPatterns$h = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$h = {
  narrow: /^[thmkeslj]/i,
  abbreviated: /^(tammi|helmi|maalis|huhti|touko|kesä|heinä|elo|syys|loka|marras|joulu)/i,
  wide: /^(tammikuu|helmikuu|maaliskuu|huhtikuu|toukokuu|kesäkuu|heinäkuu|elokuu|syyskuu|lokakuu|marraskuu|joulukuu)(ta)?/i
};
var parseMonthPatterns$h = {
  narrow: [/^t/i, /^h/i, /^m/i, /^h/i, /^t/i, /^k/i, /^h/i, /^e/i, /^s/i, /^l/i, /^m/i, /^j/i],
  any: [/^ta/i, /^hel/i, /^maa/i, /^hu/i, /^to/i, /^k/i, /^hei/i, /^e/i, /^s/i, /^l/i, /^mar/i, /^j/i]
};
var matchDayPatterns$h = {
  narrow: /^[smtkpl]/i,
  short: /^(su|ma|ti|ke|to|pe|la)/i,
  abbreviated: /^(sunn.|maan.|tiis.|kesk.|torst.|perj.|la)/i,
  wide: /^(sunnuntai|maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai)(na)?/i
};
var parseDayPatterns$h = {
  narrow: [/^s/i, /^m/i, /^t/i, /^k/i, /^t/i, /^p/i, /^l/i],
  any: [/^s/i, /^m/i, /^ti/i, /^k/i, /^to/i, /^p/i, /^l/i]
};
var matchDayPeriodPatterns$h = {
  narrow: /^(ap|ip|keskiyö|keskipäivä|aamupäivällä|iltapäivällä|illalla|yöllä)/i,
  any: /^(ap|ip|keskiyöllä|keskipäivällä|aamupäivällä|iltapäivällä|illalla|yöllä)/i
};
var parseDayPeriodPatterns$h = {
  any: {
    am: /^ap/i,
    pm: /^ip/i,
    midnight: /^keskiyö/i,
    noon: /^keskipäivä/i,
    morning: /aamupäivällä/i,
    afternoon: /iltapäivällä/i,
    evening: /illalla/i,
    night: /yöllä/i
  }
};
var match$h = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$h,
    parsePattern: parseOrdinalNumberPattern$h,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$h,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$h,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$h,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$h,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$h,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$h,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$h,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$h,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$h,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$h,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Finnish locale.
 * @language Finnish
 * @iso-639-2 fin
 * @author Pyry-Samuli Lahti [@Pyppe]{@link https://github.com/Pyppe}
 * @author Edo Rivai [@mikolajgrzyb]{@link https://github.com/mikolajgrzyb}
 * @author Samu Juvonen [@sjuvonen]{@link https://github.com/sjuvonen}
 */

var locale$k = {
  code: 'fi',
  formatDistance: formatDistance$i,
  formatLong: formatLong$k,
  formatRelative: formatRelative$h,
  localize: localize$h,
  match: match$h,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$j = {
  lessThanXSeconds: {
    one: 'moins d’une seconde',
    other: 'moins de {{count}} secondes'
  },
  xSeconds: {
    one: '1 seconde',
    other: '{{count}} secondes'
  },
  halfAMinute: '30 secondes',
  lessThanXMinutes: {
    one: 'moins d’une minute',
    other: 'moins de {{count}} minutes'
  },
  xMinutes: {
    one: '1 minute',
    other: '{{count}} minutes'
  },
  aboutXHours: {
    one: 'environ 1 heure',
    other: 'environ {{count}} heures'
  },
  xHours: {
    one: '1 heure',
    other: '{{count}} heures'
  },
  xDays: {
    one: '1 jour',
    other: '{{count}} jours'
  },
  aboutXMonths: {
    one: 'environ 1 mois',
    other: 'environ {{count}} mois'
  },
  xMonths: {
    one: '1 mois',
    other: '{{count}} mois'
  },
  aboutXYears: {
    one: 'environ 1 an',
    other: 'environ {{count}} ans'
  },
  xYears: {
    one: '1 an',
    other: '{{count}} ans'
  },
  overXYears: {
    one: 'plus d’un an',
    other: 'plus de {{count}} ans'
  },
  almostXYears: {
    one: 'presqu’un an',
    other: 'presque {{count}} ans'
  }
};
function formatDistance$j(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$j[token] === 'string') {
    result = formatDistanceLocale$j[token];
  } else if (count === 1) {
    result = formatDistanceLocale$j[token].one;
  } else {
    result = formatDistanceLocale$j[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'dans ' + result;
    } else {
      return 'il y a ' + result;
    }
  }

  return result;
}

var dateFormats$l = {
  full: 'EEEE d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'dd/MM/y'
};
var timeFormats$l = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$l = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$l = {
  date: buildFormatLongFn({
    formats: dateFormats$l,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$l,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$l,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$i = {
  lastWeek: "eeee 'dernier à' p",
  yesterday: "'hier à' p",
  today: "'aujourd’hui à' p",
  tomorrow: "'demain à' p'",
  nextWeek: "eeee 'prochain à' p",
  other: 'P'
};
function formatRelative$i(token, _date, _baseDate, _options) {
  return formatRelativeLocale$i[token];
}

var eraValues$i = {
  narrow: ['av. J.-C', 'ap. J.-C'],
  abbreviated: ['av. J.-C', 'ap. J.-C'],
  wide: ['avant Jésus-Christ', 'après Jésus-Christ']
};
var quarterValues$i = {
  narrow: ['T1', 'T2', 'T3', 'T4'],
  abbreviated: ['1er trim.', '2ème trim.', '3ème trim.', '4ème trim.'],
  wide: ['1er trimestre', '2ème trimestre', '3ème trimestre', '4ème trimestre']
};
var monthValues$i = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  wide: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
};
var dayValues$i = {
  narrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  short: ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'],
  abbreviated: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  wide: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
};
var dayPeriodValues$i = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minuit',
    noon: 'midi',
    morning: 'mat.',
    afternoon: 'ap.m.',
    evening: 'soir',
    night: 'mat.'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minuit',
    noon: 'midi',
    morning: 'matin',
    afternoon: 'après-midi',
    evening: 'soir',
    night: 'matin'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minuit',
    noon: 'midi',
    morning: 'du matin',
    afternoon: 'de l’après-midi',
    evening: 'du soir',
    night: 'du matin'
  }
};

function ordinalNumber$i(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber);
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (number === 0) {
    return number;
  }

  if (unit === 'year' || unit === 'hour' || unit === 'week') {
    if (number === 1) {
      suffix = 'ère';
    } else {
      suffix = 'ème';
    }
  } else {
    if (number === 1) {
      suffix = 'er';
    } else {
      suffix = 'ème';
    }
  }

  return number + suffix;
}

var localize$i = {
  ordinalNumber: ordinalNumber$i,
  era: buildLocalizeFn({
    values: eraValues$i,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$i,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$i,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$i,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$i,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$i = /^(\d+)(ième|ère|ème|er|e)?/i;
var parseOrdinalNumberPattern$i = /\d+/i;
var matchEraPatterns$i = {
  narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
  abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
  wide: /^(avant Jésus-Christ|après Jésus-Christ)/i
};
var parseEraPatterns$i = {
  any: [/^av/i, /^ap/i]
};
var matchQuarterPatterns$i = {
  narrow: /^[1234]/i,
  abbreviated: /^t[1234]/i,
  wide: /^[1234](er|ème|e)? trimestre/i
};
var parseQuarterPatterns$i = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$i = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
  wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
};
var parseMonthPatterns$i = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^av/i, /^ma/i, /^juin/i, /^juil/i, /^ao/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$i = {
  narrow: /^[lmjvsd]/i,
  short: /^(di|lu|ma|me|je|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
  wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
};
var parseDayPatterns$i = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i]
};
var matchDayPeriodPatterns$i = {
  narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
  any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
};
var parseDayPeriodPatterns$i = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^min/i,
    noon: /^mid/i,
    morning: /mat/i,
    afternoon: /ap/i,
    evening: /soir/i,
    night: /nuit/i
  }
};
var match$i = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$i,
    parsePattern: parseOrdinalNumberPattern$i,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$i,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$i,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$i,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$i,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$i,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$i,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$i,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$i,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$i,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$i,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary French locale.
 * @language French
 * @iso-639-2 fra
 * @author Jean Dupouy [@izeau]{@link https://github.com/izeau}
 * @author François B [@fbonzon]{@link https://github.com/fbonzon}
 */

var locale$l = {
  code: 'fr',
  formatDistance: formatDistance$j,
  formatLong: formatLong$l,
  formatRelative: formatRelative$i,
  localize: localize$i,
  match: match$i,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var dateFormats$m = {
  full: 'EEEE d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'yy-MM-dd'
};
var timeFormats$m = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$m = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$m = {
  date: buildFormatLongFn({
    formats: dateFormats$m,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$m,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$m,
    defaultWidth: 'full'
  })
};

// Same as fr
/**
 * @type {Locale}
 * @category Locales
 * @summary French locale (Canada).
 * @language French
 * @iso-639-2 fra
 * @author Jean Dupouy [@izeau]{@link https://github.com/izeau}
 * @author François B [@fbonzon]{@link https://github.com/fbonzon}
 * @author Gabriele Petrioli [@gpetrioli]{@link https://github.com/gpetrioli}
 */

var locale$m = {
  code: 'fr-CA',
  formatDistance: formatDistance$j,
  formatLong: formatLong$m,
  formatRelative: formatRelative$i,
  localize: localize$i,
  match: match$i,
  // Unique for fr-CA
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$k = {
  lessThanXSeconds: {
    one: 'menos dun segundo',
    other: 'menos de {{count}} segundos'
  },
  xSeconds: {
    one: '1 segundo',
    other: '{{count}} segundos'
  },
  halfAMinute: 'medio minuto',
  lessThanXMinutes: {
    one: 'menos dun minuto',
    other: 'menos de {{count}} minutos'
  },
  xMinutes: {
    one: '1 minuto',
    other: '{{count}} minutos'
  },
  aboutXHours: {
    one: 'arredor de 1 hora',
    other: 'arredor de {{count}} horas'
  },
  xHours: {
    one: '1 hora',
    other: '{{count}} horas'
  },
  xDays: {
    one: '1 día',
    other: '{{count}} días'
  },
  aboutXMonths: {
    one: 'arredor de 1 mes',
    other: 'arredor de {{count}} meses'
  },
  xMonths: {
    one: '1 mes',
    other: '{{count}} meses'
  },
  aboutXYears: {
    one: 'arredor de 1 ano',
    other: 'arredor de {{count}} anos'
  },
  xYears: {
    one: '1 ano',
    other: '{{count}} anos'
  },
  overXYears: {
    one: 'mais de 1 ano',
    other: 'mais de {{count}} anos'
  },
  almostXYears: {
    one: 'casi 1 ano',
    other: 'casi {{count}} anos'
  }
};
function formatDistance$k(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$k[token] === 'string') {
    result = formatDistanceLocale$k[token];
  } else if (count === 1) {
    result = formatDistanceLocale$k[token].one;
  } else {
    result = formatDistanceLocale$k[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'en ' + result;
    } else {
      return 'hai ' + result;
    }
  }

  return result;
}

var dateFormats$n = {
  full: "EEEE, d 'de' MMMM y",
  long: "d 'de' MMMM y",
  medium: 'd MMM y',
  short: 'dd/MM/y'
};
var timeFormats$n = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$n = {
  full: "{{date}} 'ás' {{time}}",
  long: "{{date}} 'ás' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$n = {
  date: buildFormatLongFn({
    formats: dateFormats$n,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$n,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$n,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$j = {
  lastWeek: "'o' eeee 'pasado á' LT",
  yesterday: "'onte á' p",
  today: "'hoxe á' p",
  tomorrow: "'mañá á' p",
  nextWeek: "eeee 'á' p",
  other: 'P'
};
var formatRelativeLocalePlural$2 = {
  lastWeek: "'o' eeee 'pasado ás' p",
  yesterday: "'onte ás' p",
  today: "'hoxe ás' p",
  tomorrow: "'mañá ás' p",
  nextWeek: "eeee 'ás' p",
  other: 'P'
};
function formatRelative$j(token, date, _baseDate, _options) {
  if (date.getUTCHours() !== 1) {
    return formatRelativeLocalePlural$2[token];
  }

  return formatRelativeLocale$j[token];
}

var eraValues$j = {
  narrow: ['AC', 'DC'],
  abbreviated: ['AC', 'DC'],
  wide: ['antes de cristo', 'despois de cristo']
};
var quarterValues$j = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues$j = {
  narrow: ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['xan', 'feb', 'mar', 'abr', 'mai', 'xun', 'xul', 'ago', 'set', 'out', 'nov', 'dec'],
  wide: ['xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño', 'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro']
};
var dayValues$j = {
  narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
  short: ['do', 'lu', 'ma', 'me', 'xo', 've', 'sa'],
  abbreviated: ['dom', 'lun', 'mar', 'mer', 'xov', 'ven', 'sab'],
  wide: ['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado']
};
var dayPeriodValues$j = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'mañá',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noite'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'medianoite',
    noon: 'mediodía',
    morning: 'mañá',
    afternoon: 'tarde',
    evening: 'tardiña',
    night: 'noite'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'medianoite',
    noon: 'mediodía',
    morning: 'mañá',
    afternoon: 'tarde',
    evening: 'tardiña',
    night: 'noite'
  }
};
var formattingDayPeriodValues$e = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'da mañá',
    afternoon: 'da tarde',
    evening: 'da tardiña',
    night: 'da noite'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'medianoite',
    noon: 'mediodía',
    morning: 'da mañá',
    afternoon: 'da tarde',
    evening: 'da tardiña',
    night: 'da noite'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'medianoite',
    noon: 'mediodía',
    morning: 'da mañá',
    afternoon: 'da tarde',
    evening: 'da tardiña',
    night: 'da noite'
  }
};

function ordinalNumber$j(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + 'º';
}

var localize$j = {
  ordinalNumber: ordinalNumber$j,
  era: buildLocalizeFn({
    values: eraValues$j,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$j,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$j,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$j,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$j,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$e,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$j = /^(\d+)(º)?/i;
var parseOrdinalNumberPattern$j = /\d+/i;
var matchEraPatterns$j = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
  wide: /^(antes de cristo|antes da era com[uú]n|despois de cristo|era com[uú]n)/i
};
var parseEraPatterns$j = {
  any: [/^ac/i, /^dc/i],
  wide: [/^(antes de cristo|antes da era com[uú]n)/i, /^(despois de cristo|era com[uú]n)/i]
};
var matchQuarterPatterns$j = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º)? trimestre/i
};
var parseQuarterPatterns$j = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$j = {
  narrow: /^[xfmasond]/i,
  abbreviated: /^(xan|feb|mar|abr|mai|xun|xul|ago|set|out|nov|dec)/i,
  wide: /^(xaneiro|febreiro|marzo|abril|maio|xuño|xullo|agosto|setembro|outubro|novembro|decembro)/i
};
var parseMonthPatterns$j = {
  narrow: [/^x/i, /^f/i, /^m/i, /^a/i, /^m/i, /^x/i, /^x/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^xan/i, /^feb/i, /^mar/i, /^abr/i, /^mai/i, /^xun/i, /^xul/i, /^ago/i, /^set/i, /^out/i, /^nov/i, /^dec/i]
};
var matchDayPatterns$j = {
  narrow: /^[dlmxvs]/i,
  short: /^(do|lu|ma|me|xo|ve|sa)/i,
  abbreviated: /^(dom|lun|mar|mer|xov|ven|sab)/i,
  wide: /^(domingo|luns|martes|m[eé]rcores|xoves|venres|s[áa]bado)/i
};
var parseDayPatterns$j = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^x/i, /^v/i, /^s/i],
  any: [/^do/i, /^lu/i, /^ma/i, /^me/i, /^xo/i, /^ve/i, /^sa/i]
};
var matchDayPeriodPatterns$j = {
  narrow: /^(a|p|mn|md|(da|[aá]s) (mañ[aá]|tarde|noite))/i,
  any: /^([ap]\.?\s?m\.?|medianoite|mediod[ií]a|(da|[aá]s) (mañ[aá]|tarde|noite))/i
};
var parseDayPeriodPatterns$j = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn/i,
    noon: /^md/i,
    morning: /mañ[aá]/i,
    afternoon: /tarde/i,
    evening: /tardiña/i,
    night: /noite/i
  }
};
var match$j = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$j,
    parsePattern: parseOrdinalNumberPattern$j,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$j,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$j,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$j,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$j,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$j,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$j,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$j,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$j,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$j,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$j,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Galician locale.
 * @language Galician
 * @iso-639-2 glg
 * @author Alberto Doval - Cocodin Technology[@cocodinTech]{@link https://github.com/cocodinTech}
 * @author Fidel Pita [@fidelpita]{@link https://github.com/fidelpita}
 */

var locale$n = {
  code: 'gl',
  formatDistance: formatDistance$k,
  formatLong: formatLong$n,
  formatRelative: formatRelative$j,
  localize: localize$j,
  match: match$j,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

// Source: https://www.unicode.org/cldr/charts/32/summary/gu.html
var formatDistanceLocale$l = {
  lessThanXSeconds: {
    one: 'હમણાં',
    // CLDR #1461
    other: '​આશરે {{count}} સેકંડ'
  },
  xSeconds: {
    one: '1 સેકંડ',
    other: '{{count}} સેકંડ'
  },
  halfAMinute: 'અડધી મિનિટ',
  lessThanXMinutes: {
    one: 'આ મિનિટ',
    // CLDR #1448
    other: '​આશરે {{count}} મિનિટ'
  },
  xMinutes: {
    one: '1 મિનિટ',
    other: '{{count}} મિનિટ'
  },
  aboutXHours: {
    one: '​આશરે 1 કલાક',
    other: '​આશરે {{count}} કલાક'
  },
  xHours: {
    one: '1 કલાક',
    other: '{{count}} કલાક'
  },
  xDays: {
    one: '1 દિવસ',
    other: '{{count}} દિવસ'
  },
  aboutXMonths: {
    one: 'આશરે 1 મહિનો',
    other: 'આશરે {{count}} મહિના'
  },
  xMonths: {
    one: '1 મહિનો',
    other: '{{count}} મહિના'
  },
  aboutXYears: {
    one: 'આશરે 1 વર્ષ',
    other: 'આશરે {{count}} વર્ષ'
  },
  xYears: {
    one: '1 વર્ષ',
    other: '{{count}} વર્ષ'
  },
  overXYears: {
    one: '1 વર્ષથી વધુ',
    other: '{{count}} વર્ષથી વધુ'
  },
  almostXYears: {
    one: 'લગભગ 1 વર્ષ',
    other: 'લગભગ {{count}} વર્ષ'
  }
};
function formatDistance$l(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$l[token] === 'string') {
    result = formatDistanceLocale$l[token];
  } else if (count === 1) {
    result = formatDistanceLocale$l[token].one;
  } else {
    result = formatDistanceLocale$l[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + 'માં';
    } else {
      return result + ' પહેલાં';
    }
  }

  return result;
}

var dateFormats$o = {
  full: 'EEEE, d MMMM, y',
  // CLDR #1825
  long: 'd MMMM, y',
  // CLDR #1826
  medium: 'd MMM, y',
  // CLDR #1827
  short: 'd/M/yy' // CLDR #1828

};
var timeFormats$o = {
  full: 'hh:mm:ss a zzzz',
  // CLDR #1829
  long: 'hh:mm:ss a z',
  // CLDR #1830
  medium: 'hh:mm:ss a',
  // CLDR #1831
  short: 'hh:mm a' // CLDR #1832

};
var dateTimeFormats$o = {
  full: '{{date}} {{time}}',
  // CLDR #1833
  long: '{{date}} {{time}}',
  // CLDR #1834
  medium: '{{date}} {{time}}',
  // CLDR #1835
  short: '{{date}} {{time}}' // CLDR #1836

};
var formatLong$o = {
  date: buildFormatLongFn({
    formats: dateFormats$o,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$o,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$o,
    defaultWidth: 'full'
  })
};

// Source: https://www.unicode.org/cldr/charts/32/summary/gu.html
var formatRelativeLocale$k = {
  lastWeek: "'પાછલા' eeee p",
  // CLDR #1384
  yesterday: "'ગઈકાલે' p",
  // CLDR #1409
  today: "'આજે' p",
  // CLDR #1410
  tomorrow: "'આવતીકાલે' p",
  // CLDR #1411
  nextWeek: 'eeee p',
  // CLDR #1386
  other: 'P'
};
function formatRelative$k(token, _date, _baseDate, _options) {
  return formatRelativeLocale$k[token];
}

// #1621 - #1630

var eraValues$k = {
  narrow: ['ઈસપૂ', 'ઈસ'],
  abbreviated: ['ઈ.સ.પૂર્વે', 'ઈ.સ.'],
  wide: ['ઈસવીસન પૂર્વે', 'ઈસવીસન'] // https://www.unicode.org/cldr/charts/32/summary/gu.html
  // #1631 - #1654

};
var quarterValues$k = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1લો ત્રિમાસ', '2જો ત્રિમાસ', '3જો ત્રિમાસ', '4થો ત્રિમાસ'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  // https://www.unicode.org/cldr/charts/32/summary/gu.html
  // #1655 - #1726

};
var monthValues$k = {
  narrow: ['જા', 'ફે', 'મા', 'એ', 'મે', 'જૂ', 'જુ', 'ઓ', 'સ', 'ઓ', 'ન', 'ડિ'],
  abbreviated: ['જાન્યુ', 'ફેબ્રુ', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટે', 'ઓક્ટો', 'નવે', 'ડિસે'],
  wide: ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઇ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'] // https://www.unicode.org/cldr/charts/32/summary/gu.html
  // #1727 - #1768

};
var dayValues$k = {
  narrow: ['ર', 'સો', 'મં', 'બુ', 'ગુ', 'શુ', 'શ'],
  short: ['ર', 'સો', 'મં', 'બુ', 'ગુ', 'શુ', 'શ'],
  abbreviated: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
  wide: ['રવિવાર'
  /* Sunday */
  , 'સોમવાર'
  /* Monday */
  , 'મંગળવાર'
  /* Tuesday */
  , 'બુધવાર'
  /* Wednesday */
  , 'ગુરુવાર'
  /* Thursday */
  , 'શુક્રવાર'
  /* Friday */
  , 'શનિવાર'
  /* Saturday */
  ] // https://www.unicode.org/cldr/charts/32/summary/gu.html
  // #1783 - #1824

};
var dayPeriodValues$k = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'મ.રાત્રિ',
    noon: 'બ.',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: '​મધ્યરાત્રિ',
    noon: 'બપોરે',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: '​મધ્યરાત્રિ',
    noon: 'બપોરે',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  }
};
var formattingDayPeriodValues$f = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'મ.રાત્રિ',
    noon: 'બપોરે',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'મધ્યરાત્રિ',
    noon: 'બપોરે',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: '​મધ્યરાત્રિ',
    noon: 'બપોરે',
    morning: 'સવારે',
    afternoon: 'બપોરે',
    evening: 'સાંજે',
    night: 'રાત્રે'
  }
};

function ordinalNumber$k(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number;
}

var localize$k = {
  ordinalNumber: ordinalNumber$k,
  era: buildLocalizeFn({
    values: eraValues$k,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$k,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$k,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$k,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$k,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$f,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$k = /^(\d+)(લ|જ|થ|ઠ્ઠ|મ)?/i;
var parseOrdinalNumberPattern$k = /\d+/i;
var matchEraPatterns$k = {
  narrow: /^(ઈસપૂ|ઈસ)/i,
  abbreviated: /^(ઈ\.સ\.પૂર્વે|ઈ\.સ\.)/i,
  wide: /^(ઈસવીસન\sપૂર્વે|ઈસવીસન)/i
};
var parseEraPatterns$k = {
  any: [/^(ઈસપૂ|ઈસ)/i, /^(ઈ\.સ\.પૂર્વે|ઈ\.સ\.)/i, /^(ઈસવીસન\sપૂર્વે|ઈસવીસન)/i]
};
var matchQuarterPatterns$k = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](લો|જો|થો)? ત્રિમાસ/i
};
var parseQuarterPatterns$k = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$k = {
  narrow: /^[જાફેમાએમેજૂજુઓસઓનડિ]/i,
  abbreviated: /^(જાન્યુ|ફેબ્રુ|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઈ|ઑગસ્ટ|સપ્ટે|ઓક્ટો|નવે|ડિસે)/i,
  wide: /^(જાન્યુઆરી|ફેબ્રુઆરી|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઇ|ઓગસ્ટ|સપ્ટેમ્બર|ઓક્ટોબર|નવેમ્બર|ડિસેમ્બર)/i
};
var parseMonthPatterns$k = {
  narrow: [/^જા/i, /^ફે/i, /^મા/i, /^એ/i, /^મે/i, /^જૂ/i, /^જુ/i, /^ઑગ/i, /^સ/i, /^ઓક્ટો/i, /^ન/i, /^ડિ/i],
  any: [/^જા/i, /^ફે/i, /^મા/i, /^એ/i, /^મે/i, /^જૂ/i, /^જુ/i, /^ઑગ/i, /^સ/i, /^ઓક્ટો/i, /^ન/i, /^ડિ/i]
};
var matchDayPatterns$k = {
  narrow: /^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
  short: /^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
  abbreviated: /^(રવિ|સોમ|મંગળ|બુધ|ગુરુ|શુક્ર|શનિ)/i,
  wide: /^(રવિવાર|સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર)/i
};
var parseDayPatterns$k = {
  narrow: [/^ર/i, /^સો/i, /^મં/i, /^બુ/i, /^ગુ/i, /^શુ/i, /^શ/i],
  any: [/^ર/i, /^સો/i, /^મં/i, /^બુ/i, /^ગુ/i, /^શુ/i, /^શ/i]
};
var matchDayPeriodPatterns$k = {
  narrow: /^(a|p|મ\.?|સ|બ|સાં|રા)/i,
  any: /^(a|p|મ\.?|સ|બ|સાં|રા)/i
};
var parseDayPeriodPatterns$k = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^મ\.?/i,
    noon: /^બ/i,
    morning: /સ/i,
    afternoon: /બ/i,
    evening: /સાં/i,
    night: /રા/i
  }
};
var match$k = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$k,
    parsePattern: parseOrdinalNumberPattern$k,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$k,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$k,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$k,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$k,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$k,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$k,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$k,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$k,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$k,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$k,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Gujarati locale (India).
 * @language Gujarati
 * @iso-639-2 guj
 * @author Manaday Mavani [@ManadayM]{@link https://github.com/manadaym}
 */

var locale$o = {
  code: 'gu',
  formatDistance: formatDistance$l,
  formatLong: formatLong$o,
  formatRelative: formatRelative$k,
  localize: localize$k,
  match: match$k,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$m = {
  lessThanXSeconds: {
    one: 'פחות משנייה',
    two: 'פחות משתי שניות',
    other: 'פחות מ־{{count}} שניות'
  },
  xSeconds: {
    one: 'שנייה',
    two: 'שתי שניות',
    other: '{{count}} שניות'
  },
  halfAMinute: 'חצי דקה',
  lessThanXMinutes: {
    one: 'פחות מדקה',
    two: 'פחות משתי דקות',
    other: 'פחות מ־{{count}} דקות'
  },
  xMinutes: {
    one: 'דקה',
    two: 'שתי דקות',
    other: '{{count}} דקות'
  },
  aboutXHours: {
    one: 'בערך שעה',
    two: 'בערך שעתיים',
    other: 'בערך {{count}} שעות'
  },
  xHours: {
    one: 'שעה',
    two: 'שעתיים',
    other: '{{count}} שעות'
  },
  xDays: {
    one: 'יום',
    two: 'יומיים',
    other: '{{count}} ימים'
  },
  aboutXMonths: {
    one: 'בערך חודש',
    two: 'בערך חודשיים',
    other: 'בערך {{count}} חודשים'
  },
  xMonths: {
    one: 'חודש',
    two: 'חודשיים',
    other: '{{count}} חודשים'
  },
  aboutXYears: {
    one: 'בערך שנה',
    two: 'בערך שנתיים',
    other: 'בערך {{count}} שנים'
  },
  xYears: {
    one: 'שנה',
    two: 'שנתיים',
    other: '{{count}} שנים'
  },
  overXYears: {
    one: 'יותר משנה',
    two: 'יותר משנתיים',
    other: 'יותר מ־{{count}} שנים'
  },
  almostXYears: {
    one: 'כמעט שנה',
    two: 'כמעט שנתיים',
    other: 'כמעט {{count}} שנים'
  }
};
function formatDistance$m(token, count, options) {
  options = options || {}; // Return word instead of `in one day` or `one day ago`

  if (token === 'xDays' && options.addSuffix && count <= 2) {
    var past = {
      1: 'אתמול',
      2: 'שלשום'
    };
    var future = {
      1: 'מחר',
      2: 'מחרתיים'
    };
    return options.comparison > 0 ? future[count] : past[count];
  }

  var result;

  if (typeof formatDistanceLocale$m[token] === 'string') {
    result = formatDistanceLocale$m[token];
  } else if (count === 1) {
    result = formatDistanceLocale$m[token].one;
  } else if (count === 2) {
    result = formatDistanceLocale$m[token].two;
  } else {
    result = formatDistanceLocale$m[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'בעוד ' + result;
    } else {
      return 'לפני ' + result;
    }
  }

  return result;
}

var dateFormats$p = {
  full: 'EEEE, d בMMMM y',
  long: 'd בMMMM y',
  medium: 'd בMMM y',
  short: 'd.M.y'
};
var timeFormats$p = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$p = {
  full: "{{date}} 'בשעה' {{time}}",
  long: "{{date}} 'בשעה' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$p = {
  date: buildFormatLongFn({
    formats: dateFormats$p,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$p,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$p,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$l = {
  lastWeek: "eeee 'שעבר בשעה' p",
  yesterday: "'אתמול בשעה' p",
  today: "'היום בשעה' p",
  tomorrow: "'מחר בשעה' p",
  nextWeek: "eeee 'בשעה' p",
  other: 'P'
};
function formatRelative$l(token, _date, _baseDate, _options) {
  return formatRelativeLocale$l[token];
}

var eraValues$l = {
  narrow: ['לפנה״ס', 'לספירה'],
  abbreviated: ['לפנה״ס', 'לספירה'],
  wide: ['לפני הספירה', 'לספירה']
};
var quarterValues$l = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['רבעון 1', 'רבעון 2', 'רבעון 3', 'רבעון 4']
};
var monthValues$l = {
  narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  abbreviated: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
  wide: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
};
var dayValues$l = {
  narrow: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  short: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
  abbreviated: ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'],
  wide: ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת']
};
var dayPeriodValues$l = {
  narrow: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בוקר',
    afternoon: 'אחר הצהריים',
    evening: 'ערב',
    night: 'לילה'
  },
  abbreviated: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בוקר',
    afternoon: 'אחר הצהריים',
    evening: 'ערב',
    night: 'לילה'
  },
  wide: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בוקר',
    afternoon: 'אחר הצהריים',
    evening: 'ערב',
    night: 'לילה'
  }
};
var formattingDayPeriodValues$g = {
  narrow: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בבוקר',
    afternoon: 'בצהריים',
    evening: 'בערב',
    night: 'בלילה'
  },
  abbreviated: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בבוקר',
    afternoon: 'אחר הצהריים',
    evening: 'בערב',
    night: 'בלילה'
  },
  wide: {
    am: 'לפנה״צ',
    pm: 'אחה״צ',
    midnight: 'חצות',
    noon: 'צהריים',
    morning: 'בבוקר',
    afternoon: 'אחר הצהריים',
    evening: 'בערב',
    night: 'בלילה'
  }
};

function ordinalNumber$l(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber); // We only show words till 10

  if (number <= 0 || number > 10) return number;
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var isFemale = ['year', 'hour', 'minute', 'second'].indexOf(unit) >= 0;
  var male = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי', 'שמיני', 'תשיעי', 'עשירי'];
  var female = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית', 'שמינית', 'תשיעית', 'עשירית'];
  var index = number - 1;
  return isFemale ? female[index] : male[index];
}

var localize$l = {
  ordinalNumber: ordinalNumber$l,
  era: buildLocalizeFn({
    values: eraValues$l,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$l,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$l,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$l,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$l,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$g,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$l = /^(\d+|(ראשון|שני|שלישי|רביעי|חמישי|שישי|שביעי|שמיני|תשיעי|עשירי|ראשונה|שנייה|שלישית|רביעית|חמישית|שישית|שביעית|שמינית|תשיעית|עשירית))/i;
var parseOrdinalNumberPattern$l = /^(\d+|רא|שנ|של|רב|ח|שי|שב|שמ|ת|ע)/i;
var matchEraPatterns$l = {
  narrow: /^ל(ספירה|פנה״ס)/i,
  abbreviated: /^ל(ספירה|פנה״ס)/i,
  wide: /^ל(פני ה)?ספירה/i
};
var parseEraPatterns$l = {
  any: [/^לפ/i, /^לס/i]
};
var matchQuarterPatterns$l = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^רבעון [1234]/i
};
var parseQuarterPatterns$l = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$l = {
  narrow: /^\d+/i,
  abbreviated: /^(ינו|פבר|מרץ|אפר|מאי|יוני|יולי|אוג|ספט|אוק|נוב|דצמ)׳?/i,
  wide: /^(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)/i
};
var parseMonthPatterns$l = {
  narrow: [/^1$/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^7/i, /^8/i, /^9/i, /^10/i, /^11/i, /^12/i],
  any: [/^ינ/i, /^פ/i, /^מר/i, /^אפ/i, /^מא/i, /^יונ/i, /^יול/i, /^אוג/i, /^ס/i, /^אוק/i, /^נ/i, /^ד/i]
};
var matchDayPatterns$l = {
  narrow: /^[אבגדהוש]׳/i,
  short: /^[אבגדהוש]׳/i,
  abbreviated: /^(שבת|יום (א|ב|ג|ד|ה|ו)׳)/i,
  wide: /^יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/i
};
var parseDayPatterns$l = {
  abbreviated: [/א׳$/i, /ב׳$/i, /ג׳$/i, /ד׳$/i, /ה׳$/i, /ו׳$/i, /^ש/i],
  wide: [/ן$/i, /ני$/i, /לישי$/i, /עי$/i, /מישי$/i, /שישי$/i, /ת$/i],
  any: [/^א/i, /^ב/i, /^ג/i, /^ד/i, /^ה/i, /^ו/i, /^ש/i]
};
var matchDayPeriodPatterns$l = {
  any: /^(אחר ה|ב)?(חצות|צהריים|בוקר|ערב|לילה|אחה״צ|לפנה״צ)/i
};
var parseDayPeriodPatterns$l = {
  any: {
    am: /^לפ/i,
    pm: /^אחה/i,
    midnight: /^ח/i,
    noon: /^צ/i,
    morning: /בוקר/i,
    afternoon: /בצ|אחר/i,
    evening: /ערב/i,
    night: /לילה/i
  }
};
var ordinalName = ['רא', 'שנ', 'של', 'רב', 'ח', 'שי', 'שב', 'שמ', 'ת', 'ע'];
var match$l = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$l,
    parsePattern: parseOrdinalNumberPattern$l,
    valueCallback: function (value) {
      var number = parseInt(value, 10);
      return isNaN(number) ? ordinalName.indexOf(value) + 1 : number;
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$l,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$l,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$l,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$l,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$l,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$l,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$l,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$l,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$l,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$l,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Hebrew locale.
 * @language Hebrew
 * @iso-639-2 heb
 * @author Nir Lahad [@nirlah]{@link https://github.com/nirlah}
 */

var locale$p = {
  code: 'he',
  formatDistance: formatDistance$m,
  formatLong: formatLong$p,
  formatRelative: formatRelative$l,
  localize: localize$l,
  match: match$l,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var numberValues$1 = {
  locale: {
    '1': '१',
    '2': '२',
    '3': '३',
    '4': '४',
    '5': '५',
    '6': '६',
    '7': '७',
    '8': '८',
    '9': '९',
    '0': '०'
  },
  number: {
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
    '०': '0'
  } // CLDR #1585 - #1592

};
var eraValues$m = {
  narrow: ['ईसा-पूर्व', 'ईस्वी'],
  abbreviated: ['ईसा-पूर्व', 'ईस्वी'],
  wide: ['ईसा-पूर्व', 'ईसवी सन'] // CLDR #1593 - #1616

};
var quarterValues$m = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['ति1', 'ति2', 'ति3', 'ति4'],
  wide: ['पहली तिमाही', 'दूसरी तिमाही', 'तीसरी तिमाही', 'चौथी तिमाही'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  // https://www.unicode.org/cldr/charts/32/summary/hi.html
  // CLDR #1617 - #1688

};
var monthValues$m = {
  narrow: ['ज', 'फ़', 'मा', 'अ', 'मई', 'जू', 'जु', 'अग', 'सि', 'अक्तू', 'न', 'दि'],
  abbreviated: ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'],
  wide: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर'] // CLDR #1689 - #1744

};
var dayValues$m = {
  narrow: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
  short: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
  abbreviated: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  wide: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']
};
var dayPeriodValues$m = {
  narrow: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  },
  abbreviated: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  },
  wide: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  }
};
var formattingDayPeriodValues$h = {
  narrow: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  },
  abbreviated: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  },
  wide: {
    am: 'पूर्वाह्न',
    pm: 'अपराह्न',
    midnight: 'मध्यरात्रि',
    noon: 'दोपहर',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात'
  }
};

function ordinalNumber$m(dirtyNumber) {
  var number = localize$m.localeToNumber(dirtyNumber);
  var localeNumber = localize$m.numberToLocale(number);
  var rem10 = number % 10;

  switch (rem10) {
    case 2:
    case 3:
    case 4:
    case 6:
    case 1:
    case 5:
    case 7:
    case 8:
    case 9:
    case 0:
      return localeNumber;
  }
}

function localeToNumber$1(locale) {
  var number = locale.toString().replace(/[१२३४५६७८९०]/g, function (match) {
    return numberValues$1.number[match];
  });
  return Number(number);
}

function numberToLocale$1(number) {
  return number.toString().replace(/\d/g, function (match) {
    return numberValues$1.locale[match];
  });
}

var localize$m = {
  localeToNumber: localeToNumber$1,
  numberToLocale: numberToLocale$1,
  ordinalNumber: ordinalNumber$m,
  era: buildLocalizeFn({
    values: eraValues$m,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$m,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$m,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$m,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$m,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$h,
    defaultFormattingWidth: 'wide'
  })
};

var formatDistanceLocale$n = {
  lessThanXSeconds: {
    one: '१ सेकंड से कम',
    // CLDR #1310
    other: '{{count}} सेकंड से कम'
  },
  xSeconds: {
    one: '१ सेकंड',
    other: '{{count}} सेकंड'
  },
  halfAMinute: 'आधा मिनट',
  lessThanXMinutes: {
    one: '१ मिनट से कम',
    other: '{{count}} मिनट से कम'
  },
  xMinutes: {
    one: '१ मिनट',
    // CLDR #1307
    other: '{{count}} मिनट'
  },
  aboutXHours: {
    one: 'लगभग १ घंटा',
    other: 'लगभग {{count}} घंटे'
  },
  xHours: {
    one: '१ घंटा',
    // CLDR #1304
    other: '{{count}} घंटे' // CLDR #4467

  },
  xDays: {
    one: '१ दिन',
    // CLDR #1286
    other: '{{count}} दिन'
  },
  aboutXMonths: {
    one: 'लगभग १ महीना',
    other: 'लगभग {{count}} महीने'
  },
  xMonths: {
    one: '१ महीना',
    other: '{{count}} महीने'
  },
  aboutXYears: {
    one: 'लगभग १ वर्ष',
    other: 'लगभग {{count}} वर्ष' // CLDR #4823

  },
  xYears: {
    one: '१ वर्ष',
    other: '{{count}} वर्ष'
  },
  overXYears: {
    one: '१ वर्ष से अधिक',
    other: '{{count}} वर्ष से अधिक'
  },
  almostXYears: {
    one: 'लगभग १ वर्ष',
    other: 'लगभग {{count}} वर्ष'
  }
};
function formatDistance$n(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$n[token] === 'string') {
    result = formatDistanceLocale$n[token];
  } else if (count === 1) {
    result = formatDistanceLocale$n[token].one;
  } else {
    result = formatDistanceLocale$n[token].other.replace('{{count}}', localize$m.numberToLocale(count));
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + 'मे ';
    } else {
      return result + ' पहले';
    }
  }

  return result;
}

var dateFormats$q = {
  full: 'EEEE, do MMMM, y',
  // CLDR #1787
  long: 'do MMMM, y',
  // CLDR #1788
  medium: 'd MMM, y',
  // CLDR #1789
  short: 'dd/MM/yyyy' // CLDR #1790

};
var timeFormats$q = {
  full: 'h:mm:ss a zzzz',
  // CLDR #1791
  long: 'h:mm:ss a z',
  // CLDR #1792
  medium: 'h:mm:ss a',
  // CLDR #1793
  short: 'h:mm a' // CLDR #1794

};
var dateTimeFormats$q = {
  full: "{{date}} 'को' {{time}}",
  // CLDR #1795
  long: "{{date}} 'को' {{time}}",
  // CLDR #1796
  medium: '{{date}}, {{time}}',
  // CLDR #1797
  short: '{{date}}, {{time}}' // CLDR #1798

};
var formatLong$q = {
  date: buildFormatLongFn({
    formats: dateFormats$q,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$q,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$q,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$m = {
  lastWeek: "'पिछले' eeee p",
  yesterday: "'कल' p",
  today: "'आज' p",
  tomorrow: "'कल' p",
  nextWeek: "eeee 'को' p",
  other: 'P'
};
function formatRelative$m(token, _date, _baseDate, _options) {
  return formatRelativeLocale$m[token];
}

var matchOrdinalNumberPattern$m = /^[०१२३४५६७८९]+/i;
var parseOrdinalNumberPattern$m = /^[०१२३४५६७८९]+/i;
var matchEraPatterns$m = {
  narrow: /^(ईसा-पूर्व|ईस्वी)/i,
  abbreviated: /^(ईसा\.?\s?पूर्व\.?|ईसा\.?)/i,
  wide: /^(ईसा-पूर्व|ईसवी पूर्व|ईसवी सन|ईसवी)/i
};
var parseEraPatterns$m = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns$m = {
  narrow: /^[1234]/i,
  abbreviated: /^ति[1234]/i,
  wide: /^[1234](पहली|दूसरी|तीसरी|चौथी)? तिमाही/i
};
var parseQuarterPatterns$m = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$m = {
  narrow: /^[जफ़माअप्मईजूनजुअगसिअक्तनदि]/i,
  abbreviated: /^(जन|फ़र|मार्च|अप्|मई|जून|जुल|अग|सित|अक्तू|नव|दिस)/i,
  wide: /^(जनवरी|फ़रवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्तूबर|नवंबर|दिसंबर)/i
};
var parseMonthPatterns$m = {
  narrow: [/^ज/i, /^फ़/i, /^मा/i, /^अप्/i, /^मई/i, /^जू/i, /^जु/i, /^अग/i, /^सि/i, /^अक्तू/i, /^न/i, /^दि/i],
  any: [/^जन/i, /^फ़/i, /^मा/i, /^अप्/i, /^मई/i, /^जू/i, /^जु/i, /^अग/i, /^सि/i, /^अक्तू/i, /^नव/i, /^दिस/i]
};
var matchDayPatterns$m = {
  narrow: /^[रविसोममंगलबुधगुरुशुक्रशनि]/i,
  short: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
  abbreviated: /^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
  wide: /^(रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)/i
};
var parseDayPatterns$m = {
  narrow: [/^रवि/i, /^सोम/i, /^मंगल/i, /^बुध/i, /^गुरु/i, /^शुक्र/i, /^शनि/i],
  any: [/^रवि/i, /^सोम/i, /^मंगल/i, /^बुध/i, /^गुरु/i, /^शुक्र/i, /^शनि/i]
};
var matchDayPeriodPatterns$m = {
  narrow: /^(पू|अ|म|द.\?|सु|दो|शा|रा)/i,
  any: /^(पूर्वाह्न|अपराह्न|म|द.\?|सु|दो|शा|रा)/i
};
var parseDayPeriodPatterns$m = {
  any: {
    am: /^पूर्वाह्न/i,
    pm: /^अपराह्न/i,
    midnight: /^मध्य/i,
    noon: /^दो/i,
    morning: /सु/i,
    afternoon: /दो/i,
    evening: /शा/i,
    night: /रा/i
  }
};
var match$m = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$m,
    parsePattern: parseOrdinalNumberPattern$m,
    valueCallback: localize$m.localeToNumber
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$m,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$m,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$m,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$m,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$m,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$m,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$m,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$m,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$m,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$m,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Hindi locale (India).
 * @language Hindi
 * @iso-639-2 hin
 * @author Mukesh Mandiwal [@mukeshmandiwal]{@link https://github.com/mukeshmandiwal}
 */

var locale$q = {
  code: 'hi',
  formatDistance: formatDistance$n,
  formatLong: formatLong$q,
  formatRelative: formatRelative$m,
  localize: localize$m,
  match: match$m,
  options: {
    weekStartsOn: 0
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$o = {
  lessThanXSeconds: {
    one: {
      standalone: 'manje od 1 sekunde',
      withPrepositionAgo: 'manje od 1 sekunde',
      withPrepositionIn: 'manje od 1 sekundu'
    },
    dual: 'manje od {{count}} sekunde',
    other: 'manje od {{count}} sekundi'
  },
  xSeconds: {
    one: {
      standalone: '1 sekunda',
      withPrepositionAgo: '1 sekunde',
      withPrepositionIn: '1 sekundu'
    },
    dual: '{{count}} sekunde',
    other: '{{count}} sekundi'
  },
  halfAMinute: 'pola minute',
  lessThanXMinutes: {
    one: {
      standalone: 'manje od 1 minute',
      withPrepositionAgo: 'manje od 1 minute',
      withPrepositionIn: 'manje od 1 minutu'
    },
    dual: 'manje od {{count}} minute',
    other: 'manje od {{count}} minuta'
  },
  xMinutes: {
    one: {
      standalone: '1 minuta',
      withPrepositionAgo: '1 minute',
      withPrepositionIn: '1 minutu'
    },
    dual: '{{count}} minute',
    other: '{{count}} minuta'
  },
  aboutXHours: {
    one: {
      standalone: 'oko 1 sat',
      withPrepositionAgo: 'oko 1 sat',
      withPrepositionIn: 'oko 1 sat'
    },
    dual: 'oko {{count}} sata',
    other: 'oko {{count}} sati'
  },
  xHours: {
    one: {
      standalone: '1 sat',
      withPrepositionAgo: '1 sat',
      withPrepositionIn: '1 sat'
    },
    dual: '{{count}} sata',
    other: '{{count}} sati'
  },
  xDays: {
    one: {
      standalone: '1 dan',
      withPrepositionAgo: '1 dan',
      withPrepositionIn: '1 dan'
    },
    dual: '{{count}} dana',
    other: '{{count}} dana'
  },
  aboutXMonths: {
    one: {
      standalone: 'oko 1 mjesec',
      withPrepositionAgo: 'oko 1 mjesec',
      withPrepositionIn: 'oko 1 mjesec'
    },
    dual: 'oko {{count}} mjeseca',
    other: 'oko {{count}} mjeseci'
  },
  xMonths: {
    one: {
      standalone: '1 mjesec',
      withPrepositionAgo: '1 mjesec',
      withPrepositionIn: '1 mjesec'
    },
    dual: '{{count}} mjeseca',
    other: '{{count}} mjeseci'
  },
  aboutXYears: {
    one: {
      standalone: 'oko 1 godinu',
      withPrepositionAgo: 'oko 1 godinu',
      withPrepositionIn: 'oko 1 godinu'
    },
    dual: 'oko {{count}} godine',
    other: 'oko {{count}} godina'
  },
  xYears: {
    one: {
      standalone: '1 godina',
      withPrepositionAgo: '1 godine',
      withPrepositionIn: '1 godinu'
    },
    dual: '{{count}} godine',
    other: '{{count}} godina'
  },
  overXYears: {
    one: {
      standalone: 'preko 1 godinu',
      withPrepositionAgo: 'preko 1 godinu',
      withPrepositionIn: 'preko 1 godinu'
    },
    dual: 'preko {{count}} godine',
    other: 'preko {{count}} godina'
  },
  almostXYears: {
    one: {
      standalone: 'gotovo 1 godinu',
      withPrepositionAgo: 'gotovo 1 godinu',
      withPrepositionIn: 'gotovo 1 godinu'
    },
    dual: 'gotovo {{count}} godine',
    other: 'gotovo {{count}} godina'
  }
};
function formatDistance$o(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$o[token] === 'string') {
    result = formatDistanceLocale$o[token];
  } else if (count === 1) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        result = formatDistanceLocale$o[token].one.withPrepositionIn;
      } else {
        result = formatDistanceLocale$o[token].one.withPrepositionAgo;
      }
    } else {
      result = formatDistanceLocale$o[token].one.standalone;
    }
  } else if (count % 10 > 1 && count % 10 < 5 && // if last digit is between 2 and 4
  String(count).substr(-2, 1) !== '1' // unless the 2nd to last digit is "1"
  ) {
      result = formatDistanceLocale$o[token].dual.replace('{{count}}', count);
    } else {
    result = formatDistanceLocale$o[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'za ' + result;
    } else {
      return 'prije ' + result;
    }
  }

  return result;
}

var dateFormats$r = {
  full: 'EEEE, d. MMMM y.',
  long: 'd. MMMM y.',
  medium: 'd. MMM y.',
  short: 'dd. MM. y.'
};
var timeFormats$r = {
  full: 'HH:mm:ss (zzzz)',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$r = {
  full: "{{date}} 'u' {{time}}",
  long: "{{date}} 'u' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$r = {
  date: buildFormatLongFn({
    formats: dateFormats$r,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$r,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$r,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$n = {
  lastWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'prošlu nedjelju u' p";

      case 3:
        return "'prošlu srijedu u' p";

      case 6:
        return "'prošlu subotu u' p";

      default:
        return "'prošli' EEEE 'u' p";
    }
  },
  yesterday: "'jučer u' p",
  today: "'danas u' p",
  tomorrow: "'sutra u' p",
  nextWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'iduću nedjelju u' p";

      case 3:
        return "'iduću srijedu u' p";

      case 6:
        return "'iduću subotu u' p";

      default:
        return "'prošli' EEEE 'u' p";
    }
  },
  other: 'P'
};
function formatRelative$n(token, date, _baseDate, _options) {
  var format = formatRelativeLocale$n[token];

  if (typeof format === 'function') {
    return format(date);
  }

  return format;
}

function ordinalNumber$n(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number).concat('.');
}

var eraValues$n = {
  narrow: ['pr.n.e.', 'AD'],
  abbreviated: ['pr. Kr.', 'po. Kr.'],
  wide: ['Prije Krista', 'Poslije Krista']
};
var monthValues$n = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj', 'lis', 'stu', 'pro'],
  wide: ['siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj', 'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac']
};
var formattingMonthValues$4 = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj', 'lis', 'stu', 'pro'],
  wide: ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenog', 'prosinca']
};
var quarterValues$n = {
  narrow: ['1.', '2.', '3.', '4.'],
  abbreviated: ['1. kv.', '2. kv.', '3. kv.', '4. kv.'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var dayValues$n = {
  narrow: ['N', 'P', 'U', 'S', 'Č', 'P', 'S'],
  short: ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'],
  abbreviated: ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'],
  wide: ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
};
var formattingDayPeriodValues$i = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'popodne',
    evening: 'navečer',
    night: 'noću'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'popodne',
    evening: 'navečer',
    night: 'noću'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'poslije podne',
    evening: 'navečer',
    night: 'noću'
  }
};
var dayPeriodValues$n = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'popodne',
    evening: 'navečer',
    night: 'noću'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'popodne',
    evening: 'navečer',
    night: 'noću'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutro',
    afternoon: 'poslije podne',
    evening: 'navečer',
    night: 'noću'
  }
};
var localize$n = {
  ordinalNumber: ordinalNumber$n,
  era: buildLocalizeFn({
    values: eraValues$n,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$n,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$n,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$4,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$n,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$n,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$i,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$n = /^(\d+)\./i;
var parseOrdinalNumberPattern$n = /\d+/i;
var matchEraPatterns$n = {
  narrow: /^(pr\.n\.e\.|AD)/i,
  abbreviated: /^(pr\.\s?Kr\.|po\.\s?Kr\.)/i,
  wide: /^(Prije Krista|prije nove ere|Poslije Krista|nova era)/i
};
var parseEraPatterns$n = {
  any: [/^pr/i, /^(po|nova)/i]
};
var matchQuarterPatterns$n = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]\.\s?kv\.?/i,
  wide: /^[1234]\. kvartal/i
};
var parseQuarterPatterns$n = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$n = {
  narrow: /^(10|11|12|[123456789])\./i,
  abbreviated: /^(sij|velj|(ožu|ozu)|tra|svi|lip|srp|kol|ruj|lis|stu|pro)/i,
  wide: /^((siječanj|siječnja|sijecanj|sijecnja)|(veljača|veljače|veljaca|veljace)|(ožujak|ožujka|ozujak|ozujka)|(travanj|travnja)|(svibanj|svibnja)|(lipanj|lipnja)|(srpanj|srpnja)|(kolovoz|kolovoza)|(rujan|rujna)|(listopad|listopada)|(studeni|studenog)|(prosinac|prosinca))/i
};
var parseMonthPatterns$n = {
  narrow: [/(10|11|12|[123456789])/i],
  abbreviated: [/^sij/i, /^velj/i, /^(ožu|ozu)/i, /^tra/i, /^svi/i, /^lip/i, /^srp/i, /^kol/i, /^ruj/i, /^lis/i, /^stu/i, /^pro/i],
  wide: [/^sij/i, /^velj/i, /^(ožu|ozu)/i, /^tra/i, /^svi/i, /^lip/i, /^srp/i, /^kol/i, /^ruj/i, /^lis/i, /^stu/i, /^pro/i]
};
var matchDayPatterns$n = {
  narrow: /^[npusčc]/i,
  short: /^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
  abbreviated: /^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
  wide: /^(nedjelja|ponedjeljak|utorak|srijeda|(četvrtak|cetvrtak)|petak|subota)/i
};
var parseDayPatterns$n = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns$n = {
  any: /^(am|pm|ponoc|ponoć|(po)?podne|navecer|navečer|noću|poslije podne|ujutro)/i
};
var parseDayPeriodPatterns$n = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^pono/i,
    noon: /^pod/i,
    morning: /jutro/i,
    afternoon: /(poslije\s|po)+podne/i,
    evening: /(navece|naveče)/i,
    night: /(nocu|noću)/i
  }
};
var match$n = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$n,
    parsePattern: parseOrdinalNumberPattern$n,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$n,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$n,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$n,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$n,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$n,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$n,
    defaultParseWidth: 'wide'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$n,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$n,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$n,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$n,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Croatian locale.
 * @language Croatian
 * @iso-639-2 hrv
 * @author Matija Marohnić [@silvenon]{@link https://github.com/silvenon}
 * @author Manico [@manico]{@link https://github.com/manico}
 * @author Ivan Jeržabek [@jerzabek]{@link https://github.com/jerzabek}
 */

var locale$r = {
  code: 'hr',
  formatDistance: formatDistance$o,
  formatLong: formatLong$r,
  formatRelative: formatRelative$n,
  localize: localize$n,
  match: match$n,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var translations = {
  about: 'körülbelül',
  over: 'több mint',
  almost: 'majdnem',
  lessthan: 'kevesebb mint'
};

function translate(number, addSuffix, key, comparison) {
  var num = number;

  switch (key) {
    case 'xseconds':
      if (comparison === -1 && addSuffix) return num + ' másodperccel ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' másodperce';
      if (comparison === 1) return num + ' másodperc múlva';
      return num + ' másodperc';

    case 'halfaminute':
      if (comparison === -1 && addSuffix) return 'fél perccel ezelőtt';
      if (comparison === -1 && !addSuffix) return 'fél perce';
      if (comparison === 1) return 'fél perc múlva';
      return 'fél perc';

    case 'xminutes':
      if (comparison === -1 && addSuffix) return num + ' perccel ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' perce';
      if (comparison === 1) return num + ' perc múlva';
      return num + ' perc';

    case 'xhours':
      if (comparison === -1 && addSuffix) return num + ' órával ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' órája';
      if (comparison === 1) return num + ' óra múlva';
      return num + ' óra';

    case 'xdays':
      if (comparison === -1 && addSuffix) return num + ' nappal ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' napja';
      if (comparison === 1) return num + ' nap múlva';
      return num + ' nap';

    case 'xmonths':
      if (comparison === -1 && addSuffix) return num + ' hónappal ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' hónapja';
      if (comparison === 1) return num + ' hónap múlva';
      return num + ' hónap';

    case 'xyears':
      if (comparison === -1 && addSuffix) return num + ' évvel ezelőtt';
      if (comparison === -1 && !addSuffix) return num + ' éve';
      if (comparison === 1) return num + ' év múlva';
      return num + ' év';
  }

  return '';
}

function formatDistance$p(token, count, options) {
  options = options || {};
  var adverb = token.match(/about|over|almost|lessthan/i);
  var unit = token.replace(adverb, '');
  var result;
  result = translate(count, options.addSuffix, unit.toLowerCase(), options.comparison);

  if (adverb) {
    result = translations[adverb[0].toLowerCase()] + ' ' + result;
  }

  return result;
}

var dateFormats$s = {
  full: 'y. MMMM d., EEEE',
  long: 'y. MMMM d.',
  medium: 'y. MMM d.',
  short: 'y. MM. dd.'
};
var timeFormats$s = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$s = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$s = {
  date: buildFormatLongFn({
    formats: dateFormats$s,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$s,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$s,
    defaultWidth: 'full'
  })
};

var accusativeWeekdays$2 = ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'];

function week(isFuture) {
  return function (date, _baseDate, _options) {
    var day = date.getUTCDay();
    return (isFuture ? '' : "'múlt' ") + "'" + accusativeWeekdays$2[day] + "'" + " p'-kor'";
  };
}

var formatRelativeLocale$o = {
  lastWeek: week(false),
  yesterday: "'tegnap' p'-kor'",
  today: "'ma' p'-kor'",
  tomorrow: "'holnap' p'-kor'",
  nextWeek: week(true),
  other: 'P'
};
function formatRelative$o(token, date, baseDate, options) {
  var format = formatRelativeLocale$o[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$o = {
  narrow: ['ie.', 'isz.'],
  abbreviated: ['i. e.', 'i. sz.'],
  wide: ['Krisztus előtt', 'időszámításunk szerint']
};
var quarterValues$o = {
  narrow: ['1.', '2.', '3.', '4.'],
  abbreviated: ['1. n.év', '2. n.év', '3. n.év', '4. n.év'],
  wide: ['1. negyedév', '2. negyedév', '3. negyedév', '4. negyedév']
};
var formattingQuarterValues = {
  narrow: ['I.', 'II.', 'III.', 'IV.'],
  abbreviated: ['I. n.év', 'II. n.év', 'III. n.év', 'IV. n.év'],
  wide: ['I. negyedév', 'II. negyedév', 'III. negyedév', 'IV. negyedév']
};
var monthValues$o = {
  narrow: ['J', 'F', 'M', 'Á', 'M', 'J', 'J', 'A', 'Sz', 'O', 'N', 'D'],
  abbreviated: ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'],
  wide: ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']
};
var dayValues$o = {
  narrow: ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'],
  short: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
  abbreviated: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
  wide: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
};
var dayPeriodValues$o = {
  narrow: {
    am: 'de.',
    pm: 'du.',
    midnight: 'éjfél',
    noon: 'dél',
    morning: 'reggel',
    afternoon: 'du.',
    evening: 'este',
    night: 'éjjel'
  },
  abbreviated: {
    am: 'de.',
    pm: 'du.',
    midnight: 'éjfél',
    noon: 'dél',
    morning: 'reggel',
    afternoon: 'du.',
    evening: 'este',
    night: 'éjjel'
  },
  wide: {
    am: 'de.',
    pm: 'du.',
    midnight: 'éjfél',
    noon: 'dél',
    morning: 'reggel',
    afternoon: 'délután',
    evening: 'este',
    night: 'éjjel'
  }
};

function ordinalNumber$o(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$o = {
  ordinalNumber: ordinalNumber$o,
  era: buildLocalizeFn({
    values: eraValues$o,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$o,
    defaultWidth: 'wide',
    formattingValues: formattingQuarterValues,
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$o,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$o,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$o,
    defaultWidth: 'wide',
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$o = /^(\d+)\.?/i;
var parseOrdinalNumberPattern$o = /\d+/i;
var matchEraPatterns$o = {
  narrow: /^(ie\.|isz\.)/i,
  abbreviated: /^(i\.\s?e\.?|b?\s?c\s?e|i\.\s?sz\.?)/i,
  wide: /^(Krisztus előtt|időszámításunk előtt|időszámításunk szerint|i\. sz\.)/i
};
var parseEraPatterns$o = {
  narrow: [/ie/i, /isz/i],
  abbreviated: [/^(i\.?\s?e\.?|b\s?ce)/i, /^(i\.?\s?sz\.?|c\s?e)/i],
  any: [/előtt/i, /(szerint|i. sz.)/i]
};
var matchQuarterPatterns$o = {
  narrow: /^[1234]\.?/i,
  abbreviated: /^[1234]?\.?\s?n\.év/i,
  wide: /^([1234]|I|II|III|IV)?\.?\s?negyedév/i
};
var parseQuarterPatterns$o = {
  any: [/1|I$/i, /2|II$/i, /3|III/i, /4|IV/i]
};
var matchMonthPatterns$o = {
  narrow: /^[jfmaásond]|sz/i,
  abbreviated: /^(jan\.?|febr\.?|márc\.?|ápr\.?|máj\.?|jún\.?|júl\.?|aug\.?|szept\.?|okt\.?|nov\.?|dec\.?)/i,
  wide: /^(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)/i
};
var parseMonthPatterns$o = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a|á/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s|sz/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^már/i, /^áp/i, /^máj/i, /^jún/i, /^júl/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$o = {
  narrow: /^([vhkpc]|sz|cs|sz)/i,
  short: /^([vhkp]|sze|cs|szo)/i,
  abbreviated: /^([vhkp]|sze|cs|szo)/i,
  wide: /^(vasárnap|hétfő|kedd|szerda|csütörtök|péntek|szombat)/i
};
var parseDayPatterns$o = {
  narrow: [/^v/i, /^h/i, /^k/i, /^sz/i, /^c/i, /^p/i, /^sz/i],
  any: [/^v/i, /^h/i, /^k/i, /^sze/i, /^c/i, /^p/i, /^szo/i]
};
var matchDayPeriodPatterns$o = {
  any: /^((de|du)\.?|éjfél|délután|dél|reggel|este|éjjel)/i
};
var parseDayPeriodPatterns$o = {
  any: {
    am: /^de\.?/i,
    pm: /^du\.?/i,
    midnight: /^éjf/i,
    noon: /^dé/i,
    morning: /reg/i,
    afternoon: /^délu\.?/i,
    evening: /es/i,
    night: /éjj/i
  }
};
var match$o = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$o,
    parsePattern: parseOrdinalNumberPattern$o,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$o,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$o,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$o,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$o,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$o,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$o,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$o,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$o,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$o,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$o,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 *
 * @summary Hungarian locale.
 * @language Hungarian
 *
 * @iso-639-2 hun
 *
 * @author Pavlo Shpak [@pshpak]{@link https://github.com/pshpak}
 * @author Eduardo Pardo [@eduardopsll]{@link https://github.com/eduardopsll}
 * @author Zoltan Szepesi [@twodcube]{@link https://github.com/twodcube}
 */

var locale$s = {
  code: 'hu',
  formatDistance: formatDistance$p,
  formatLong: formatLong$s,
  formatRelative: formatRelative$o,
  localize: localize$o,
  match: match$o,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$p = {
  lessThanXSeconds: {
    one: 'ավելի քիչ քան 1 վայրկյան',
    other: 'ավելի քիչ քան {{count}} վայրկյան'
  },
  xSeconds: {
    one: '1 վայրկյան',
    other: '{{count}} վայրկյան'
  },
  halfAMinute: 'կես րոպե',
  lessThanXMinutes: {
    one: 'ավելի քիչ քան 1 րոպե',
    other: 'ավելի քիչ քան {{count}} րոպե'
  },
  xMinutes: {
    one: '1 րոպե',
    other: '{{count}} րոպե'
  },
  aboutXHours: {
    one: 'մոտ 1 ժամ',
    other: 'մոտ {{count}} ժամ'
  },
  xHours: {
    one: '1 ժամ',
    other: '{{count}} ժամ'
  },
  xDays: {
    one: '1 օր',
    other: '{{count}} օր'
  },
  aboutXMonths: {
    one: 'մոտ 1 ամիս',
    other: 'մոտ {{count}} ամիս'
  },
  xMonths: {
    one: '1 ամիս',
    other: '{{count}} ամիս'
  },
  aboutXYears: {
    one: 'մոտ 1 տարի',
    other: 'մոտ {{count}} տարի'
  },
  xYears: {
    one: '1 տարի',
    other: '{{count}} տարի'
  },
  overXYears: {
    one: 'ավելի քան 1 տարի',
    other: 'ավելի քան {{count}} տարի'
  },
  almostXYears: {
    one: 'համարյա 1 տարի',
    other: 'համարյա {{count}} տարի'
  }
};
function formatDistance$q(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$p[token] === 'string') {
    result = formatDistanceLocale$p[token];
  } else if (count === 1) {
    result = formatDistanceLocale$p[token].one;
  } else {
    result = formatDistanceLocale$p[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' հետո';
    } else {
      return result + ' առաջ';
    }
  }

  return result;
}

var dateFormats$t = {
  full: 'd MMMM, y, EEEE',
  long: 'd MMMM, y',
  medium: 'd MMM, y',
  short: 'dd.MM.yyyy'
};
var timeFormats$t = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$t = {
  full: "{{date}} 'ժ․'{{time}}",
  long: "{{date}} 'ժ․'{{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$t = {
  date: buildFormatLongFn({
    formats: dateFormats$t,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$t,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$t,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$p = {
  lastWeek: "'նախորդ' eeee p'֊ին'",
  yesterday: "'երեկ' p'֊ին'",
  today: "'այսօր' p'֊ին'",
  tomorrow: "'վաղը' p'֊ին'",
  nextWeek: "'հաջորդ' eeee p'֊ին'",
  other: 'P'
};
function formatRelative$p(token, _date, _baseDate, _options) {
  return formatRelativeLocale$p[token];
}

var eraValues$p = {
  narrow: ['Ք', 'Մ'],
  abbreviated: ['ՔԱ', 'ՄԹ'],
  wide: ['Քրիստոսից առաջ', 'Մեր թվարկության']
};
var quarterValues$p = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Ք1', 'Ք2', 'Ք3', 'Ք4'],
  wide: ['1֊ին քառորդ', '2֊րդ քառորդ', '3֊րդ քառորդ', '4֊րդ քառորդ']
};
var monthValues$p = {
  narrow: ['Հ', 'Փ', 'Մ', 'Ա', 'Մ', 'Հ', 'Հ', 'Օ', 'Ս', 'Հ', 'Ն', 'Դ'],
  abbreviated: ['հուն', 'փետ', 'մար', 'ապր', 'մայ', 'հուն', 'հուլ', 'օգս', 'սեպ', 'հոկ', 'նոյ', 'դեկ'],
  wide: ['հունվար', 'փետրվար', 'մարտ', 'ապրիլ', 'մայիս', 'հունիս', 'հուլիս', 'օգոստոս', 'սեպտեմբեր', 'հոկտեմբեր', 'նոյեմբեր', 'դեկտեմբեր']
};
var dayValues$p = {
  narrow: ['Կ', 'Ե', 'Ե', 'Չ', 'Հ', 'Ո', 'Շ'],
  short: ['կր', 'եր', 'եք', 'չք', 'հգ', 'ուր', 'շբ'],
  abbreviated: ['կիր', 'երկ', 'երք', 'չոր', 'հնգ', 'ուրբ', 'շաբ'],
  wide: ['կիրակի', 'երկուշաբթի', 'երեքշաբթի', 'չորեքշաբթի', 'հինգշաբթի', 'ուրբաթ', 'շաբաթ']
};
var dayPeriodValues$p = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'կեսգշ',
    noon: 'կեսօր',
    morning: 'առավոտ',
    afternoon: 'ցերեկ',
    evening: 'երեկո',
    night: 'գիշեր'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'կեսգիշեր',
    noon: 'կեսօր',
    morning: 'առավոտ',
    afternoon: 'ցերեկ',
    evening: 'երեկո',
    night: 'գիշեր'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'կեսգիշեր',
    noon: 'կեսօր',
    morning: 'առավոտ',
    afternoon: 'ցերեկ',
    evening: 'երեկո',
    night: 'գիշեր'
  }
};
var formattingDayPeriodValues$j = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'կեսգշ',
    noon: 'կեսօր',
    morning: 'առավոտը',
    afternoon: 'ցերեկը',
    evening: 'երեկոյան',
    night: 'գիշերը'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'կեսգիշերին',
    noon: 'կեսօրին',
    morning: 'առավոտը',
    afternoon: 'ցերեկը',
    evening: 'երեկոյան',
    night: 'գիշերը'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'կեսգիշերին',
    noon: 'կեսօրին',
    morning: 'առավոտը',
    afternoon: 'ցերեկը',
    evening: 'երեկոյան',
    night: 'գիշերը'
  }
};

function ordinalNumber$p(dirtyNumber, _dirtyOptions) {
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

  if (rem100 < 10) {
    if (rem100 % 10 === 1) {
      return number + '֊ին';
    }
  }

  return number + '֊րդ';
}

var localize$p = {
  ordinalNumber: ordinalNumber$p,
  era: buildLocalizeFn({
    values: eraValues$p,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$p,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$p,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$p,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$p,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$j,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$p = /^(\d+)((-|֊)?(ին|րդ))?/i;
var parseOrdinalNumberPattern$p = /\d+/i;
var matchEraPatterns$p = {
  narrow: /^(Ք|Մ)/i,
  abbreviated: /^(Ք\.?\s?Ա\.?|Մ\.?\s?Թ\.?\s?Ա\.?|Մ\.?\s?Թ\.?|Ք\.?\s?Հ\.?)/i,
  wide: /^(քրիստոսից առաջ|մեր թվարկությունից առաջ|մեր թվարկության|քրիստոսից հետո)/i
};
var parseEraPatterns$p = {
  any: [/^(ք|մ)/i]
};
var matchQuarterPatterns$p = {
  narrow: /^[1234]/i,
  abbreviated: /^ք[1234]/i,
  wide: /^[1234]((-|֊)?(ին|րդ)) քառորդ/i
};
var parseQuarterPatterns$p = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$p = {
  narrow: /^[հփմաօսնդ]/i,
  abbreviated: /^(հուն|փետ|մար|ապր|մայ|հուն|հուլ|օգս|սեպ|հոկ|նոյ|դեկ)/i,
  wide: /^(հունվար|փետրվար|մարտ|ապրիլ|մայիս|հունիս|հուլիս|օգոստոս|սեպտեմբեր|հոկտեմբեր|նոյեմբեր|դեկտեմբեր)/i
};
var parseMonthPatterns$p = {
  narrow: [/^հ/i, /^փ/i, /^մ/i, /^ա/i, /^մ/i, /^հ/i, /^հ/i, /^օ/i, /^ս/i, /^հ/i, /^ն/i, /^դ/i],
  any: [/^հու/i, /^փ/i, /^մար/i, /^ա/i, /^մայ/i, /^հուն/i, /^հուլ/i, /^օ/i, /^ս/i, /^հոկ/i, /^ն/i, /^դ/i]
};
var matchDayPatterns$p = {
  narrow: /^[եչհոշկ]/i,
  short: /^(կր|եր|եք|չք|հգ|ուր|շբ)/i,
  abbreviated: /^(կիր|երկ|երք|չոր|հնգ|ուրբ|շաբ)/i,
  wide: /^(կիրակի|երկուշաբթի|երեքշաբթի|չորեքշաբթի|հինգշաբթի|ուրբաթ|շաբաթ)/i
};
var parseDayPatterns$p = {
  narrow: [/^կ/i, /^ե/i, /^ե/i, /^չ/i, /^հ/i, /^(ո|Ո)/, /^շ/i],
  short: [/^կ/i, /^եր/i, /^եք/i, /^չ/i, /^հ/i, /^(ո|Ո)/, /^շ/i],
  abbreviated: [/^կ/i, /^երկ/i, /^երք/i, /^չ/i, /^հ/i, /^(ո|Ո)/, /^շ/i],
  wide: [/^կ/i, /^երկ/i, /^երե/i, /^չ/i, /^հ/i, /^(ո|Ո)/, /^շ/i]
};
var matchDayPeriodPatterns$p = {
  narrow: /^([ap]|կեսգշ|կեսօր|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i,
  any: /^([ap]\.?\s?m\.?|կեսգիշեր(ին)?|կեսօր(ին)?|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i
};
var parseDayPeriodPatterns$p = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /կեսգիշեր/i,
    noon: /կեսօր/i,
    morning: /առավոտ/i,
    afternoon: /ցերեկ/i,
    evening: /երեկո/i,
    night: /գիշեր/i
  }
};
var match$p = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$p,
    parsePattern: parseOrdinalNumberPattern$p,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$p,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$p,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$p,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$p,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$p,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$p,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$p,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$p,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$p,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$p,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Armenian locale
 * @language Armenian
 * @iso-639-2 arm
 * @author Alex Igityan [@alexigityan]{@link https://github.com/alexigityan}
 */

var locale$t = {
  code: 'hy',
  formatDistance: formatDistance$q,
  formatLong: formatLong$t,
  formatRelative: formatRelative$p,
  localize: localize$p,
  match: match$p,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$q = {
  lessThanXSeconds: {
    one: 'kurang dari 1 detik',
    other: 'kurang dari {{count}} detik'
  },
  xSeconds: {
    one: '1 detik',
    other: '{{count}} detik'
  },
  halfAMinute: 'setengah menit',
  lessThanXMinutes: {
    one: 'kurang dari 1 menit',
    other: 'kurang dari {{count}} menit'
  },
  xMinutes: {
    one: '1 menit',
    other: '{{count}} menit'
  },
  aboutXHours: {
    one: 'sekitar 1 jam',
    other: 'sekitar {{count}} jam'
  },
  xHours: {
    one: '1 jam',
    other: '{{count}} jam'
  },
  xDays: {
    one: '1 hari',
    other: '{{count}} hari'
  },
  aboutXMonths: {
    one: 'sekitar 1 bulan',
    other: 'sekitar {{count}} bulan'
  },
  xMonths: {
    one: '1 bulan',
    other: '{{count}} bulan'
  },
  aboutXYears: {
    one: 'sekitar 1 tahun',
    other: 'sekitar {{count}} tahun'
  },
  xYears: {
    one: '1 tahun',
    other: '{{count}} tahun'
  },
  overXYears: {
    one: 'lebih dari 1 tahun',
    other: 'lebih dari {{count}} tahun'
  },
  almostXYears: {
    one: 'hampir 1 tahun',
    other: 'hampir {{count}} tahun'
  }
};
function formatDistance$r(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$q[token] === 'string') {
    result = formatDistanceLocale$q[token];
  } else if (count === 1) {
    result = formatDistanceLocale$q[token].one;
  } else {
    result = formatDistanceLocale$q[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'dalam waktu ' + result;
    } else {
      return result + ' yang lalu';
    }
  }

  return result;
}

var dateFormats$u = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'd/M/yyyy'
};
var timeFormats$u = {
  full: 'HH.mm.ss',
  long: 'HH.mm.ss',
  medium: 'HH.mm',
  short: 'HH.mm'
};
var dateTimeFormats$u = {
  full: "{{date}} 'pukul' {{time}}",
  long: "{{date}} 'pukul' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$u = {
  date: buildFormatLongFn({
    formats: dateFormats$u,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$u,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$u,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$q = {
  lastWeek: "eeee 'lalu pukul' p",
  yesterday: "'Kemarin pukul' p",
  today: "'Hari ini pukul' p",
  tomorrow: "'Besok pukul' p",
  nextWeek: "eeee 'pukul' p",
  other: 'P'
};
function formatRelative$q(token, _date, _baseDate, _options) {
  return formatRelativeLocale$q[token];
}

// https://www.unicode.org/cldr/charts/32/summary/id.html

var eraValues$q = {
  narrow: ['SM', 'M'],
  abbreviated: ['SM', 'M'],
  wide: ['Sebelum Masehi', 'Masehi']
};
var quarterValues$q = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['K1', 'K2', 'K3', 'K4'],
  wide: ['Kuartal ke-1', 'Kuartal ke-2', 'Kuartal ke-3', 'Kuartal ke-4'] // Note: in Indonesian, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$q = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
  wide: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
};
var dayValues$q = {
  narrow: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
  short: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  abbreviated: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  wide: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
};
var dayPeriodValues$q = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  }
};
var formattingDayPeriodValues$k = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'siang',
    evening: 'sore',
    night: 'malam'
  }
};

function ordinalNumber$q(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // Can't use "pertama", "kedua" because can't be parsed

  switch (number) {
    default:
      return 'ke-' + number;
  }
}

var localize$q = {
  ordinalNumber: ordinalNumber$q,
  era: buildLocalizeFn({
    values: eraValues$q,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$q,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$q,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$q,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$q,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$k,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$q = /^ke-(\d+)?/i;
var parseOrdinalNumberPattern$q = /\d+/i;
var matchEraPatterns$q = {
  narrow: /^(sm|m)/i,
  abbreviated: /^(s\.?\s?m\.?|s\.?\s?e\.?\s?u\.?|m\.?|e\.?\s?u\.?)/i,
  wide: /^(sebelum masehi|sebelum era umum|masehi|era umum)/i
};
var parseEraPatterns$q = {
  any: [/^s/i, /^(m|e)/i]
};
var matchQuarterPatterns$q = {
  narrow: /^[1234]/i,
  abbreviated: /^K-?\s[1234]/i,
  wide: /^Kuartal ke-?\s?[1234]/i
};
var parseQuarterPatterns$q = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$q = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|mei|jun|jul|agt|sep|okt|nov|des)/i,
  wide: /^(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i
};
var parseMonthPatterns$q = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^ma/i, /^ap/i, /^me/i, /^jun/i, /^jul/i, /^ag/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$q = {
  narrow: /^[srkjm]/i,
  short: /^(min|sen|sel|rab|kam|jum|sab)/i,
  abbreviated: /^(min|sen|sel|rab|kam|jum|sab)/i,
  wide: /^(minggu|senin|selasa|rabu|kamis|jumat|sabtu)/i
};
var parseDayPatterns$q = {
  narrow: [/^m/i, /^s/i, /^s/i, /^r/i, /^k/i, /^j/i, /^s/i],
  any: [/^m/i, /^sen/i, /^sel/i, /^r/i, /^k/i, /^j/i, /^sa/i]
};
var matchDayPeriodPatterns$q = {
  narrow: /^(a|p|tengah m|tengah h|(di(\swaktu)?) (pagi|siang|sore|malam))/i,
  any: /^([ap]\.?\s?m\.?|tengah malam|tengah hari|(di(\swaktu)?) (pagi|siang|sore|malam))/i
};
var parseDayPeriodPatterns$q = {
  any: {
    am: /^a/i,
    pm: /^pm/i,
    midnight: /^tengah m/i,
    noon: /^tengah h/i,
    morning: /pagi/i,
    afternoon: /siang/i,
    evening: /sore/i,
    night: /malam/i
  }
};
var match$q = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$q,
    parsePattern: parseOrdinalNumberPattern$q,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$q,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$q,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$q,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$q,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$q,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$q,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Indonesian locale.
 * @language Indonesian
 * @iso-639-2 ind
 * @author Rahmat Budiharso [@rbudiharso]{@link https://github.com/rbudiharso}
 * @author Benget Nata [@bentinata]{@link https://github.com/bentinata}
 * @author Budi Irawan [@deerawan]{@link https://github.com/deerawan}
 * @author Try Ajitiono [@imballinst]{@link https://github.com/imballinst}
 */

var locale$u = {
  code: 'id',
  formatDistance: formatDistance$r,
  formatLong: formatLong$u,
  formatRelative: formatRelative$q,
  localize: localize$q,
  match: match$q,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$r = {
  lessThanXSeconds: {
    one: 'minna en 1 sekúnda',
    other: 'minna en {{count}} sekúndur'
  },
  xSeconds: {
    one: '1 sekúnda',
    other: '{{count}} sekúndur'
  },
  halfAMinute: 'hálf mínúta',
  lessThanXMinutes: {
    one: 'minna en 1 mínúta',
    other: 'minna en {{count}} mínútur'
  },
  xMinutes: {
    one: '1 mínúta',
    other: '{{count}} mínútur'
  },
  aboutXHours: {
    one: 'u.þ.b. 1 klukkustund',
    other: 'u.þ.b. {{count}} klukkustundir'
  },
  xHours: {
    one: '1 klukkustund',
    other: '{{count}} klukkustundir'
  },
  xDays: {
    one: '1 dagur',
    other: '{{count}} dagar'
  },
  aboutXMonths: {
    one: 'u.þ.b. 1 mánuður',
    other: 'u.þ.b. {{count}} mánuðir'
  },
  xMonths: {
    one: '1 mánuður',
    other: '{{count}} mánuðir'
  },
  aboutXYears: {
    one: 'u.þ.b. 1 ár',
    other: 'u.þ.b. {{count}} ár'
  },
  xYears: {
    one: '1 ár',
    other: '{{count}} ár'
  },
  overXYears: {
    one: 'meira en 1 ár',
    other: 'meira en {{count}} ár'
  },
  almostXYears: {
    one: 'næstum 1 ár',
    other: 'næstum {{count}} ár'
  }
};
function formatDistance$s(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$r[token] === 'string') {
    result = formatDistanceLocale$r[token];
  } else if (count === 1) {
    result = formatDistanceLocale$r[token].one;
  } else {
    result = formatDistanceLocale$r[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'í ' + result;
    } else {
      return result + ' síðan';
    }
  }

  return result;
}

var dateFormats$v = {
  full: 'EEEE, do MMMM y',
  long: 'do MMMM y',
  medium: 'do MMM y',
  short: 'd.MM.y'
};
var timeFormats$v = {
  full: "'kl'. HH:mm:ss zzzz",
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$v = {
  full: "{{date}} 'kl.' {{time}}",
  long: "{{date}} 'kl.' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$v = {
  date: buildFormatLongFn({
    formats: dateFormats$v,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$v,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$v,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$r = {
  lastWeek: "'síðasta' dddd 'kl.' p",
  yesterday: "'í gær kl.' p",
  today: "'í dag kl.' p",
  tomorrow: "'á morgun kl.' p",
  nextWeek: "dddd 'kl.' p",
  other: 'L'
};
function formatRelative$r(token, _date, _baseDate, _options) {
  return formatRelativeLocale$r[token];
}

var eraValues$r = {
  narrow: ['f.Kr.', 'e.Kr.'],
  abbreviated: ['f.Kr.', 'e.Kr.'],
  wide: ['fyrir Krist', 'eftir Krist']
};
var quarterValues$r = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1F', '2F', '3F', '4F'],
  wide: ['1. fjórðungur', '2. fjórðungur', '3. fjórðungur', '4. fjórðungur']
};
var monthValues$r = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'Á', 'S', 'Ó', 'N', 'D'],
  abbreviated: ['jan.', 'feb.', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'sept.', 'okt.', 'nóv.', 'des.'],
  wide: ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember']
};
var dayValues$r = {
  narrow: ['S', 'M', 'Þ', 'M', 'F', 'F', 'L'],
  short: ['Su', 'Má', 'Þr', 'Mi', 'Fi', 'Fö', 'La'],
  abbreviated: ['sun.', 'mán.', 'þri.', 'mið.', 'fim.', 'fös.', 'lau'],
  wide: ['sunnudagur', 'mánudagur', 'þriðjudagur', 'miðvikudagur', 'fimmtudagur', 'föstudagur', 'laugardagur']
};
var dayPeriodValues$r = {
  narrow: {
    am: 'f',
    pm: 'e',
    midnight: 'miðnætti',
    noon: 'hádegi',
    morning: 'morgunn',
    afternoon: 'síðdegi',
    evening: 'kvöld',
    night: 'nótt'
  },
  abbreviated: {
    am: 'f.h.',
    pm: 'e.h.',
    midnight: 'miðnætti',
    noon: 'hádegi',
    morning: 'morgunn',
    afternoon: 'síðdegi',
    evening: 'kvöld',
    night: 'nótt'
  },
  wide: {
    am: 'fyrir hádegi',
    pm: 'eftir hádegi',
    midnight: 'miðnætti',
    noon: 'hádegi',
    morning: 'morgunn',
    afternoon: 'síðdegi',
    evening: 'kvöld',
    night: 'nótt'
  }
};
var formattingDayPeriodValues$l = {
  narrow: {
    am: 'f',
    pm: 'e',
    midnight: 'á miðnætti',
    noon: 'á hádegi',
    morning: 'að morgni',
    afternoon: 'síðdegis',
    evening: 'um kvöld',
    night: 'um nótt'
  },
  abbreviated: {
    am: 'f.h.',
    pm: 'e.h.',
    midnight: 'á miðnætti',
    noon: 'á hádegi',
    morning: 'að morgni',
    afternoon: 'síðdegis',
    evening: 'um kvöld',
    night: 'um nótt'
  },
  wide: {
    am: 'fyrir hádegi',
    pm: 'eftir hádegi',
    midnight: 'á miðnætti',
    noon: 'á hádegi',
    morning: 'að morgni',
    afternoon: 'síðdegis',
    evening: 'um kvöld',
    night: 'um nótt'
  }
};

function ordinalNumber$r(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$r = {
  ordinalNumber: ordinalNumber$r,
  era: buildLocalizeFn({
    values: eraValues$r,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$r,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$r,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$r,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$r,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$l,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$r = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern$r = /\d+/i;
var matchEraPatterns$r = {
  narrow: /^(f\.Kr\.|e\.Kr\.)/i,
  abbreviated: /^(f\.Kr\.|e\.Kr\.)/i,
  wide: /^(fyrir Krist|eftir Krist)/i
};
var parseEraPatterns$r = {
  any: [/^(f\.Kr\.|e\.Kr\.)/i]
};
var matchQuarterPatterns$r = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234] fjórðungur/i
};
var parseQuarterPatterns$r = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$r = {
  narrow: /^[jfmásónd]/i,
  abbreviated: /^(jan\.|feb\.|mars\.|apríl\.|maí|júní|júlí|águst|sep\.|oct\.|nov\.|dec\.)/i,
  wide: /^(januar|februar|mars|apríl|maí|júní|júlí|águst|september|október|nóvember|desember)/i
};
var parseMonthPatterns$r = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^á/i, /^s/i, /^ó/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^maí/i, /^jún/i, /^júl/i, /^áu/i, /^s/i, /^ó/i, /^n/i, /^d/i]
};
var matchDayPatterns$r = {
  narrow: /^[smtwf]/i,
  short: /^(su|má|þr|mi|fi|fö|la)/i,
  abbreviated: /^(sun|mán|þri|mið|fim|fös|lau)\.?/i,
  wide: /^(sunnudagur|mánudagur|þriðjudagur|miðvikudagur|fimmtudagur|föstudagur|laugardagur)/i
};
var parseDayPatterns$r = {
  narrow: [/^s/i, /^m/i, /^þ/i, /^m/i, /^f/i, /^f/i, /^l/i],
  any: [/^su/i, /^má/i, /^þr/i, /^mi/i, /^fi/i, /^fö/i, /^la/i]
};
var matchDayPeriodPatterns$r = {
  narrow: /^(f|e|síðdegis|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i,
  any: /^(fyrir hádegi|eftir hádegi|[ef]\.?h\.?|síðdegis|morgunn|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i
};
var parseDayPeriodPatterns$r = {
  any: {
    am: /^f/i,
    pm: /^e/i,
    midnight: /^mi/i,
    noon: /^há/i,
    morning: /morgunn/i,
    afternoon: /síðdegi/i,
    evening: /kvöld/i,
    night: /nótt/i
  }
};
var match$r = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$r,
    parsePattern: parseOrdinalNumberPattern$r,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$r,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$r,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$r,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$r,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$r,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$r,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$r,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$r,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$r,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$r,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Icelandic locale.
 * @language Icelandic
 * @iso-639-2 isl
 * @author Derek Blank [@derekblank]{@link https://github.com/derekblank}
 * @author Arnór Ýmir [@lamayg]{@link https://github.com/lamayg}
 */

var locale$v = {
  code: 'is',
  formatDistance: formatDistance$s,
  formatLong: formatLong$v,
  formatRelative: formatRelative$r,
  localize: localize$r,
  match: match$r,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$s = {
  lessThanXSeconds: {
    one: 'meno di un secondo',
    other: 'meno di {{count}} secondi'
  },
  xSeconds: {
    one: 'un secondo',
    other: '{{count}} secondi'
  },
  halfAMinute: 'alcuni secondi',
  lessThanXMinutes: {
    one: 'meno di un minuto',
    other: 'meno di {{count}} minuti'
  },
  xMinutes: {
    one: 'un minuto',
    other: '{{count}} minuti'
  },
  aboutXHours: {
    one: 'circa un\'ora',
    other: 'circa {{count}} ore'
  },
  xHours: {
    one: 'un\'ora',
    other: '{{count}} ore'
  },
  xDays: {
    one: 'un giorno',
    other: '{{count}} giorni'
  },
  aboutXMonths: {
    one: 'circa un mese',
    other: 'circa {{count}} mesi'
  },
  xMonths: {
    one: 'un mese',
    other: '{{count}} mesi'
  },
  aboutXYears: {
    one: 'circa un anno',
    other: 'circa {{count}} anni'
  },
  xYears: {
    one: 'un anno',
    other: '{{count}} anni'
  },
  overXYears: {
    one: 'più di un anno',
    other: 'più di {{count}} anni'
  },
  almostXYears: {
    one: 'quasi un anno',
    other: 'quasi {{count}} anni'
  }
};
function formatDistance$t(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$s[token] === 'string') {
    result = formatDistanceLocale$s[token];
  } else if (count === 1) {
    result = formatDistanceLocale$s[token].one;
  } else {
    result = formatDistanceLocale$s[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'tra ' + result;
    } else {
      return result + ' fa';
    }
  }

  return result;
}

var dateFormats$w = {
  full: 'EEEE d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'dd/MM/y'
};
var timeFormats$w = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$w = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$w = {
  date: buildFormatLongFn({
    formats: dateFormats$w,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$w,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$w,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$s = {
  lastWeek: "eeee 'scorso alle' p",
  yesterday: "'ieri alle' p",
  today: "'oggi alle' p",
  tomorrow: "'domani alle' p",
  nextWeek: "eeee 'alle' p",
  other: 'P'
};
function formatRelative$s(token, _date, _baseDate, _options) {
  return formatRelativeLocale$s[token];
}

var eraValues$s = {
  narrow: ['aC', 'dC'],
  abbreviated: ['a.C.', 'd.C.'],
  wide: ['avanti Cristo', 'dopo Cristo']
};
var quarterValues$s = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues$s = {
  narrow: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  wide: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
};
var dayValues$s = {
  narrow: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
  short: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  abbreviated: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  wide: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
};
var dayPeriodValues$s = {
  narrow: {
    am: 'm.',
    pm: 'p.',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'mattina',
    afternoon: 'pomeriggio',
    evening: 'sera',
    night: 'notte'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'mattina',
    afternoon: 'pomeriggio',
    evening: 'sera',
    night: 'notte'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'mattina',
    afternoon: 'pomeriggio',
    evening: 'sera',
    night: 'notte'
  }
};
var formattingDayPeriodValues$m = {
  narrow: {
    am: 'm.',
    pm: 'p.',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'di mattina',
    afternoon: 'del pomeriggio',
    evening: 'di sera',
    night: 'di notte'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'di mattina',
    afternoon: 'del pomeriggio',
    evening: 'di sera',
    night: 'di notte'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'mezzanotte',
    noon: 'mezzogiorno',
    morning: 'di mattina',
    afternoon: 'del pomeriggio',
    evening: 'di sera',
    night: 'di notte'
  }
};

function ordinalNumber$s(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + 'º';
}

var localize$s = {
  ordinalNumber: ordinalNumber$s,
  era: buildLocalizeFn({
    values: eraValues$s,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$s,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$s,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$s,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$s,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$m,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$s = /^(\d+)(º)?/i;
var parseOrdinalNumberPattern$s = /\d+/i;
var matchEraPatterns$s = {
  narrow: /^(aC|dC)/i,
  abbreviated: /^(a\.?\s?C\.?|a\.?\s?e\.?\s?v\.?|d\.?\s?C\.?|e\.?\s?v\.?)/i,
  wide: /^(avanti Cristo|avanti Era Volgare|dopo Cristo|Era Volgare)/i
};
var parseEraPatterns$s = {
  any: [/^a/i, /^(d|e)/i]
};
var matchQuarterPatterns$s = {
  narrow: /^[1234]/i,
  abbreviated: /^t[1234]/i,
  wide: /^[1234](º)? trimestre/i
};
var parseQuarterPatterns$s = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$s = {
  narrow: /^[gfmalsond]/i,
  abbreviated: /^(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/i,
  wide: /^(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i
};
var parseMonthPatterns$s = {
  narrow: [/^g/i, /^f/i, /^m/i, /^a/i, /^m/i, /^g/i, /^l/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ge/i, /^f/i, /^mar/i, /^ap/i, /^mag/i, /^gi/i, /^l/i, /^ag/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$s = {
  narrow: /^[dlmgvs]/i,
  short: /^(do|lu|ma|me|gi|ve|sa)/i,
  abbreviated: /^(dom|lun|mar|mer|gio|ven|sab)/i,
  wide: /^(domenica|luned[i|ì]|marted[i|ì]|mercoled[i|ì]|gioved[i|ì]|venerd[i|ì]|sabato)/i
};
var parseDayPatterns$s = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^g/i, /^v/i, /^s/i],
  any: [/^d/i, /^l/i, /^ma/i, /^me/i, /^g/i, /^v/i, /^s/i]
};
var matchDayPeriodPatterns$s = {
  narrow: /^(a|m\.|p|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i,
  any: /^([ap]\.?\s?m\.?|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i
};
var parseDayPeriodPatterns$s = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mezza/i,
    noon: /^mezzo/i,
    morning: /mattina/i,
    afternoon: /pomeriggio/i,
    evening: /sera/i,
    night: /notte/i
  }
};
var match$s = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$s,
    parsePattern: parseOrdinalNumberPattern$s,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$s,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$s,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$s,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$s,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$s,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$s,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$s,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$s,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$s,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$s,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Italian locale.
 * @language Italian
 * @iso-639-2 ita
 * @author Alberto Restifo [@albertorestifo]{@link https://github.com/albertorestifo}
 * @author Giovanni Polimeni [@giofilo]{@link https://github.com/giofilo}
 * @author Vincenzo Carrese [@vin-car]{@link https://github.com/vin-car}
 */

var locale$w = {
  code: 'it',
  formatDistance: formatDistance$t,
  formatLong: formatLong$w,
  formatRelative: formatRelative$s,
  localize: localize$s,
  match: match$s,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$t = {
  lessThanXSeconds: {
    one: '1秒未満',
    other: '{{count}}秒未満',
    oneWithSuffix: '約1秒',
    otherWithSuffix: '約{{count}}秒'
  },
  xSeconds: {
    one: '1秒',
    other: '{{count}}秒'
  },
  halfAMinute: '30秒',
  lessThanXMinutes: {
    one: '1分未満',
    other: '{{count}}分未満',
    oneWithSuffix: '約1分',
    otherWithSuffix: '約{{count}}分'
  },
  xMinutes: {
    one: '1分',
    other: '{{count}}分'
  },
  aboutXHours: {
    one: '約1時間',
    other: '約{{count}}時間'
  },
  xHours: {
    one: '1時間',
    other: '{{count}}時間'
  },
  xDays: {
    one: '1日',
    other: '{{count}}日'
  },
  aboutXMonths: {
    one: '約1か月',
    other: '約{{count}}か月'
  },
  xMonths: {
    one: '1か月',
    other: '{{count}}か月'
  },
  aboutXYears: {
    one: '約1年',
    other: '約{{count}}年'
  },
  xYears: {
    one: '1年',
    other: '{{count}}年'
  },
  overXYears: {
    one: '1年以上',
    other: '{{count}}年以上'
  },
  almostXYears: {
    one: '1年近く',
    other: '{{count}}年近く'
  }
};
function formatDistance$u(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$t[token] === 'string') {
    result = formatDistanceLocale$t[token];
  } else if (count === 1) {
    if (options.addSuffix && formatDistanceLocale$t[token].oneWithSuffix) {
      result = formatDistanceLocale$t[token].oneWithSuffix;
    } else {
      result = formatDistanceLocale$t[token].one;
    }
  } else {
    if (options.addSuffix && formatDistanceLocale$t[token].otherWithSuffix) {
      result = formatDistanceLocale$t[token].otherWithSuffix.replace('{{count}}', count);
    } else {
      result = formatDistanceLocale$t[token].other.replace('{{count}}', count);
    }
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + '後';
    } else {
      return result + '前';
    }
  }

  return result;
}

var dateFormats$x = {
  full: 'y年M月d日EEEE',
  long: 'y年M月d日',
  medium: 'y/MM/dd',
  short: 'y/MM/dd'
};
var timeFormats$x = {
  full: 'H時mm分ss秒 zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$x = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$x = {
  date: buildFormatLongFn({
    formats: dateFormats$x,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$x,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$x,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$t = {
  lastWeek: '先週のeeeeのp',
  yesterday: '昨日のp',
  today: '今日のp',
  tomorrow: '明日のp',
  nextWeek: '翌週のeeeeのp',
  other: 'P'
};
function formatRelative$t(token, _date, _baseDate, _options) {
  return formatRelativeLocale$t[token];
}

var eraValues$t = {
  narrow: ['BC', 'AC'],
  abbreviated: ['紀元前', '西暦'],
  wide: ['紀元前', '西暦']
};
var quarterValues$t = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['第1四半期', '第2四半期', '第3四半期', '第4四半期']
};
var monthValues$t = {
  narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  abbreviated: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  wide: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
};
var dayValues$t = {
  narrow: ['日', '月', '火', '水', '木', '金', '土'],
  short: ['日', '月', '火', '水', '木', '金', '土'],
  abbreviated: ['日', '月', '火', '水', '木', '金', '土'],
  wide: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
};
var dayPeriodValues$t = {
  narrow: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  },
  abbreviated: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  },
  wide: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  }
};
var formattingDayPeriodValues$n = {
  narrow: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  },
  abbreviated: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  },
  wide: {
    am: '午前',
    pm: '午後',
    midnight: '深夜',
    noon: '正午',
    morning: '朝',
    afternoon: '午後',
    evening: '夜',
    night: '深夜'
  }
};

function ordinalNumber$t(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number;
}

var localize$t = {
  ordinalNumber: ordinalNumber$t,
  era: buildLocalizeFn({
    values: eraValues$t,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$t,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$t,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$t,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$t,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$n,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$t = /^第?\d+/i;
var parseOrdinalNumberPattern$t = /\d+/i;
var matchEraPatterns$t = {
  narrow: /^(B\.?C\.?|A\.?D\.?)/i,
  abbreviated: /^(紀元[前後]|西暦)/i,
  wide: /^(紀元[前後]|西暦)/i
};
var parseEraPatterns$t = {
  narrow: [/^B/i, /^A/i],
  any: [/^(紀元前)/i, /^(西暦|紀元後)/i]
};
var matchQuarterPatterns$t = {
  narrow: /^[1234]/i,
  abbreviated: /^Q[1234]/i,
  wide: /^第[1234一二三四１２３４]四半期/i
};
var parseQuarterPatterns$t = {
  any: [/(1|一|１)/i, /(2|二|２)/i, /(3|三|３)/i, /(4|四|４)/i]
};
var matchMonthPatterns$t = {
  narrow: /^([123456789]|1[012])/,
  abbreviated: /^([123456789]|1[012])月/i,
  wide: /^([123456789]|1[012])月/i
};
var parseMonthPatterns$t = {
  any: [/^1/, /^2/, /^3/, /^4/, /^5/, /^6/, /^7/, /^8/, /^9/, /^10/, /^11/, /^12/]
};
var matchDayPatterns$t = {
  narrow: /^[日月火水木金土]/,
  short: /^[日月火水木金土]/,
  abbreviated: /^[日月火水木金土]/,
  wide: /^[日月火水木金土]曜日/
};
var parseDayPatterns$t = {
  any: [/^日/, /^月/, /^火/, /^水/, /^木/, /^金/, /^土/]
};
var matchDayPeriodPatterns$t = {
  any: /^(AM|PM|午前|午後|正午|深夜|真夜中|夜|朝)/i
};
var parseDayPeriodPatterns$t = {
  any: {
    am: /^(A|午前)/i,
    pm: /^(P|午後)/i,
    midnight: /^深夜|真夜中/i,
    noon: /^正午/i,
    morning: /^朝/i,
    afternoon: /^午後/i,
    evening: /^夜/i,
    night: /^深夜/i
  }
};
var match$t = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$t,
    parsePattern: parseOrdinalNumberPattern$t,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$t,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$t,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$t,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$t,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$t,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$t,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$t,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$t,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$t,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$t,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Japanese locale.
 * @language Japanese
 * @iso-639-2 jpn
 * @author Thomas Eilmsteiner [@DeMuu]{@link https://github.com/DeMuu}
 * @author Yamagishi Kazutoshi [@ykzts]{@link https://github.com/ykzts}
 * @author Luca Ban [@mesqueeb]{@link https://github.com/mesqueeb}
 */

var locale$x = {
  code: 'ja',
  formatDistance: formatDistance$u,
  formatLong: formatLong$x,
  formatRelative: formatRelative$t,
  localize: localize$t,
  match: match$t,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};
 // throw new Error('ja locale is currently unavailable. Please check the progress of converting this locale to v2.0.0 in this issue on Github: TBA')

var formatDistanceLocale$u = {
  lessThanXSeconds: {
    past: '{{count}} წამზე ნაკლები ხნის წინ',
    present: '{{count}} წამზე ნაკლები',
    future: '{{count}} წამზე ნაკლებში'
  },
  xSeconds: {
    past: '{{count}} წამის წინ',
    present: '{{count}} წამი',
    future: '{{count}} წამში'
  },
  halfAMinute: {
    past: 'ნახევარი წუთის წინ',
    present: 'ნახევარი წუთი',
    future: 'ნახევარი წუთში'
  },
  lessThanXMinutes: {
    past: '{{count}} წუთზე ნაკლები ხნის წინ',
    present: '{{count}} წუთზე ნაკლები',
    future: '{{count}} წუთზე ნაკლებში'
  },
  xMinutes: {
    past: '{{count}} წუთის წინ',
    present: '{{count}} წუთი',
    future: '{{count}} წუთში'
  },
  aboutXHours: {
    past: 'დაახლოებით {{count}} საათის წინ',
    present: 'დაახლოებით {{count}} საათი',
    future: 'დაახლოებით {{count}} საათში'
  },
  xHours: {
    past: '{{count}} საათის წინ',
    present: '{{count}} საათი',
    future: '{{count}} საათში'
  },
  xDays: {
    past: '{{count}} დღის წინ',
    present: '{{count}} დღე',
    future: '{{count}} დღეში'
  },
  aboutXMonths: {
    past: 'დაახლოებით {{count}} თვის წინ',
    present: 'დაახლოებით {{count}} თვე',
    future: 'დაახლოებით {{count}} თვეში'
  },
  xMonths: {
    past: '{{count}} თვის წინ',
    present: '{{count}} თვე',
    future: '{{count}} თვეში'
  },
  aboutXYears: {
    past: 'დაახლოებით {{count}} წლის წინ',
    present: 'დაახლოებით {{count}} წელი',
    future: 'დაახლოებით {{count}} წელში'
  },
  xYears: {
    past: '{{count}} წლის წინ',
    present: '{{count}} წელი',
    future: '{{count}} წელში'
  },
  overXYears: {
    past: '{{count}} წელზე მეტი ხნის წინ',
    present: '{{count}} წელზე მეტი',
    future: '{{count}} წელზე მეტი ხნის შემდეგ'
  },
  almostXYears: {
    past: 'თითქმის {{count}} წლის წინ',
    present: 'თითქმის {{count}} წელი',
    future: 'თითქმის {{count}} წელში'
  }
};
function formatDistance$v(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$u[token] === 'string') {
    result = formatDistanceLocale$u[token];
  } else if (options.addSuffix && options.comparison > 0) {
    result = formatDistanceLocale$u[token].future.replace('{{count}}', count);
  } else if (options.addSuffix && options.comparison <= 0) {
    result = formatDistanceLocale$u[token].past.replace('{{count}}', count);
  } else {
    result = formatDistanceLocale$u[token].present.replace('{{count}}', count);
  }

  return result;
}

var dateFormats$y = {
  full: 'EEEE, do MMMM, y',
  long: 'do, MMMM, y',
  medium: 'd, MMM, y',
  short: 'dd/MM/yyyy'
};
var timeFormats$y = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$y = {
  full: "{{date}} {{time}}'-ზე'",
  long: "{{date}} {{time}}'-ზე'",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$y = {
  date: buildFormatLongFn({
    formats: dateFormats$y,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$y,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$y,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$u = {
  lastWeek: "'წინა' eeee LT'-ზე'",
  yesterday: "'გუშინ' LT'-ზე'",
  today: "'დღეს' LT'-ზე'",
  tomorrow: "'ხვალ' LT'-ზე'",
  nextWeek: "'შემდეგი' eeee LT'-ზე'",
  other: 'L'
};
function formatRelative$u(token, _date, _baseDate, _options) {
  return formatRelativeLocale$u[token];
}

var eraValues$u = {
  narrow: ['ჩ.წ-მდე', 'ჩ.წ'],
  abbreviated: ['ჩვ.წ-მდე', 'ჩვ.წ'],
  wide: ['ჩვენს წელთაღრიცხვამდე', 'ჩვენი წელთაღრიცხვით']
};
var quarterValues$u = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-ლი კვ', '2-ე კვ', '3-ე კვ', '4-ე კვ'],
  wide: ['1-ლი კვარტალი', '2-ე კვარტალი', '3-ე კვარტალი', '4-ე კვარტალი'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$u = {
  narrow: ['ია', 'თე', 'მა', 'აპ', 'მს', 'ვნ', 'ვლ', 'აგ', 'სე', 'ოქ', 'ნო', 'დე'],
  abbreviated: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
  wide: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
};
var dayValues$u = {
  narrow: ['კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა'],
  short: ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'],
  abbreviated: ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'],
  wide: ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი']
};
var dayPeriodValues$u = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'შუაღამე',
    noon: 'შუადღე',
    morning: 'დილა',
    afternoon: 'საღამო',
    evening: 'საღამო',
    night: 'ღამე'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'შუაღამე',
    noon: 'შუადღე',
    morning: 'დილა',
    afternoon: 'საღამო',
    evening: 'საღამო',
    night: 'ღამე'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'შუაღამე',
    noon: 'შუადღე',
    morning: 'დილა',
    afternoon: 'საღამო',
    evening: 'საღამო',
    night: 'ღამე'
  }
};
var formattingDayPeriodValues$o = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'შუაღამით',
    noon: 'შუადღისას',
    morning: 'დილით',
    afternoon: 'ნაშუადღევს',
    evening: 'საღამოს',
    night: 'ღამით'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'შუაღამით',
    noon: 'შუადღისას',
    morning: 'დილით',
    afternoon: 'ნაშუადღევს',
    evening: 'საღამოს',
    night: 'ღამით'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'შუაღამით',
    noon: 'შუადღისას',
    morning: 'დილით',
    afternoon: 'ნაშუადღევს',
    evening: 'საღამოს',
    night: 'ღამით'
  }
};

function ordinalNumber$u(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'

  if (number === 1) {
    return number + '-ლი';
  }

  return number + '-ე';
}

var localize$u = {
  ordinalNumber: ordinalNumber$u,
  era: buildLocalizeFn({
    values: eraValues$u,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$u,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$u,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$u,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$u,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$o,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$u = /^(\d+)(-ლი|-ე)?/i;
var parseOrdinalNumberPattern$u = /\d+/i;
var matchEraPatterns$u = {
  narrow: /^(ჩვ?\.წ)/i,
  abbreviated: /^(ჩვ?\.წ)/i,
  wide: /^(ჩვენს წელთაღრიცხვამდე|ქრისტეშობამდე|ჩვენი წელთაღრიცხვით|ქრისტეშობიდან)/i
};
var parseEraPatterns$u = {
  any: [/^(ჩვენს წელთაღრიცხვამდე|ქრისტეშობამდე)/i, /^(ჩვენი წელთაღრიცხვით|ქრისტეშობიდან)/i]
};
var matchQuarterPatterns$u = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]-(ლი|ე)? კვ/i,
  wide: /^[1234]-(ლი|ე)? კვარტალი/i
};
var parseQuarterPatterns$u = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$u = {
  any: /^(ია|თე|მა|აპ|მს|ვნ|ვლ|აგ|სე|ოქ|ნო|დე)/i
};
var parseMonthPatterns$u = {
  any: [/^ია/i, /^თ/i, /^მარ/i, /^აპ/i, /^მაი/i, /^ი?ვნ/i, /^ი?ვლ/i, /^აგ/i, /^ს/i, /^ო/i, /^ნ/i, /^დ/i]
};
var matchDayPatterns$u = {
  narrow: /^(კვ|ორ|სა|ოთ|ხუ|პა|შა)/i,
  short: /^(კვი|ორშ|სამ|ოთხ|ხუთ|პარ|შაბ)/i,
  long: /^(კვირა|ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი)/i
};
var parseDayPatterns$u = {
  any: [/^კვ/i, /^ორ/i, /^სა/i, /^ოთ/i, /^ხუ/i, /^პა/i, /^შა/i]
};
var matchDayPeriodPatterns$u = {
  any: /^([ap]\.?\s?m\.?|შუაღ|დილ)/i
};
var parseDayPeriodPatterns$u = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^შუაღ/i,
    noon: /^შუადღ/i,
    morning: /^დილ/i,
    afternoon: /ნაშუადღევს/i,
    evening: /საღამო/i,
    night: /ღამ/i
  }
};
var match$u = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$u,
    parsePattern: parseOrdinalNumberPattern$u,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$u,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$u,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$u,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$u,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$u,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$u,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$u,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$u,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$u,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$u,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Georgian locale.
 * @language Georgian
 * @iso-639-2 geo
 * @author Lado Lomidze [@Landish]{@link https://github.com/Landish}
 * @author Nick Shvelidze [@shvelo]{@link https://github.com/shvelo}
 */

var locale$y = {
  code: 'ka',
  formatDistance: formatDistance$v,
  formatLong: formatLong$y,
  formatRelative: formatRelative$u,
  localize: localize$u,
  match: match$u,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

function declension$1(scheme, count) {
  // scheme for count=1 exists
  if (scheme.one !== undefined && count === 1) {
    return scheme.one;
  }

  var rem10 = count % 10;
  var rem100 = count % 100; // 1, 21, 31, ...

  if (rem10 === 1 && rem100 !== 11) {
    return scheme.singularNominative.replace('{{count}}', count); // 2, 3, 4, 22, 23, 24, 32 ...
  } else if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) {
    return scheme.singularGenitive.replace('{{count}}', count); // 5, 6, 7, 8, 9, 10, 11, ...
  } else {
    return scheme.pluralGenitive.replace('{{count}}', count);
  }
}

function buildLocalizeTokenFn$1(scheme) {
  return function (count, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        if (scheme.future) {
          return declension$1(scheme.future, count);
        } else {
          return declension$1(scheme.regular, count) + ' кейін';
        }
      } else {
        if (scheme.past) {
          return declension$1(scheme.past, count);
        } else {
          return declension$1(scheme.regular, count) + ' бұрын';
        }
      }
    } else {
      return declension$1(scheme.regular, count);
    }
  };
}

var formatDistanceLocale$v = {
  lessThanXSeconds: buildLocalizeTokenFn$1({
    regular: {
      one: '1 секундтан аз',
      singularNominative: '{{count}} секундтан аз',
      singularGenitive: '{{count}} секундтан аз',
      pluralGenitive: '{{count}} секундтан аз'
    },
    future: {
      one: 'бір секундтан кейін',
      singularNominative: '{{count}} секундтан кейін',
      singularGenitive: '{{count}} секундтан кейін',
      pluralGenitive: '{{count}} секундтан кейін'
    }
  }),
  xSeconds: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} секунд',
      singularGenitive: '{{count}} секунд',
      pluralGenitive: '{{count}} секунд'
    },
    past: {
      singularNominative: '{{count}} секунд бұрын',
      singularGenitive: '{{count}} секунд бұрын',
      pluralGenitive: '{{count}} секунд бұрын'
    },
    future: {
      singularNominative: '{{count}} секундтан кейін',
      singularGenitive: '{{count}} секундтан кейін',
      pluralGenitive: '{{count}} секундтан кейін'
    }
  }),
  halfAMinute: function (_, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'жарты минут ішінде';
      } else {
        return 'жарты минут бұрын';
      }
    }

    return 'жарты минут';
  },
  lessThanXMinutes: buildLocalizeTokenFn$1({
    regular: {
      one: '1 минуттан аз',
      singularNominative: '{{count}} минуттан аз',
      singularGenitive: '{{count}} минуттан аз',
      pluralGenitive: '{{count}} минуттан аз'
    },
    future: {
      one: 'минуттан кем ',
      singularNominative: '{{count}} минуттан кем',
      singularGenitive: '{{count}} минуттан кем',
      pluralGenitive: '{{count}} минуттан кем'
    }
  }),
  xMinutes: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} минут',
      singularGenitive: '{{count}} минут',
      pluralGenitive: '{{count}} минут'
    },
    past: {
      singularNominative: '{{count}} минут бұрын',
      singularGenitive: '{{count}} минут бұрын',
      pluralGenitive: '{{count}} минут бұрын'
    },
    future: {
      singularNominative: '{{count}} минуттан кейін',
      singularGenitive: '{{count}} минуттан кейін',
      pluralGenitive: '{{count}} минуттан кейін'
    }
  }),
  aboutXHours: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: 'шамамен {{count}} сағат',
      singularGenitive: 'шамамен {{count}} сағат',
      pluralGenitive: 'шамамен {{count}} сағат'
    },
    future: {
      singularNominative: 'шамамен {{count}} сағаттан кейін',
      singularGenitive: 'шамамен {{count}} сағаттан кейін',
      pluralGenitive: 'шамамен {{count}} сағаттан кейін'
    }
  }),
  xHours: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} сағат',
      singularGenitive: '{{count}} сағат',
      pluralGenitive: '{{count}} сағат'
    }
  }),
  xDays: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} күн',
      singularGenitive: '{{count}} күн',
      pluralGenitive: '{{count}} күн'
    },
    future: {
      singularNominative: '{{count}} күннен кейін',
      singularGenitive: '{{count}} күннен кейін',
      pluralGenitive: '{{count}} күннен кейін'
    }
  }),
  aboutXMonths: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: 'шамамен {{count}} ай',
      singularGenitive: 'шамамен {{count}} ай',
      pluralGenitive: 'шамамен {{count}} ай'
    },
    future: {
      singularNominative: 'шамамен {{count}} айдан кейін',
      singularGenitive: 'шамамен {{count}} айдан кейін',
      pluralGenitive: 'шамамен {{count}} айдан кейін'
    }
  }),
  xMonths: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} ай',
      singularGenitive: '{{count}} ай',
      pluralGenitive: '{{count}} ай'
    }
  }),
  aboutXYears: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: 'шамамен {{count}} жыл',
      singularGenitive: 'шамамен {{count}} жыл',
      pluralGenitive: 'шамамен {{count}} жыл'
    },
    future: {
      singularNominative: 'шамамен {{count}} жылдан кейін',
      singularGenitive: 'шамамен {{count}} жылдан кейін',
      pluralGenitive: 'шамамен {{count}} жылдан кейін'
    }
  }),
  xYears: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} жыл',
      singularGenitive: '{{count}} жыл',
      pluralGenitive: '{{count}} жыл'
    },
    future: {
      singularNominative: '{{count}} жылдан кейін',
      singularGenitive: '{{count}} жылдан кейін',
      pluralGenitive: '{{count}} жылдан кейін'
    }
  }),
  overXYears: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} жылдан астам',
      singularGenitive: '{{count}} жылдан астам',
      pluralGenitive: '{{count}} жылдан астам'
    },
    future: {
      singularNominative: '{{count}} жылдан астам',
      singularGenitive: '{{count}} жылдан астам',
      pluralGenitive: '{{count}} жылдан астам'
    }
  }),
  almostXYears: buildLocalizeTokenFn$1({
    regular: {
      singularNominative: '{{count}} жылға жақын',
      singularGenitive: '{{count}} жылға жақын',
      pluralGenitive: '{{count}} жылға жақын'
    },
    future: {
      singularNominative: '{{count}} жылдан кейін',
      singularGenitive: '{{count}} жылдан кейін',
      pluralGenitive: '{{count}} жылдан кейін'
    }
  })
};
function formatDistance$w(token, count, options) {
  options = options || {};
  return formatDistanceLocale$v[token](count, options);
}

var dateFormats$z = {
  full: "EEEE, do MMMM y 'ж.'",
  long: "do MMMM y 'ж.'",
  medium: "d MMM y 'ж.'",
  short: 'dd.MM.yyyy'
};
var timeFormats$z = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$z = {
  any: '{{date}}, {{time}}'
};
var formatLong$z = {
  date: buildFormatLongFn({
    formats: dateFormats$z,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$z,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$z,
    defaultWidth: 'any'
  })
};

var accusativeWeekdays$3 = ['жексенбіде', 'дүйсенбіде', 'сейсенбіде', 'сәрсенбіде', 'бейсенбіде', 'жұмада', 'сенбіде'];

function lastWeek$2(day) {
  var weekday = accusativeWeekdays$3[day];
  return "'өткен " + weekday + " сағат' p'-де'";
}

function thisWeek$2(day) {
  var weekday = accusativeWeekdays$3[day];
  return "'" + weekday + " сағат' p'-де'";
}

function nextWeek$2(day) {
  var weekday = accusativeWeekdays$3[day];
  return "'келесі " + weekday + " сағат' p'-де'";
}

var formatRelativeLocale$v = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$2(day);
    } else {
      return lastWeek$2(day);
    }
  },
  yesterday: "'кеше сағат' p'-де'",
  today: "'бүгін сағат' p'-де'",
  tomorrow: "'ертең сағат' p'-де'",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$2(day);
    } else {
      return nextWeek$2(day);
    }
  },
  other: 'P'
};
function formatRelative$v(token, date, baseDate, options) {
  var format = formatRelativeLocale$v[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$v = {
  narrow: ['б.з.д.', 'б.з.'],
  abbreviated: ['б.з.д.', 'б.з.'],
  wide: ['біздің заманымызға дейін', 'біздің заманымыз']
};
var quarterValues$v = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-ші тоқ.', '2-ші тоқ.', '3-ші тоқ.', '4-ші тоқ.'],
  wide: ['1-ші тоқсан', '2-ші тоқсан', '3-ші тоқсан', '4-ші тоқсан']
};
var monthValues$v = {
  narrow: ['Қ', 'А', 'Н', 'С', 'М', 'М', 'Ш', 'Т', 'Қ', 'Қ', 'Қ', 'Ж'],
  abbreviated: ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'],
  wide: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
};
var formattingMonthValues$5 = {
  narrow: ['Қ', 'А', 'Н', 'С', 'М', 'М', 'Ш', 'Т', 'Қ', 'Қ', 'Қ', 'Ж'],
  abbreviated: ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел'],
  wide: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
};
var dayValues$v = {
  narrow: ['Ж', 'Д', 'С', 'С', 'Б', 'Ж', 'С'],
  short: ['жс', 'дс', 'сс', 'ср', 'бс', 'жм', 'сб'],
  abbreviated: ['жс', 'дс', 'сс', 'ср', 'бс', 'жм', 'сб'],
  wide: ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі']
};
var dayPeriodValues$v = {
  narrow: {
    am: 'ТД',
    pm: 'ТК',
    midnight: 'түн ортасы',
    noon: 'түс',
    morning: 'таң',
    afternoon: 'күндіз',
    evening: 'кеш',
    night: 'түн'
  },
  wide: {
    am: 'ТД',
    pm: 'ТК',
    midnight: 'түн ортасы',
    noon: 'түс',
    morning: 'таң',
    afternoon: 'күндіз',
    evening: 'кеш',
    night: 'түн'
  }
};
var formattingDayPeriodValues$p = {
  narrow: {
    am: 'ТД',
    pm: 'ТК',
    midnight: 'түн ортасында',
    noon: 'түс.',
    morning: 'таң.',
    afternoon: 'күн.',
    evening: 'кеш.',
    night: 'түн.'
  },
  wide: {
    am: 'ТД',
    pm: 'ТК',
    midnight: 'түн ортасында',
    noon: 'түсте',
    morning: 'таңертең',
    afternoon: 'күндіз',
    evening: 'кеште',
    night: 'түнде'
  }
};

function ordinalNumber$v(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (unit === 'date') {
    suffix = '-ші';
  } else if (unit === 'week' || unit === 'minute' || unit === 'second') {
    suffix = '-ші';
  } else {
    suffix = '-ші';
  }

  return dirtyNumber + suffix;
}

var localize$v = {
  ordinalNumber: ordinalNumber$v,
  era: buildLocalizeFn({
    values: eraValues$v,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$v,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$v,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$5,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$v,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$v,
    defaultWidth: 'any',
    formattingValues: formattingDayPeriodValues$p,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$v = /^(\d+)(-?(ші|шы))?/i;
var parseOrdinalNumberPattern$v = /\d+/i;
var matchEraPatterns$v = {
  narrow: /^((б )?з\.?\s?д\.?)/i,
  abbreviated: /^((б )?з\.?\s?д\.?)/i,
  wide: /^(біздің заманымызға дейін|біздің заманымыз|біздің заманымыздан)/i
};
var parseEraPatterns$v = {
  any: [/^б/i, /^з/i]
};
var matchQuarterPatterns$v = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](-?ші)? тоқ.?/i,
  wide: /^[1234](-?ші)? тоқсан/i
};
var parseQuarterPatterns$v = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$v = {
  narrow: /^(қ|а|н|с|м|мау|ш|т|қыр|қаз|қар|ж)/i,
  abbreviated: /^(қаң|ақп|нау|сәу|мам|мау|шіл|там|қыр|қаз|қар|жел)/i,
  wide: /^(қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан)/i
};
var parseMonthPatterns$v = {
  narrow: [/^қ/i, /^а/i, /^н/i, /^с/i, /^м/i, /^м/i, /^ш/i, /^т/i, /^қ/i, /^қ/i, /^қ/i, /^ж/i],
  abbreviated: [/^қаң/i, /^ақп/i, /^нау/i, /^сәу/i, /^мам/i, /^мау/i, /^шіл/i, /^там/i, /^қыр/i, /^қаз/i, /^қар/i, /^жел/i],
  any: [/^қ/i, /^а/i, /^н/i, /^с/i, /^м/i, /^м/i, /^ш/i, /^т/i, /^қ/i, /^қ/i, /^қ/i, /^ж/i]
};
var matchDayPatterns$v = {
  narrow: /^(ж|д|с|с|б|ж|с)/i,
  short: /^(жс|дс|сс|ср|бс|жм|сб)/i,
  wide: /^(жексенбі|дүйсенбі|сейсенбі|сәрсенбі|бейсенбі|жұма|сенбі)/i
};
var parseDayPatterns$v = {
  narrow: [/^ж/i, /^д/i, /^с/i, /^с/i, /^б/i, /^ж/i, /^с/i],
  short: [/^жс/i, /^дс/i, /^сс/i, /^ср/i, /^бс/i, /^жм/i, /^сб/i],
  any: [/^ж[ек]/i, /^д[үй]/i, /^сe[й]/i, /^сә[р]/i, /^б[ей]/i, /^ж[ұм]/i, /^се[н]/i]
};
var matchDayPeriodPatterns$v = {
  narrow: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
  wide: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
  any: /^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i
};
var parseDayPeriodPatterns$v = {
  any: {
    am: /^ТД/i,
    pm: /^ТК/i,
    midnight: /^түн орта/i,
    noon: /^күндіз/i,
    morning: /таң/i,
    afternoon: /түс/i,
    evening: /кеш/i,
    night: /түн/i
  }
};
var match$v = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$v,
    parsePattern: parseOrdinalNumberPattern$v,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$v,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$v,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$v,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$v,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$v,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$v,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$v,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$v,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$v,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$v,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Kazakh locale.
 * @language Kazakh
 * @iso-639-2 kaz
 * @author Nikita Bayev [@drugoi]{@link https://github.com/drugoi}
 */

var locale$z = {
  code: 'kk',
  formatDistance: formatDistance$w,
  formatLong: formatLong$z,
  formatRelative: formatRelative$v,
  localize: localize$v,
  match: match$v,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$w = {
  lessThanXSeconds: {
    one: '1초 미만',
    other: '{{count}}초 미만'
  },
  xSeconds: {
    one: '1초',
    other: '{{count}}초'
  },
  halfAMinute: '30초',
  lessThanXMinutes: {
    one: '1분 미만',
    other: '{{count}}분 미만'
  },
  xMinutes: {
    one: '1분',
    other: '{{count}}분'
  },
  aboutXHours: {
    one: '약 1시간',
    other: '약 {{count}}시간'
  },
  xHours: {
    one: '1시간',
    other: '{{count}}시간'
  },
  xDays: {
    one: '1일',
    other: '{{count}}일'
  },
  aboutXMonths: {
    one: '약 1개월',
    other: '약 {{count}}개월'
  },
  xMonths: {
    one: '1개월',
    other: '{{count}}개월'
  },
  aboutXYears: {
    one: '약 1년',
    other: '약 {{count}}년'
  },
  xYears: {
    one: '1년',
    other: '{{count}}년'
  },
  overXYears: {
    one: '1년 이상',
    other: '{{count}}년 이상'
  },
  almostXYears: {
    one: '거의 1년',
    other: '거의 {{count}}년'
  }
};
function formatDistance$x(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$w[token] === 'string') {
    result = formatDistanceLocale$w[token];
  } else if (count === 1) {
    result = formatDistanceLocale$w[token].one;
  } else {
    result = formatDistanceLocale$w[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' 후';
    } else {
      return result + ' 전';
    }
  }

  return result;
}

var dateFormats$A = {
  full: 'y년 M월 d일 EEEE',
  long: 'y년 M월 d일',
  medium: 'y.MM.dd',
  short: 'y.MM.dd'
};
var timeFormats$A = {
  full: 'a H시 mm분 ss초 zzzz',
  long: 'a H:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$A = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$A = {
  date: buildFormatLongFn({
    formats: dateFormats$A,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$A,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$A,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$w = {
  lastWeek: "'지난' eeee p",
  yesterday: "'어제' p",
  today: "'오늘' p",
  tomorrow: "'내일' p",
  nextWeek: "'다음' eeee p",
  other: 'P'
};
function formatRelative$w(token, _date, _baseDate, _options) {
  return formatRelativeLocale$w[token];
}

var eraValues$w = {
  narrow: ['BC', 'AD'],
  abbreviated: ['BC', 'AD'],
  wide: ['기원전', '서기']
};
var quarterValues$w = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1분기', '2분기', '3분기', '4분기']
};
var monthValues$w = {
  narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  abbreviated: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  wide: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
};
var dayValues$w = {
  narrow: ['일', '월', '화', '수', '목', '금', '토'],
  short: ['일', '월', '화', '수', '목', '금', '토'],
  abbreviated: ['일', '월', '화', '수', '목', '금', '토'],
  wide: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
};
var dayPeriodValues$w = {
  narrow: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  },
  abbreviated: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  },
  wide: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  }
};
var formattingDayPeriodValues$q = {
  narrow: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  },
  abbreviated: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  },
  wide: {
    am: '오전',
    pm: '오후',
    midnight: '자정',
    noon: '정오',
    morning: '아침',
    afternoon: '오후',
    evening: '저녁',
    night: '밤'
  }
};

function ordinalNumber$w(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber);
  return dirtyOptions && (dirtyOptions.unit === 'minute' || dirtyOptions.unit === 'second') ? number.toString() : number + '번째';
}

var localize$w = {
  ordinalNumber: ordinalNumber$w,
  era: buildLocalizeFn({
    values: eraValues$w,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$w,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$w,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$w,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$w,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$q,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$w = /^(\d+)(번째)?/i;
var parseOrdinalNumberPattern$w = /\d+/i;
var matchEraPatterns$w = {
  narrow: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(기원전|서기)/i
};
var parseEraPatterns$w = {
  any: [/^(bc|기원전)/i, /^(ad|서기)/i]
};
var matchQuarterPatterns$w = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234]사?분기/i
};
var parseQuarterPatterns$w = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$w = {
  narrow: /^(1[012]|[123456789])/,
  abbreviated: /^(1[012]|[123456789])월/i,
  wide: /^(1[012]|[123456789])월/i
};
var parseMonthPatterns$w = {
  any: [/^1월?$/, /^2/, /^3/, /^4/, /^5/, /^6/, /^7/, /^8/, /^9/, /^10/, /^11/, /^12/]
};
var matchDayPatterns$w = {
  narrow: /^[일월화수목금토]/,
  short: /^[일월화수목금토]/,
  abbreviated: /^[일월화수목금토]/,
  wide: /^[일월화수목금토]요일/
};
var parseDayPatterns$w = {
  any: [/^일/, /^월/, /^화/, /^수/, /^목/, /^금/, /^토/]
};
var matchDayPeriodPatterns$w = {
  any: /^(am|pm|오전|오후|자정|정오|아침|저녁|밤)/i
};
var parseDayPeriodPatterns$w = {
  any: {
    am: /^(am|오전)/i,
    pm: /^(pm|오후)/i,
    midnight: /^자정/i,
    noon: /^정오/i,
    morning: /^아침/i,
    afternoon: /^오후/i,
    evening: /^저녁/i,
    night: /^밤/i
  }
};
var match$w = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$w,
    parsePattern: parseOrdinalNumberPattern$w,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$w,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$w,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$w,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$w,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$w,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$w,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$w,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$w,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$w,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$w,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Korean locale.
 * @language Korean
 * @iso-639-2 kor
 * @author Hong Chulju [@angdev]{@link https://github.com/angdev}
 * @author Lee Seoyoen [@iamssen]{@link https://github.com/iamssen}
 */

var locale$A = {
  code: 'ko',
  formatDistance: formatDistance$x,
  formatLong: formatLong$A,
  formatRelative: formatRelative$w,
  localize: localize$w,
  match: match$w,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$x = {
  lessThanXSeconds: {
    one: translateSeconds,
    other: translate$1
  },
  xSeconds: {
    one: translateSeconds,
    other: translate$1
  },
  halfAMinute: 'pusė minutės',
  lessThanXMinutes: {
    one: translateSingular,
    other: translate$1
  },
  xMinutes: {
    one: translateSingular,
    other: translate$1
  },
  aboutXHours: {
    one: translateSingular,
    other: translate$1
  },
  xHours: {
    one: translateSingular,
    other: translate$1
  },
  xDays: {
    one: translateSingular,
    other: translate$1
  },
  aboutXMonths: {
    one: translateSingular,
    other: translate$1
  },
  xMonths: {
    one: translateSingular,
    other: translate$1
  },
  aboutXYears: {
    one: translateSingular,
    other: translate$1
  },
  xYears: {
    one: translateSingular,
    other: translate$1
  },
  overXYears: {
    one: translateSingular,
    other: translate$1
  },
  almostXYears: {
    one: translateSingular,
    other: translate$1
  }
};
var translations$1 = {
  'xseconds_other': 'sekundė_sekundžių_sekundes',
  'xminutes_one': 'minutė_minutės_minutę',
  'xminutes_other': 'minutės_minučių_minutes',
  'xhours_one': 'valanda_valandos_valandą',
  'xhours_other': 'valandos_valandų_valandas',
  'xdays_one': 'diena_dienos_dieną',
  'xdays_other': 'dienos_dienų_dienas',
  'xmonths_one': 'mėnuo_mėnesio_mėnesį',
  'xmonths_other': 'mėnesiai_mėnesių_mėnesius',
  'xyears_one': 'metai_metų_metus',
  'xyears_other': 'metai_metų_metus',
  'about': 'apie',
  'over': 'daugiau nei',
  'almost': 'beveik',
  'lessthan': 'mažiau nei'
};

function translateSeconds(number, addSuffix, key, isFuture) {
  if (!addSuffix) {
    return 'kelios sekundės';
  } else {
    return isFuture ? 'kelių sekundžių' : 'kelias sekundes';
  }
}

function translateSingular(number, addSuffix, key, isFuture) {
  return !addSuffix ? forms(key)[0] : isFuture ? forms(key)[1] : forms(key)[2];
}

function special(number) {
  return number % 10 === 0 || number > 10 && number < 20;
}

function forms(key) {
  return translations$1[key].split('_');
}

function translate$1(number, addSuffix, key, isFuture) {
  var result = number + ' ';

  if (number === 1) {
    return result + translateSingular(number, addSuffix, key[0], isFuture);
  } else if (!addSuffix) {
    return result + (special(number) ? forms(key)[1] : forms(key)[0]);
  } else {
    if (isFuture) {
      return result + forms(key)[1];
    } else {
      return result + (special(number) ? forms(key)[1] : forms(key)[2]);
    }
  }
}

function formatDistance$y(token, count, options) {
  options = options || {};
  var adverb = token.match(/about|over|almost|lessthan/i);
  var unit = token.replace(adverb, '');
  var result;

  if (typeof formatDistanceLocale$x[token] === 'string') {
    result = formatDistanceLocale$x[token];
  } else if (count === 1) {
    result = formatDistanceLocale$x[token].one(count, options.addSuffix, unit.toLowerCase() + '_one');
  } else {
    result = formatDistanceLocale$x[token].other(count, options.addSuffix, unit.toLowerCase() + '_other');
  }

  if (adverb) {
    result = translations$1[adverb[0].toLowerCase()] + ' ' + result;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'po ' + result;
    } else {
      return 'prieš ' + result;
    }
  }

  return result;
}

var dateFormats$B = {
  full: "y 'm'. MMMM d 'd'., EEEE",
  long: "y 'm'. MMMM d 'd'.",
  medium: 'y-MM-dd',
  short: 'y-MM-dd'
};
var timeFormats$B = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$B = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$B = {
  date: buildFormatLongFn({
    formats: dateFormats$B,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$B,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$B,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$x = {
  lastWeek: "'Praėjusį' eeee p",
  yesterday: "'Vakar' p",
  today: "'Šiandien' p",
  tomorrow: "'Rytoj' p",
  nextWeek: 'eeee p',
  other: 'P'
};
function formatRelative$x(token, _date, _baseDate, _options) {
  return formatRelativeLocale$x[token];
}

var eraValues$x = {
  narrow: ['pr. Kr.', 'po Kr.'],
  abbreviated: ['pr. Kr.', 'po Kr.'],
  wide: ['prieš Kristų', 'po Kristaus']
};
var quarterValues$x = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['I ketv.', 'II ketv.', 'III ketv.', 'IV ketv.'],
  wide: ['I ketvirtis', 'II ketvirtis', 'III ketvirtis', 'IV ketvirtis']
};
var formattingQuarterValues$1 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['I k.', 'II k.', 'III k.', 'IV k.'],
  wide: ['I ketvirtis', 'II ketvirtis', 'III ketvirtis', 'IV ketvirtis']
};
var monthValues$x = {
  narrow: ['S', 'V', 'K', 'B', 'G', 'B', 'L', 'R', 'R', 'S', 'L', 'G'],
  abbreviated: ['saus.', 'vas.', 'kov.', 'bal.', 'geg.', 'birž.', 'liep.', 'rugp.', 'rugs.', 'spal.', 'lapkr.', 'gruod.'],
  wide: ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis']
};
var formattingMonthValues$6 = {
  narrow: ['S', 'V', 'K', 'B', 'G', 'B', 'L', 'R', 'R', 'S', 'L', 'G'],
  abbreviated: ['saus.', 'vas.', 'kov.', 'bal.', 'geg.', 'birž.', 'liep.', 'rugp.', 'rugs.', 'spal.', 'lapkr.', 'gruod.'],
  wide: ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio']
};
var dayValues$x = {
  narrow: ['S', 'P', 'A', 'T', 'K', 'P', 'Š'],
  short: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
  abbreviated: ['sk', 'pr', 'an', 'tr', 'kt', 'pn', 'št'],
  wide: ['sekmadienis', 'pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis', 'šeštadienis']
};
var formattingDayValues$1 = {
  narrow: ['S', 'P', 'A', 'T', 'K', 'P', 'Š'],
  short: ['Sk', 'Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št'],
  abbreviated: ['sk', 'pr', 'an', 'tr', 'kt', 'pn', 'št'],
  wide: ['sekmadienį', 'pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį', 'šeštadienį']
};
var dayPeriodValues$x = {
  narrow: {
    am: 'pr. p.',
    pm: 'pop.',
    midnight: 'vidurnaktis',
    noon: 'vidurdienis',
    morning: 'rytas',
    afternoon: 'diena',
    evening: 'vakaras',
    night: 'naktis'
  },
  abbreviated: {
    am: 'priešpiet',
    pm: 'popiet',
    midnight: 'vidurnaktis',
    noon: 'vidurdienis',
    morning: 'rytas',
    afternoon: 'diena',
    evening: 'vakaras',
    night: 'naktis'
  },
  wide: {
    am: 'priešpiet',
    pm: 'popiet',
    midnight: 'vidurnaktis',
    noon: 'vidurdienis',
    morning: 'rytas',
    afternoon: 'diena',
    evening: 'vakaras',
    night: 'naktis'
  }
};
var formattingDayPeriodValues$r = {
  narrow: {
    am: 'pr. p.',
    pm: 'pop.',
    midnight: 'vidurnaktis',
    noon: 'perpiet',
    morning: 'rytas',
    afternoon: 'popietė',
    evening: 'vakaras',
    night: 'naktis'
  },
  abbreviated: {
    am: 'priešpiet',
    pm: 'popiet',
    midnight: 'vidurnaktis',
    noon: 'perpiet',
    morning: 'rytas',
    afternoon: 'popietė',
    evening: 'vakaras',
    night: 'naktis'
  },
  wide: {
    am: 'priešpiet',
    pm: 'popiet',
    midnight: 'vidurnaktis',
    noon: 'perpiet',
    morning: 'rytas',
    afternoon: 'popietė',
    evening: 'vakaras',
    night: 'naktis'
  }
};

function ordinalNumber$x(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '-oji';
}

var localize$x = {
  ordinalNumber: ordinalNumber$x,
  era: buildLocalizeFn({
    values: eraValues$x,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$x,
    defaultWidth: 'wide',
    formattingValues: formattingQuarterValues$1,
    defaultFormattingWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$x,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$6,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$x,
    defaultWidth: 'wide',
    formattingValues: formattingDayValues$1,
    defaultFormattingWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$x,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$r,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$x = /^(\d+)(-oji)?/i;
var parseOrdinalNumberPattern$x = /\d+/i;
var matchEraPatterns$x = {
  narrow: /^p(r|o)\.?\s?(kr\.?|me)/i,
  abbreviated: /^(pr\.\s?(kr\.|m\.\s?e\.)|po\s?kr\.|mūsų eroje)/i,
  wide: /^(prieš Kristų|prieš mūsų erą|po Kristaus|mūsų eroje)/i
};
var parseEraPatterns$x = {
  wide: [/prieš/i, /(po|mūsų)/i],
  any: [/^pr/i, /^(po|m)/i]
};
var matchQuarterPatterns$x = {
  narrow: /^([1234])/i,
  abbreviated: /^(I|II|III|IV)\s?ketv?\.?/i,
  wide: /^(I|II|III|IV)\s?ketvirtis/i
};
var parseQuarterPatterns$x = {
  narrow: [/1/i, /2/i, /3/i, /4/i],
  any: [/I$/i, /II$/i, /III/i, /IV/i]
};
var matchMonthPatterns$x = {
  narrow: /^[svkbglr]/i,
  abbreviated: /^(saus\.|vas\.|kov\.|bal\.|geg\.|birž\.|liep\.|rugp\.|rugs\.|spal\.|lapkr\.|gruod\.)/i,
  wide: /^(sausi(s|o)|vasari(s|o)|kov(a|o)s|balandž?i(s|o)|gegužės?|birželi(s|o)|liep(a|os)|rugpjū(t|č)i(s|o)|rugsėj(is|o)|spali(s|o)|lapkri(t|č)i(s|o)|gruodž?i(s|o))/i
};
var parseMonthPatterns$x = {
  narrow: [/^s/i, /^v/i, /^k/i, /^b/i, /^g/i, /^b/i, /^l/i, /^r/i, /^r/i, /^s/i, /^l/i, /^g/i],
  any: [/^saus/i, /^vas/i, /^kov/i, /^bal/i, /^geg/i, /^birž/i, /^liep/i, /^rugp/i, /^rugs/i, /^spal/i, /^lapkr/i, /^gruod/i]
};
var matchDayPatterns$x = {
  narrow: /^[spatkš]/i,
  short: /^(sk|pr|an|tr|kt|pn|št)/i,
  abbreviated: /^(sk|pr|an|tr|kt|pn|št)/i,
  wide: /^(sekmadien(is|į)|pirmadien(is|į)|antradien(is|į)|trečiadien(is|į)|ketvirtadien(is|į)|penktadien(is|į)|šeštadien(is|į))/i
};
var parseDayPatterns$x = {
  narrow: [/^s/i, /^p/i, /^a/i, /^t/i, /^k/i, /^p/i, /^š/i],
  wide: [/^se/i, /^pi/i, /^an/i, /^tr/i, /^ke/i, /^pe/i, /^še/i],
  any: [/^sk/i, /^pr/i, /^an/i, /^tr/i, /^kt/i, /^pn/i, /^št/i]
};
var matchDayPeriodPatterns$x = {
  narrow: /^(pr.\s?p.|pop.|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i,
  any: /^(priešpiet|popiet$|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i
};
var parseDayPeriodPatterns$x = {
  narrow: {
    am: /^pr/i,
    pm: /^pop./i,
    midnight: /^vidurnaktis/i,
    noon: /^(vidurdienis|perp)/i,
    morning: /rytas/i,
    afternoon: /(die|popietė)/i,
    evening: /vakaras/i,
    night: /naktis/i
  },
  any: {
    am: /^pr/i,
    pm: /^popiet$/i,
    midnight: /^vidurnaktis/i,
    noon: /^(vidurdienis|perp)/i,
    morning: /rytas/i,
    afternoon: /(die|popietė)/i,
    evening: /vakaras/i,
    night: /naktis/i
  }
};
var match$x = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$x,
    parsePattern: parseOrdinalNumberPattern$x,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$x,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$x,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$x,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$x,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$x,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$x,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$x,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$x,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$x,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$x,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 *
 * @summary Lithuanian locale.
 * @language Lithuanian
 *
 * @iso-639-2 lit
 *
 * @author Pavlo Shpak [@pshpak]{@link https://github.com/pshpak}
 * @author Eduardo Pardo [@eduardopsll]{@link https://github.com/eduardopsll}
 */

var locale$B = {
  code: 'lt',
  formatDistance: formatDistance$y,
  formatLong: formatLong$B,
  formatRelative: formatRelative$x,
  localize: localize$x,
  match: match$x,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

function buildLocalizeTokenFn$2(schema) {
  return function (count, options) {
    if (count === 1) {
      if (options.addSuffix) {
        return schema.one[0].replace('{{time}}', schema.one[2]);
      } else {
        return schema.one[0].replace('{{time}}', schema.one[1]);
      }
    } else {
      var rem = count % 10 === 1 && count % 100 !== 11;

      if (options.addSuffix) {
        return schema.other[0].replace('{{time}}', rem ? schema.other[3] : schema.other[4]).replace('{{count}}', count);
      } else {
        return schema.other[0].replace('{{time}}', rem ? schema.other[1] : schema.other[2]).replace('{{count}}', count);
      }
    }
  };
}

var formatDistanceLocale$y = {
  lessThanXSeconds: buildLocalizeTokenFn$2({
    one: ['mazāk par {{time}}', 'sekundi', 'sekundi'],
    other: ['mazāk nekā {{count}} {{time}}', 'sekunde', 'sekundes', 'sekundes', 'sekundēm']
  }),
  xSeconds: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'sekunde', 'sekundes'],
    other: ['{{count}} {{time}}', 'sekunde', 'sekundes', 'sekundes', 'sekundēm']
  }),
  halfAMinute: function (count, options) {
    if (options.addSuffix) {
      return 'pusminūtes';
    } else {
      return 'pusminūte';
    }
  },
  lessThanXMinutes: buildLocalizeTokenFn$2({
    one: ['mazāk par {{time}}', 'minūti', 'minūti'],
    other: ['mazāk nekā {{count}} {{time}}', 'minūte', 'minūtes', 'minūtes', 'minūtēm']
  }),
  xMinutes: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'minūte', 'minūtes'],
    other: ['{{count}} {{time}}', 'minūte', 'minūtes', 'minūtes', 'minūtēm']
  }),
  aboutXHours: buildLocalizeTokenFn$2({
    one: ['apmēram 1 {{time}}', 'stunda', 'stundas'],
    other: ['apmēram {{count}} {{time}}', 'stunda', 'stundas', 'stundas', 'stundām']
  }),
  xHours: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'stunda', 'stundas'],
    other: ['{{count}} {{time}}', 'stunda', 'stundas', 'stundas', 'stundām']
  }),
  xDays: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'diena', 'dienas'],
    other: ['{{count}} {{time}}', 'diena', 'dienas', 'dienas', 'dienām']
  }),
  aboutXMonths: buildLocalizeTokenFn$2({
    one: ['apmēram 1 {{time}}', 'mēnesis', 'mēneša'],
    other: ['apmēram {{count}} {{time}}', 'mēnesis', 'mēneši', 'mēneša', 'mēnešiem']
  }),
  xMonths: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'mēnesis', 'mēneša'],
    other: ['{{count}} {{time}}', 'mēnesis', 'mēneši', 'mēneša', 'mēnešiem']
  }),
  aboutXYears: buildLocalizeTokenFn$2({
    one: ['apmēram 1 {{time}}', 'gads', 'gada'],
    other: ['apmēram {{count}} {{time}}', 'gads', 'gadi', 'gada', 'gadiem']
  }),
  xYears: buildLocalizeTokenFn$2({
    one: ['1 {{time}}', 'gads', 'gada'],
    other: ['{{count}} {{time}}', 'gads', 'gadi', 'gada', 'gadiem']
  }),
  overXYears: buildLocalizeTokenFn$2({
    one: ['ilgāk par 1 {{time}}', 'gadu', 'gadu'],
    other: ['vairāk nekā {{count}} {{time}}', 'gads', 'gadi', 'gada', 'gadiem']
  }),
  almostXYears: buildLocalizeTokenFn$2({
    one: ['gandrīz 1 {{time}}', 'gads', 'gada'],
    other: ['vairāk nekā {{count}} {{time}}', 'gads', 'gadi', 'gada', 'gadiem']
  })
};
function formatDistance$z(token, count, options) {
  options = options || {};
  var result = formatDistanceLocale$y[token](count, options);

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'pēc ' + result;
    } else {
      return 'pirms ' + result;
    }
  }

  return result;
}

var dateFormats$C = {
  full: "y. 'gada' M. MMMM., EEEE",
  long: "y. 'gada' M. MMMM",
  medium: 'dd.MM.y.',
  short: 'dd.MM.y.'
};
var timeFormats$C = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$C = {
  full: "{{date}} 'plkst.' {{time}}",
  long: "{{date}} 'plkst.' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$C = {
  date: buildFormatLongFn({
    formats: dateFormats$C,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$C,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$C,
    defaultWidth: 'full'
  })
};

var weekdays$1 = ['svētdienā', 'pirmdienā', 'otrdienā', 'trešdienā', 'ceturtdienā', 'piektdienā', 'sestdienā'];
var formatRelativeLocale$y = {
  lastWeek: function (date, baseDate, options) {
    if (isSameUTCWeek(date, baseDate, options)) {
      return "eeee 'plkst.' p";
    }

    var weekday = weekdays$1[date.getUTCDay()];
    return "'Pagājušā " + weekday + " plkst.' p";
  },
  yesterday: "'Vakar plkst.' p",
  today: "'Šodien plkst.' p",
  tomorrow: "'Rīt plkst.' p",
  nextWeek: function (date, baseDate, options) {
    if (isSameUTCWeek(date, baseDate, options)) {
      return "eeee 'plkst.' p";
    }

    var weekday = weekdays$1[date.getUTCDay()];
    return "'Nākamajā " + weekday + " plkst.' p";
  },
  other: 'P'
};
function formatRelative$y(token, date, baseDate, options) {
  var format = formatRelativeLocale$y[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$y = {
  narrow: ['p.m.ē', 'm.ē'],
  abbreviated: ['p. m. ē.', 'm. ē.'],
  wide: ['pirms mūsu ēras', 'mūsu ērā']
};
var quarterValues$y = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1. cet.', '2. cet.', '3. cet.', '4. cet.'],
  wide: ['pirmais ceturksnis', 'otrais ceturksnis', 'trešais ceturksnis', 'ceturtais ceturksnis']
};
var formattingQuarterValues$2 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1. cet.', '2. cet.', '3. cet.', '4. cet.'],
  wide: ['pirmajā ceturksnī', 'otrajā ceturksnī', 'trešajā ceturksnī', 'ceturtajā ceturksnī']
};
var monthValues$y = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'],
  wide: ['janvāris', 'februāris', 'marts', 'aprīlis', 'maijs', 'jūnijs', 'jūlijs', 'augusts', 'septembris', 'oktobris', 'novembris', 'decembris']
};
var formattingMonthValues$7 = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['janv.', 'febr.', 'martā', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'],
  wide: ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī']
};
var dayValues$y = {
  narrow: ['S', 'P', 'O', 'T', 'C', 'P', 'S'],
  short: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
  abbreviated: ['svētd.', 'pirmd.', 'otrd.', 'trešd.', 'ceturtd.', 'piektd.', 'sestd.'],
  wide: ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena']
};
var formattingDayValues$2 = {
  narrow: ['S', 'P', 'O', 'T', 'C', 'P', 'S'],
  short: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
  abbreviated: ['svētd.', 'pirmd.', 'otrd.', 'trešd.', 'ceturtd.', 'piektd.', 'sestd.'],
  wide: ['svētdienā', 'pirmdienā', 'otrdienā', 'trešdienā', 'ceturtdienā', 'piektdienā', 'sestdienā']
};
var dayPeriodValues$y = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusn.',
    noon: 'pusd.',
    morning: 'rīts',
    afternoon: 'diena',
    evening: 'vakars',
    night: 'nakts'
  },
  abbreviated: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusn.',
    noon: 'pusd.',
    morning: 'rīts',
    afternoon: 'pēcpusd.',
    evening: 'vakars',
    night: 'nakts'
  },
  wide: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusnakts',
    noon: 'pusdienlaiks',
    morning: 'rīts',
    afternoon: 'pēcpusdiena',
    evening: 'vakars',
    night: 'nakts'
  }
};
var formattingDayPeriodValues$s = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusn.',
    noon: 'pusd.',
    morning: 'rītā',
    afternoon: 'dienā',
    evening: 'vakarā',
    night: 'naktī'
  },
  abbreviated: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusn.',
    noon: 'pusd.',
    morning: 'rītā',
    afternoon: 'pēcpusd.',
    evening: 'vakarā',
    night: 'naktī'
  },
  wide: {
    am: 'am',
    pm: 'pm',
    midnight: 'pusnaktī',
    noon: 'pusdienlaikā',
    morning: 'rītā',
    afternoon: 'pēcpusdienā',
    evening: 'vakarā',
    night: 'naktī'
  }
};

function ordinalNumber$y(number, _options) {
  return number + '.';
}

var localize$y = {
  ordinalNumber: ordinalNumber$y,
  era: buildLocalizeFn({
    values: eraValues$y,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$y,
    defaultWidth: 'wide',
    formattingValues: formattingQuarterValues$2,
    defaultFormattingWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$y,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$7,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$y,
    defaultWidth: 'wide',
    formattingValues: formattingDayValues$2,
    defaultFormattingWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$y,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$s,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$y = /^(\d+)\./i;
var parseOrdinalNumberPattern$y = /\d+/i;
var matchEraPatterns$y = {
  narrow: /^(p\.m\.ē|m\.ē)/i,
  abbreviated: /^(p\. m\. ē\.|m\. ē\.)/i,
  wide: /^(pirms mūsu ēras|mūsu ērā)/i
};
var parseEraPatterns$y = {
  any: [/^p/i, /^m/i]
};
var matchQuarterPatterns$y = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](\. cet\.)/i,
  wide: /^(pirma(is|jā)|otra(is|jā)|treša(is|jā)|ceturta(is|jā)) ceturksn(is|ī)/i
};
var parseQuarterPatterns$y = {
  narrow: [/^1/i, /^2/i, /^3/i, /^4/i],
  abbreviated: [/^1/i, /^2/i, /^3/i, /^4/i],
  wide: [/^p/i, /^o/i, /^t/i, /^c/i]
};
var matchMonthPatterns$y = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv\.|febr\.|marts|apr\.|maijs|jūn\.|jūl\.|aug\.|sept\.|okt\.|nov\.|dec\.)/i,
  wide: /^(janvār(is|ī)|februār(is|ī)|mart[sā]|aprīl(is|ī)|maij[sā]|jūnij[sā]|jūlij[sā]|august[sā]|septembr(is|ī)|oktobr(is|ī)|novembr(is|ī)|decembr(is|ī))/i
};
var parseMonthPatterns$y = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^mai/i, /^jūn/i, /^jūl/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$y = {
  narrow: /^[spotc]/i,
  short: /^(sv|pi|o|t|c|pk|s)/i,
  abbreviated: /^(svētd\.|pirmd\.|otrd.\|trešd\.|ceturtd\.|piektd\.|sestd\.)/i,
  wide: /^(svētdien(a|ā)|pirmdien(a|ā)|otrdien(a|ā)|trešdien(a|ā)|ceturtdien(a|ā)|piektdien(a|ā)|sestdien(a|ā))/i
};
var parseDayPatterns$y = {
  narrow: [/^s/i, /^p/i, /^o/i, /^t/i, /^c/i, /^p/i, /^s/i],
  any: [/^sv/i, /^pi/i, /^o/i, /^t/i, /^c/i, /^p/i, /^se/i]
};
var matchDayPeriodPatterns$y = {
  narrow: /^(am|pm|pusn\.|pusd\.|rīt(s|ā)|dien(a|ā)|vakar(s|ā)|nakt(s|ī))/,
  abbreviated: /^(am|pm|pusn\.|pusd\.|rīt(s|ā)|pēcpusd\.|vakar(s|ā)|nakt(s|ī))/,
  wide: /^(am|pm|pusnakt(s|ī)|pusdienlaik(s|ā)|rīt(s|ā)|pēcpusdien(a|ā)|vakar(s|ā)|nakt(s|ī))/i
};
var parseDayPeriodPatterns$y = {
  any: {
    am: /^am/i,
    pm: /^pm/i,
    midnight: /^pusn/i,
    noon: /^pusd/i,
    morning: /^r/i,
    afternoon: /^(d|pēc)/i,
    evening: /^v/i,
    night: /^n/i
  }
};
var match$y = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$y,
    parsePattern: parseOrdinalNumberPattern$y,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$y,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$y,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$y,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$y,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$y,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$y,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$y,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$y,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$y,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$y,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Latvian locale (Latvia).
 * @language Latvian
 * @iso-639-2 lav
 * @author Rūdolfs Puķītis [@prudolfs]{@link https://github.com/prudolfs}
 */

var locale$C = {
  code: 'lv',
  formatDistance: formatDistance$z,
  formatLong: formatLong$C,
  formatRelative: formatRelative$y,
  localize: localize$y,
  match: match$y,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$z = {
  lessThanXSeconds: {
    one: 'kurang dari 1 saat',
    other: 'kurang dari {{count}} saat'
  },
  xSeconds: {
    one: '1 saat',
    other: '{{count}} saat'
  },
  halfAMinute: 'setengah minit',
  lessThanXMinutes: {
    one: 'kurang dari 1 minit',
    other: 'kurang dari {{count}} minit'
  },
  xMinutes: {
    one: '1 minit',
    other: '{{count}} minit'
  },
  aboutXHours: {
    one: 'sekitar 1 jam',
    other: 'sekitar {{count}} jam'
  },
  xHours: {
    one: '1 jam',
    other: '{{count}} jam'
  },
  xDays: {
    one: '1 hari',
    other: '{{count}} hari'
  },
  aboutXMonths: {
    one: 'sekitar 1 bulan',
    other: 'sekitar {{count}} bulan'
  },
  xMonths: {
    one: '1 bulan',
    other: '{{count}} bulan'
  },
  aboutXYears: {
    one: 'sekitar 1 tahun',
    other: 'sekitar {{count}} tahun'
  },
  xYears: {
    one: '1 tahun',
    other: '{{count}} tahun'
  },
  overXYears: {
    one: 'lebih dari 1 tahun',
    other: 'lebih dari {{count}} tahun'
  },
  almostXYears: {
    one: 'hampir 1 tahun',
    other: 'hampir {{count}} tahun'
  }
};
function formatDistance$A(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$z[token] === 'string') {
    result = formatDistanceLocale$z[token];
  } else if (count === 1) {
    result = formatDistanceLocale$z[token].one;
  } else {
    result = formatDistanceLocale$z[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'dalam masa ' + result;
    } else {
      return result + ' yang lalu';
    }
  }

  return result;
}

var dateFormats$D = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'd/M/yyyy'
};
var timeFormats$D = {
  full: 'HH.mm.ss',
  long: 'HH.mm.ss',
  medium: 'HH.mm',
  short: 'HH.mm'
};
var dateTimeFormats$D = {
  full: "{{date}} 'pukul' {{time}}",
  long: "{{date}} 'pukul' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$D = {
  date: buildFormatLongFn({
    formats: dateFormats$D,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$D,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$D,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$z = {
  lastWeek: "eeee 'lepas pada jam' p",
  yesterday: "'Semalam pada jam' p",
  today: "'Hari ini pada jam' p",
  tomorrow: "'Esok pada jam' p",
  nextWeek: "eeee 'pada jam' p",
  other: 'P'
};
function formatRelative$z(token, _date, _baseDate, _options) {
  return formatRelativeLocale$z[token];
}

// https://www.unicode.org/cldr/charts/32/summary/ms.html

var eraValues$z = {
  narrow: ['SM', 'M'],
  abbreviated: ['SM', 'M'],
  wide: ['Sebelum Masihi', 'Masihi']
};
var quarterValues$z = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['S1', 'S2', 'S3', 'S4'],
  wide: ['Suku pertama', 'Suku kedua', 'Suku ketiga', 'Suku keempat'] // Note: in Malay, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$z = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'O', 'S', 'O', 'N', 'D'],
  abbreviated: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'],
  wide: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
};
var dayValues$z = {
  narrow: ['A', 'I', 'S', 'R', 'K', 'J', 'S'],
  short: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
  abbreviated: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
  wide: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
};
var dayPeriodValues$z = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'tgh malam',
    noon: 'tgh hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  }
};
var formattingDayPeriodValues$t = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'tengah malam',
    noon: 'tengah hari',
    morning: 'pagi',
    afternoon: 'tengah hari',
    evening: 'petang',
    night: 'malam'
  }
};

function ordinalNumber$z(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // Can't use "pertama", "kedua" because can't be parsed

  switch (number) {
    default:
      return 'ke-' + number;
  }
}

var localize$z = {
  ordinalNumber: ordinalNumber$z,
  era: buildLocalizeFn({
    values: eraValues$z,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$z,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$z,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$z,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$z,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$t,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$z = /^ke-(\d+)?/i;
var parseOrdinalNumberPattern$z = /petama|\d+/i;
var matchEraPatterns$z = {
  narrow: /^(sm|m)/i,
  abbreviated: /^(s\.?\s?m\.?|m\.?)/i,
  wide: /^(sebelum masihi|masihi)/i
};
var parseEraPatterns$z = {
  any: [/^s/i, /^(m)/i]
};
var matchQuarterPatterns$z = {
  narrow: /^[1234]/i,
  abbreviated: /^S[1234]/i,
  wide: /Suku (pertama|kedua|ketiga|keempat)/i
};
var parseQuarterPatterns$z = {
  any: [/pertama|1/i, /kedua|2/i, /ketiga|3/i, /keempat|4/i]
};
var matchMonthPatterns$z = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mac|apr|mei|jun|jul|ogo|sep|okt|nov|dis)/i,
  wide: /^(januari|februari|mac|april|mei|jun|julai|ogos|september|oktober|november|disember)/i
};
var parseMonthPatterns$z = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^o/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^ma/i, /^ap/i, /^me/i, /^jun/i, /^jul/i, /^og/i, /^s/i, /^ok/i, /^n/i, /^d/i]
};
var matchDayPatterns$z = {
  narrow: /^[aisrkj]/i,
  short: /^(ahd|isn|sel|rab|kha|jum|sab)/i,
  abbreviated: /^(ahd|isn|sel|rab|kha|jum|sab)/i,
  wide: /^(ahad|isnin|selasa|rabu|khamis|jumaat|sabtu)/i
};
var parseDayPatterns$z = {
  narrow: [/^a/i, /^i/i, /^s/i, /^r/i, /^k/i, /^j/i, /^s/i],
  any: [/^a/i, /^i/i, /^se/i, /^r/i, /^k/i, /^j/i, /^sa/i]
};
var matchDayPeriodPatterns$z = {
  narrow: /^(am|pm|tengah malam|tengah hari|pagi|petang|malam)/i,
  any: /^([ap]\.?\s?m\.?|tengah malam|tengah hari|pagi|petang|malam)/i
};
var parseDayPeriodPatterns$z = {
  any: {
    am: /^a/i,
    pm: /^pm/i,
    midnight: /^tengah m/i,
    noon: /^tengah h/i,
    morning: /pa/i,
    afternoon: /tengah h/i,
    evening: /pe/i,
    night: /m/i
  }
};
var match$z = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$z,
    parsePattern: parseOrdinalNumberPattern$z,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$z,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$z,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$z,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$z,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$z,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$z,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$z,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$z,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$z,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$z,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Malay locale.
 * @language Malay
 * @iso-639-2 msa
 * @author Ruban Selvarajah [@Zyten]{@link https://github.com/Zyten}
 */

var locale$D = {
  code: 'ms',
  formatDistance: formatDistance$A,
  formatLong: formatLong$D,
  formatRelative: formatRelative$z,
  localize: localize$z,
  match: match$z,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$A = {
  lessThanXSeconds: {
    singular: 'mindre enn ett sekund',
    plural: 'mindre enn {{count}} sekunder'
  },
  xSeconds: {
    singular: 'ett sekund',
    plural: '{{count}} sekunder'
  },
  halfAMinute: 'et halvt minutt',
  lessThanXMinutes: {
    singular: 'mindre enn ett minutt',
    plural: 'mindre enn {{count}} minutter'
  },
  xMinutes: {
    singular: 'ett minutt',
    plural: '{{count}} minutter'
  },
  aboutXHours: {
    singular: 'omtrent en time',
    plural: 'omtrent {{count}} timer'
  },
  xHours: {
    singular: 'en time',
    plural: '{{count}} timer'
  },
  xDays: {
    singular: 'en dag',
    plural: '{{count}} dager'
  },
  aboutXMonths: {
    singular: 'omtrent en måned',
    plural: 'omtrent {{count}} måneder'
  },
  xMonths: {
    singular: 'en måned',
    plural: '{{count}} måneder'
  },
  aboutXYears: {
    singular: 'omtrent ett år',
    plural: 'omtrent {{count}} år'
  },
  xYears: {
    singular: 'ett år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'over ett år',
    plural: 'over {{count}} år'
  },
  almostXYears: {
    singular: 'nesten ett år',
    plural: 'nesten {{count}} år'
  }
};
var wordMapping = ['null', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv'];
function formatDistance$B(token, count, options) {
  options = options || {
    onlyNumeric: false
  };
  var translation = formatDistanceLocale$A[token];
  var result;

  if (typeof translation === 'string') {
    result = translation;
  } else if (count === 0 || count > 1) {
    if (options.onlyNumeric) {
      result = translation.plural.replace('{{count}}', count);
    } else {
      result = translation.plural.replace('{{count}}', count < 13 ? wordMapping[count] : count);
    }
  } else {
    result = translation.singular;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' siden';
    }
  }

  return result;
}

var dateFormats$E = {
  full: 'EEEE d. MMMM y',
  long: 'd. MMMM y',
  medium: 'd. MMM y',
  short: 'dd.MM.y'
};
var timeFormats$E = {
  full: "'kl'. HH:mm:ss zzzz",
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$E = {
  full: "{{date}} 'kl.' {{time}}",
  long: "{{date}} 'kl.' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$E = {
  date: buildFormatLongFn({
    formats: dateFormats$E,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$E,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$E,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$A = {
  lastWeek: "'forrige' eeee 'kl.' p",
  yesterday: "'i går kl.' p",
  today: "'i dag kl.' p",
  tomorrow: "'i morgen kl.' p",
  nextWeek: "EEEE 'kl.' p",
  other: 'P'
};
function formatRelative$A(token, _date, _baseDate, _options) {
  return formatRelativeLocale$A[token];
}

var eraValues$A = {
  narrow: ['f.Kr.', 'e.Kr.'],
  abbreviated: ['f.Kr.', 'e.Kr.'],
  wide: ['før Kristus', 'etter Kristus']
};
var quarterValues$A = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var monthValues$A = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan.', 'feb.', 'mars', 'apr.', 'mai', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'],
  wide: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']
};
var dayValues$A = {
  narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  short: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'],
  abbreviated: ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'],
  wide: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag']
};
var dayPeriodValues$A = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på etterm.',
    evening: 'på kvelden',
    night: 'på natten'
  },
  abbreviated: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på etterm.',
    evening: 'på kvelden',
    night: 'på natten'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morgenen',
    afternoon: 'på ettermiddagen',
    evening: 'på kvelden',
    night: 'på natten'
  }
};

function ordinalNumber$A(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$A = {
  ordinalNumber: ordinalNumber$A,
  era: buildLocalizeFn({
    values: eraValues$A,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$A,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$A,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$A,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$A,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$A = /^(\d+)\.?/i;
var parseOrdinalNumberPattern$A = /\d+/i;
var matchEraPatterns$A = {
  narrow: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
  abbreviated: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
  wide: /^(før Kristus|før vår tid|etter Kristus|vår tid)/i
};
var parseEraPatterns$A = {
  any: [/^f/i, /^e/i]
};
var matchQuarterPatterns$A = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? kvartal/i
};
var parseQuarterPatterns$A = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$A = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
  wide: /^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i
};
var parseMonthPatterns$A = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^mai/i, /^jun/i, /^jul/i, /^aug/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$A = {
  narrow: /^[smtofl]/i,
  short: /^(sø|ma|ti|on|to|fr|lø)/i,
  abbreviated: /^(søn|man|tir|ons|tor|fre|lør)/i,
  wide: /^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i
};
var parseDayPatterns$A = {
  any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i]
};
var matchDayPeriodPatterns$A = {
  narrow: /^(midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten)|[ap])/i,
  any: /^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten))/i
};
var parseDayPeriodPatterns$A = {
  any: {
    am: /^a(\.?\s?m\.?)?$/i,
    pm: /^p(\.?\s?m\.?)?$/i,
    midnight: /^midn/i,
    noon: /^midd/i,
    morning: /morgen/i,
    afternoon: /ettermiddag/i,
    evening: /kveld/i,
    night: /natt/i
  }
};
var match$A = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$A,
    parsePattern: parseOrdinalNumberPattern$A,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$A,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$A,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$A,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$A,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$A,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$A,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$A,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$A,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$A,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$A,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Norwegian Bokmål locale.
 * @language Norwegian Bokmål
 * @iso-639-2 nob
 * @author Hans-Kristian Koren [@Hanse]{@link https://github.com/Hanse}
 * @author Mikolaj Grzyb [@mikolajgrzyb]{@link https://github.com/mikolajgrzyb}
 * @author Dag Stuan [@dagstuan]{@link https://github.com/dagstuan}
 */

var locale$E = {
  code: 'nb',
  formatDistance: formatDistance$B,
  formatLong: formatLong$E,
  formatRelative: formatRelative$A,
  localize: localize$A,
  match: match$A,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$B = {
  lessThanXSeconds: {
    one: 'minder dan een seconde',
    other: 'minder dan {{count}} seconden'
  },
  xSeconds: {
    one: '1 seconde',
    other: '{{count}} seconden'
  },
  halfAMinute: 'een halve minuut',
  lessThanXMinutes: {
    one: 'minder dan een minuut',
    other: 'minder dan {{count}} minuten'
  },
  xMinutes: {
    one: 'een minuut',
    other: '{{count}} minuten'
  },
  aboutXHours: {
    one: 'ongeveer 1 uur',
    other: 'ongeveer {{count}} uur'
  },
  xHours: {
    one: '1 uur',
    other: '{{count}} uur'
  },
  xDays: {
    one: '1 dag',
    other: '{{count}} dagen'
  },
  aboutXMonths: {
    one: 'ongeveer 1 maand',
    other: 'ongeveer {{count}} maanden'
  },
  xMonths: {
    one: '1 maand',
    other: '{{count}} maanden'
  },
  aboutXYears: {
    one: 'ongeveer 1 jaar',
    other: 'ongeveer {{count}} jaar'
  },
  xYears: {
    one: '1 jaar',
    other: '{{count}} jaar'
  },
  overXYears: {
    one: 'meer dan 1 jaar',
    other: 'meer dan {{count}} jaar'
  },
  almostXYears: {
    one: 'bijna 1 jaar',
    other: 'bijna {{count}} jaar'
  }
};
function formatDistance$C(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$B[token] === 'string') {
    result = formatDistanceLocale$B[token];
  } else if (count === 1) {
    result = formatDistanceLocale$B[token].one;
  } else {
    result = formatDistanceLocale$B[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'over ' + result;
    } else {
      return result + ' geleden';
    }
  }

  return result;
}

var dateFormats$F = {
  full: 'EEEE d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'dd-MM-y'
};
var timeFormats$F = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$F = {
  full: "{{date}} 'om' {{time}}",
  long: "{{date}} 'om' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$F = {
  date: buildFormatLongFn({
    formats: dateFormats$F,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$F,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$F,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$B = {
  lastWeek: "'afgelopen' eeee 'om' p",
  yesterday: "'gisteren om' p",
  today: "'vandaag om' p",
  tomorrow: "'morgen om' p",
  nextWeek: "eeee 'om' p",
  other: 'P'
};
function formatRelative$B(token, _date, _baseDate, _options) {
  return formatRelativeLocale$B[token];
}

var eraValues$B = {
  narrow: ['v.C.', 'n.C.'],
  abbreviated: ['v.Chr.', 'n.Chr.'],
  wide: ['voor Christus', 'na Christus']
};
var quarterValues$B = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['K1', 'K2', 'K3', 'K4'],
  wide: ['1e kwartaal', '2e kwartaal', '3e kwartaal', '4e kwartaal']
};
var monthValues$B = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan.', 'feb.', 'mrt.', 'apr.', 'mei.', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
  wide: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
};
var dayValues$B = {
  narrow: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
  short: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
  abbreviated: ['zon', 'maa', 'din', 'woe', 'don', 'vri', 'zat'],
  wide: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
};
var dayPeriodValues$B = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'middernacht',
    noon: 'het middaguur',
    morning: '\'s ochtends',
    afternoon: '\'s middags',
    evening: '\'s avonds',
    night: '\'s nachts'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'middernacht',
    noon: 'het middaguur',
    morning: '\'s ochtends',
    afternoon: '\'s middags',
    evening: '\'s avonds',
    night: '\'s nachts'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'middernacht',
    noon: 'het middaguur',
    morning: '\'s ochtends',
    afternoon: '\'s middags',
    evening: '\'s avonds',
    night: '\'s nachts'
  }
};

function ordinalNumber$B(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + 'e';
}

var localize$B = {
  ordinalNumber: ordinalNumber$B,
  era: buildLocalizeFn({
    values: eraValues$B,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$B,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$B,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$B,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$B,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$B = /^(\d+)e?/i;
var parseOrdinalNumberPattern$B = /\d+/i;
var matchEraPatterns$B = {
  narrow: /^([vn]\.? ?C\.?)/,
  abbreviated: /^([vn]\. ?Chr\.?)/,
  wide: /^((voor|na) Christus)/
};
var parseEraPatterns$B = {
  any: [/^v/, /^n/]
};
var matchQuarterPatterns$B = {
  narrow: /^[1234]/i,
  abbreviated: /^K[1234]/i,
  wide: /^[1234]e kwartaal/i
};
var parseQuarterPatterns$B = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$B = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)\.?/i,
  wide: /^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i
};
var parseMonthPatterns$B = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^jan/i, /^feb/i, /^m(r|a)/i, /^apr/i, /^mei/i, /^jun/i, /^jul/i, /^aug/i, /^sep/i, /^okt/i, /^nov/i, /^dec/i]
};
var matchDayPatterns$B = {
  narrow: /^[zmdwv]/i,
  short: /^(zo|ma|di|wo|do|vr|za)/i,
  abbreviated: /^(zon|maa|din|woe|don|vri|zat)/i,
  wide: /^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)/i
};
var parseDayPatterns$B = {
  narrow: [/^z/i, /^m/i, /^d/i, /^w/i, /^d/i, /^v/i, /^z/i],
  any: [/^zo/i, /^ma/i, /^di/i, /^wo/i, /^do/i, /^vr/i, /^za/i]
};
var matchDayPeriodPatterns$B = {
  any: /^(am|pm|middernacht|het middaguur|'s (ochtends|middags|avonds|nachts))/i
};
var parseDayPeriodPatterns$B = {
  any: {
    am: /^am/i,
    pm: /^pm/i,
    midnight: /^middernacht/i,
    noon: /^het middaguur/i,
    morning: /ochtend/i,
    afternoon: /middag/i,
    evening: /avond/i,
    night: /nacht/i
  }
};
var match$B = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$B,
    parsePattern: parseOrdinalNumberPattern$B,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$B,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$B,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$B,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$B,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$B,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$B,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$B,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$B,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$B,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$B,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Dutch locale.
 * @language Dutch
 * @iso-639-2 nld
 * @author Jorik Tangelder [@jtangelder]{@link https://github.com/jtangelder}
 * @author Ruben Stolk [@rubenstolk]{@link https://github.com/rubenstolk}
 * @author Lode Vanhove [@bitcrumb]{@link https://github.com/bitcrumb}
 * @author Edo Rivai [@edorivai]{@link https://github.com/edorivai}
 * @author Niels Keurentjes [@curry684]{@link https://github.com/curry684}
 * @author Stefan Vermaas [@stefanvermaas]{@link https://github.com/stefanvermaas}
 */

var locale$F = {
  code: 'nl',
  formatDistance: formatDistance$C,
  formatLong: formatLong$F,
  formatRelative: formatRelative$B,
  localize: localize$B,
  match: match$B,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$C = {
  lessThanXSeconds: {
    singular: 'mindre enn eitt sekund',
    plural: 'mindre enn {{count}} sekund'
  },
  xSeconds: {
    singular: 'eitt sekund',
    plural: '{{count}} sekund'
  },
  halfAMinute: 'eit halvt minutt',
  lessThanXMinutes: {
    singular: 'mindre enn eitt minutt',
    plural: 'mindre enn {{count}} minutt'
  },
  xMinutes: {
    singular: 'eitt minutt',
    plural: '{{count}} minutt'
  },
  aboutXHours: {
    singular: 'omtrent ein time',
    plural: 'omtrent {{count}} timar'
  },
  xHours: {
    singular: 'ein time',
    plural: '{{count}} timar'
  },
  xDays: {
    singular: 'ein dag',
    plural: '{{count}} dagar'
  },
  aboutXMonths: {
    singular: 'omtrent ein månad',
    plural: 'omtrent {{count}} månader'
  },
  xMonths: {
    singular: 'ein månad',
    plural: '{{count}} månader'
  },
  aboutXYears: {
    singular: 'omtrent eitt år',
    plural: 'omtrent {{count}} år'
  },
  xYears: {
    singular: 'eitt år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'over eitt år',
    plural: 'over {{count}} år'
  },
  almostXYears: {
    singular: 'nesten eitt år',
    plural: 'nesten {{count}} år'
  }
};
var wordMapping$1 = ['null', 'ein', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv'];
function formatDistance$D(token, count, options) {
  options = options || {
    onlyNumeric: false
  };
  var translation = formatDistanceLocale$C[token];
  var result;

  if (typeof translation === 'string') {
    result = translation;
  } else if (count === 0 || count > 1) {
    if (options.onlyNumeric) {
      result = translation.plural.replace('{{count}}', count);
    } else {
      result = translation.plural.replace('{{count}}', count < 13 ? wordMapping$1[count] : count);
    }
  } else {
    result = translation.singular;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' sidan';
    }
  }

  return result;
}

var dateFormats$G = {
  full: 'EEEE d. MMMM y',
  long: 'd. MMMM y',
  medium: 'd. MMM y',
  short: 'dd.MM.y'
};
var timeFormats$G = {
  full: "'kl'. HH:mm:ss zzzz",
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$G = {
  full: "{{date}} 'kl.' {{time}}",
  long: "{{date}} 'kl.' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$G = {
  date: buildFormatLongFn({
    formats: dateFormats$G,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$G,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$G,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$C = {
  lastWeek: "'førre' eeee 'kl.' p",
  yesterday: "'i går kl.' p",
  today: "'i dag kl.' p",
  tomorrow: "'i morgon kl.' p",
  nextWeek: "EEEE 'kl.' p",
  other: 'P'
};
function formatRelative$C(token, _date, _baseDate, _options) {
  return formatRelativeLocale$C[token];
}

var eraValues$C = {
  narrow: ['f.Kr.', 'e.Kr.'],
  abbreviated: ['f.Kr.', 'e.Kr.'],
  wide: ['før Kristus', 'etter Kristus']
};
var quarterValues$C = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var monthValues$C = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan.', 'feb.', 'mars', 'apr.', 'mai', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'],
  wide: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']
};
var dayValues$C = {
  narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  short: ['su', 'må', 'ty', 'on', 'to', 'fr', 'lau'],
  abbreviated: ['sun', 'mån', 'tys', 'ons', 'tor', 'fre', 'laur'],
  wide: ['sundag', 'måndag', 'tysdag', 'onsdag', 'torsdag', 'fredag', 'laurdag']
};
var dayPeriodValues$C = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på etterm.',
    evening: 'på kvelden',
    night: 'på natta'
  },
  abbreviated: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på etterm.',
    evening: 'på kvelden',
    night: 'på natta'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morgonen',
    afternoon: 'på ettermiddagen',
    evening: 'på kvelden',
    night: 'på natta'
  }
};

function ordinalNumber$C(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$C = {
  ordinalNumber: ordinalNumber$C,
  era: buildLocalizeFn({
    values: eraValues$C,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$C,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$C,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$C,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$C,
    defaultWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$C = /^(\d+)\.?/i;
var parseOrdinalNumberPattern$C = /\d+/i;
var matchEraPatterns$C = {
  narrow: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
  abbreviated: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
  wide: /^(før Kristus|før vår tid|etter Kristus|vår tid)/i
};
var parseEraPatterns$C = {
  any: [/^f/i, /^e/i]
};
var matchQuarterPatterns$C = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? kvartal/i
};
var parseQuarterPatterns$C = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$C = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
  wide: /^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i
};
var parseMonthPatterns$C = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^mai/i, /^jun/i, /^jul/i, /^aug/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$C = {
  narrow: /^[smtofl]/i,
  short: /^(su|må|ty|on|to|fr|la)/i,
  abbreviated: /^(sun|mån|tys|ons|tor|fre|laur)/i,
  wide: /^(sundag|måndag|tysdag|onsdag|torsdag|fredag|laurdag)/i
};
var parseDayPatterns$C = {
  any: [/^s/i, /^m/i, /^ty/i, /^o/i, /^to/i, /^f/i, /^l/i]
};
var matchDayPeriodPatterns$C = {
  narrow: /^(midnatt|middag|(på) (morgonen|ettermiddagen|kvelden|natta)|[ap])/i,
  any: /^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgonen|ettermiddagen|kvelden|natta))/i
};
var parseDayPeriodPatterns$C = {
  any: {
    am: /^a(\.?\s?m\.?)?$/i,
    pm: /^p(\.?\s?m\.?)?$/i,
    midnight: /^midn/i,
    noon: /^midd/i,
    morning: /morgon/i,
    afternoon: /ettermiddag/i,
    evening: /kveld/i,
    night: /natt/i
  }
};
var match$C = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$C,
    parsePattern: parseOrdinalNumberPattern$C,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$C,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$C,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$C,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$C,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$C,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$C,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$C,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$C,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$C,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$C,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Norwegian Nynorsk locale.
 * @language Norwegian Nynorsk
 * @iso-639-2 nno
 * @author Mats Byrkjeland [@draperunner]{@link https://github.com/draperunner}
 */

var locale$G = {
  code: 'nn',
  formatDistance: formatDistance$D,
  formatLong: formatLong$G,
  formatRelative: formatRelative$C,
  localize: localize$C,
  match: match$C,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

function declensionGroup(scheme, count) {
  if (count === 1) {
    return scheme.one;
  }

  var rem100 = count % 100; // ends with 11-20

  if (rem100 <= 20 && rem100 > 10) {
    return scheme.other;
  }

  var rem10 = rem100 % 10; // ends with 2, 3, 4

  if (rem10 >= 2 && rem10 <= 4) {
    return scheme.twoFour;
  }

  return scheme.other;
}

function declension$2(scheme, count, time) {
  time = time || 'regular';
  var group = declensionGroup(scheme, count);
  var finalText = group[time] || group;
  return finalText.replace('{{count}}', count);
}

var formatDistanceLocale$D = {
  lessThanXSeconds: {
    one: {
      regular: 'mniej niż sekunda',
      past: 'mniej niż sekundę',
      future: 'mniej niż sekundę'
    },
    twoFour: 'mniej niż {{count}} sekundy',
    other: 'mniej niż {{count}} sekund'
  },
  xSeconds: {
    one: {
      regular: 'sekunda',
      past: 'sekundę',
      future: 'sekundę'
    },
    twoFour: '{{count}} sekundy',
    other: '{{count}} sekund'
  },
  halfAMinute: {
    one: 'pół minuty',
    twoFour: 'pół minuty',
    other: 'pół minuty'
  },
  lessThanXMinutes: {
    one: {
      regular: 'mniej niż minuta',
      past: 'mniej niż minutę',
      future: 'mniej niż minutę'
    },
    twoFour: 'mniej niż {{count}} minuty',
    other: 'mniej niż {{count}} minut'
  },
  xMinutes: {
    one: {
      regular: 'minuta',
      past: 'minutę',
      future: 'minutę'
    },
    twoFour: '{{count}} minuty',
    other: '{{count}} minut'
  },
  aboutXHours: {
    one: {
      regular: 'około godzina',
      past: 'około godziny',
      future: 'około godzinę'
    },
    twoFour: 'około {{count}} godziny',
    other: 'około {{count}} godzin'
  },
  xHours: {
    one: {
      regular: 'godzina',
      past: 'godzinę',
      future: 'godzinę'
    },
    twoFour: '{{count}} godziny',
    other: '{{count}} godzin'
  },
  xDays: {
    one: {
      regular: 'dzień',
      past: 'dzień',
      future: '1 dzień'
    },
    twoFour: '{{count}} dni',
    other: '{{count}} dni'
  },
  aboutXMonths: {
    one: 'około miesiąc',
    twoFour: 'około {{count}} miesiące',
    other: 'około {{count}} miesięcy'
  },
  xMonths: {
    one: 'miesiąc',
    twoFour: '{{count}} miesiące',
    other: '{{count}} miesięcy'
  },
  aboutXYears: {
    one: 'około rok',
    twoFour: 'około {{count}} lata',
    other: 'około {{count}} lat'
  },
  xYears: {
    one: 'rok',
    twoFour: '{{count}} lata',
    other: '{{count}} lat'
  },
  overXYears: {
    one: 'ponad rok',
    twoFour: 'ponad {{count}} lata',
    other: 'ponad {{count}} lat'
  },
  almostXYears: {
    one: 'prawie rok',
    twoFour: 'prawie {{count}} lata',
    other: 'prawie {{count}} lat'
  }
};
function formatDistance$E(token, count, options) {
  options = options || {};
  var scheme = formatDistanceLocale$D[token];

  if (!options.addSuffix) {
    return declension$2(scheme, count);
  }

  if (options.comparison > 0) {
    return 'za ' + declension$2(scheme, count, 'future');
  } else {
    return declension$2(scheme, count, 'past') + ' temu';
  }
}

var dateFormats$H = {
  full: 'EEEE, do MMMM y',
  long: 'do MMMM y',
  medium: 'do MMM y',
  short: 'dd.MM.y'
};
var timeFormats$H = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$H = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$H = {
  date: buildFormatLongFn({
    formats: dateFormats$H,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$H,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$H,
    defaultWidth: 'full'
  })
};

var adjectivesLastWeek = {
  masculine: 'ostatni',
  feminine: 'ostatnia'
};
var adjectivesThisWeek = {
  masculine: 'ten',
  feminine: 'ta'
};
var adjectivesNextWeek = {
  masculine: 'następny',
  feminine: 'następna'
};
var dayGrammaticalGender = {
  0: 'feminine',
  1: 'masculine',
  2: 'masculine',
  3: 'feminine',
  4: 'masculine',
  5: 'masculine',
  6: 'feminine'
};

function getAdjectives(token, date, baseDate, options) {
  if (isSameUTCWeek(date, baseDate, options)) {
    return adjectivesThisWeek;
  } else if (token === 'lastWeek') {
    return adjectivesLastWeek;
  } else if (token === 'nextWeek') {
    return adjectivesNextWeek;
  } else {
    throw new Error("Cannot determine adjectives for token ".concat(token));
  }
}

function getAdjective(token, date, baseDate, options) {
  var day = date.getUTCDay();
  var adjectives = getAdjectives(token, date, baseDate, options);
  var grammaticalGender = dayGrammaticalGender[day];
  return adjectives[grammaticalGender];
}

function dayAndTimeWithAdjective(token, date, baseDate, options) {
  var adjective = getAdjective(token, date, baseDate, options);
  return "'".concat(adjective, "' eeee 'o' p");
}

var formatRelativeLocale$D = {
  lastWeek: dayAndTimeWithAdjective,
  yesterday: "'wczoraj o' p",
  today: "'dzisiaj o' p",
  tomorrow: "'jutro o' p",
  nextWeek: dayAndTimeWithAdjective,
  other: 'P'
};
function formatRelative$D(token, date, baseDate, options) {
  var format = formatRelativeLocale$D[token];

  if (typeof format === 'function') {
    return format(token, date, baseDate, options);
  }

  return format;
}

function ordinalNumber$D(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number);
}

var eraValues$D = {
  narrow: ['p.n.e.', 'n.e.'],
  abbreviated: ['p.n.e.', 'n.e.'],
  wide: ['przed naszą erą', 'naszej ery']
};
var quarterValues$D = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['I kw.', 'II kw.', 'III kw.', 'IV kw.'],
  wide: ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał']
};
var monthValues$D = {
  narrow: ['S', 'L', 'M', 'K', 'M', 'C', 'L', 'S', 'W', 'P', 'L', 'G'],
  abbreviated: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  wide: ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień']
};
var monthFormattingValues = {
  narrow: ['s', 'l', 'm', 'k', 'm', 'c', 'l', 's', 'w', 'p', 'l', 'g'],
  abbreviated: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  wide: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
};
var dayValues$D = {
  narrow: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
  short: ['nie', 'pon', 'wto', 'śro', 'czw', 'pią', 'sob'],
  abbreviated: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
  wide: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
};
var dayFormattingValues = {
  narrow: ['n', 'p', 'w', 'ś', 'c', 'p', 's'],
  short: ['nie', 'pon', 'wto', 'śro', 'czw', 'pią', 'sob'],
  abbreviated: ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'],
  wide: ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
};
var dayPeriodValues$D = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'półn.',
    noon: 'poł',
    morning: 'rano',
    afternoon: 'popoł.',
    evening: 'wiecz.',
    night: 'noc'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'północ',
    noon: 'południe',
    morning: 'rano',
    afternoon: 'popołudnie',
    evening: 'wieczór',
    night: 'noc'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'północ',
    noon: 'południe',
    morning: 'rano',
    afternoon: 'popołudnie',
    evening: 'wieczór',
    night: 'noc'
  }
};
var dayPeriodFormattingValues = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'o półn.',
    noon: 'w poł.',
    morning: 'rano',
    afternoon: 'po poł.',
    evening: 'wiecz.',
    night: 'w nocy'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'o północy',
    noon: 'w południe',
    morning: 'rano',
    afternoon: 'po południu',
    evening: 'wieczorem',
    night: 'w nocy'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'o północy',
    noon: 'w południe',
    morning: 'rano',
    afternoon: 'po południu',
    evening: 'wieczorem',
    night: 'w nocy'
  }
};
var localize$D = {
  ordinalNumber: ordinalNumber$D,
  era: buildLocalizeFn({
    values: eraValues$D,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$D,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$D,
    defaultWidth: 'wide',
    formattingValues: monthFormattingValues,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$D,
    defaultWidth: 'wide',
    formattingValues: dayFormattingValues,
    defaultFormattingWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$D,
    defaultWidth: 'wide',
    formattingValues: dayPeriodFormattingValues,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$D = /^(\d+)?/i;
var parseOrdinalNumberPattern$D = /\d+/i;
var matchEraPatterns$D = {
  narrow: /^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
  abbreviated: /^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
  wide: /^(przed\s*nasz(ą|a)\s*er(ą|a)|naszej\s*ery)/i
};
var parseEraPatterns$D = {
  any: [/^p/i, /^n/i]
};
var matchQuarterPatterns$D = {
  narrow: /^[1234]/i,
  abbreviated: /^(I|II|III|IV)\s*kw\.?/i,
  wide: /^(I|II|III|IV)\s*kwarta(ł|l)/i
};
var parseQuarterPatterns$D = {
  narrow: [/1/i, /2/i, /3/i, /4/i],
  any: [/^I kw/i, /^II kw/i, /^III kw/i, /^IV kw/i]
};
var matchMonthPatterns$D = {
  narrow: /^[slmkcwpg]/i,
  abbreviated: /^(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|pa(ź|z)|lis|gru)/i,
  wide: /^(stycznia|stycze(ń|n)|lutego|luty|marca|marzec|kwietnia|kwiecie(ń|n)|maja|maj|czerwca|czerwiec|lipca|lipiec|sierpnia|sierpie(ń|n)|wrze(ś|s)nia|wrzesie(ń|n)|pa(ź|z)dziernika|pa(ź|z)dziernik|listopada|listopad|grudnia|grudzie(ń|n))/i
};
var parseMonthPatterns$D = {
  narrow: [/^s/i, /^l/i, /^m/i, /^k/i, /^m/i, /^c/i, /^l/i, /^s/i, /^w/i, /^p/i, /^l/i, /^g/i],
  any: [/^st/i, /^lu/i, /^mar/i, /^k/i, /^maj/i, /^c/i, /^lip/i, /^si/i, /^w/i, /^p/i, /^lis/i, /^g/i]
};
var matchDayPatterns$D = {
  narrow: /^[npwścs]/i,
  short: /^(nie|pon|wto|(ś|s)ro|czw|pi(ą|a)|sob)/i,
  abbreviated: /^(niedz|pon|wt|(ś|s)r|czw|pt|sob)\.?/i,
  wide: /^(niedziela|poniedzia(ł|l)ek|wtorek|(ś|s)roda|czwartek|pi(ą|a)tek|sobota)/i
};
var parseDayPatterns$D = {
  narrow: [/^n/i, /^p/i, /^w/i, /^ś/i, /^c/i, /^p/i, /^s/i],
  abbreviated: [/^n/i, /^po/i, /^w/i, /^(ś|s)r/i, /^c/i, /^pt/i, /^so/i],
  any: [/^n/i, /^po/i, /^w/i, /^(ś|s)r/i, /^c/i, /^pi/i, /^so/i]
};
var matchDayPeriodPatterns$D = {
  narrow: /^(^a$|^p$|pó(ł|l)n\.?|o\s*pó(ł|l)n\.?|po(ł|l)\.?|w\s*po(ł|l)\.?|po\s*po(ł|l)\.?|rano|wiecz\.?|noc|w\s*nocy)/i,
  any: /^(am|pm|pó(ł|l)noc|o\s*pó(ł|l)nocy|po(ł|l)udnie|w\s*po(ł|l)udnie|popo(ł|l)udnie|po\s*po(ł|l)udniu|rano|wieczór|wieczorem|noc|w\s*nocy)/i
};
var parseDayPeriodPatterns$D = {
  narrow: {
    am: /^a$/i,
    pm: /^p$/i,
    midnight: /pó(ł|l)n/i,
    noon: /po(ł|l)/i,
    morning: /rano/i,
    afternoon: /po\s*po(ł|l)/i,
    evening: /wiecz/i,
    night: /noc/i
  },
  any: {
    am: /^am/i,
    pm: /^pm/i,
    midnight: /pó(ł|l)n/i,
    noon: /po(ł|l)/i,
    morning: /rano/i,
    afternoon: /po\s*po(ł|l)/i,
    evening: /wiecz/i,
    night: /noc/i
  }
};
var match$D = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$D,
    parsePattern: parseOrdinalNumberPattern$D,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$D,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$D,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$D,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$D,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$D,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$D,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$D,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$D,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$D,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$D,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Polish locale.
 * @language Polish
 * @iso-639-2 pol
 * @author Mateusz Derks [@ertrzyiks]{@link https://github.com/ertrzyiks}
 * @author Just RAG [@justrag]{@link https://github.com/justrag}
 * @author Mikolaj Grzyb [@mikolajgrzyb]{@link https://github.com/mikolajgrzyb}
 * @author Mateusz Tokarski [@mutisz]{@link https://github.com/mutisz}
 */

var locale$H = {
  code: 'pl',
  formatDistance: formatDistance$E,
  formatLong: formatLong$H,
  formatRelative: formatRelative$D,
  localize: localize$D,
  match: match$D,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$E = {
  lessThanXSeconds: {
    one: 'menos de um segundo',
    other: 'menos de {{count}} segundos'
  },
  xSeconds: {
    one: '1 segundo',
    other: '{{count}} segundos'
  },
  halfAMinute: 'meio minuto',
  lessThanXMinutes: {
    one: 'menos de um minuto',
    other: 'menos de {{count}} minutos'
  },
  xMinutes: {
    one: '1 minuto',
    other: '{{count}} minutos'
  },
  aboutXHours: {
    one: 'aproximadamente 1 hora',
    other: 'aproximadamente {{count}} horas'
  },
  xHours: {
    one: '1 hora',
    other: '{{count}} horas'
  },
  xDays: {
    one: '1 dia',
    other: '{{count}} dias'
  },
  aboutXMonths: {
    one: 'aproximadamente 1 mês',
    other: 'aproximadamente {{count}} meses'
  },
  xMonths: {
    one: '1 mês',
    other: '{{count}} meses'
  },
  aboutXYears: {
    one: 'aproximadamente 1 ano',
    other: 'aproximadamente {{count}} anos'
  },
  xYears: {
    one: '1 ano',
    other: '{{count}} anos'
  },
  overXYears: {
    one: 'mais de 1 ano',
    other: 'mais de {{count}} anos'
  },
  almostXYears: {
    one: 'quase 1 ano',
    other: 'quase {{count}} anos'
  }
};
function formatDistance$F(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$E[token] === 'string') {
    result = formatDistanceLocale$E[token];
  } else if (count === 1) {
    result = formatDistanceLocale$E[token].one;
  } else {
    result = formatDistanceLocale$E[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'daqui a ' + result;
    } else {
      return 'há ' + result;
    }
  }

  return result;
}

var dateFormats$I = {
  full: "EEEE, d 'de' MMMM 'de' y",
  long: "d 'de' MMMM 'de' y",
  medium: "d 'de' MMM 'de' y",
  short: 'dd/MM/y'
};
var timeFormats$I = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$I = {
  full: "{{date}} 'às' {{time}}",
  long: "{{date}} 'às' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$I = {
  date: buildFormatLongFn({
    formats: dateFormats$I,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$I,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$I,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$E = {
  lastWeek: "'na última' eeee 'às' p",
  yesterday: "'ontem às' p",
  today: "'hoje às' p",
  tomorrow: "'amanhã às' p",
  nextWeek: "eeee 'às' p",
  other: 'P'
};
function formatRelative$E(token, _date, _baseDate, _options) {
  return formatRelativeLocale$E[token];
}

function ordinalNumber$E(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number + 'º';
}

var eraValues$E = {
  narrow: ['aC', 'dC'],
  abbreviated: ['a.C.', 'd.C.'],
  wide: ['antes de Cristo', 'depois de Cristo']
};
var quarterValues$E = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues$E = {
  narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  wide: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
};
var dayValues$E = {
  narrow: ['d', 's', 't', 'q', 'q', 's', 's'],
  short: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  abbreviated: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  wide: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
};
var dayPeriodValues$E = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'noite',
    night: 'madrugada'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'noite',
    night: 'madrugada'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'noite',
    night: 'madrugada'
  }
};
var formattingDayPeriodValues$u = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da noite',
    night: 'da madrugada'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da noite',
    night: 'da madrugada'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da noite',
    night: 'da madrugada'
  }
};
var localize$E = {
  ordinalNumber: ordinalNumber$E,
  era: buildLocalizeFn({
    values: eraValues$E,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$E,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$E,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$E,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$E,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$u,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$E = /^(\d+)(º|ª)?/i;
var parseOrdinalNumberPattern$E = /\d+/i;
var matchEraPatterns$E = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
  wide: /^(antes de cristo|antes da era comum|depois de cristo|era comum)/i
};
var parseEraPatterns$E = {
  any: [/^ac/i, /^dc/i],
  wide: [/^(antes de cristo|antes da era comum)/i, /^(depois de cristo|era comum)/i]
};
var matchQuarterPatterns$E = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º|ª)? trimestre/i
};
var parseQuarterPatterns$E = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$E = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
  wide: /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
};
var parseMonthPatterns$E = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ab/i, /^may/i, /^jun/i, /^jul/i, /^ag/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$E = {
  narrow: /^[dstq]/i,
  short: /^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
  abbreviated: /^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
  wide: /^(domingo|segunda-?\s?feira|terça-?\s?feira|quarta-?\s?feira|quinta-?\s?feira|sexta-?\s?feira|s[áa]bado)/i
};
var parseDayPatterns$E = {
  narrow: [/^d/i, /^s/i, /^t/i, /^q/i, /^q/i, /^s/i, /^s/i],
  any: [/^d/i, /^seg/i, /^t/i, /^qua/i, /^qui/i, /^sex/i, /^s[áa]/i]
};
var matchDayPeriodPatterns$E = {
  narrow: /^(a|p|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i,
  any: /^([ap]\.?\s?m\.?|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i
};
var parseDayPeriodPatterns$E = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^meia/i,
    noon: /^meio/i,
    morning: /manh[ãa]/i,
    afternoon: /tarde/i,
    evening: /noite/i,
    night: /madrugada/i
  }
};
var match$E = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$E,
    parsePattern: parseOrdinalNumberPattern$E,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$E,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$E,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$E,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$E,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$E,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$E,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$E,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$E,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$E,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$E,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Portuguese locale.
 * @language Portuguese
 * @iso-639-2 por
 * @author Dário Freire [@dfreire]{@link https://github.com/dfreire}
 * @author Adrián de la Rosa [@adrm]{@link https://github.com/adrm}
 */

var locale$I = {
  code: 'pt',
  formatDistance: formatDistance$F,
  formatLong: formatLong$I,
  formatRelative: formatRelative$E,
  localize: localize$E,
  match: match$E,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$F = {
  lessThanXSeconds: {
    one: 'menos de um segundo',
    other: 'menos de {{count}} segundos'
  },
  xSeconds: {
    one: '1 segundo',
    other: '{{count}} segundos'
  },
  halfAMinute: 'meio minuto',
  lessThanXMinutes: {
    one: 'menos de um minuto',
    other: 'menos de {{count}} minutos'
  },
  xMinutes: {
    one: '1 minuto',
    other: '{{count}} minutos'
  },
  aboutXHours: {
    one: 'cerca de 1 hora',
    other: 'cerca de {{count}} horas'
  },
  xHours: {
    one: '1 hora',
    other: '{{count}} horas'
  },
  xDays: {
    one: '1 dia',
    other: '{{count}} dias'
  },
  aboutXMonths: {
    one: 'cerca de 1 mês',
    other: 'cerca de {{count}} meses'
  },
  xMonths: {
    one: '1 mês',
    other: '{{count}} meses'
  },
  aboutXYears: {
    one: 'cerca de 1 ano',
    other: 'cerca de {{count}} anos'
  },
  xYears: {
    one: '1 ano',
    other: '{{count}} anos'
  },
  overXYears: {
    one: 'mais de 1 ano',
    other: 'mais de {{count}} anos'
  },
  almostXYears: {
    one: 'quase 1 ano',
    other: 'quase {{count}} anos'
  }
};
function formatDistance$G(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$F[token] === 'string') {
    result = formatDistanceLocale$F[token];
  } else if (count === 1) {
    result = formatDistanceLocale$F[token].one;
  } else {
    result = formatDistanceLocale$F[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'em ' + result;
    } else {
      return 'há ' + result;
    }
  }

  return result;
}

var dateFormats$J = {
  full: "EEEE, d 'de' MMMM 'de' y",
  long: "d 'de' MMMM 'de' y",
  medium: 'd MMM y',
  short: 'dd/MM/yyyy'
};
var timeFormats$J = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$J = {
  full: "{{date}} 'às' {{time}}",
  long: "{{date}} 'às' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$J = {
  date: buildFormatLongFn({
    formats: dateFormats$J,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$J,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$J,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$F = {
  lastWeek: function (date, _baseDate, _options) {
    var weekday = date.getUTCDay();
    var last = weekday === 0 || weekday === 6 ? 'último' : 'última';
    return "'" + last + "' eeee 'às' p";
  },
  yesterday: "'ontem às' p",
  today: "'hoje às' p",
  tomorrow: "'amanhã às' p",
  nextWeek: "eeee 'às' p",
  other: 'P'
};
function formatRelative$F(token, date, baseDate, options) {
  var format = formatRelativeLocale$F[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$F = {
  narrow: ['AC', 'DC'],
  abbreviated: ['AC', 'DC'],
  wide: ['antes de cristo', 'depois de cristo']
};
var quarterValues$F = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues$F = {
  narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  wide: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
};
var dayValues$F = {
  narrow: ['do', '2ª', '3ª', '4ª', '5ª', '6ª', 'sá'],
  short: ['do', '2ª', '3ª', '4ª', '5ª', '6ª', 'sá'],
  abbreviated: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
  wide: ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
};
var dayPeriodValues$F = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noite'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noite'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'tarde',
    night: 'noite'
  }
};
var formattingDayPeriodValues$v = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'md',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da tarde',
    night: 'da noite'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da tarde',
    night: 'da noite'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'meia-noite',
    noon: 'meio-dia',
    morning: 'da manhã',
    afternoon: 'da tarde',
    evening: 'da tarde',
    night: 'da noite'
  }
};

function ordinalNumber$F(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber);
  var options = dirtyOptions || {};
  var unit = String(options.unit);

  if (unit === 'week' || unit === 'isoWeek') {
    return number + 'ª';
  }

  return number + 'º';
}

var localize$F = {
  ordinalNumber: ordinalNumber$F,
  era: buildLocalizeFn({
    values: eraValues$F,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$F,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$F,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$F,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$F,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$v,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$F = /^(\d+)[ºªo]?/i;
var parseOrdinalNumberPattern$F = /\d+/i;
var matchEraPatterns$F = {
  narrow: /^(ac|dc|a|d)/i,
  abbreviated: /^(a\.?\s?c\.?|d\.?\s?c\.?)/i,
  wide: /^(antes de cristo|depois de cristo)/i
};
var parseEraPatterns$F = {
  any: [/^ac/i, /^dc/i],
  wide: [/^antes de cristo/i, /^depois de cristo/i]
};
var matchQuarterPatterns$F = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^[1234](º)? trimestre/i
};
var parseQuarterPatterns$F = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$F = {
  narrow: /^[jfmajsond]/i,
  abbreviated: /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
  wide: /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
};
var parseMonthPatterns$F = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^fev/i, /^mar/i, /^abr/i, /^mai/i, /^jun/i, /^jul/i, /^ago/i, /^set/i, /^out/i, /^nov/i, /^dez/i]
};
var matchDayPatterns$F = {
  narrow: /^(dom|[23456]ª?|s[aá]b)/i,
  short: /^(dom|[23456]ª?|s[aá]b)/i,
  abbreviated: /^(dom|seg|ter|qua|qui|sex|s[aá]b)/i,
  wide: /^(domingo|(segunda|ter[cç]a|quarta|quinta|sexta)([- ]feira)?|s[aá]bado)/i
};
var parseDayPatterns$F = {
  short: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
  narrow: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
  any: [/^d/i, /^seg/i, /^t/i, /^qua/i, /^qui/i, /^sex/i, /^s[aá]b/i]
};
var matchDayPeriodPatterns$F = {
  narrow: /^(a|p|mn|md|(da) (manhã|tarde|noite))/i,
  any: /^([ap]\.?\s?m\.?|meia[-\s]noite|meio[-\s]dia|(da) (manhã|tarde|noite))/i
};
var parseDayPeriodPatterns$F = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn|^meia[-\s]noite/i,
    noon: /^md|^meio[-\s]dia/i,
    morning: /manhã/i,
    afternoon: /tarde/i,
    evening: /tarde/i,
    night: /noite/i
  }
};
var match$F = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$F,
    parsePattern: parseOrdinalNumberPattern$F,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$F,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$F,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$F,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$F,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$F,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$F,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$F,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$F,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$F,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$F,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Portuguese locale (Brazil).
 * @language Portuguese
 * @iso-639-2 por
 * @author Lucas Duailibe [@duailibe]{@link https://github.com/duailibe}
 * @author Yago Carballo [@yagocarballo]{@link https://github.com/YagoCarballo}
 */

var locale$J = {
  code: 'pt-BR',
  formatDistance: formatDistance$G,
  formatLong: formatLong$J,
  formatRelative: formatRelative$F,
  localize: localize$F,
  match: match$F,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$G = {
  lessThanXSeconds: {
    one: 'mai puțin de o secundă',
    other: 'mai puțin de {{count}} secunde'
  },
  xSeconds: {
    one: '1 secundă',
    other: '{{count}} secunde'
  },
  halfAMinute: 'jumătate de minut',
  lessThanXMinutes: {
    one: 'mai puțin de un minut',
    other: 'mai puțin de {{count}} minute'
  },
  xMinutes: {
    one: '1 minut',
    other: '{{count}} minute'
  },
  aboutXHours: {
    one: 'circa 1 oră',
    other: 'circa {{count}} ore'
  },
  xHours: {
    one: '1 oră',
    other: '{{count}} ore'
  },
  xDays: {
    one: '1 zi',
    other: '{{count}} zile'
  },
  aboutXMonths: {
    one: 'circa 1 lună',
    other: 'circa {{count}} luni'
  },
  xMonths: {
    one: '1 lună',
    other: '{{count}} luni'
  },
  aboutXYears: {
    one: 'circa 1 an',
    other: 'circa {{count}} ani'
  },
  xYears: {
    one: '1 an',
    other: '{{count}} ani'
  },
  overXYears: {
    one: 'peste 1 an',
    other: 'peste {{count}} ani'
  },
  almostXYears: {
    one: 'aproape 1 an',
    other: 'aproape {{count}} ani'
  }
};
function formatDistance$H(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$G[token] === 'string') {
    result = formatDistanceLocale$G[token];
  } else if (count === 1) {
    result = formatDistanceLocale$G[token].one;
  } else {
    result = formatDistanceLocale$G[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'în ' + result;
    } else {
      return result + ' în urmă';
    }
  }

  return result;
}

var dateFormats$K = {
  full: 'EEEE, d MMMM yyyy',
  long: 'd MMMM yyyy',
  medium: 'd MMM yyyy',
  short: 'dd/MM/yyyy'
};
var timeFormats$K = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$K = {
  full: "{{date}} 'la' {{time}}",
  long: "{{date}} 'la' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$K = {
  date: buildFormatLongFn({
    formats: dateFormats$K,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$K,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$K,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$G = {
  lastWeek: "eeee 'trecută la' p",
  yesterday: "'ieri la' p",
  today: "'astăzi la' p",
  tomorrow: "'mâine la' p",
  nextWeek: "eeee 'viitoare la' p",
  other: 'P'
};
function formatRelative$G(token, _date, _baseDate, _options) {
  return formatRelativeLocale$G[token];
}

var eraValues$G = {
  narrow: ['Î', 'D'],
  abbreviated: ['Î.d.C.', 'D.C.'],
  wide: ['Înainte de Cristos', 'După Cristos']
};
var quarterValues$G = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['T1', 'T2', 'T3', 'T4'],
  wide: ['primul trimestru', 'al doilea trimestru', 'al treilea trimestru', 'al patrulea trimestru']
};
var monthValues$G = {
  narrow: ['I', 'F', 'M', 'A', 'M', 'I', 'I', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'],
  wide: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
};
var dayValues$G = {
  narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
  short: ['du', 'lu', 'ma', 'mi', 'jo', 'vi', 'sâ'],
  abbreviated: ['dum', 'lun', 'mar', 'mie', 'joi', 'vin', 'sâm'],
  wide: ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă']
};
var dayPeriodValues$G = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'ami',
    morning: 'dim',
    afternoon: 'da',
    evening: 's',
    night: 'n'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'miezul nopții',
    noon: 'amiază',
    morning: 'dimineață',
    afternoon: 'după-amiază',
    evening: 'seară',
    night: 'noapte'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'miezul nopții',
    noon: 'amiază',
    morning: 'dimineață',
    afternoon: 'după-amiază',
    evening: 'seară',
    night: 'noapte'
  }
};
var formattingDayPeriodValues$w = {
  narrow: {
    am: 'a',
    pm: 'p',
    midnight: 'mn',
    noon: 'amiază',
    morning: 'dimineață',
    afternoon: 'după-amiază',
    evening: 'seară',
    night: 'noapte'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'miezul nopții',
    noon: 'amiază',
    morning: 'dimineață',
    afternoon: 'după-amiază',
    evening: 'seară',
    night: 'noapte'
  },
  wide: {
    am: 'a.m.',
    pm: 'p.m.',
    midnight: 'miezul nopții',
    noon: 'amiază',
    morning: 'dimineață',
    afternoon: 'după-amiază',
    evening: 'seară',
    night: 'noapte'
  }
};

function ordinalNumber$G(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number);
}

var localize$G = {
  ordinalNumber: ordinalNumber$G,
  era: buildLocalizeFn({
    values: eraValues$G,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$G,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$G,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$G,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$G,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$w,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$G = /^(\d+)?/i;
var parseOrdinalNumberPattern$G = /\d+/i;
var matchEraPatterns$G = {
  narrow: /^(Î|D)/i,
  abbreviated: /^(Î\.?\s?d\.?\s?C\.?|Î\.?\s?e\.?\s?n\.?|D\.?\s?C\.?|e\.?\s?n\.?)/i,
  wide: /^(Înainte de Cristos|Înaintea erei noastre|După Cristos|Era noastră)/i
};
var parseEraPatterns$G = {
  any: [/^ÎC/i, /^DC/i],
  wide: [/^(Înainte de Cristos|Înaintea erei noastre)/i, /^(După Cristos|Era noastră)/i]
};
var matchQuarterPatterns$G = {
  narrow: /^[1234]/i,
  abbreviated: /^T[1234]/i,
  wide: /^trimestrul [1234]/i
};
var parseQuarterPatterns$G = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$G = {
  narrow: /^[ifmaasond]/i,
  abbreviated: /^(ian|feb|mar|apr|mai|iun|iul|aug|sep|oct|noi|dec)/i,
  wide: /^(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i
};
var parseMonthPatterns$G = {
  narrow: [/^i/i, /^f/i, /^m/i, /^a/i, /^m/i, /^i/i, /^i/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ia/i, /^f/i, /^mar/i, /^ap/i, /^mai/i, /^iun/i, /^iul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$G = {
  narrow: /^[dlmjvs]/i,
  short: /^(d|l|ma|mi|j|v|s)/i,
  abbreviated: /^(dum|lun|mar|mie|jo|vi|sâ)/i,
  wide: /^(duminica|luni|marţi|miercuri|joi|vineri|sâmbătă)/i
};
var parseDayPatterns$G = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^d/i, /^l/i, /^ma/i, /^mi/i, /^j/i, /^v/i, /^s/i]
};
var matchDayPeriodPatterns$G = {
  narrow: /^(a|p|mn|a|(dimineaţa|după-amiaza|seara|noaptea))/i,
  any: /^([ap]\.?\s?m\.?|miezul nopții|amiaza|(dimineaţa|după-amiaza|seara|noaptea))/i
};
var parseDayPeriodPatterns$G = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mn/i,
    noon: /amiaza/i,
    morning: /dimineaţa/i,
    afternoon: /după-amiaza/i,
    evening: /seara/i,
    night: /noaptea/i
  }
};
var match$G = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$G,
    parsePattern: parseOrdinalNumberPattern$G,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$G,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$G,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$G,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$G,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$G,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$G,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$G,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$G,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$G,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$G,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Romanian locale.
 * @language Romanian
 * @iso-639-2 ron
 * @author Sergiu Munteanu [@jsergiu]{@link https://github.com/jsergiu}
 * @author Adrian Ocneanu [@aocneanu]{@link https://github.com/aocneanu}
 * @author Mihai Ocneanu [@gandesc]{@link https://github.com/gandesc}
 */

var locale$K = {
  code: 'ro',
  formatDistance: formatDistance$H,
  formatLong: formatLong$K,
  formatRelative: formatRelative$G,
  localize: localize$G,
  match: match$G,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

function declension$3(scheme, count) {
  // scheme for count=1 exists
  if (scheme.one !== undefined && count === 1) {
    return scheme.one;
  }

  var rem10 = count % 10;
  var rem100 = count % 100; // 1, 21, 31, ...

  if (rem10 === 1 && rem100 !== 11) {
    return scheme.singularNominative.replace('{{count}}', count); // 2, 3, 4, 22, 23, 24, 32 ...
  } else if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) {
    return scheme.singularGenitive.replace('{{count}}', count); // 5, 6, 7, 8, 9, 10, 11, ...
  } else {
    return scheme.pluralGenitive.replace('{{count}}', count);
  }
}

function buildLocalizeTokenFn$3(scheme) {
  return function (count, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        if (scheme.future) {
          return declension$3(scheme.future, count);
        } else {
          return 'через ' + declension$3(scheme.regular, count);
        }
      } else {
        if (scheme.past) {
          return declension$3(scheme.past, count);
        } else {
          return declension$3(scheme.regular, count) + ' назад';
        }
      }
    } else {
      return declension$3(scheme.regular, count);
    }
  };
}

var formatDistanceLocale$H = {
  lessThanXSeconds: buildLocalizeTokenFn$3({
    regular: {
      one: 'меньше секунды',
      singularNominative: 'меньше {{count}} секунды',
      singularGenitive: 'меньше {{count}} секунд',
      pluralGenitive: 'меньше {{count}} секунд'
    },
    future: {
      one: 'меньше, чем через секунду',
      singularNominative: 'меньше, чем через {{count}} секунду',
      singularGenitive: 'меньше, чем через {{count}} секунды',
      pluralGenitive: 'меньше, чем через {{count}} секунд'
    }
  }),
  xSeconds: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} секунда',
      singularGenitive: '{{count}} секунды',
      pluralGenitive: '{{count}} секунд'
    },
    past: {
      singularNominative: '{{count}} секунду назад',
      singularGenitive: '{{count}} секунды назад',
      pluralGenitive: '{{count}} секунд назад'
    },
    future: {
      singularNominative: 'через {{count}} секунду',
      singularGenitive: 'через {{count}} секунды',
      pluralGenitive: 'через {{count}} секунд'
    }
  }),
  halfAMinute: function (_, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'через полминуты';
      } else {
        return 'полминуты назад';
      }
    }

    return 'полминуты';
  },
  lessThanXMinutes: buildLocalizeTokenFn$3({
    regular: {
      one: 'меньше минуты',
      singularNominative: 'меньше {{count}} минуты',
      singularGenitive: 'меньше {{count}} минут',
      pluralGenitive: 'меньше {{count}} минут'
    },
    future: {
      one: 'меньше, чем через минуту',
      singularNominative: 'меньше, чем через {{count}} минуту',
      singularGenitive: 'меньше, чем через {{count}} минуты',
      pluralGenitive: 'меньше, чем через {{count}} минут'
    }
  }),
  xMinutes: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} минута',
      singularGenitive: '{{count}} минуты',
      pluralGenitive: '{{count}} минут'
    },
    past: {
      singularNominative: '{{count}} минуту назад',
      singularGenitive: '{{count}} минуты назад',
      pluralGenitive: '{{count}} минут назад'
    },
    future: {
      singularNominative: 'через {{count}} минуту',
      singularGenitive: 'через {{count}} минуты',
      pluralGenitive: 'через {{count}} минут'
    }
  }),
  aboutXHours: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: 'около {{count}} часа',
      singularGenitive: 'около {{count}} часов',
      pluralGenitive: 'около {{count}} часов'
    },
    future: {
      singularNominative: 'приблизительно через {{count}} час',
      singularGenitive: 'приблизительно через {{count}} часа',
      pluralGenitive: 'приблизительно через {{count}} часов'
    }
  }),
  xHours: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} час',
      singularGenitive: '{{count}} часа',
      pluralGenitive: '{{count}} часов'
    }
  }),
  xDays: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} день',
      singularGenitive: '{{count}} дня',
      pluralGenitive: '{{count}} дней'
    }
  }),
  aboutXMonths: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: 'около {{count}} месяца',
      singularGenitive: 'около {{count}} месяцев',
      pluralGenitive: 'около {{count}} месяцев'
    },
    future: {
      singularNominative: 'приблизительно через {{count}} месяц',
      singularGenitive: 'приблизительно через {{count}} месяца',
      pluralGenitive: 'приблизительно через {{count}} месяцев'
    }
  }),
  xMonths: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} месяц',
      singularGenitive: '{{count}} месяца',
      pluralGenitive: '{{count}} месяцев'
    }
  }),
  aboutXYears: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: 'около {{count}} года',
      singularGenitive: 'около {{count}} лет',
      pluralGenitive: 'около {{count}} лет'
    },
    future: {
      singularNominative: 'приблизительно через {{count}} год',
      singularGenitive: 'приблизительно через {{count}} года',
      pluralGenitive: 'приблизительно через {{count}} лет'
    }
  }),
  xYears: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: '{{count}} год',
      singularGenitive: '{{count}} года',
      pluralGenitive: '{{count}} лет'
    }
  }),
  overXYears: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: 'больше {{count}} года',
      singularGenitive: 'больше {{count}} лет',
      pluralGenitive: 'больше {{count}} лет'
    },
    future: {
      singularNominative: 'больше, чем через {{count}} год',
      singularGenitive: 'больше, чем через {{count}} года',
      pluralGenitive: 'больше, чем через {{count}} лет'
    }
  }),
  almostXYears: buildLocalizeTokenFn$3({
    regular: {
      singularNominative: 'почти {{count}} год',
      singularGenitive: 'почти {{count}} года',
      pluralGenitive: 'почти {{count}} лет'
    },
    future: {
      singularNominative: 'почти через {{count}} год',
      singularGenitive: 'почти через {{count}} года',
      pluralGenitive: 'почти через {{count}} лет'
    }
  })
};
function formatDistance$I(token, count, options) {
  options = options || {};
  return formatDistanceLocale$H[token](count, options);
}

var dateFormats$L = {
  full: "EEEE, do MMMM y 'г.'",
  long: "do MMMM y 'г.'",
  medium: "d MMM y 'г.'",
  short: 'dd.MM.y'
};
var timeFormats$L = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$L = {
  any: '{{date}}, {{time}}'
};
var formatLong$L = {
  date: buildFormatLongFn({
    formats: dateFormats$L,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$L,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$L,
    defaultWidth: 'any'
  })
};

var accusativeWeekdays$4 = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

function lastWeek$3(day) {
  var weekday = accusativeWeekdays$4[day];

  switch (day) {
    case 0:
      return "'в прошлое " + weekday + " в' p";

    case 1:
    case 2:
    case 4:
      return "'в прошлый " + weekday + " в' p";

    case 3:
    case 5:
    case 6:
      return "'в прошлую " + weekday + " в' p";
  }
}

function thisWeek$3(day) {
  var weekday = accusativeWeekdays$4[day];

  if (day === 2
  /* Tue */
  ) {
      return "'во " + weekday + " в' p";
    } else {
    return "'в " + weekday + " в' p";
  }
}

function nextWeek$3(day) {
  var weekday = accusativeWeekdays$4[day];

  switch (day) {
    case 0:
      return "'в следующее " + weekday + " в' p";

    case 1:
    case 2:
    case 4:
      return "'в следующий " + weekday + " в' p";

    case 3:
    case 5:
    case 6:
      return "'в следующую " + weekday + " в' p";
  }
}

var formatRelativeLocale$H = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$3(day);
    } else {
      return lastWeek$3(day);
    }
  },
  yesterday: "'вчера в' p",
  today: "'сегодня в' p",
  tomorrow: "'завтра в' p",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$3(day);
    } else {
      return nextWeek$3(day);
    }
  },
  other: 'P'
};
function formatRelative$H(token, date, baseDate, options) {
  var format = formatRelativeLocale$H[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$H = {
  narrow: ['до н.э.', 'н.э.'],
  abbreviated: ['до н. э.', 'н. э.'],
  wide: ['до нашей эры', 'нашей эры']
};
var quarterValues$H = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
  wide: ['1-й квартал', '2-й квартал', '3-й квартал', '4-й квартал']
};
var monthValues$H = {
  narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
  abbreviated: ['янв.', 'фев.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  wide: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
};
var formattingMonthValues$8 = {
  narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
  abbreviated: ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  wide: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
};
var dayValues$H = {
  narrow: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
  short: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  abbreviated: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'суб'],
  wide: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
};
var dayPeriodValues$H = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полн.',
    noon: 'полд.',
    morning: 'утро',
    afternoon: 'день',
    evening: 'веч.',
    night: 'ночь'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полн.',
    noon: 'полд.',
    morning: 'утро',
    afternoon: 'день',
    evening: 'веч.',
    night: 'ночь'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полночь',
    noon: 'полдень',
    morning: 'утро',
    afternoon: 'день',
    evening: 'вечер',
    night: 'ночь'
  }
};
var formattingDayPeriodValues$x = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полн.',
    noon: 'полд.',
    morning: 'утра',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночи'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полн.',
    noon: 'полд.',
    morning: 'утра',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночи'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'полночь',
    noon: 'полдень',
    morning: 'утра',
    afternoon: 'дня',
    evening: 'вечера',
    night: 'ночи'
  }
};

function ordinalNumber$H(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (unit === 'date') {
    suffix = '-е';
  } else if (unit === 'week' || unit === 'minute' || unit === 'second') {
    suffix = '-я';
  } else {
    suffix = '-й';
  }

  return dirtyNumber + suffix;
}

var localize$H = {
  ordinalNumber: ordinalNumber$H,
  era: buildLocalizeFn({
    values: eraValues$H,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$H,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$H,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$8,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$H,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$H,
    defaultWidth: 'any',
    formattingValues: formattingDayPeriodValues$x,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$H = /^(\d+)(-?(е|я|й|ое|ье|ая|ья|ый|ой|ий|ый))?/i;
var parseOrdinalNumberPattern$H = /\d+/i;
var matchEraPatterns$H = {
  narrow: /^((до )?н\.?\s?э\.?)/i,
  abbreviated: /^((до )?н\.?\s?э\.?)/i,
  wide: /^(до нашей эры|нашей эры|наша эра)/i
};
var parseEraPatterns$H = {
  any: [/^д/i, /^н/i]
};
var matchQuarterPatterns$H = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](-?[ыои]?й?)? кв.?/i,
  wide: /^[1234](-?[ыои]?й?)? квартал/i
};
var parseQuarterPatterns$H = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$H = {
  narrow: /^[яфмаисонд]/i,
  abbreviated: /^(янв|фев|март?|апр|ма[йя]|июн[ья]?|июл[ья]?|авг|сент?|окт|нояб?|дек)/i,
  wide: /^(январ[ья]|феврал[ья]|марта?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|августа?|сентябр[ья]|октябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])/i
};
var parseMonthPatterns$H = {
  narrow: [/^я/i, /^ф/i, /^м/i, /^а/i, /^м/i, /^и/i, /^и/i, /^а/i, /^с/i, /^о/i, /^н/i, /^я/i],
  any: [/^я/i, /^ф/i, /^мар/i, /^ап/i, /^ма[йя]/i, /^июн/i, /^июл/i, /^ав/i, /^с/i, /^о/i, /^н/i, /^д/i]
};
var matchDayPatterns$H = {
  narrow: /^[впсч]/i,
  short: /^(вс|во|пн|по|вт|ср|чт|че|пт|пя|сб|су)\.?/i,
  abbreviated: /^(вск|вос|пнд|пон|втр|вто|срд|сре|чтв|чет|птн|пят|суб).?/i,
  wide: /^(воскресень[ея]|понедельника?|вторника?|сред[аы]|четверга?|пятниц[аы]|суббот[аы])/i
};
var parseDayPatterns$H = {
  narrow: [/^в/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
  any: [/^в[ос]/i, /^п[он]/i, /^в/i, /^ср/i, /^ч/i, /^п[ят]/i, /^с[уб]/i]
};
var matchDayPeriodPatterns$H = {
  narrow: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
  abbreviated: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
  wide: /^([дп]п|полночь|полдень|утр[оа]|день|дня|вечера?|ноч[ьи])/i
};
var parseDayPeriodPatterns$H = {
  any: {
    am: /^дп/i,
    pm: /^пп/i,
    midnight: /^полн/i,
    noon: /^полд/i,
    morning: /^у/i,
    afternoon: /^д[ен]/i,
    evening: /^в/i,
    night: /^н/i
  }
};
var match$H = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$H,
    parsePattern: parseOrdinalNumberPattern$H,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$H,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$H,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$H,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$H,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$H,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$H,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$H,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$H,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$H,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$H,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Russian locale.
 * @language Russian
 * @iso-639-2 rus
 * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
 * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
 */

var locale$L = {
  code: 'ru',
  formatDistance: formatDistance$I,
  formatLong: formatLong$L,
  formatRelative: formatRelative$H,
  localize: localize$H,
  match: match$H,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

// NOTE: should prolly be improved
// https://www.unicode.org/cldr/charts/32/summary/sk.html?hide#1308
function declensionGroup$1(scheme, count) {
  if (count === 1) {
    return scheme.one;
  }

  if (count >= 2 && count <= 4) {
    return scheme.twoFour;
  } // if count === null || count === 0 || count >= 5


  return scheme.other;
}

function declension$4(scheme, count, time) {
  var group = declensionGroup$1(scheme, count);
  var finalText = group[time] || group;
  return finalText.replace('{{count}}', count);
}

function extractPreposition(token) {
  var result = ['lessThan', 'about', 'over', 'almost'].filter(function (preposition) {
    return !!token.match(new RegExp('^' + preposition));
  });
  return result[0];
}

function prefixPreposition(preposition) {
  var translation = '';

  if (preposition === 'almost') {
    translation = 'takmer';
  }

  if (preposition === 'about') {
    translation = 'približne';
  }

  return translation.length > 0 ? translation + ' ' : '';
}

function suffixPreposition(preposition) {
  var translation = '';

  if (preposition === 'lessThan') {
    translation = 'menej než';
  }

  if (preposition === 'over') {
    translation = 'viac než';
  }

  return translation.length > 0 ? translation + ' ' : '';
}

function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

var formatDistanceLocale$I = {
  xSeconds: {
    one: {
      regular: 'sekunda',
      past: 'sekundou',
      future: 'sekundu'
    },
    twoFour: {
      regular: '{{count}} sekundy',
      past: '{{count}} sekundami',
      future: '{{count}} sekundy'
    },
    other: {
      regular: '{{count}} sekúnd',
      past: '{{count}} sekundami',
      future: '{{count}} sekúnd'
    }
  },
  halfAMinute: {
    other: {
      regular: 'pol minúty',
      past: 'pol minútou',
      future: 'pol minúty'
    }
  },
  xMinutes: {
    one: {
      regular: 'minúta',
      past: 'minútou',
      future: 'minútu'
    },
    twoFour: {
      regular: '{{count}} minúty',
      past: '{{count}} minútami',
      future: '{{count}} minúty'
    },
    other: {
      regular: '{{count}} minút',
      past: '{{count}} minútami',
      future: '{{count}} minút'
    }
  },
  xHours: {
    one: {
      regular: 'hodina',
      past: 'hodinou',
      future: 'hodinu'
    },
    twoFour: {
      regular: '{{count}} hodiny',
      past: '{{count}} hodinami',
      future: '{{count}} hodiny'
    },
    other: {
      regular: '{{count}} hodín',
      past: '{{count}} hodinami',
      future: '{{count}} hodín'
    }
  },
  xDays: {
    one: {
      regular: 'deň',
      past: 'dňom',
      future: 'deň'
    },
    twoFour: {
      regular: '{{count}} dni',
      past: '{{count}} dňami',
      future: '{{count}} dni'
    },
    other: {
      regular: '{{count}} dní',
      past: '{{count}} dňami',
      future: '{{count}} dní'
    }
  },
  xMonths: {
    one: {
      regular: 'mesiac',
      past: 'mesiacom',
      future: 'mesiac'
    },
    twoFour: {
      regular: '{{count}} mesiace',
      past: '{{count}} mesiacmi',
      future: '{{count}} mesiace'
    },
    other: {
      regular: '{{count}} mesiacov',
      past: '{{count}} mesiacmi',
      future: '{{count}} mesiacov'
    }
  },
  xYears: {
    one: {
      regular: 'rok',
      past: 'rokom',
      future: 'rok'
    },
    twoFour: {
      regular: '{{count}} roky',
      past: '{{count}} rokmi',
      future: '{{count}} roky'
    },
    other: {
      regular: '{{count}} rokov',
      past: '{{count}} rokmi',
      future: '{{count}} rokov'
    }
  }
};
function formatDistance$J(token, count, options) {
  options = options || {};
  var preposition = extractPreposition(token) || '';
  var key = lowercaseFirstLetter(token.substring(preposition.length));
  var scheme = formatDistanceLocale$I[key];

  if (!options.addSuffix) {
    return prefixPreposition(preposition) + suffixPreposition(preposition) + declension$4(scheme, count, 'regular');
  }

  if (options.comparison > 0) {
    return prefixPreposition(preposition) + 'o ' + suffixPreposition(preposition) + declension$4(scheme, count, 'future');
  } else {
    return prefixPreposition(preposition) + 'pred ' + suffixPreposition(preposition) + declension$4(scheme, count, 'past');
  }
}

var dateFormats$M = {
  full: 'EEEE d. MMMM y',
  long: 'd. MMMM y',
  medium: 'd. M. y',
  short: 'd. M. y' // https://www.unicode.org/cldr/charts/32/summary/sk.html?hide#2149

};
var timeFormats$M = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm' // https://www.unicode.org/cldr/charts/32/summary/sk.html?hide#1994

};
var dateTimeFormats$M = {
  full: '{{date}}, {{time}}',
  long: '{{date}}, {{time}}',
  medium: '{{date}}, {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$M = {
  date: buildFormatLongFn({
    formats: dateFormats$M,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$M,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$M,
    defaultWidth: 'full'
  })
};

var accusativeWeekdays$5 = ['nedeľu', 'pondelok', 'utorok', 'stredu', 'štvrtok', 'piatok', 'sobotu'];

function lastWeek$4(day) {
  var weekday = accusativeWeekdays$5[day];

  switch (day) {
    case 0:
    /* Sun */

    case 4:
    /* Wed */

    case 6
    /* Sat */
    :
      return "'minulú " + weekday + " o' p";

    default:
      return "'minulý' eeee 'o' p";
  }
}

function thisWeek$4(day) {
  var weekday = accusativeWeekdays$5[day];

  if (day === 4
  /* Thu */
  ) {
      return "'vo' eeee 'o' p";
    } else {
    return "'v " + weekday + " o' p";
  }
}

function nextWeek$4(day) {
  var weekday = accusativeWeekdays$5[day];

  switch (day) {
    case 0:
    /* Sun */

    case 4:
    /* Wed */

    case 6
    /* Sat */
    :
      return "'budúcu' " + weekday + " 'o' p";

    default:
      return "'budúci' eeee 'o' p";
  }
}

var formatRelativeLocale$I = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$4(day);
    } else {
      return lastWeek$4(day);
    }
  },
  yesterday: "'včera o' p",
  today: "'dnes o' p",
  tomorrow: "'zajtra o' p",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$4(day);
    } else {
      return nextWeek$4(day);
    }
  },
  other: 'P'
};
function formatRelative$I(token, date, baseDate, options) {
  var format = formatRelativeLocale$I[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$I = {
  narrow: ['pred Kr.', 'po Kr.'],
  abbreviated: ['pred Kr.', 'po Kr.'],
  wide: ['pred Kristom', 'po Kristovi'] // https://www.unicode.org/cldr/charts/32/summary/sk.html#1780

};
var quarterValues$I = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1. štvrťrok', '2. štvrťrok', '3. štvrťrok', '4. štvrťrok'] // https://www.unicode.org/cldr/charts/32/summary/sk.html#1804

};
var monthValues$I = {
  narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'],
  wide: ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december']
};
var formattingMonthValues$9 = {
  narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'],
  wide: ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'] // https://www.unicode.org/cldr/charts/32/summary/sk.html#1876

};
var dayValues$I = {
  narrow: ['n', 'p', 'u', 's', 'š', 'p', 's'],
  short: ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'],
  abbreviated: ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'],
  wide: ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'] // https://www.unicode.org/cldr/charts/32/summary/sk.html#1932

};
var dayPeriodValues$I = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'poln.',
    noon: 'pol.',
    morning: 'ráno',
    afternoon: 'pop.',
    evening: 'več.',
    night: 'noc'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'poln.',
    noon: 'pol.',
    morning: 'ráno',
    afternoon: 'popol.',
    evening: 'večer',
    night: 'noc'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'polnoc',
    noon: 'poludnie',
    morning: 'ráno',
    afternoon: 'popoludnie',
    evening: 'večer',
    night: 'noc'
  }
};
var formattingDayPeriodValues$y = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'o poln.',
    noon: 'nap.',
    morning: 'ráno',
    afternoon: 'pop.',
    evening: 'več.',
    night: 'v n.'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'o poln.',
    noon: 'napol.',
    morning: 'ráno',
    afternoon: 'popol.',
    evening: 'večer',
    night: 'v noci'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'o polnoci',
    noon: 'napoludnie',
    morning: 'ráno',
    afternoon: 'popoludní',
    evening: 'večer',
    night: 'v noci'
  }
};

function ordinalNumber$I(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$I = {
  ordinalNumber: ordinalNumber$I,
  era: buildLocalizeFn({
    values: eraValues$I // defaultWidth: 'wide'

  }),
  quarter: buildLocalizeFn({
    values: quarterValues$I,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$I,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$9,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$I,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$I,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$y,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$I = /^(\d+)\.?/i;
var parseOrdinalNumberPattern$I = /\d+/i;
var matchEraPatterns$I = {
  narrow: /^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
  abbreviated: /^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
  wide: /^(pred Kristom|pred na[šs][íi]m letopo[čc]tom|po Kristovi|n[áa][šs]ho letopo[čc]tu)/i
};
var parseEraPatterns$I = {
  any: [/^pr/i, /^(po|n)/i]
};
var matchQuarterPatterns$I = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234]\. [šs]tvr[ťt]rok/i
};
var parseQuarterPatterns$I = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$I = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|m[áa]j|j[úu]n|j[úu]l|aug|sep|okt|nov|dec)/i,
  wide: /^(janu[áa]ra?|febru[áa]ra?|(marec|marca)|apr[íi]la?|m[áa]ja?|j[úu]na?|j[úu]la?|augusta?|(september|septembra)|(okt[óo]ber|okt[óo]bra)|(november|novembra)|(december|decembra))/i
};
var parseMonthPatterns$I = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^m[áa]j/i, /^j[úu]n/i, /^j[úu]l/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$I = {
  narrow: /^[npusšp]/i,
  short: /^(ne|po|ut|st|št|pi|so)/i,
  abbreviated: /^(ne|po|ut|st|št|pi|so)/i,
  wide: /^(nede[ľl]a|pondelok|utorok|streda|[šs]tvrtok|piatok|sobota])/i
};
var parseDayPatterns$I = {
  narrow: [/^n/i, /^p/i, /^u/i, /^s/i, /^š/i, /^p/i, /^s/i],
  any: [/^n/i, /^po/i, /^u/i, /^st/i, /^(št|stv)/i, /^pi/i, /^so/i]
};
var matchDayPeriodPatterns$I = {
  narrow: /^(am|pm|(o )?poln\.?|(nap\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]\.?|(v n\.?|noc))/i,
  abbreviated: /^(am|pm|(o )?poln\.?|(napol\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]er|(v )?noci?)/i,
  any: /^(am|pm|(o )?polnoci?|(na)?poludnie|r[áa]no|popoludn(ie|í|i)|ve[čc]er|(v )?noci?)/i
};
var parseDayPeriodPatterns$I = {
  any: {
    am: /^am/i,
    pm: /^pm/i,
    midnight: /poln/i,
    noon: /^(nap|(na)?pol(\.|u))/i,
    morning: /^r[áa]no/i,
    afternoon: /^pop/i,
    evening: /^ve[čc]/i,
    night: /^(noc|v n\.)/i
  }
};
var match$I = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$I,
    parsePattern: parseOrdinalNumberPattern$I,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$I,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$I,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$I,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$I,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$I,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$I,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$I,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$I,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$I,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$I,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Slovak locale.
 * @language Slovak
 * @iso-639-2 slk
 * @author Marek Suscak [@mareksuscak]{@link https://github.com/mareksuscak}
 */

var locale$M = {
  code: 'sk',
  formatDistance: formatDistance$J,
  formatLong: formatLong$M,
  formatRelative: formatRelative$I,
  localize: localize$I,
  match: match$I,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var distanceInWordsLocale = {
  lessThanXSeconds: {
    one: 'manj kot {{count}} sekunda',
    two: 'manj kot {{count}} sekundi',
    few: 'manj kot {{count}} sekunde',
    other: 'manj kot {{count}} sekund'
  },
  xSeconds: {
    one: '{{count}} sekunda',
    two: '{{count}} sekundi',
    few: '{{count}} sekunde',
    other: '{{count}} sekund'
  },
  halfAMinute: 'pol minute',
  lessThanXMinutes: {
    one: 'manj kot {{count}} minuta',
    two: 'manj kot {{count}} minuti',
    few: 'manj kot {{count}} minute',
    other: 'manj kot {{count}} minut'
  },
  xMinutes: {
    one: '{{count}} minuta',
    two: '{{count}} minuti',
    few: '{{count}} minute',
    other: '{{count}} minut'
  },
  aboutXHours: {
    one: 'približno {{count}} ura',
    two: 'približno {{count}} uri',
    few: 'približno {{count}} ure',
    other: 'približno {{count}} ur'
  },
  xHours: {
    one: '{{count}} ura',
    two: '{{count}} uri',
    few: '{{count}} ure',
    other: '{{count}} ur'
  },
  xDays: {
    one: '{{count}} dan',
    two: '{{count}} dni',
    few: '{{count}} dni',
    other: '{{count}} dni'
  },
  aboutXMonths: {
    one: 'približno {{count}} mesec',
    two: 'približno {{count}} meseca',
    few: 'približno {{count}} mesece',
    other: 'približno {{count}} mesecev'
  },
  xMonths: {
    one: '{{count}} mesec',
    two: '{{count}} meseca',
    few: '{{count}} meseci',
    other: '{{count}} mesecev'
  },
  aboutXYears: {
    one: 'približno {{count}} leto',
    two: 'približno {{count}} leti',
    few: 'približno {{count}} leta',
    other: 'približno {{count}} let'
  },
  xYears: {
    one: '{{count}} leto',
    two: '{{count}} leti',
    few: '{{count}} leta',
    other: '{{count}} let'
  },
  overXYears: {
    one: 'več kot {{count}} leto',
    two: 'več kot {{count}} leti',
    few: 'več kot {{count}} leta',
    other: 'več kot {{count}} let'
  },
  almostXYears: {
    one: 'skoraj {{count}} leto',
    two: 'skoraj {{count}} leti',
    few: 'skoraj {{count}} leta',
    other: 'skoraj {{count}} let'
  }
};
var distanceInWordsLocalePast = {
  lessThanXSeconds: {
    one: 'manj kot {{count}} sekundo',
    two: 'manj kot {{count}} sekundama',
    few: 'manj kot {{count}} sekundami',
    other: 'manj kot {{count}} sekundami'
  },
  xSeconds: {
    one: '{{count}} sekundo',
    two: '{{count}} sekundama',
    few: '{{count}} sekundami',
    other: '{{count}} sekundami'
  },
  halfAMinute: 'pol minute',
  lessThanXMinutes: {
    one: 'manj kot {{count}} minuto',
    two: 'manj kot {{count}} minutama',
    few: 'manj kot {{count}} minutami',
    other: 'manj kot {{count}} minutami'
  },
  xMinutes: {
    one: '{{count}} minuto',
    two: '{{count}} minutama',
    few: '{{count}} minutami',
    other: '{{count}} minutami'
  },
  aboutXHours: {
    one: 'približno {{count}} uro',
    two: 'približno {{count}} urama',
    few: 'približno {{count}} urami',
    other: 'približno {{count}} urami'
  },
  xHours: {
    one: '{{count}} uro',
    two: '{{count}} urama',
    few: '{{count}} urami',
    other: '{{count}} urami'
  },
  xDays: {
    one: '{{count}} dnem',
    two: '{{count}} dnevoma',
    few: '{{count}} dnevi',
    other: '{{count}} dnevi'
  },
  aboutXMonths: {
    one: 'približno {{count}} mesecem',
    two: 'približno {{count}} mesecema',
    few: 'približno {{count}} meseci',
    other: 'približno {{count}} meseci'
  },
  xMonths: {
    one: '{{count}} mesecem',
    two: '{{count}} mesecema',
    few: '{{count}} meseci',
    other: '{{count}} meseci'
  },
  aboutXYears: {
    one: 'približno {{count}} letom',
    two: 'približno {{count}} letoma',
    few: 'približno {{count}} leti',
    other: 'približno {{count}} leti'
  },
  xYears: {
    one: '{{count}} letom',
    two: '{{count}} letoma',
    few: '{{count}} leti',
    other: '{{count}} leti'
  },
  overXYears: {
    one: 'več kot {{count}} letom',
    two: 'več kot {{count}} letoma',
    few: 'več kot {{count}} leti',
    other: 'več kot {{count}} leti'
  },
  almostXYears: {
    one: 'skoraj {{count}} letom',
    two: 'skoraj {{count}} letoma',
    few: 'skoraj {{count}} leti',
    other: 'skoraj {{count}} leti'
  }
};
var distanceInWordsLocaleFuture = {
  lessThanXSeconds: {
    one: 'manj kot {{count}} sekundo',
    two: 'manj kot {{count}} sekundi',
    few: 'manj kot {{count}} sekunde',
    other: 'manj kot {{count}} sekund'
  },
  xSeconds: {
    one: '{{count}} sekundo',
    two: '{{count}} sekundi',
    few: '{{count}} sekunde',
    other: '{{count}} sekund'
  },
  halfAMinute: 'pol minute',
  lessThanXMinutes: {
    one: 'manj kot {{count}} minuto',
    two: 'manj kot {{count}} minuti',
    few: 'manj kot {{count}} minute',
    other: 'manj kot {{count}} minut'
  },
  xMinutes: {
    one: '{{count}} minuto',
    two: '{{count}} minuti',
    few: '{{count}} minute',
    other: '{{count}} minut'
  },
  aboutXHours: {
    one: 'približno {{count}} uro',
    two: 'približno {{count}} uri',
    few: 'približno {{count}} ure',
    other: 'približno {{count}} ur'
  },
  xHours: {
    one: '{{count}} uro',
    two: '{{count}} uri',
    few: '{{count}} ure',
    other: '{{count}} ur'
  },
  xDays: {
    one: '{{count}} dan',
    two: '{{count}} dni',
    few: '{{count}} dni',
    other: '{{count}} dni'
  },
  aboutXMonths: {
    one: 'približno {{count}} mesec',
    two: 'približno {{count}} meseca',
    few: 'približno {{count}} mesece',
    other: 'približno {{count}} mesecev'
  },
  xMonths: {
    one: '{{count}} mesec',
    two: '{{count}} meseca',
    few: '{{count}} mesece',
    other: '{{count}} mesecev'
  },
  aboutXYears: {
    one: 'približno {{count}} leto',
    two: 'približno {{count}} leti',
    few: 'približno {{count}} leta',
    other: 'približno {{count}} let'
  },
  xYears: {
    one: '{{count}} leto',
    two: '{{count}} leti',
    few: '{{count}} leta',
    other: '{{count}} let'
  },
  overXYears: {
    one: 'več kot {{count}} leto',
    two: 'več kot {{count}} leti',
    few: 'več kot {{count}} leta',
    other: 'več kot {{count}} let'
  },
  almostXYears: {
    one: 'skoraj {{count}} leto',
    two: 'skoraj {{count}} leti',
    few: 'skoraj {{count}} leta',
    other: 'skoraj {{count}} let'
  }
};

function getFormFromCount(count) {
  switch (count % 100) {
    case 1:
      return 'one';

    case 2:
      return 'two';

    case 3:
    case 4:
      return 'few';

    default:
      return 'other';
  }
}

function formatDistance$K(token, count, options) {
  options = options || {};
  var localeObject = distanceInWordsLocale;
  var result = '';

  if (options.addSuffix) {
    if (options.comparison > 0) {
      localeObject = distanceInWordsLocaleFuture;
      result += 'čez ';
    } else {
      localeObject = distanceInWordsLocalePast;
      result += 'pred ';
    }
  }

  if (typeof localeObject[token] === 'string') {
    result += localeObject[token];
  } else {
    var form = getFormFromCount(count);
    result += localeObject[token][form].replace('{{count}}', count);
  }

  return result;
}

var dateFormats$N = {
  full: 'EEEE, dd. MMMM y',
  long: 'dd. MMMM y',
  medium: 'd. MMM y',
  short: 'd. MM. yy'
};
var timeFormats$N = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$N = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$N = {
  date: buildFormatLongFn({
    formats: dateFormats$N,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$N,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$N,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$J = {
  lastWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'prejšnjo nedeljo ob' p";

      case 3:
        return "'prejšnjo sredo ob' p";

      case 6:
        return "'prejšnjo soboto ob' p";

      default:
        return "'prejšnji' EEEE 'ob' p";
    }
  },
  yesterday: "'včeraj ob' p",
  today: "'danes ob' p",
  tomorrow: "'jutri ob' p",
  nextWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'naslednjo nedeljo ob' p";

      case 3:
        return "'naslednjo sredo ob' p";

      case 6:
        return "'naslednjo soboto ob' p";

      default:
        return "'naslednji' EEEE 'ob' p";
    }
  },
  other: 'P'
};
function formatRelative$J(token, date, _baseDate, _options) {
  var format = formatRelativeLocale$J[token];

  if (typeof format === 'function') {
    return format(date);
  }

  return format;
}

function ordinalNumber$J(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number).concat('.');
}

var eraValues$J = {
  narrow: ['pr. n. št.', 'po n. št.'],
  abbreviated: ['pr. n. št.', 'po n. št.'],
  wide: ['pred našim štetjem', 'po našem štetju']
};
var monthValues$J = {
  narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
  abbreviated: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
  wide: ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'avgust', 'september', 'oktober', 'november', 'december']
};
var quarterValues$J = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1. čet.', '2. čet.', '3. čet.', '4. čet.'],
  wide: ['1. četrtletje', '2. četrtletje', '3. četrtletje', '4. četrtletje']
};
var dayValues$J = {
  narrow: ['n', 'p', 't', 's', 'č', 'p', 's'],
  short: ['ned.', 'pon.', 'tor.', 'sre.', 'čet.', 'pet.', 'sob.'],
  abbreviated: ['ned.', 'pon.', 'tor.', 'sre.', 'čet.', 'pet.', 'sob.'],
  wide: ['nedelja', 'ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota']
};
var dayPeriodValuesStandalone = {
  narrow: {
    am: 'd',
    pm: 'p',
    midnight: '24.00',
    noon: '12.00',
    morning: 'j',
    afternoon: 'p',
    evening: 'v',
    night: 'n'
  },
  abbreviated: {
    am: 'dop.',
    pm: 'pop.',
    midnight: 'poln.',
    noon: 'pold.',
    morning: 'jut.',
    afternoon: 'pop.',
    evening: 'več.',
    night: 'noč'
  },
  wide: {
    am: 'dop.',
    pm: 'pop.',
    midnight: 'polnoč',
    noon: 'poldne',
    morning: 'jutro',
    afternoon: 'popoldne',
    evening: 'večer',
    night: 'noč'
  }
};
var dayPeriodValuesFormatting = {
  narrow: {
    am: 'd',
    pm: 'p',
    midnight: '24.00',
    noon: '12.00',
    morning: 'zj',
    afternoon: 'p',
    evening: 'zv',
    night: 'po'
  },
  abbreviated: {
    am: 'dop.',
    pm: 'pop.',
    midnight: 'opoln.',
    noon: 'opold.',
    morning: 'zjut.',
    afternoon: 'pop.',
    evening: 'zveč.',
    night: 'ponoči'
  },
  wide: {
    am: 'dop.',
    pm: 'pop.',
    midnight: 'opolnoči',
    noon: 'opoldne',
    morning: 'zjutraj',
    afternoon: 'popoldan',
    evening: 'zvečer',
    night: 'ponoči'
  }
};
var localize$J = {
  ordinalNumber: ordinalNumber$J,
  era: buildLocalizeFn({
    values: eraValues$J,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$J,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$J,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$J,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValuesStandalone,
    defaultWidth: 'wide',
    formattingValues: dayPeriodValuesFormatting,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$J = /^(\d+)\./i;
var parseOrdinalNumberPattern$J = /\d+/i;
var matchEraPatterns$J = {
  abbreviated: /^(pr\. n\. št\.|po n\. št\.)/i,
  wide: /^(pred Kristusom|pred na[sš]im [sš]tetjem|po Kristusu|po na[sš]em [sš]tetju|na[sš]ega [sš]tetja)/i
};
var parseEraPatterns$J = {
  any: [/^pr/i, /^(po|na[sš]em)/i]
};
var matchQuarterPatterns$J = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]\.\s?[čc]et\.?/i,
  wide: /^[1234]\. [čc]etrtletje/i
};
var parseQuarterPatterns$J = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$J = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan\.|feb\.|mar\.|apr\.|maj|jun\.|jul\.|avg\.|sep\.|okt\.|nov\.|dec\.)/i,
  wide: /^(januar|februar|marec|april|maj|junij|julij|avgust|september|oktober|november|december)/i
};
var parseMonthPatterns$J = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  abbreviated: [/^ja/i, /^fe/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^av/i, /^s/i, /^o/i, /^n/i, /^d/i],
  wide: [/^ja/i, /^fe/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^av/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$J = {
  narrow: /^[nptsčc]/i,
  short: /^(ned\.|pon\.|tor\.|sre\.|[cč]et\.|pet\.|sob\.)/i,
  abbreviated: /^(ned\.|pon\.|tor\.|sre\.|[cč]et\.|pet\.|sob\.)/i,
  wide: /^(nedelja|ponedeljek|torek|sreda|[cč]etrtek|petek|sobota)/i
};
var parseDayPatterns$J = {
  narrow: [/^n/i, /^p/i, /^t/i, /^s/i, /^[cč]/i, /^p/i, /^s/i],
  any: [/^n/i, /^po/i, /^t/i, /^sr/i, /^[cč]/i, /^pe/i, /^so/i]
};
var matchDayPeriodPatterns$J = {
  narrow: /^(d|po?|z?v|n|z?j|24\.00|12\.00)/i,
  any: /^(dop\.|pop\.|o?poln(\.|o[cč]i?)|o?pold(\.|ne)|z?ve[cč](\.|er)|(po)?no[cč]i?|popold(ne|an)|jut(\.|ro)|zjut(\.|raj))/i
};
var parseDayPeriodPatterns$J = {
  narrow: {
    am: /^d/i,
    pm: /^p/i,
    midnight: /^24/i,
    noon: /^12/i,
    morning: /^(z?j)/i,
    afternoon: /^p/i,
    evening: /^(z?v)/i,
    night: /^(n|po)/i
  },
  any: {
    am: /^dop\./i,
    pm: /^pop\./i,
    midnight: /^o?poln/i,
    noon: /^o?pold/i,
    morning: /j/i,
    afternoon: /^pop\./i,
    evening: /^z?ve/i,
    night: /(po)?no/i
  }
};
var match$J = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$J,
    parsePattern: parseOrdinalNumberPattern$J,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$J,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$J,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$J,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$J,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$J,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$J,
    defaultParseWidth: 'wide'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$J,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$J,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$J,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$J,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Slovenian locale.
 * @language Slovenian
 * @iso-639-2 slv
 * @author Adam Stradovnik [@Neoglyph]{@link https://github.com/Neoglyph}
 * @author Mato Žgajner [@mzgajner]{@link https://github.com/mzgajner}
 */

var locale$N = {
  code: 'sl',
  formatDistance: formatDistance$K,
  formatLong: formatLong$N,
  formatRelative: formatRelative$J,
  localize: localize$J,
  match: match$J,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$J = {
  lessThanXSeconds: {
    one: {
      standalone: 'мање од 1 секунде',
      withPrepositionAgo: 'мање од 1 секунде',
      withPrepositionIn: 'мање од 1 секунду'
    },
    dual: 'мање од {{count}} секунде',
    other: 'мање од {{count}} секунди'
  },
  xSeconds: {
    one: {
      standalone: '1 секунда',
      withPrepositionAgo: '1 секунде',
      withPrepositionIn: '1 секунду'
    },
    dual: '{{count}} секунде',
    other: '{{count}} секунди'
  },
  halfAMinute: 'пола минуте',
  lessThanXMinutes: {
    one: {
      standalone: 'мање од 1 минуте',
      withPrepositionAgo: 'мање од 1 минуте',
      withPrepositionIn: 'мање од 1 минуту'
    },
    dual: 'мање од {{count}} минуте',
    other: 'мање од {{count}} минута'
  },
  xMinutes: {
    one: {
      standalone: '1 минута',
      withPrepositionAgo: '1 минуте',
      withPrepositionIn: '1 минуту'
    },
    dual: '{{count}} минуте',
    other: '{{count}} минута'
  },
  aboutXHours: {
    one: {
      standalone: 'око 1 сат',
      withPrepositionAgo: 'око 1 сат',
      withPrepositionIn: 'око 1 сат'
    },
    dual: 'око {{count}} сата',
    other: 'око {{count}} сати'
  },
  xHours: {
    one: {
      standalone: '1 сат',
      withPrepositionAgo: '1 сат',
      withPrepositionIn: '1 сат'
    },
    dual: '{{count}} сата',
    other: '{{count}} сати'
  },
  xDays: {
    one: {
      standalone: '1 дан',
      withPrepositionAgo: '1 дан',
      withPrepositionIn: '1 дан'
    },
    dual: '{{count}} дана',
    other: '{{count}} дана'
  },
  aboutXMonths: {
    one: {
      standalone: 'око 1 месец',
      withPrepositionAgo: 'око 1 месец',
      withPrepositionIn: 'око 1 месец'
    },
    dual: 'око {{count}} месеца',
    other: 'око {{count}} месеци'
  },
  xMonths: {
    one: {
      standalone: '1 месец',
      withPrepositionAgo: '1 месец',
      withPrepositionIn: '1 месец'
    },
    dual: '{{count}} месеца',
    other: '{{count}} месеци'
  },
  aboutXYears: {
    one: {
      standalone: 'око 1 годину',
      withPrepositionAgo: 'око 1 годину',
      withPrepositionIn: 'око 1 годину'
    },
    dual: 'око {{count}} године',
    other: 'око {{count}} година'
  },
  xYears: {
    one: {
      standalone: '1 година',
      withPrepositionAgo: '1 године',
      withPrepositionIn: '1 годину'
    },
    dual: '{{count}} године',
    other: '{{count}} година'
  },
  overXYears: {
    one: {
      standalone: 'преко 1 годину',
      withPrepositionAgo: 'преко 1 годину',
      withPrepositionIn: 'преко 1 годину'
    },
    dual: 'преко {{count}} године',
    other: 'преко {{count}} година'
  },
  almostXYears: {
    one: {
      standalone: 'готово 1 годину',
      withPrepositionAgo: 'готово 1 годину',
      withPrepositionIn: 'готово 1 годину'
    },
    dual: 'готово {{count}} године',
    other: 'готово {{count}} година'
  }
};
function formatDistance$L(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$J[token] === 'string') {
    result = formatDistanceLocale$J[token];
  } else if (count === 1) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        result = formatDistanceLocale$J[token].one.withPrepositionIn;
      } else {
        result = formatDistanceLocale$J[token].one.withPrepositionAgo;
      }
    } else {
      result = formatDistanceLocale$J[token].one.standalone;
    }
  } else if (count % 10 > 1 && count % 10 < 5 && // if last digit is between 2 and 4
  String(count).substr(-2, 1) !== '1' // unless the 2nd to last digit is "1"
  ) {
      result = formatDistanceLocale$J[token].dual.replace('{{count}}', count);
    } else {
    result = formatDistanceLocale$J[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'за ' + result;
    } else {
      return 'пре ' + result;
    }
  }

  return result;
}

var dateFormats$O = {
  full: 'EEEE, d. MMMM yyyy.',
  long: 'd. MMMM yyyy.',
  medium: 'd. MMM yy.',
  short: 'dd. MM. yy.'
};
var timeFormats$O = {
  full: 'HH:mm:ss (zzzz)',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$O = {
  full: "{{date}} 'у' {{time}}",
  long: "{{date}} 'у' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$O = {
  date: buildFormatLongFn({
    formats: dateFormats$O,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$O,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$O,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$K = {
  lastWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'прошле недеље у' p";

      case 3:
        return "'прошле среде у' p";

      case 6:
        return "'прошле суботе у' p";

      default:
        return "'прошли' EEEE 'у' p";
    }
  },
  yesterday: "'јуче у' p",
  today: "'данас у' p",
  tomorrow: "'сутра у' p",
  nextWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'следеће недеље у' p";

      case 3:
        return "'следећу среду у' p";

      case 6:
        return "'следећу суботу у' p";

      default:
        return "'следећи' EEEE 'у' p";
    }
  },
  other: 'P'
};
function formatRelative$K(token, date, _baseDate, _options) {
  var format = formatRelativeLocale$K[token];

  if (typeof format === 'function') {
    return format(date);
  }

  return format;
}

function ordinalNumber$K(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number).concat('.');
}

var eraValues$K = {
  narrow: ['пр.н.е.', 'АД'],
  abbreviated: ['пр. Хр.', 'по. Хр.'],
  wide: ['Пре Христа', 'После Христа']
};
var monthValues$K = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['јан', 'феб', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'нов', 'дец'],
  wide: ['јануар', 'фебруар', 'март', 'април', 'мај', 'јун', 'јул', 'август', 'септембар', 'октобар', 'новембар', 'децембар']
};
var formattingMonthValues$a = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['јан', 'феб', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'нов', 'дец'],
  wide: ['јануар', 'фебруар', 'март', 'април', 'мај', 'јун', 'јул', 'август', 'септембар', 'октобар', 'новембар', 'децембар']
};
var quarterValues$K = {
  narrow: ['1.', '2.', '3.', '4.'],
  abbreviated: ['1. кв.', '2. кв.', '3. кв.', '4. кв.'],
  wide: ['1. квартал', '2. квартал', '3. квартал', '4. квартал']
};
var dayValues$K = {
  narrow: ['Н', 'П', 'У', 'С', 'Ч', 'П', 'С'],
  short: ['нед', 'пон', 'уто', 'сре', 'чет', 'пет', 'суб'],
  abbreviated: ['нед', 'пон', 'уто', 'сре', 'чет', 'пет', 'суб'],
  wide: ['недеља', 'понедељак', 'уторак', 'среда', 'четвртак', 'петак', 'субота']
};
var formattingDayPeriodValues$z = {
  narrow: {
    am: 'АМ',
    pm: 'ПМ',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'поподне',
    evening: 'увече',
    night: 'ноћу'
  },
  abbreviated: {
    am: 'АМ',
    pm: 'ПМ',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'поподне',
    evening: 'увече',
    night: 'ноћу'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'после подне',
    evening: 'увече',
    night: 'ноћу'
  }
};
var dayPeriodValues$J = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'поподне',
    evening: 'увече',
    night: 'ноћу'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'поподне',
    evening: 'увече',
    night: 'ноћу'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'поноћ',
    noon: 'подне',
    morning: 'ујутру',
    afternoon: 'после подне',
    evening: 'увече',
    night: 'ноћу'
  }
};
var localize$K = {
  ordinalNumber: ordinalNumber$K,
  era: buildLocalizeFn({
    values: eraValues$K,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$K,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$K,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$a,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$K,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$J,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$z,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$K = /^(\d+)\./i;
var parseOrdinalNumberPattern$K = /\d+/i;
var matchEraPatterns$K = {
  narrow: /^(пр\.н\.е\.|АД)/i,
  abbreviated: /^(пр\.\s?Хр\.|по\.\s?Хр\.)/i,
  wide: /^(Пре Христа|пре нове ере|После Христа|нова ера)/i
};
var parseEraPatterns$K = {
  any: [/^пр/i, /^(по|нова)/i]
};
var matchQuarterPatterns$K = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]\.\s?кв\.?/i,
  wide: /^[1234]\. квартал/i
};
var parseQuarterPatterns$K = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$K = {
  narrow: /^(10|11|12|[123456789])\./i,
  abbreviated: /^(јан|феб|мар|апр|мај|јун|јул|авг|сеп|окт|нов|дец)/i,
  wide: /^((јануар|јануара)|(фебруар|фебруара)|(март|марта)|(април|априла)|(мја|маја)|(јун|јуна)|(јул|јула)|(август|августа)|(септембар|септембра)|(октобар|октобра)|(новембар|новембра)|(децембар|децембра))/i
};
var parseMonthPatterns$K = {
  narrow: [/(10|11|12|[123456789])/i],
  any: [/^ја/i, /^ф/i, /^мар/i, /^ап/i, /^мај/i, /^јун/i, /^јул/i, /^авг/i, /^с/i, /^о/i, /^н/i, /^д/i]
};
var matchDayPatterns$K = {
  narrow: /^[пусчн]/i,
  short: /^(нед|пон|уто|сре|чет|пет|суб)/i,
  abbreviated: /^(нед|пон|уто|сре|чет|пет|суб)/i,
  wide: /^(недеља|понедељак|уторак|среда|четвртак|петак|субота)/i
};
var parseDayPatterns$K = {
  narrow: [/^п/i, /^у/i, /^с/i, /^ч/i, /^н/i],
  any: [/^нед/i, /^пон/i, /^уто/i, /^сре/i, /^чет/i, /^пет/i, /^суб/i]
};
var matchDayPeriodPatterns$K = {
  any: /^(ам|пм|поноћ|(по)?подне|увече|ноћу|после подне|ујутру)/i
};
var parseDayPeriodPatterns$K = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^поно/i,
    noon: /^под/i,
    morning: /ујутру/i,
    afternoon: /(после\s|по)+подне/i,
    evening: /(увече)/i,
    night: /(ноћу)/i
  }
};
var match$K = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$K,
    parsePattern: parseOrdinalNumberPattern$K,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$K,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$K,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$K,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$K,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$K,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$K,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$K,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$K,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$K,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$K,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Serbian cyrillic locale.
 * @language Serbian
 * @iso-639-2 srp
 * @author Igor Radivojević [@rogyvoje]{@link https://github.com/rogyvoje}
 */

var locale$O = {
  code: 'sr',
  formatDistance: formatDistance$L,
  formatLong: formatLong$O,
  formatRelative: formatRelative$K,
  localize: localize$K,
  match: match$K,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$K = {
  lessThanXSeconds: {
    one: {
      standalone: 'manje od 1 sekunde',
      withPrepositionAgo: 'manje od 1 sekunde',
      withPrepositionIn: 'manje od 1 sekundu'
    },
    dual: 'manje od {{count}} sekunde',
    other: 'manje od {{count}} sekundi'
  },
  xSeconds: {
    one: {
      standalone: '1 sekunda',
      withPrepositionAgo: '1 sekunde',
      withPrepositionIn: '1 sekundu'
    },
    dual: '{{count}} sekunde',
    other: '{{count}} sekundi'
  },
  halfAMinute: 'pola minute',
  lessThanXMinutes: {
    one: {
      standalone: 'manje od 1 minute',
      withPrepositionAgo: 'manje od 1 minute',
      withPrepositionIn: 'manje od 1 minutu'
    },
    dual: 'manje od {{count}} minute',
    other: 'manje od {{count}} minuta'
  },
  xMinutes: {
    one: {
      standalone: '1 minuta',
      withPrepositionAgo: '1 minute',
      withPrepositionIn: '1 minutu'
    },
    dual: '{{count}} minute',
    other: '{{count}} minuta'
  },
  aboutXHours: {
    one: {
      standalone: 'oko 1 sat',
      withPrepositionAgo: 'oko 1 sat',
      withPrepositionIn: 'oko 1 sat'
    },
    dual: 'oko {{count}} sata',
    other: 'oko {{count}} sati'
  },
  xHours: {
    one: {
      standalone: '1 sat',
      withPrepositionAgo: '1 sat',
      withPrepositionIn: '1 sat'
    },
    dual: '{{count}} sata',
    other: '{{count}} sati'
  },
  xDays: {
    one: {
      standalone: '1 dan',
      withPrepositionAgo: '1 dan',
      withPrepositionIn: '1 dan'
    },
    dual: '{{count}} dana',
    other: '{{count}} dana'
  },
  aboutXMonths: {
    one: {
      standalone: 'oko 1 mesec',
      withPrepositionAgo: 'oko 1 mesec',
      withPrepositionIn: 'oko 1 mesec'
    },
    dual: 'oko {{count}} meseca',
    other: 'oko {{count}} meseci'
  },
  xMonths: {
    one: {
      standalone: '1 mesec',
      withPrepositionAgo: '1 mesec',
      withPrepositionIn: '1 mesec'
    },
    dual: '{{count}} meseca',
    other: '{{count}} meseci'
  },
  aboutXYears: {
    one: {
      standalone: 'oko 1 godinu',
      withPrepositionAgo: 'oko 1 godinu',
      withPrepositionIn: 'oko 1 godinu'
    },
    dual: 'oko {{count}} godine',
    other: 'oko {{count}} godina'
  },
  xYears: {
    one: {
      standalone: '1 godina',
      withPrepositionAgo: '1 godine',
      withPrepositionIn: '1 godinu'
    },
    dual: '{{count}} godine',
    other: '{{count}} godina'
  },
  overXYears: {
    one: {
      standalone: 'preko 1 godinu',
      withPrepositionAgo: 'preko 1 godinu',
      withPrepositionIn: 'preko 1 godinu'
    },
    dual: 'preko {{count}} godine',
    other: 'preko {{count}} godina'
  },
  almostXYears: {
    one: {
      standalone: 'gotovo 1 godinu',
      withPrepositionAgo: 'gotovo 1 godinu',
      withPrepositionIn: 'gotovo 1 godinu'
    },
    dual: 'gotovo {{count}} godine',
    other: 'gotovo {{count}} godina'
  }
};
function formatDistance$M(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$K[token] === 'string') {
    result = formatDistanceLocale$K[token];
  } else if (count === 1) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        result = formatDistanceLocale$K[token].one.withPrepositionIn;
      } else {
        result = formatDistanceLocale$K[token].one.withPrepositionAgo;
      }
    } else {
      result = formatDistanceLocale$K[token].one.standalone;
    }
  } else if (count % 10 > 1 && count % 10 < 5 && // if last digit is between 2 and 4
  String(count).substr(-2, 1) !== '1' // unless the 2nd to last digit is "1"
  ) {
      result = formatDistanceLocale$K[token].dual.replace('{{count}}', count);
    } else {
    result = formatDistanceLocale$K[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'za ' + result;
    } else {
      return 'pre ' + result;
    }
  }

  return result;
}

var dateFormats$P = {
  full: 'EEEE, d. MMMM yyyy.',
  long: 'd. MMMM yyyy.',
  medium: 'd. MMM yy.',
  short: 'dd. MM. yy.'
};
var timeFormats$P = {
  full: 'HH:mm:ss (zzzz)',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$P = {
  full: "{{date}} 'u' {{time}}",
  long: "{{date}} 'u' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$P = {
  date: buildFormatLongFn({
    formats: dateFormats$P,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$P,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$P,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$L = {
  lastWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'prošle nedelje u' p";

      case 3:
        return "'prošle srede u' p";

      case 6:
        return "'prošle subote u' p";

      default:
        return "'prošli' EEEE 'u' p";
    }
  },
  yesterday: "'juče u' p",
  today: "'danas u' p",
  tomorrow: "'sutra u' p",
  nextWeek: function (date) {
    var day = date.getUTCDay();

    switch (day) {
      case 0:
        return "'sledeće nedelje u' p";

      case 3:
        return "'sledeću sredu u' p";

      case 6:
        return "'sledeću subotu u' p";

      default:
        return "'sledeći' EEEE 'u' p";
    }
  },
  other: 'P'
};
function formatRelative$L(token, date, _baseDate, _options) {
  var format = formatRelativeLocale$L[token];

  if (typeof format === 'function') {
    return format(date);
  }

  return format;
}

function ordinalNumber$L(dirtyNumber) {
  var number = Number(dirtyNumber);
  return String(number).concat('.');
}

var eraValues$L = {
  narrow: ['pr.n.e.', 'AD'],
  abbreviated: ['pr. Hr.', 'po. Hr.'],
  wide: ['Pre Hrista', 'Posle Hrista']
};
var monthValues$L = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'],
  wide: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']
};
var formattingMonthValues$b = {
  narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  abbreviated: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'],
  wide: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']
};
var quarterValues$L = {
  narrow: ['1.', '2.', '3.', '4.'],
  abbreviated: ['1. kv.', '2. kv.', '3. kv.', '4. kv.'],
  wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal']
};
var dayValues$L = {
  narrow: ['N', 'P', 'U', 'S', 'Č', 'P', 'S'],
  short: ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'],
  abbreviated: ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub'],
  wide: ['nedjelja', 'ponedjeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota']
};
var formattingDayPeriodValues$A = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'popodne',
    evening: 'uveče',
    night: 'noću'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'popodne',
    evening: 'uveče',
    night: 'noću'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'posle podne',
    evening: 'uveče',
    night: 'noću'
  }
};
var dayPeriodValues$K = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'popodne',
    evening: 'uveče',
    night: 'noću'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'popodne',
    evening: 'uveče',
    night: 'noću'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'ponoć',
    noon: 'podne',
    morning: 'ujutru',
    afternoon: 'posle podne',
    evening: 'uveče',
    night: 'noću'
  }
};
var localize$L = {
  ordinalNumber: ordinalNumber$L,
  era: buildLocalizeFn({
    values: eraValues$L,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$L,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$L,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$b,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$L,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$K,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$A,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$L = /^(\d+)\./i;
var parseOrdinalNumberPattern$L = /\d+/i;
var matchEraPatterns$L = {
  narrow: /^(pr\.n\.e\.|AD)/i,
  abbreviated: /^(pr\.\s?Hr\.|po\.\s?Hr\.)/i,
  wide: /^(Pre Hrista|pre nove ere|Posle Hrista|nova era)/i
};
var parseEraPatterns$L = {
  any: [/^pr/i, /^(po|nova)/i]
};
var matchQuarterPatterns$L = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]\.\s?kv\.?/i,
  wide: /^[1234]\. kvartal/i
};
var parseQuarterPatterns$L = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$L = {
  narrow: /^(10|11|12|[123456789])\./i,
  abbreviated: /^(jan|feb|mar|apr|maj|jun|jul|avg|sep|okt|nov|dec)/i,
  wide: /^((januar|januara)|(februar|februara)|(mart|marta)|(april|aprila)|(maj|maja)|(jun|juna)|(jul|jula)|(avgust|avgusta)|(septembar|septembra)|(oktobar|oktobra)|(novembar|novembra)|(decembar|decembra))/i
};
var parseMonthPatterns$L = {
  narrow: [/(10|11|12|[123456789])/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^avg/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$L = {
  narrow: /^[npusčc]/i,
  short: /^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
  abbreviated: /^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
  wide: /^(nedjelja|ponedjeljak|utorak|sreda|(četvrtak|cetvrtak)|petak|subota)/i
};
var parseDayPatterns$L = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns$L = {
  any: /^(am|pm|ponoc|ponoć|(po)?podne|uvece|uveče|noću|posle podne|ujutru)/i
};
var parseDayPeriodPatterns$L = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^pono/i,
    noon: /^pod/i,
    morning: /jutro/i,
    afternoon: /(posle\s|po)+podne/i,
    evening: /(uvece|uveče)/i,
    night: /(nocu|noću)/i
  }
};
var match$L = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$L,
    parsePattern: parseOrdinalNumberPattern$L,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$L,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$L,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$L,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$L,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$L,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$L,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$L,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$L,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$L,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$L,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Serbian latin locale.
 * @language Serbian
 * @iso-639-2 srp
 * @author Igor Radivojević [@rogyvoje]{@link https://github.com/rogyvoje}
 */

var locale$P = {
  code: 'sr-Latn',
  formatDistance: formatDistance$M,
  formatLong: formatLong$P,
  formatRelative: formatRelative$L,
  localize: localize$L,
  match: match$L,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$L = {
  lessThanXSeconds: {
    singular: 'mindre än en sekund',
    plural: 'mindre än {{count}} sekunder'
  },
  xSeconds: {
    singular: 'en sekund',
    plural: '{{count}} sekunder'
  },
  halfAMinute: 'en halv minut',
  lessThanXMinutes: {
    singular: 'mindre än en minut',
    plural: 'mindre än {{count}} minuter'
  },
  xMinutes: {
    singular: 'en minut',
    plural: '{{count}} minuter'
  },
  aboutXHours: {
    singular: 'ungefär en timme',
    plural: 'ungefär {{count}} timmar'
  },
  xHours: {
    singular: 'en timme',
    plural: '{{count}} timmar'
  },
  xDays: {
    singular: 'en dag',
    plural: '{{count}} dagar'
  },
  aboutXMonths: {
    singular: 'ungefär en månad',
    plural: 'ungefär {{count}} månader'
  },
  xMonths: {
    singular: 'en månad',
    plural: '{{count}} månader'
  },
  aboutXYears: {
    singular: 'ungefär ett år',
    plural: 'ungefär {{count}} år'
  },
  xYears: {
    singular: 'ett år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'över ett år',
    plural: 'över {{count}} år'
  },
  almostXYears: {
    singular: 'nästan ett år',
    plural: 'nästan {{count}} år'
  }
};
var wordMapping$2 = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];
function formatDistance$N(token, count, options) {
  options = options || {
    onlyNumeric: false
  };
  var translation = formatDistanceLocale$L[token];
  var result;

  if (typeof translation === 'string') {
    result = translation;
  } else if (count === 0 || count > 1) {
    if (options.onlyNumeric) {
      result = translation.plural.replace('{{count}}', count);
    } else {
      result = translation.plural.replace('{{count}}', count < 13 ? wordMapping$2[count] : count);
    }
  } else {
    result = translation.singular;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' sedan';
    }
  }

  return result;
}

var dateFormats$Q = {
  full: 'EEEE d MMMM y',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'y-MM-dd'
};
var timeFormats$Q = {
  full: "'kl'. HH:mm:ss zzzz",
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$Q = {
  full: "{{date}} 'kl.' {{time}}",
  long: "{{date}} 'kl.' {{time}}",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$Q = {
  date: buildFormatLongFn({
    formats: dateFormats$Q,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$Q,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$Q,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$M = {
  lastWeek: "'i' EEEE's kl.' p",
  yesterday: "'igår kl.' p",
  today: "'idag kl.' p",
  tomorrow: "'imorgon kl.' p",
  nextWeek: "EEEE 'kl.' p",
  other: 'P'
};
function formatRelative$M(token, _date, _baseDate, _options) {
  return formatRelativeLocale$M[token];
}

var eraValues$M = {
  narrow: ['f.Kr.', 'e.Kr.'],
  abbreviated: ['f.Kr.', 'e.Kr.'],
  wide: ['före Kristus', 'efter Kristus']
};
var quarterValues$M = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['1:a kvartalet', '2:a kvartalet', '3:e kvartalet', '4:e kvartalet']
};
var monthValues$M = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  abbreviated: ['jan.', 'feb.', 'mars', 'apr.', 'maj', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
  wide: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
};
var dayValues$M = {
  narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
  short: ['sö', 'må', 'ti', 'on', 'to', 'fr', 'lö'],
  abbreviated: ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'],
  wide: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'] // https://www.unicode.org/cldr/charts/32/summary/sv.html#1888

};
var dayPeriodValues$L = {
  narrow: {
    am: 'fm',
    pm: 'em',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'morg.',
    afternoon: 'efterm.',
    evening: 'kväll',
    night: 'natt'
  },
  abbreviated: {
    am: 'f.m.',
    pm: 'e.m.',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'morgon',
    afternoon: 'efterm.',
    evening: 'kväll',
    night: 'natt'
  },
  wide: {
    am: 'förmiddag',
    pm: 'eftermiddag',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'morgon',
    afternoon: 'eftermiddag',
    evening: 'kväll',
    night: 'natt'
  }
};
var formattingDayPeriodValues$B = {
  narrow: {
    am: 'fm',
    pm: 'em',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på efterm.',
    evening: 'på kvällen',
    night: 'på natten'
  },
  abbreviated: {
    am: 'fm',
    pm: 'em',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morg.',
    afternoon: 'på efterm.',
    evening: 'på kvällen',
    night: 'på natten'
  },
  wide: {
    am: 'fm',
    pm: 'em',
    midnight: 'midnatt',
    noon: 'middag',
    morning: 'på morgonen',
    afternoon: 'på eftermiddagen',
    evening: 'på kvällen',
    night: 'på natten'
  }
};

function ordinalNumber$M(dirtyNumber) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;

  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
      case 2:
        return number + ':a';
    }
  }

  return number + ':e';
}

var localize$M = {
  ordinalNumber: ordinalNumber$M,
  era: buildLocalizeFn({
    values: eraValues$M,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$M,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$M,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$M,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$L,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$B,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$M = /^(\d+)(:a|:e)?/i;
var parseOrdinalNumberPattern$M = /\d+/i;
var matchEraPatterns$M = {
  narrow: /^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
  abbreviated: /^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
  wide: /^(före Kristus|före vår tid|efter Kristus|vår tid)/i
};
var parseEraPatterns$M = {
  any: [/^f/i, /^[ev]/i]
};
var matchQuarterPatterns$M = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](:a|:e)? kvartalet/i
};
var parseQuarterPatterns$M = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$M = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\.?/i,
  wide: /^(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/i
};
var parseMonthPatterns$M = {
  narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
  any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^maj/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
};
var matchDayPatterns$M = {
  narrow: /^[smtofl]/i,
  short: /^(sö|må|ti|on|to|fr|lö)/i,
  abbreviated: /^(sön|mån|tis|ons|tor|fre|lör)/i,
  wide: /^(söndag|måndag|tisdag|onsdag|torsdag|fredag|lördag)/i
};
var parseDayPatterns$M = {
  any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i]
};
var matchDayPeriodPatterns$M = {
  any: /^([fe]\.?\s?m\.?|midn(att)?|midd(ag)?|(på) (morgonen|eftermiddagen|kvällen|natten))/i
};
var parseDayPeriodPatterns$M = {
  any: {
    am: /^f/i,
    pm: /^e/i,
    midnight: /^midn/i,
    noon: /^midd/i,
    morning: /morgon/i,
    afternoon: /eftermiddag/i,
    evening: /kväll/i,
    night: /natt/i
  }
};
var match$M = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$M,
    parsePattern: parseOrdinalNumberPattern$M,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$M,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$M,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$M,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$M,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$M,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$M,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$M,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$M,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$M,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$M,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Swedish locale.
 * @language Swedish
 * @iso-639-2 swe
 * @author Johannes Ulén [@ejulen]{@link https://github.com/ejulen}
 * @author Alexander Nanberg [@alexandernanberg]{@link https://github.com/alexandernanberg}
 * @author Henrik Andersson [@limelights]{@link https://github.com/limelights}
 */

var locale$Q = {
  code: 'sv',
  formatDistance: formatDistance$N,
  formatLong: formatLong$Q,
  formatRelative: formatRelative$M,
  localize: localize$M,
  match: match$M,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$M = {
  lessThanXSeconds: {
    one: {
      default: 'ஒரு வினாடிக்கு குறைவாக',
      in: 'ஒரு வினாடிக்குள்',
      ago: 'ஒரு வினாடிக்கு முன்பு'
    },
    other: {
      default: '{{count}} வினாடிகளுக்கு குறைவாக',
      in: '{{count}} வினாடிகளுக்குள்',
      ago: '{{count}} வினாடிகளுக்கு முன்பு'
    }
  },
  xSeconds: {
    one: {
      default: '1 வினாடி',
      in: '1 வினாடியில்',
      ago: '1 வினாடி முன்பு'
    },
    other: {
      default: '{{count}} விநாடிகள்',
      in: '{{count}} வினாடிகளில்',
      ago: '{{count}} விநாடிகளுக்கு முன்பு'
    }
  },
  halfAMinute: {
    default: 'அரை நிமிடம்',
    in: 'அரை நிமிடத்தில்',
    ago: 'அரை நிமிடம் முன்பு'
  },
  lessThanXMinutes: {
    one: {
      default: 'ஒரு நிமிடத்திற்கும் குறைவாக',
      in: 'ஒரு நிமிடத்திற்குள்',
      ago: 'ஒரு நிமிடத்திற்கு முன்பு'
    },
    other: {
      default: '{{count}} நிமிடங்களுக்கும் குறைவாக',
      in: '{{count}} நிமிடங்களுக்குள்',
      ago: '{{count}} நிமிடங்களுக்கு முன்பு'
    }
  },
  xMinutes: {
    one: {
      default: '1 நிமிடம்',
      in: '1 நிமிடத்தில்',
      ago: '1 நிமிடம் முன்பு'
    },
    other: {
      default: '{{count}} நிமிடங்கள்',
      in: '{{count}} நிமிடங்களில்',
      ago: '{{count}} நிமிடங்களுக்கு முன்பு'
    }
  },
  aboutXHours: {
    one: {
      default: 'சுமார் 1 மணி நேரம்',
      in: 'சுமார் 1 மணி நேரத்தில்',
      ago: 'சுமார் 1 மணி நேரத்திற்கு முன்பு'
    },
    other: {
      default: 'சுமார் {{count}} மணி நேரம்',
      in: 'சுமார் {{count}} மணி நேரத்திற்கு முன்பு',
      ago: 'சுமார் {{count}} மணி நேரத்தில்'
    }
  },
  xHours: {
    one: {
      default: '1 மணி நேரம்',
      in: '1 மணி நேரத்தில்',
      ago: '1 மணி நேரத்திற்கு முன்பு'
    },
    other: {
      default: '{{count}} மணி நேரம்',
      in: '{{count}} மணி நேரத்தில்',
      ago: '{{count}} மணி நேரத்திற்கு முன்பு'
    }
  },
  xDays: {
    one: {
      default: '1 நாள்',
      in: '1 நாளில்',
      ago: '1 நாள் முன்பு'
    },
    other: {
      default: '{{count}} நாட்கள்',
      in: '{{count}} நாட்களில்',
      ago: '{{count}} நாட்களுக்கு முன்பு'
    }
  },
  aboutXMonths: {
    one: {
      default: 'சுமார் 1 மாதம்',
      in: 'சுமார் 1 மாதத்தில்',
      ago: 'சுமார் 1 மாதத்திற்கு முன்பு'
    },
    other: {
      default: 'சுமார் {{count}} மாதங்கள்',
      in: 'சுமார் {{count}} மாதங்களில்',
      ago: 'சுமார் {{count}} மாதங்களுக்கு முன்பு'
    }
  },
  xMonths: {
    one: {
      default: '1 மாதம்',
      in: '1 மாதத்தில்',
      ago: '1 மாதம் முன்பு'
    },
    other: {
      default: '{{count}} மாதங்கள்',
      in: '{{count}} மாதங்களில்',
      ago: '{{count}} மாதங்களுக்கு முன்பு'
    }
  },
  aboutXYears: {
    one: {
      default: 'சுமார் 1 வருடம்',
      in: 'சுமார் 1 ஆண்டில்',
      ago: 'சுமார் 1 வருடம் முன்பு'
    },
    other: {
      default: 'சுமார் {{count}} ஆண்டுகள்',
      in: 'சுமார் {{count}} ஆண்டுகளில்',
      ago: 'சுமார் {{count}} ஆண்டுகளுக்கு முன்பு'
    }
  },
  xYears: {
    one: {
      default: '1 வருடம்',
      in: '1 ஆண்டில்',
      ago: '1 வருடம் முன்பு'
    },
    other: {
      default: '{{count}} ஆண்டுகள்',
      in: '{{count}} ஆண்டுகளில்',
      ago: '{{count}} ஆண்டுகளுக்கு முன்பு'
    }
  },
  overXYears: {
    one: {
      default: '1 வருடத்திற்கு மேல்',
      in: '1 வருடத்திற்கும் மேலாக',
      ago: '1 வருடம் முன்பு'
    },
    other: {
      default: '{{count}} ஆண்டுகளுக்கும் மேலாக',
      in: '{{count}} ஆண்டுகளில்',
      ago: '{{count}} ஆண்டுகளுக்கு முன்பு'
    }
  },
  almostXYears: {
    one: {
      default: 'கிட்டத்தட்ட 1 வருடம்',
      in: 'கிட்டத்தட்ட 1 ஆண்டில்',
      ago: 'கிட்டத்தட்ட 1 வருடம் முன்பு'
    },
    other: {
      default: 'கிட்டத்தட்ட {{count}} ஆண்டுகள்',
      in: 'கிட்டத்தட்ட {{count}} ஆண்டுகளில்',
      ago: 'கிட்டத்தட்ட {{count}} ஆண்டுகளுக்கு முன்பு'
    }
  }
};

function getFormatDistanceLocaleWithSuffix(resultObj, options) {
  if (options.addSuffix) {
    if (options.comparison > 0) {
      return resultObj.in;
    } else {
      return resultObj.ago;
    }
  }

  return resultObj.default;
}

function formatDistance$O(token, count) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var result;

  if (formatDistanceLocale$M[token].default) {
    result = getFormatDistanceLocaleWithSuffix(formatDistanceLocale$M[token], options);
  } else if (count === 1) {
    result = getFormatDistanceLocaleWithSuffix(formatDistanceLocale$M[token].one, options);
  } else {
    result = getFormatDistanceLocaleWithSuffix(formatDistanceLocale$M[token].other, options);
  }

  return result.replace('{{count}}', count);
}

// Ref: https://www.unicode.org/cldr/charts/32/summary/ta.html

var dateFormats$R = {
  full: 'EEEE, d MMMM, y',
  long: 'd MMMM, y',
  medium: 'd MMM, y',
  short: 'd/M/yy' // CLDR #1850 - #1853

};
var timeFormats$R = {
  full: 'a h:mm:ss zzzz',
  long: 'a h:mm:ss z',
  medium: 'a h:mm:ss',
  short: 'a h:mm'
};
var dateTimeFormats$R = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$R = {
  date: buildFormatLongFn({
    formats: dateFormats$R,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$R,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$R,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$N = {
  lastWeek: "'கடந்த' eeee p 'மணிக்கு'",
  yesterday: "'நேற்று ' p 'மணிக்கு'",
  today: "'இன்று ' p 'மணிக்கு'",
  tomorrow: "'நாளை ' p 'மணிக்கு'",
  nextWeek: "eeee p 'மணிக்கு'",
  other: 'P'
};
function formatRelative$N(token, _date, _baseDate, _options) {
  return formatRelativeLocale$N[token];
}

// Ref: https://www.unicode.org/cldr/charts/32/summary/ta.html
var eraValues$N = {
  narrow: ['கி.மு.', 'கி.பி.'],
  abbreviated: ['கி.மு.', 'கி.பி.'],
  // CLDR #1624, #1626
  wide: ['கிறிஸ்துவுக்கு முன்', 'அன்னோ டோமினி'] // CLDR #1620, #1622

};
var quarterValues$N = {
  // CLDR #1644 - #1647
  narrow: ['1', '2', '3', '4'],
  // CLDR #1636 - #1639
  abbreviated: ['காலா.1', 'காலா.2', 'காலா.3', 'காலா.4'],
  // CLDR #1628 - #1631
  wide: ['ஒன்றாம் காலாண்டு', 'இரண்டாம் காலாண்டு', 'மூன்றாம் காலாண்டு', 'நான்காம் காலாண்டு']
};
var monthValues$N = {
  // CLDR #700 - #711
  narrow: ['ஜ', 'பி', 'மா', 'ஏ', 'மே', 'ஜூ', 'ஜூ', 'ஆ', 'செ', 'அ', 'ந', 'டி'],
  // CLDR #1676 - #1687
  abbreviated: ['ஜன.', 'பிப்.', 'மார்.', 'ஏப்.', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக.', 'செப்.', 'அக்.', 'நவ.', 'டிச.'],
  // CLDR #1652 - #1663
  wide: ['ஜனவரி', // January
  'பிப்ரவரி', // February
  'மார்ச்', // March
  'ஏப்ரல்', // April
  'மே', // May
  'ஜூன்', // June
  'ஜூலை', // July
  'ஆகஸ்ட்', // August
  'செப்டம்பர்', // September
  'அக்டோபர்', // October
  'நவம்பர்', // November
  'டிசம்பர்' // December
  ]
};
var dayValues$N = {
  // CLDR #1766 - #1772
  narrow: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'],
  // CLDR #1752 - #1758
  short: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'],
  // CLDR #1738 - #1744
  abbreviated: ['ஞாயி.', 'திங்.', 'செவ்.', 'புத.', 'வியா.', 'வெள்.', 'சனி'],
  // CLDR #1724 - #1730
  wide: ['ஞாயிறு', // Sunday
  'திங்கள்', // Monday
  'செவ்வாய்', // Tuesday
  'புதன்', // Wednesday
  'வியாழன்', // Thursday
  'வெள்ளி', // Friday
  'சனி' // Saturday
  ] // CLDR #1780 - #1845

};
var dayPeriodValues$M = {
  narrow: {
    am: 'மு.ப',
    pm: 'பி.ப',
    midnight: 'நள்.',
    noon: 'நண்.',
    morning: 'கா.',
    afternoon: 'மதி.',
    evening: 'மா.',
    night: 'இர.'
  },
  abbreviated: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  },
  wide: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  } // CLDR #1780 - #1845

};
var formattingDayPeriodValues$C = {
  narrow: {
    am: 'மு.ப',
    pm: 'பி.ப',
    midnight: 'நள்.',
    noon: 'நண்.',
    morning: 'கா.',
    afternoon: 'மதி.',
    evening: 'மா.',
    night: 'இர.'
  },
  abbreviated: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  },
  wide: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  }
};

function ordinalNumber$N(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'
  // var rem100 = number % 100
  // if (rem100 > 20 || rem100 < 10) {
  //   switch (rem100 % 10) {
  //     case 1:
  //       return number + 'st'
  //     case 2:
  //       return number + 'nd'
  //     case 3:
  //       return number + 'rd'
  //   }
  // }
  // return number + 'th'

  return number;
}

var localize$N = {
  ordinalNumber: ordinalNumber$N,
  era: buildLocalizeFn({
    values: eraValues$N,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$N,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$N,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$N,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$M,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$C,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$N = /^(\d+)(வது)?/i;
var parseOrdinalNumberPattern$N = /\d+/i;
var matchEraPatterns$N = {
  narrow: /^(கி.மு.|கி.பி.)/i,
  abbreviated: /^(கி\.?\s?மு\.?|கி\.?\s?பி\.?)/,
  wide: /^(கிறிஸ்துவுக்கு\sமுன்|அன்னோ\sடோமினி)/i
};
var parseEraPatterns$N = {
  any: [/கி\.?\s?மு\.?/, /கி\.?\s?பி\.?/]
};
var matchQuarterPatterns$N = {
  narrow: /^[1234]/i,
  abbreviated: /^காலா.[1234]/i,
  wide: /^(ஒன்றாம்|இரண்டாம்|மூன்றாம்|நான்காம்) காலாண்டு/i
};
var parseQuarterPatterns$N = {
  narrow: [/1/i, /2/i, /3/i, /4/i],
  any: [/(1|காலா.1|ஒன்றாம்)/i, /(2|காலா.2|இரண்டாம்)/i, /(3|காலா.3|மூன்றாம்)/i, /(4|காலா.4|நான்காம்)/i]
};
var matchMonthPatterns$N = {
  narrow: /^(ஜ|பி|மா|ஏ|மே|ஜூ|ஆ|செ|அ|ந|டி)$/i,
  abbreviated: /^(ஜன.|பிப்.|மார்.|ஏப்.|மே|ஜூன்|ஜூலை|ஆக.|செப்.|அக்.|நவ.|டிச.)/i,
  wide: /^(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)/i
};
var parseMonthPatterns$N = {
  narrow: [/^ஜ$/i, /^பி/i, /^மா/i, /^ஏ/i, /^மே/i, /^ஜூ/i, /^ஜூ/i, /^ஆ/i, /^செ/i, /^அ/i, /^ந/i, /^டி/i],
  any: [/^ஜன/i, /^பி/i, /^மா/i, /^ஏ/i, /^மே/i, /^ஜூன்/i, /^ஜூலை/i, /^ஆ/i, /^செ/i, /^அ/i, /^ந/i, /^டி/i]
};
var matchDayPatterns$N = {
  narrow: /^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
  short: /^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
  abbreviated: /^(ஞாயி.|திங்.|செவ்.|புத.|வியா.|வெள்.|சனி)/i,
  wide: /^(ஞாயிறு|திங்கள்|செவ்வாய்|புதன்|வியாழன்|வெள்ளி|சனி)/i
};
var parseDayPatterns$N = {
  narrow: [/^ஞா/i, /^தி/i, /^செ/i, /^பு/i, /^வி/i, /^வெ/i, /^ச/i],
  any: [/^ஞா/i, /^தி/i, /^செ/i, /^பு/i, /^வி/i, /^வெ/i, /^ச/i]
};
var matchDayPeriodPatterns$N = {
  narrow: /^(மு.ப|பி.ப|நள்|நண்|காலை|மதியம்|மாலை|இரவு)/i,
  any: /^(மு.ப|பி.ப|முற்பகல்|பிற்பகல்|நள்ளிரவு|நண்பகல்|காலை|மதியம்|மாலை|இரவு)/i
};
var parseDayPeriodPatterns$N = {
  any: {
    am: /^மு/i,
    pm: /^பி/i,
    midnight: /^நள்/i,
    noon: /^நண்/i,
    morning: /காலை/i,
    afternoon: /மதியம்/i,
    evening: /மாலை/i,
    night: /இரவு/i
  }
};
var match$N = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$N,
    parsePattern: parseOrdinalNumberPattern$N,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$N,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$N,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$N,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$N,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$N,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$N,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$N,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$N,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$N,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$N,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Tamil locale (India).
 * @language Tamil
 * @iso-639-2 tam
 * @author Sibiraj [@sibiraj-s]{@link https://github.com/sibiraj-s}
 */

var locale$R = {
  code: 'ta',
  formatDistance: formatDistance$O,
  formatLong: formatLong$R,
  formatRelative: formatRelative$N,
  localize: localize$N,
  match: match$N,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

// Source: https://www.unicode.org/cldr/charts/32/summary/te.html
var formatDistanceLocale$N = {
  lessThanXSeconds: {
    standalone: {
      one: 'సెకను కన్నా తక్కువ',
      other: '{{count}} సెకన్ల కన్నా తక్కువ'
    },
    withPreposition: {
      one: 'సెకను',
      other: '{{count}} సెకన్ల'
    }
  },
  xSeconds: {
    standalone: {
      one: 'ఒక సెకను',
      // CLDR #1314
      other: '{{count}} సెకన్ల'
    },
    withPreposition: {
      one: 'ఒక సెకను',
      other: '{{count}} సెకన్ల'
    }
  },
  halfAMinute: {
    standalone: 'అర నిమిషం',
    withPreposition: 'అర నిమిషం'
  },
  lessThanXMinutes: {
    standalone: {
      one: 'ఒక నిమిషం కన్నా తక్కువ',
      other: '{{count}} నిమిషాల కన్నా తక్కువ'
    },
    withPreposition: {
      one: 'ఒక నిమిషం',
      other: '{{count}} నిమిషాల'
    }
  },
  xMinutes: {
    standalone: {
      one: 'ఒక నిమిషం',
      // CLDR #1311
      other: '{{count}} నిమిషాలు'
    },
    withPreposition: {
      one: 'ఒక నిమిషం',
      // CLDR #1311
      other: '{{count}} నిమిషాల'
    }
  },
  aboutXHours: {
    standalone: {
      one: 'సుమారు ఒక గంట',
      other: 'సుమారు {{count}} గంటలు'
    },
    withPreposition: {
      one: 'సుమారు ఒక గంట',
      other: 'సుమారు {{count}} గంటల'
    }
  },
  xHours: {
    standalone: {
      one: 'ఒక గంట',
      // CLDR #1308
      other: '{{count}} గంటలు'
    },
    withPreposition: {
      one: 'ఒక గంట',
      other: '{{count}} గంటల'
    }
  },
  xDays: {
    standalone: {
      one: 'ఒక రోజు',
      // CLDR #1292
      other: '{{count}} రోజులు'
    },
    withPreposition: {
      one: 'ఒక రోజు',
      other: '{{count}} రోజుల'
    }
  },
  aboutXMonths: {
    standalone: {
      one: 'సుమారు ఒక నెల',
      other: 'సుమారు {{count}} నెలలు'
    },
    withPreposition: {
      one: 'సుమారు ఒక నెల',
      other: 'సుమారు {{count}} నెలల'
    }
  },
  xMonths: {
    standalone: {
      one: 'ఒక నెల',
      // CLDR #1281
      other: '{{count}} నెలలు'
    },
    withPreposition: {
      one: 'ఒక నెల',
      other: '{{count}} నెలల'
    }
  },
  aboutXYears: {
    standalone: {
      one: 'సుమారు ఒక సంవత్సరం',
      other: 'సుమారు {{count}} సంవత్సరాలు'
    },
    withPreposition: {
      one: 'సుమారు ఒక సంవత్సరం',
      other: 'సుమారు {{count}} సంవత్సరాల'
    }
  },
  xYears: {
    standalone: {
      one: 'ఒక సంవత్సరం',
      // CLDR #1275
      other: '{{count}} సంవత్సరాలు'
    },
    withPreposition: {
      one: 'ఒక సంవత్సరం',
      other: '{{count}} సంవత్సరాల'
    }
  },
  overXYears: {
    standalone: {
      one: 'ఒక సంవత్సరం పైగా',
      other: '{{count}} సంవత్సరాలకు పైగా'
    },
    withPreposition: {
      one: 'ఒక సంవత్సరం',
      other: '{{count}} సంవత్సరాల'
    }
  },
  almostXYears: {
    standalone: {
      one: 'దాదాపు ఒక సంవత్సరం',
      other: 'దాదాపు {{count}} సంవత్సరాలు'
    },
    withPreposition: {
      one: 'దాదాపు ఒక సంవత్సరం',
      other: 'దాదాపు {{count}} సంవత్సరాల'
    }
  }
};
function formatDistance$P(token, count, options) {
  options = options || {};
  var usageGroup = options.addSuffix ? formatDistanceLocale$N[token].withPreposition : formatDistanceLocale$N[token].standalone;
  var result;

  if (typeof usageGroup === 'string') {
    result = usageGroup;
  } else if (count === 1) {
    result = usageGroup.one;
  } else {
    result = usageGroup.other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + 'లో';
    } else {
      return result + ' క్రితం';
    }
  }

  return result;
}

// CLDR #1807 - #1811

var dateFormats$S = {
  full: 'd, MMMM y, EEEE',
  long: 'd MMMM, y',
  medium: 'd MMM, y',
  short: 'dd-MM-yy' // CLDR #1807 - #1811

};
var timeFormats$S = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a' // CLDR #1815 - #1818

};
var dateTimeFormats$S = {
  full: "{{date}} {{time}}'కి'",
  long: "{{date}} {{time}}'కి'",
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$S = {
  date: buildFormatLongFn({
    formats: dateFormats$S,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$S,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$S,
    defaultWidth: 'full'
  })
};

// Source: https://www.unicode.org/cldr/charts/32/summary/te.html
var formatRelativeLocale$O = {
  lastWeek: "'గత' eeee p",
  // CLDR #1384
  yesterday: "'నిన్న' p",
  // CLDR #1393
  today: "'ఈ రోజు' p",
  // CLDR #1394
  tomorrow: "'రేపు' p",
  // CLDR #1395
  nextWeek: "'తదుపరి' eeee p",
  // CLDR #1386
  other: 'P'
};
function formatRelative$O(token, _date, _baseDate, _options) {
  return formatRelativeLocale$O[token];
}

// Source: https://dsal.uchicago.edu/dictionaries/brown/
// CLDR #1605 - #1608

var eraValues$O = {
  narrow: ['క్రీ.పూ.', 'క్రీ.శ.'],
  abbreviated: ['క్రీ.పూ.', 'క్రీ.శ.'],
  wide: ['క్రీస్తు పూర్వం', 'క్రీస్తుశకం'] // CLDR #1613 - #1628

};
var quarterValues$O = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['త్రై1', 'త్రై2', 'త్రై3', 'త్రై4'],
  wide: ['1వ త్రైమాసికం', '2వ త్రైమాసికం', '3వ త్రైమాసికం', '4వ త్రైమాసికం'] // CLDR #1637 - #1708

};
var monthValues$O = {
  narrow: ['జ', 'ఫి', 'మా', 'ఏ', 'మే', 'జూ', 'జు', 'ఆ', 'సె', 'అ', 'న', 'డి'],
  abbreviated: ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జులై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం'],
  wide: ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జులై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'] // CLDR #1709 - #1764

};
var dayValues$O = {
  narrow: ['ఆ', 'సో', 'మ', 'బు', 'గు', 'శు', 'శ'],
  short: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
  abbreviated: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
  wide: ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'] // CLDR #1767 - #1806

};
var dayPeriodValues$N = {
  narrow: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  },
  abbreviated: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  },
  wide: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  }
};
var formattingDayPeriodValues$D = {
  narrow: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  },
  abbreviated: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  },
  wide: {
    am: 'పూర్వాహ్నం',
    pm: 'అపరాహ్నం',
    midnight: 'అర్ధరాత్రి',
    noon: 'మిట్టమధ్యాహ్నం',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    evening: 'సాయంత్రం',
    night: 'రాత్రి'
  }
};

function ordinalNumber$O(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + 'వ';
}

var localize$O = {
  ordinalNumber: ordinalNumber$O,
  era: buildLocalizeFn({
    values: eraValues$O,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$O,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$O,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$O,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$N,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$D,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$O = /^(\d+)(వ)?/i;
var parseOrdinalNumberPattern$O = /\d+/i;
var matchEraPatterns$O = {
  narrow: /^(క్రీ\.పూ\.|క్రీ\.శ\.)/i,
  abbreviated: /^(క్రీ\.?\s?పూ\.?|ప్ర\.?\s?శ\.?\s?పూ\.?|క్రీ\.?\s?శ\.?|సా\.?\s?శ\.?)/i,
  wide: /^(క్రీస్తు పూర్వం|ప్రస్తుత శకానికి పూర్వం|క్రీస్తు శకం|ప్రస్తుత శకం)/i
};
var parseEraPatterns$O = {
  any: [/^(పూ|శ)/i, /^సా/i]
};
var matchQuarterPatterns$O = {
  narrow: /^[1234]/i,
  abbreviated: /^త్రై[1234]/i,
  wide: /^[1234](వ)? త్రైమాసికం/i
};
var parseQuarterPatterns$O = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$O = {
  narrow: /^(జూ|జు|జ|ఫి|మా|ఏ|మే|ఆ|సె|అ|న|డి)/i,
  abbreviated: /^(జన|ఫిబ్ర|మార్చి|ఏప్రి|మే|జూన్|జులై|ఆగ|సెప్|అక్టో|నవ|డిసె)/i,
  wide: /^(జనవరి|ఫిబ్రవరి|మార్చి|ఏప్రిల్|మే|జూన్|జులై|ఆగస్టు|సెప్టెంబర్|అక్టోబర్|నవంబర్|డిసెంబర్)/i
};
var parseMonthPatterns$O = {
  narrow: [/^జ/i, /^ఫి/i, /^మా/i, /^ఏ/i, /^మే/i, /^జూ/i, /^జు/i, /^ఆ/i, /^సె/i, /^అ/i, /^న/i, /^డి/i],
  any: [/^జన/i, /^ఫి/i, /^మా/i, /^ఏ/i, /^మే/i, /^జూన్/i, /^జులై/i, /^ఆగ/i, /^సె/i, /^అ/i, /^న/i, /^డి/i]
};
var matchDayPatterns$O = {
  narrow: /^(ఆ|సో|మ|బు|గు|శు|శ)/i,
  short: /^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
  abbreviated: /^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
  wide: /^(ఆదివారం|సోమవారం|మంగళవారం|బుధవారం|గురువారం|శుక్రవారం|శనివారం)/i
};
var parseDayPatterns$O = {
  narrow: [/^ఆ/i, /^సో/i, /^మ/i, /^బు/i, /^గు/i, /^శు/i, /^శ/i],
  any: [/^ఆది/i, /^సోమ/i, /^మం/i, /^బుధ/i, /^గురు/i, /^శుక్ర/i, /^శని/i]
};
var matchDayPeriodPatterns$O = {
  narrow: /^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i,
  any: /^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i
};
var parseDayPeriodPatterns$O = {
  any: {
    am: /^పూర్వాహ్నం/i,
    pm: /^అపరాహ్నం/i,
    midnight: /^అర్ధ/i,
    noon: /^మిట్ట/i,
    morning: /ఉదయం/i,
    afternoon: /మధ్యాహ్నం/i,
    evening: /సాయంత్రం/i,
    night: /రాత్రి/i
  }
};
var match$O = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$O,
    parsePattern: parseOrdinalNumberPattern$O,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$O,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$O,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$O,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$O,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$O,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$O,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$O,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$O,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$O,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$O,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Telugu locale
 * @language Telugu
 * @iso-639-2 tel
 * @author Kranthi Lakum [@kranthilakum]{@link https://github.com/kranthilakum}
 */

var locale$S = {
  code: 'te',
  formatDistance: formatDistance$P,
  formatLong: formatLong$S,
  formatRelative: formatRelative$O,
  localize: localize$O,
  match: match$O,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$O = {
  lessThanXSeconds: {
    one: 'น้อยกว่า 1 วินาที',
    other: 'น้อยกว่า {{count}} วินาที'
  },
  xSeconds: {
    one: '1 วินาที',
    other: '{{count}} วินาที'
  },
  halfAMinute: 'ครึ่งนาที',
  lessThanXMinutes: {
    one: 'น้อยกว่า 1 นาที',
    other: 'น้อยกว่า {{count}} นาที'
  },
  xMinutes: {
    one: '1 นาที',
    other: '{{count}} นาที'
  },
  aboutXHours: {
    one: 'ประมาณ 1 ชั่วโมง',
    other: 'ประมาณ {{count}} ชั่วโมง'
  },
  xHours: {
    one: '1 ชั่วโมง',
    other: '{{count}} ชั่วโมง'
  },
  xDays: {
    one: '1 วัน',
    other: '{{count}} วัน'
  },
  aboutXMonths: {
    one: 'ประมาณ 1 เดือน',
    other: 'ประมาณ {{count}} เดือน'
  },
  xMonths: {
    one: '1 เดือน',
    other: '{{count}} เดือน'
  },
  aboutXYears: {
    one: 'ประมาณ 1 ปี',
    other: 'ประมาณ {{count}} ปี'
  },
  xYears: {
    one: '1 ปี',
    other: '{{count}} ปี'
  },
  overXYears: {
    one: 'มากกว่า 1 ปี',
    other: 'มากกว่า {{count}} ปี'
  },
  almostXYears: {
    one: 'เกือบ 1 ปี',
    other: 'เกือบ {{count}} ปี'
  }
};
function formatDistance$Q(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$O[token] === 'string') {
    result = formatDistanceLocale$O[token];
  } else if (count === 1) {
    result = formatDistanceLocale$O[token].one;
  } else {
    result = formatDistanceLocale$O[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      if (token === 'halfAMinute') {
        return 'ใน' + result;
      } else {
        return 'ใน ' + result;
      }
    } else {
      return result + 'ที่ผ่านมา';
    }
  }

  return result;
}

var dateFormats$T = {
  full: 'วันEEEEที่ do MMMM y',
  long: 'do MMMM y',
  medium: 'd MMM y',
  short: 'dd/MM/yyyy'
};
var timeFormats$T = {
  full: 'H:mm:ss น. zzzz',
  long: 'H:mm:ss น. z',
  medium: 'H:mm:ss น.',
  short: 'H:mm น.'
};
var dateTimeFormats$T = {
  full: "{{date}} 'เวลา' {{time}}",
  long: "{{date}} 'เวลา' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$T = {
  date: buildFormatLongFn({
    formats: dateFormats$T,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$T,
    defaultWidth: 'medium'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$T,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$P = {
  lastWeek: "eeee'ที่แล้วเวลา' p",
  yesterday: "'เมื่อวานนี้เวลา' p",
  today: "'วันนี้เวลา' p",
  tomorrow: "'พรุ่งนี้เวลา' p",
  nextWeek: "eeee 'เวลา' p",
  other: 'P'
};
function formatRelative$P(token, _date, _baseDate, _options) {
  return formatRelativeLocale$P[token];
}

var eraValues$P = {
  narrow: ['B', 'คศ'],
  abbreviated: ['BC', 'ค.ศ.'],
  wide: ['ปีก่อนคริสตกาล', 'คริสต์ศักราช']
};
var quarterValues$P = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['ไตรมาสแรก', 'ไตรมาสที่สอง', 'ไตรมาสที่สาม', 'ไตรมาสที่สี่']
};
var dayValues$P = {
  narrow: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  short: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  abbreviated: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'],
  wide: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
};
var monthValues$P = {
  narrow: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  abbreviated: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  wide: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
};
var dayPeriodValues$O = {
  narrow: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'เช้า',
    afternoon: 'บ่าย',
    evening: 'เย็น',
    night: 'กลางคืน'
  },
  abbreviated: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'เช้า',
    afternoon: 'บ่าย',
    evening: 'เย็น',
    night: 'กลางคืน'
  },
  wide: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'เช้า',
    afternoon: 'บ่าย',
    evening: 'เย็น',
    night: 'กลางคืน'
  }
};
var formattingDayPeriodValues$E = {
  narrow: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'ตอนเช้า',
    afternoon: 'ตอนกลางวัน',
    evening: 'ตอนเย็น',
    night: 'ตอนกลางคืน'
  },
  abbreviated: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'ตอนเช้า',
    afternoon: 'ตอนกลางวัน',
    evening: 'ตอนเย็น',
    night: 'ตอนกลางคืน'
  },
  wide: {
    am: 'ก่อนเที่ยง',
    pm: 'หลังเที่ยง',
    midnight: 'เที่ยงคืน',
    noon: 'เที่ยง',
    morning: 'ตอนเช้า',
    afternoon: 'ตอนกลางวัน',
    evening: 'ตอนเย็น',
    night: 'ตอนกลางคืน'
  }
};

function ordinalNumber$P(dirtyNumber) {
  var number = Number(dirtyNumber);
  return number;
}

var localize$P = {
  ordinalNumber: ordinalNumber$P,
  era: buildLocalizeFn({
    values: eraValues$P,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$P,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$P,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$P,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$O,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$E,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$P = /^\d+/i;
var parseOrdinalNumberPattern$P = /\d+/i;
var matchEraPatterns$P = {
  narrow: /^([bB]|[aA]|คศ)/i,
  abbreviated: /^([bB]\.?\s?[cC]\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?|ค\.?ศ\.?)/i,
  wide: /^(ก่อนคริสตกาล|คริสต์ศักราช|คริสตกาล)/i
};
var parseEraPatterns$P = {
  any: [/^[bB]/i, /^(^[aA]|ค\.?ศ\.?|คริสตกาล|คริสต์ศักราช|)/i]
};
var matchQuarterPatterns$P = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^ไตรมาส(ที่)? ?[1234]/i
};
var parseQuarterPatterns$P = {
  any: [/(1|แรก|หนึ่ง)/i, /(2|สอง)/i, /(3|สาม)/i, /(4|สี่)/i]
};
var matchMonthPatterns$P = {
  narrow: /^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)/i,
  abbreviated: /^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?')/i,
  wide: /^(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)/i
};
var parseMonthPatterns$P = {
  wide: [/^มก/i, /^กุม/i, /^มี/i, /^เม/i, /^พฤษ/i, /^มิ/i, /^กรก/i, /^ส/i, /^กัน/i, /^ต/i, /^พฤศ/i, /^ธ/i],
  any: [/^ม\.?ค\.?/i, /^ก\.?พ\.?/i, /^มี\.?ค\.?/i, /^เม\.?ย\.?/i, /^พ\.?ค\.?/i, /^มิ\.?ย\.?/i, /^ก\.?ค\.?/i, /^ส\.?ค\.?/i, /^ก\.?ย\.?/i, /^ต\.?ค\.?/i, /^พ\.?ย\.?/i, /^ธ\.?ค\.?/i]
};
var matchDayPatterns$P = {
  narrow: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
  short: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
  abbreviated: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
  wide: /^(อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์)/i
};
var parseDayPatterns$P = {
  wide: [/^อา/i, /^จั/i, /^อั/i, /^พุธ/i, /^พฤ/i, /^ศ/i, /^เส/i],
  any: [/^อา/i, /^จ/i, /^อ/i, /^พ(?!ฤ)/i, /^พฤ/i, /^ศ/i, /^ส/i]
};
var matchDayPeriodPatterns$P = {
  any: /^(ก่อนเที่ยง|หลังเที่ยง|เที่ยงคืน|เที่ยง|(ตอน.*?)?.*(เที่ยง|เช้า|บ่าย|เย็น|กลางคืน))/i
};
var parseDayPeriodPatterns$P = {
  any: {
    am: /^ก่อนเที่ยง/i,
    pm: /^หลังเที่ยง/i,
    midnight: /^เที่ยงคืน/i,
    noon: /^เที่ยง/i,
    morning: /เช้า/i,
    afternoon: /บ่าย/i,
    evening: /เย็น/i,
    night: /กลางคืน/i
  }
};
var match$P = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$P,
    parsePattern: parseOrdinalNumberPattern$P,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$P,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$P,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$P,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$P,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$P,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$P,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$P,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$P,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$P,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$P,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Thai locale.
 * @language Thai
 * @iso-639-2 tha
 * @author Athiwat Hirunworawongkun [@athivvat]{@link https://github.com/athivvat}
 * @author [@hawkup]{@link https://github.com/hawkup}
 * @author  Jirawat I. [@nodtem66]{@link https://github.com/nodtem66}
 */

var locale$T = {
  code: 'th',
  formatDistance: formatDistance$Q,
  formatLong: formatLong$T,
  formatRelative: formatRelative$P,
  localize: localize$P,
  match: match$P,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$P = {
  lessThanXSeconds: {
    one: 'bir saniyeden az',
    other: '{{count}} saniyeden az'
  },
  xSeconds: {
    one: '1 saniye',
    other: '{{count}} saniye'
  },
  halfAMinute: 'yarım dakika',
  lessThanXMinutes: {
    one: 'bir dakikadan az',
    other: '{{count}} dakikadan az'
  },
  xMinutes: {
    one: '1 dakika',
    other: '{{count}} dakika'
  },
  aboutXHours: {
    one: 'yaklaşık 1 saat',
    other: 'yaklaşık {{count}} saat'
  },
  xHours: {
    one: '1 saat',
    other: '{{count}} saat'
  },
  xDays: {
    one: '1 gün',
    other: '{{count}} gün'
  },
  aboutXMonths: {
    one: 'yaklaşık 1 ay',
    other: 'yaklaşık {{count}} ay'
  },
  xMonths: {
    one: '1 ay',
    other: '{{count}} ay'
  },
  aboutXYears: {
    one: 'yaklaşık 1 yıl',
    other: 'yaklaşık {{count}} yıl'
  },
  xYears: {
    one: '1 yıl',
    other: '{{count}} yıl'
  },
  overXYears: {
    one: '1 yıldan fazla',
    other: '{{count}} yıldan fazla'
  },
  almostXYears: {
    one: 'neredeyse 1 yıl',
    other: 'neredeyse {{count}} yıl'
  }
};
function formatDistance$R(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$P[token] === 'string') {
    result = formatDistanceLocale$P[token];
  } else if (count === 1) {
    result = formatDistanceLocale$P[token].one;
  } else {
    result = formatDistanceLocale$P[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' sonra';
    } else {
      return result + ' önce';
    }
  }

  return result;
}

var dateFormats$U = {
  full: 'd MMMM y EEEE',
  long: 'd MMMM y',
  medium: 'd MMM y',
  short: 'dd.MM.yyyy'
};
var timeFormats$U = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$U = {
  full: "{{date}} 'saat' {{time}}",
  long: "{{date}} 'saat' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$U = {
  date: buildFormatLongFn({
    formats: dateFormats$U,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$U,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$U,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$Q = {
  lastWeek: "'geçen hafta' eeee 'saat' p",
  yesterday: "'dün saat' p",
  today: "'bugün saat' p",
  tomorrow: "'yarın saat' p",
  nextWeek: "eeee 'saat' p",
  other: 'P'
};
function formatRelative$Q(token, _date, _baseDate, _options) {
  return formatRelativeLocale$Q[token];
}

var eraValues$Q = {
  abbreviated: ['MÖ', 'MS'],
  narrow: ['MÖ', 'MS'],
  wide: ['Milattan Önce', 'Milattan Sonra']
};
var quarterValues$Q = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1Ç', '2Ç', '3Ç', '4Ç'],
  wide: ['İlk çeyrek', 'İkinci Çeyrek', 'Üçüncü çeyrek', 'Son çeyrek']
};
var monthValues$Q = {
  narrow: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'],
  abbreviated: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  wide: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
};
var dayValues$Q = {
  narrow: ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'],
  short: ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'],
  abbreviated: ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'],
  wide: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
};
var dayPeriodValues$P = {
  narrow: {
    am: 'öö',
    pm: 'ös',
    midnight: 'gy',
    noon: 'ö',
    morning: 'sa',
    afternoon: 'ös',
    evening: 'ak',
    night: 'ge'
  },
  abbreviated: {
    am: 'ÖÖ',
    pm: 'ÖS',
    midnight: 'gece yarısı',
    noon: 'öğle',
    morning: 'sabah',
    afternoon: 'öğleden sonra',
    evening: 'akşam',
    night: 'gece'
  },
  wide: {
    am: 'Ö.Ö.',
    pm: 'Ö.S.',
    midnight: 'gece yarısı',
    noon: 'öğle',
    morning: 'sabah',
    afternoon: 'öğleden sonra',
    evening: 'akşam',
    night: 'gece'
  }
};
var formattingDayPeriodValues$F = {
  narrow: {
    am: 'öö',
    pm: 'ös',
    midnight: 'gy',
    noon: 'ö',
    morning: 'sa',
    afternoon: 'ös',
    evening: 'ak',
    night: 'ge'
  },
  abbreviated: {
    am: 'ÖÖ',
    pm: 'ÖS',
    midnight: 'gece yarısı',
    noon: 'öğlen',
    morning: 'sabahleyin',
    afternoon: 'öğleden sonra',
    evening: 'akşamleyin',
    night: 'geceleyin'
  },
  wide: {
    am: 'ö.ö.',
    pm: 'ö.s.',
    midnight: 'gece yarısı',
    noon: 'öğlen',
    morning: 'sabahleyin',
    afternoon: 'öğleden sonra',
    evening: 'akşamleyin',
    night: 'geceleyin'
  }
};

function ordinalNumber$Q(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber);
  return number + '.';
}

var localize$Q = {
  ordinalNumber: ordinalNumber$Q,
  era: buildLocalizeFn({
    values: eraValues$Q,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$Q,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$Q,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$Q,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$P,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$F,
    defaulFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$Q = /^(\d+)(\.)?/i;
var parseOrdinalNumberPattern$Q = /\d+/i;
var matchEraPatterns$Q = {
  narrow: /^(mö|ms)/i,
  abbreviated: /^(mö|ms)/i,
  wide: /^(milattan önce|milattan sonra)/i
};
var parseEraPatterns$Q = {
  any: [/(^mö|^milattan önce)/i, /(^ms|^milattan sonra)/i]
};
var matchQuarterPatterns$Q = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234]ç/i,
  wide: /^((i|İ)lk|(i|İ)kinci|üçüncü|son) çeyrek/i
};
var parseQuarterPatterns$Q = {
  any: [/1/i, /2/i, /3/i, /4/i],
  abbreviated: [/1ç/i, /2ç/i, /3ç/i, /4ç/i],
  wide: [/^(i|İ)lk çeyrek/i, /(i|İ)kinci çeyrek/i, /üçüncü çeyrek/i, /son çeyrek/i]
};
var matchMonthPatterns$Q = {
  narrow: /^[oşmnhtaek]/i,
  abbreviated: /^(oca|şub|mar|nis|may|haz|tem|ağu|eyl|eki|kas|ara)/i,
  wide: /^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i
};
var parseMonthPatterns$Q = {
  narrow: [/^o/i, /^ş/i, /^m/i, /^n/i, /^m/i, /^h/i, /^t/i, /^a/i, /^e/i, /^e/i, /^k/i, /^a/i],
  any: [/^o/i, /^ş/i, /^mar/i, /^n/i, /^may/i, /^h/i, /^t/i, /^ağ/i, /^ey/i, /^ek/i, /^k/i, /^ar/i]
};
var matchDayPatterns$Q = {
  narrow: /^[psçc]/i,
  short: /^(pz|pt|sa|ça|pe|cu|ct)/i,
  abbreviated: /^(paz|pts|sal|çar|per|cum|cts)/i,
  wide: /^(pazar|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi)/i
};
var parseDayPatterns$Q = {
  narrow: [/^p/i, /^p/i, /^s/i, /^ç/i, /^p/i, /^c/i, /^c/i],
  any: [/^pz/i, /^pt/i, /^sa/i, /^ça/i, /^pe/i, /^cu/i, /^ct/i],
  wide: [/^pazar/i, /^pazartesi/i, /^salı/i, /^çarşamba/i, /^perşembe/i, /^cuma/i, /cumartesi/i]
};
var matchDayPeriodPatterns$Q = {
  narrow: /^(öö|ös|gy|ö|sa|ös|ak|ge)/i,
  any: /^(ö\.?\s?[ös]\.?|öğleden sonra|gece yarısı|öğle|(sabah|öğ|akşam|gece)(leyin))/i
};
var parseDayPeriodPatterns$Q = {
  any: {
    am: /^ö\.?ö\.?/i,
    pm: /^ö\.?s\.?/i,
    midnight: /^(gy|gece yarısı)/i,
    noon: /^öğ/i,
    morning: /^sa/i,
    afternoon: /^öğleden sonra/i,
    evening: /^ak/i,
    night: /^ge/i
  }
};
var match$Q = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$Q,
    parsePattern: parseOrdinalNumberPattern$Q,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$Q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$Q,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$Q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$Q,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$Q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$Q,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$Q,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$Q,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$Q,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$Q,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Turkish locale.
 * @language Turkish
 * @iso-639-2 tur
 * @author Alpcan Aydın [@alpcanaydin]{@link https://github.com/alpcanaydin}
 * @author Berkay Sargın [@berkaey]{@link https://github.com/berkaey}
 * @author Ismail Demirbilek [@dbtek]{@link https://github.com/dbtek}
 * @author İsmail Kayar [@ikayar]{@link https://github.com/ikayar}
 *
 *
 */

var locale$U = {
  code: 'tr',
  formatDistance: formatDistance$R,
  formatLong: formatLong$U,
  formatRelative: formatRelative$Q,
  localize: localize$Q,
  match: match$Q,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$Q = {
  lessThanXSeconds: {
    one: 'بىر سىكۇنت ئىچىدە',
    other: 'سىكۇنت ئىچىدە {{count}}'
  },
  xSeconds: {
    one: 'بىر سىكۇنت',
    other: 'سىكۇنت {{count}}'
  },
  halfAMinute: 'يىرىم مىنۇت',
  lessThanXMinutes: {
    one: 'بىر مىنۇت ئىچىدە',
    other: 'مىنۇت ئىچىدە {{count}}'
  },
  xMinutes: {
    one: 'بىر مىنۇت',
    other: 'مىنۇت {{count}}'
  },
  aboutXHours: {
    one: 'تەخمىنەن بىر سائەت',
    other: 'سائەت {{count}} تەخمىنەن'
  },
  xHours: {
    one: 'بىر سائەت',
    other: 'سائەت {{count}}'
  },
  xDays: {
    one: 'بىر كۈن',
    other: 'كۈن {{count}}'
  },
  aboutXMonths: {
    one: 'تەخمىنەن بىر ئاي',
    other: 'ئاي {{count}} تەخمىنەن'
  },
  xMonths: {
    one: 'بىر ئاي',
    other: 'ئاي {{count}}'
  },
  aboutXYears: {
    one: 'تەخمىنەن بىر يىل',
    other: 'يىل {{count}} تەخمىنەن'
  },
  xYears: {
    one: 'بىر يىل',
    other: 'يىل {{count}}'
  },
  overXYears: {
    one: 'بىر يىلدىن ئارتۇق',
    other: 'يىلدىن ئارتۇق {{count}}'
  },
  almostXYears: {
    one: 'ئاساسەن بىر يىل',
    other: 'يىل {{count}} ئاساسەن'
  }
};
function formatDistance$S(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$Q[token] === 'string') {
    result = formatDistanceLocale$Q[token];
  } else if (count === 1) {
    result = formatDistanceLocale$Q[token].one;
  } else {
    result = formatDistanceLocale$Q[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result;
    } else {
      return result + ' بولدى';
    }
  }

  return result;
}

var dateFormats$V = {
  full: 'EEEE, MMMM do, y',
  long: 'MMMM do, y',
  medium: 'MMM d, y',
  short: 'MM/dd/yyyy'
};
var timeFormats$V = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a'
};
var dateTimeFormats$V = {
  full: "{{date}} 'دە' {{time}}",
  long: "{{date}} 'دە' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$V = {
  date: buildFormatLongFn({
    formats: dateFormats$V,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$V,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$V,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$R = {
  lastWeek: "'ئ‍ۆتكەن' eeee 'دە' p",
  yesterday: "'تۈنۈگۈن دە' p",
  today: "'بۈگۈن دە' p",
  tomorrow: "'ئەتە دە' p",
  nextWeek: "eeee 'دە' p",
  other: 'P'
};
function formatRelative$R(token, _date, _baseDate, _options) {
  return formatRelativeLocale$R[token];
}

var eraValues$R = {
  narrow: ['ب', 'ك'],
  abbreviated: ['ب', 'ك'],
  wide: ['مىيلادىدىن بۇرۇن', 'مىيلادىدىن كىيىن']
};
var quarterValues$R = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1', '2', '3', '4'],
  wide: ['بىرىنجى چارەك', 'ئىككىنجى چارەك', 'ئۈچىنجى چارەك', 'تۆتىنجى چارەك'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$R = {
  narrow: ['ي', 'ف', 'م', 'ا', 'م', 'ى', 'ى', 'ا', 'س', 'ۆ', 'ن', 'د'],
  abbreviated: ['يانۋار', 'فېۋىرال', 'مارت', 'ئاپرىل', 'ماي', 'ئىيۇن', 'ئىيول', 'ئاۋغۇست', 'سىنتەبىر', 'ئۆكتەبىر', 'نويابىر', 'دىكابىر'],
  wide: ['يانۋار', 'فېۋىرال', 'مارت', 'ئاپرىل', 'ماي', 'ئىيۇن', 'ئىيول', 'ئاۋغۇست', 'سىنتەبىر', 'ئۆكتەبىر', 'نويابىر', 'دىكابىر']
};
var dayValues$R = {
  narrow: ['ي', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  short: ['ي', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  abbreviated: ['يەكشەنبە', 'دۈشەنبە', 'سەيشەنبە', 'چارشەنبە', 'پەيشەنبە', 'جۈمە', 'شەنبە'],
  wide: ['يەكشەنبە', 'دۈشەنبە', 'سەيشەنبە', 'چارشەنبە', 'پەيشەنبە', 'جۈمە', 'شەنبە']
};
var dayPeriodValues$Q = {
  narrow: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەن',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشىم',
    night: 'كىچە'
  },
  abbreviated: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەن',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشىم',
    night: 'كىچە'
  },
  wide: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەن',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشىم',
    night: 'كىچە'
  }
};
var formattingDayPeriodValues$G = {
  narrow: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەندە',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشامدا',
    night: 'كىچىدە'
  },
  abbreviated: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەندە',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشامدا',
    night: 'كىچىدە'
  },
  wide: {
    am: 'ئە',
    pm: 'چ',
    midnight: 'ك',
    noon: 'چ',
    morning: 'ئەتىگەندە',
    afternoon: 'چۈشتىن كىيىن',
    evening: 'ئاخشامدا',
    night: 'كىچىدە'
  }
};

function ordinalNumber$R(dirtyNumber, _dirtyOptions) {
  return String(dirtyNumber);
}

var localize$R = {
  ordinalNumber: ordinalNumber$R,
  era: buildLocalizeFn({
    values: eraValues$R,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$R,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$R,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$R,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$Q,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$G,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$R = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern$R = /\d+/i;
var matchEraPatterns$R = {
  narrow: /^(ب|ك)/i,
  wide: /^(مىيلادىدىن بۇرۇن|مىيلادىدىن كىيىن)/i
};
var parseEraPatterns$R = {
  any: [/^بۇرۇن/i, /^كىيىن/i]
};
var matchQuarterPatterns$R = {
  narrow: /^[1234]/i,
  abbreviated: /^چ[1234]/i,
  wide: /^چارەك [1234]/i
};
var parseQuarterPatterns$R = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$R = {
  narrow: /^[يفمئامئ‍ئاسۆند]/i,
  abbreviated: /^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i,
  wide: /^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i
};
var parseMonthPatterns$R = {
  narrow: [/^ي/i, /^ف/i, /^م/i, /^ا/i, /^م/i, /^ى‍/i, /^ى‍/i, /^ا‍/i, /^س/i, /^ۆ/i, /^ن/i, /^د/i],
  any: [/^يان/i, /^فېۋ/i, /^مار/i, /^ئاپ/i, /^ماي/i, /^ئىيۇن/i, /^ئىيول/i, /^ئاۋ/i, /^سىن/i, /^ئۆك/i, /^نوي/i, /^دىك/i]
};
var matchDayPatterns$R = {
  narrow: /^[دسچپجشي]/i,
  short: /^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
  abbreviated: /^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
  wide: /^(يەكشەنبە|دۈشەنبە|سەيشەنبە|چارشەنبە|پەيشەنبە|جۈمە|شەنبە)/i
};
var parseDayPatterns$R = {
  narrow: [/^ي/i, /^د/i, /^س/i, /^چ/i, /^پ/i, /^ج/i, /^ش/i],
  any: [/^ي/i, /^د/i, /^س/i, /^چ/i, /^پ/i, /^ج/i, /^ش/i]
};
var matchDayPeriodPatterns$R = {
  narrow: /^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i,
  any: /^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i
};
var parseDayPeriodPatterns$R = {
  any: {
    am: /^ئە/i,
    pm: /^چ/i,
    midnight: /^ك/i,
    noon: /^چ/i,
    morning: /ئەتىگەن/i,
    afternoon: /چۈشتىن كىيىن/i,
    evening: /ئاخشىم/i,
    night: /كىچە/i
  }
};
var match$R = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$R,
    parsePattern: parseOrdinalNumberPattern$R,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$R,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$R,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$R,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$R,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$R,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$R,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$R,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$R,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$R,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$R,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Uighur locale
 * @language Uighur
 * @iso-639-2 uig
 * @author Abduwaly M. [@abduwaly]{@link https://github.com/abduwaly}
 */

var locale$V = {
  code: 'ug',
  formatDistance: formatDistance$S,
  formatLong: formatLong$V,
  formatRelative: formatRelative$R,
  localize: localize$R,
  match: match$R,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};

function declension$5(scheme, count) {
  // scheme for count=1 exists
  if (scheme.one !== undefined && count === 1) {
    return scheme.one;
  }

  var rem10 = count % 10;
  var rem100 = count % 100; // 1, 21, 31, ...

  if (rem10 === 1 && rem100 !== 11) {
    return scheme.singularNominative.replace('{{count}}', count); // 2, 3, 4, 22, 23, 24, 32 ...
  } else if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) {
    return scheme.singularGenitive.replace('{{count}}', count); // 5, 6, 7, 8, 9, 10, 11, ...
  } else {
    return scheme.pluralGenitive.replace('{{count}}', count);
  }
}

function buildLocalizeTokenFn$4(scheme) {
  return function (count, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        if (scheme.future) {
          return declension$5(scheme.future, count);
        } else {
          return 'за ' + declension$5(scheme.regular, count);
        }
      } else {
        if (scheme.past) {
          return declension$5(scheme.past, count);
        } else {
          return declension$5(scheme.regular, count) + ' тому';
        }
      }
    } else {
      return declension$5(scheme.regular, count);
    }
  };
}

var formatDistanceLocale$R = {
  lessThanXSeconds: buildLocalizeTokenFn$4({
    regular: {
      one: 'менше секунди',
      singularNominative: 'менше {{count}} секунди',
      singularGenitive: 'менше {{count}} секунд',
      pluralGenitive: 'менше {{count}} секунд'
    },
    future: {
      one: 'менше, ніж за секунду',
      singularNominative: 'менше, ніж за {{count}} секунду',
      singularGenitive: 'менше, ніж за {{count}} секунди',
      pluralGenitive: 'менше, ніж за {{count}} секунд'
    }
  }),
  xSeconds: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} секунда',
      singularGenitive: '{{count}} секунди',
      pluralGenitive: '{{count}} секунд'
    },
    past: {
      singularNominative: '{{count}} секунду тому',
      singularGenitive: '{{count}} секунди тому',
      pluralGenitive: '{{count}} секунд тому'
    },
    future: {
      singularNominative: 'за {{count}} секунду',
      singularGenitive: 'за {{count}} секунди',
      pluralGenitive: 'за {{count}} секунд'
    }
  }),
  halfAMinute: function (_, options) {
    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'за півхвилини';
      } else {
        return 'півхвилини тому';
      }
    }

    return 'півхвилини';
  },
  lessThanXMinutes: buildLocalizeTokenFn$4({
    regular: {
      one: 'менше хвилини',
      singularNominative: 'менше {{count}} хвилини',
      singularGenitive: 'менше {{count}} хвилин',
      pluralGenitive: 'менше {{count}} хвилин'
    },
    future: {
      one: 'менше, ніж за хвилину',
      singularNominative: 'менше, ніж за {{count}} хвилину',
      singularGenitive: 'менше, ніж за {{count}} хвилини',
      pluralGenitive: 'менше, ніж за {{count}} хвилин'
    }
  }),
  xMinutes: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} хвилина',
      singularGenitive: '{{count}} хвилини',
      pluralGenitive: '{{count}} хвилин'
    },
    past: {
      singularNominative: '{{count}} хвилину тому',
      singularGenitive: '{{count}} хвилини тому',
      pluralGenitive: '{{count}} хвилин тому'
    },
    future: {
      singularNominative: 'за {{count}} хвилину',
      singularGenitive: 'за {{count}} хвилини',
      pluralGenitive: 'за {{count}} хвилин'
    }
  }),
  aboutXHours: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: 'близько {{count}} години',
      singularGenitive: 'близько {{count}} годин',
      pluralGenitive: 'близько {{count}} годин'
    },
    future: {
      singularNominative: 'приблизно за {{count}} годину',
      singularGenitive: 'приблизно за {{count}} години',
      pluralGenitive: 'приблизно за {{count}} годин'
    }
  }),
  xHours: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} годину',
      singularGenitive: '{{count}} години',
      pluralGenitive: '{{count}} годин'
    }
  }),
  xDays: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} день',
      singularGenitive: '{{count}} дня',
      pluralGenitive: '{{count}} днів'
    }
  }),
  aboutXMonths: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: 'близько {{count}} місяця',
      singularGenitive: 'близько {{count}} місяців',
      pluralGenitive: 'близько {{count}} місяців'
    },
    future: {
      singularNominative: 'приблизно за {{count}} місяць',
      singularGenitive: 'приблизно за {{count}} місяця',
      pluralGenitive: 'приблизно за {{count}} місяців'
    }
  }),
  xMonths: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} місяць',
      singularGenitive: '{{count}} місяця',
      pluralGenitive: '{{count}} місяців'
    }
  }),
  aboutXYears: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: 'близько {{count}} року',
      singularGenitive: 'близько {{count}} років',
      pluralGenitive: 'близько {{count}} років'
    },
    future: {
      singularNominative: 'приблизно за {{count}} рік',
      singularGenitive: 'приблизно за {{count}} роки',
      pluralGenitive: 'приблизно за {{count}} років'
    }
  }),
  xYears: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: '{{count}} рік',
      singularGenitive: '{{count}} роки',
      pluralGenitive: '{{count}} років'
    }
  }),
  overXYears: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: 'більше {{count}} року',
      singularGenitive: 'більше {{count}} років',
      pluralGenitive: 'більше {{count}} років'
    },
    future: {
      singularNominative: 'більше, ніж за {{count}} рік',
      singularGenitive: 'більше, ніж за {{count}} роки',
      pluralGenitive: 'більше, ніж за {{count}} років'
    }
  }),
  almostXYears: buildLocalizeTokenFn$4({
    regular: {
      singularNominative: 'майже {{count}} рік',
      singularGenitive: 'майже {{count}} роки',
      pluralGenitive: 'майже {{count}} років'
    },
    future: {
      singularNominative: 'майже за {{count}} рік',
      singularGenitive: 'майже за {{count}} роки',
      pluralGenitive: 'майже за {{count}} років'
    }
  })
};
function formatDistance$T(token, count, options) {
  options = options || {};
  return formatDistanceLocale$R[token](count, options);
}

var dateFormats$W = {
  full: "EEEE, do MMMM y 'р.'",
  long: "do MMMM y 'р.'",
  medium: "d MMM y 'р.'",
  short: 'dd.MM.y'
};
var timeFormats$W = {
  full: 'H:mm:ss zzzz',
  long: 'H:mm:ss z',
  medium: 'H:mm:ss',
  short: 'H:mm'
};
var dateTimeFormats$W = {
  full: "{{date}} 'о' {{time}}",
  long: "{{date}} 'о' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}'
};
var formatLong$W = {
  date: buildFormatLongFn({
    formats: dateFormats$W,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$W,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$W,
    defaultWidth: 'full'
  })
};

var accusativeWeekdays$6 = ['неділю', 'понеділок', 'вівторок', 'середу', 'четвер', 'п’ятницю', 'суботу'];

function lastWeek$5(day) {
  var weekday = accusativeWeekdays$6[day];

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у минулу " + weekday + " о' p";

    case 1:
    case 2:
    case 4:
      return "'у минулий " + weekday + " о' p";
  }
}

function thisWeek$5(day) {
  var weekday = accusativeWeekdays$6[day];
  return "'у " + weekday + " о' p";
}

function nextWeek$5(day) {
  var weekday = accusativeWeekdays$6[day];

  switch (day) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'у наступну " + weekday + " о' p";

    case 1:
    case 2:
    case 4:
      return "'у наступний " + weekday + " о' p";
  }
}

var formatRelativeLocale$S = {
  lastWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$5(day);
    } else {
      return lastWeek$5(day);
    }
  },
  yesterday: "'вчора о' p",
  today: "'сьогодні о' p",
  tomorrow: "'завтра о' p",
  nextWeek: function (date, baseDate, options) {
    var day = date.getUTCDay();

    if (isSameUTCWeek(date, baseDate, options)) {
      return thisWeek$5(day);
    } else {
      return nextWeek$5(day);
    }
  },
  other: 'P'
};
function formatRelative$S(token, date, baseDate, options) {
  var format = formatRelativeLocale$S[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

var eraValues$S = {
  narrow: ['до н.е.', 'н.е.'],
  abbreviated: ['до н. е.', 'н. е.'],
  wide: ['до нашої ери', 'нашої ери']
};
var quarterValues$S = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
  wide: ['1-й квартал', '2-й квартал', '3-й квартал', '4-й квартал']
};
var monthValues$S = {
  // ДСТУ 3582:2013
  narrow: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В', 'Ж', 'Л', 'Г'],
  abbreviated: ['січ.', 'лют.', 'берез.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'верес.', 'жовт.', 'листоп.', 'груд.'],
  wide: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень']
};
var formattingMonthValues$c = {
  narrow: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В', 'Ж', 'Л', 'Г'],
  abbreviated: ['січ.', 'лют.', 'берез.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'верес.', 'жовт.', 'листоп.', 'груд.'],
  wide: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
};
var dayValues$S = {
  narrow: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
  short: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  abbreviated: ['нед', 'пон', 'вів', 'сер', 'чтв', 'птн', 'суб'],
  wide: ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'п’ятниця', 'субота']
};
var dayPeriodValues$R = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'півн.',
    noon: 'пол.',
    morning: 'ранок',
    afternoon: 'день',
    evening: 'веч.',
    night: 'ніч'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'півн.',
    noon: 'пол.',
    morning: 'ранок',
    afternoon: 'день',
    evening: 'веч.',
    night: 'ніч'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'північ',
    noon: 'полудень',
    morning: 'ранок',
    afternoon: 'день',
    evening: 'вечір',
    night: 'ніч'
  }
};
var formattingDayPeriodValues$H = {
  narrow: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'півн.',
    noon: 'пол.',
    morning: 'ранку',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночі'
  },
  abbreviated: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'півн.',
    noon: 'пол.',
    morning: 'ранку',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночі'
  },
  wide: {
    am: 'ДП',
    pm: 'ПП',
    midnight: 'північ',
    noon: 'полудень',
    morning: 'ранку',
    afternoon: 'дня',
    evening: 'веч.',
    night: 'ночі'
  }
};

function ordinalNumber$S(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (unit === 'date') {
    if (dirtyNumber === 3 || dirtyNumber === 23) {
      suffix = '-є';
    } else {
      suffix = '-е';
    }
  } else if (unit === 'minute' || unit === 'second' || unit === 'hour') {
    suffix = '-а';
  } else {
    suffix = '-й';
  }

  return dirtyNumber + suffix;
}

var localize$S = {
  ordinalNumber: ordinalNumber$S,
  era: buildLocalizeFn({
    values: eraValues$S,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$S,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$S,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$c,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$S,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$R,
    defaultWidth: 'any',
    formattingValues: formattingDayPeriodValues$H,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$S = /^(\d+)(-?(е|й|є|а|я))?/i;
var parseOrdinalNumberPattern$S = /\d+/i;
var matchEraPatterns$S = {
  narrow: /^((до )?н\.?\s?е\.?)/i,
  abbreviated: /^((до )?н\.?\s?е\.?)/i,
  wide: /^(до нашої ери|нашої ери|наша ера)/i
};
var parseEraPatterns$S = {
  any: [/^д/i, /^н/i]
};
var matchQuarterPatterns$S = {
  narrow: /^[1234]/i,
  abbreviated: /^[1234](-?[иі]?й?)? кв.?/i,
  wide: /^[1234](-?[иі]?й?)? квартал/i
};
var parseQuarterPatterns$S = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns$S = {
  narrow: /^[слбктчвжг]/i,
  abbreviated: /^(січ|лют|бер|берез|кві|трав?|чер|лип|сер|вер|жов|лис(топ)?|груд)\.?/i,
  wide: /^(січень|січня|лютий|лютого|березень|березня|квітень|квітня|травень|травня|липень|липня|серпень|серпня|вересень|вересня|жовтень|жовтня|листопада?|грудень|грудня)/i
};
var parseMonthPatterns$S = {
  narrow: [/^с/i, /^л/i, /^б/i, /^к/i, /^т/i, /^ч/i, /^л/i, /^с/i, /^в/i, /^ж/i, /^л/i, /^г/i],
  any: [/^сі/i, /^лю/i, /^б/i, /^к/i, /^т/i, /^ч/i, /^лип/i, /^се/i, /^в/i, /^ж/i, /^лис/i, /^г/i]
};
var matchDayPatterns$S = {
  narrow: /^[нпвсч]/i,
  short: /^(нд|пн|вт|ср|чт|пт|сб)\.?/i,
  abbreviated: /^(нед|пон|вів|сер|че?тв|птн?|суб)\.?/i,
  wide: /^(неділ[яі]|понеділ[ок][ка]|вівтор[ок][ка]|серед[аи]|четвер(га)?|п\W*?ятниц[яі]|субот[аи])/i
};
var parseDayPatterns$S = {
  narrow: [/^н/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
  any: [/^н/i, /^п[он]/i, /^в/i, /^с[ер]/i, /^ч/i, /^п\W*?[ят]/i, /^с[уб]/i]
};
var matchDayPeriodPatterns$S = {
  narrow: /^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
  abbreviated: /^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
  wide: /^([дп]п|північ|полудень|ранок|ранку|день|дня|вечір|вечора|ніч|ночі)/i
};
var parseDayPeriodPatterns$S = {
  any: {
    am: /^дп/i,
    pm: /^пп/i,
    midnight: /^півн/i,
    noon: /^пол/i,
    morning: /^р/i,
    afternoon: /^д[ен]/i,
    evening: /^в/i,
    night: /^н/i
  }
};
var match$S = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$S,
    parsePattern: parseOrdinalNumberPattern$S,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$S,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$S,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$S,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$S,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$S,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$S,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$S,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$S,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$S,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPeriodPatterns$S,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Ukrainian locale.
 * @language Ukrainian
 * @iso-639-2 ukr
 * @author Andrii Korzh [@korzhyk]{@link https://github.com/korzhyk}
 * @author Andriy Shcherbyak [@shcherbyakdev]{@link https://github.com/shcherbyakdev}
 */

var locale$W = {
  code: 'uk',
  formatDistance: formatDistance$T,
  formatLong: formatLong$W,
  formatRelative: formatRelative$S,
  localize: localize$S,
  match: match$S,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
  }
};

var formatDistanceLocale$S = {
  lessThanXSeconds: {
    one: 'dưới 1 giây',
    other: 'dưới {{count}} giây'
  },
  xSeconds: {
    one: '1 giây',
    other: '{{count}} giây'
  },
  halfAMinute: 'nửa phút',
  lessThanXMinutes: {
    one: 'dưới 1 phút',
    other: 'dưới {{count}} phút'
  },
  xMinutes: {
    one: '1 phút',
    other: '{{count}} phút'
  },
  aboutXHours: {
    one: 'khoảng 1 giờ',
    other: 'khoảng {{count}} giờ'
  },
  xHours: {
    one: '1 giờ',
    other: '{{count}} giờ'
  },
  xDays: {
    one: '1 ngày',
    other: '{{count}} ngày'
  },
  aboutXMonths: {
    one: 'khoảng 1 tháng',
    other: 'khoảng {{count}} tháng'
  },
  xMonths: {
    one: '1 tháng',
    other: '{{count}} tháng'
  },
  aboutXYears: {
    one: 'khoảng 1 năm',
    other: 'khoảng {{count}} năm'
  },
  xYears: {
    one: '1 năm',
    other: '{{count}} năm'
  },
  overXYears: {
    one: 'hơn 1 năm',
    other: 'hơn {{count}} năm'
  },
  almostXYears: {
    one: 'gần 1 năm',
    other: 'gần {{count}} năm'
  }
};
function formatDistance$U(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$S[token] === 'string') {
    result = formatDistanceLocale$S[token];
  } else if (count === 1) {
    result = formatDistanceLocale$S[token].one;
  } else {
    result = formatDistanceLocale$S[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + ' nữa';
    } else {
      return result + ' trước';
    }
  }

  return result;
}

var dateFormats$X = {
  // thứ Sáu, ngày 25 tháng 08 năm 2017
  full: "EEEE, 'ngày' d MMMM 'năm' y",
  // ngày 25 tháng 08 năm 2017
  long: "'ngày' d MMMM 'năm' y",
  // 25 thg 08 năm 2017
  medium: "d MMM 'năm' y",
  // 25/08/2017
  short: 'dd/MM/y'
};
var timeFormats$X = {
  full: 'HH:mm:ss zzzz',
  long: 'HH:mm:ss z',
  medium: 'HH:mm:ss',
  short: 'HH:mm'
};
var dateTimeFormats$X = {
  // thứ Sáu, ngày 25 tháng 08 năm 2017 23:25:59
  full: '{{date}} {{time}}',
  // ngày 25 tháng 08 năm 2017 23:25
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$X = {
  date: buildFormatLongFn({
    formats: dateFormats$X,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$X,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$X,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$T = {
  lastWeek: "eeee 'tuần trước vào lúc' p",
  yesterday: "'hôm qua vào lúc' p",
  today: "'hôm nay vào lúc' p",
  tomorrow: "'ngày mai vào lúc' p",
  nextWeek: "eeee 'tới vào lúc' p",
  other: 'P'
};
function formatRelative$T(token, _date, _baseDate, _options) {
  return formatRelativeLocale$T[token];
}

// Capitalization reference: http://hcmup.edu.vn/index.php?option=com_content&view=article&id=4106%3Avit-hoa-trong-vn-bn-hanh-chinh&catid=2345%3Atham-kho&Itemid=4103&lang=vi&site=134

var eraValues$T = {
  narrow: ['TCN', 'SCN'],
  abbreviated: ['trước CN', 'sau CN'],
  wide: ['trước Công Nguyên', 'sau Công Nguyên']
};
var quarterValues$T = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  wide: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4']
};
var formattingQuarterValues$3 = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
  // I notice many news outlet use this "quý II/2018"
  wide: ['quý I', 'quý II', 'quý III', 'quý IV'] // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.

};
var monthValues$T = {
  narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  abbreviated: ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'],
  wide: ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'] // In Vietnamese date formatting, month number less than 10 expected to have leading zero

};
var formattingMonthValues$d = {
  narrow: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  abbreviated: ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6', 'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12'],
  wide: ['tháng 01', 'tháng 02', 'tháng 03', 'tháng 04', 'tháng 05', 'tháng 06', 'tháng 07', 'tháng 08', 'tháng 09', 'tháng 10', 'tháng 11', 'tháng 12']
};
var dayValues$T = {
  narrow: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  short: ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'],
  abbreviated: ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  wide: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] // Vietnamese are used to AM/PM borrowing from English, hence `narrow` and
  // `abbreviated` are just like English but I'm leaving the `wide`
  // format being localized with abbreviations found in some systems (SÁng / CHiều);
  // however, personally, I don't think `Chiều` sounds appropriate for `PM`

};
var dayPeriodValues$S = {
  // narrow date period is extremely rare in Vietnamese
  // I used abbreviated form for noon, morning and afternoon
  // which are regconizable by Vietnamese, others cannot be any shorter
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'nửa đêm',
    noon: 'tr',
    morning: 'sg',
    afternoon: 'ch',
    evening: 'tối',
    night: 'đêm'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'nửa đêm',
    noon: 'trưa',
    morning: 'sáng',
    afternoon: 'chiều',
    evening: 'tối',
    night: 'đêm'
  },
  wide: {
    am: 'SA',
    pm: 'CH',
    midnight: 'nửa đêm',
    noon: 'trưa',
    morning: 'sáng',
    afternoon: 'chiều',
    evening: 'tối',
    night: 'đêm'
  }
};
var formattingDayPeriodValues$I = {
  narrow: {
    am: 'am',
    pm: 'pm',
    midnight: 'nửa đêm',
    noon: 'tr',
    morning: 'sg',
    afternoon: 'ch',
    evening: 'tối',
    night: 'đêm'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'nửa đêm',
    noon: 'trưa',
    morning: 'sáng',
    afternoon: 'chiều',
    evening: 'tối',
    night: 'đêm'
  },
  wide: {
    am: 'SA',
    pm: 'CH',
    midnight: 'nửa đêm',
    noon: 'giữa trưa',
    morning: 'vào buổi sáng',
    afternoon: 'vào buổi chiều',
    evening: 'vào buổi tối',
    night: 'vào ban đêm'
  } // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'month', 'quarter', 'week', 'isoWeek', 'dayOfYear',
  // 'dayOfMonth' or 'dayOfWeek'

};

function ordinalNumber$T(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var number = parseInt(dirtyNumber, 10);

  if (unit === 'quarter') {
    // many news outlets use "quý I"...
    switch (number) {
      case 1:
        return 'I';

      case 2:
        return 'II';

      case 3:
        return 'III';

      case 4:
        return 'IV';
    }
  } else if (unit === 'day') {
    // day of week in Vietnamese has ordinal number meaning,
    // so we should use them, else it'll sound weird
    switch (number) {
      case 1:
        return 'thứ 2';
      // meaning 2nd day but it's the first day of the week :D

      case 2:
        return 'thứ 3';
      // meaning 3rd day

      case 3:
        return 'thứ 4';
      // meaning 4th day and so on

      case 4:
        return 'thứ 5';

      case 5:
        return 'thứ 6';

      case 6:
        return 'thứ 7';

      case 7:
        return 'chủ nhật';
      // meaning Sunday, there's no 8th day :D
    }
  } else if (unit === 'week') {
    if (number === 1) {
      return 'thứ nhất';
    } else {
      return 'thứ ' + number;
    }
  } else if (unit === 'dayOfYear') {
    if (number === 1) {
      return 'đầu tiên';
    } else {
      return 'thứ ' + number;
    }
  } // there are no different forms of ordinal numbers in Vietnamese


  return number;
}

var localize$T = {
  ordinalNumber: ordinalNumber$T,
  era: buildLocalizeFn({
    values: eraValues$T,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$T,
    defaultWidth: 'wide',
    formattingValues: formattingQuarterValues$3,
    defaultFormattingWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$T,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues$d,
    defaultFormattingWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$T,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$S,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$I,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$T = /^(\d+)/i;
var parseOrdinalNumberPattern$T = /\d+/i;
var matchEraPatterns$T = {
  narrow: /^(tcn|scn)/i,
  abbreviated: /^(trước CN|sau CN)/i,
  wide: /^(trước Công Nguyên|sau Công Nguyên)/i
};
var parseEraPatterns$T = {
  any: [/^t/i, /^s/i]
};
var matchQuarterPatterns$T = {
  narrow: /^([1234]|i{1,3}v?)/i,
  abbreviated: /^q([1234]|i{1,3}v?)/i,
  wide: /^quý ([1234]|i{1,3}v?)/i
};
var parseQuarterPatterns$T = {
  any: [/(1|i)$/i, /(2|ii)$/i, /(3|iii)$/i, /(4|iv)$/i]
};
var matchMonthPatterns$T = {
  // month number may contain leading 0, 'thg' prefix may have space, underscore or empty before number
  // note the order of '1' since it is a sub-string of '10', so must be lower priority
  narrow: /^(0?[2-9]|10|11|12|0?1)/i,
  // note the order of 'thg 1' since it is sub-string of 'thg 10', so must be lower priority
  abbreviated: /^thg[ _]?(0?[1-9](?!\d)|10|11|12)/i,
  // note the order of 'Mười' since it is sub-string of Mười Một, so must be lower priority
  wide: /^tháng ?(Một|Hai|Ba|Tư|Năm|Sáu|Bảy|Tám|Chín|Mười|Mười ?Một|Mười ?Hai|0?[1-9](?!\d)|10|11|12)/i
};
var parseMonthPatterns$T = {
  narrow: [/0?1$/i, /0?2/i, /3/, /4/, /5/, /6/, /7/, /8/, /9/, /10/, /11/, /12/],
  abbreviated: [/^thg[ _]?0?1(?!\d)/i, /^thg[ _]?0?2/i, /^thg[ _]?0?3/i, /^thg[ _]?0?4/i, /^thg[ _]?0?5/i, /^thg[ _]?0?6/i, /^thg[ _]?0?7/i, /^thg[ _]?0?8/i, /^thg[ _]?0?9/i, /^thg[ _]?10/i, /^thg[ _]?11/i, /^thg[ _]?12/i],
  wide: [/^tháng ?(Một|0?1(?!\d))/i, /^tháng ?(Hai|0?2)/i, /^tháng ?(Ba|0?3)/i, /^tháng ?(Tư|0?4)/i, /^tháng ?(Năm|0?5)/i, /^tháng ?(Sáu|0?6)/i, /^tháng ?(Bảy|0?7)/i, /^tháng ?(Tám|0?8)/i, /^tháng ?(Chín|0?9)/i, /^tháng ?(Mười|10)/i, /^tháng ?(Mười ?Một|11)/i, /^tháng ?(Mười ?Hai|12)/i]
};
var matchDayPatterns$T = {
  narrow: /^(CN|T2|T3|T4|T5|T6|T7)/i,
  short: /^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
  abbreviated: /^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
  wide: /^(Chủ ?Nhật|Chúa ?Nhật|thứ ?Hai|thứ ?Ba|thứ ?Tư|thứ ?Năm|thứ ?Sáu|thứ ?Bảy)/i
};
var parseDayPatterns$T = {
  narrow: [/CN/i, /2/i, /3/i, /4/i, /5/i, /6/i, /7/i],
  short: [/CN/i, /2/i, /3/i, /4/i, /5/i, /6/i, /7/i],
  abbreviated: [/CN/i, /2/i, /3/i, /4/i, /5/i, /6/i, /7/i],
  wide: [/(Chủ|Chúa) ?Nhật/i, /Hai/i, /Ba/i, /Tư/i, /Năm/i, /Sáu/i, /Bảy/i]
};
var matchDayPeriodPatterns$T = {
  narrow: /^(a|p|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
  abbreviated: /^(am|pm|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
  wide: /^(ch[^i]*|sa|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i
};
var parseDayPeriodPatterns$T = {
  any: {
    am: /^(a|sa)/i,
    pm: /^(p|ch[^i]*)/i,
    midnight: /nửa đêm/i,
    noon: /trưa/i,
    morning: /sáng/i,
    afternoon: /chiều/i,
    evening: /tối/i,
    night: /^đêm/i
  }
};
var match$T = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$T,
    parsePattern: parseOrdinalNumberPattern$T,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$T,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$T,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$T,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$T,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$T,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$T,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$T,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$T,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$T,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$T,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Vietnamese locale (Vietnam).
 * @language Vietnamese
 * @iso-639-2 vie
 * @author Thanh Tran [@trongthanh]{@link https://github.com/trongthanh}
 * @author Leroy Hopson [@lihop]{@link https://github.com/lihop}
 */

var locale$X = {
  code: 'vi',
  formatDistance: formatDistance$U,
  formatLong: formatLong$X,
  formatRelative: formatRelative$T,
  localize: localize$T,
  match: match$T,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 1
    /* First week of new year contains Jan 1st  */

  }
};

var formatDistanceLocale$T = {
  lessThanXSeconds: {
    one: '不到 1 秒',
    other: '不到 {{count}} 秒'
  },
  xSeconds: {
    one: '1 秒',
    other: '{{count}} 秒'
  },
  halfAMinute: '半分钟',
  lessThanXMinutes: {
    one: '不到 1 分钟',
    other: '不到 {{count}} 分钟'
  },
  xMinutes: {
    one: '1 分钟',
    other: '{{count}} 分钟'
  },
  xHours: {
    one: '1 小时',
    other: '{{count}} 小时'
  },
  aboutXHours: {
    one: '大约 1 小时',
    other: '大约 {{count}} 小时'
  },
  xDays: {
    one: '1 天',
    other: '{{count}} 天'
  },
  aboutXMonths: {
    one: '大约 1 个月',
    other: '大约 {{count}} 个月'
  },
  xMonths: {
    one: '1 个月',
    other: '{{count}} 个月'
  },
  aboutXYears: {
    one: '大约 1 年',
    other: '大约 {{count}} 年'
  },
  xYears: {
    one: '1 年',
    other: '{{count}} 年'
  },
  overXYears: {
    one: '超过 1 年',
    other: '超过 {{count}} 年'
  },
  almostXYears: {
    one: '将近 1 年',
    other: '将近 {{count}} 年'
  }
};
function formatDistance$V(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$T[token] === 'string') {
    result = formatDistanceLocale$T[token];
  } else if (count === 1) {
    result = formatDistanceLocale$T[token].one;
  } else {
    result = formatDistanceLocale$T[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + '内';
    } else {
      return result + '前';
    }
  }

  return result;
}

var dateFormats$Y = {
  full: "y'年'M'月'd'日' EEEE",
  long: "y'年'M'月'd'日'",
  medium: 'yyyy-MM-dd',
  short: 'yy-MM-dd'
};
var timeFormats$Y = {
  full: 'zzzz a h:mm:ss',
  long: 'z a h:mm:ss',
  medium: 'a h:mm:ss',
  short: 'a h:mm'
};
var dateTimeFormats$Y = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$Y = {
  date: buildFormatLongFn({
    formats: dateFormats$Y,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$Y,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$Y,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$U = {
  lastWeek: "'上个' eeee p",
  yesterday: "'昨天' p",
  today: "'今天' p",
  tomorrow: "'明天' p",
  nextWeek: "'下个' eeee p",
  other: 'P'
};
function formatRelative$U(token, _date, _baseDate, _options) {
  return formatRelativeLocale$U[token];
}

var eraValues$U = {
  narrow: ['前', '公元'],
  abbreviated: ['前', '公元'],
  wide: ['公元前', '公元']
};
var quarterValues$U = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['第一刻', '第二刻', '第三刻', '第四刻'],
  wide: ['第一刻钟', '第二刻钟', '第三刻钟', '第四刻钟']
};
var monthValues$U = {
  narrow: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  abbreviated: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  wide: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
};
var dayValues$U = {
  narrow: ['日', '一', '二', '三', '四', '五', '六'],
  short: ['日', '一', '二', '三', '四', '五', '六'],
  abbreviated: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  wide: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
};
var dayPeriodValues$T = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '凌晨',
    noon: '午',
    morning: '早',
    afternoon: '下午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜间'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜间'
  }
};
var formattingDayPeriodValues$J = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '凌晨',
    noon: '午',
    morning: '早',
    afternoon: '下午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜间'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜间'
  }
};

function ordinalNumber$U(dirtyNumber, dirtyOptions) {
  // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'
  var number = Number(dirtyNumber);
  var options = dirtyOptions || {};
  var unit = String(options.unit);

  if (unit === 'date' || unit === 'hour' || unit === 'minute' || unit === 'second') {
    return number.toString();
  }

  return '第 ' + number.toString();
}

var localize$U = {
  ordinalNumber: ordinalNumber$U,
  era: buildLocalizeFn({
    values: eraValues$U,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$U,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$U,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$U,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$T,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$J,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$U = /^(第\s*)?\d+/i;
var parseOrdinalNumberPattern$U = /\d+/i;
var matchEraPatterns$U = {
  narrow: /^(前)/i,
  abbreviated: /^(前)/i,
  wide: /^(公元前|公元)/i
};
var parseEraPatterns$U = {
  any: [/^(前)/i, /^(公元)/i]
};
var matchQuarterPatterns$U = {
  narrow: /^[1234]/i,
  abbreviated: /^第[一二三四]刻/i,
  wide: /^第[一二三四]刻钟/i
};
var parseQuarterPatterns$U = {
  any: [/(1|一)/i, /(2|二)/i, /(3|三)/i, /(4|四)/i]
};
var matchMonthPatterns$U = {
  narrow: /^(一|二|三|四|五|六|七|八|九|十[二一])/i,
  abbreviated: /^(一|二|三|四|五|六|七|八|九|十[二一]|\d|1[12])月/i,
  wide: /^(一|二|三|四|五|六|七|八|九|十[二一])月/i
};
var parseMonthPatterns$U = {
  narrow: [/^一/i, /^二/i, /^三/i, /^四/i, /^五/i, /^六/i, /^七/i, /^八/i, /^九/i, /^十(?!(一|二))/i, /^十一/i, /^十二/i],
  any: [/^一|[!\d]1[!\d]/i, /^二|[!\d]2[!\d]/i, /^三|3/i, /^四|4/i, /^五|5/i, /^六|6/i, /^七|7/i, /^八|8/i, /^九|9/i, /^十(?!(一|二))|10/i, /^十一|11/i, /^十二|12/i]
};
var matchDayPatterns$U = {
  narrow: /^[一二三四五六日]/i,
  short: /^[一二三四五六日]/i,
  abbreviated: /^周[一二三四五六日]/i,
  wide: /^星期[一二三四五六日]/i
};
var parseDayPatterns$U = {
  any: [/日/i, /一/i, /二/i, /三/i, /四/i, /五/i, /六/i]
};
var matchDayPeriodPatterns$U = {
  any: /^(上午|下午|午夜|[中正]午|早上|下午|晚上?|凌晨)/i
};
var parseDayPeriodPatterns$U = {
  any: {
    am: /^上午/i,
    pm: /^下午/i,
    midnight: /^午夜/i,
    noon: /^[中正]午/i,
    morning: /^早上/i,
    afternoon: /^下午/i,
    evening: /^晚/i,
    night: /^凌晨/i
  }
};
var match$U = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$U,
    parsePattern: parseOrdinalNumberPattern$U,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$U,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$U,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$U,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$U,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$U,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$U,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$U,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$U,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$U,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$U,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Chinese Simplified locale.
 * @language Chinese Simplified
 * @iso-639-2 zho
 * @author Changyu Geng [@KingMario]{@link https://github.com/KingMario}
 * @author Song Shuoyun [@fnlctrl]{@link https://github.com/fnlctrl}
 * @author sabrinaM [@sabrinamiao]{@link https://github.com/sabrinamiao}
 * @author Carney Wu [@cubicwork]{@link https://github.com/cubicwork}
 */

var locale$Y = {
  code: 'zh-CN',
  formatDistance: formatDistance$V,
  formatLong: formatLong$Y,
  formatRelative: formatRelative$U,
  localize: localize$U,
  match: match$U,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

var formatDistanceLocale$U = {
  lessThanXSeconds: {
    one: '少於 1 秒',
    other: '少於 {{count}} 秒'
  },
  xSeconds: {
    one: '1 秒',
    other: '{{count}} 秒'
  },
  halfAMinute: '半分鐘',
  lessThanXMinutes: {
    one: '少於 1 分鐘',
    other: '少於 {{count}} 分鐘'
  },
  xMinutes: {
    one: '1 分鐘',
    other: '{{count}} 分鐘'
  },
  xHours: {
    one: '1 小時',
    other: '{{count}} 小時'
  },
  aboutXHours: {
    one: '大約 1 小時',
    other: '大約 {{count}} 小時'
  },
  xDays: {
    one: '1 天',
    other: '{{count}} 天'
  },
  aboutXMonths: {
    one: '大約 1 個月',
    other: '大約 {{count}} 個月'
  },
  xMonths: {
    one: '1 個月',
    other: '{{count}} 個月'
  },
  aboutXYears: {
    one: '大約 1 年',
    other: '大約 {{count}} 年'
  },
  xYears: {
    one: '1 年',
    other: '{{count}} 年'
  },
  overXYears: {
    one: '超過 1 年',
    other: '超過 {{count}} 年'
  },
  almostXYears: {
    one: '將近 1 年',
    other: '將近 {{count}} 年'
  }
};
function formatDistance$W(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale$U[token] === 'string') {
    result = formatDistanceLocale$U[token];
  } else if (count === 1) {
    result = formatDistanceLocale$U[token].one;
  } else {
    result = formatDistanceLocale$U[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return result + '內';
    } else {
      return result + '前';
    }
  }

  return result;
}

var dateFormats$Z = {
  full: "y'年'M'月'd'日' EEEE",
  long: "y'年'M'月'd'日'",
  medium: 'yyyy-MM-dd',
  short: 'yy-MM-dd'
};
var timeFormats$Z = {
  full: 'zzzz a h:mm:ss',
  long: 'z a h:mm:ss',
  medium: 'a h:mm:ss',
  short: 'a h:mm'
};
var dateTimeFormats$Z = {
  full: '{{date}} {{time}}',
  long: '{{date}} {{time}}',
  medium: '{{date}} {{time}}',
  short: '{{date}} {{time}}'
};
var formatLong$Z = {
  date: buildFormatLongFn({
    formats: dateFormats$Z,
    defaultWidth: 'full'
  }),
  time: buildFormatLongFn({
    formats: timeFormats$Z,
    defaultWidth: 'full'
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats$Z,
    defaultWidth: 'full'
  })
};

var formatRelativeLocale$V = {
  lastWeek: "'上個' eeee p",
  yesterday: "'昨天' p",
  today: "'今天' p",
  tomorrow: "'明天' p",
  nextWeek: "'下個' eeee p",
  other: 'P'
};
function formatRelative$V(token, _date, _baseDate, _options) {
  return formatRelativeLocale$V[token];
}

var eraValues$V = {
  narrow: ['前', '公元'],
  abbreviated: ['前', '公元'],
  wide: ['公元前', '公元']
};
var quarterValues$V = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['第一刻', '第二刻', '第三刻', '第四刻'],
  wide: ['第一刻鐘', '第二刻鐘', '第三刻鐘', '第四刻鐘']
};
var monthValues$V = {
  narrow: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  abbreviated: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  wide: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
};
var dayValues$V = {
  narrow: ['日', '一', '二', '三', '四', '五', '六'],
  short: ['日', '一', '二', '三', '四', '五', '六'],
  abbreviated: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
  wide: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
};
var dayPeriodValues$U = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '凌晨',
    noon: '午',
    morning: '早',
    afternoon: '下午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜間'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜間'
  }
};
var formattingDayPeriodValues$K = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '凌晨',
    noon: '午',
    morning: '早',
    afternoon: '下午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜間'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '凌晨',
    noon: '中午',
    morning: '早晨',
    afternoon: '中午',
    evening: '晚上',
    night: '夜間'
  }
};

function ordinalNumber$V(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  return '第 ' + number.toString();
}

var localize$V = {
  ordinalNumber: ordinalNumber$V,
  era: buildLocalizeFn({
    values: eraValues$V,
    defaultWidth: 'wide'
  }),
  quarter: buildLocalizeFn({
    values: quarterValues$V,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: buildLocalizeFn({
    values: monthValues$V,
    defaultWidth: 'wide'
  }),
  day: buildLocalizeFn({
    values: dayValues$V,
    defaultWidth: 'wide'
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues$U,
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues$K,
    defaultFormattingWidth: 'wide'
  })
};

var matchOrdinalNumberPattern$V = /^(第\s*)?\d+/i;
var parseOrdinalNumberPattern$V = /\d+/i;
var matchEraPatterns$V = {
  narrow: /^(前)/i,
  abbreviated: /^(前)/i,
  wide: /^(公元前|公元)/i
};
var parseEraPatterns$V = {
  any: [/^(前)/i, /^(公元)/i]
};
var matchQuarterPatterns$V = {
  narrow: /^[1234]/i,
  abbreviated: /^第[一二三四]刻/i,
  wide: /^第[一二三四]刻鐘/i
};
var parseQuarterPatterns$V = {
  any: [/(1|一)/i, /(2|二)/i, /(3|三)/i, /(4|四)/i]
};
var matchMonthPatterns$V = {
  narrow: /^(一|二|三|四|五|六|七|八|九|十[二一])/i,
  abbreviated: /^(一|二|三|四|五|六|七|八|九|十[二一]|\d|1[12])月/i,
  wide: /^(一|二|三|四|五|六|七|八|九|十[二一])月/i
};
var parseMonthPatterns$V = {
  narrow: [/^一/i, /^二/i, /^三/i, /^四/i, /^五/i, /^六/i, /^七/i, /^八/i, /^九/i, /^十(?!(一|二))/i, /^十一/i, /^十二/i],
  any: [/^一|[!\d]1[!\d]/i, /^二|[!\d]2[!\d]/i, /^三|3/i, /^四|4/i, /^五|5/i, /^六|6/i, /^七|7/i, /^八|8/i, /^九|9/i, /^十(?!(一|二))|10/i, /^十一|11/i, /^十二|12/i]
};
var matchDayPatterns$V = {
  narrow: /^[一二三四五六日]/i,
  short: /^[一二三四五六日]/i,
  abbreviated: /^週[一二三四五六日]/i,
  wide: /^星期[一二三四五六日]/i
};
var parseDayPatterns$V = {
  any: [/日/i, /一/i, /二/i, /三/i, /四/i, /五/i, /六/i]
};
var matchDayPeriodPatterns$V = {
  any: /^(上午|下午|午夜|[中正]午|早上|下午|晚上?|凌晨)/i
};
var parseDayPeriodPatterns$V = {
  any: {
    am: /^上午/i,
    pm: /^下午/i,
    midnight: /^午夜/i,
    noon: /^[中正]午/i,
    morning: /^早上/i,
    afternoon: /^下午/i,
    evening: /^晚/i,
    night: /^凌晨/i
  }
};
var match$V = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern$V,
    parsePattern: parseOrdinalNumberPattern$V,
    valueCallback: function (value) {
      return parseInt(value, 10);
    }
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns$V,
    defaultMatchWidth: 'wide',
    parsePatterns: parseEraPatterns$V,
    defaultParseWidth: 'any'
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns$V,
    defaultMatchWidth: 'wide',
    parsePatterns: parseQuarterPatterns$V,
    defaultParseWidth: 'any',
    valueCallback: function (index) {
      return index + 1;
    }
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns$V,
    defaultMatchWidth: 'wide',
    parsePatterns: parseMonthPatterns$V,
    defaultParseWidth: 'any'
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns$V,
    defaultMatchWidth: 'wide',
    parsePatterns: parseDayPatterns$V,
    defaultParseWidth: 'any'
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns$V,
    defaultMatchWidth: 'any',
    parsePatterns: parseDayPeriodPatterns$V,
    defaultParseWidth: 'any'
  })
};

/**
 * @type {Locale}
 * @category Locales
 * @summary Chinese Traditional locale.
 * @language Chinese Traditional
 * @iso-639-2 zho
 * @author tonypai [@tpai]{@link https://github.com/tpai}
 * @author Jack Hsu [@jackhsu978]{@link https://github.com/jackhsu978}
 */

var locale$Z = {
  code: 'zh-TW',
  formatDistance: formatDistance$W,
  formatLong: formatLong$Z,
  formatRelative: formatRelative$V,
  localize: localize$V,
  match: match$V,
  options: {
    weekStartsOn: 1
    /* Monday */
    ,
    firstWeekContainsDate: 4
  }
};

// This file is generated automatically by `scripts/build/indices.js`. Please, don't change it.

var locales = /*#__PURE__*/Object.freeze({
    af: locale$1,
    arDZ: locale$2,
    arSA: locale$3,
    be: locale$4,
    bg: locale$5,
    bn: locale$6,
    ca: locale$7,
    cs: locale$8,
    cy: locale$9,
    da: locale$a,
    de: locale$b,
    el: locale$c,
    enAU: locale$d,
    enCA: locale$e,
    enGB: locale$f,
    enUS: locale,
    eo: locale$g,
    es: locale$h,
    et: locale$i,
    faIR: locale$j,
    fi: locale$k,
    fr: locale$l,
    frCA: locale$m,
    gl: locale$n,
    gu: locale$o,
    he: locale$p,
    hi: locale$q,
    hr: locale$r,
    hu: locale$s,
    hy: locale$t,
    id: locale$u,
    is: locale$v,
    it: locale$w,
    ja: locale$x,
    ka: locale$y,
    kk: locale$z,
    ko: locale$A,
    lt: locale$B,
    lv: locale$C,
    ms: locale$D,
    nb: locale$E,
    nl: locale$F,
    nn: locale$G,
    pl: locale$H,
    pt: locale$I,
    ptBR: locale$J,
    ro: locale$K,
    ru: locale$L,
    sk: locale$M,
    sl: locale$N,
    sr: locale$O,
    srLatn: locale$P,
    sv: locale$Q,
    ta: locale$R,
    te: locale$S,
    th: locale$T,
    tr: locale$U,
    ug: locale$V,
    uk: locale$W,
    vi: locale$X,
    zhCN: locale$Y,
    zhTW: locale$Z
});

/**
 *
 * @param {Date} date
 * @param {string} dateFormat
 *
 * @returns {string} - The date in the supplied locale,
 *                     defaulting to the current system locale
 */
const localeFormat = (date, dateFormat) =>
  format(date, dateFormat, { locale: __locale__ });

/**
 *
 * @param {Date} mo - Month
 * @param {string} format - Format of the month
 *
 * @returns {Date[]}
 */
const buildMonths = (mo, format) => {
  const yrStart = startOfYear(mo);

  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((_, i) => {
    const value = addMonths(yrStart, i);

    return { value, text: localeFormat(value, format) };
  });
};

/**
 *
 * @param {Date} min - Earliest allowed date
 * @param {Date} max - Latest allowed date
 *
 * @returns {Date[]}
 */
const buildYears = (min, max) => {
  const numYrs = differenceInCalendarYears(max, min) + 1;
  return [...Array(numYrs)].map((_, i) => {
    const value = addYears(min, i);
    return { value, text: localeFormat(value, "yyyy") };
  });
};

/**
 *
 * @param {string} firstDayOfWeek
 *
 * @returns {number} - 0 | 1 | 2 | 3 | 4 | 5 | 6
 */
const dayOffset = firstDayOfWeek =>
  [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ].indexOf(firstDayOfWeek.toLocaleLowerCase(__locale__));

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} maxDate
 * @property {Date} minDate
 * @property {Date[]} disabledDates
 *
 * @returns {boolean}
 */
const isDisabled = ({ date, maxDate, minDate, disabledDates }) => {
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
};

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} hoverDate
 * @property {Date} tempStartDate
 * @property {Date} tempEndDate
 *
 * @returns {boolean}
 */
const isEndDate = ({
  tempEndDate,
  date,
  hoverDate,
  hasSelection,
  tempStartDate
}) => {
  if (!hasSelection) {
    if (isAfter(hoverDate, tempStartDate)) {
      return isSameDay(date, hoverDate);
    }

    return isSameDay(date, tempStartDate);
  }

  return isSameDay(date, tempEndDate);
};

/**
 *
 * @param {Object}
 * @property {boolean} hasSelection
 * @property {Date} date
 * @property {Date} hoverDate
 * @property {Date} tempStartDate
 *
 * @returns {boolean}
 */
const isStartDate = ({
  hasSelection,
  date,
  hoverDate,
  tempStartDate
}) => {
  if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
    return isSameDay(date, hoverDate);
  }

  return isSameDay(date, tempStartDate);
};

/**
 *
 * @typedef {Object} Range
 * @property {Date} start
 * @property {Date} end
 */
/**
 *
 * @param {Date} date - Date
 * @param {Date} dateToCompare - Date to compare
 *
 *
 * @returns {Range}
 */
const toRange = (date, dateToCompare) => {
  if (isAfter(date, dateToCompare)) {
    return {
      start: dateToCompare,
      end: date
    };
  }
  return {
    start: date,
    end: dateToCompare
  };
};

/**
 *
 * @typedef {Object} Day
 * @prop {Date} date
 * @prop {Array} events
 * @prop {boolean} isToday
 * @prop {boolean} isWeekend
 * @prop {boolean} isPrevMonth
 * @prop {boolean} isNextMonth
 * @prop {boolean} isStartDate
 * @prop {boolean} isDisabled
 * @prop {boolean} isEndDate
 * @prop {boolean} isWithinSelection
 */

/**
 *
 * @param {Object} params
 * @prop {Date} date
 * @prop {Date} tempEndDate
 * @prop {Date[]} events
 * @prop {Date} hoverDate
 * @prop {boolean} hasSelection
 * @prop {Date} month
 * @prop {boolean} singlePicker
 * @prop {Date} tempStartDate
 * @prop {Date} today
 * @prop {Date} maxDate
 * @prop {Date} minDate
 * @prop {Date[]} disabledDates
 *
 * @returns {Day}
 */
const getDayMetaData = params => {
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
    isEndDate: isEndDate(params),
    isWithinSelection: !singlePicker
      ? isWithinInterval(date, { start, end })
      : false
  };
};

/**
 *
 * @param {Object} getDayMetaDataParams
 * @prop {Date} date
 * @prop {Date} tempEndDate
 * @prop {Date[]} events
 * @prop {Date} hoverDate
 * @prop {boolean} hasSelection
 * @prop {Date} month
 * @prop {boolean} singlePicker
 * @prop {Date} tempStartDate
 * @prop {Date} today
 * @prop {Date} maxDate
 * @prop {Date} minDate
 * @prop {Date[]} disabledDates
 *
 * @returns {Day}
 */

/**
 *
 * @param {Date} start
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Date[]}
 */
const buildWeek = (start, getDayMetaDataParams) =>
  [0, 1, 2, 3, 4, 5, 6].map((_, i) =>
    getDayMetaData({ ...getDayMetaDataParams, date: addDays(start, i) })
  );

/**
 *
 * @param {getDayMetaDataParams} getDayMetaDataParams
 *
 * @returns {Object[]}
 */
const getCalendarWeeks = getDayMetaDataParams => {
  const { month, firstDayOfWeek, today } = getDayMetaDataParams;
  const weekStartsOn = dayOffset(firstDayOfWeek);
  const start = startOfWeek(endOfMonth(subMonths(month, 1)));

  return eachWeekOfInterval(
    {
      start,
      end: addWeeks(start, 5)
    },
    { weekStartsOn, locale: __locale__ }
  ).map(date => ({
    weeksFromToday: differenceInCalendarWeeks(date, today, {
      weekStartsOn,
      locale: __locale__
    }),
    weekNumber: getWeek(date, { weekStartsOn }),
    isoWeekNumber: getISOWeek(date),
    daysInWeek: buildWeek(date, getDayMetaDataParams)
  }));
};

/**
 *
 * @param {string} firstDayOfWeek
 *
 * @returns {Date[]}
 */
const getDaysOfWeek = firstDayOfWeek =>
  [0, 1, 2, 3, 4, 5, 6].map((_, i) =>
    addDays(
      startOfWeek(new Date(), {
        weekStartsOn: dayOffset(firstDayOfWeek)
      }),
      i
    )
  );

/**
 *
 * @param {number} n - The number to be checked for needed padding
 *
 * @returns {(string | number)}
 */
const pad = n => (n < 10 ? `0${n}` : n);

/**
 *
 * @param {number} n - The number to be rounded down
 * @param {number} p - The precision of the rounding
 *
 * @returns {number}
 */
const roundDown = (n, p = 1) => Math.floor(n / p) * p;

/* src/date-range-picker/components/Day.svelte generated by Svelte v3.5.3 */

const file = "src/date-range-picker/components/Day.svelte";

// (124:4) {#if monthIndicator}
function create_if_block(ctx) {
	var span, t_value = localeFormat(ctx.day.date, 'MMM'), t;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			attr(span, "class", "month-indicator svelte-1prti0d");
			add_location(span, file, 124, 6, 2365);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.day) && t_value !== (t_value = localeFormat(ctx.day.date, 'MMM'))) {
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
	var div, button, t0, t1_value = localeFormat(ctx.day.date, 'd'), t1, button_aria_label_value, button_aria_disabled_value, button_disabled_value, dispose;

	var if_block = (ctx.monthIndicator) && create_if_block(ctx);

	return {
		c: function create() {
			div = element("div");
			button = element("button");
			if (if_block) if_block.c();
			t0 = space();
			t1 = text(t1_value);
			attr(button, "type", "button");
			attr(button, "aria-label", button_aria_label_value = localeFormat(ctx.day.date, 'EEEE, MMMM co, yyyy'));
			attr(button, "aria-disabled", button_aria_disabled_value = ctx.day.isDisabled);
			attr(button, "class", "calendar-cell svelte-1prti0d");
			button.disabled = button_disabled_value = ctx.day.isDisabled;
			add_location(button, file, 113, 2, 1955);
			attr(div, "role", "gridcell");
			attr(div, "class", "svelte-1prti0d");
			toggle_class(div, "rtl", ctx.rtl);
			toggle_class(div, "today", ctx.day.isToday);
			toggle_class(div, "weekend", ctx.day.isWeekend);
			toggle_class(div, "next-month", ctx.day.isNextMonth);
			toggle_class(div, "prev-month", ctx.day.isPrevMonth);
			toggle_class(div, "start-date", ctx.day.isStartDate);
			toggle_class(div, "end-date", ctx.day.isEndDate);
			toggle_class(div, "within-selection", ctx.day.isWithinSelection);
			add_location(div, file, 103, 0, 1664);

			dispose = [
				listen(button, "keydown", ctx.onKeydown),
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

			if ((changed.day) && t1_value !== (t1_value = localeFormat(ctx.day.date, 'd'))) {
				set_data(t1, t1_value);
			}

			if ((changed.day) && button_aria_label_value !== (button_aria_label_value = localeFormat(ctx.day.date, 'EEEE, MMMM co, yyyy'))) {
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
	

  let { day, monthIndicator, rtl } = $$props;

  const dispatchEvent = createEventDispatcher();

  const onKeydown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatchEvent("apply");
    }
  };

	const writable_props = ['day', 'monthIndicator', 'rtl'];
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
		if ('day' in $$props) $$invalidate('day', day = $$props.day);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
	};

	return {
		day,
		monthIndicator,
		rtl,
		dispatchEvent,
		onKeydown,
		click_handler,
		mouseenter_handler,
		focus_handler
	};
}

class Day extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["day", "monthIndicator", "rtl"]);

		const { ctx } = this.$$;
		const props = options.props || {};
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

// (56:2) {#if weekGuides && week.weeksFromToday}
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
			add_location(span, file$1, 57, 6, 991);
			attr(div, "class", "relative row side-width left-side svelte-mhpr0y");
			add_location(div, file$1, 56, 4, 937);
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

// (65:4) {#each week.daysInWeek as day (day.date.toString())}
function create_each_block(key_1, ctx) {
	var first, current;

	var day = new Day({
		props: {
		day: ctx.day,
		monthIndicator: ctx.monthIndicator,
		rtl: ctx.rtl
	},
		$$inline: true
	});
	day.$on("selection", ctx.selection_handler);
	day.$on("hover", ctx.hover_handler);
	day.$on("apply", ctx.apply_handler);

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

// (69:2) {#if weekNumbers || isoWeekNumbers}
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
			attr(div, "class", "relative row side-width right-side svelte-mhpr0y");
			add_location(div, file$1, 69, 4, 1333);
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

// (71:6) {#if weekNumbers}
function create_if_block_2(ctx) {
	var span, t_value = ctx.week.weekNumber, t, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t = text(t_value);
			attr(span, "aria-label", span_aria_label_value = `Week ${ctx.week.weekNumber}`);
			attr(span, "class", "svelte-mhpr0y");
			add_location(span, file$1, 71, 8, 1414);
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

// (74:6) {#if isoWeekNumbers}
function create_if_block_1(ctx) {
	var span, t0, t1_value = ctx.week.isoWeekNumber, t1, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t0 = text("i");
			t1 = text(t1_value);
			attr(span, "aria-label", span_aria_label_value = `Week ${ctx.week.isoWeekNumber}`);
			attr(span, "class", "svelte-mhpr0y");
			add_location(span, file$1, 74, 8, 1531);
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
			attr(div0, "class", "row");
			add_location(div0, file$1, 63, 2, 1121);
			attr(div1, "aria-label", div1_aria_label_value = `${localeFormat(ctx.month, 'yyyy')}`);
			attr(div1, "class", "row");
			attr(div1, "role", "row");
			add_location(div1, file$1, 53, 0, 815);
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

			if ((!current || changed.month) && div1_aria_label_value !== (div1_aria_label_value = `${localeFormat(ctx.month, 'yyyy')}`)) {
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
	

  let { isoWeekNumbers, month, monthIndicator, rtl, week, weekGuides, weekNumbers } = $$props;

	const writable_props = ['isoWeekNumbers', 'month', 'monthIndicator', 'rtl', 'week', 'weekGuides', 'weekNumbers'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Week> was created with unknown prop '${key}'`);
	});

	function selection_handler(event) {
		bubble($$self, event);
	}

	function hover_handler(event) {
		bubble($$self, event);
	}

	function apply_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('isoWeekNumbers' in $$props) $$invalidate('isoWeekNumbers', isoWeekNumbers = $$props.isoWeekNumbers);
		if ('month' in $$props) $$invalidate('month', month = $$props.month);
		if ('monthIndicator' in $$props) $$invalidate('monthIndicator', monthIndicator = $$props.monthIndicator);
		if ('rtl' in $$props) $$invalidate('rtl', rtl = $$props.rtl);
		if ('week' in $$props) $$invalidate('week', week = $$props.week);
		if ('weekGuides' in $$props) $$invalidate('weekGuides', weekGuides = $$props.weekGuides);
		if ('weekNumbers' in $$props) $$invalidate('weekNumbers', weekNumbers = $$props.weekNumbers);
	};

	let weeksFromToday;

	$$invalidate('weeksFromToday', weeksFromToday = week => {
        if (week.weeksFromToday > 0) {
          return `+${week.weeksFromToday}`;
        }
    
        return week.weeksFromToday;
      });

	return {
		isoWeekNumbers,
		month,
		monthIndicator,
		rtl,
		week,
		weekGuides,
		weekNumbers,
		weeksFromToday,
		selection_handler,
		hover_handler,
		apply_handler
	};
}

class Week extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["isoWeekNumbers", "month", "monthIndicator", "rtl", "week", "weekGuides", "weekNumbers"]);

		const { ctx } = this.$$;
		const props = options.props || {};
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

// (17:2) {#each daysOfWeek as dayOfWeek}
function create_each_block$1(ctx) {
	var span, t0_value = localeFormat(ctx.dayOfWeek, 'eeeeee'), t0, t1, span_aria_label_value;

	return {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			attr(span, "role", "gridcell");
			attr(span, "class", "calendar-cell svelte-e9ppe7");
			attr(span, "aria-label", span_aria_label_value = localeFormat(ctx.dayOfWeek, 'EEEE'));
			add_location(span, file$2, 17, 4, 296);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			append(span, t1);
		},

		p: function update(changed, ctx) {
			if ((changed.daysOfWeek) && t0_value !== (t0_value = localeFormat(ctx.dayOfWeek, 'eeeeee'))) {
				set_data(t0, t0_value);
			}

			if ((changed.daysOfWeek) && span_aria_label_value !== (span_aria_label_value = localeFormat(ctx.dayOfWeek, 'EEEE'))) {
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
			attr(div, "class", "row");
			attr(div, "role", "row");
			add_location(div, file$2, 15, 0, 229);
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
			if (changed.localeFormat || changed.daysOfWeek) {
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
	let { firstDayOfWeek } = $$props;

	const writable_props = ['firstDayOfWeek'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DaysOfWeek> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('firstDayOfWeek' in $$props) $$invalidate('firstDayOfWeek', firstDayOfWeek = $$props.firstDayOfWeek);
	};

	let daysOfWeek;

	$$self.$$.update = ($$dirty = { firstDayOfWeek: 1 }) => {
		if ($$dirty.firstDayOfWeek) { $$invalidate('daysOfWeek', daysOfWeek = getDaysOfWeek(firstDayOfWeek)); }
	};

	return { firstDayOfWeek, daysOfWeek };
}

class DaysOfWeek extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["firstDayOfWeek"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.firstDayOfWeek === undefined && !('firstDayOfWeek' in props)) {
			console.warn("<DaysOfWeek> was created without expected prop 'firstDayOfWeek'");
		}
	}

	get firstDayOfWeek() {
		throw new Error("<DaysOfWeek>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set firstDayOfWeek(value) {
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

// (76:4) {:else}
function create_else_block_1(ctx) {
	var small, t_value = localeFormat(ctx.month, 'MMMM'), t;

	return {
		c: function create() {
			small = element("small");
			t = text(t_value);
			add_location(small, file$3, 76, 6, 2211);
		},

		m: function mount(target, anchor) {
			insert(target, small, anchor);
			append(small, t);
		},

		p: function update(changed, ctx) {
			if ((changed.month) && t_value !== (t_value = localeFormat(ctx.month, 'MMMM'))) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(small);
			}
		}
	};
}

// (57:4) {#if monthDropdown}
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
			attr(select, "class", "form-field");
			add_location(select, file$3, 57, 6, 1680);

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

// (67:8) {#each months as mo}
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
			add_location(option, file$3, 67, 10, 1985);
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

// (96:4) {:else}
function create_else_block(ctx) {
	var small, t_value = localeFormat(ctx.month, 'yyyy'), t;

	return {
		c: function create() {
			small = element("small");
			t = text(t_value);
			add_location(small, file$3, 96, 6, 2798);
		},

		m: function mount(target, anchor) {
			insert(target, small, anchor);
			append(small, t);
		},

		p: function update(changed, ctx) {
			if ((changed.month) && t_value !== (t_value = localeFormat(ctx.month, 'yyyy'))) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(small);
			}
		}
	};
}

// (79:4) {#if yearDropdown}
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
			attr(select, "class", "form-field");
			add_location(select, file$3, 79, 6, 2295);

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

// (87:8) {#each years as yr}
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
			add_location(option, file$3, 87, 10, 2573);
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
			attr(button0, "class", "form-field");
			attr(button0, "aria-disabled", ctx.prevBtnDisabled);
			button0.disabled = ctx.prevBtnDisabled;
			attr(button0, "type", "button");
			attr(button0, "aria-label", button0_aria_label_value = `Previous month, ${localeFormat(ctx.prevMonth, 'MMMM yyyy')}`);
			add_location(button0, file$3, 46, 2, 1368);
			add_location(span, file$3, 55, 2, 1643);
			attr(button1, "class", "form-field");
			attr(button1, "aria-disabled", ctx.nextBtnDisabled);
			button1.disabled = ctx.nextBtnDisabled;
			attr(button1, "type", "button");
			attr(button1, "aria-label", button1_aria_label_value = `Next month, ${localeFormat(ctx.nextMonth, 'MMMM yyyy')}`);
			add_location(button1, file$3, 99, 2, 2865);
			attr(div, "class", "space-between");
			add_location(div, file$3, 45, 0, 1338);

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

			if ((changed.prevMonth) && button0_aria_label_value !== (button0_aria_label_value = `Previous month, ${localeFormat(ctx.prevMonth, 'MMMM yyyy')}`)) {
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

			if ((changed.nextMonth) && button1_aria_label_value !== (button1_aria_label_value = `Next month, ${localeFormat(ctx.nextMonth, 'MMMM yyyy')}`)) {
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
	

  let { month, monthFormat, monthDropdown, maxDate, minDate, nextIcon, prevIcon, yearDropdown } = $$props;

  const disptachEvent = createEventDispatcher();

	const writable_props = ['month', 'monthFormat', 'monthDropdown', 'maxDate', 'minDate', 'nextIcon', 'prevIcon', 'yearDropdown'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Controls> was created with unknown prop '${key}'`);
	});

	function click_handler() {
		return disptachEvent('prevMonth');
	}

	function select_change_handler() {
		selectedMonth = select_value(this);
		$$invalidate('selectedMonth', selectedMonth), $$invalidate('month', month), $$invalidate('monthFormat', monthFormat);
		$$invalidate('months', months), $$invalidate('month', month), $$invalidate('monthFormat', monthFormat);
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
		$$invalidate('selectedYear', selectedYear), $$invalidate('month', month);
		$$invalidate('years', years), $$invalidate('minDate', minDate), $$invalidate('maxDate', maxDate);
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

	$$self.$$.update = ($$dirty = { month: 1, monthFormat: 1, maxDate: 1, minDate: 1 }) => {
		if ($$dirty.month || $$dirty.monthFormat) { $$invalidate('selectedMonth', selectedMonth = {
        value: month,
        text: localeFormat(month, monthFormat)
      }); }
		if ($$dirty.month) { $$invalidate('selectedYear', selectedYear = { value: month, text: localeFormat(month, "yyyy") }); }
		if ($$dirty.month) { $$invalidate('prevMonth', prevMonth = subMonths(month, 1)); }
		if ($$dirty.month) { $$invalidate('nextMonth', nextMonth = addMonths(month, 1)); }
		if ($$dirty.month || $$dirty.maxDate) { isMaxDate = isAfter(month, maxDate) || isSameMonth(month, maxDate); }
		if ($$dirty.month || $$dirty.minDate) { isMinDate = isBefore(month, minDate) || isSameMonth(month, minDate); }
		if ($$dirty.month || $$dirty.monthFormat) { $$invalidate('months', months = buildMonths(month, monthFormat)); }
		if ($$dirty.minDate || $$dirty.maxDate) { $$invalidate('years', years = buildYears(minDate, maxDate)); }
		if ($$dirty.month || $$dirty.maxDate) { $$invalidate('nextBtnDisabled', nextBtnDisabled = isSameMonth(month, maxDate) || isAfter(month, maxDate)); }
		if ($$dirty.month || $$dirty.minDate) { $$invalidate('prevBtnDisabled', prevBtnDisabled = isSameMonth(month, minDate) || isBefore(month, minDate)); }
		if ($$dirty.minDate || $$dirty.maxDate) { $$invalidate('isOptionDisabled', isOptionDisabled = mo =>
        isBefore(mo, minDate) ||
        (!isSameMonth(mo, minDate) && isAfter(mo, maxDate))); }
	};

	return {
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
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["month", "monthFormat", "monthDropdown", "maxDate", "minDate", "nextIcon", "prevIcon", "yearDropdown"]);

		const { ctx } = this.$$;
		const props = options.props || {};
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

// (69:4) {#each weeks as week}
function create_each_block$3(ctx) {
	var current;

	var week = new Week({
		props: {
		week: ctx.week,
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
	week.$on("apply", ctx.apply_handler);

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
	var div1, t0, div0, t1, div1_style_value, current;

	var controls = new Controls({
		props: {
		prevIcon: ctx.prevIcon,
		nextIcon: ctx.nextIcon,
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
		props: { firstDayOfWeek: ctx.firstDayOfWeek },
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
			div1 = element("div");
			controls.$$.fragment.c();
			t0 = space();
			div0 = element("div");
			daysofweek.$$.fragment.c();
			t1 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(div0, "role", "grid");
			add_location(div0, file$4, 66, 2, 1344);
			attr(div1, "style", div1_style_value = `width: ${ctx.pageWidth}px;`);
			attr(div1, "class", "calendar svelte-1m66x1y");
			add_location(div1, file$4, 53, 0, 1092);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			mount_component(controls, div1, null);
			append(div1, t0);
			append(div1, div0);
			mount_component(daysofweek, div0, null);
			append(div0, t1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			var controls_changes = {};
			if (changed.prevIcon) controls_changes.prevIcon = ctx.prevIcon;
			if (changed.nextIcon) controls_changes.nextIcon = ctx.nextIcon;
			if (changed.month) controls_changes.month = ctx.month;
			if (changed.monthDropdown) controls_changes.monthDropdown = ctx.monthDropdown;
			if (changed.monthFormat) controls_changes.monthFormat = ctx.monthFormat;
			if (changed.maxDate) controls_changes.maxDate = ctx.maxDate;
			if (changed.minDate) controls_changes.minDate = ctx.minDate;
			if (changed.yearDropdown) controls_changes.yearDropdown = ctx.yearDropdown;
			controls.$set(controls_changes);

			var daysofweek_changes = {};
			if (changed.firstDayOfWeek) daysofweek_changes.firstDayOfWeek = ctx.firstDayOfWeek;
			daysofweek.$set(daysofweek_changes);

			if (changed.weeks || changed.month || changed.monthIndicator || changed.rtl || changed.weekGuides || changed.weekNumbers || changed.isoWeekNumbers) {
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
						each_blocks[i].m(div0, null);
					}
				}

				group_outros();
				for (; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if ((!current || changed.pageWidth) && div1_style_value !== (div1_style_value = `width: ${ctx.pageWidth}px;`)) {
				attr(div1, "style", div1_style_value);
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
				detach(div1);
			}

			destroy_component(controls, );

			destroy_component(daysofweek, );

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	

  let { disabledDates, events, hasSelection, hoverDate, firstDayOfWeek, isoWeekNumbers, maxDate, minDate, month, monthDropdown, monthFormat, monthIndicator, pageWidth, rtl, prevIcon, nextIcon, singlePicker, tempEndDate, tempStartDate, today, weekGuides, weekNumbers, yearDropdown } = $$props;

	const writable_props = ['disabledDates', 'events', 'hasSelection', 'hoverDate', 'firstDayOfWeek', 'isoWeekNumbers', 'maxDate', 'minDate', 'month', 'monthDropdown', 'monthFormat', 'monthIndicator', 'pageWidth', 'rtl', 'prevIcon', 'nextIcon', 'singlePicker', 'tempEndDate', 'tempStartDate', 'today', 'weekGuides', 'weekNumbers', 'yearDropdown'];
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

	function apply_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('disabledDates' in $$props) $$invalidate('disabledDates', disabledDates = $$props.disabledDates);
		if ('events' in $$props) $$invalidate('events', events = $$props.events);
		if ('hasSelection' in $$props) $$invalidate('hasSelection', hasSelection = $$props.hasSelection);
		if ('hoverDate' in $$props) $$invalidate('hoverDate', hoverDate = $$props.hoverDate);
		if ('firstDayOfWeek' in $$props) $$invalidate('firstDayOfWeek', firstDayOfWeek = $$props.firstDayOfWeek);
		if ('isoWeekNumbers' in $$props) $$invalidate('isoWeekNumbers', isoWeekNumbers = $$props.isoWeekNumbers);
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

	$$self.$$.update = ($$dirty = { month: 1, firstDayOfWeek: 1, events: 1, disabledDates: 1, tempStartDate: 1, hoverDate: 1, hasSelection: 1, minDate: 1, maxDate: 1, today: 1, tempEndDate: 1, singlePicker: 1 }) => {
		if ($$dirty.month || $$dirty.firstDayOfWeek || $$dirty.events || $$dirty.disabledDates || $$dirty.tempStartDate || $$dirty.hoverDate || $$dirty.hasSelection || $$dirty.minDate || $$dirty.maxDate || $$dirty.today || $$dirty.tempEndDate || $$dirty.singlePicker) { $$invalidate('weeks', weeks = getCalendarWeeks({
        month,
        firstDayOfWeek,
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
		hover_handler,
		apply_handler
	};
}

class Calendar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["disabledDates", "events", "hasSelection", "hoverDate", "firstDayOfWeek", "isoWeekNumbers", "maxDate", "minDate", "month", "monthDropdown", "monthFormat", "monthIndicator", "pageWidth", "rtl", "prevIcon", "nextIcon", "singlePicker", "tempEndDate", "tempStartDate", "today", "weekGuides", "weekNumbers", "yearDropdown"]);

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

// (77:4) {#each hours as hour}
function create_each_block_2(ctx) {
	var option, t_value = ctx.hour, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.hour);
			option.value = option.__value;
			add_location(option, file$5, 77, 6, 2024);
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

// (82:4) {#each minutes as minute}
function create_each_block_1$1(ctx) {
	var option, t_value = ctx.minute, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.minute);
			option.value = option.__value;
			add_location(option, file$5, 82, 6, 2212);
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

// (86:2) {#if timePickerSeconds}
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
			attr(select, "class", "form-field");
			add_location(select, file$5, 86, 4, 2317);

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

// (91:6) {#each seconds as second}
function create_each_block$4(ctx) {
	var option, t_value = ctx.second, t, option_value_value;

	return {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = parseInt(ctx.second);
			option.value = option.__value;
			add_location(option, file$5, 91, 8, 2454);
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
	var div, button0, raw0_value = '&#8643;', t0, select0, t1, select1, t2, t3, button1, raw1_value = '&#8638;', dispose;

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
			button0 = element("button");
			t0 = space();
			select0 = element("select");

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t1 = space();
			select1 = element("select");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			if (if_block) if_block.c();
			t3 = space();
			button1 = element("button");
			attr(button0, "aria-label", "First available time");
			attr(button0, "type", "button");
			attr(button0, "class", "form-field");
			button0.disabled = ctx.isFirstAvailableTime;
			attr(button0, "aria-disabled", ctx.isFirstAvailableTime);
			add_location(button0, file$5, 66, 2, 1678);
			if (ctx.selectedHour === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
			attr(select0, "class", "form-field");
			add_location(select0, file$5, 75, 2, 1915);
			if (ctx.selectedMinute === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
			attr(select1, "class", "form-field");
			add_location(select1, file$5, 80, 2, 2097);
			attr(button1, "aria-label", "Last available time");
			attr(button1, "type", "button");
			attr(button1, "class", "form-field");
			button1.disabled = ctx.isLastAvailableTime;
			attr(button1, "aria-disabled", ctx.isLastAvailableTime);
			add_location(button1, file$5, 103, 2, 2708);
			attr(div, "class", "svelte-xedl4c");
			add_location(div, file$5, 65, 0, 1670);

			dispose = [
				listen(button0, "click", ctx.timeChangeStartOfDay),
				listen(select0, "change", ctx.select0_change_handler),
				listen(select0, "change", ctx.timeChange),
				listen(select1, "change", ctx.select1_change_handler),
				listen(select1, "change", ctx.timeChange),
				listen(button1, "click", ctx.timeChangeEndOfDay)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, button0);
			button0.innerHTML = raw0_value;
			append(div, t0);
			append(div, select0);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(select0, null);
			}

			select_option(select0, ctx.selectedHour);

			append(div, t1);
			append(div, select1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select1, null);
			}

			select_option(select1, ctx.selectedMinute);

			append(div, t2);
			if (if_block) if_block.m(div, null);
			append(div, t3);
			append(div, button1);
			button1.innerHTML = raw1_value;
		},

		p: function update(changed, ctx) {
			if (changed.isFirstAvailableTime) {
				button0.disabled = ctx.isFirstAvailableTime;
				attr(button0, "aria-disabled", ctx.isFirstAvailableTime);
			}

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
					if_block.m(div, t3);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (changed.isLastAvailableTime) {
				button1.disabled = ctx.isLastAvailableTime;
				attr(button1, "aria-disabled", ctx.isLastAvailableTime);
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
  const timeChange = () =>
    dispatchEvent("timeChange", {
      hours: selectedHour,
      minutes: selectedMinute,
      seconds: timePickerSeconds ? selectedSecond : 0
    });

  const timeChangeStartOfDay = () => {
    $$invalidate('selectedHour', selectedHour = hours[0]);
    $$invalidate('selectedMinute', selectedMinute = minutes[0]);
    $$invalidate('selectedSecond', selectedSecond = seconds[0]);

    timeChange();
  };

  function timeChangeEndOfDay() {
    $$invalidate('selectedHour', selectedHour = hours[hours.length - 1]);
    $$invalidate('selectedMinute', selectedMinute = minutes[minutes.length - 1]);
    $$invalidate('selectedSecond', selectedSecond = seconds[seconds.length - 1]);

    timeChange();
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

	let selectedHour, selectedMinute, selectedSecond, hours, minutes, seconds, isFirstAvailableTime, isLastAvailableTime;

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
		if ($$dirty.dateReference) { $$invalidate('isFirstAvailableTime', isFirstAvailableTime = isSameSecond(
        dateReference,
        startOfDay$1(dateReference)
      )); }
		if ($$dirty.dateReference) { $$invalidate('isLastAvailableTime', isLastAvailableTime = isSameSecond(dateReference, endOfDay(dateReference))); }
	};

	return {
		minuteIncrement,
		secondIncrement,
		timePicker24Hour,
		timePickerSeconds,
		dateReference,
		timeChange,
		timeChangeStartOfDay,
		timeChangeEndOfDay,
		selectedHour,
		selectedMinute,
		selectedSecond,
		hours,
		minutes,
		seconds,
		isFirstAvailableTime,
		isLastAvailableTime,
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

// (414:6) {#each months as month}
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
	calendar.$on("apply", ctx.apply);

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

// (450:2) {#if timePicker}
function create_if_block_2$1(ctx) {
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

	var if_block = (!ctx.singlePicker) && create_if_block_3$1(ctx);

	return {
		c: function create() {
			div = element("div");
			timepicker.$$.fragment.c();
			t = space();
			if (if_block) if_block.c();
			attr(div, "class", "row");
			add_location(div, file$6, 450, 4, 11341);
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
					if_block = create_if_block_3$1(ctx);
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

// (461:6) {#if !singlePicker}
function create_if_block_3$1(ctx) {
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

// (473:4) {#if todayBtn}
function create_if_block_1$2(ctx) {
	var button, t, button_disabled_value, dispose;

	return {
		c: function create() {
			button = element("button");
			t = text(ctx.todayBtnText);
			attr(button, "class", "form-field");
			attr(button, "type", "button");
			attr(button, "aria-label", "Show the current selection ");
			button.disabled = button_disabled_value = isSameMonth(new ctx.Date(), ctx.months[0]);
			add_location(button, file$6, 473, 6, 11897);
			dispose = listen(button, "click", ctx.goToToday);
		},

		m: function mount(target, anchor) {
			insert(target, button, anchor);
			append(button, t);
		},

		p: function update(changed, ctx) {
			if (changed.todayBtnText) {
				set_data(t, ctx.todayBtnText);
			}

			if ((changed.months) && button_disabled_value !== (button_disabled_value = isSameMonth(new ctx.Date(), ctx.months[0]))) {
				button.disabled = button_disabled_value;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(button);
			}

			dispose();
		}
	};
}

// (483:4) {#if resetViewBtn}
function create_if_block$4(ctx) {
	var button, button_disabled_value, dispose;

	return {
		c: function create() {
			button = element("button");
			attr(button, "class", "form-field");
			attr(button, "type", "button");
			attr(button, "aria-label", "Show the current selection ");
			button.disabled = button_disabled_value = !ctx.canResetView;
			add_location(button, file$6, 483, 6, 12165);
			dispose = listen(button, "click", ctx.resetView);
		},

		m: function mount(target, anchor) {
			insert(target, button, anchor);
			button.innerHTML = ctx.resetViewBtnText;
		},

		p: function update(changed, ctx) {
			if (changed.resetViewBtnText) {
				button.innerHTML = ctx.resetViewBtnText;
			}

			if ((changed.canResetView) && button_disabled_value !== (button_disabled_value = !ctx.canResetView)) {
				button.disabled = button_disabled_value;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(button);
			}

			dispose();
		}
	};
}

function create_fragment$6(ctx) {
	var form, div0, h1, t0_value = ctx.startDateReadout(), t0, t1, t2_value = ctx.endDateReadout(), t2, t3, button0, t4, button0_disabled_value, t5, div3, div1, t6, div2, t7, t8, div4, t9, t10, button1, t11, button1_aria_disabled_value, button1_disabled_value, t12, button2, t13, button2_aria_disabled_value, button2_disabled_value, form_style_value, form_class_value, current, dispose;

	var each_value = ctx.months;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, () => {
		each_blocks[i] = null;
	});

	var if_block0 = (ctx.timePicker) && create_if_block_2$1(ctx);

	var if_block1 = (ctx.todayBtn) && create_if_block_1$2(ctx);

	var if_block2 = (ctx.resetViewBtn) && create_if_block$4(ctx);

	return {
		c: function create() {
			form = element("form");
			div0 = element("div");
			h1 = element("h1");
			t0 = text(t0_value);
			t1 = text(" to ");
			t2 = text(t2_value);
			t3 = space();
			button0 = element("button");
			t4 = text("x");
			t5 = space();
			div3 = element("div");
			div1 = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t6 = space();
			div2 = element("div");
			t7 = space();
			if (if_block0) if_block0.c();
			t8 = space();
			div4 = element("div");
			if (if_block1) if_block1.c();
			t9 = space();
			if (if_block2) if_block2.c();
			t10 = space();
			button1 = element("button");
			t11 = text(ctx.cancelBtnText);
			t12 = space();
			button2 = element("button");
			t13 = text(ctx.applyBtnText);
			attr(h1, "class", "svelte-1p4sjxl");
			add_location(h1, file$6, 402, 4, 10238);
			attr(button0, "class", "form-field");
			attr(button0, "type", "close");
			button0.disabled = button0_disabled_value = !ctx.canApply();
			add_location(button0, file$6, 403, 4, 10294);
			attr(div0, "class", "space-between");
			add_location(div0, file$6, 401, 2, 10206);
			attr(div1, "class", "grid svelte-1p4sjxl");
			add_location(div1, file$6, 412, 4, 10442);
			attr(div2, "class", "full-height-scroll");
			add_location(div2, file$6, 446, 4, 11273);
			add_location(div3, file$6, 411, 2, 10432);
			attr(button1, "class", "form-field");
			attr(button1, "type", "button");
			attr(button1, "aria-label", "Cancel the current selection and revert to previous start and\n      end dates");
			attr(button1, "aria-disabled", button1_aria_disabled_value = !ctx.canApply());
			button1.disabled = button1_disabled_value = !ctx.canApply();
			add_location(button1, file$6, 492, 4, 12397);
			attr(button2, "id", "s-apply-btn");
			attr(button2, "class", "form-field");
			attr(button2, "aria-label", "Apply the current selection");
			attr(button2, "aria-disabled", button2_aria_disabled_value = !ctx.canApply());
			button2.disabled = button2_disabled_value = !ctx.canApply();
			add_location(button2, file$6, 503, 4, 12676);
			attr(div4, "class", "justify-end svelte-1p4sjxl");
			add_location(div4, file$6, 471, 2, 11846);
			attr(form, "id", ctx.id);
			attr(form, "style", form_style_value = `width: ${ctx.maxWidth}px`);
			attr(form, "class", form_class_value = "" + (ctx.rtl ? 'rtl s-date-range-picker' : 's-date-range-picker') + " svelte-1p4sjxl");
			add_location(form, file$6, 396, 0, 10056);

			dispose = [
				listen(button0, "click", ctx.close),
				listen(button1, "click", ctx.cancel),
				listen(button2, "click", ctx.apply),
				listen(form, "submit", prevent_default(ctx.apply))
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, form, anchor);
			append(form, div0);
			append(div0, h1);
			append(h1, t0);
			append(h1, t1);
			append(h1, t2);
			append(div0, t3);
			append(div0, button0);
			append(button0, t4);
			append(form, t5);
			append(form, div3);
			append(div3, div1);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			append(div3, t6);
			append(div3, div2);
			append(form, t7);
			if (if_block0) if_block0.m(form, null);
			append(form, t8);
			append(form, div4);
			if (if_block1) if_block1.m(div4, null);
			append(div4, t9);
			if (if_block2) if_block2.m(div4, null);
			append(div4, t10);
			append(div4, button1);
			append(button1, t11);
			append(div4, t12);
			append(div4, button2);
			append(button2, t13);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.startDateReadout) && t0_value !== (t0_value = ctx.startDateReadout())) {
				set_data(t0, t0_value);
			}

			if ((!current || changed.endDateReadout) && t2_value !== (t2_value = ctx.endDateReadout())) {
				set_data(t2, t2_value);
			}

			if ((!current || changed.canApply) && button0_disabled_value !== (button0_disabled_value = !ctx.canApply())) {
				button0.disabled = button0_disabled_value;
			}

			if (changed.prevIcon || changed.nextIcon || changed.disabledDates || changed.events || changed.hoverDate || changed.hasSelection || changed.firstDayOfWeek || changed.isoWeekNumbers || changed.maxDate || changed.minDate || changed.months || changed.monthDropdown || changed.monthFormat || changed.monthIndicator || changed.pageWidth || changed.rtl || changed.singlePicker || changed.tempEndDate || changed.tempStartDate || changed.today || changed.weekGuides || changed.weekNumbers || changed.yearDropdown || changed.onPageChange || changed.onHover || changed.onSelection || changed.onPrevMonth || changed.onNextMonth || changed.apply) {
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
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(form, t8);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (ctx.todayBtn) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block_1$2(ctx);
					if_block1.c();
					if_block1.m(div4, t9);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (ctx.resetViewBtn) {
				if (if_block2) {
					if_block2.p(changed, ctx);
				} else {
					if_block2 = create_if_block$4(ctx);
					if_block2.c();
					if_block2.m(div4, t10);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (!current || changed.cancelBtnText) {
				set_data(t11, ctx.cancelBtnText);
			}

			if ((!current || changed.canApply) && button1_aria_disabled_value !== (button1_aria_disabled_value = !ctx.canApply())) {
				attr(button1, "aria-disabled", button1_aria_disabled_value);
			}

			if ((!current || changed.canApply) && button1_disabled_value !== (button1_disabled_value = !ctx.canApply())) {
				button1.disabled = button1_disabled_value;
			}

			if (!current || changed.applyBtnText) {
				set_data(t13, ctx.applyBtnText);
			}

			if ((!current || changed.canApply) && button2_aria_disabled_value !== (button2_aria_disabled_value = !ctx.canApply())) {
				attr(button2, "aria-disabled", button2_aria_disabled_value);
			}

			if ((!current || changed.canApply) && button2_disabled_value !== (button2_disabled_value = !ctx.canApply())) {
				button2.disabled = button2_disabled_value;
			}

			if (!current || changed.id) {
				attr(form, "id", ctx.id);
			}

			if ((!current || changed.maxWidth) && form_style_value !== (form_style_value = `width: ${ctx.maxWidth}px`)) {
				attr(form, "style", form_style_value);
			}

			if ((!current || changed.rtl) && form_class_value !== (form_class_value = "" + (ctx.rtl ? 'rtl s-date-range-picker' : 's-date-range-picker') + " svelte-1p4sjxl")) {
				attr(form, "class", form_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			transition_in(if_block0);
			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(if_block0);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(form);
			}

			destroy_each(each_blocks, detaching);

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			run_all(dispose);
		}
	};
}

const cellWidth = 44;

const maxCalsPerPage = 2;

function instance$6($$self, $$props, $$invalidate) {
	

  let { autoApply = false, dateFormat = "MMM dd, yyyy", monthIndicator = true, disabledDates = [], endDate = endOfWeek(new Date()), events = [], firstDayOfWeek = "sunday", isoWeekNumbers = false, locale, maxDate = addYears(new Date(), 10), minDate = subYears(new Date(), 10), monthDropdown = false, monthFormat = "MMMM", numPages = 1, rtl = false, singlePicker = false, startDate = startOfWeek(new Date()), timePicker = false, timePicker24Hour = true, minuteIncrement = 1, secondIncrement = 1, timePickerSeconds = false, prevIcon = "&#9666;", nextIcon = "&#9656;", today = new Date(), weekGuides = false, weekNumbers = false, yearDropdown = false, applyBtnText = "Apply", cancelBtnText = "Cancel", todayBtnText = "Today", todayBtn = false, resetViewBtnText = "&#8602;", resetViewBtn = false, id = `s-date-range-picker-${Math.random()}` } = $$props;
  // export let disabled = false;
  // export let hideOnCancel = true;
  // export let hideOnApply = true;
  // export let maxSpan = null;
  // export let predefinedRanges = [];

  let hoverDate = endDate;
  let tempEndDate = endDate;
  let tempStartDate = startDate;
  let hasSelection = true;

  const dispatchEvent = createEventDispatcher();
  const pageWidth = cellWidth * 7;
  const pageWidthWithPadding = pageWidth + 96;

  // Used for the date-fns format abstraction, localeFormat
  /** @todo This might be better placed into a store. */
  window.__locale__ = locale;

  // Round and set the hover data temp start & end dates based on start & end date props
  onMount(() => {
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
    }
  });

  // const show() =>{
  //   dispatchEvent("show");
  // }

  // const hide() =>{
  //   dispatchEvent("hide");
  // }

  const apply = () => {
    if (!canApply()) {
      return;
    }
    // if (hideOnApply) {
    //   hide();
    // }

    dispatchEvent("apply", {
      startDate: tempStartDate,
      endDate: tempEndDate
    });
  };

  const goToToday = () => {
    $$invalidate('months', months = [...Array(numPages)].map((_, i) => addMonths(new Date(), i)));
  };

  const resetView = () => {
    const resetViewMonth = canApply() ? tempStartDate : startDate;
    $$invalidate('months', months = [...Array(numPages)].map((_, i) => addMonths(resetViewMonth, i)));
  };

  const resetState = () => {
    $$invalidate('tempStartDate', tempStartDate = startDate);
    $$invalidate('tempEndDate', tempEndDate = endDate);
    $$invalidate('hasSelection', hasSelection = true);
  };

  const close = () => {
    resetState();
    resetView();
    // hide();
  };

  const cancel = () => {
    resetState();
    resetView();

    // if (hideOnCancel) {
    //   hide();
    // }

    dispatchEvent("cancel", {
      startDate,
      endDate
    });
  };

  const onSelection = ({ detail }) => {
    const newEndDate = new Date(
      detail.getFullYear(),
      detail.getMonth(),
      detail.getDate(),
      tempEndDate.getHours(),
      tempEndDate.getMinutes(),
      tempEndDate.getSeconds()
    );

    if (singlePicker) {
      // Start and end dates are always the same on singlePicker
      $$invalidate('tempStartDate', tempStartDate = tempEndDate = newEndDate); $$invalidate('tempEndDate', tempEndDate);
    } else if (hasSelection) {
      // In range mode, if there is currently a selection and the selection
      // event is fired the user must be selecting the start date
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
      // In range mode, if there isn't a selection, the user must be selecting an end date
      // Sorting - Swap start and end dates when the end date is before the start date
      if (isBefore(newEndDate, tempStartDate)) {
        $$invalidate('tempEndDate', tempEndDate = tempStartDate);
        $$invalidate('tempStartDate', tempStartDate = !timePicker ? startOfDay(newEndDate) : newEndDate);
      } else {
        $$invalidate('tempEndDate', tempEndDate = newEndDate);
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
  };

  const onHover = ({ detail }) => {
    $$invalidate('hoverDate', hoverDate = detail);
  };

  const onPrevMonth = () => {
    $$invalidate('months', months = months.map(mo => subMonths(mo, 1)));
  };

  const onNextMonth = () => {
    $$invalidate('months', months = months.map(mo => addMonths(mo, 1)));
  };

  const onPageChange = ({ detail: { incrementAmount } }) => {
    if (incrementAmount > 0) {
      $$invalidate('months', months = months.map(mo => addMonths(mo, incrementAmount)));
    } else {
      const absIncrementAmount = Math.abs(incrementAmount);
      $$invalidate('months', months = months.map(mo => subMonths(mo, absIncrementAmount)));
    }
  };

  const onStartTimeChange = ({ detail }) => {
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
  };

  const onEndTimeChange = ({ detail }) => {
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
  };

	const writable_props = ['autoApply', 'dateFormat', 'monthIndicator', 'disabledDates', 'endDate', 'events', 'firstDayOfWeek', 'isoWeekNumbers', 'locale', 'maxDate', 'minDate', 'monthDropdown', 'monthFormat', 'numPages', 'rtl', 'singlePicker', 'startDate', 'timePicker', 'timePicker24Hour', 'minuteIncrement', 'secondIncrement', 'timePickerSeconds', 'prevIcon', 'nextIcon', 'today', 'weekGuides', 'weekNumbers', 'yearDropdown', 'applyBtnText', 'cancelBtnText', 'todayBtnText', 'todayBtn', 'resetViewBtnText', 'resetViewBtn', 'id'];
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
		if ('locale' in $$props) $$invalidate('locale', locale = $$props.locale);
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
		if ('applyBtnText' in $$props) $$invalidate('applyBtnText', applyBtnText = $$props.applyBtnText);
		if ('cancelBtnText' in $$props) $$invalidate('cancelBtnText', cancelBtnText = $$props.cancelBtnText);
		if ('todayBtnText' in $$props) $$invalidate('todayBtnText', todayBtnText = $$props.todayBtnText);
		if ('todayBtn' in $$props) $$invalidate('todayBtn', todayBtn = $$props.todayBtn);
		if ('resetViewBtnText' in $$props) $$invalidate('resetViewBtnText', resetViewBtnText = $$props.resetViewBtnText);
		if ('resetViewBtn' in $$props) $$invalidate('resetViewBtn', resetViewBtn = $$props.resetViewBtn);
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
	};

	let canApply, canResetView, maxWidth, months, pickerWidth, startDateReadout, endDateReadout;

	$$self.$$.update = ($$dirty = { hasSelection: 1, timePicker: 1, timePickerSeconds: 1, tempStartDate: 1, startDate: 1, tempEndDate: 1, endDate: 1, numPages: 1, today: 1, months: 1, pickerWidth: 1, hoverDate: 1, dateFormat: 1 }) => {
		if ($$dirty.hasSelection || $$dirty.timePicker || $$dirty.timePickerSeconds || $$dirty.tempStartDate || $$dirty.startDate || $$dirty.tempEndDate || $$dirty.endDate) { $$invalidate('canApply', canApply = () => {
        if (!hasSelection) {
          return false;
        }
    
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
		if ($$dirty.hasSelection || $$dirty.hoverDate || $$dirty.tempStartDate || $$dirty.dateFormat) { $$invalidate('startDateReadout', startDateReadout = () => {
        if (!hasSelection && isBefore(hoverDate, tempStartDate)) {
          return localeFormat(hoverDate, dateFormat);
        }
    
        return localeFormat(tempStartDate, dateFormat);
      }); }
		if ($$dirty.hasSelection || $$dirty.hoverDate || $$dirty.tempStartDate || $$dirty.dateFormat || $$dirty.tempEndDate) { $$invalidate('endDateReadout', endDateReadout = () => {
        if (!hasSelection) {
          if (isBefore(hoverDate, tempStartDate)) {
            return localeFormat(tempStartDate, dateFormat);
          }
    
          return localeFormat(hoverDate, dateFormat);
        }
    
        return localeFormat(tempEndDate, dateFormat);
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
		locale,
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
		applyBtnText,
		cancelBtnText,
		todayBtnText,
		todayBtn,
		resetViewBtnText,
		resetViewBtn,
		id,
		hoverDate,
		tempEndDate,
		tempStartDate,
		hasSelection,
		pageWidth,
		apply,
		goToToday,
		resetView,
		close,
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
		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["autoApply", "dateFormat", "monthIndicator", "disabledDates", "endDate", "events", "firstDayOfWeek", "isoWeekNumbers", "locale", "maxDate", "minDate", "monthDropdown", "monthFormat", "numPages", "rtl", "singlePicker", "startDate", "timePicker", "timePicker24Hour", "minuteIncrement", "secondIncrement", "timePickerSeconds", "prevIcon", "nextIcon", "today", "weekGuides", "weekNumbers", "yearDropdown", "applyBtnText", "cancelBtnText", "todayBtnText", "todayBtn", "resetViewBtnText", "resetViewBtn", "id"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.locale === undefined && !('locale' in props)) {
			console.warn("<SDateRangePicker> was created without expected prop 'locale'");
		}
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

	get applyBtnText() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set applyBtnText(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get cancelBtnText() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set cancelBtnText(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get todayBtnText() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set todayBtnText(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get todayBtn() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set todayBtn(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get resetViewBtnText() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set resetViewBtnText(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get resetViewBtn() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set resetViewBtn(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<SDateRangePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<SDateRangePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/App.svelte generated by Svelte v3.5.3 */

function create_fragment$7(ctx) {
	var current;

	var sdaterangepicker = new SDateRangePicker({
		props: {
		singlePicker: singlePicker,
		timePicker: true,
		monthDropdown: ctx.monthDropdown,
		yearDropdown: ctx.yearDropdown,
		resetViewBtn: ctx.resetViewBtn,
		todayBtn: ctx.todayBtn,
		numPages: ctx.numPages,
		locale: ctx.locale,
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
			if (changed.singlePicker) sdaterangepicker_changes.singlePicker = singlePicker;
			if (changed.monthDropdown) sdaterangepicker_changes.monthDropdown = ctx.monthDropdown;
			if (changed.yearDropdown) sdaterangepicker_changes.yearDropdown = ctx.yearDropdown;
			if (changed.resetViewBtn) sdaterangepicker_changes.resetViewBtn = ctx.resetViewBtn;
			if (changed.todayBtn) sdaterangepicker_changes.todayBtn = ctx.todayBtn;
			if (changed.numPages) sdaterangepicker_changes.numPages = ctx.numPages;
			if (changed.locale) sdaterangepicker_changes.locale = ctx.locale;
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

const singlePicker = false;

function instance$7($$self, $$props, $$invalidate) {
	

  const localesArray = Object.keys(locales).map(i => locales[i]);
  const locale =  undefined;
  let startDate =  startOfWeek(new Date());
  let endDate =  endOfWeek(new Date());
  let monthDropdown =  true;
  let yearDropdown =  true;
  let todayBtn =  true;
  let resetViewBtn =  true;
  let numPages =  2;

  function onApply({ detail }) {
    $$invalidate('startDate', startDate = detail.startDate);
    $$invalidate('endDate', endDate = detail.endDate);
    console.log("apply", detail);
  }

	return {
		locale,
		startDate,
		endDate,
		monthDropdown,
		yearDropdown,
		todayBtn,
		resetViewBtn,
		numPages,
		onApply
	};
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
