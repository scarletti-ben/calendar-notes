/**
 * Encryption class using `Web Crypto API`
 * - Exports `Encryptor` class
 * 
 * @module encryptor
 * @author Ben Scarletti
 * @since 2025-08-16
 * @see {@link https://github.com/scarletti-ben}
 * @license MIT
 */

// < ======================================================
// < Encryptor Class
// < ======================================================

/** Utility class to handle encryption */
class Encryptor {

    /** @type {CryptoKey} */
    key;

    /**
     * Sets key, or returns currently set key
     * @returns {Promise<CryptoKey>} The CryptoKey
     */
    async ensureKey() {
        if (!this.key) {
            const password = prompt('Enter password:');
            const salt = prompt('Enter salt:');
            this.key = await this.createKey(password, salt);
        }
        return this.key;
    }

    /**
     * Convert a Base64-encoded string to an ArrayBuffer
     * @param {string} base64String - The Base64-encoded string
     * @returns {ArrayBuffer} The ArrayBuffer
     */
    _base64ToArrayBuffer(base64String) {
        const binaryString = window.atob(base64String);
        const intArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            intArray[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = intArray.buffer;
        return arrayBuffer;
    }

    /**
     * Convert a buffer to a Base64-encoded string
     * @param {ArrayBuffer | Uint8Array} buffer - The buffer
     * @returns {string} The Base64-encoded string
     */
    _bufferToBase64(buffer) {
        let binaryString = '';
        const intArray = new Uint8Array(buffer);
        const len = intArray.byteLength;
        for (let i = 0; i < len; i++) {
            binaryString += String.fromCharCode(intArray[i]);
        }
        const base64String = window.btoa(binaryString)
        return base64String;
    }

    /**
     * Derive cryptographic key using PBKDF2 from a given password and salt
     * @param {string} password - The password to derive the key from
     * @param {string} salt - The salt to derive the key from
     * @returns {Promise<CryptoKey>} The derived CryptoKey object
     */
    async createKey(password, salt) {

        // > Convert password and salt to int array
        const passwordIntArray = new TextEncoder().encode(password);
        const saltIntArray = new TextEncoder().encode(salt);

        let keyMaterial;
        {
            // > Define importKey arguments
            const format = "raw";
            const algorithm = { name: "PBKDF2" };
            const extractable = false;
            const keyUsages = ["deriveKey"]

            // > Import key material to create a CryptoKey object
            keyMaterial = await window.crypto.subtle.importKey(
                format,
                passwordIntArray,
                algorithm,
                extractable,
                keyUsages
            );
        }

        let cryptoKey;
        {
            // > Define deriveKey arguments
            const algorithm = {
                name: "PBKDF2",
                salt: saltIntArray,
                iterations: 100000,
                hash: "SHA-256"
            };
            const derivedKeyType = { name: "AES-GCM", length: 256 };
            const extractable = false;
            const keyUsages = ["encrypt", "decrypt"];

            // > Derive the key using the given arguments
            cryptoKey = await window.crypto.subtle.deriveKey(
                algorithm,
                keyMaterial,
                derivedKeyType,
                extractable,
                keyUsages
            );

        }

        return cryptoKey;

    }

    /**
     * Derive cryptographic key using PBKDF2 from a given password and salt
     * @param {string} password - The password to derive the key from
     * @param {string} salt - The salt to derive the key from
     */
    async setKey(password, salt) {
        this.key = await this.createKey(password, salt);
    }

    /**
     * Encrypt string using AES-GCM, returning a single cipher data string
     * @param {string} str - The string to encrypt
     * @returns {Promise<string>} The ciphertext and iv as a comma-separated Base64-encoded string
     */
    async encrypt(str) {
        await this.ensureKey();

        // > Convert string to Uint8Array (byte array)
        const stringByteArray = new TextEncoder().encode(str);

        // > Generate random Uint8Array for the initialisation vector
        const ivIntArray = window.crypto.getRandomValues(new Uint8Array(12));

        // > Encrypt to a ciphertext ArrayBuffer using the given arguments
        const ciphertextArrayBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: ivIntArray
            },
            this.key,
            stringByteArray
        );

        // > Encode ciphertext and iv buffers to Base64 strings
        const ciphertext64 = this._bufferToBase64(ciphertextArrayBuffer);
        const iv64 = this._bufferToBase64(ivIntArray);

        // > Return comma-separated string of ciphertext and iv
        const cipherData = ciphertext64 + ',' + iv64
        return cipherData;

    }

    /**
     * Decrypt Base64 cipherData using AES-GCM, returning original string
     * @param {string} cipherData - Base64-encoded ciphertext and iv as one comma-separated string
     * @returns {Promise<string>} The decrypted string
     */
    async decrypt(cipherData) {
        await this.ensureKey();

        // > Split the comma-separated string
        const [ciphertext64, iv64] = cipherData.split(',');

        // > Convert the Base64 ciphertext and iv back to ArrayBuffers
        const ciphertextArrayBuffer = this._base64ToArrayBuffer(ciphertext64);
        const ivArrayBuffer = this._base64ToArrayBuffer(iv64);

        // > Decrypt to original string ArrayBuffer
        const stringArrayBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivArrayBuffer
            },
            this.key,
            ciphertextArrayBuffer
        );

        // > Decode string ArrayBuffer to string and return
        const str = new TextDecoder().decode(stringArrayBuffer);
        return str;

    }

}

// > ======================================================
// > Exports
// > ======================================================

export { Encryptor }