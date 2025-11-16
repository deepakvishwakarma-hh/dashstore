import axios from "axios";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";
const API_TOKEN =
  process.env.NEXT_PUBLIC_STRAPI_API_TOKEN ||
  "63c26721cf3a6a03eb8ea2b0a4e4db97a347a17ba45c7e799caa6ceec3166fcdcc0af3211f1ebd8a12aea8d2778149b8be910ffc6b6819c7be883f08e8d0c09774aa46a0ca91e4c82c5532efe62075a05f0300099cf7f11f1f406b5a24663bf62a751f9880b4d139dbc4c6c374574cfd44b9eefc229bc90376c4cbf6960f4ead";

// Base axios instance for Strapi API calls (server-side with API token)
const strapiApi = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

// Client-side function to get authenticated Strapi instance
// This will use the session JWT if available
export async function getAuthenticatedStrapiApi() {
  try {
    // Get session from API
    const sessionResponse = await fetch("/api/auth/session");
    const sessionData = await sessionResponse.json();

    // Create axios instance with JWT if available
    const headers = {
      "Content-Type": "application/json",
    };

    if (sessionData.isLoggedIn && sessionData.user) {
      // If we have a JWT in session, use it; otherwise use API token
      // Note: For OTP login, JWT might be null, so we'll use API token as fallback
      const token = sessionData.jwt || API_TOKEN;
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.Authorization = `Bearer ${API_TOKEN}`;
    }

    return axios.create({
      baseURL: STRAPI_URL,
      headers,
    });
  } catch (error) {
    console.error("Error getting authenticated Strapi API:", error);
    // Return default instance on error
    return strapiApi;
  }
}

// Server-side function to get authenticated Strapi instance
export async function getServerStrapiApi(jwt = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  return axios.create({
    baseURL: STRAPI_URL,
    headers,
  });
}

// Default export for backward compatibility (uses API token)
export default strapiApi;
