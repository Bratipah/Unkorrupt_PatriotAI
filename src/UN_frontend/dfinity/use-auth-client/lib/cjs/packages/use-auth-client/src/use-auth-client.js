"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthClient = useAuthClient;
const React = __importStar(require("react"));
const auth_client_1 = require("@dfinity/auth-client");
const agent_1 = require("@dfinity/agent");
/**
 * React hook to set up the Internet Computer auth client
 * @param {UseAuthClientOptions} options configuration for the hook
 * @see {@link UseAuthClientOptions}
 * @param {AuthClientCreateOptions} options.createOptions  - options passed during the creation of the auth client
 * @param {AuthClientLoginOptions} options.loginOptions -
 */
function useAuthClient(options) {
    const [authClient, setAuthClient] = React.useState(null);
    const [identity, setIdentity] = React.useState(null);
    const [actor, setActor] = React.useState(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    // load the auth client on mount
    React.useEffect(() => {
        auth_client_1.AuthClient.create({
            ...options?.createOptions,
            idleOptions: {
                ...options?.createOptions?.idleOptions,
                onIdle: options?.createOptions?.idleOptions?.onIdle ??
                    (() => {
                        logout();
                    }),
            },
        }).then(async (client) => {
            setAuthClient(client);
            setIdentity(client.getIdentity());
            setIsAuthenticated(await client.isAuthenticated());
        });
    }, []);
    React.useEffect(() => {
        if (identity && options?.actorOptions) {
            createActor({
                ...options.actorOptions,
                agentOptions: { ...options?.actorOptions?.agentOptions, identity },
            }).then(actor => {
                setActor(actor);
            });
        }
    }, [identity]);
    /**
     * Login through your configured identity provider
     * Wraps the onSuccess and onError callbacks with promises for convenience
     * @returns {Promise<InternetIdentityAuthResponseSuccess | void>} - Returns a promise that resolves to the response from the identity provider
     */
    function login() {
        return new Promise((resolve, reject) => {
            if (authClient) {
                const callback = options?.loginOptions?.onSuccess;
                const errorCb = options?.loginOptions?.onError;
                authClient.login({
                    ...options?.loginOptions,
                    onSuccess: (successResponse) => {
                        setIsAuthenticated(true);
                        setIdentity(authClient.getIdentity());
                        if (successResponse !== undefined) {
                            callback?.(successResponse);
                        }
                        else {
                            callback?.();
                        }
                        resolve(successResponse);
                    },
                    onError: error => {
                        errorCb?.(error);
                        reject(error);
                    },
                });
            }
        });
    }
    async function logout() {
        if (authClient) {
            setIsAuthenticated(false);
            setIdentity(null);
            await authClient.logout();
            setActor(await createActor(options?.actorOptions));
        }
    }
    return {
        actor,
        authClient,
        identity,
        isAuthenticated,
        login,
        logout,
    };
}
const createActor = async (options) => {
    const agent = options.agent || (await agent_1.HttpAgent.create({ ...options.agentOptions }));
    if (options.agent && options.agentOptions) {
        console.warn('Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.');
    }
    // Fetch root key for certificate validation during development
    if (process.env.DFX_NETWORK !== 'ic') {
        agent.fetchRootKey().catch(err => {
            console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
            console.error(err);
        });
    }
    // Creates an actor with using the candid interface and the HttpAgent
    return agent_1.Actor.createActor(options.idlFactory, {
        agent,
        canisterId: options.canisterId,
        ...options.actorOptions,
    });
};
