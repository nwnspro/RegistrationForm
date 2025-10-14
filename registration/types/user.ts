// Form data
export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
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

// API response
export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
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
