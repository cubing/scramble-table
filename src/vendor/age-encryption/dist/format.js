import { sodium } from "./sodium.js";
export const decodeBase64 = (s) => sodium.from_base64(s, sodium.base64_variants.ORIGINAL_NO_PADDING);
export const encodeBase64 = (s) => sodium.to_base64(s, sodium.base64_variants.ORIGINAL_NO_PADDING);
export class Stanza {
    constructor(args, body) {
        this.args = args;
        this.body = body;
    }
}
class ByteReader {
    constructor(arr) {
        this.arr = arr;
    }
    toString(bytes) {
        bytes.forEach((b) => {
            if (b < 32 || b > 136) {
                throw Error("invalid non-ASCII byte in header");
            }
        });
        return sodium.to_string(bytes);
    }
    readString(n) {
        const out = this.arr.subarray(0, n);
        this.arr = this.arr.subarray(n);
        return this.toString(out);
    }
    readLine() {
        const i = this.arr.indexOf('\n'.charCodeAt(0));
        if (i >= 0) {
            const out = this.arr.subarray(0, i);
            this.arr = this.arr.subarray(i + 1);
            return this.toString(out);
        }
        return null;
    }
    rest() {
        return this.arr;
    }
}
function parseNextStanza(header) {
    const hdr = new ByteReader(header);
    if (hdr.readString(3) !== "-> ") {
        throw Error("invalid stanza");
    }
    const argsLine = hdr.readLine();
    if (argsLine === null) {
        throw Error("invalid stanza");
    }
    const args = argsLine.split(" ");
    if (args.length < 1) {
        throw Error("invalid stanza");
    }
    for (const arg of args) {
        if (arg.length === 0) {
            throw Error("invalid stanza");
        }
    }
    const bodyLines = [];
    for (;;) {
        const nextLine = hdr.readLine();
        if (nextLine === null) {
            throw Error("invalid stanza");
        }
        const line = decodeBase64(nextLine);
        if (line.length > 48) {
            throw Error("invalid stanza");
        }
        bodyLines.push(line);
        if (line.length < 48) {
            break;
        }
    }
    const body = flattenArray(bodyLines);
    return [new Stanza(args, body), hdr.rest()];
}
function flattenArray(arr) {
    const len = arr.reduce(((sum, line) => sum + line.length), 0);
    const out = new Uint8Array(len);
    let n = 0;
    for (const a of arr) {
        out.set(a, n);
        n += a.length;
    }
    return out;
}
export function parseHeader(header) {
    const hdr = new ByteReader(header);
    const versionLine = hdr.readLine();
    if (versionLine !== "age-encryption.org/v1") {
        throw Error("invalid version " + versionLine);
    }
    let rest = hdr.rest();
    const recipients = [];
    for (;;) {
        let s;
        [s, rest] = parseNextStanza(rest);
        recipients.push(s);
        const hdr = new ByteReader(rest);
        if (hdr.readString(4) === "--- ") {
            const headerNoMAC = header.subarray(0, header.length - hdr.rest().length - 1);
            const macLine = hdr.readLine();
            if (macLine === null) {
                throw Error("invalid header");
            }
            const mac = decodeBase64(macLine);
            return {
                recipients: recipients,
                headerNoMAC: headerNoMAC,
                MAC: mac,
                rest: hdr.rest(),
            };
        }
    }
}
export function encodeHeaderNoMAC(recipients) {
    const lines = [];
    lines.push("age-encryption.org/v1\n");
    for (const s of recipients) {
        lines.push("-> " + s.args.join(" ") + "\n");
        for (let i = 0; i < s.body.length; i += 48) {
            let end = i + 48;
            if (end > s.body.length)
                end = s.body.length;
            lines.push(encodeBase64(s.body.subarray(i, end)) + "\n");
        }
        if (s.body.length % 48 === 0)
            lines.push("\n");
    }
    lines.push("---");
    return sodium.from_string(lines.join(""));
}
export function encodeHeader(recipients, MAC) {
    return flattenArray([
        encodeHeaderNoMAC(recipients),
        sodium.from_string(" " + encodeBase64(MAC) + "\n")
    ]);
}
