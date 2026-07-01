export function useAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const rawUser = userStr ? JSON.parse(userStr) : null;

    const user = rawUser ? { 
        ...rawUser, 
        id: rawUser.id ?? rawUser._id 
    } : null;

    const isLoggedIn = !!token && !!user;

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return { token, user, isLoggedIn, logout };
}