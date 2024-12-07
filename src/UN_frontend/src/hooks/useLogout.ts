import * as React from "react";

import { Actor, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { LOGOUT, useAuth } from "../lib/AuthContext.jsx";
import { useIIClient } from "./useIIClient.js";
import { idlFactory, canisterId } from "../../../declarations/backend/index.js";
import { AUTH_PROVIDERS, getIdentityProvider } from "../helper/auth.js";
import { usePlugClient } from "./usePlugClient.js";
import { _SERVICE } from "../../../declarations/backend/backend.did.js";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const { state, dispatch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const cleanup = () => {
    toast({
      title: "Logged out",
      description: "You have been logged out.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
    dispatch({ type: LOGOUT });
    navigate("/");
  }

  const { logout: iiLogout } = useIIClient({
    loginOptions: {
      identityProvider: getIdentityProvider(),
    },
    actorOptions: {
      canisterId,
      // @ts-ignore
      idlFactory,
    },
  });

  const { logout: plugLogout } = usePlugClient();

  async function logout() {
    console.log("Logging out");
    if (state.authProvider) {
      switch (state.authProvider) {
        case AUTH_PROVIDERS.II:
          await iiLogout();
          cleanup();
          break;
        case AUTH_PROVIDERS.PLUG:
          await plugLogout();
          cleanup();
          break;
      }
    }
  }

  return logout;
}
