import * as React from "react";

import { Actor, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../lib/AuthContext";
import { useIIClient } from "./useIIClient";
import { idlFactory, canisterId } from "../../../declarations/backend";
import { AUTH_PROVIDERS, getIdentityProvider } from "../helper/auth";
import { usePlugClient } from "./usePlugClient";
import { _SERVICE } from "../../../declarations/backend/backend.did.js";

export function useActor() {
  const [principal, setPrincipal] = React.useState<Principal | null>(null);
  const [actor, setActor] = React.useState<ActorSubclass<_SERVICE> | null>(null);
  const { state } = useAuth();

  const { actor: iiActor, identity: iIdentity } = useIIClient({
    loginOptions: {
      identityProvider: getIdentityProvider(),
    },
    actorOptions: {
      canisterId,
      // @ts-ignore
      idlFactory,
    },
  });

  const { actor: plugActor, principal: plugPrincipal } = usePlugClient();

  React.useEffect(() => {
    if (state.authProvider) {
      switch (state.authProvider) {
        case AUTH_PROVIDERS.II:
          const principal = iIdentity?.getPrincipal();
          if (principal) {
            setActor(iiActor);
            setPrincipal(principal);
          }
          break;
        case AUTH_PROVIDERS.PLUG:
          setActor(plugActor);
          setPrincipal(plugPrincipal);
          break;
      }
    }
  }, [state.authProvider]);

  return {
    actor,
    principal,
  };
}
