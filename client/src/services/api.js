import axios from "axios";

const configuredBaseUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
        ? "http://localhost:5000"
        : "");

if (!configuredBaseUrl) {
    throw new Error(
        "VITE_API_URL is missing in production."
    );
}

const normalizedBaseUrl =
    configuredBaseUrl
        .trim()
        .replace(/\/+$/, "");

const baseURL =
    normalizedBaseUrl.endsWith("/api")
        ? normalizedBaseUrl
        : `${normalizedBaseUrl}/api`;

export const api = axios.create({
    baseURL,
    timeout: 20000,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token =
        sessionStorage.getItem("asy_access_token");

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization =
            `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            !error.config?.url?.includes("/auth/login")
        ) {
            sessionStorage.removeItem(
                "asy_access_token"
            );
        }

        return Promise.reject(error);
    }
);

export { baseURL };