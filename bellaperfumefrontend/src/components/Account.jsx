import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { authClient } from "../apolloClient";

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      user {
        userId
        username
        email
        isVerified
      }
      message
    }
  }
`;

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, { client: authClient });

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData({
          username: parsedUser.username,
          email: parsedUser.email,
          password: "",
        });
      } catch {
        setUser(null);
      }
    }
  }, []);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== passwordConfirm) {
      alert("Password and confirm password do not match!");
      return;
    }

    try {
      const variables = {
        input: {
          userId: user.userId,
          username: formData.username,
          email: formData.email,
          password: formData.password || null,
        },
      };

      const { data } = await updateProfile({ variables });

      const updatedUser = {
        ...user,
        username: data.updateProfile.user.username,
        email: data.updateProfile.user.email,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      setEditing(false);
      setPasswordConfirm("");
      setFormData((prev) => ({ ...prev, password: "" }));
      alert(data.updateProfile.message || "Account updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update account: " + err.message);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-24 p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">My Account</h1>
        <p className="mb-4 text-gray-700">
          You need to be logged in to view your account details.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-24 p-6 bg-white shadow-md rounded-xl">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-pink-950">
        My Account
      </h1>

      <div className="space-y-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-3 gap-1">
          <span className="font-semibold text-gray-700">User ID</span>
          <span className="text-gray-900 break-all text-sm sm:text-base">{user.userId}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-3 gap-1">
          <span className="font-semibold text-gray-700">Username</span>
          {editing ? (
            <input
              name="username"
              value={formData.username}
              onChange={onChangeHandler}
              className="border p-1 rounded w-full sm:w-2/3"
            />
          ) : (
            <span className="text-gray-900">{user.username}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-3 gap-1">
          <span className="font-semibold text-gray-700">Email</span>
          {editing ? (
            <input
              name="email"
              value={formData.email}
              onChange={onChangeHandler}
              className="border p-1 rounded w-full sm:w-2/3"
            />
          ) : (
            <span className="text-gray-900">{user.email}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-3 gap-1">
          <span className="font-semibold text-gray-700">Password</span>
          {editing ? (
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={onChangeHandler}
              placeholder="Enter new password"
              className="border p-1 rounded w-full sm:w-2/3"
            />
          ) : (
            <span className="text-gray-900">**********</span>
          )}
        </div>

        {editing && (
          <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-3 gap-1">
            <span className="font-semibold text-gray-700">Confirm Password</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="border p-1 rounded w-full sm:w-2/3"
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setPasswordConfirm("");
                  setFormData((prev) => ({ ...prev, password: "" }));
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 mt-5 w-full bg-pink-600 text-white rounded-2xl hover:bg-pink-700 transition"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;