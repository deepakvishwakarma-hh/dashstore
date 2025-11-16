import { NextResponse } from "next/server";
import axios from "axios";
import { saveSession } from "@/lib/session";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, password, identifier, otp } = body;

    // Validate input
    if (!mobile && !identifier) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    const mobileNumber = mobile || identifier;

    // Login with password
    if (password) {
      try {
        // Find user by mobile number
        // In Strapi, we need to find the user first, then authenticate
        // Since Strapi uses email/username for auth, we'll use the mobile-based email pattern
        const email = `${mobileNumber}@gmail.com`;

        // Authenticate with Strapi
        const response = await axios.post(`${STRAPI_URL}/auth/local`, {
          identifier: email, // Strapi uses identifier which can be email or username
          password: password,
        });

        const { user, jwt } = response.data;

        // Save session
        const sessionData = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            type: user.type,
          },
          jwt: jwt,
          isLoggedIn: true,
        };

        await saveSession(sessionData);

        // Verify session was saved (debug)
        if (process.env.NODE_ENV === "development") {
          const { getSession } = await import("@/lib/session");
          const savedSession = await getSession();
          console.log("Login - Session saved and verified:", {
            isLoggedIn: savedSession.isLoggedIn,
            hasUser: !!savedSession.user,
            userId: savedSession.user?.id,
          });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            mobile: user.mobile,
            name: user.name,
            type: user.type,
          },
        });
      } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        return NextResponse.json(
          {
            error:
              error.response?.data?.error?.message || "Invalid credentials",
          },
          { status: 401 }
        );
      }
    }

    // Login with OTP
    if (otp) {
      // TODO: Implement OTP verification logic
      // For now, this is a placeholder - you'll need to implement OTP generation and verification
      // This typically involves:
      // 1. Generating OTP and storing it (in-memory cache, Redis, or database)
      // 2. Sending OTP via SMS service
      // 3. Verifying OTP on login

      return NextResponse.json(
        { error: "OTP login not yet implemented" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: "Password or OTP is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
