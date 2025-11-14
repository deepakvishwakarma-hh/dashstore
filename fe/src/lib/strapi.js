import axios from "axios";

// Configure axios instance for Strapi API calls
const strapiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer 63c26721cf3a6a03eb8ea2b0a4e4db97a347a17ba45c7e799caa6ceec3166fcdcc0af3211f1ebd8a12aea8d2778149b8be910ffc6b6819c7be883f08e8d0c09774aa46a0ca91e4c82c5532efe62075a05f0300099cf7f11f1f406b5a24663bf62a751f9880b4d139dbc4c6c374574cfd44b9eefc229bc90376c4cbf6960f4ead`,
  },
});

export default strapiApi;
