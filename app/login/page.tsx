import React from 'react';
import dynamic from 'next/dynamic';

const SignIn = dynamic(() => import('../../components/SignIn'), { ssr: false });

const LoginPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn />
    </div>
  );
};

export default LoginPage;
