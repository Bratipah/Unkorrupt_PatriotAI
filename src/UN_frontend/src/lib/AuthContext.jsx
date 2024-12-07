import { Principal } from "@dfinity/principal";
import React, { createContext, useReducer, useContext } from "react";

// Helper function to load initial state from localStorage
const loadInitialState = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const authProvider = localStorage.getItem("authProvider");

  return {
    isAuthenticated: isAuthenticated,
    user: storedUser ? {
      principal: storedUser.principal ? Principal.fromText(storedUser.principal) : null,
      member: storedUser.member ? storedUser.member : null,
    } : null,
    authProvider: authProvider,
  };
};

// Define the initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  authProvider: null,
};

// Create a context
const AuthContext = createContext({
  state: initialState,
  dispatch: (data) => { },
});

// Define actions
export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case LOGIN:
      console.log(action.payload);
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("user", JSON.stringify({
        principal: action.payload.user.principal.toText(),
        member: action.payload.user.member
      }));
      localStorage.setItem("authProvider", action.payload.authProvider);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        authProvider: action.payload.authProvider,
      };
    case LOGOUT:
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      localStorage.removeItem("authProvider");
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        authProvider: null,
      };
    default:
      return state;
  }
};

// Context provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState, () => loadInitialState());

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the context
export const useAuth = () => {
  return useContext(AuthContext);
};
