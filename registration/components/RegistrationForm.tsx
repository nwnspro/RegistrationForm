"use client";

import { useState } from "react";
import FormStatus from "./FormStatus";

type FormState = "idle" | "warning" | "failure" | "success";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [emailValidationHint, setEmailValidationHint] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
    useState(false);

  const checkEmailValidation = (email: string) => {
    if (!email) {
      setEmailValidationHint("Please use Gmail only (@gmail.com)");
      return;
    }

    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      setEmailValidationHint("Please use Gmail only (@gmail.com)");
      return;
    }

    if (email === "test@gmail.com") {
      setEmailValidationHint("This email address is already registered");
      return;
    }

    setEmailValidationHint("");
  };

  const getEmailHint = () => {
    if (emailValidationHint) {
      return emailValidationHint;
    }
    return "Please use a Gmail address (@gmail.com)";
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";

    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return "Email must be a Gmail address (@gmail.com)";
    }

    if (email === "test@gmail.com") {
      return "This email address is already registered";
    }

    return undefined;
  };

  const checkPasswordRequirements = (password: string) => {
    const requirements = {
      length: password.length >= 8 && password.length <= 30,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    setPasswordRequirements(requirements);
    return requirements;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";

    if (password.length < 8 || password.length > 30) {
      return "Password must be between 8 and 30 characters";
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    if (!hasLowerCase)
      return "Password must contain at least one lowercase letter";
    if (!hasUpperCase)
      return "Password must contain at least one uppercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar)
      return "Password must contain at least one special character";

    return undefined;
  };

  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time password validation
    if (field === "password") {
      checkPasswordRequirements(value);
    }

    // Real-time email validation
    if (field === "email") {
      checkEmailValidation(value);
    }

    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }

    if (formState !== "idle") {
      setFormState("idle");
    }
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return false;
    }

    // Check if all password requirements are met
    if (!Object.values(passwordRequirements).every((req) => req)) {
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      return false;
    }

    // Check if email is valid Gmail and not test@gmail.com
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (
      !emailRegex.test(formData.email) ||
      formData.email === "test@gmail.com"
    ) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
      } else {
        const errorData = await response.json();
        setFormState("failure");
        if (errorData.field && errorData.message) {
          setErrors({ [errorData.field]: errorData.message });
        }
      }
    } catch {
      setFormState("failure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Your Account</h1>
        <div className="auth-inner-card">
          <FormStatus state={formState} />

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                id="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`form-input ${errors.firstName ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                id="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`form-input ${errors.lastName ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <span className="error-message">{errors.lastName}</span>
              )}
            </div>

            <div className="form-group">
              <input
                type="email"
                id="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onFocus={() => {
                  setIsEmailFocused(true);
                  checkEmailValidation(formData.email);
                }}
                onBlur={() => setIsEmailFocused(false)}
                className={`form-input ${errors.email ? "error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
              {isEmailFocused && (
                <div className="email-hint">{getEmailHint()}</div>
              )}
            </div>

            <div className="form-group">
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className={`form-input ${errors.password ? "error" : ""}`}
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
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

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
                  onFocus={() => setIsConfirmPasswordFocused(true)}
                  onBlur={() => setIsConfirmPasswordFocused(false)}
                  className={`form-input ${
                    errors.confirmPassword ? "error" : ""
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
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
              {(isPasswordFocused || isConfirmPasswordFocused) && (
                <div className="password-hint">
                  {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword ? (
                    <span className="password-mismatch">
                      Passwords don't match
                    </span>
                  ) : formData.password &&
                    Object.values(passwordRequirements).every((req) => req) &&
                    formData.confirmPassword === formData.password &&
                    formData.confirmPassword ? (
                    <span className="password-success">
                      Nice! You have a strong password
                    </span>
                  ) : (
                    <>
                      <span
                        className={passwordRequirements.length ? "met" : ""}
                      >
                        8-30 characters
                      </span>
                      {" with "}
                      <span
                        className={passwordRequirements.uppercase ? "met" : ""}
                      >
                        upper
                      </span>
                      {", "}
                      <span
                        className={passwordRequirements.lowercase ? "met" : ""}
                      >
                        lower
                      </span>
                      {", "}
                      <span
                        className={passwordRequirements.number ? "met" : ""}
                      >
                        number
                      </span>
                      {" & "}
                      <span
                        className={passwordRequirements.special ? "met" : ""}
                      >
                        symbol
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
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
    </div>
  );
}
