/**
 * ProfileMenu custom element
 * - Registers custom element `<profile-menu>`
 * - Exports `ProfileMenu` class
 * 
 * ! Note: `SHADOW_HTML` relies on icon ids from `lucide.svg`
 * ! Note: `SHADOW_CSS` relies on variables from `style.css`
 * 
 * @module profile-menu
 * @author Ben Scarletti
 * @since 2025-12-16
 * @see {@link https://github.com/scarletti-ben}
 * @license MIT
 */

// < ======================================================
// < URL
// < ======================================================

/**
 * URL used for SVG icon references
 * 
 * @type {string}
 */
const svgURL = `assets/svg/lucide.svg`;

// < ======================================================
// < Shadow Root HTML Structure
// < ======================================================

/**
 * Markup for shadow root
 * 
 * @type {string}
 */
const SHADOW_HTML = `        

<div id="backdrop"></div>

<div id="menu">

    <div id="email"></div>

</div>

`;

// < ======================================================
// < Shadow Root CSS Styling
// < ======================================================

/**
 * Styling for shadow root
 * 
 * @type {string}
 */
const SHADOW_CSS = `

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:host {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    --c1: #2a2a2a;
    --c2: #3a3a3a;
    --c3: #999;
    --c4: #e0e0e0;
}

.hidden {
  display: none !important;
}

#backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 999;
}

#backdrop.open {
    opacity: 1;
    pointer-events: all;
}

#menu {
    min-width: 256px;
    height: auto;
    padding: 8px;
    position: fixed;
    bottom: 60px;
    left: 10px;
    transform: scale(0.95) translateY(10px);
    background: var(--c1);
    opacity: 0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    transition: all 0.2s;
    z-index: 1000;
}

#menu.open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
}

#email {
    padding: 12px 16px;
    color: var(--c3);
    font-size: 13px;
    border-bottom: 1px solid var(--c2);
    margin-bottom: 4px;
}

.menu-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--c4);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
}

.menu-item:hover {
    background: var(--surface-weak);
}

.icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.separator {
    width: auto;
    height: 1px;
    background: var(--c2);
    margin: 4px 0;
}

`;

// < ======================================================
// < Class: Profile Menu
// < ======================================================

/**
 * Custom element `<profile-menu>`
 * 
 * @extends HTMLElement
 */
class ProfileMenu extends HTMLElement {

    /** @type {HTMLDivElement} Menu container element */
    menu;

    /** @type {HTMLDivElement} Backdrop overlay that blurs background */
    backdrop;

    /** @type {boolean} Current menu state */
    isOpen = false;

    /** @type {Object.<string, Function>} Record of menu item callbacks */
    callbacks = {};

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `<style>${SHADOW_CSS}</style>` + SHADOW_HTML;
        this.menu = this.shadowRoot.getElementById('menu');
        this.backdrop = this.shadowRoot.getElementById('backdrop');
        this.setEmail();
        this.setupListeners();
    }

    /**
     * Add a menu item `<div class="menu-item">`
     * 
     * @param {string} name Name for the menu action for `data-action`
     * @param {string} text Text to show in the menu
     * @param {string} icon Icon reference id
     * @param {() => void} callback - Function to call when clicked
     * @returns {HTMLDivElement} The `<div class="menu-item">` element
     */
    addItem(name, text, icon, callback) {
        const html = `
            <div class="menu-item" data-action="${name}">
                <svg class="icon">
                    <use href="${svgURL}#${icon}"></use>
                </svg>
                <span>${text}</span>
            </div>
        `;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const item = wrapper.firstElementChild;
        this.menu.appendChild(item);
        this.on(name, callback);
        return item;
    }

    /**
     * Add a menu separator `<div class="separator">`
     */
    addSeparator() {
        const html = `<div class="separator"></div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const separator = wrapper.firstElementChild;
        this.menu.appendChild(separator);
    }

    /**
     * Set up event listeners for menu interaction
     * - Clicking the backdrop closes the menu
     * - Clicking a menu item triggers a callback
     */
    setupListeners() {
        this.backdrop.addEventListener('click', () => this.close());
        this.menu.addEventListener('click', (event) => {
            const element = event.target.closest('[data-action]');
            if (!element) return;
            const action = element.dataset.action;
            if (this.callbacks[action]) {
                this.callbacks[action]();
            } else {
                alert(`No action implemented for ${action}`);
            }
            this.close();
        });
    }

    /**
     * Open the menu
     */
    open() {
        this.isOpen = true;
        this.menu.classList.add('open');
        this.backdrop.classList.add('open');
    }

    /**
     * Close the menu
     */
    close() {
        this.isOpen = false;
        this.menu.classList.remove('open');
        this.backdrop.classList.remove('open');
    }

    /**
     * Toggle menu open or closed
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    /**
     * Hide menu item via `hidden` class
     * 
     * @param {string} name Name of the menu item in `data-action`
     */
    hideItem(name) {
        const item = this.menu.querySelector(`[data-action="${name}"]`);
        if (!item) return;
        item.classList.add('hidden');
    }

    /**
     * Show menu item via `hidden` class
     * 
     * @param {string} name Name of the menu item in `data-action`
     */
    showItem(name) {
        const item = this.menu.querySelector(`[data-action="${name}"]`);
        if (!item) return;
        item.classList.remove('hidden');
    }

    /**
     * Set the email address displayed at the top of the menu
     * - Sets to default if `email` not provided
     * 
     * @param {string} [email] - Email address to display
     */
    setEmail(email) {
        if (!email) email = "Not signed in";
        this.shadowRoot.getElementById('email').textContent = email;
    }

    /**
     * Register callback to run when you click a menu item
     * 
     * @param {string} action - Action name
     * @param {() => void} callback - Function to call when clicked
     */
    on(action, callback) {
        this.callbacks[action] = callback;
    }

};

// < ======================================================
// < Custom Element Registration
// < ======================================================

customElements.define("profile-menu", ProfileMenu);

// < ======================================================
// < Exports
// < ======================================================

export {
    ProfileMenu
}