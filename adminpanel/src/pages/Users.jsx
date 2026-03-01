import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { loginClient } from '../Apolloclient';

const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      username
      email
      isActive
      isVerified
      verificationToken
    }
  }
`;


const DELETE_USER = gql`
  mutation DeleteUser($userId: UUID!) {
    deleteUser(userId: $userId)
  }
`;

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await loginClient.query({
        query: GET_ALL_USERS,
        fetchPolicy: 'network-only',
      });
      setUsers(data.getAllUsers || []);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };


  const removeUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await loginClient.mutate({
        mutation: DELETE_USER,
        variables: { userId: id },
      });
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete user.');
    }
  };

  const verifyUser = async (token, userId) => {
    if (!token) return alert("This user has no verification token.");
    try {
      await loginClient.mutate({
        mutation: VERIFY_EMAIL,
        variables: { token },
      });
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isVerified: true } : u)
      );
    } catch (error) {
      console.error(error);
      alert('Failed to verify user.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <svg className="animate-spin h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Users</h2>

      <input
        type="text"
        placeholder="Search by username..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      <div className="hidden md:grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_120px] gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 uppercase mb-2">
        <span>ID</span>
        <span>Username</span>
        <span>Email</span>
        <span>Status</span>
        <span>Verified</span>
        <span>Actions</span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No users found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="border border-gray-200 rounded-xl hover:bg-gray-50 transition overflow-hidden"
            >

              <div className="hidden md:grid grid-cols-[1fr_1.5fr_2fr_1fr_1fr_120px] gap-3 px-4 py-3 items-center text-sm text-gray-700">
                <p className="font-mono text-xs text-gray-400 truncate">{user.id}</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs uppercase shrink-0">
                    {user.username?.charAt(0) || 'U'}
                  </div>
                  <span className="font-medium truncate">{user.username}</span>
                </div>
                <p className="text-gray-500 truncate">{user.email}</p>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium w-fit ${user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-500 border-red-200'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium w-fit ${user.isVerified ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
                <div className="flex gap-1">
                  {!user.isVerified && (
                    <button
                      onClick={() => verifyUser(user.verificationToken, user.id)}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => removeUser(user.id)}
                    className="px-2 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="md:hidden p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm uppercase shrink-0">
                      {user.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!user.isVerified && (
                      <button
                        onClick={() => verifyUser(user.verificationToken, user.id)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => removeUser(user.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-500 border-red-200'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${user.isVerified ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className="text-xs font-mono text-gray-400 truncate">{user.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;