import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UserData {
    id: string;
    role: string;
    posisi: string;
    [key: string]: any;
}

interface AuthContextType {
    user: UserData | null;
    login: (user: UserData) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();

    const [user, setUser] = useState<UserData | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [user]);

    const login = (userData: UserData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login', { replace: true });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
