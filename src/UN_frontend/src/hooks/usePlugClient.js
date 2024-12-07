import * as React from "react";
import { HOST, WHITELIST } from "../helper/auth";
import { idlFactory, backend } from "../../../declarations/backend";

/**
 * Options configuration for the useIIClient hook
 * 
 * @typedef {Object} UsePlugClientOptions
 * @property {Object} [loginOptions] - Configuration options for the login process
 * @property {() => void} [loginOptions.onSuccess] - Callback function invoked when login is successful
 * @property {(error: Error) => void} [loginOptions.onError] - Callback function invoked when login encounters an error
 */

/**
 * Authentication state managed by the useIIClient hook
 * 
 * @typedef {Object} AuthState
 * @property {import('@dfinity/agent').ActorSubclass<import('../../../declarations/backend/backend.did.js')._SERVICE> | null} actor - The backend actor for making canister calls
 * @property {import('@dfinity/principal').Principal | null} principal - The authenticated user's principal
 * @property {boolean} isAuthenticated - Flag indicating whether the user is currently authenticated
 */

/**
 * Authentication methods provided by the useIIClient hook
 * 
 * @typedef {Object} AuthMethods
 * @property {() => Promise<void>} login - Method to initiate the login process
 * @property {() => Promise<void>} logout - Method to log out the current user
 */

/**
 * React hook for managing client authentication using Plug wallet
 * 
 * @param {UsePlugClientOptions} [options] - Optional configuration for authentication flow
 * @returns {AuthState & AuthMethods} Authentication state and methods
 */
export function usePlugClient(options) {
  const [principal, setPrincipal] = React.useState(null);
  const [actor, setActor] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  function hasPlug() {
    return window.ic?.plug !== undefined;
  }

  async function createActor() {
    if (!window.ic?.plug?.agent) {
      console.warn("no agent found");
      const result = await window.ic?.plug?.createAgent({
        whitelist: WHITELIST,
        host: HOST,
      });
      result
        ? console.log("agent created")
        : console.warn("agent creation failed");
    }

    // check if createActor method is available
    if (!window.ic?.plug?.createActor) {
      console.warn("no createActor found");
      return;
    }

    // Fetch root key for certificate validation during development
    // if (process.env.DFX_NETWORK !== "ic") {
    //   window.ic.plug.agent.fetchRootKey().catch((err) => {
    //     console.warn(
    //       "Unable to fetch root key. Check to ensure that your local replica is running"
    //     );
    //     console.error(err);
    //   });
    // }

    const backendActor = await window.ic?.plug.createActor({
      canisterId: process.env.CANISTER_ID_BACKEND,
      interfaceFactory: idlFactory,
    });

    return backendActor;
  }

  // load the auth client on mount
  React.useEffect(() => {
    if (!hasPlug()) {
      console.warn("Plug is not available");
      return;
    }
    (async () => {
      const plug = window.ic.plug;
      const connected = await plug.isConnected();
      if (connected) {
        const actor = await createActor();
        if (actor) {
          setPrincipal(await plug.getPrincipal());
          setIsAuthenticated(true);
          setActor(actor);
        } else {
          logout();
        }
      } else {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  async function login() {
    const successCb = options?.loginOptions?.onSuccess;
    const errorCb = options?.loginOptions?.onError;

    if (!hasPlug()) {
      errorCb && errorCb(new Error("Plug is not available"));
      return;
    }

    const plug = window.ic.plug;

    const plugConnected = await plug.isConnected();
    if (!plugConnected) {
      console.log("WHITELIST", WHITELIST);
      try {
        await plug.requestConnect({
          whitelist: WHITELIST,
        });
        console.log("plug connected");
      } catch (e) {
        console.warn(e);
        return;
      }
    }

    const actor = await createActor();

    if (!actor) {
      errorCb &&
        errorCb(new Error("Can't sign in: actor creation failed, try again"));
      return;
    }

    setActor(actor);
    setPrincipal(await plug.getPrincipal());
    setIsAuthenticated(true);

    successCb && successCb(actor, principal);
  }

  async function logout() {
    const connected = await window.ic.plug.isConnected();
    if (connected) {
      try {
        await window.ic?.plug?.disconnect();
        // wait for 500ms to ensure that the disconnection is complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        const plugConnected = await window.ic?.plug?.isConnected();
        if (plugConnected) {
          console.log("plug disconnect failed, trying once more");
          await window.ic?.plug?.disconnect();
        }
      } catch (error) {
        console.error("Plug disconnect error: ", error);
      }
      setIsAuthenticated(false);
      setPrincipal(null);
      setActor(null);
    }
  }

  return {
    actor,
    principal,
    isAuthenticated,
    login,
    logout,
  };
}

