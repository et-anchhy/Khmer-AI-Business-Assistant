/**
 * English is the source dictionary: its shape defines `Dictionary`, and every
 * other locale must provide the same keys (enforced by TypeScript and tests).
 */
export const en = {
  common: {
    appName: "Khmer AI Business Assistant",
    appShortName: "Khmer AI",
    loading: "Loading…",
    soon: "Soon",
    tryAgain: "Try again",
    backToDashboard: "Back to dashboard",
    notFoundTitle: "Page not found",
    notFoundDescription: "The page you are looking for does not exist or has been moved.",
    errorTitle: "Something went wrong",
    errorDescription:
      "An unexpected error occurred. Please try again. If the problem continues, contact support.",
    openMenu: "Open menu",
    language: "Language",
    showPassword: "Show password",
    hidePassword: "Hide password",
    account: "Account",
  },
  nav: {
    mainNavigation: "Main navigation",
    dashboard: "Dashboard",
    ai: "AI Assistant",
    products: "Products",
    orders: "Orders",
    customers: "Customers",
    knowledge: "Knowledge Base",
    settings: "Settings",
    logout: "Log out",
  },
  auth: {
    login: {
      title: "Welcome back",
      description: "Sign in to manage your business.",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      registerLink: "Create one",
    },
    register: {
      title: "Create your account",
      description: "Start managing your business with an AI assistant.",
      fullName: "Full name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      passwordHint: "At least 8 characters.",
      submit: "Create account",
      haveAccount: "Already have an account?",
      loginLink: "Sign in",
      checkEmailTitle: "Check your email",
      checkEmailDescription:
        "We sent a confirmation link to {email}. Open it to activate your account.",
    },
    forgotPassword: {
      title: "Reset your password",
      description: "Enter your email and we'll send you a link to reset your password.",
      email: "Email",
      submit: "Send reset link",
      sentTitle: "Check your email",
      sentDescription:
        "If an account exists for {email}, you will receive a password reset link shortly.",
      backToLogin: "Back to sign in",
    },
    resetPassword: {
      title: "Choose a new password",
      description: "Enter a new password for your account.",
      password: "New password",
      confirmPassword: "Confirm new password",
      submit: "Update password",
      success: "Your password has been updated.",
    },
    notices: {
      linkInvalid: "This link is invalid or has expired. Please request a new one.",
      signedOut: "You have been signed out.",
    },
    errors: {
      invalidCredentials: "Incorrect email or password.",
      emailNotConfirmed: "Please confirm your email address before signing in.",
      userExists: "An account with this email already exists.",
      weakPassword: "This password is too weak. Choose a stronger one.",
      rateLimited: "Too many attempts. Please wait a moment and try again.",
      generic: "We couldn't complete that request. Please try again.",
    },
  },
  validation: {
    fullNameRequired: "Full name is required.",
    fullNameTooLong: "Full name must be 100 characters or fewer.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Password is required.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordTooLong: "Password must be 72 characters or fewer.",
    passwordsDontMatch: "Passwords do not match.",
  },
  dashboard: {
    welcomeTitle: "Welcome, {name}",
    welcomeDescription: "This is the workspace for your business.",
    accountReadyTitle: "Your account is ready",
    accountReadyDescription:
      "Next, you'll set up your business profile so your AI assistant knows about your business.",
  },
};

export type Dictionary = typeof en;
