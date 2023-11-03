// TODO: audit https://github.com/xtrp/encrypt-with-password and/or look for other options, instead of implementing from scratch.

import { default as arrayBufferToHex } from "array-buffer-to-hex";
import { default as hexToArrayBuffer } from "hex-to-array-buffer";

import age from "../../vendor/age-encryption/dist";

const SCRYPT_WORK_FACTOR = 12;

export async function encryptJSON<T>(
  json: T,
  passcode: string,
): Promise<string> {
  const encrypter = new (await age()).Encrypter();
  encrypter.setScryptWorkFactor(SCRYPT_WORK_FACTOR);
  encrypter.setPassphrase(passcode);
  return arrayBufferToHex(encrypter.encrypt(JSON.stringify(json)));
}

export async function decryptJSON<T>(
  hexCiphertext: string,
  passcode: string,
): Promise<T> {
  const decrypter = new (await age()).Decrypter();
  decrypter.addPassphrase(passcode);
  return JSON.parse(
    decrypter.decrypt(new Uint8Array(hexToArrayBuffer(hexCiphertext)), "text"),
  );
}
