import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "../../../declarations/backend";

/**
 * Get the identity provider URL
 * @see https://github.com/dfinity/examples/blob/master/motoko/auth_client_demo/src/auth_client_demo_assets/react/use-auth-client.jsx
 */
export const getIdentityProvider = () => {
  if (process.env.DFX_NETWORK === "ic") {
    return "https://identity.ic0.app";
  }

  // Safari does not support localhost subdomains
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    return `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`;
  }

  return `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;
};

export function getHost() {
  if (process.env.DFX_NETWORK === "ic") {
    return `https://${process.env.CANISTER_ID_FRONTEND}.icp0.io`
  }
  return "http://127.0.0.1:4943";
}

/**
 * Create an auth client
 */
export async function createClient() {
  const authClient = await AuthClient.create({
    idleOptions: {
      idleTimeout: 1000 * 60 * 30,
    },
  });
  return authClient;
}

/**
 * Create a new authenticated backend actor
 * @param identity
 */
export async function createBackendActor(identity) {
  return createActor(process.env.CANISTER_ID_BACKEND, {
    agentOptions: {
      identity,
    },
  });
}

export const WHITELIST = [process.env.CANISTER_ID_BACKEND];
export const HOST = getHost();

export const AUTH_PROVIDERS = {
  II: "II",
  PLUG: "PLUG",
  NFID: "NFID",
};
