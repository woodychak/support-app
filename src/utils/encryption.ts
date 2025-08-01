// utils/encryption.ts
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

const SECRET = process.env.ENCRYPTION_SECRET || "";

export function encrypt(text: string): string {
  return AES.encrypt(text, SECRET).toString(); // returns Base64 with IV embedded
}

export function decrypt(ciphertext: string): string {
  const bytes = AES.decrypt(ciphertext, SECRET);
  return bytes.toString(Utf8);
}
