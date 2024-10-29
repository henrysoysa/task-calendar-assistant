import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import SignIn from './SignIn';
import SignOut from './SignOut';

const Header: React.FC = () => {
    const { userId, loading } = useAuthContext();

    return (
        <header>
            {/* Your existing header content */}
            {!loading && (
                <>
                    {userId ? <SignOut /> : <SignIn />}
                </>
            )}
        </header>
    );
};

export default Header;
