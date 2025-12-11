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
const firebaseConfig = {
    apiKey: "AIzaSyAx5VIksX5JeW2hk5FDf_8rhyBa6CibH84",
    authDomain: "mainframe-storage.firebaseapp.com",
    projectId: "mainframe-storage"
};

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

    /** @type {HTMLButtonElement} */
    save: document.getElementById('save-button'),

    /** @type {HTMLDivElement} */
    modal: document.getElementById('modal'),

    /** @type {HTMLDivElement} */
    modalContent: document.getElementById('modal-content'),

}

/** 
 * Lookup object of file paths
 */
const paths = {

    lucide: './assets/svg/lucide.svg',
    profile: './assets/jpg/profile.jpg'

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
 * Load notes from `localStorage`
 */
function loadNotes() {
    const key = APP_NAME + "_notes";
    const data = localStorage.getItem(key);
    if (data) {
        const storedNotes = JSON.parse(data);
        Object.assign(notes, storedNotes);
        console.log('User notes loaded');
    } else {
        console.log('No user notes found');
    }
}

/**
 * Save user notes to `localStorage`
 */
function saveNotes() {
    const key = APP_NAME + "_notes";
    const data = JSON.stringify(notes);
    localStorage.setItem(key, data);
    console.log('User notes saved');
}

// ~ ======================================================
// ~ Entry Point
// ~ ======================================================

// ? Run callback when all resources have loaded
window.addEventListener('load', async () => {

    // < ========================
    // < Initial Setup
    // < ========================

    // Fetch SVG spritesheet and add it to the DOM
    await tools.fetchSpritesheet(paths.lucide);

    // Load preferences from localStorage
    loadPreferences();

    // Load notes from localStorage
    loadNotes();

    // Create a cycle of valid themes
    const themeNames = tools.getThemes();
    const themeCycle = new tools.Cycle(themeNames);

    // Set current theme from user preferences
    themeCycle.value = preferences.theme;
    document.body.dataset.theme = preferences.theme;

    // Create a Calendar widget and add it to the modal
    const calendar = new CalendarWidget();
    queries.modalContent.appendChild(calendar);
    const usedDates = Object.keys(notes);
    calendar.starredDates.push(...usedDates);
    calendar.updateDate(today);

    // Update current date text and `data-date` tag
    queries.date.textContent = dateTools.toPretty(today);
    queries.date.dataset.date = dateTools.toShort(today);

    // Load saved text for today's date
    queries.textarea.value = notes[queries.date.dataset.date] || "";

    // < ========================
    // < Firestore Setup
    // < ========================

    // Create and initialise a `FirestoreWrapper` instance
    const firestore = new FirestoreWrapper(APP_NAME, firebaseConfig);
    await firestore.init();

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
            const date = queries.date.dataset.date;
            const text = queries.textarea.value;
            if (text === "") {
                delete notes[date];
            } else {
                notes[date] = text;
            }
            tools.flashElement(queries.footer, 'green');
            calendar.starredDates.push(date);
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
            const theme = themeCycle.next();
            document.body.dataset.theme = theme;
            preferences.theme = theme;
            savePreferences();
        };

    });

    // ^ ========================
    // ^ Other Listeners
    // ^ ========================

    // Add listener for firestore user authentication changes
    firestore.onUserChange((user) => {

        if (user) {
            console.log('User logged in', user.email);
            queries.textarea.disabled = false;

        } else {
            console.log('User logged out');
            queries.textarea.disabled = true;
        }
        
    });

    // Add click listener to the save button
    queries.save.addEventListener('click', async () => {

        // > Action: Upload notes
        try {
            await firestore.write('notes', notes);
            tools.flashElement(queries.footer, 'green');
        } catch (error) {
            console.log('Error when saving notes');
            tools.flashElement(queries.footer, 'red');
        }
        
    })

    // Add click listener to the date text
    queries.date.addEventListener('click', () => {

        // > Action: Open the modal
        queries.modal.classList.toggle('shown', true);

    })

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

        // > Action: Sign in
        await firestore.login();

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