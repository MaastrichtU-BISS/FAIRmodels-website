import { jwtDecode } from 'jwt-decode';

const accessKey = 'accessToken'
const refreshKey = 'refreshToken'

export const jwtService = {
    getAccessToken(): string | null {
        return localStorage.getItem(accessKey);
    },

    /**
     * Naively determines if token is valid. Invalid token can be eighter
     * a non-existing token, or a token that ought to be expired according
     * to the clients local internal time/date (which can be inaccurate, 
     * hence naive)
     */
    // isTokenNaivelyValid(token: string | null): boolean {
    //     if (!token) return false;
    //     const exp = jwtDecode(token).exp;
    //     if (!exp) return false
    //     return (exp * 1000) > Date.now()
    // },

    getRefreshToken(): string | null {
        return localStorage.getItem(accessKey)
    },

    setTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem(accessKey, accessToken);
        localStorage.setItem(refreshKey, refreshToken);
    },

    clearTokens() {
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey)
    }
}

export default jwtService