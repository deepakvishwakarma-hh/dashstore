import { NextResponse } from "next/server";
import axios from "axios";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

// In-memory OTP storage (use Redis or database in production)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    // Validate mobile number format (basic validation)
    if (!/^\d{10,15}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number format" },
        { status: 400 }
      );
    }

    // Check if user exists in Strapi
    try {
      const email = `${mobile}@gmail.com`;
      const response = await axios.get(`${STRAPI_URL}/users`, {
        params: {
          filters: {
            $or: [{ email: email }, { mobile: mobile }],
          },
        },
      });

      if (!response.data || response.data.length === 0) {
        return NextResponse.json(
          { error: "User not found with this mobile number" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("User lookup error:", error);
      // Continue anyway - might be a network issue
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(mobile, {
      otp,
      expiresAt,
      attempts: 0,
    });

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For development, we'll return the OTP in the response
    // In production, remove this and implement actual SMS sending
    console.log(`OTP for ${mobile}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Remove this in production
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

// Export OTP store for verification
export { otpStore };
