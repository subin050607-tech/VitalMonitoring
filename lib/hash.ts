/** SHA-256 → 소문자 hex. 모바일 앱 PasswordHasher(솔트 없는 SHA256 hex)와 동일. */
export async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
