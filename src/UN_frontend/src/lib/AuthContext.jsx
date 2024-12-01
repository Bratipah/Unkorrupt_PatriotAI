import React, { createContext, useReducer, useContext } from "react";

// Define the initial state
const initialState = {
  isAuthenticated: false,
  user: null,
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
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
      };
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    default:
      return state;
  }
};

// Context provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

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
