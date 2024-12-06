import { useCallback, useState } from "react";
import { idlFactory, canisterId } from "../../../declarations/backend";
import { useIIClient } from "../hooks/useIIClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Import the CSS file
import { _SERVICE } from "../../../declarations/backend/backend.did";
import { ActorSubclass } from "@dfinity/agent";
import { LOGIN, useAuth } from "../lib/AuthContext";
import { AUTH_PROVIDERS, getIdentityProvider } from "../helper/auth";
import { usePlugClient } from "../hooks/usePlugClient";
import { useToast } from "@chakra-ui/react";

function Auth() {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const toast = useToast();

  /**
   * Completes the authentication process for a user within the Auth component.
   *
   * @async
   * @function completeAuth
   * @param {ActorSubclass<_SERVICE>} actor - The backend actor
   * @param {Principal} principal - The principal of the user
   * @param {string} authProvider - The authentication provider used
   */
  async function completeAuth(actor, principal, authProvider) {
    // Check if member exists
    const member = await actor.getProfile();
    if (member.ok) {
      dispatch({
        type: LOGIN,
        payload: {
          user: {
            principal: principal,
            member: member.ok,
          },
          authProvider,
        },
      });
    } else {
      await actor.registerUser("", "", "");
      dispatch({
        type: LOGIN,
        payload: {
          principal: principal,
          member: {},
        },
      });
    }
  }

  const { login: iiLogin, actor: iiActor, identity: iIdentity } = useIIClient({
    loginOptions: {
      onSuccess: useCallback(() => {
        completeAuth(iiActor, iIdentity.getPrincipal(), AUTH_PROVIDERS.II);
      }, [iiActor, iIdentity]),
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    },
    actorOptions: {
      canisterId,
      idlFactory,
    },
  });

  const { login: plugLogin, actor: plugActor, principal: plugPrincipal } = usePlugClient({
    loginOptions: {
      identityProvider: getIdentityProvider(),
      onSuccess: useCallback(() => {
        completeAuth(plugActor, plugPrincipal, AUTH_PROVIDERS.PLUG);
      }, [plugActor, plugPrincipal])
    },
  });

  const [whoamiText, setWhoamiText] = useState("");

  return (
    <main className="auth-main">
      <div className="blur-circle"></div>
      <span className="auth-title">Patriot.ai</span>
      <p className="auth-subtitle">Fighting corruption one prompt at a time</p>
      <br />
      <br />
      <section id="login-section">
        <div className="buttons">
          <button className="login-button" id="login" onClick={iiLogin}>
            Login with Internet Identity
          </button>
          <button className="login-button" id="login" onClick={plugLogin}>
            Login with Plug wallet
          </button>
        </div>
        <p>
          {isAuthenticated ? navigate("/coursePage") : "You are not logged in"}
        </p>
        <section id="whoami">{whoamiText.toString()}</section>
      </section>
    </main>
  );
}

export default Auth;
