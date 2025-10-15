// Form data (client-side form)
export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// API request body (no confirmPassword)
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Alias for API requests
export type UserRegistrationData = FormData;

// Database record
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  createdAt: string | Date;
}

// API response - user object
export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

// API response - success
export interface ApiSuccessResponse {
  success: true;
  message: string;
  data: {
    user: UserResponse;
  };
}

// API response - error
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    field: string;
  };
}

// API response - union type
export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Validation result (server-side)
export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    field: string;
  };
}

// Field validation messages
export interface FieldMessages {
  firstName?: { text: string; isWarning: boolean };
  lastName?: { text: string; isWarning: boolean };
  email?: { text: string; isWarning: boolean };
  password?: { text: string; isWarning: boolean };
  confirmPassword?: { text: string; isWarning: boolean };
}

// Tracked fields (for showing validation)
export interface TouchedFields {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

// Form states
export type FormState = "idle" | "warning" | "failure" | "success";

// Failure types
export type FailureType = "validation" | "server";
