import React from 'react';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';

const SignOut: React.FC = () => {
  return (
    <Button onClick={() => auth.signOut()}>
      Sign Out
    </Button>
  );
};

export default SignOut;
