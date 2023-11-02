// TODO: audit https://github.com/xtrp/encrypt-with-password and/or look for other options, instead of implementing from scratch.

import { default as arrayBufferToHex } from "array-buffer-to-hex";
import { default as hexToArrayBuffer } from "hex-to-array-buffer";
import pbkdf2Hmac from "pbkdf2-hmac";

const FORMAT_VERSION = 0x01;
const NUM_PBKDF2_ITERATIONS = 2 ** 16; // ≈10ms in a browser on M1 Max (TODO: why is the library much slower in `node`?)

const libsodium = (async () => {
  const libsodium = (await import("libsodium-wrappers")).default;
  await libsodium.ready;
  return libsodium;
})();

async function generate_nonce(): Promise<Uint8Array> {
  const buffer = new Uint8Array((await libsodium).crypto_secretbox_NONCEBYTES);
  crypto.getRandomValues(buffer);
  return buffer;
}

async function generate_salt(): Promise<Uint8Array> {
  return generate_nonce(); // Use the same code.
}

function concatUint8Arrays(
  a1: Uint8Array | number[],
  a2: Uint8Array | number[],
  a3: Uint8Array | number[] = [],
  a4: Uint8Array | number[] = [],
): Uint8Array {
  return new Uint8Array([...a1, ...a2, ...a3, ...a4]);
}

function splitUint8Array(
  arr: Uint8Array,
  idx1: number,
  idx2: number,
  idx3: number,
): [Uint8Array, Uint8Array, Uint8Array, Uint8Array] {
  return [
    arr.slice(0, idx1),
    arr.slice(idx1, idx2),
    arr.slice(idx2, idx3),
    arr.slice(idx3),
  ];
}

async function deriveSecretBoxKey(
  passcode: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  return new Uint8Array(
    await pbkdf2Hmac(
      passcode,
      salt,
      NUM_PBKDF2_ITERATIONS,
      (
        await libsodium
      ).crypto_secretbox_KEYBYTES,
      "SHA-256",
    ),
  );
}

/**
 * Encrypts by doing the following:
 *
 * - Generate a random salt (32 bytes).
 * - Use PBKDF2-HMAC-SHA256 with 2^16 iterations to derive a 32-byte key using the passcode and the salt.
 *   - This is slowed down for brute-forcing, but should happen roughly in the blink of an eye (≈0.01s to ≈0.1s in a browser, depending on hardware).
 * - Stringify the JSON input and encrypt using the `libsodium` secret box with the nonce and key from previous steps.
 * - Return the concatenation of [single-byte format version signal, salt, nonce, encrypted bytes], encoded in hex.
 *
 * Note that no padding is currently applied, so the ciphertext length may reveal information about the serialized plaintext size.
 */
export async function encryptJSON<T>(
  json: T,
  passcode: string,
): Promise<string> {
  const salt = await generate_salt();
  const key = await deriveSecretBoxKey(passcode, salt);

  const nonce = await generate_nonce();
  const encrypted_bytes = (await libsodium).crypto_secretbox_easy(
    JSON.stringify(json),
    nonce,
    key,
    "uint8array",
  );
  return arrayBufferToHex(
    concatUint8Arrays([FORMAT_VERSION], salt, nonce, encrypted_bytes),
  );
}

/**
 * Decrypts by reversing the output of `encryptJSON()`.
 */
export async function decryptJSON<T>(
  hexCiphertext: string,
  passcode: string,
): Promise<T> {
  const [formatVersion, salt, nonce, encrypted_bytes] = splitUint8Array(
    new Uint8Array(hexToArrayBuffer(hexCiphertext)),
    1,
    1 + (await libsodium).crypto_secretbox_NONCEBYTES,
    1 + (await libsodium).crypto_secretbox_NONCEBYTES * 2,
  );

  if (formatVersion[0] !== FORMAT_VERSION) {
    throw new Error(`Unknown format version: ${formatVersion[0]}`);
  }

  const key = await deriveSecretBoxKey(passcode, salt);

  return JSON.parse(
    (await libsodium).crypto_secretbox_open_easy(
      encrypted_bytes,
      nonce,
      key,
      "text",
    ),
  );
}
