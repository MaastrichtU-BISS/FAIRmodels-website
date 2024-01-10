import { authClient } from "./client"
import jwtService from "./jwt.service";

const AUTH_API = {
	REGISTER: '/auth/register',
	LOGIN: '/auth/login',
	REFRESH_TOKEN: '/auth/token/refresh'
}

type RegisterResponse = 
  | { status: true }
  | { status: false, errors: Record<'email' | 'password1' | 'password2', string[]> }

export const authService = {
	register: async (email: string, password1: string, password2: string): Promise<RegisterResponse> => {
		console.log('[AUTH - REGISTER]')
		const response = await authClient.post(AUTH_API.REGISTER, { email, password1, password2 });
		if (response.status === 200) {
			if (response.data.accessToken && response.data.refreshToken) {
				jwtService.setTokens(response.data.accessToken, response.data.refreshToken)
				return { status: true };
			} else {
				throw Error("Login has invalid response body")
			}
		} else if (response.status === 400) {
			return { status: false, errors: response.data }
		} else {
			throw Error("Error logging in")
		}
	},

	login: async (username: string, password: string) => {
		console.log('[AUTH - LOGIN]')
		const response = await authClient.post(AUTH_API.LOGIN, { username, password });
		if (response.status === 200) {
			if (response.data.accessToken && response.data.refreshToken) {
				jwtService.setTokens(response.data.accessToken, response.data.refreshToken)
				return true;
			} else {
				throw Error("Login has invalid response body")
			}
		} else if (response.status === 400) {
			return false
		} else {
			throw Error("Error logging in")
		}
	},

	refresh: async () => {
		console.log('[AUTH - REFRESH]')
		const refreshToken = jwtService.getRefreshToken();
		if (!jwtService.isTokenNaivelyValid(refreshToken)) {
			// next: redirect to login
			return false;
		}
    const response = await authClient.post(AUTH_API.REFRESH_TOKEN, { refresh: jwtService.getRefreshToken() });
    if (response.status === 200) {
      if (response.data.accessToken && response.data.refreshToken) {
        jwtService.setTokens(response.data.accessToken, response.data.refreshToken)
				return true;
      } else {
        throw Error("Token refresh has invalid response body")
      }
    } else if (response.status === 401 && response.data.code === "token_not_valid") {
      // next: redirect to login
      return false;
    } else {
      throw Error("Error refreshing token")
    }
	},

	logout: async () => {
		jwtService.clearTokens()
	}
}