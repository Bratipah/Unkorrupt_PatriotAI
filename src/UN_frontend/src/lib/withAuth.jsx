import { LOGIN, LOGOUT, useAuth } from "./AuthContext";
import { useEffect } from "react";
import {
  AUTH_PROVIDERS,
  createBackendActor,
  createClient,
  getIdentityProvider,
} from "../helper/auth";
import { useLocation, useNavigate } from "react-router-dom";
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
    const location = useLocation();

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
      console.log("Completing authentication for " + authProvider);
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
            user: {
              principal: principal,
              member: {},
            },
            authProvider,
          },
        });
      }
    }

    useEffect(() => {
      async function checkAuthenticated() {
        console.log("Checking authentication");
        console.log(iiIsAuthenticated, plugIsAuthenticated);
        if (iiIsAuthenticated === null || plugIsAuthenticated === null) {
          return;
        }
        console.log(iiIsAuthenticated, plugIsAuthenticated);
        if (iiIsAuthenticated || plugIsAuthenticated) {
          if (iiIsAuthenticated) {
            await completeAuth(
              iiActor,
              iIdentity.getPrincipal(),
              AUTH_PROVIDERS.II
            );
          } else if (plugIsAuthenticated) {
            await completeAuth(plugActor, plugPrincipal, AUTH_PROVIDERS.PLUG);
          }
        } else {
          if (window.location.pathname === "/auth") {
            return;
          }
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
    }, [dispatch, iiIsAuthenticated, plugIsAuthenticated]);

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
