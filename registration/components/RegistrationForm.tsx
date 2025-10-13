"use client";

import { useState } from "react";

type FormState = "idle" | "warning" | "failure" | "success";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldMessages {
  firstName?: { text: string; isWarning: boolean };
  lastName?: { text: string; isWarning: boolean };
  email?: { text: string; isWarning: boolean };
  password?: { text: string; isWarning: boolean };
  confirmPassword?: { text: string; isWarning: boolean };
}

interface TouchedFields {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [messages, setMessages] = useState<FieldMessages>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [formState, setFormState] = useState<FormState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate field and return message
  const validateField = (
    field: keyof FormData,
    value: string
  ): { text: string; isWarning: boolean } | null => {
    switch (field) {
      case "firstName":
        if (!value.trim())
          return { text: "First name can't be empty", isWarning: true };
        return null;

      case "lastName":
        if (!value.trim())
          return { text: "Last name can't be empty", isWarning: true };
        return null;

      case "email":
        if (!value) return { text: "Email can't be empty", isWarning: true };
        const emailRegex = /^[^\s@]+@gmail\.com$/;
        if (!emailRegex.test(value))
          return { text: "Must be a Gmail address", isWarning: true };
        if (value === "test@gmail.com")
          return { text: "This email is already registered", isWarning: true };
        return null;

      case "password":
        if (!value) return { text: "Password can't be empty", isWarning: true };
        if (value.length < 8 || value.length > 30)
          return { text: "Password must be 8-30 characters", isWarning: true };
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
        if (!hasLower || !hasUpper || !hasNumber || !hasSpecial)
          return {
            text: "Needs upper, lower, number & symbol",
            isWarning: true,
          };
        return null;

      case "confirmPassword":
        if (!value)
          return {
            text: "Please confirm your password",
            isWarning: true,
          };
        if (value !== formData.password)
          return { text: "Passwords don't match", isWarning: true };
        return null;

      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Only show validation if field was already touched
    if (touchedFields[field]) {
      const message = validateField(field, value);
      setMessages((prev) => ({
        ...prev,
        [field]: message,
      }));
    }

    if (formState !== "idle") {
      setFormState("idle");
    }
  };

  const handleBlur = (field: keyof FormData) => {
    // Mark field as touched
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

    // Show validation message
    const message = validateField(field, formData[field]);
    setMessages((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  const isFormValid = () => {
    return Object.keys(formData).every((field) => {
      const message = validateField(
        field as keyof FormData,
        formData[field as keyof FormData]
      );
      return message === null;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate all fields
    const newMessages: FieldMessages = {};
    let hasErrors = false;

    (Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const message = validateField(field, formData[field]);
      if (message) {
        newMessages[field] = message;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setMessages(newMessages);
      setFormState("warning");
      return;
    }

    setIsSubmitting(true);
    setFormState("idle");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setFormState("success");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setMessages({});
        setTouchedFields({
          firstName: false,
          lastName: false,
          email: false,
          password: false,
          confirmPassword: false,
        });
      } else {
        const errorData = await response.json();
        setFormState("failure");
        if (errorData.error?.field && errorData.error?.message) {
          setMessages({
            [errorData.error.field]: {
              text: errorData.error.message,
              isWarning: true,
            },
          });
        }
      }
    } catch {
      setFormState("failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    // Reset to show registration form again (no real login page yet)
    setFormState("idle");
  };

  // Success view
  if (formState === "success") {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-container">
            <h1 className="success-title">All set! You're ready to go :)</h1>
            <button onClick={handleLoginClick} className="login-button">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form view
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Your Account</h1>
        {formState === "failure" && (
          <div className="status-message status-failure">
            Registration failed. Please try again.
          </div>
        )}
        {formState === "warning" && (
          <div className="status-message status-warning">
            Oops-Please correct errors below:(
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* First Name */}
          <div className="form-group">
            <input
              type="text"
              id="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={`form-input ${
                messages.firstName?.isWarning ? "error" : ""
              }`}
              disabled={isSubmitting}
            />
            {messages.firstName && (
              <div
                className={`field-message ${
                  messages.firstName.isWarning ? "warning" : "hint"
                }`}
              >
                {messages.firstName.text}
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <input
              type="text"
              id="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={`form-input ${
                messages.lastName?.isWarning ? "error" : ""
              }`}
              disabled={isSubmitting}
            />
            {messages.lastName && (
              <div
                className={`field-message ${
                  messages.lastName.isWarning ? "warning" : "hint"
                }`}
              >
                {messages.lastName.text}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <input
              type="email"
              id="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`form-input ${
                messages.email?.isWarning ? "error" : ""
              }`}
              disabled={isSubmitting}
            />
            {messages.email && (
              <div
                className={`field-message ${
                  messages.email.isWarning ? "warning" : "hint"
                }`}
              >
                {messages.email.text}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                className={`form-input ${
                  messages.password?.isWarning ? "error" : ""
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {messages.password && (
              <div
                className={`field-message ${
                  messages.password.isWarning ? "warning" : "hint"
                }`}
              >
                {messages.password.text}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleBlur("confirmPassword")}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                className={`form-input ${
                  messages.confirmPassword?.isWarning ? "error" : ""
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {messages.confirmPassword && (
              <div
                className={`field-message ${
                  messages.confirmPassword.isWarning ? "warning" : "hint"
                }`}
              >
                {messages.confirmPassword.text}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? "Creating Account..." : "Let's go"}
          </button>

          <p className="terms">
            I agree to the{" "}
            <a href="/terms-of-service" className="terms-link">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy-policy" className="terms-link">
              Privacy Policy
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
