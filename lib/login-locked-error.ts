import { CredentialsSignin } from "next-auth";

export class LoginLockedError extends CredentialsSignin {
  code = "login_locked";

  constructor(public retryAfterMs: number) {
    super();
  }
}
