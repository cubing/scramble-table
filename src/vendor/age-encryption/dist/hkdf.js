import { sodium } from "./sodium.js";
// HKDF extracts 32 bytes from HKDF-SHA-256 with the specified input key material, salt, and info.
export function HKDF(ikm, salt, info) {
    if (salt === null) {
        salt = new Uint8Array(32);
    }
    const h = sodium.crypto_auth_hmacsha256_init(salt);
    sodium.crypto_auth_hmacsha256_update(h, ikm);
    const prk = sodium.crypto_auth_hmacsha256_final(h);
    const infoAndCounter = new Uint8Array(info.length + 1);
    infoAndCounter.set(sodium.from_string(info));
    infoAndCounter[info.length] = 1;
    return sodium.crypto_auth_hmacsha256(infoAndCounter, prk);
}
