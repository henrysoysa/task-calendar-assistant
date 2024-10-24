import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import SignIn from './SignIn';
import SignOut from './SignOut';

const Header: React.FC = () => {
    const { user, loading } = useAuthContext();

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
