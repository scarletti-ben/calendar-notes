/**
 * Calendar widget
 * - Registers custom element `<calendar-widget>`
 * - Exports `CalendarWidget` class
 * - Exports `dateTools` utility object
 * 
 * ! Note: `SHADOW_CSS` relies on variables from `style.css`
 * 
 * @module calendar-widget
 * @author Ben Scarletti
 * @since 2025-07-31
 * @see {@link https://github.com/scarletti-ben}
 * @license MIT
 */

// < ======================================================
// < HTML Structure for Shadow Root
// < ======================================================

/**
 * Markup for shadow root
 * 
 * @type {string}
 */
const SHADOW_HTML = `

<div id="navigator">
    <div id="navigator-left" class="navigator-button" role="button" >&lt;</div>
    <span id="navigator-text"></span>
    <div id="navigator-right" class="navigator-button" role="button">&gt;</div>
</div>

<div id="weekday-row">
    <div class="cell weekday">Mo</div>
    <div class="cell weekday">Tu</div>
    <div class="cell weekday">We</div>
    <div class="cell weekday">Th</div>
    <div class="cell weekday">Fr</div>
    <div class="cell weekday">Sa</div>
    <div class="cell weekday">Su</div>
</div>

<div id="day-grid">
    ${'<div class="cell day">&#8203;</div>'.repeat(42)}
</div>

`.trim();

// < ======================================================
// < CSS Styling for Shadow Root
// < ======================================================

/**
 * Styling for shadow root
 * 
 * @type {string}
 */
const SHADOW_CSS = `

:host {
    display: inline-block;
    font-family: Consolas, monospace;
    border-radius: var(--half);
    box-sizing: border-box;
    overflow: hidden;
    font-size: 14px;
    background: var(--surface-weak);
    color: var(--foreground-weak);
    --bordering: 2px;
    border: var(--bordering) solid transparent;
}

* {
    box-sizing: border-box;
    line-height: 1.5rem;
}

#navigator {
    height: var(--more);
    padding: 0px 16px;
    display: flex;
    line-height: var(--more);
    justify-content: space-between;
    align-items: center;
    background: var(--surface-strong);
    border-bottom: var(--bordering) solid var(--surface-weak);
    user-select: none;
}

#navigator-text {
    cursor: pointer;
}

#navigator-text:hover {
    // box-shadow: 0 0 0 1px blue;
    color: var(--foreground-strong);
}

.navigator-button {
    background: none;
    border: none;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-size: var(--font-size);
    cursor: pointer;
    color: var(--foreground-weak);
    padding: 0px;
    margin: 0px;
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1.5rem;
    border-radius: 8px;
    // box-shadow: 0 0 0 1px red;
}

.navigator-button:hover {
    // box-shadow: 0 0 0 1px blue;
    color: var(--foreground-strong);
}

#weekday-row, #day-grid {
    display: grid;
    grid-template-columns: repeat(7, auto);
    gap: var(--bordering);
}

#weekday-row {
    border-bottom: var(--bordering) solid transparent;
}

.cell {
    width: 36px;
    height: 36px;
    text-align: center;
    line-height: 36px;
    box-sizing: border-box;
    border: 0;
    margin: 0;
    padding: 0;    
    user-select: none;
}

.weekday {
    background: var(--surface-strong);
    color: var(--foreground-weak);
}

.day {
    cursor: pointer;
    background: var(--surface-strong);
    color: var(--foreground-weak);
    cursor: pointer;
    position: relative;
}

.day.dimmed {
    color: var(--foreground-strong);
}

.day:hover {
    background: transparent;
    color: currentColor;
    box-shadow: inset 0 0 1px 1px currentColor;
}

.day.marked {
    box-shadow: inset 0 0 1px 2px var(--accent);
}

.day.today {
    // box-shadow: inset 0 0 1px 2px var(--accent);
    background: transparent;
    background: var(--foreground-weak);
    color: var(--surface-strong);
}

.day.starred:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border: 4px solid;
    border-color: var(--accent) var(--accent) transparent transparent;
}

`.trim();

// < ======================================================
// < Utility Object: dateTools
// < ======================================================

const dateTools = {

    /**
     * Generate an array of `Date` objects from a given date
     * - Uses the given date to generate a calendar grid
     * - Creates 42 dates (6 rows of 7 days)
     * - Starts from Monday (Mo-Su)
     * - Includes dates from the previous / next month
     *
     * @param {Date} date - The `Date` object to work with
     * @returns {Date[]} Array of 42 `Date` objects
     */
    getDateArray(date) {

        const firstDate = dateTools.cloneDate(date, { day: 1 });
        const firstIndex = firstDate.getDay();
        const mondayIndex = (firstIndex + 6) % 7;

        const dates = [];
        const start = 1 - mondayIndex;
        const end = start + 42;
        for (let day = start; day < end; day++) {
            const date = dateTools.cloneDate(firstDate, { day })
            dates.push(date);
        }
        return dates;

    },

    /**
     * Clone a `Date` object
     * 
     * @param {Date} date - Source date
     * @param {Object} [opts] - Optional changes to output date
     * @returns {Date} The cloned date
     */
    cloneDate(date, { day, month, year } = {}) {
        const output = new Date(date.getTime());
        if (year != null) output.setFullYear(year);
        if (month != null) output.setMonth(month);
        if (day != null) output.setDate(day);
        return output;
    },

    /**
     * Convert `Date` object to ordinal day string
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {string} Ordinal day string eg. '3rd'
     */
    toOrdinal(date) {
        const day = date.getDate();
        if (day > 3 && day < 21) return day + 'th';
        switch (day % 10) {
            case 1: return day + 'st';
            case 2: return day + 'nd';
            case 3: return day + 'rd';
            default: return day + 'th';
        }
    },

    /**
     * Convert `Date` object to `YYYY-MM-DD` string
     * - Does not convert to UTC+00:00
     * - Uses Canada for `YYYY-MM-DD` format
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {string} Shortened date string eg. '2025-08-03'
     */
    toShort(date) {
        return date.toLocaleDateString('en-CA');
    },

    /** 
     * Convert `Date` object to month index
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {number} The month index (0-11)
     */
    toMonthIndex(date) {
        return date.getMonth();
    },

    /** 
     * Convert `Date` object to month name
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {string} The month name eg' 'July'
     */
    toMonthName(date) {
        return date.toLocaleString('en-GB', { month: 'long' });
    },

    /** 
     * Convert `Date` object to day name
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {string} The day name eg. 'Monday'
     */
    toDayName(date) {
        return date.toLocaleString('en-GB', { weekday: 'long' });
    },
    /** 
     * Convert `Date` object to year number
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {number} The year number eg. 2025
     */
    toYear(date) {
        return date.getFullYear();
    },

    /** 
     * Convert `Date` object to pretty string
     * 
     * @param {Date} date - The `Date` object to convert
     * @returns {string} The pretty date eg. 'July 1st 2025'
     */
    toPretty(date) {
        const name = this.toDayName(date);
        const ordinal = this.toOrdinal(date);
        const month = this.toMonthName(date);
        const year = this.toYear(date);
        return `${name} ${ordinal} ${month} ${year}`
    },

    /** 
     * Check if two `Date` objects share the same date
     * 
     * @param {Date} d1 - The first `Date` object
     * @param {Date} d2 - The second `Date` object
     * @returns {boolean} True if same date
     */
    isSameDate(d1, d2) {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    },

    /** 
     * Check if a `Date` object is today
     * 
     * @param {Date} date - The `Date` object to check
     * @returns {boolean} True if today
     */
    isToday(date) {
        const today = new Date();
        return dateTools.isSameDate(date, today);
    }

}

// < ======================================================
// < Class: Calendar Widget
// < ======================================================

/**
 * Calendar Widget Custom HTML Element
 * - Displays a monthly calendar with navigation and date selection
 * 
 * @extends HTMLElement
 */
class CalendarWidget extends HTMLElement {

    /** @type {Date} `Date` object from last clicked day */
    dateChosen;

    /** @type {Date} `Date` object from today's date */
    dateToday;

    /** @type {HTMLDivElement} Navigator text element showing month / year */
    navigatorText;

    /** @type {HTMLDivElement} Left navigation button */
    navigatorLeft;

    /** @type {HTMLDivElement} Right navigation button */
    navigatorRight;

    /** @type {HTMLDivElement} Grid container for day cells */
    dayGrid;

    /** String array of dates that are starred
     * - Dates in the format YYYY-MM-DD
     * 
     * @type {string[]}
     */
    starredDates;

    /**
     * Callback fired when a day is clicked
     * 
     * @type {(date: Date, element: HTMLDivElement): void | null}
     */
    onDayClick = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `<style>${SHADOW_CSS}</style>` + SHADOW_HTML;
        this.starredDates = [];
        this.dateToday = new Date();
        this.dateChosen = new Date();
        this.dateDisplayed = new Date();
        this.navigatorText = this.shadowRoot.getElementById('navigator-text');
        this.navigatorLeft = this.shadowRoot.getElementById('navigator-left');
        this.navigatorRight = this.shadowRoot.getElementById('navigator-right');
        this.dayGrid = this.shadowRoot.getElementById('day-grid');
        this.setupListeners();
        this.updateDate(this.dateToday);
    }

    /**
     * Navigate to next or previous month
     * - Updates the calendar display
     * - Accepts any positive or negative number eg. +1 or -8
     * 
     * @param {number} change - Number of months to move (positive or negative)
     */
    navigateMonth(change) {
        const currentMonth = this.dateDisplayed.getMonth();
        this.dateDisplayed.setMonth(currentMonth + change);
        this.updateDate(this.dateDisplayed);
    }

    /**
     * Set up event listeners
     * - Delegates click events within `this.shadowRoot`
     */
    setupListeners() {
        this.shadowRoot.addEventListener('click', (event) => {
            const target = event.target;
            if (!target) return;
            if (this.navigatorText.contains(target)) {
                this.updateDate(this.dateToday);
            } else if (this.navigatorLeft.contains(target)) {
                this.navigateMonth(-1);
            } else if (this.navigatorRight.contains(target)) {
                this.navigateMonth(+1);
            } else if (this.dayGrid.contains(target)) {
                const element = target.closest('.day');
                if (!element) return;
                if (this.onDayClick) {
                    this.dateChosen = new Date(element.dataset.date);
                    this.onDayClick(this.dateChosen, element);
                    setTimeout(() => {
                        this.updateDate(this.dateChosen);
                    }, 500);
                }
            }
        });
    }

    /**
     * Reset class list for a given day element
     * 
     * @param {HTMLDivElement} day The day element to reset
     */
    resetDayClasses(day) {
        day.classList.remove('dimmed', 'marked', 'starred', 'today');
    }

    /**
     * Update the current month and re-render the calendar
     * - Updates days in the grid, and navigator text
     * 
     * @param {Date} date - The date to use for date array
     */
    updateDate(date) {

        const dateObjects = dateTools.getDateArray(date);
        const dayElements = this.dayGrid.querySelectorAll('.day');

        const monthName = dateTools.toMonthName(date);
        const year = dateTools.toYear(date);
        this.navigatorText.textContent = `${monthName} ${year}`;

        for (const [index, dateObject] of dateObjects.entries()) {
            const dayElement = dayElements[index];
            this.resetDayClasses(dayElement);
            if (dateObject.getMonth() != date.getMonth()) {
                dayElement.classList.add('dimmed');
            } else if (dateTools.isToday(dateObject)) {
                dayElement.classList.add('today');
            } else if (dateTools.isSameDate(dateObject, this.dateChosen)) {
                dayElement.classList.add('marked');
            } else if (this.shouldStar(dateObject)) {
                dayElement.classList.add('starred');
            }
            dayElement.textContent = dateObject.getDate();
            dayElement.dataset.date = dateTools.toShort(dateObject);
        }

    }

    /**
     * Check if a date is in the starred dates array
     * 
     * @param {Date} date - The date to check against starred dates
     */
    shouldStar(date) {
        const shortDate = dateTools.toShort(date);
        return this.starredDates.includes(shortDate);
    }

    /**
     * Toggle the "marked" class on a given day element
     * 
     * @param {HTMLDivElement} day The day element to mark
     */
    toggleDayMarked(day) {
        day.classList.toggle('marked');
    }

}

// < ======================================================
// < Custom Element Registration
// < ======================================================

customElements.define("calendar-widget", CalendarWidget);

// < ======================================================
// < Exports
// < ======================================================

export {
    CalendarWidget,
    dateTools
}