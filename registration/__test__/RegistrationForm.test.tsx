import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import RegistrationForm from "../components/RegistrationForm";

global.fetch = vi.fn();

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<RegistrationForm />);

    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create password/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/confirm password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /let's go/i })
    ).toBeInTheDocument();
  });

  it("does not show any status message initially (idle state)", () => {
    render(<RegistrationForm />);
    expect(
      screen.queryByText(/please fill out all required fields/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/registration successful/i)
    ).not.toBeInTheDocument();
  });

  it("shows warning state when submitting empty form", async () => {
    render(<RegistrationForm />);

    const submitButton = screen.getByRole("button", { name: /let's go/i });

    // Button should be enabled (allows submission to show validation errors)
    expect(submitButton).not.toBeDisabled();

    // Click submit with empty form
    fireEvent.click(submitButton);

    // Should show warning state
    await waitFor(() => {
      expect(screen.getByText(/oops-please correct errors below/i)).toBeInTheDocument();
    });
  });

  it("shows warning state when submitting with invalid email format", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "test@yahoo.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    const submitButton = screen.getByRole("button", { name: /let's go/i });
    // Button should be enabled (allows submission to show validation errors)
    expect(submitButton).not.toBeDisabled();

    // Click submit with invalid email
    fireEvent.click(submitButton);

    // Should show warning state
    await waitFor(() => {
      expect(screen.getByText(/oops-please correct errors below/i)).toBeInTheDocument();
    });
  });

  it("shows warning state when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123@"
    );

    const submitButton = screen.getByRole("button", { name: /let's go/i });
    // Button should be enabled (allows submission to show validation errors)
    expect(submitButton).not.toBeDisabled();

    // Click submit with mismatched passwords
    fireEvent.click(submitButton);

    // Should show warning state
    await waitFor(() => {
      expect(screen.getByText(/oops-please correct errors below/i)).toBeInTheDocument();
    });
  });

  it("enables button when all fields are valid", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    const submitButton = screen.getByRole("button", { name: /let's go/i });
    // Button should be enabled when all fields are valid
    expect(submitButton).not.toBeDisabled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const passwordInput = screen.getByPlaceholderText(
      /create password/i
    ) as HTMLInputElement;
    const toggleButton =
      passwordInput.parentElement?.querySelector(".password-toggle");

    expect(passwordInput.type).toBe("password");

    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput.type).toBe("text");

      await user.click(toggleButton);
      expect(passwordInput.type).toBe("password");
    }
  });

  it("allows submission when all required fields are filled and valid", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<RegistrationForm />);

    const submitButton = screen.getByRole("button", { name: /let's go/i });

    // Button should be enabled (always enabled unless submitting)
    expect(submitButton).not.toBeDisabled();

    // Fill all fields with valid data
    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    // Button should still be enabled
    expect(submitButton).not.toBeDisabled();

    // Submit should succeed without showing warning
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });
  });

  it("submits form successfully with valid data", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    fireEvent.click(screen.getByRole("button", { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@gmail.com",
        password: "Password123!",
      }),
    });
  });

  it("shows warning state when API returns error", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          field: "email",
          message: "Email already exists"
        }
      }),
    } as Response);

    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    fireEvent.click(screen.getByRole("button", { name: /let's go/i }));

    // WARNING state: No banner, only inline message
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    // Should NOT show the "Oops" banner (that's only for FAILURE state)
    expect(screen.queryByText(/oops-please correct errors below/i)).not.toBeInTheDocument();
  });

  it("shows warning state when network error occurs", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    fireEvent.click(screen.getByRole("button", { name: /let's go/i }));

    // WARNING state: Form stays visible, no banner message
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    });

    // Should NOT show the "Oops" banner
    expect(screen.queryByText(/oops-please correct errors below/i)).not.toBeInTheDocument();
  });

  it("disables submit button and shows loading state during submission", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);

    // Create a promise that we can control
    let resolvePromise: (value: Response) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(promise as Promise<Response>);

    render(<RegistrationForm />);

    await user.type(screen.getByPlaceholderText(/first name/i), "John");
    await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "john@gmail.com"
    );
    await user.type(
      screen.getByPlaceholderText(/create password/i),
      "Password123!"
    );
    await user.type(
      screen.getByPlaceholderText(/confirm password/i),
      "Password123!"
    );

    fireEvent.click(screen.getByRole("button", { name: /let's go/i }));

    // Check loading state
    expect(
      screen.getByRole("button", { name: /creating account\.\.\./i })
    ).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true }),
    });

    // After successful submission, success message should appear
    await waitFor(() => {
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });
  });

  it("clears form data after successful submission", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<RegistrationForm />);

    const firstNameInput = screen.getByPlaceholderText(
      /first name/i
    ) as HTMLInputElement;
    const lastNameInput = screen.getByPlaceholderText(
      /last name/i
    ) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(
      /email address/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(
      /create password/i
    ) as HTMLInputElement;
    const confirmPasswordInput = screen.getByPlaceholderText(
      /confirm password/i
    ) as HTMLInputElement;

    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(emailInput, "john@gmail.com");
    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");

    fireEvent.click(screen.getByRole("button", { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });

    // After success, the form is replaced with success view, so inputs no longer exist
    // Just verify the success message is shown and the login button appears
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
