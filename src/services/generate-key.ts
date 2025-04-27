import * as crypto from "crypto";

/**
 * Generate a secure random alphanumeric string for Client ID or API Key.
 * @param length Desired length of the string.
 * @returns Random alphanumeric string.
 */
export function generateSecureKey(length: number = 128): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

export function generateCredentials() {
  const clientId = generateSecureKey(6);
  const apiKey = generateSecureKey(128);
  return { clientId, apiKey };
}
