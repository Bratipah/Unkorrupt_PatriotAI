/** @module AuthClient */
import { AnonymousIdentity, } from '@dfinity/agent';
import { Delegation, DelegationChain, isDelegationValid, DelegationIdentity, Ed25519KeyIdentity, ECDSAKeyIdentity, PartialDelegationIdentity, } from '@dfinity/identity';
import { IdleManager } from './idleManager';
import { IdbStorage, isBrowser, KEY_STORAGE_DELEGATION, KEY_STORAGE_KEY, KEY_VECTOR, LocalStorage, } from './storage';
export { IdbStorage, LocalStorage, KEY_STORAGE_DELEGATION, KEY_STORAGE_KEY } from './storage';
export { IdbKeyVal } from './db';
const IDENTITY_PROVIDER_DEFAULT = 'https://identity.ic0.app';
const IDENTITY_PROVIDER_ENDPOINT = '#authorize';
const ECDSA_KEY_LABEL = 'ECDSA';
const ED25519_KEY_LABEL = 'Ed25519';
const INTERRUPT_CHECK_INTERVAL = 500;
export const ERROR_USER_INTERRUPT = 'UserInterrupt';
export * from './idleManager';
/**
 * Tool to manage authentication and identity
 * @see {@link AuthClient}
 */
export class AuthClient {
    constructor(_identity, _key, _chain, _storage, idleManager, _createOptions, 
    // A handle on the IdP window.
    _idpWindow, 
    // The event handler for processing events from the IdP.
    _eventHandler) {
        this._identity = _identity;
        this._key = _key;
        this._chain = _chain;
        this._storage = _storage;
        this.idleManager = idleManager;
        this._createOptions = _createOptions;
        this._idpWindow = _idpWindow;
        this._eventHandler = _eventHandler;
        this._registerDefaultIdleCallback();
    }
    /**
     * Create an AuthClient to manage authentication and identity
     * @constructs
     * @param {AuthClientCreateOptions} options - Options for creating an {@link AuthClient}
     * @see {@link AuthClientCreateOptions}
     * @param options.identity Optional Identity to use as the base
     * @see {@link SignIdentity}
     * @param options.storage Storage mechanism for delegration credentials
     * @see {@link AuthClientStorage}
     * @param options.keyType Type of key to use for the base key
     * @param {IdleOptions} options.idleOptions Configures an {@link IdleManager}
     * @see {@link IdleOptions}
     * Default behavior is to clear stored identity and reload the page when a user goes idle, unless you set the disableDefaultIdleCallback flag or pass in a custom idle callback.
     * @example
     * const authClient = await AuthClient.create({
     *   idleOptions: {
     *     disableIdle: true
     *   }
     * })
     */
    static async create(options = {}) {
        var _a, _b, _c;
        const storage = (_a = options.storage) !== null && _a !== void 0 ? _a : new IdbStorage();
        const keyType = (_b = options.keyType) !== null && _b !== void 0 ? _b : ECDSA_KEY_LABEL;
        let key = null;
        if (options.identity) {
            key = options.identity;
        }
        else {
            let maybeIdentityStorage = await storage.get(KEY_STORAGE_KEY);
            if (!maybeIdentityStorage && isBrowser) {
                // Attempt to migrate from localstorage
                try {
                    const fallbackLocalStorage = new LocalStorage();
                    const localChain = await fallbackLocalStorage.get(KEY_STORAGE_DELEGATION);
                    const localKey = await fallbackLocalStorage.get(KEY_STORAGE_KEY);
                    // not relevant for Ed25519
                    if (localChain && localKey && keyType === ECDSA_KEY_LABEL) {
                        console.log('Discovered an identity stored in localstorage. Migrating to IndexedDB');
                        await storage.set(KEY_STORAGE_DELEGATION, localChain);
                        await storage.set(KEY_STORAGE_KEY, localKey);
                        maybeIdentityStorage = localChain;
                        // clean up
                        await fallbackLocalStorage.remove(KEY_STORAGE_DELEGATION);
                        await fallbackLocalStorage.remove(KEY_STORAGE_KEY);
                    }
                }
                catch (error) {
                    console.error('error while attempting to recover localstorage: ' + error);
                }
            }
            if (maybeIdentityStorage) {
                try {
                    if (typeof maybeIdentityStorage === 'object') {
                        if (keyType === ED25519_KEY_LABEL && typeof maybeIdentityStorage === 'string') {
                            key = await Ed25519KeyIdentity.fromJSON(maybeIdentityStorage);
                        }
                        else {
                            key = await ECDSAKeyIdentity.fromKeyPair(maybeIdentityStorage);
                        }
                    }
                    else if (typeof maybeIdentityStorage === 'string') {
                        // This is a legacy identity, which is a serialized Ed25519KeyIdentity.
                        key = Ed25519KeyIdentity.fromJSON(maybeIdentityStorage);
                    }
                }
                catch (e) {
                    // Ignore this, this means that the localStorage value isn't a valid Ed25519KeyIdentity or ECDSAKeyIdentity
                    // serialization.
                }
            }
        }
        let identity = new AnonymousIdentity();
        let chain = null;
        if (key) {
            try {
                const chainStorage = await storage.get(KEY_STORAGE_DELEGATION);
                if (typeof chainStorage === 'object' && chainStorage !== null) {
                    throw new Error('Delegation chain is incorrectly stored. A delegation chain should be stored as a string.');
                }
                if (options.identity) {
                    identity = options.identity;
                }
                else if (chainStorage) {
                    chain = DelegationChain.fromJSON(chainStorage);
                    // Verify that the delegation isn't expired.
                    if (!isDelegationValid(chain)) {
                        await _deleteStorage(storage);
                        key = null;
                    }
                    else {
                        // If the key is a public key, then we create a PartialDelegationIdentity.
                        if ('toDer' in key) {
                            identity = PartialDelegationIdentity.fromDelegation(key, chain);
                            // otherwise, we create a DelegationIdentity.
                        }
                        else {
                            identity = DelegationIdentity.fromDelegation(key, chain);
                        }
                    }
                }
            }
            catch (e) {
                console.error(e);
                // If there was a problem loading the chain, delete the key.
                await _deleteStorage(storage);
                key = null;
            }
        }
        let idleManager = undefined;
        if ((_c = options.idleOptions) === null || _c === void 0 ? void 0 : _c.disableIdle) {
            idleManager = undefined;
        }
        // if there is a delegation chain or provided identity, setup idleManager
        else if (chain || options.identity) {
            idleManager = IdleManager.create(options.idleOptions);
        }
        if (!key) {
            // Create a new key (whether or not one was in storage).
            if (keyType === ED25519_KEY_LABEL) {
                key = await Ed25519KeyIdentity.generate();
                await storage.set(KEY_STORAGE_KEY, JSON.stringify(key.toJSON()));
            }
            else {
                if (options.storage && keyType === ECDSA_KEY_LABEL) {
                    console.warn(`You are using a custom storage provider that may not support CryptoKey storage. If you are using a custom storage provider that does not support CryptoKey storage, you should use '${ED25519_KEY_LABEL}' as the key type, as it can serialize to a string`);
                }
                key = await ECDSAKeyIdentity.generate();
                await storage.set(KEY_STORAGE_KEY, key.getKeyPair());
            }
        }
        return new this(identity, key, chain, storage, idleManager, options);
    }
    _registerDefaultIdleCallback() {
        var _a, _b;
        const idleOptions = (_a = this._createOptions) === null || _a === void 0 ? void 0 : _a.idleOptions;
        /**
         * Default behavior is to clear stored identity and reload the page.
         * By either setting the disableDefaultIdleCallback flag or passing in a custom idle callback, we will ignore this config
         */
        if (!(idleOptions === null || idleOptions === void 0 ? void 0 : idleOptions.onIdle) && !(idleOptions === null || idleOptions === void 0 ? void 0 : idleOptions.disableDefaultIdleCallback)) {
            (_b = this.idleManager) === null || _b === void 0 ? void 0 : _b.registerCallback(() => {
                this.logout();
                location.reload();
            });
        }
    }
    async _handleSuccess(message, onSuccess) {
        var _a, _b;
        const delegations = message.delegations.map(signedDelegation => {
            return {
                delegation: new Delegation(signedDelegation.delegation.pubkey, signedDelegation.delegation.expiration, signedDelegation.delegation.targets),
                signature: signedDelegation.signature.buffer,
            };
        });
        const delegationChain = DelegationChain.fromDelegations(delegations, message.userPublicKey.buffer);
        const key = this._key;
        if (!key) {
            return;
        }
        this._chain = delegationChain;
        if ('toDer' in key) {
            this._identity = PartialDelegationIdentity.fromDelegation(key, this._chain);
        }
        else {
            this._identity = DelegationIdentity.fromDelegation(key, this._chain);
        }
        (_a = this._idpWindow) === null || _a === void 0 ? void 0 : _a.close();
        const idleOptions = (_b = this._createOptions) === null || _b === void 0 ? void 0 : _b.idleOptions;
        // create the idle manager on a successful login if we haven't disabled it
        // and it doesn't already exist.
        if (!this.idleManager && !(idleOptions === null || idleOptions === void 0 ? void 0 : idleOptions.disableIdle)) {
            this.idleManager = IdleManager.create(idleOptions);
            this._registerDefaultIdleCallback();
        }
        this._removeEventListener();
        delete this._idpWindow;
        if (this._chain) {
            await this._storage.set(KEY_STORAGE_DELEGATION, JSON.stringify(this._chain.toJSON()));
        }
        // onSuccess should be the last thing to do to avoid consumers
        // interfering by navigating or refreshing the page
        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(message);
    }
    getIdentity() {
        return this._identity;
    }
    async isAuthenticated() {
        return !this.getIdentity().getPrincipal().isAnonymous() && this._chain !== null;
    }
    /**
     * AuthClient Login -
     * Opens up a new window to authenticate with Internet Identity
     * @param {AuthClientLoginOptions} options - Options for logging in
     * @param options.identityProvider Identity provider
     * @param options.maxTimeToLive Expiration of the authentication in nanoseconds
     * @param options.allowPinAuthentication If present, indicates whether or not the Identity Provider should allow the user to authenticate and/or register using a temporary key/PIN identity. Authenticating dapps may want to prevent users from using Temporary keys/PIN identities because Temporary keys/PIN identities are less secure than Passkeys (webauthn credentials) and because Temporary keys/PIN identities generally only live in a browser database (which may get cleared by the browser/OS).
     * @param options.derivationOrigin Origin for Identity Provider to use while generating the delegated identity
     * @param options.windowOpenerFeatures Configures the opened authentication window
     * @param options.onSuccess Callback once login has completed
     * @param options.onError Callback in case authentication fails
     * @example
     * const authClient = await AuthClient.create();
     * authClient.login({
     *  identityProvider: 'http://<canisterID>.127.0.0.1:8000',
     *  maxTimeToLive: BigInt (7) * BigInt(24) * BigInt(3_600_000_000_000), // 1 week
     *  windowOpenerFeatures: "toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100",
     *  onSuccess: () => {
     *    console.log('Login Successful!');
     *  },
     *  onError: (error) => {
     *    console.error('Login Failed: ', error);
     *  }
     * });
     */
    async login(options) {
        var _a, _b, _c, _d;
        // Set default maxTimeToLive to 8 hours
        const defaultTimeToLive = /* hours */ BigInt(8) * /* nanoseconds */ BigInt(3600000000000);
        // Create the URL of the IDP. (e.g. https://XXXX/#authorize)
        const identityProviderUrl = new URL(((_a = options === null || options === void 0 ? void 0 : options.identityProvider) === null || _a === void 0 ? void 0 : _a.toString()) || IDENTITY_PROVIDER_DEFAULT);
        // Set the correct hash if it isn't already set.
        identityProviderUrl.hash = IDENTITY_PROVIDER_ENDPOINT;
        // If `login` has been called previously, then close/remove any previous windows
        // and event listeners.
        (_b = this._idpWindow) === null || _b === void 0 ? void 0 : _b.close();
        this._removeEventListener();
        // Add an event listener to handle responses.
        this._eventHandler = this._getEventHandler(identityProviderUrl, Object.assign({ maxTimeToLive: (_c = options === null || options === void 0 ? void 0 : options.maxTimeToLive) !== null && _c !== void 0 ? _c : defaultTimeToLive }, options));
        window.addEventListener('message', this._eventHandler);
        // Open a new window with the IDP provider.
        this._idpWindow =
            (_d = window.open(identityProviderUrl.toString(), 'idpWindow', options === null || options === void 0 ? void 0 : options.windowOpenerFeatures)) !== null && _d !== void 0 ? _d : undefined;
        // Check if the _idpWindow is closed by user.
        const checkInterruption = () => {
            // The _idpWindow is opened and not yet closed by the client
            if (this._idpWindow) {
                if (this._idpWindow.closed) {
                    this._handleFailure(ERROR_USER_INTERRUPT, options === null || options === void 0 ? void 0 : options.onError);
                }
                else {
                    setTimeout(checkInterruption, INTERRUPT_CHECK_INTERVAL);
                }
            }
        };
        checkInterruption();
    }
    _getEventHandler(identityProviderUrl, options) {
        return async (event) => {
            var _a, _b, _c;
            if (event.origin !== identityProviderUrl.origin) {
                console.warn(`WARNING: expected origin '${identityProviderUrl.origin}', got '${event.origin}' (ignoring)`);
                return;
            }
            const message = event.data;
            switch (message.kind) {
                case 'authorize-ready': {
                    // IDP is ready. Send a message to request authorization.
                    const request = Object.assign({ kind: 'authorize-client', sessionPublicKey: new Uint8Array((_a = this._key) === null || _a === void 0 ? void 0 : _a.getPublicKey().toDer()), maxTimeToLive: options === null || options === void 0 ? void 0 : options.maxTimeToLive, allowPinAuthentication: options === null || options === void 0 ? void 0 : options.allowPinAuthentication, derivationOrigin: (_b = options === null || options === void 0 ? void 0 : options.derivationOrigin) === null || _b === void 0 ? void 0 : _b.toString() }, options === null || options === void 0 ? void 0 : options.customValues);
                    (_c = this._idpWindow) === null || _c === void 0 ? void 0 : _c.postMessage(request, identityProviderUrl.origin);
                    break;
                }
                case 'authorize-client-success':
                    // Create the delegation chain and store it.
                    try {
                        await this._handleSuccess(message, options === null || options === void 0 ? void 0 : options.onSuccess);
                    }
                    catch (err) {
                        this._handleFailure(err.message, options === null || options === void 0 ? void 0 : options.onError);
                    }
                    break;
                case 'authorize-client-failure':
                    this._handleFailure(message.text, options === null || options === void 0 ? void 0 : options.onError);
                    break;
                default:
                    break;
            }
        };
    }
    _handleFailure(errorMessage, onError) {
        var _a;
        (_a = this._idpWindow) === null || _a === void 0 ? void 0 : _a.close();
        onError === null || onError === void 0 ? void 0 : onError(errorMessage);
        this._removeEventListener();
        delete this._idpWindow;
    }
    _removeEventListener() {
        if (this._eventHandler) {
            window.removeEventListener('message', this._eventHandler);
        }
        this._eventHandler = undefined;
    }
    async logout(options = {}) {
        await _deleteStorage(this._storage);
        // Reset this auth client to a non-authenticated state.
        this._identity = new AnonymousIdentity();
        this._chain = null;
        if (options.returnTo) {
            try {
                window.history.pushState({}, '', options.returnTo);
            }
            catch (e) {
                window.location.href = options.returnTo;
            }
        }
    }
}
async function _deleteStorage(storage) {
    await storage.remove(KEY_STORAGE_KEY);
    await storage.remove(KEY_STORAGE_DELEGATION);
    await storage.remove(KEY_VECTOR);
}
//# sourceMappingURL=index.js.map