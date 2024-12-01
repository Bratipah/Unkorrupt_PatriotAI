import { useState } from "react";
import { idlFactory, canisterId } from "../../../declarations/UN_backend";
import { useAuthClient } from "../index";
import { useNavigate } from "react-router-dom";
import './Auth.css'; // Import the CSS file

function Auth() {
  const navigate = useNavigate();
  const identityProvider =
    process.env.DFX_NETWORK === "local"
      ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
      : "https://identity.ic0.app";

  const { isAuthenticated, login, logout, actor } = useAuthClient({
    loginOptions: {
      identityProvider,
    },
    actorOptions: {
      canisterId,
      idlFactory,
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
          <button
            className="login-button"
            id="login"
            onClick={login}
          >
            Login with Internet Identity
          </button>
        </div>
        <p>{isAuthenticated ? navigate("/coursePage") : "You are not logged in"}</p>
        <section id="whoami">{whoamiText.toString()}</section>
      </section>
    </main>
  );
}

export default Auth;
