var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sodium } from "./sodium.js";
import { decode as decodeBech32, encode as encodeBech32 } from "bech32-buffer";
import { scryptUnwrap, scryptWrap, x25519Unwrap, x25519Wrap } from "./recipients.js";
import { encodeHeader, encodeHeaderNoMAC, parseHeader } from "./format.js";
import { decryptSTREAM, encryptSTREAM } from "./stream.js";
import { HKDF } from "./hkdf.js";
let initDone = false;
export default function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!initDone) {
            yield sodium.ready;
            initDone = true;
        }
        return {
            Encrypter: Encrypter,
            Decrypter: Decrypter,
            generateIdentity: generateIdentity,
            identityToRecipient: identityToRecipient,
        };
    });
}
function generateIdentity() {
    const scalar = sodium.randombytes_buf(sodium.crypto_scalarmult_curve25519_SCALARBYTES);
    return encodeBech32("AGE-SECRET-KEY-", scalar);
}
function identityToRecipient(identity) {
    const res = decodeBech32(identity);
    if (!identity.startsWith("AGE-SECRET-KEY-1") ||
        res.prefix.toUpperCase() !== "AGE-SECRET-KEY-" || res.encoding !== "bech32" ||
        res.data.length !== sodium.crypto_scalarmult_curve25519_SCALARBYTES)
        throw Error("invalid identity");
    const recipient = sodium.crypto_scalarmult_base(res.data);
    return encodeBech32("age", recipient);
}
class Encrypter {
    constructor() {
        this.passphrase = null;
        this.scryptWorkFactor = 18;
        this.recipients = [];
    }
    setPassphrase(s) {
        if (this.passphrase !== null)
            throw new Error("can encrypt to at most one passphrase");
        if (this.recipients.length !== 0)
            throw new Error("can't encrypt to both recipients and passphrases");
        this.passphrase = s;
    }
    setScryptWorkFactor(logN) {
        this.scryptWorkFactor = logN;
    }
    addRecipient(s) {
        if (this.passphrase !== null)
            throw new Error("can't encrypt to both recipients and passphrases");
        const res = decodeBech32(s);
        if (!s.startsWith("age1") ||
            res.prefix.toLowerCase() !== "age" || res.encoding !== "bech32" ||
            res.data.length !== sodium.crypto_scalarmult_curve25519_BYTES)
            throw Error("invalid recipient");
        this.recipients.push(res.data);
    }
    encrypt(file) {
        if (typeof file === "string") {
            file = sodium.from_string(file);
        }
        const fileKey = sodium.randombytes_buf(16);
        const stanzas = [];
        for (const recipient of this.recipients) {
            stanzas.push(x25519Wrap(fileKey, recipient));
        }
        if (this.passphrase !== null) {
            stanzas.push(scryptWrap(fileKey, this.passphrase, this.scryptWorkFactor));
        }
        const hmacKey = HKDF(fileKey, null, "header");
        const mac = sodium.crypto_auth_hmacsha256(encodeHeaderNoMAC(stanzas), hmacKey);
        const header = encodeHeader(stanzas, mac);
        const nonce = sodium.randombytes_buf(16);
        const streamKey = HKDF(fileKey, nonce, "payload");
        const payload = encryptSTREAM(streamKey, file);
        const out = new Uint8Array(header.length + nonce.length + payload.length);
        out.set(header);
        out.set(nonce, header.length);
        out.set(payload, header.length + nonce.length);
        return out;
    }
}
class Decrypter {
    constructor() {
        this.passphrases = [];
        this.identities = [];
    }
    addPassphrase(s) {
        this.passphrases.push(s);
    }
    addIdentity(s) {
        const res = decodeBech32(s);
        if (!s.startsWith("AGE-SECRET-KEY-1") ||
            res.prefix.toUpperCase() !== "AGE-SECRET-KEY-" || res.encoding !== "bech32" ||
            res.data.length !== sodium.crypto_scalarmult_curve25519_SCALARBYTES)
            throw Error("invalid identity");
        this.identities.push({
            identity: res.data,
            recipient: sodium.crypto_scalarmult_base(res.data),
        });
    }
    decrypt(file, outputFormat) {
        const h = parseHeader(file);
        const fileKey = this.unwrapFileKey(h.recipients);
        if (fileKey === null) {
            throw Error("no identity matched any of the file's recipients");
        }
        const hmacKey = HKDF(fileKey, null, "header");
        if (!sodium.crypto_auth_hmacsha256_verify(h.MAC, h.headerNoMAC, hmacKey)) {
            throw Error("invalid header HMAC");
        }
        const nonce = h.rest.subarray(0, 16);
        const streamKey = HKDF(fileKey, nonce, "payload");
        const payload = h.rest.subarray(16);
        const out = decryptSTREAM(streamKey, payload);
        if (outputFormat === "text")
            return sodium.to_string(out);
        return out;
    }
    unwrapFileKey(recipients) {
        for (const s of recipients) {
            // Ideally this should be implemented by passing all stanzas to the scrypt
            // identity implementation, and letting it throw the error. In practice,
            // this is a very simple implementation with no public identity interface.
            if (s.args.length > 0 && s.args[0] === "scrypt" && recipients.length !== 1) {
                throw Error("scrypt recipient is not the only one in the header");
            }
            for (const p of this.passphrases) {
                const k = scryptUnwrap(s, p);
                if (k !== null) {
                    return k;
                }
            }
            for (const i of this.identities) {
                const k = x25519Unwrap(s, i);
                if (k !== null) {
                    return k;
                }
            }
        }
        return null;
    }
}
