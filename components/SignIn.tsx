"use client";

import React from 'react';
import { Button } from './ui/button';
import { useAuthContext } from '../contexts/AuthContext';

const SignIn: React.FC = () => {
  const { login } = useAuthContext();

  const handleSignIn = async () => {
    console.log("Sign in button clicked");
    try {
      console.log("Attempting to login...");
      await login();
      console.log("Login function completed");
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Button onClick={handleSignIn}>
      Sign in with Google
    </Button>
  );
};

export default SignIn;
