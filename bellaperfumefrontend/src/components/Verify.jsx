import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';
import { authClient } from '../apolloClient';

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

const Verify = () => {
  const [message, setMessage] = useState('Verifying...');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const [verifyEmail] = useMutation(VERIFY_EMAIL, { client: authClient });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    if (!token) {
      setError(true);
      setMessage('Token is missing.');
      return;
    }

    verifyEmail({ variables: { token } })
      .then(({ data }) => {
        setMessage(data.verifyEmail);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      })
      .catch((err) => {
        setError(true);
        setMessage(err.message.replace('GraphQL error: ', ''));
      });
  }, [navigate, verifyEmail]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
      {error && <p className="text-red-600">Something went wrong. Please try again later.</p>}
    </div>
  );
};

export default Verify;
