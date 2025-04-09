/* AuthService - Handles user authentication with the server */
class AuthService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
        this.currentUser = null;
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData || 'Login failed');
            }

            const userData = await response.json();
            this.currentUser = userData.username;
            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    async logout() {
        try {
            await fetch(`${this.baseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            this.currentUser = null;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    async getUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/users`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to get users');
            }

            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
} 