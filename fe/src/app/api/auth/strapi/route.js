import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import axios from "axios";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";
const API_TOKEN =
  process.env.NEXT_PUBLIC_STRAPI_API_TOKEN ||
  "63c26721cf3a6a03eb8ea2b0a4e4db97a347a17ba45c7e799caa6ceec3166fcdcc0af3211f1ebd8a12aea8d2778149b8be910ffc6b6819c7be883f08e8d0c09774aa46a0ca91e4c82c5532efe62075a05f0300099cf7f11f1f406b5a24663bf62a751f9880b4d139dbc4c6c374574cfd44b9eefc229bc90376c4cbf6960f4ead";

// Proxy route for authenticated Strapi API calls
export async function GET(request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    const token = session.jwt || API_TOKEN;
    const response = await axios.get(`${STRAPI_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Strapi proxy error:", error);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || "Failed to fetch data" },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const body = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    const token = session.jwt || API_TOKEN;
    const response = await axios.post(`${STRAPI_URL}${endpoint}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Strapi proxy error:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.error?.message || "Failed to create data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const body = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    const token = session.jwt || API_TOKEN;
    const response = await axios.put(`${STRAPI_URL}${endpoint}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Strapi proxy error:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.error?.message || "Failed to update data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    const token = session.jwt || API_TOKEN;
    const response = await axios.delete(`${STRAPI_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Strapi proxy error:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.error?.message || "Failed to delete data",
      },
      { status: error.response?.status || 500 }
    );
  }
}
