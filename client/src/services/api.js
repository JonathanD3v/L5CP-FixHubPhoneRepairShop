import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log('API Request:', {
    //   url: config.url,
    //   method: config.method,
    //   headers: config.headers
    // });
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // console.log('API Response:', {
    //   url: response.config.url,
    //   status: response.status,
    //   data: response.data
    // });
    return response;
  },
  (error) => {
    console.error("API Response Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
