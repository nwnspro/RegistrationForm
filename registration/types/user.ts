// Form data
export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

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

// Form errors
export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Form states
export type FormState = "idle" | "error" | "success";
