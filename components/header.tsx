import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignIn from './SignIn';
import SignOut from './SignOut';

const Header: React.FC = () => {
    const { user, loading } = useAuth();

    return (
        <header>
            {/* Your existing header content */}
            {!loading && (
                <>
                    {user ? <SignOut /> : <SignIn />}
                </>
            )}
        </header>
    );
};

export default Header;
