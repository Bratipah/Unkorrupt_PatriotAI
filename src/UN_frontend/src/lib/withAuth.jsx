import { LOGIN, LOGOUT, useAuth } from "./AuthContext";
import { useEffect } from "react";
import {
  createBackendActor,
  createClient,
  getIdentityProvider,
} from "../helper/auth";
import { useNavigate } from "react-router-dom";
import { Box, Center, Spinner, useToast } from "@chakra-ui/react";
import { backend, idlFactory, canisterId } from "../../../declarations/backend";
import { useIIClient } from "../hooks/useIIClient";
import { usePlugClient } from "../hooks/usePlugClient";

let actor = backend;

/**
 * Higher order component to check if user is authenticated
 *
 * This ensures that the user is authenticated before rendering the component
 * If a user is authenticated but not a member, they are logged out
 * @param Component
 */
function withAuth(Component) {
  return function WithAuth(props) {
    const { state, dispatch } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const {
      actor: iiActor,
      identity: iIdentity,
      isAuthenticated: iiIsAuthenticated,
    } = useIIClient({
      loginOptions: {
        identityProvider: getIdentityProvider(),
      },
      actorOptions: {
        canisterId,
        // @ts-ignore
        idlFactory,
      },
    });
    const {
      actor: plugActor,
      isAuthenticated: plugIsAuthenticated,
      principal: plugPrincipal,
    } = usePlugClient();

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

    useEffect(() => {
      async function checkAuthenticated() {
        if (iiIsAuthenticated || plugIsAuthenticated) {
          switch (state.authProvider) {
            case AUTH_PROVIDERS.II:
              await completeAuth(iiActor, iIdentity.getPrincipal(), AUTH_PROVIDERS.II);
              break;
            case AUTH_PROVIDERS.PLUG:
              await completeAuth(plugActor, plugPrincipal, AUTH_PROVIDERS.PLUG);
              break;
          }
        } else {
          toast({
            title: "You are not logged in",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          dispatch({
            type: LOGOUT,
          });
          navigate("/auth");
        }
      }
      checkAuthenticated();
    }, [dispatch]);

    if (state.isAuthenticated) {
      return <Component {...props} />;
    } else {
      return (
        <Box h={"100vh"}>
          <Center h={"100%"}>
            <Spinner size={"xl"} />
          </Center>
        </Box>
      );
    }
  };
}

export default withAuth;
