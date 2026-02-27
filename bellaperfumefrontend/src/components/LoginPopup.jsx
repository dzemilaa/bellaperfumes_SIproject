import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { authClient } from "../apolloClient";

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      userId
      username
      email
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input)
  }
`;

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [login] = useMutation(LOGIN_MUTATION, { client: authClient });
  const [register] = useMutation(REGISTER_MUTATION, { client: authClient });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const { data } = await login({
        variables: { input: { email, password } },
      });

      const userToStore = {
        userId: data.login.userId,
        username: data.login.username,
        email: data.login.email,
      };

      sessionStorage.setItem("user", JSON.stringify(userToStore));
      setShowLogin(false);
      window.location.reload();
    } catch (err) {
      setErrorMessage(err.message.replace("GraphQL error: ", ""));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await register({
        variables: { input: { username: userName, email, password } },
      });
      alert("User registered successfully! You can now login.");
      setCurrState("Login");
    } catch (err) {
      setErrorMessage(err.message.replace("GraphQL error: ", ""));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6 relative"
        onSubmit={currState === "Login" ? handleLogin : handleSignUp}
      >
        <button
          type="button"
          onClick={() => setShowLogin(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-pink-600"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <img src="/logop.png" alt="Bella Logo" className="w-20 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-pink-950">{currState}</h2>
        </div>
        {currState === "Sign Up" && (
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-2 mb-3 w-full"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3 w-full"
        />

        {errorMessage && <p className="text-red-600 mb-2">{errorMessage}</p>}

        <button
          type="submit"
          className="w-full bg-pink-950 text-white py-2 rounded-full font-semibold hover:bg-pink-700 transition mb-2"
        >
          {currState === "Login" ? "Login" : "Sign Up"}
        </button>

        <p className="text-sm text-center text-gray-600">
          {currState === "Login" ? (
            <>
              Don't have an account?{" "}
              <span
                className="text-pink-600 cursor-pointer"
                onClick={() => setCurrState("Sign Up")}
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                className="text-pink-600 cursor-pointer"
                onClick={() => setCurrState("Login")}
              >
                Login
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default LoginPopup;