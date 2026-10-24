// "Continue with Google" is offered only when both credentials are set (see README).
export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "Google sign-in didn’t work. Try again, or use your email and password.",
  google_unverified: "That Google account’s email isn’t verified, so it can’t be used here.",
};

export const OAUTH_COOKIE = "rp_oauth";
