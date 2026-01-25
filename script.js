// < ======================================================
// < Imports
// < ======================================================

import * as tools from "./modules/site-tools.js";

import {
    CalendarWidget,
    dateTools
} from "./modules/calendar-widget.js";

import {
    FirestoreWrapper
} from "./modules/firestore-wrapper.js";

import {
    encryptor
} from "./modules/encryptor.js";

import {
    ProfileMenu
} from "./modules/profile-menu.js";

// < ======================================================
// < Declarations
// < ======================================================

/**
 * Application identifier string
 * @type {string}
 */
const APP_NAME = '2025-12-11_calendar-notes';

/**
 * Firebase configuration object
 * 
 * @type {Object}
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Domain for Firebase Authentication
 * @property {string} projectId - Unique identifier for the Firebase project
 */
let firebaseConfig;

/**
 * Global variable for `CalendarWidget` instance
 * 
 * @type {CalendarWidget}
 */
let calendar;

/**
 * Global variable for `FirestoreWrapper` instance
 * 
 * @type {FirestoreWrapper}
 */
let firestore;

/**
 * Global variable for theme `Cycle` instance
 * 
 * @type {tools.Cycle}
 */
let themeCycle;

/**
 * Preferences object for user settings
 * @type {{ [key: string]: any }}
 */
const preferences = {
    debugging: false,
    theme: ''
};

/**
 * Notes object for user notes
 * - Keys in the format `YYYY-MM-DD`
 * @type {{ [key: string]: string }}
 */
const notes = {};

/**
 * Today's date object
 * @type {Date}
 */
const today = new Date();

// < ======================================================
// < Element Queries
// < ======================================================

/** 
 * Lookup object of DOM elements
 */
const queries = {

    /** @type {HTMLDivElement} */
    page: document.getElementById('page'),

    /** @type {HTMLDivElement} */
    footer: document.getElementById('footer'),

    /** @type {HTMLTextAreaElement} */
    textarea: document.getElementById('textarea'),

    /** @type {HTMLImageElement} */
    profile: document.getElementById('profile'),

    /** @type {HTMLDivElement} */
    date: document.getElementById('footer-date'),

    /** @type {HTMLDivElement} */
    modal: document.getElementById('modal'),

    /** @type {HTMLDivElement} */
    modalContent: document.getElementById('modal-content'),

    /** @type {ProfileMenu} */
    menu: document.querySelector('profile-menu')

}

// < ======================================================
// < Functions
// < ======================================================

/**
 * Load user preferences from `localStorage`
 */
function loadPreferences() {
    const key = APP_NAME + "_preferences";
    const data = localStorage.getItem(key);
    if (data) {
        const storedPreferences = JSON.parse(data);
        Object.assign(preferences, storedPreferences);
        console.log('User preferences loaded');
    } else {
        console.log('No user preferences found');
    }
}

/**
 * Save user preferences to `localStorage`
 */
function savePreferences() {
    const key = APP_NAME + "_preferences";
    const data = JSON.stringify(preferences);
    localStorage.setItem(key, data);
    console.log('User preferences saved');
}

/**
 * Temporary `localStorage` backup function, until bugs are fixed
 */
async function _backupNotes() {
    const suffix = tools.dateToString(new Date());
    const key = APP_NAME + `_backup_${suffix}`;
    const data = JSON.stringify(notes);
    const enc = await tools.encryptor.obfuscateText(data);
    localStorage.setItem(key, enc);
    console.log('Backup created');
}

/**
 * Save user notes to `firestore`
 */
async function saveNotes() {

    // POSTIT - Temporary backup function
    _backupNotes();

    try {
        const date = queries.date.dataset.date;
        const text = queries.textarea.value;
        if (text === "") {
            delete notes[date];

        } else {
            notes[date] = text;
        }
        await firestore.write('notes', notes);
        console.log('User notes saved: ', notes);
        const usedDates = Object.keys(notes);
        calendar.starredDates.length = 0;
        calendar.starredDates.push(...usedDates);
        calendar.updateDate(new Date());
        tools.flashElement(queries.footer, 'green');

    } catch (error) {
        console.log('Error when saving user notes');
        tools.flashElement(queries.footer, 'red');
    }
}

/**
 * Load user notes from `firestore`
 */
async function loadNotes() {
    try {
        const storedNotes = await firestore.read('notes');
        if (storedNotes) {
            Object.assign(notes, storedNotes);
            queries.textarea.value = notes[queries.date.dataset.date] || "";
            console.log('User notes loaded');
        } else {
            console.log('No user notes found');
            tools.flashElement(queries.footer, 'orange');
        }
        tools.flashElement(queries.footer, 'green');

        const usedDates = Object.keys(notes);
        calendar.starredDates.length = 0;
        calendar.starredDates.push(...usedDates);
        calendar.updateDate(new Date());

    } catch (error) {
        console.log('Error when loading user notes', error);
        tools.flashElement(queries.footer, 'red');
    }
}

/**
 * Switch to the next theme, and update user preferences
 */
function nextTheme() {
    const theme = themeCycle.next();
    document.documentElement.dataset.theme = theme;
    preferences.theme = theme;
    savePreferences();
}

/**
 * Download notes as `notes.json`
 */
function downloadData() {
    tools.downloadData(notes, 'notes.json');
}

/**
 * Search through notes for a string
 * 
 * @param {string} searchTerm - String to search for
 * @param {boolean} caseSensitive - Whether search should be case sensitive (default: false)
 * @returns {Array} Array of result objects
 */
function searchNotes(searchTerm, caseSensitive = false) {

    const results = [];
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    for (const [date, noteText] of Object.entries(notes)) {
        if (!noteText) continue;

        const lines = noteText.split('\n');
        lines.forEach((line, index) => {
            const searchLine = caseSensitive ? line : line.toLowerCase();
            if (searchLine.includes(term)) {
                results.push({
                    date,
                    lineNumber: index + 1,
                    line: line,
                    lineBefore: index > 0 ? lines[index - 1] : undefined,
                    lineAfter: index < lines.length - 1 ? lines[index + 1] : undefined
                });
            }
        });
    }

    return results;

}

// ~ ======================================================
// ~ Entry Point
// ~ ======================================================

// ? Run callback when all resources have loaded
window.addEventListener('load', async () => {

    // < ========================
    // < Initial Setup
    // < ========================

    // Deobfuscate firebaseConfig
    const cryptoKey = await encryptor.deriveKey('password', 'salt');
    const encryptedString = 'nDM73vJzLdOZJv+mOCkM/Xf/jvXLtGxNH25bYxpvqzAvcycZl+rF+i+z6hIXAcwmyp+5Q5ytvs6fhdxcmTMbBAke2eBLdS6XeQGgt5QRJUM2RvJ7+lqBrkZ0rDWmNvZNOsP3jMHmZFM5eM4I2K9JUsjqnQw90Gw5doB8HirGwMcuxVNmzsCTW2L6ZTYKBssEvGuGHqg=,Lk8cGzr8NXnoq2/r';
    const decryptedString = await encryptor.decrypt(encryptedString, cryptoKey);
    firebaseConfig = JSON.parse(decryptedString);

    // Load preferences from localStorage
    loadPreferences();

    // Create a cycle of valid themes
    themeCycle = new tools.Cycle(tools.getThemes());

    // Set current theme from user preferences
    themeCycle.value = preferences.theme;
    document.documentElement.dataset.theme = preferences.theme;

    // Create a Calendar widget and add it to the modal
    calendar = new CalendarWidget();
    queries.modalContent.appendChild(calendar);
    calendar.updateDate(today);

    // Update current date text and `data-date` tag
    queries.date.textContent = dateTools.toPretty(today);
    queries.date.dataset.date = dateTools.toShort(today);

    // < ========================
    // < Firestore Setup
    // < ========================

    // Create and initialise a `FirestoreWrapper` instance
    firestore = new FirestoreWrapper(APP_NAME, firebaseConfig);
    await firestore.init();

    // < ========================
    // < Menu Setup
    // < ========================

    // Add save button to main menu
    queries.menu.addItem('save', 'Save', 'save', async () => {

        // > Action: Save and upload notes
        saveNotes();

    });

    // Add load button to main menu
    queries.menu.addItem('load', 'Load', 'cloud-download', async () => {

        // > Action: Load notes from cloud
        // POSTIT - Is this deleting data?
        alert("Disabled until fixed");
        // loadNotes();

    });

    // Add search button to main menu
    queries.menu.addItem('search', 'Search', 'scan-search', async () => {

        // > Action: Search for string
        const str = prompt("Search");
        if (!str || str === '') return;
        const restult = searchNotes(str);
        console.log(restult);

    });

    // Add download button to main menu
    queries.menu.addItem('download', 'Download', 'download', async () => {

        // > Action: Download notes to a .json file
        downloadData();

    });

    // Add theme switch button to main menu
    queries.menu.addItem('theme', 'Switch theme', 'palette', async () => {

        // > Action: Cycle theme
        nextTheme();

    });

    // Add fillscreen toggle button to main menu
    queries.menu.addItem('fullscreen', 'Toggle full screen', 'fullscreen', async () => {

        // > Action: Toggle full screen
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(error => {
                console.error(`Error attempting to enable fullscreen: ${error.message}`);
            });
        } else {
            document.exitFullscreen();
        }

    });

    // Add log in button to main menu
    queries.menu.addItem('login', 'Log in', 'log-in', async () => {

        // > Action: Log in
        await firestore.login();

    });

    // Add log out button to main menu
    queries.menu.addItem('logout', 'Log out', 'log-out', async () => {

        // > Action: Log out
        await firestore.logout();

    });

    // < ========================
    // < Document Listeners
    // < ========================

    // Add keydown listener to the DOM
    document.addEventListener('keydown', (event) => {

        // ~ Hotkey: Control + Alt + D
        // > Action: Toggle 'debugging' class on body element
        if (event.ctrlKey && event.altKey && event.key === 'd') {
            event.preventDefault();
            document.body.classList.toggle('debugging');
        }

        // ~ Hotkey: Control + S
        // > Action: Save data
        else if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveNotes();
        }

        // ~ Hotkey: Control + Alt + N
        // > Action: Log notes to console
        else if (event.ctrlKey && event.altKey && event.key === 'n') {
            event.preventDefault();
            console.log(notes);
            alert('Notes logged to console');

        }

    });

    // Add mousedown listener to the DOM
    document.addEventListener('mousedown', (event) => {

        // ~ Button: Middle mouse
        // > Action: Cycle theme
        if (event.button === 1) {
            event.preventDefault();
            nextTheme();
        };

    });

    // ^ ========================
    // ^ Other Listeners
    // ^ ========================

    // Add listener for firestore user authentication changes
    firestore.onUserChange(async (user) => {
        if (user) {
            console.log('User logged in', user.email);
            queries.profile.src = user.photoURL;
            queries.textarea.disabled = false;
            queries.menu.setEmail(user.email);
            queries.menu.hideItem('login');
            queries.menu.showItem('logout');

            // > Action: Load notes
            loadNotes();

        } else {
            console.log('User logged out');
            queries.textarea.disabled = true;
            queries.menu.setEmail();
            queries.profile.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
            queries.menu.showItem('login');
            queries.menu.hideItem('logout');

        }

    });

    // Add click listener to the date text
    queries.date.addEventListener('click', () => {

        // > Action: Open the modal
        queries.modal.classList.toggle('shown', true);

    });

    // Add click listener to modal
    queries.modal.addEventListener('click', (event) => {

        // ~ Trigger: Click outside of the modal
        // > Action: Close the modal
        if (!event.target.closest('#modal-content')) {
            queries.modal.classList.toggle('shown', false);
        }

    });

    // Add click listener to profile image
    queries.profile.addEventListener('click', async (event) => {

        // > Action: Open the menu
        queries.menu.open();

    });

    // Set the click listener for the calendar widget
    calendar.onDayClick = async (date) => {

        // Update footer date
        queries.date.textContent = dateTools.toPretty(date);
        queries.date.dataset.date = dateTools.toShort(date);

        // Hide the modal
        queries.modal.classList.toggle('shown', false);

        // Load text for the chosen date
        {
            const date = queries.date.dataset.date;
            const text = notes[date];
            queries.textarea.value = text || "";
        }

    }

    // < ========================
    // < Final Touches
    // < ========================

    // Show the page element
    queries.page.style.display = '';

});