"use client";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const SignInLayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [formData, setFormData] = useState({
    mobile: "7354657459",
    password: "7354657459",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!formData.mobile) {
      toast.error("Please enter your mobile number");
      return;
    }

    // Validate mobile number
    if (!/^\d{10,15}$/.test(formData.mobile)) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: formData.mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        toast.success(data.message || "OTP sent successfully");
        // In development, show OTP in console
        if (data.otp) {
          console.log("OTP:", data.otp);
          toast.success(`OTP: ${data.otp} (Development only)`, {
            duration: 10000,
          });
        }
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;

      if (loginMethod === "password") {
        if (!formData.mobile || !formData.password) {
          toast.error("Please enter mobile number and password");
          setIsLoading(false);
          return;
        }

        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile: formData.mobile,
            password: formData.password,
          }),
        });
      } else {
        // OTP login
        if (!formData.mobile || !formData.otp) {
          toast.error("Please enter mobile number and OTP");
          setIsLoading(false);
          return;
        }

        response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile: formData.mobile,
            otp: formData.otp,
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        toast.success("Login successful!");
        // Redirect to the original page or home page
        // Use window.location for a full page reload to ensure session is recognized
        const redirect = searchParams.get("redirect") || "/";
        window.location.href = redirect;
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    const passwordInput = document.getElementById("your-password");
    if (passwordInput) {
      passwordInput.type = showPassword ? "password" : "text";
    }
  };

  return (
    <section className="auth bg-base d-flex flex-wrap">
      <div className="auth-left d-lg-block d-none">
        <div className="d-flex align-items-center flex-column h-100 justify-content-center">
          <img src="assets/images/auth/auth-img.png" alt="" />
        </div>
      </div>
      <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
        <div className="max-w-464-px mx-auto w-100">
          <div>
            <Link href="/" className="mb-40 max-w-290-px">
              <img src="assets/images/logo.png" alt="" />
            </Link>
            <h4 className="mb-12">Sign In to your Account</h4>
            <p className="mb-32 text-secondary-light text-lg">
              Welcome back! please enter your detail
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="mb-24 d-flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("password");
                setOtpSent(false);
                setFormData({ mobile: formData.mobile, password: "", otp: "" });
              }}
              className={`btn ${
                loginMethod === "password"
                  ? "btn-primary"
                  : "btn-outline-primary"
              } btn-sm px-16 py-8 radius-8`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("otp");
                setOtpSent(false);
                setFormData({ mobile: formData.mobile, password: "", otp: "" });
              }}
              className={`btn ${
                loginMethod === "otp" ? "btn-primary" : "btn-outline-primary"
              } btn-sm px-16 py-8 radius-8`}
            >
              OTP
            </button>
          </div>

          <form
            onSubmit={
              loginMethod === "otp" && !otpSent ? handleSendOTP : handleLogin
            }
          >
            <div className="icon-field mb-16">
              <span className="icon top-50 translate-middle-y">
                <Icon icon="solar:phone-outline" />
              </span>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="form-control h-56-px bg-neutral-50 radius-12"
                placeholder="Mobile Number"
                required
                disabled={isLoading || otpLoading}
              />
            </div>

            {loginMethod === "password" ? (
              <>
                <div className="position-relative mb-20">
                  <div className="icon-field">
                    <span className="icon top-50 translate-middle-y">
                      <Icon icon="solar:lock-password-outline" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control h-56-px bg-neutral-50 radius-12"
                      id="your-password"
                      placeholder="Password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <span
                    onClick={togglePasswordVisibility}
                    className="toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light"
                  />
                </div>
                <div className="mb-20">
                  <div className="d-flex justify-content-between gap-2">
                    <div className="form-check style-check d-flex align-items-center">
                      <input
                        className="form-check-input border border-neutral-300"
                        type="checkbox"
                        id="remeber"
                      />
                      <label className="form-check-label" htmlFor="remeber">
                        Remember me
                      </label>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-primary-600 fw-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                {otpSent ? (
                  <div className="icon-field mb-16">
                    <span className="icon top-50 translate-middle-y">
                      <Icon icon="solar:key-outline" />
                    </span>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className="form-control h-56-px bg-neutral-50 radius-12"
                      placeholder="Enter OTP"
                      maxLength="6"
                      required
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div className="mb-20">
                    <p className="text-secondary-light text-sm">
                      We'll send you a one-time password to verify your mobile
                      number.
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
              disabled={isLoading || otpLoading}
            >
              {isLoading || otpLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {otpLoading ? "Sending..." : "Signing In..."}
                </>
              ) : loginMethod === "otp" && !otpSent ? (
                "Send OTP"
              ) : (
                "Sign In"
              )}
            </button>

            {loginMethod === "otp" && otpSent && (
              <button
                type="button"
                onClick={handleSendOTP}
                className="btn btn-outline-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-16"
                disabled={otpLoading}
              >
                {otpLoading ? "Resending..." : "Resend OTP"}
              </button>
            )}

            <div className="mt-32 text-center text-sm">
              <p className="mb-0">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-primary-600 fw-semibold">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;
