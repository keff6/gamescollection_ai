import bcrypt from "bcryptjs";

export interface CredentialsUser {
  id: string;
  name: string;
  email: string | null;
  password: string | null;
}

export interface VerifiedUser {
  id: string;
  name: string;
  email: string | null;
}

export async function verifyCredentials(
  user: CredentialsUser | null,
  password: string
): Promise<VerifiedUser | null> {
  if (!user?.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email };
}
