/**
 * Wrapper for `Firestore` database access
 * 
 * @module firestore-wrapper
 * @author Ben Scarletti
 * @since 2025-12-09
 * @see {@link https://github.com/scarletti-ben}
 * @license MIT
 */

// < ======================================================
// < Imports
// < ======================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// < ======================================================
// < FirestoreWrapper Class
// < ======================================================

/** 
 * Wrapper for `Firestore` database access
 * - Handles login via Google OAuth 2.0
 * - Write and read data at `users/{user}/apps/{application}/documents/${key}`
 */
class FirestoreWrapper {

    /**
     * @param {string} name - Name of the app for database paths
     * @param {object} config - The `firebaseConfig` object
     */
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.app = null;
        this.auth = null;
        this.db = null;
        this.user = null;
    }

    /**
     * Wrapper method for `Firebase` `onAuthStateChanged`
     * 
     * @param {(user: User) => void} func - Callback function with user argument
     */
    onUserChange(func) {
        onAuthStateChanged(this.auth, func);
    };

    /**
     * Initialise the `FirestoreWrapper` instance
     * - Updates `this.user` if an authenticated user is found
     * - Enables offline persistence via `IndexedDB`
     */
    async init() {
        this.app = initializeApp(this.config, this.name);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        await enableIndexedDbPersistence(this.db).catch(error => {
            console.warn('Error enabling offline persistence:', error);
        });

        // Add a listener to authentication changes, updates `this.user`
        // ! Fires on on page load as well as on authentication change
        this.onUserChange((user) => {
            this.user = user;
        });

    }

    /**
     * Login function to authenticate user via `Google OAuth 2.0`
     * 
     * @returns {UserCredential} `Firestore` user credential object
     */
    async login() {
        if (this.user) return this.user;
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(this.auth, provider);
        return result.user;
    }

    /**
     * Logout function to remove authenticated user
     */
    async logout() {
        if (!this.user) return;
        await signOut(this.auth);
    }

    /**
     * Authentication check to see if there is a currently authenticated user
     * 
     * @throws If there is no currently authenticated user
     */
    async authCheck() {
        if (!this.user) throw new Error('User not authenticated');
    }

    /**
     * Generate a `Firestore` document reference for a given key
     * 
     * @param {string} key The key or name for the document
     * @returns {DocumentReference} The `Firestore` document reference
     * @throws If there is no currently authenticated user
     */
    reference(key) {
        this.authCheck();
        const path = `users/${this.user.uid}/apps/${this.name}/documents/${key}`;
        const reference = doc(this.db, path);
        return reference;
    }

    /**
     * Write data to a `Firestore` document
     * 
     * @param {string} key - The document key
     * @param {Object} data - The data to write to the document
     * @param {boolean} replace - Option to replace data, otherwise merge [true]
     * @returns {Promise<void>}
     */
    async write(key, data, replace = true) {
        const reference = this.reference(key);
        await setDoc(reference, data, { merge: !replace });
    }

    /**
     * Read data from a `Firestore` document
     * 
     * @param {string} key - The document key
     * @returns {Promise<Object|null>} The document data, or null if the key does not exist
     */
    async read(key) {
        const reference = this.reference(key);
        const snap = await getDoc(reference);
        return snap.exists() ? snap.data() : null;
    }

}

// > ======================================================
// > Exports
// > ======================================================

export { 
    FirestoreWrapper
};