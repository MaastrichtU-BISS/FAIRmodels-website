import { useRouter } from "vue-router";
import getClient, { authClient } from "./client"
import jwtService from "./jwt.service";
import { useUserStore } from "src/stores/user";

const AUTH_API = {
	REGISTER: '/auth/register/',
	LOGIN: '/auth/login/',
	REFRESH_TOKEN: '/auth/token/refresh/'
}

export type RegisterErrorKeys = 'email' | 'password1' | 'password2' | 'non_field_errors';
export type LoginErrorKeys = 'email' | 'password' | 'non_field_errors';

type RegisterResponse =
  | { status: true }
  | { status: false, errors: Record<RegisterErrorKeys, string[]> }

type LoginResponse =
| { status: true }
| { status: false, errors: Record<LoginErrorKeys, string[]> }

const client = getClient();

export const authService = {
	user: () => {
		return client.get('/auth/user');
	},

	register: async (email: string, password1: string, password2: string): Promise<RegisterResponse> => {
		const response = await authClient.post(AUTH_API.REGISTER, { email, password1, password2 });
		if (Math.floor(response.status / 100) == 2) {
			if (response.data.access && response.data.refresh) {
				jwtService.setTokens(response.data.access, response.data.refresh)
				return { status: true };
			} else {
				throw Error("Invalid response body")
			}
		} else if (Math.floor(response.status / 100) == 4) {
			return { status: false, errors: response.data }
		} else {
			throw Error("Uncaught status-code")
		}
	},

	login: async (email: string, password: string): Promise<LoginResponse> => {
		const response = await authClient.post(AUTH_API.LOGIN, { email, password });
		if (Math.floor(response.status / 100) == 2) {
			if (response.data.access && response.data.refresh && response.data.user) {
				jwtService.setTokens(response.data.access, response.data.refresh)
				const userStore = useUserStore()
				userStore.setUser(response.data.user)
				return { status: true };
			} else {
				throw Error("Invalid response body")
			}
		} else if (Math.floor(response.status / 100) == 4) {
			return { status: false, errors: response.data }
		} else {
			throw Error("Uncaught status-code")
		}
	},

	refresh: async () => {
		const refreshToken = jwtService.getRefreshToken();
		// if (!jwtService.isTokenNaivelyValid(refreshToken)) {
		// 	// next: redirect to login
		// 	return false;
		// }
		if (!refreshToken) {
			return false;
		}
		const response = await authClient.post(AUTH_API.REFRESH_TOKEN, { refresh: jwtService.getRefreshToken() });
		if (response.status === 200) {
			if (response.data.access && response.data.refresh) {
				jwtService.setTokens(response.data.access, response.data.refresh)
				return true;
			} else {
				throw Error("Token refresh has invalid response body")
			}
		} else if (response.status === 401 && response.data.code === "token_not_valid") {
			return false;
		} else {
			throw Error("Error refreshing token")
		}
	},

	logout: async () => {
		jwtService.clearTokens()
	}
}