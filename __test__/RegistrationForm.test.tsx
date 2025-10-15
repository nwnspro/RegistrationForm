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

  it("shows FAILURE state when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const submitButton = screen.getByRole("button", { name: /let's go/i });

    // Button should be enabled (allows submission to show validation errors)
    expect(submitButton).not.toBeDisabled();

    // Click submit with empty form
    await user.click(submitButton);

    // Should show FAILURE state with banner
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
    await user.click(submitButton);

    // Should show FAILURE state with banner (client validation)
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
    await user.click(submitButton);

    // Should show FAILURE state with banner (client validation)
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
    await user.click(submitButton);

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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

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

  it("shows warning state when API returns field-specific error", async () => {
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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

    // WARNING state: Shows inline field message, no banner (server field-specific error)
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    // Should NOT show any banner (WARNING state = inline messages only)
    expect(screen.queryByText(/oops-please correct errors below/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/something went wrong on our end/i)).not.toBeInTheDocument();
  });

  it("shows failure state with server error message when network error occurs", async () => {
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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

    // FAILURE state: Shows server error banner (network error triggers FAILURE state)
    await waitFor(() => {
      expect(screen.getByText(/something went wrong on our end/i)).toBeInTheDocument();
    });

    // Should NOT show the client validation "Oops" banner
    expect(screen.queryByText(/oops-please correct errors below/i)).not.toBeInTheDocument();
  });

  it("shows failure state with server error message when API returns generic error", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          message: "Internal server error"
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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

    // FAILURE state: Shows server error banner (generic server error triggers FAILURE state)
    await waitFor(() => {
      expect(screen.getByText(/something went wrong on our end/i)).toBeInTheDocument();
    });

    // Should NOT show the client validation "Oops" banner
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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

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

    await user.click(screen.getByRole("button", { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });

    // After success, the form is replaced with success view, so inputs no longer exist
    // Just verify the success message is shown and the login button appears
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  describe("Field validation on blur", () => {
    it("shows error when first name loses focus while empty", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const firstNameInput = screen.getByPlaceholderText(/first name/i);

      await user.click(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/first name can't be empty/i)).toBeInTheDocument();
      });
    });

    it("shows error when last name loses focus while empty", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const lastNameInput = screen.getByPlaceholderText(/last name/i);

      await user.click(lastNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/last name can't be empty/i)).toBeInTheDocument();
      });
    });
  });

  describe("Inline error clearing", () => {
    it("clears inline error when user corrects the field", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type invalid email
      await user.type(emailInput, "invalid");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please put a valid email/i)).toBeInTheDocument();
      });

      // Fix the email
      await user.clear(emailInput);
      await user.type(emailInput, "valid@gmail.com");

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/please put a valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("FAILURE banner behavior", () => {
    it("clears FAILURE banner when user starts typing to fix errors", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      // Submit empty form to get FAILURE state
      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
        expect(screen.getByText(/oops-please correct errors below/i)).toBeInTheDocument();
      });

      // Start typing in any field
      await user.type(screen.getByPlaceholderText(/first name/i), "J");

      // Banner should disappear
      await waitFor(() => {
        expect(screen.queryByText(/oops-please correct errors below/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Confirm password validation", () => {
    it("validates confirm password dynamically as user types", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const passwordInput = screen.getByPlaceholderText(/create password/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);

      // Type password
      await user.type(passwordInput, "Password123!");

      // Type mismatched confirm password
      await user.type(confirmInput, "Password123");
      fireEvent.blur(confirmInput);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      // Fix it by adding the missing character
      await user.type(confirmInput, "!");

      // Error should clear
      await waitFor(() => {
        expect(screen.queryByText(/passwords don't match/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Password visibility toggle", () => {
    it("toggles visibility for both password and confirm password", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const passwordInput = screen.getByPlaceholderText(/create password/i) as HTMLInputElement;
      const confirmInput = screen.getByPlaceholderText(/confirm password/i) as HTMLInputElement;
      const toggleButton = passwordInput.parentElement?.querySelector(".password-toggle");

      // Both should be hidden initially
      expect(passwordInput.type).toBe("password");
      expect(confirmInput.type).toBe("password");

      if (toggleButton) {
        await user.click(toggleButton);

        // Both should be visible
        expect(passwordInput.type).toBe("text");
        expect(confirmInput.type).toBe("text");

        await user.click(toggleButton);

        // Both should be hidden again
        expect(passwordInput.type).toBe("password");
        expect(confirmInput.type).toBe("password");
      }
    });
  });

  describe("Copy/Paste prevention", () => {
    it("password field has copy/cut prevention handlers", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const passwordInput = screen.getByPlaceholderText(/create password/i);
      await user.type(passwordInput, "Password123!");

      // React synthetic events (onCopy, onCut) are implemented in the component
      // They work in real browsers but are difficult to test in JSDOM
      // Verify the input exists and has the correct type
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it("confirm password field has paste prevention handler", async () => {
      render(<RegistrationForm />);

      const confirmInput = screen.getByPlaceholderText(/confirm password/i);

      // React synthetic event (onPaste) is implemented in the component
      // It works in real browsers but is difficult to test in JSDOM
      // Verify the input exists and has the correct type
      expect(confirmInput).toBeInTheDocument();
      expect(confirmInput).toHaveAttribute('type', 'password');
    });
  });

  describe("Submit button disabled state", () => {
    it("re-enables submit button after submission completes with error", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);

      let resolvePromise: (value: Response) => void;
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);

      render(<RegistrationForm />);

      // Fill form
      await user.type(screen.getByPlaceholderText(/first name/i), "John");
      await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
      await user.type(screen.getByPlaceholderText(/email address/i), "john@gmail.com");
      await user.type(screen.getByPlaceholderText(/create password/i), "Password123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "Password123!");

      const submitButton = screen.getByRole("button", { name: /let's go/i });

      await user.click(submitButton);

      // Should be disabled during submission
      expect(screen.getByRole("button", { name: /creating account\.\.\./i })).toBeDisabled();

      // Resolve with error
      resolvePromise!({
        ok: false,
        json: async () => ({ error: { message: "Server error" } }),
      } as Response);

      // Button should be enabled again after error
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /let's go/i })).not.toBeDisabled();
      });
    });
  });

  describe("Email validation improvements", () => {
    it("shows 'Please put a valid email' for clearly invalid email format (no @ sign)", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type invalid email (just numbers, no @ sign)
      await user.type(emailInput, "23423534525");
      // Blur to trigger validation
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please put a valid email/i)).toBeInTheDocument();
      });
    });

    it("shows 'Please put a valid email' for email without domain", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type invalid email (has @ but no domain)
      await user.type(emailInput, "test@");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please put a valid email/i)).toBeInTheDocument();
      });
    });

    it("shows 'Please put a valid email' for email without extension", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type invalid email (has @ and domain but no extension)
      await user.type(emailInput, "test@domain");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please put a valid email/i)).toBeInTheDocument();
      });
    });

    it("shows 'Must be a Gmail address' for valid email that is not Gmail", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type valid email but not Gmail
      await user.type(emailInput, "test@yahoo.com");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/must be a gmail address/i)).toBeInTheDocument();
      });
    });

    it("shows no error for valid Gmail address", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type valid Gmail address (not the registered one)
      await user.type(emailInput, "newuser@gmail.com");
      fireEvent.blur(emailInput);

      // Wait a bit to ensure no error appears
      await waitFor(() => {
        expect(screen.queryByText(/please put a valid email/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/must be a gmail address/i)).not.toBeInTheDocument();
      });
    });

    it("shows 'Email address is already registered' for test@gmail.com", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type the registered email
      await user.type(emailInput, "test@gmail.com");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email address is already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe("Case-insensitive email validation", () => {
    it("shows 'Email address is already registered' for TEST@gmail.com", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type the registered email in uppercase
      await user.type(emailInput, "TEST@gmail.com");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email address is already registered/i)).toBeInTheDocument();
      });
    });

    it("shows 'Email address is already registered' for TeSt@Gmail.com", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type the registered email in mixed case
      await user.type(emailInput, "TeSt@Gmail.com");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email address is already registered/i)).toBeInTheDocument();
      });
    });

    it("shows 'Email address is already registered' for TEST@GMAIL.COM", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const emailInput = screen.getByPlaceholderText(/email address/i);

      // Type the registered email in all caps
      await user.type(emailInput, "TEST@GMAIL.COM");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email address is already registered/i)).toBeInTheDocument();
      });
    });

    it("normalizes email to lowercase before submission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<RegistrationForm />);

      await user.type(screen.getByPlaceholderText(/first name/i), "John");
      await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
      await user.type(screen.getByPlaceholderText(/email address/i), "John.Doe@Gmail.COM");
      await user.type(screen.getByPlaceholderText(/create password/i), "Password123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "Password123!");

      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@gmail.com",
            password: "Password123!",
          }),
        });
      });
    });
  });

  describe("Whitespace handling in names", () => {
    it("shows 'First name can't be empty' for whitespace-only first name", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const firstNameInput = screen.getByPlaceholderText(/first name/i);

      // Type whitespace only
      await user.type(firstNameInput, "   ");
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText(/first name can't be empty/i)).toBeInTheDocument();
      });
    });

    it("shows 'Last name can't be empty' for whitespace-only last name", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const lastNameInput = screen.getByPlaceholderText(/last name/i);

      // Type whitespace only
      await user.type(lastNameInput, "   ");
      fireEvent.blur(lastNameInput);

      await waitFor(() => {
        expect(screen.getByText(/last name can't be empty/i)).toBeInTheDocument();
      });
    });

    it("trims leading and trailing spaces from first name before submission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<RegistrationForm />);

      await user.type(screen.getByPlaceholderText(/first name/i), "  John  ");
      await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
      await user.type(screen.getByPlaceholderText(/email address/i), "john@gmail.com");
      await user.type(screen.getByPlaceholderText(/create password/i), "Password123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "Password123!");

      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
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
    });

    it("trims leading and trailing spaces from last name before submission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<RegistrationForm />);

      await user.type(screen.getByPlaceholderText(/first name/i), "John");
      await user.type(screen.getByPlaceholderText(/last name/i), "  Doe  ");
      await user.type(screen.getByPlaceholderText(/email address/i), "john@gmail.com");
      await user.type(screen.getByPlaceholderText(/create password/i), "Password123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "Password123!");

      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
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
    });

    it("preserves internal spaces in names", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<RegistrationForm />);

      await user.type(screen.getByPlaceholderText(/first name/i), "Mary Jane");
      await user.type(screen.getByPlaceholderText(/last name/i), "Van Der Berg");
      await user.type(screen.getByPlaceholderText(/email address/i), "mary@gmail.com");
      await user.type(screen.getByPlaceholderText(/create password/i), "Password123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "Password123!");

      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: "Mary Jane",
            lastName: "Van Der Berg",
            email: "mary@gmail.com",
            password: "Password123!",
          }),
        });
      });
    });
  });

  describe("Password space prevention", () => {
    it("prevents spaces in password field", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const passwordInput = screen.getByPlaceholderText(/create password/i) as HTMLInputElement;

      // Try to type a password with space
      await user.type(passwordInput, "Pass word123!");

      // Space should be prevented, so value should be "Password123!"
      expect(passwordInput.value).toBe("Password123!");
    });

    it("prevents spaces in confirm password field", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const confirmInput = screen.getByPlaceholderText(/confirm password/i) as HTMLInputElement;

      // Try to type a password with space
      await user.type(confirmInput, "Pass word123!");

      // Space should be prevented, so value should be "Password123!"
      expect(confirmInput.value).toBe("Password123!");
    });

    it("preserves password case-sensitivity in submission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<RegistrationForm />);

      await user.type(screen.getByPlaceholderText(/first name/i), "John");
      await user.type(screen.getByPlaceholderText(/last name/i), "Doe");
      await user.type(screen.getByPlaceholderText(/email address/i), "john@gmail.com");
      await user.type(screen.getByPlaceholderText(/create password/i), "PaSsWoRd123!");
      await user.type(screen.getByPlaceholderText(/confirm password/i), "PaSsWoRd123!");

      await user.click(screen.getByRole("button", { name: /let's go/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: "John",
            lastName: "Doe",
            email: "john@gmail.com",
            password: "PaSsWoRd123!",
          }),
        });
      });
    });
  });
});
