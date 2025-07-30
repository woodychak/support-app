import crypto from "node:crypto";

const secretKey = "$nlW~c@Tjy3#*z`?R5T=9.P@aIbA'zM"; // 必須是 32 字符
const key = Buffer.from(secretKey, "utf-8");

export async function encrypt(plainText: string): Promise<string> {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

export async function decrypt(encryptedText: string): Promise<string> {
  const combined = Buffer.from(encryptedText, "base64");
  const iv = combined.slice(0, 12);
  const authTag = combined.slice(12, 28);
  const encrypted = combined.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
