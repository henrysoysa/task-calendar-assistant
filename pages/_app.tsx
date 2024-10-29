import type { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ClerkProvider>
  );
}

export default MyApp;
