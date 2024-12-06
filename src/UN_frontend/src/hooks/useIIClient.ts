import * as React from "react";
import {
  AuthClient,
  AuthClientCreateOptions,
  AuthClientLoginOptions,
} from "@dfinity/auth-client";
import {
  type Identity,
  type Agent,
  type HttpAgentOptions,
  type ActorConfig,
  HttpAgent,
  Actor,
  ActorSubclass,
} from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { createBackendActor } from "../helper/auth";
import { _SERVICE } from "../../../declarations/backend/backend.did";

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
export function useIIClient(options?: UseAuthClientOptions) {
  const [authClient, setAuthClient] = React.useState<AuthClient | null>(null);
  const [identity, setIdentity] = React.useState<Identity | null>(null);
  const [actor, setActor] = React.useState<ActorSubclass<_SERVICE> | null>(
    null
  );
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  // load the auth client on mount
  React.useEffect(() => {
    AuthClient.create({
      ...options?.createOptions,
      idleOptions: {
        ...options?.createOptions?.idleOptions,
        onIdle:
          options?.createOptions?.idleOptions?.onIdle ??
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
    if (identity) {
      (async () => {
        // @ts-ignore
        setActor(await createBackendActor(identity));
      })();
    }
  }, [identity]);

  async function login() {
    await new Promise((resolve, reject) => {
      if (authClient) {
        const callback = options?.loginOptions?.onSuccess;
        const errorCb = options?.loginOptions?.onError;
        authClient.login({
          ...options?.loginOptions,
          onSuccess: async (successResponse?: any) => {
            setIsAuthenticated(true);
            setIdentity(authClient.getIdentity());
            // @ts-ignore
            setActor(await createBackendActor(identity));
            callback?.(successResponse);
            resolve(successResponse);
          },
          onError: (error) => {
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
      setActor(null);
      await authClient.logout();
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

const createActor = async (options: CreateActorOptions) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(options.idlFactory, {
    agent,
    canisterId: options.canisterId,
    ...options.actorOptions,
  });
};
