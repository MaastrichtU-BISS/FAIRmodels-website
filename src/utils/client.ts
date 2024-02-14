import axios from 'axios'
import jwt, { jwtService } from './jwt.service';
import { authService } from './auth.service';
import { useQuasar } from 'quasar';
import getRouter from '../router';

const axiosOptions = {
  baseURL: process.env.API_URL,
  validateStatus: () => true,
}

export const authClient = axios.create(axiosOptions);
export const client = axios.create(axiosOptions);

// /*
client.interceptors.request.use(async (req) => {
  // let accessToken = jwt.getAccessToken();
  const accessToken = jwt.getAccessToken();
  // if (!jwtService.isTokenNaivelyValid(accessToken)) {
  //   const refreshed = await authService.refresh();
  //   if (refreshed) {
  //     accessToken = jwt.getAccessToken()
  //   } else {
  //     // redirect to login
  //     console.log("[CLIENT - REQ] REDIRECT TO LOGIN")
  //   }
  // }
  req.headers.Authorization = `Bearer ${accessToken}`;
  return req;
})
// */

client.interceptors.response.use(async (res) => {
  if (res.status == 401 && res.data.code && res.data.code == 'token_not_valid') {
    // src: https://alitoshmatov.medium.com/handling-token-based-authentication-and-refreshing-token-in-axios-axios-interceptors-d896f4e3a16c
    let refreshed;
    try {
      refreshed = await authService.refresh();
    } catch (err) {
      refreshed = false;
      if (err instanceof Error) {
        console.error("Error occured while refreshing token:", err)
      }
    }

    if (refreshed) {
      const accessToken = jwt.getAccessToken()
      const config = res.config;
      config.headers.Authorization = accessToken;
      return client(config); // <-- replaying request
    } else {
      jwt.clearTokens();
      getRouter().push('/auth/login')
    }
  }
  return res;
}, (err) => {
  console.error("AxiosError:", err)
  const $q = useQuasar()
  if ($q)
    $q.notify({type: 'negative', message: err.message})
})

// export client = client;
// export const getClient = () => {
//   return client;
// }

// export default getClient