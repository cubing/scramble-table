// TODO: audit https://github.com/xtrp/encrypt-with-password and/or look for other options, instead of implementing from scratch.

import { Decrypter, Encrypter } from "age-encryption";
import { default as arrayBufferToHex } from "array-buffer-to-hex";
import { default as hexToArrayBuffer } from "hex-to-array-buffer";

const SCRYPT_WORK_FACTOR = 12;

export async function encryptJSON<T>(
  json: T,
  passcode: string,
): Promise<string> {
  const encrypter = new Encrypter();
  encrypter.setScryptWorkFactor(SCRYPT_WORK_FACTOR);
  encrypter.setPassphrase(passcode);
  return arrayBufferToHex(
    (await encrypter.encrypt(JSON.stringify(json))) as unknown as ArrayBuffer,
  );
}

export async function decryptJSON<T>(
  hexCiphertext: string,
  passcode: string,
): Promise<T> {
  const decrypter = new Decrypter();
  decrypter.addPassphrase(passcode);
  return JSON.parse(
    await decrypter.decrypt(
      new Uint8Array(hexToArrayBuffer(hexCiphertext)),
      "text",
    ),
  );
}
