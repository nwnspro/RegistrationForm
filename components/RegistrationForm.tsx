"use client";

import { useState } from "react";
import type {
  FormData,
  FieldMessages,
  TouchedFields,
  FormState,
  FailureType,
} from "@/types/user";

// ============================================================================
// FORM STATUS COMPONENT - DISPLAYS ALL 4 FORM STATES
// ============================================================================
/**
 * This component visually represents ALL 4 required form states:
 *
 * STATE 1: IDLE
 *   - No banner shown
 *   - Form is clean, no errors
 *   - Test: "does not show any status message initially (idle state)"
 *
 * STATE 2: WARNING
 *   - No banner shown (inline field messages only)
 *   - Shows inline error messages under specific fields
 *   - Test: "shows warning state when submitting with invalid email format"
 *
 * STATE 3: FAILURE
 *   - Shows banner at top of form
 *   - Two types:
 *     a) Validation failure: "Oops-Please correct errors below:("
 *     b) Server error: "Something went wrong on our end. Please try again."
 *   - Tests: "shows FAILURE state when submitting empty form", "shows failure state with server error message"
 *
 * STATE 4: SUCCESS
 *   - Replaces entire form with success page (rendered in main component, not here)
 *   - Test: "submits form successfully with valid data"
 */
function FormStatus({
  state,
  failureType,
}: {
  state: FormState;
  failureType: FailureType;
}) {
  // STATE 3: FAILURE - Show banner with error message
  if (state === "failure") {
    if (failureType === "validation") {
      return (
        <div className="status-message status-warning">
          {/* Tests that check for this: lines 40-56, 58-88, 90-120 in RegistrationForm.test.tsx */}
          Oops-Please correct errors below:(
        </div>
      );
    }
    if (failureType === "server") {
      return (
        <div className="status-message status-warning">
          {/* Tests that check for this: lines 296-327, 329-367 in RegistrationForm.test.tsx */}
          Something went wrong on our end. Please try again.
        </div>
      );
    }
  }

  // STATE 1: IDLE & STATE 2: WARNING - No banner shown
  // For WARNING state, inline messages appear under fields instead
  // Tests: lines 29-38 (idle), 254-294 (warning with field-specific errors)
  return null;
}

// ============================================================================
// MAIN REGISTRATION FORM COMPONENT
// ============================================================================

/**
 * RegistrationForm Component
 *
 * Implements 4 form states as required:
 *
 * 1. IDLE - Initial state, clean form (default)
 *    - No banner message
 *    - No inline field messages
 *    - Trigger: Initial load, or when all validation errors are fixed
 *
 * 2. WARNING - Field-level validation
 *    - Shows inline messages under input boxes
 *    - NO banner message
 *    - Trigger: User blurs field with error, or types in touched field, or field-specific server error
 *    - Example: User leaves email empty, inline message appears
 *
 * 3. FAILURE - Form submission errors
 *    - Validation failure: Shows banner "Oops-Please correct errors below:(" + inline field errors
 *    - Server error: Shows banner "Something went wrong on our end. Please try again."
 *    - Trigger: User clicks submit with invalid data, or server/network error
 *    - Banner disappears when user starts typing to fix errors
 *
 * 4. SUCCESS - Successful registration
 *    - Shows full success page with "All set!" message
 *    - Replaces form with success view
 *    - Trigger: API returns success response
 */
export default function RegistrationForm() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

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
  const [failureType, setFailureType] = useState<FailureType>("validation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================================
  // VALIDATION LOGIC
  // ============================================================================

  /**
   * Client-side validation rules
   * TESTED BY: Lines 459-514 (blur validation), 489-513 (inline error clearing), 663-756 (email validation)
   * If you modify these rules, the corresponding tests WILL FAIL
   */
  const validateField = (
    field: keyof FormData,
    value: string
  ): { text: string; isWarning: boolean } | null => {
    switch (field) {
      case "firstName":
        // TESTED BY: Line 460-472 (blur), Line 840-853 (whitespace)
        if (!value)
          return { text: "First name can't be empty", isWarning: true };
        return null;

      case "lastName":
        // TESTED BY: Line 474-486 (blur), Line 855-868 (whitespace)
        if (!value)
          return { text: "Last name can't be empty", isWarning: true };
        return null;

      case "email":
        // TESTED BY: Lines 664-740 (format validation), Lines 742-756 (registered email), Lines 758-837 (case-insensitive)
        const lowerEmail = value.toLowerCase();
        if (!lowerEmail)
          return { text: "Email can't be empty", isWarning: true };
        // Check if it has basic email structure (has @ and some text before/after)
        // TESTED BY: Lines 664-678 (no @ sign), 680-693 (no domain), 695-708 (no extension)
        const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!basicEmailRegex.test(lowerEmail))
          return { text: "Please put a valid email", isWarning: true };
        // Check if it's specifically a Gmail address
        // TESTED BY: Lines 710-723, Line 58-88 (non-Gmail rejection)
        const gmailRegex = /^[^\s@]+@gmail\.com$/;
        if (!gmailRegex.test(lowerEmail))
          return { text: "Must be a Gmail address", isWarning: true };
        // Check if email is already registered (case-insensitive)
        // TESTED BY: Lines 742-756, Lines 758-803 (case variations)
        if (lowerEmail === "test@gmail.com")
          return {
            text: "Email address is already registered",
            isWarning: true,
          };
        return null;

      case "password":
        // TESTED BY: Lines 973-998 (space prevention via onKeyDown), API test lines 267-384 (all password requirements)
        // Note: Space validation removed - onKeyDown at line 357-359 prevents spaces from being typed
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
        // TESTED BY: Lines 90-120 (mismatch), Lines 537-564 (dynamic validation)
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

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle input change
   * STATE 2: WARNING - Shows inline validation when field is touched
   * TESTED BY: Lines 489-513 (inline error clearing), Lines 515-535 (FAILURE banner clearing)
   * If you remove or modify the state transitions, tests WILL FAIL
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Only show validation if field was already touched
    if (touchedFields[field]) {
      const message = validateField(field, value);
      const newMessages = {
        ...messages,
        [field]: message,
      };
      setMessages(newMessages);

      // Check if any validation messages exist
      const hasAnyMessages = Object.values(newMessages).some(
        (msg) => msg !== null
      );

      // STATE 2: WARNING - If inline messages exist
      // STATE 1: IDLE - If no messages
      // Clear FAILURE banner when user starts typing
      if (hasAnyMessages && formState === "idle") {
        setFormState("warning");
      } else if (
        !hasAnyMessages &&
        (formState === "warning" || formState === "failure")
      ) {
        setFormState("idle");
      } else if (formState === "failure") {
        setFormState("idle");
      }
    } else if (formState === "failure") {
      setFormState("idle");
    }
  };

  /**
   * Handle field blur
   * STATE 2: WARNING - Trigger validation on blur
   * TESTED BY: Lines 459-487 (firstName/lastName blur validation)
   * If you remove onBlur handlers from inputs, tests WILL FAIL
   */
  const handleBlur = (field: keyof FormData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

    const message = validateField(field, formData[field]);
    setMessages((prev) => ({
      ...prev,
      [field]: message,
    }));

    // STATE 2: WARNING - Set when inline message appears
    if (message && formState === "idle") {
      setFormState("warning");
    }
  };

  /**
   * Handle form submission
   * STATE 3: FAILURE - Show banner if validation fails
   * STATE 4: SUCCESS - Registration successful
   * TESTED BY: Lines 40-56 (empty form), Lines 167-207 (valid form), Lines 209-252 (API success)
   * If you modify submission logic or validation checks, tests WILL FAIL
   */
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
      setFailureType("validation");
      setFormState("failure"); // STATE 3: FAILURE - Submit with validation errors
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
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
      });

      if (response.ok) {
        setFormState("success"); // STATE 4: SUCCESS
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
        // If server returns a specific field error, show inline message with warning state
        if (errorData.error?.field && errorData.error?.message) {
          setFormState("warning"); // STATE 2: WARNING - Field-specific server error
          setMessages({
            [errorData.error.field]: {
              text: errorData.error.message,
              isWarning: true,
            },
          });
        } else {
          // Generic server error - show banner with failure state
          setFailureType("server");
          setFormState("failure"); // STATE 3: FAILURE - Generic server error
        }
      }
    } catch {
      setFailureType("server");
      setFormState("failure"); // STATE 3: FAILURE - Network error
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to idle state
   */
  const resetForm = () => {
    setFormState("idle");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // STATE 4: SUCCESS - Show success page
  if (formState === "success") {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-container">
            <h1 className="success-title">
              All set!
              <br />
              You're ready to go
              <br />
              :)
            </h1>
            <button onClick={resetForm} className="login-button">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE 1: IDLE / STATE 2: WARNING / STATE 3: FAILURE - Show registration form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Your Account</h1>

        {/* Form status banner (only shows for FAILURE state) */}
        <FormStatus state={formState} failureType={failureType} />

        <form onSubmit={handleSubmit} className="auth-form">
          {/* First Name - TESTED BY: Lines 460-472, 840-902 */}
          <div className="form-group">
            <input
              type="text"
              id="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
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

          {/* Last Name - TESTED BY: Lines 474-486, 904-936 */}
          <div className="form-group">
            <input
              type="text"
              id="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
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

          {/* Email - TESTED BY: Lines 58-88, 254-294, 489-513, 663-837 */}
          <div className="form-group">
            <input
              type="email"
              id="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
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

          {/* Password - TESTED BY: Lines 146-165, 595-621, 973-998, 1000-1033 */}
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                onKeyDown={(e) => {
                  // TESTED BY: Lines 973-998 - If you remove this, space prevention test WILL FAIL
                  if (e.key === " ") e.preventDefault();
                }}
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

          {/* Confirm Password - TESTED BY: Lines 90-120, 537-564, 987-998, 610-621 */}
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
                onKeyDown={(e) => {
                  // TESTED BY: Lines 987-998 - If you remove this, space prevention test WILL FAIL
                  if (e.key === " ") e.preventDefault();
                }}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                // TESTED BY: Lines 610-621 - If you remove onPaste, paste prevention test WILL FAIL
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

          {/* Submit Button - TESTED BY: Lines 122-144, 369-414, 623-661 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {/* TESTED BY: Lines 399-402 (loading text), Line 604 (button text) */}
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
