import { AuthClient, AuthClientCreateOptions, AuthClientLoginOptions, InternetIdentityAuthResponseSuccess } from '@dfinity/auth-client';
import { type Identity, type Agent, type HttpAgentOptions, type ActorConfig, Actor } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';
export interface CreateActorOptions {
    /**
     * @see {@link Agent}
     */
    agent?: Agent;
    /**
     * @see {@link HttpAgentOptions}
     */
    agentOptions?: HttpAgentOptions;
    /**
     * @see {@link ActorConfig}
     */
    actorOptions?: ActorConfig;
    idlFactory: IDL.InterfaceFactory;
    canisterId: Principal | string;
}
/**
 * Options for the useAuthClient hook
 */
export type UseAuthClientOptions = {
    /**
     * Options passed during the creation of the auth client
     */
    createOptions?: AuthClientCreateOptions;
    /**
     * Options passed during the login of the auth client
     */
    loginOptions?: AuthClientLoginOptions;
    /**
     * Options to create an actor using the auth client identity
     */
    actorOptions?: CreateActorOptions;
};
/**
 * React hook to set up the Internet Computer auth client
 * @param {UseAuthClientOptions} options configuration for the hook
 * @see {@link UseAuthClientOptions}
 * @param {AuthClientCreateOptions} options.createOptions  - options passed during the creation of the auth client
 * @param {AuthClientLoginOptions} options.loginOptions -
 */
export declare function useAuthClient(options?: UseAuthClientOptions): {
    actor: Actor;
    authClient: AuthClient;
    identity: Identity;
    isAuthenticated: boolean;
    login: () => Promise<InternetIdentityAuthResponseSuccess | void>;
    logout: () => Promise<void>;
};
