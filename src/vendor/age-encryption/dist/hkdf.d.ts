import { sodium } from "./sodium.js";
declare module "libsodium-wrappers-sumo" {
    function crypto_auth_hmacsha256_init(key: Uint8Array): sodium.StateAddress;
    function crypto_auth_hmacsha256_update(stateAddress: sodium.StateAddress, messageChunk: Uint8Array): void;
    function crypto_auth_hmacsha256_final(stateAddress: sodium.StateAddress): Uint8Array;
}
export declare function HKDF(ikm: Uint8Array, salt: Uint8Array | null, info: string): Uint8Array;
