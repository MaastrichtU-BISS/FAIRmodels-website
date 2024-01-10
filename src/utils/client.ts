import axios from 'axios'
import jwt, { jwtService } from './jwt.service';
import { authService } from './auth.service';

const axiosOptions = {
  baseURL: process.env.API_URL,
  validateStatus: () => true,
}

export const authClient = axios.create(axiosOptions);
export const client = axios.create(axiosOptions)

client.interceptors.request.use(async (req) => {
  let accessToken = jwt.getAccessToken();
  if (!jwtService.isTokenNaivelyValid(accessToken)) {
    const refreshed = await authService.refresh();
    if (refreshed) {
      accessToken = jwt.getAccessToken()
    } else {
      // redirect to login
      console.log("[CLIENT - REQ] REDIRECT TO LOGIN")
    }
  }
  req.headers.Authorization = accessToken;
  return req;
})

client.interceptors.response.use(async (res) => {
  if (res.status == 401) {
    // src: https://alitoshmatov.medium.com/handling-token-based-authentication-and-refreshing-token-in-axios-axios-interceptors-d896f4e3a16c
    const refreshed = await authService.refresh();
    if (refreshed) {
      const accessToken = jwt.getAccessToken()
      const config = res.config;
      config.headers.Authorization = accessToken;
      return client(config); // <-- replaying request
    } else {
      console.log("[CLIENT - RES] REDIRECT TO LOGIN")
    }
  }
  return res;
})