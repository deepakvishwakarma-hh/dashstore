import { NextResponse } from "next/server";
import axios from "axios";
import { saveSession } from "@/lib/session";
import { otpStore } from "../send/route";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, otp } = body;

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    // Get stored OTP
    const storedOtpData = otpStore.get(mobile);

    if (!storedOtpData) {
      return NextResponse.json(
        { error: "OTP not found or expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(mobile);
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Check attempts
    if (storedOtpData.attempts >= 3) {
      otpStore.delete(mobile);
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP verified - find user and create session
    try {
      const email = `${mobile}@gmail.com`;

      // Find user by mobile or email
      const userResponse = await axios.get(`${STRAPI_URL}/users`, {
        params: {
          filters: {
            $or: [{ email: email }, { mobile: mobile }],
          },
        },
      });

      if (!userResponse.data || userResponse.data.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = userResponse.data[0];

      // Generate JWT token for Strapi
      // Since we're using OTP, we need to authenticate with Strapi
      // We'll use a custom endpoint or generate a token
      // For now, we'll create a session without JWT and handle it in the frontend

      // Alternative: Use Strapi's password reset or custom auth endpoint
      // For OTP login, you might need to create a custom Strapi endpoint
      // that accepts mobile + OTP and returns a JWT

      // For now, we'll save the session and let the frontend handle API calls
      // You may need to create a custom Strapi endpoint for OTP authentication

      // Remove OTP from store
      otpStore.delete(mobile);

      // Save session
      await saveSession({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          name: user.name,
          type: user.type,
        },
        jwt: null, // OTP login might not have JWT - you'll need custom Strapi endpoint
        isLoggedIn: true,
      });

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
      console.error("User lookup error:", error);
      return NextResponse.json(
        { error: "Failed to authenticate user" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
