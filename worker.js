/**
 * DoH Worker — 单文件版（自动生成，请勿直接编辑）
 *
 * 源码在 src/ 目录，修改后运行： npm run build
 * 用法：Cloudflare Dashboard → Workers & Pages → 选择 Worker → Edit code，
 *      删除原有内容后整份粘贴本文件，点击 Deploy。
 *
 * 已内置 dns-packet 与 Buffer polyfill，控制台无需 Node.js 兼容开关。
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "node_modules/ieee754/index.js"(exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/buffer/index.js
var require_buffer = __commonJS({
  "node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer5;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer5.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer5.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer5.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer5.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer5.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer5.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer5.prototype);
      return buf;
    }
    function Buffer5(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer5.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer5.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer5.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer5.from = function(value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer5.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer5, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer5.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer5.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer5.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer5.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf = createBuffer(length);
      const actual = buf.write(string, encoding);
      if (actual !== length) {
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf;
      if (byteOffset === void 0 && length === void 0) {
        buf = new Uint8Array(array);
      } else if (length === void 0) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf, Buffer5.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer5.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer5.alloc(+length);
    }
    Buffer5.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer5.prototype;
    };
    Buffer5.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer5.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer5.from(b, b.offset, b.byteLength);
      if (!Buffer5.isBuffer(a) || !Buffer5.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer5.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer5.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer5.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }
      const buffer = Buffer5.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer5.isBuffer(buf)) buf = Buffer5.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf,
              pos
            );
          }
        } else if (!Buffer5.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer5.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer5.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer5.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer5.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer5.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer5.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer5.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer5.prototype.toLocaleString = Buffer5.prototype.toString;
    Buffer5.prototype.equals = function equals(b) {
      if (!Buffer5.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer5.compare(this, b) === 0;
    };
    Buffer5.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer5.prototype[customInspectSymbol] = Buffer5.prototype.inspect;
    }
    Buffer5.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer5.from(target, target.offset, target.byteLength);
      }
      if (!Buffer5.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer5.from(val, encoding);
      }
      if (Buffer5.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf, i2) {
        if (indexSize === 1) {
          return buf[i2];
        } else {
          return buf.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer5.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer5.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer5.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
    }
    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }
    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }
    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }
    Buffer5.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer5.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      const len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer5.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer5.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer5.prototype.readUintLE = Buffer5.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer5.prototype.readUintBE = Buffer5.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer5.prototype.readUint8 = Buffer5.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer5.prototype.readUint16LE = Buffer5.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer5.prototype.readUint16BE = Buffer5.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer5.prototype.readUint32LE = Buffer5.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer5.prototype.readUint32BE = Buffer5.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer5.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer5.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer5.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer5.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer5.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer5.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer5.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer5.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer5.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer5.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer5.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer5.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer5.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer5.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer5.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer5.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }
    Buffer5.prototype.writeUintLE = Buffer5.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer5.prototype.writeUintBE = Buffer5.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer5.prototype.writeUint8 = Buffer5.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer5.prototype.writeUint16LE = Buffer5.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer5.prototype.writeUint16BE = Buffer5.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer5.prototype.writeUint32LE = Buffer5.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer5.prototype.writeUint32BE = Buffer5.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer5.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer5.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer5.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer5.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer5.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer5.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer5.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer5.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer5.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer5.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer5.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer5.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer5.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer5.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer5.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer5.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer5.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer5.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer5.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer5.isBuffer(val) ? val : Buffer5.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
          received = String(input);
          if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// node_modules/dns-packet/types.js
var require_types = __commonJS({
  "node_modules/dns-packet/types.js"(exports) {
    "use strict";
    exports.toString = function(type) {
      switch (type) {
        case 1:
          return "A";
        case 10:
          return "NULL";
        case 28:
          return "AAAA";
        case 18:
          return "AFSDB";
        case 42:
          return "APL";
        case 257:
          return "CAA";
        case 60:
          return "CDNSKEY";
        case 59:
          return "CDS";
        case 37:
          return "CERT";
        case 5:
          return "CNAME";
        case 49:
          return "DHCID";
        case 32769:
          return "DLV";
        case 39:
          return "DNAME";
        case 48:
          return "DNSKEY";
        case 43:
          return "DS";
        case 55:
          return "HIP";
        case 13:
          return "HINFO";
        case 45:
          return "IPSECKEY";
        case 25:
          return "KEY";
        case 36:
          return "KX";
        case 29:
          return "LOC";
        case 15:
          return "MX";
        case 35:
          return "NAPTR";
        case 2:
          return "NS";
        case 47:
          return "NSEC";
        case 50:
          return "NSEC3";
        case 51:
          return "NSEC3PARAM";
        case 12:
          return "PTR";
        case 46:
          return "RRSIG";
        case 17:
          return "RP";
        case 24:
          return "SIG";
        case 6:
          return "SOA";
        case 99:
          return "SPF";
        case 33:
          return "SRV";
        case 44:
          return "SSHFP";
        case 32768:
          return "TA";
        case 249:
          return "TKEY";
        case 52:
          return "TLSA";
        case 250:
          return "TSIG";
        case 16:
          return "TXT";
        case 252:
          return "AXFR";
        case 251:
          return "IXFR";
        case 41:
          return "OPT";
        case 255:
          return "ANY";
      }
      return "UNKNOWN_" + type;
    };
    exports.toType = function(name) {
      switch (name.toUpperCase()) {
        case "A":
          return 1;
        case "NULL":
          return 10;
        case "AAAA":
          return 28;
        case "AFSDB":
          return 18;
        case "APL":
          return 42;
        case "CAA":
          return 257;
        case "CDNSKEY":
          return 60;
        case "CDS":
          return 59;
        case "CERT":
          return 37;
        case "CNAME":
          return 5;
        case "DHCID":
          return 49;
        case "DLV":
          return 32769;
        case "DNAME":
          return 39;
        case "DNSKEY":
          return 48;
        case "DS":
          return 43;
        case "HIP":
          return 55;
        case "HINFO":
          return 13;
        case "IPSECKEY":
          return 45;
        case "KEY":
          return 25;
        case "KX":
          return 36;
        case "LOC":
          return 29;
        case "MX":
          return 15;
        case "NAPTR":
          return 35;
        case "NS":
          return 2;
        case "NSEC":
          return 47;
        case "NSEC3":
          return 50;
        case "NSEC3PARAM":
          return 51;
        case "PTR":
          return 12;
        case "RRSIG":
          return 46;
        case "RP":
          return 17;
        case "SIG":
          return 24;
        case "SOA":
          return 6;
        case "SPF":
          return 99;
        case "SRV":
          return 33;
        case "SSHFP":
          return 44;
        case "TA":
          return 32768;
        case "TKEY":
          return 249;
        case "TLSA":
          return 52;
        case "TSIG":
          return 250;
        case "TXT":
          return 16;
        case "AXFR":
          return 252;
        case "IXFR":
          return 251;
        case "OPT":
          return 41;
        case "ANY":
          return 255;
        case "*":
          return 255;
      }
      if (name.toUpperCase().startsWith("UNKNOWN_")) return parseInt(name.slice(8));
      return 0;
    };
  }
});

// node_modules/dns-packet/rcodes.js
var require_rcodes = __commonJS({
  "node_modules/dns-packet/rcodes.js"(exports) {
    "use strict";
    exports.toString = function(rcode) {
      switch (rcode) {
        case 0:
          return "NOERROR";
        case 1:
          return "FORMERR";
        case 2:
          return "SERVFAIL";
        case 3:
          return "NXDOMAIN";
        case 4:
          return "NOTIMP";
        case 5:
          return "REFUSED";
        case 6:
          return "YXDOMAIN";
        case 7:
          return "YXRRSET";
        case 8:
          return "NXRRSET";
        case 9:
          return "NOTAUTH";
        case 10:
          return "NOTZONE";
        case 11:
          return "RCODE_11";
        case 12:
          return "RCODE_12";
        case 13:
          return "RCODE_13";
        case 14:
          return "RCODE_14";
        case 15:
          return "RCODE_15";
      }
      return "RCODE_" + rcode;
    };
    exports.toRcode = function(code) {
      switch (code.toUpperCase()) {
        case "NOERROR":
          return 0;
        case "FORMERR":
          return 1;
        case "SERVFAIL":
          return 2;
        case "NXDOMAIN":
          return 3;
        case "NOTIMP":
          return 4;
        case "REFUSED":
          return 5;
        case "YXDOMAIN":
          return 6;
        case "YXRRSET":
          return 7;
        case "NXRRSET":
          return 8;
        case "NOTAUTH":
          return 9;
        case "NOTZONE":
          return 10;
        case "RCODE_11":
          return 11;
        case "RCODE_12":
          return 12;
        case "RCODE_13":
          return 13;
        case "RCODE_14":
          return 14;
        case "RCODE_15":
          return 15;
      }
      return 0;
    };
  }
});

// node_modules/dns-packet/opcodes.js
var require_opcodes = __commonJS({
  "node_modules/dns-packet/opcodes.js"(exports) {
    "use strict";
    exports.toString = function(opcode) {
      switch (opcode) {
        case 0:
          return "QUERY";
        case 1:
          return "IQUERY";
        case 2:
          return "STATUS";
        case 3:
          return "OPCODE_3";
        case 4:
          return "NOTIFY";
        case 5:
          return "UPDATE";
        case 6:
          return "OPCODE_6";
        case 7:
          return "OPCODE_7";
        case 8:
          return "OPCODE_8";
        case 9:
          return "OPCODE_9";
        case 10:
          return "OPCODE_10";
        case 11:
          return "OPCODE_11";
        case 12:
          return "OPCODE_12";
        case 13:
          return "OPCODE_13";
        case 14:
          return "OPCODE_14";
        case 15:
          return "OPCODE_15";
      }
      return "OPCODE_" + opcode;
    };
    exports.toOpcode = function(code) {
      switch (code.toUpperCase()) {
        case "QUERY":
          return 0;
        case "IQUERY":
          return 1;
        case "STATUS":
          return 2;
        case "OPCODE_3":
          return 3;
        case "NOTIFY":
          return 4;
        case "UPDATE":
          return 5;
        case "OPCODE_6":
          return 6;
        case "OPCODE_7":
          return 7;
        case "OPCODE_8":
          return 8;
        case "OPCODE_9":
          return 9;
        case "OPCODE_10":
          return 10;
        case "OPCODE_11":
          return 11;
        case "OPCODE_12":
          return 12;
        case "OPCODE_13":
          return 13;
        case "OPCODE_14":
          return 14;
        case "OPCODE_15":
          return 15;
      }
      return 0;
    };
  }
});

// node_modules/dns-packet/classes.js
var require_classes = __commonJS({
  "node_modules/dns-packet/classes.js"(exports) {
    "use strict";
    exports.toString = function(klass) {
      switch (klass) {
        case 1:
          return "IN";
        case 2:
          return "CS";
        case 3:
          return "CH";
        case 4:
          return "HS";
        case 255:
          return "ANY";
      }
      return "UNKNOWN_" + klass;
    };
    exports.toClass = function(name) {
      switch (name.toUpperCase()) {
        case "IN":
          return 1;
        case "CS":
          return 2;
        case "CH":
          return 3;
        case "HS":
          return 4;
        case "ANY":
          return 255;
      }
      return 0;
    };
  }
});

// node_modules/dns-packet/optioncodes.js
var require_optioncodes = __commonJS({
  "node_modules/dns-packet/optioncodes.js"(exports) {
    "use strict";
    exports.toString = function(type) {
      switch (type) {
        // list at
        // https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-11
        case 1:
          return "LLQ";
        case 2:
          return "UL";
        case 3:
          return "NSID";
        case 5:
          return "DAU";
        case 6:
          return "DHU";
        case 7:
          return "N3U";
        case 8:
          return "CLIENT_SUBNET";
        case 9:
          return "EXPIRE";
        case 10:
          return "COOKIE";
        case 11:
          return "TCP_KEEPALIVE";
        case 12:
          return "PADDING";
        case 13:
          return "CHAIN";
        case 14:
          return "KEY_TAG";
        case 26946:
          return "DEVICEID";
      }
      if (type < 0) {
        return null;
      }
      return `OPTION_${type}`;
    };
    exports.toCode = function(name) {
      if (typeof name === "number") {
        return name;
      }
      if (!name) {
        return -1;
      }
      switch (name.toUpperCase()) {
        case "OPTION_0":
          return 0;
        case "LLQ":
          return 1;
        case "UL":
          return 2;
        case "NSID":
          return 3;
        case "OPTION_4":
          return 4;
        case "DAU":
          return 5;
        case "DHU":
          return 6;
        case "N3U":
          return 7;
        case "CLIENT_SUBNET":
          return 8;
        case "EXPIRE":
          return 9;
        case "COOKIE":
          return 10;
        case "TCP_KEEPALIVE":
          return 11;
        case "PADDING":
          return 12;
        case "CHAIN":
          return 13;
        case "KEY_TAG":
          return 14;
        case "DEVICEID":
          return 26946;
        case "OPTION_65535":
          return 65535;
      }
      const m = name.match(/_(\d+)$/);
      if (m) {
        return parseInt(m[1], 10);
      }
      return -1;
    };
  }
});

// node_modules/@leichtgewicht/ip-codec/index.cjs
var require_ip_codec = __commonJS({
  "node_modules/@leichtgewicht/ip-codec/index.cjs"(exports, module) {
    var ipCodec = (function(exports2) {
      "use strict";
      Object.defineProperty(exports2, "__esModule", {
        value: true
      });
      exports2.decode = decode2;
      exports2.encode = encode2;
      exports2.familyOf = familyOf;
      exports2.name = void 0;
      exports2.sizeOf = sizeOf;
      exports2.v6 = exports2.v4 = void 0;
      const v4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
      const v4Size = 4;
      const v6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;
      const v6Size = 16;
      const v4 = {
        name: "v4",
        size: v4Size,
        isFormat: (ip) => v4Regex.test(ip),
        encode(ip, buff, offset) {
          offset = ~~offset;
          buff = buff || new Uint8Array(offset + v4Size);
          const max = ip.length;
          let n = 0;
          for (let i = 0; i < max; ) {
            const c = ip.charCodeAt(i++);
            if (c === 46) {
              buff[offset++] = n;
              n = 0;
            } else {
              n = n * 10 + (c - 48);
            }
          }
          buff[offset] = n;
          return buff;
        },
        decode(buff, offset) {
          offset = ~~offset;
          return `${buff[offset++]}.${buff[offset++]}.${buff[offset++]}.${buff[offset]}`;
        }
      };
      exports2.v4 = v4;
      const v6 = {
        name: "v6",
        size: v6Size,
        isFormat: (ip) => ip.length > 0 && v6Regex.test(ip),
        encode(ip, buff, offset) {
          offset = ~~offset;
          let end = offset + v6Size;
          let fill = -1;
          let hexN = 0;
          let decN = 0;
          let prevColon = true;
          let useDec = false;
          buff = buff || new Uint8Array(offset + v6Size);
          for (let i = 0; i < ip.length; i++) {
            let c = ip.charCodeAt(i);
            if (c === 58) {
              if (prevColon) {
                if (fill !== -1) {
                  if (offset < end) buff[offset] = 0;
                  if (offset < end - 1) buff[offset + 1] = 0;
                  offset += 2;
                } else if (offset < end) {
                  fill = offset;
                }
              } else {
                if (useDec === true) {
                  if (offset < end) buff[offset] = decN;
                  offset++;
                } else {
                  if (offset < end) buff[offset] = hexN >> 8;
                  if (offset < end - 1) buff[offset + 1] = hexN & 255;
                  offset += 2;
                }
                hexN = 0;
                decN = 0;
              }
              prevColon = true;
              useDec = false;
            } else if (c === 46) {
              if (offset < end) buff[offset] = decN;
              offset++;
              decN = 0;
              hexN = 0;
              prevColon = false;
              useDec = true;
            } else {
              prevColon = false;
              if (c >= 97) {
                c -= 87;
              } else if (c >= 65) {
                c -= 55;
              } else {
                c -= 48;
                decN = decN * 10 + c;
              }
              hexN = (hexN << 4) + c;
            }
          }
          if (prevColon === false) {
            if (useDec === true) {
              if (offset < end) buff[offset] = decN;
              offset++;
            } else {
              if (offset < end) buff[offset] = hexN >> 8;
              if (offset < end - 1) buff[offset + 1] = hexN & 255;
              offset += 2;
            }
          } else if (fill === 0) {
            if (offset < end) buff[offset] = 0;
            if (offset < end - 1) buff[offset + 1] = 0;
            offset += 2;
          } else if (fill !== -1) {
            offset += 2;
            for (let i = Math.min(offset - 1, end - 1); i >= fill + 2; i--) {
              buff[i] = buff[i - 2];
            }
            buff[fill] = 0;
            buff[fill + 1] = 0;
            fill = offset;
          }
          if (fill !== offset && fill !== -1) {
            if (offset > end - 2) {
              offset = end - 2;
            }
            while (end > fill) {
              buff[--end] = offset < end && offset > fill ? buff[--offset] : 0;
            }
          } else {
            while (offset < end) {
              buff[offset++] = 0;
            }
          }
          return buff;
        },
        decode(buff, offset) {
          offset = ~~offset;
          let result = "";
          for (let i = 0; i < v6Size; i += 2) {
            if (i !== 0) {
              result += ":";
            }
            result += (buff[offset + i] << 8 | buff[offset + i + 1]).toString(16);
          }
          return result.replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
        }
      };
      exports2.v6 = v6;
      const name = "ip";
      exports2.name = name;
      function sizeOf(ip) {
        if (v4.isFormat(ip)) return v4.size;
        if (v6.isFormat(ip)) return v6.size;
        throw Error(`Invalid ip address: ${ip}`);
      }
      function familyOf(string) {
        return sizeOf(string) === v4.size ? 1 : 2;
      }
      function encode2(ip, buff, offset) {
        offset = ~~offset;
        const size = sizeOf(ip);
        if (typeof buff === "function") {
          buff = buff(offset + size);
        }
        if (size === v4.size) {
          return v4.encode(ip, buff, offset);
        }
        return v6.encode(ip, buff, offset);
      }
      function decode2(buff, offset, length) {
        offset = ~~offset;
        length = length || buff.length - offset;
        if (length === v4.size) {
          return v4.decode(buff, offset, length);
        }
        if (length === v6.size) {
          return v6.decode(buff, offset, length);
        }
        throw Error(`Invalid buffer size needs to be ${v4.size} for v4 or ${v6.size} for v6.`);
      }
      return "default" in exports2 ? exports2.default : exports2;
    })({});
    if (typeof define === "function" && define.amd) define([], function() {
      return ipCodec;
    });
    else if (typeof module === "object" && typeof exports === "object") module.exports = ipCodec;
  }
});

// node_modules/dns-packet/index.js
var require_dns_packet = __commonJS({
  "node_modules/dns-packet/index.js"(exports) {
    "use strict";
    var Buffer5 = require_buffer().Buffer;
    var types = require_types();
    var rcodes = require_rcodes();
    var opcodes = require_opcodes();
    var classes = require_classes();
    var optioncodes = require_optioncodes();
    var ip = require_ip_codec();
    var QUERY_FLAG = 0;
    var RESPONSE_FLAG = 1 << 15;
    var FLUSH_MASK = 1 << 15;
    var NOT_FLUSH_MASK = ~FLUSH_MASK;
    var QU_MASK = 1 << 15;
    var NOT_QU_MASK = ~QU_MASK;
    var name = exports.name = {};
    name.encode = function(str, buf, offset, { mail = false } = {}) {
      if (!buf) buf = Buffer5.alloc(name.encodingLength(str));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const n = str.replace(/^\.|\.$/gm, "");
      if (n.length) {
        let list = [];
        if (mail) {
          let localPart = "";
          n.split(".").forEach((label) => {
            if (label.endsWith("\\")) {
              localPart += (localPart.length ? "." : "") + label.slice(0, -1);
            } else {
              if (list.length === 0 && localPart.length) {
                list.push(localPart + "." + label);
              } else {
                list.push(label);
              }
            }
          });
        } else {
          list = n.split(".");
        }
        for (let i = 0; i < list.length; i++) {
          const len = buf.write(list[i], offset + 1);
          buf[offset] = len;
          offset += len + 1;
        }
      }
      buf[offset++] = 0;
      name.encode.bytes = offset - oldOffset;
      return buf;
    };
    name.encode.bytes = 0;
    name.decode = function(buf, offset, { mail = false } = {}) {
      if (!offset) offset = 0;
      const list = [];
      let oldOffset = offset;
      let totalLength = 0;
      let consumedBytes = 0;
      let jumped = false;
      while (true) {
        if (offset >= buf.length) {
          throw new Error("Cannot decode name (buffer overflow)");
        }
        const len = buf[offset++];
        consumedBytes += jumped ? 0 : 1;
        if (len === 0) {
          break;
        } else if ((len & 192) === 0) {
          if (offset + len > buf.length) {
            throw new Error("Cannot decode name (buffer overflow)");
          }
          totalLength += len + 1;
          if (totalLength > 254) {
            throw new Error("Cannot decode name (name too long)");
          }
          let label = buf.toString("utf-8", offset, offset + len);
          if (mail) {
            label = label.replace(/\./g, "\\.");
          }
          list.push(label);
          offset += len;
          consumedBytes += jumped ? 0 : len;
        } else if ((len & 192) === 192) {
          if (offset + 1 > buf.length) {
            throw new Error("Cannot decode name (buffer overflow)");
          }
          const jumpOffset = buf.readUInt16BE(offset - 1) - 49152;
          if (jumpOffset >= oldOffset) {
            throw new Error("Cannot decode name (bad pointer)");
          }
          offset = jumpOffset;
          oldOffset = jumpOffset;
          consumedBytes += jumped ? 0 : 1;
          jumped = true;
        } else {
          throw new Error("Cannot decode name (bad label)");
        }
      }
      name.decode.bytes = consumedBytes;
      return list.length === 0 ? "." : list.join(".");
    };
    name.decode.bytes = 0;
    name.encodingLength = function(n) {
      if (n === "." || n === "..") return 1;
      return Buffer5.byteLength(n.replace(/^\.|\.$/gm, "")) + 2;
    };
    var string = {};
    string.encode = function(s, buf, offset) {
      if (!buf) buf = Buffer5.alloc(string.encodingLength(s));
      if (!offset) offset = 0;
      const len = buf.write(s, offset + 1);
      buf[offset] = len;
      string.encode.bytes = len + 1;
      return buf;
    };
    string.encode.bytes = 0;
    string.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const len = buf[offset];
      const s = buf.toString("utf-8", offset + 1, offset + 1 + len);
      string.decode.bytes = len + 1;
      return s;
    };
    string.decode.bytes = 0;
    string.encodingLength = function(s) {
      return Buffer5.byteLength(s) + 1;
    };
    var header = {};
    header.encode = function(h, buf, offset) {
      if (!buf) buf = header.encodingLength(h);
      if (!offset) offset = 0;
      const flags = (h.flags || 0) & 32767;
      const type = h.type === "response" ? RESPONSE_FLAG : QUERY_FLAG;
      buf.writeUInt16BE(h.id || 0, offset);
      buf.writeUInt16BE(flags | type, offset + 2);
      buf.writeUInt16BE(h.questions.length, offset + 4);
      buf.writeUInt16BE(h.answers.length, offset + 6);
      buf.writeUInt16BE(h.authorities.length, offset + 8);
      buf.writeUInt16BE(h.additionals.length, offset + 10);
      return buf;
    };
    header.encode.bytes = 12;
    header.decode = function(buf, offset) {
      if (!offset) offset = 0;
      if (buf.length < 12) throw new Error("Header must be 12 bytes");
      const flags = buf.readUInt16BE(offset + 2);
      return {
        id: buf.readUInt16BE(offset),
        type: flags & RESPONSE_FLAG ? "response" : "query",
        flags: flags & 32767,
        flag_qr: (flags >> 15 & 1) === 1,
        opcode: opcodes.toString(flags >> 11 & 15),
        flag_aa: (flags >> 10 & 1) === 1,
        flag_tc: (flags >> 9 & 1) === 1,
        flag_rd: (flags >> 8 & 1) === 1,
        flag_ra: (flags >> 7 & 1) === 1,
        flag_z: (flags >> 6 & 1) === 1,
        flag_ad: (flags >> 5 & 1) === 1,
        flag_cd: (flags >> 4 & 1) === 1,
        rcode: rcodes.toString(flags & 15),
        questions: new Array(buf.readUInt16BE(offset + 4)),
        answers: new Array(buf.readUInt16BE(offset + 6)),
        authorities: new Array(buf.readUInt16BE(offset + 8)),
        additionals: new Array(buf.readUInt16BE(offset + 10))
      };
    };
    header.decode.bytes = 12;
    header.encodingLength = function() {
      return 12;
    };
    var runknown = exports.unknown = {};
    runknown.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(runknown.encodingLength(data));
      if (!offset) offset = 0;
      buf.writeUInt16BE(data.length, offset);
      data.copy(buf, offset + 2);
      runknown.encode.bytes = data.length + 2;
      return buf;
    };
    runknown.encode.bytes = 0;
    runknown.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const len = buf.readUInt16BE(offset);
      const data = buf.slice(offset + 2, offset + 2 + len);
      runknown.decode.bytes = len + 2;
      return data;
    };
    runknown.decode.bytes = 0;
    runknown.encodingLength = function(data) {
      return data.length + 2;
    };
    var rns = exports.ns = {};
    rns.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rns.encodingLength(data));
      if (!offset) offset = 0;
      name.encode(data, buf, offset + 2);
      buf.writeUInt16BE(name.encode.bytes, offset);
      rns.encode.bytes = name.encode.bytes + 2;
      return buf;
    };
    rns.encode.bytes = 0;
    rns.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const len = buf.readUInt16BE(offset);
      const dd = name.decode(buf, offset + 2);
      rns.decode.bytes = len + 2;
      return dd;
    };
    rns.decode.bytes = 0;
    rns.encodingLength = function(data) {
      return name.encodingLength(data) + 2;
    };
    var rsoa = exports.soa = {};
    rsoa.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rsoa.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      name.encode(data.mname, buf, offset);
      offset += name.encode.bytes;
      name.encode(data.rname, buf, offset, { mail: true });
      offset += name.encode.bytes;
      buf.writeUInt32BE(data.serial || 0, offset);
      offset += 4;
      buf.writeUInt32BE(data.refresh || 0, offset);
      offset += 4;
      buf.writeUInt32BE(data.retry || 0, offset);
      offset += 4;
      buf.writeUInt32BE(data.expire || 0, offset);
      offset += 4;
      buf.writeUInt32BE(data.minimum || 0, offset);
      offset += 4;
      buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
      rsoa.encode.bytes = offset - oldOffset;
      return buf;
    };
    rsoa.encode.bytes = 0;
    rsoa.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const data = {};
      offset += 2;
      data.mname = name.decode(buf, offset);
      offset += name.decode.bytes;
      data.rname = name.decode(buf, offset, { mail: true });
      offset += name.decode.bytes;
      data.serial = buf.readUInt32BE(offset);
      offset += 4;
      data.refresh = buf.readUInt32BE(offset);
      offset += 4;
      data.retry = buf.readUInt32BE(offset);
      offset += 4;
      data.expire = buf.readUInt32BE(offset);
      offset += 4;
      data.minimum = buf.readUInt32BE(offset);
      offset += 4;
      rsoa.decode.bytes = offset - oldOffset;
      return data;
    };
    rsoa.decode.bytes = 0;
    rsoa.encodingLength = function(data) {
      return 22 + name.encodingLength(data.mname) + name.encodingLength(data.rname);
    };
    var rtxt = exports.txt = {};
    rtxt.encode = function(data, buf, offset) {
      if (!Array.isArray(data)) data = [data];
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i] === "string") {
          data[i] = Buffer5.from(data[i]);
        }
        if (!Buffer5.isBuffer(data[i])) {
          throw new Error("Must be a Buffer");
        }
      }
      if (!buf) buf = Buffer5.alloc(rtxt.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      data.forEach(function(d) {
        buf[offset++] = d.length;
        d.copy(buf, offset, 0, d.length);
        offset += d.length;
      });
      buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
      rtxt.encode.bytes = offset - oldOffset;
      return buf;
    };
    rtxt.encode.bytes = 0;
    rtxt.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      let remaining = buf.readUInt16BE(offset);
      offset += 2;
      let data = [];
      while (remaining > 0) {
        const len = buf[offset++];
        --remaining;
        if (remaining < len) {
          throw new Error("Buffer overflow");
        }
        data.push(buf.slice(offset, offset + len));
        offset += len;
        remaining -= len;
      }
      rtxt.decode.bytes = offset - oldOffset;
      return data;
    };
    rtxt.decode.bytes = 0;
    rtxt.encodingLength = function(data) {
      if (!Array.isArray(data)) data = [data];
      let length = 2;
      data.forEach(function(buf) {
        if (typeof buf === "string") {
          length += Buffer5.byteLength(buf) + 1;
        } else {
          length += buf.length + 1;
        }
      });
      return length;
    };
    var rnull = exports.null = {};
    rnull.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rnull.encodingLength(data));
      if (!offset) offset = 0;
      if (typeof data === "string") data = Buffer5.from(data);
      if (!data) data = Buffer5.alloc(0);
      const oldOffset = offset;
      offset += 2;
      const len = data.length;
      data.copy(buf, offset, 0, len);
      offset += len;
      buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
      rnull.encode.bytes = offset - oldOffset;
      return buf;
    };
    rnull.encode.bytes = 0;
    rnull.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const len = buf.readUInt16BE(offset);
      offset += 2;
      const data = buf.slice(offset, offset + len);
      offset += len;
      rnull.decode.bytes = offset - oldOffset;
      return data;
    };
    rnull.decode.bytes = 0;
    rnull.encodingLength = function(data) {
      if (!data) return 2;
      return (Buffer5.isBuffer(data) ? data.length : Buffer5.byteLength(data)) + 2;
    };
    var rhinfo = exports.hinfo = {};
    rhinfo.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rhinfo.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      string.encode(data.cpu, buf, offset);
      offset += string.encode.bytes;
      string.encode(data.os, buf, offset);
      offset += string.encode.bytes;
      buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
      rhinfo.encode.bytes = offset - oldOffset;
      return buf;
    };
    rhinfo.encode.bytes = 0;
    rhinfo.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const data = {};
      offset += 2;
      data.cpu = string.decode(buf, offset);
      offset += string.decode.bytes;
      data.os = string.decode(buf, offset);
      offset += string.decode.bytes;
      rhinfo.decode.bytes = offset - oldOffset;
      return data;
    };
    rhinfo.decode.bytes = 0;
    rhinfo.encodingLength = function(data) {
      return string.encodingLength(data.cpu) + string.encodingLength(data.os) + 2;
    };
    var rptr = exports.ptr = {};
    var rcname = exports.cname = rptr;
    var rdname = exports.dname = rptr;
    rptr.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rptr.encodingLength(data));
      if (!offset) offset = 0;
      name.encode(data, buf, offset + 2);
      buf.writeUInt16BE(name.encode.bytes, offset);
      rptr.encode.bytes = name.encode.bytes + 2;
      return buf;
    };
    rptr.encode.bytes = 0;
    rptr.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const data = name.decode(buf, offset + 2);
      rptr.decode.bytes = name.decode.bytes + 2;
      return data;
    };
    rptr.decode.bytes = 0;
    rptr.encodingLength = function(data) {
      return name.encodingLength(data) + 2;
    };
    var rsrv = exports.srv = {};
    rsrv.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rsrv.encodingLength(data));
      if (!offset) offset = 0;
      buf.writeUInt16BE(data.priority || 0, offset + 2);
      buf.writeUInt16BE(data.weight || 0, offset + 4);
      buf.writeUInt16BE(data.port || 0, offset + 6);
      name.encode(data.target, buf, offset + 8);
      const len = name.encode.bytes + 6;
      buf.writeUInt16BE(len, offset);
      rsrv.encode.bytes = len + 2;
      return buf;
    };
    rsrv.encode.bytes = 0;
    rsrv.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const len = buf.readUInt16BE(offset);
      const data = {};
      data.priority = buf.readUInt16BE(offset + 2);
      data.weight = buf.readUInt16BE(offset + 4);
      data.port = buf.readUInt16BE(offset + 6);
      data.target = name.decode(buf, offset + 8);
      rsrv.decode.bytes = len + 2;
      return data;
    };
    rsrv.decode.bytes = 0;
    rsrv.encodingLength = function(data) {
      return 8 + name.encodingLength(data.target);
    };
    var rcaa = exports.caa = {};
    rcaa.ISSUER_CRITICAL = 1 << 7;
    rcaa.encode = function(data, buf, offset) {
      const len = rcaa.encodingLength(data);
      if (!buf) buf = Buffer5.alloc(rcaa.encodingLength(data));
      if (!offset) offset = 0;
      if (data.issuerCritical) {
        data.flags = rcaa.ISSUER_CRITICAL;
      }
      buf.writeUInt16BE(len - 2, offset);
      offset += 2;
      buf.writeUInt8(data.flags || 0, offset);
      offset += 1;
      string.encode(data.tag, buf, offset);
      offset += string.encode.bytes;
      buf.write(data.value, offset);
      offset += Buffer5.byteLength(data.value);
      rcaa.encode.bytes = len;
      return buf;
    };
    rcaa.encode.bytes = 0;
    rcaa.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const len = buf.readUInt16BE(offset);
      offset += 2;
      const oldOffset = offset;
      const data = {};
      data.flags = buf.readUInt8(offset);
      offset += 1;
      data.tag = string.decode(buf, offset);
      offset += string.decode.bytes;
      data.value = buf.toString("utf-8", offset, oldOffset + len);
      data.issuerCritical = !!(data.flags & rcaa.ISSUER_CRITICAL);
      rcaa.decode.bytes = len + 2;
      return data;
    };
    rcaa.decode.bytes = 0;
    rcaa.encodingLength = function(data) {
      return string.encodingLength(data.tag) + string.encodingLength(data.value) + 2;
    };
    var rmx = exports.mx = {};
    rmx.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rmx.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      buf.writeUInt16BE(data.preference || 0, offset);
      offset += 2;
      name.encode(data.exchange, buf, offset);
      offset += name.encode.bytes;
      buf.writeUInt16BE(offset - oldOffset - 2, oldOffset);
      rmx.encode.bytes = offset - oldOffset;
      return buf;
    };
    rmx.encode.bytes = 0;
    rmx.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const data = {};
      offset += 2;
      data.preference = buf.readUInt16BE(offset);
      offset += 2;
      data.exchange = name.decode(buf, offset);
      offset += name.decode.bytes;
      rmx.decode.bytes = offset - oldOffset;
      return data;
    };
    rmx.encodingLength = function(data) {
      return 4 + name.encodingLength(data.exchange);
    };
    var ra = exports.a = {};
    ra.encode = function(host, buf, offset) {
      if (!buf) buf = Buffer5.alloc(ra.encodingLength(host));
      if (!offset) offset = 0;
      buf.writeUInt16BE(4, offset);
      offset += 2;
      ip.v4.encode(host, buf, offset);
      ra.encode.bytes = 6;
      return buf;
    };
    ra.encode.bytes = 0;
    ra.decode = function(buf, offset) {
      if (!offset) offset = 0;
      offset += 2;
      const host = ip.v4.decode(buf, offset);
      ra.decode.bytes = 6;
      return host;
    };
    ra.decode.bytes = 0;
    ra.encodingLength = function() {
      return 6;
    };
    var raaaa = exports.aaaa = {};
    raaaa.encode = function(host, buf, offset) {
      if (!buf) buf = Buffer5.alloc(raaaa.encodingLength(host));
      if (!offset) offset = 0;
      buf.writeUInt16BE(16, offset);
      offset += 2;
      ip.v6.encode(host, buf, offset);
      raaaa.encode.bytes = 18;
      return buf;
    };
    raaaa.encode.bytes = 0;
    raaaa.decode = function(buf, offset) {
      if (!offset) offset = 0;
      offset += 2;
      const host = ip.v6.decode(buf, offset);
      raaaa.decode.bytes = 18;
      return host;
    };
    raaaa.decode.bytes = 0;
    raaaa.encodingLength = function() {
      return 18;
    };
    var roption = exports.option = {};
    roption.encode = function(option, buf, offset) {
      if (!buf) buf = Buffer5.alloc(roption.encodingLength(option));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const code = optioncodes.toCode(option.code);
      buf.writeUInt16BE(code, offset);
      offset += 2;
      if (option.data) {
        buf.writeUInt16BE(option.data.length, offset);
        offset += 2;
        option.data.copy(buf, offset);
        offset += option.data.length;
      } else {
        switch (code) {
          // case 3: NSID.  No encode makes sense.
          // case 5,6,7: Not implementable
          case 8:
            const spl = option.sourcePrefixLength || 0;
            const fam = option.family || ip.familyOf(option.ip);
            const ipBuf = ip.encode(option.ip, Buffer5.alloc);
            const ipLen = Math.ceil(spl / 8);
            buf.writeUInt16BE(ipLen + 4, offset);
            offset += 2;
            buf.writeUInt16BE(fam, offset);
            offset += 2;
            buf.writeUInt8(spl, offset++);
            buf.writeUInt8(option.scopePrefixLength || 0, offset++);
            ipBuf.copy(buf, offset, 0, ipLen);
            offset += ipLen;
            break;
          // case 9: EXPIRE (experimental)
          // case 10: COOKIE.  No encode makes sense.
          case 11:
            if (option.timeout) {
              buf.writeUInt16BE(2, offset);
              offset += 2;
              buf.writeUInt16BE(option.timeout, offset);
              offset += 2;
            } else {
              buf.writeUInt16BE(0, offset);
              offset += 2;
            }
            break;
          case 12:
            const len = option.length || 0;
            buf.writeUInt16BE(len, offset);
            offset += 2;
            buf.fill(0, offset, offset + len);
            offset += len;
            break;
          // case 13:  CHAIN.  Experimental.
          case 14:
            const tagsLen = option.tags.length * 2;
            buf.writeUInt16BE(tagsLen, offset);
            offset += 2;
            for (const tag of option.tags) {
              buf.writeUInt16BE(tag, offset);
              offset += 2;
            }
            break;
          default:
            throw new Error(`Unknown roption code: ${option.code}`);
        }
      }
      roption.encode.bytes = offset - oldOffset;
      return buf;
    };
    roption.encode.bytes = 0;
    roption.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const option = {};
      option.code = buf.readUInt16BE(offset);
      option.type = optioncodes.toString(option.code);
      offset += 2;
      const len = buf.readUInt16BE(offset);
      offset += 2;
      option.data = buf.slice(offset, offset + len);
      switch (option.code) {
        // case 3: NSID.  No decode makes sense.
        case 8:
          option.family = buf.readUInt16BE(offset);
          offset += 2;
          option.sourcePrefixLength = buf.readUInt8(offset++);
          option.scopePrefixLength = buf.readUInt8(offset++);
          const padded = Buffer5.alloc(option.family === 1 ? 4 : 16);
          buf.copy(padded, 0, offset, offset + len - 4);
          option.ip = ip.decode(padded);
          break;
        // case 12: Padding.  No decode makes sense.
        case 11:
          if (len > 0) {
            option.timeout = buf.readUInt16BE(offset);
            offset += 2;
          }
          break;
        case 14:
          option.tags = [];
          for (let i = 0; i < len; i += 2) {
            option.tags.push(buf.readUInt16BE(offset));
            offset += 2;
          }
      }
      roption.decode.bytes = len + 4;
      return option;
    };
    roption.decode.bytes = 0;
    roption.encodingLength = function(option) {
      if (option.data) {
        return option.data.length + 4;
      }
      const code = optioncodes.toCode(option.code);
      switch (code) {
        case 8:
          const spl = option.sourcePrefixLength || 0;
          return Math.ceil(spl / 8) + 8;
        case 11:
          return typeof option.timeout === "number" ? 6 : 4;
        case 12:
          return option.length + 4;
        case 14:
          return 4 + option.tags.length * 2;
      }
      throw new Error(`Unknown roption code: ${option.code}`);
    };
    var ropt = exports.opt = {};
    ropt.encode = function(options, buf, offset) {
      if (!buf) buf = Buffer5.alloc(ropt.encodingLength(options));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const rdlen = encodingLengthList(options, roption);
      buf.writeUInt16BE(rdlen, offset);
      offset = encodeList(options, roption, buf, offset + 2);
      ropt.encode.bytes = offset - oldOffset;
      return buf;
    };
    ropt.encode.bytes = 0;
    ropt.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const options = [];
      let rdlen = buf.readUInt16BE(offset);
      offset += 2;
      let o = 0;
      while (rdlen > 0) {
        options[o++] = roption.decode(buf, offset);
        offset += roption.decode.bytes;
        rdlen -= roption.decode.bytes;
      }
      ropt.decode.bytes = offset - oldOffset;
      return options;
    };
    ropt.decode.bytes = 0;
    ropt.encodingLength = function(options) {
      return 2 + encodingLengthList(options || [], roption);
    };
    var rdnskey = exports.dnskey = {};
    rdnskey.PROTOCOL_DNSSEC = 3;
    rdnskey.ZONE_KEY = 128;
    rdnskey.SECURE_ENTRYPOINT = 32768;
    rdnskey.encode = function(key, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rdnskey.encodingLength(key));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const keydata = key.key;
      if (!Buffer5.isBuffer(keydata)) {
        throw new Error("Key must be a Buffer");
      }
      offset += 2;
      buf.writeUInt16BE(key.flags, offset);
      offset += 2;
      buf.writeUInt8(rdnskey.PROTOCOL_DNSSEC, offset);
      offset += 1;
      buf.writeUInt8(key.algorithm, offset);
      offset += 1;
      keydata.copy(buf, offset, 0, keydata.length);
      offset += keydata.length;
      rdnskey.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rdnskey.encode.bytes - 2, oldOffset);
      return buf;
    };
    rdnskey.encode.bytes = 0;
    rdnskey.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var key = {};
      var length = buf.readUInt16BE(offset);
      offset += 2;
      key.flags = buf.readUInt16BE(offset);
      offset += 2;
      if (buf.readUInt8(offset) !== rdnskey.PROTOCOL_DNSSEC) {
        throw new Error("Protocol must be 3");
      }
      offset += 1;
      key.algorithm = buf.readUInt8(offset);
      offset += 1;
      key.key = buf.slice(offset, oldOffset + length + 2);
      offset += key.key.length;
      rdnskey.decode.bytes = offset - oldOffset;
      return key;
    };
    rdnskey.decode.bytes = 0;
    rdnskey.encodingLength = function(key) {
      return 6 + Buffer5.byteLength(key.key);
    };
    var rrrsig = exports.rrsig = {};
    rrrsig.encode = function(sig, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rrrsig.encodingLength(sig));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const signature = sig.signature;
      if (!Buffer5.isBuffer(signature)) {
        throw new Error("Signature must be a Buffer");
      }
      offset += 2;
      buf.writeUInt16BE(types.toType(sig.typeCovered), offset);
      offset += 2;
      buf.writeUInt8(sig.algorithm, offset);
      offset += 1;
      buf.writeUInt8(sig.labels, offset);
      offset += 1;
      buf.writeUInt32BE(sig.originalTTL, offset);
      offset += 4;
      buf.writeUInt32BE(sig.expiration, offset);
      offset += 4;
      buf.writeUInt32BE(sig.inception, offset);
      offset += 4;
      buf.writeUInt16BE(sig.keyTag, offset);
      offset += 2;
      name.encode(sig.signersName, buf, offset);
      offset += name.encode.bytes;
      signature.copy(buf, offset, 0, signature.length);
      offset += signature.length;
      rrrsig.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rrrsig.encode.bytes - 2, oldOffset);
      return buf;
    };
    rrrsig.encode.bytes = 0;
    rrrsig.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var sig = {};
      var length = buf.readUInt16BE(offset);
      offset += 2;
      sig.typeCovered = types.toString(buf.readUInt16BE(offset));
      offset += 2;
      sig.algorithm = buf.readUInt8(offset);
      offset += 1;
      sig.labels = buf.readUInt8(offset);
      offset += 1;
      sig.originalTTL = buf.readUInt32BE(offset);
      offset += 4;
      sig.expiration = buf.readUInt32BE(offset);
      offset += 4;
      sig.inception = buf.readUInt32BE(offset);
      offset += 4;
      sig.keyTag = buf.readUInt16BE(offset);
      offset += 2;
      sig.signersName = name.decode(buf, offset);
      offset += name.decode.bytes;
      sig.signature = buf.slice(offset, oldOffset + length + 2);
      offset += sig.signature.length;
      rrrsig.decode.bytes = offset - oldOffset;
      return sig;
    };
    rrrsig.decode.bytes = 0;
    rrrsig.encodingLength = function(sig) {
      return 20 + name.encodingLength(sig.signersName) + Buffer5.byteLength(sig.signature);
    };
    var rrp = exports.rp = {};
    rrp.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rrp.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      name.encode(data.mbox || ".", buf, offset, { mail: true });
      offset += name.encode.bytes;
      name.encode(data.txt || ".", buf, offset);
      offset += name.encode.bytes;
      rrp.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rrp.encode.bytes - 2, oldOffset);
      return buf;
    };
    rrp.encode.bytes = 0;
    rrp.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const data = {};
      offset += 2;
      data.mbox = name.decode(buf, offset, { mail: true }) || ".";
      offset += name.decode.bytes;
      data.txt = name.decode(buf, offset) || ".";
      offset += name.decode.bytes;
      rrp.decode.bytes = offset - oldOffset;
      return data;
    };
    rrp.decode.bytes = 0;
    rrp.encodingLength = function(data) {
      return 2 + name.encodingLength(data.mbox || ".") + name.encodingLength(data.txt || ".");
    };
    var typebitmap = {};
    typebitmap.encode = function(typelist, buf, offset) {
      if (!buf) buf = Buffer5.alloc(typebitmap.encodingLength(typelist));
      if (!offset) offset = 0;
      const oldOffset = offset;
      var typesByWindow = [];
      for (var i = 0; i < typelist.length; i++) {
        var typeid = types.toType(typelist[i]);
        if (typesByWindow[typeid >> 8] === void 0) {
          typesByWindow[typeid >> 8] = [];
        }
        typesByWindow[typeid >> 8][typeid >> 3 & 31] |= 1 << 7 - (typeid & 7);
      }
      for (i = 0; i < typesByWindow.length; i++) {
        if (typesByWindow[i] !== void 0) {
          var windowBuf = Buffer5.from(typesByWindow[i]);
          buf.writeUInt8(i, offset);
          offset += 1;
          buf.writeUInt8(windowBuf.length, offset);
          offset += 1;
          windowBuf.copy(buf, offset);
          offset += windowBuf.length;
        }
      }
      typebitmap.encode.bytes = offset - oldOffset;
      return buf;
    };
    typebitmap.encode.bytes = 0;
    typebitmap.decode = function(buf, offset, length) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var typelist = [];
      while (offset - oldOffset < length) {
        var window = buf.readUInt8(offset);
        offset += 1;
        var windowLength = buf.readUInt8(offset);
        offset += 1;
        for (var i = 0; i < windowLength; i++) {
          var b = buf.readUInt8(offset + i);
          for (var j = 0; j < 8; j++) {
            if (b & 1 << 7 - j) {
              var typeid = types.toString(window << 8 | i << 3 | j);
              typelist.push(typeid);
            }
          }
        }
        offset += windowLength;
      }
      typebitmap.decode.bytes = offset - oldOffset;
      return typelist;
    };
    typebitmap.decode.bytes = 0;
    typebitmap.encodingLength = function(typelist) {
      var extents = [];
      for (var i = 0; i < typelist.length; i++) {
        var typeid = types.toType(typelist[i]);
        extents[typeid >> 8] = Math.max(extents[typeid >> 8] || 0, typeid & 255);
      }
      var len = 0;
      for (i = 0; i < extents.length; i++) {
        if (extents[i] !== void 0) {
          len += 2 + Math.ceil((extents[i] + 1) / 8);
        }
      }
      return len;
    };
    var rnsec = exports.nsec = {};
    rnsec.encode = function(record, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rnsec.encodingLength(record));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      name.encode(record.nextDomain, buf, offset);
      offset += name.encode.bytes;
      typebitmap.encode(record.rrtypes, buf, offset);
      offset += typebitmap.encode.bytes;
      rnsec.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rnsec.encode.bytes - 2, oldOffset);
      return buf;
    };
    rnsec.encode.bytes = 0;
    rnsec.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var record = {};
      var length = buf.readUInt16BE(offset);
      offset += 2;
      record.nextDomain = name.decode(buf, offset);
      offset += name.decode.bytes;
      record.rrtypes = typebitmap.decode(buf, offset, length - (offset - oldOffset));
      offset += typebitmap.decode.bytes;
      rnsec.decode.bytes = offset - oldOffset;
      return record;
    };
    rnsec.decode.bytes = 0;
    rnsec.encodingLength = function(record) {
      return 2 + name.encodingLength(record.nextDomain) + typebitmap.encodingLength(record.rrtypes);
    };
    var rnsec3 = exports.nsec3 = {};
    rnsec3.encode = function(record, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rnsec3.encodingLength(record));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const salt = record.salt;
      if (!Buffer5.isBuffer(salt)) {
        throw new Error("salt must be a Buffer");
      }
      const nextDomain = record.nextDomain;
      if (!Buffer5.isBuffer(nextDomain)) {
        throw new Error("nextDomain must be a Buffer");
      }
      offset += 2;
      buf.writeUInt8(record.algorithm, offset);
      offset += 1;
      buf.writeUInt8(record.flags, offset);
      offset += 1;
      buf.writeUInt16BE(record.iterations, offset);
      offset += 2;
      buf.writeUInt8(salt.length, offset);
      offset += 1;
      salt.copy(buf, offset, 0, salt.length);
      offset += salt.length;
      buf.writeUInt8(nextDomain.length, offset);
      offset += 1;
      nextDomain.copy(buf, offset, 0, nextDomain.length);
      offset += nextDomain.length;
      typebitmap.encode(record.rrtypes, buf, offset);
      offset += typebitmap.encode.bytes;
      rnsec3.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rnsec3.encode.bytes - 2, oldOffset);
      return buf;
    };
    rnsec3.encode.bytes = 0;
    rnsec3.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var record = {};
      var length = buf.readUInt16BE(offset);
      offset += 2;
      record.algorithm = buf.readUInt8(offset);
      offset += 1;
      record.flags = buf.readUInt8(offset);
      offset += 1;
      record.iterations = buf.readUInt16BE(offset);
      offset += 2;
      const saltLength = buf.readUInt8(offset);
      offset += 1;
      record.salt = buf.slice(offset, offset + saltLength);
      offset += saltLength;
      const hashLength = buf.readUInt8(offset);
      offset += 1;
      record.nextDomain = buf.slice(offset, offset + hashLength);
      offset += hashLength;
      record.rrtypes = typebitmap.decode(buf, offset, length - (offset - oldOffset));
      offset += typebitmap.decode.bytes;
      rnsec3.decode.bytes = offset - oldOffset;
      return record;
    };
    rnsec3.decode.bytes = 0;
    rnsec3.encodingLength = function(record) {
      return 8 + record.salt.length + record.nextDomain.length + typebitmap.encodingLength(record.rrtypes);
    };
    var rds = exports.ds = {};
    rds.encode = function(digest, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rds.encodingLength(digest));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const digestdata = digest.digest;
      if (!Buffer5.isBuffer(digestdata)) {
        throw new Error("Digest must be a Buffer");
      }
      offset += 2;
      buf.writeUInt16BE(digest.keyTag, offset);
      offset += 2;
      buf.writeUInt8(digest.algorithm, offset);
      offset += 1;
      buf.writeUInt8(digest.digestType, offset);
      offset += 1;
      digestdata.copy(buf, offset, 0, digestdata.length);
      offset += digestdata.length;
      rds.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rds.encode.bytes - 2, oldOffset);
      return buf;
    };
    rds.encode.bytes = 0;
    rds.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      var digest = {};
      var length = buf.readUInt16BE(offset);
      offset += 2;
      digest.keyTag = buf.readUInt16BE(offset);
      offset += 2;
      digest.algorithm = buf.readUInt8(offset);
      offset += 1;
      digest.digestType = buf.readUInt8(offset);
      offset += 1;
      digest.digest = buf.slice(offset, oldOffset + length + 2);
      offset += digest.digest.length;
      rds.decode.bytes = offset - oldOffset;
      return digest;
    };
    rds.decode.bytes = 0;
    rds.encodingLength = function(digest) {
      return 6 + Buffer5.byteLength(digest.digest);
    };
    var rsshfp = exports.sshfp = {};
    rsshfp.getFingerprintLengthForHashType = function getFingerprintLengthForHashType(hashType) {
      switch (hashType) {
        case 1:
          return 20;
        case 2:
          return 32;
      }
    };
    rsshfp.encode = function encode2(record, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rsshfp.encodingLength(record));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      buf[offset] = record.algorithm;
      offset += 1;
      buf[offset] = record.hash;
      offset += 1;
      const fingerprintBuf = Buffer5.from(record.fingerprint.toUpperCase(), "hex");
      if (fingerprintBuf.length !== rsshfp.getFingerprintLengthForHashType(record.hash)) {
        throw new Error("Invalid fingerprint length");
      }
      fingerprintBuf.copy(buf, offset);
      offset += fingerprintBuf.byteLength;
      rsshfp.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rsshfp.encode.bytes - 2, oldOffset);
      return buf;
    };
    rsshfp.encode.bytes = 0;
    rsshfp.decode = function decode2(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const record = {};
      offset += 2;
      record.algorithm = buf[offset];
      offset += 1;
      record.hash = buf[offset];
      offset += 1;
      const fingerprintLength = rsshfp.getFingerprintLengthForHashType(record.hash);
      record.fingerprint = buf.slice(offset, offset + fingerprintLength).toString("hex").toUpperCase();
      offset += fingerprintLength;
      rsshfp.decode.bytes = offset - oldOffset;
      return record;
    };
    rsshfp.decode.bytes = 0;
    rsshfp.encodingLength = function(record) {
      return 4 + Buffer5.from(record.fingerprint, "hex").byteLength;
    };
    var rnaptr = exports.naptr = {};
    rnaptr.encode = function(data, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rnaptr.encodingLength(data));
      if (!offset) offset = 0;
      const oldOffset = offset;
      offset += 2;
      buf.writeUInt16BE(data.order || 0, offset);
      offset += 2;
      buf.writeUInt16BE(data.preference || 0, offset);
      offset += 2;
      string.encode(data.flags, buf, offset);
      offset += string.encode.bytes;
      string.encode(data.services, buf, offset);
      offset += string.encode.bytes;
      string.encode(data.regexp, buf, offset);
      offset += string.encode.bytes;
      name.encode(data.replacement, buf, offset);
      offset += name.encode.bytes;
      rnaptr.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rnaptr.encode.bytes - 2, oldOffset);
      return buf;
    };
    rnaptr.encode.bytes = 0;
    rnaptr.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const data = {};
      offset += 2;
      data.order = buf.readUInt16BE(offset);
      offset += 2;
      data.preference = buf.readUInt16BE(offset);
      offset += 2;
      data.flags = string.decode(buf, offset);
      offset += string.decode.bytes;
      data.services = string.decode(buf, offset);
      offset += string.decode.bytes;
      data.regexp = string.decode(buf, offset);
      offset += string.decode.bytes;
      data.replacement = name.decode(buf, offset);
      offset += name.decode.bytes;
      rnaptr.decode.bytes = offset - oldOffset;
      return data;
    };
    rnaptr.decode.bytes = 0;
    rnaptr.encodingLength = function(data) {
      return string.encodingLength(data.flags) + string.encodingLength(data.services) + string.encodingLength(data.regexp) + name.encodingLength(data.replacement) + 6;
    };
    var rtlsa = exports.tlsa = {};
    rtlsa.encode = function(cert, buf, offset) {
      if (!buf) buf = Buffer5.alloc(rtlsa.encodingLength(cert));
      if (!offset) offset = 0;
      const oldOffset = offset;
      const certdata = cert.certificate;
      if (!Buffer5.isBuffer(certdata)) {
        throw new Error("Certificate must be a Buffer");
      }
      offset += 2;
      buf.writeUInt8(cert.usage, offset);
      offset += 1;
      buf.writeUInt8(cert.selector, offset);
      offset += 1;
      buf.writeUInt8(cert.matchingType, offset);
      offset += 1;
      certdata.copy(buf, offset, 0, certdata.length);
      offset += certdata.length;
      rtlsa.encode.bytes = offset - oldOffset;
      buf.writeUInt16BE(rtlsa.encode.bytes - 2, oldOffset);
      return buf;
    };
    rtlsa.encode.bytes = 0;
    rtlsa.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const cert = {};
      const length = buf.readUInt16BE(offset);
      offset += 2;
      cert.usage = buf.readUInt8(offset);
      offset += 1;
      cert.selector = buf.readUInt8(offset);
      offset += 1;
      cert.matchingType = buf.readUInt8(offset);
      offset += 1;
      cert.certificate = buf.slice(offset, oldOffset + length + 2);
      offset += cert.certificate.length;
      rtlsa.decode.bytes = offset - oldOffset;
      return cert;
    };
    rtlsa.decode.bytes = 0;
    rtlsa.encodingLength = function(cert) {
      return 5 + Buffer5.byteLength(cert.certificate);
    };
    var renc = exports.record = function(type) {
      switch (type.toUpperCase()) {
        case "A":
          return ra;
        case "PTR":
          return rptr;
        case "CNAME":
          return rcname;
        case "DNAME":
          return rdname;
        case "TXT":
          return rtxt;
        case "NULL":
          return rnull;
        case "AAAA":
          return raaaa;
        case "SRV":
          return rsrv;
        case "HINFO":
          return rhinfo;
        case "CAA":
          return rcaa;
        case "NS":
          return rns;
        case "SOA":
          return rsoa;
        case "MX":
          return rmx;
        case "OPT":
          return ropt;
        case "DNSKEY":
          return rdnskey;
        case "RRSIG":
          return rrrsig;
        case "RP":
          return rrp;
        case "NSEC":
          return rnsec;
        case "NSEC3":
          return rnsec3;
        case "SSHFP":
          return rsshfp;
        case "DS":
          return rds;
        case "NAPTR":
          return rnaptr;
        case "TLSA":
          return rtlsa;
      }
      return runknown;
    };
    var answer = exports.answer = {};
    answer.encode = function(a, buf, offset) {
      if (!buf) buf = Buffer5.alloc(answer.encodingLength(a));
      if (!offset) offset = 0;
      const oldOffset = offset;
      name.encode(a.name, buf, offset);
      offset += name.encode.bytes;
      buf.writeUInt16BE(types.toType(a.type), offset);
      if (a.type.toUpperCase() === "OPT") {
        if (a.name !== ".") {
          throw new Error("OPT name must be root.");
        }
        buf.writeUInt16BE(a.udpPayloadSize || 4096, offset + 2);
        buf.writeUInt8(a.extendedRcode || 0, offset + 4);
        buf.writeUInt8(a.ednsVersion || 0, offset + 5);
        buf.writeUInt16BE(a.flags || 0, offset + 6);
        offset += 8;
        ropt.encode(a.options || [], buf, offset);
        offset += ropt.encode.bytes;
      } else {
        let klass = classes.toClass(a.class === void 0 ? "IN" : a.class);
        if (a.flush) klass |= FLUSH_MASK;
        buf.writeUInt16BE(klass, offset + 2);
        buf.writeUInt32BE(a.ttl || 0, offset + 4);
        offset += 8;
        const enc = renc(a.type);
        enc.encode(a.data, buf, offset);
        offset += enc.encode.bytes;
      }
      answer.encode.bytes = offset - oldOffset;
      return buf;
    };
    answer.encode.bytes = 0;
    answer.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const a = {};
      const oldOffset = offset;
      a.name = name.decode(buf, offset);
      offset += name.decode.bytes;
      a.type = types.toString(buf.readUInt16BE(offset));
      if (a.type === "OPT") {
        a.udpPayloadSize = buf.readUInt16BE(offset + 2);
        a.extendedRcode = buf.readUInt8(offset + 4);
        a.ednsVersion = buf.readUInt8(offset + 5);
        a.flags = buf.readUInt16BE(offset + 6);
        a.flag_do = (a.flags >> 15 & 1) === 1;
        a.options = ropt.decode(buf, offset + 8);
        offset += 8 + ropt.decode.bytes;
      } else {
        const klass = buf.readUInt16BE(offset + 2);
        a.ttl = buf.readUInt32BE(offset + 4);
        a.class = classes.toString(klass & NOT_FLUSH_MASK);
        a.flush = !!(klass & FLUSH_MASK);
        const enc = renc(a.type);
        a.data = enc.decode(buf, offset + 8);
        offset += 8 + enc.decode.bytes;
      }
      answer.decode.bytes = offset - oldOffset;
      return a;
    };
    answer.decode.bytes = 0;
    answer.encodingLength = function(a) {
      const data = a.data !== null && a.data !== void 0 ? a.data : a.options;
      return name.encodingLength(a.name) + 8 + renc(a.type).encodingLength(data);
    };
    var question = exports.question = {};
    question.encode = function(q, buf, offset) {
      if (!buf) buf = Buffer5.alloc(question.encodingLength(q));
      if (!offset) offset = 0;
      const oldOffset = offset;
      name.encode(q.name, buf, offset);
      offset += name.encode.bytes;
      buf.writeUInt16BE(types.toType(q.type), offset);
      offset += 2;
      buf.writeUInt16BE(classes.toClass(q.class === void 0 ? "IN" : q.class), offset);
      offset += 2;
      question.encode.bytes = offset - oldOffset;
      return q;
    };
    question.encode.bytes = 0;
    question.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const q = {};
      q.name = name.decode(buf, offset);
      offset += name.decode.bytes;
      q.type = types.toString(buf.readUInt16BE(offset));
      offset += 2;
      q.class = classes.toString(buf.readUInt16BE(offset));
      offset += 2;
      const qu = !!(q.class & QU_MASK);
      if (qu) q.class &= NOT_QU_MASK;
      question.decode.bytes = offset - oldOffset;
      return q;
    };
    question.decode.bytes = 0;
    question.encodingLength = function(q) {
      return name.encodingLength(q.name) + 4;
    };
    exports.AUTHORITATIVE_ANSWER = 1 << 10;
    exports.TRUNCATED_RESPONSE = 1 << 9;
    exports.RECURSION_DESIRED = 1 << 8;
    exports.RECURSION_AVAILABLE = 1 << 7;
    exports.AUTHENTIC_DATA = 1 << 5;
    exports.CHECKING_DISABLED = 1 << 4;
    exports.DNSSEC_OK = 1 << 15;
    exports.encode = function(result, buf, offset) {
      const allocing = !buf;
      if (allocing) buf = Buffer5.alloc(exports.encodingLength(result));
      if (!offset) offset = 0;
      const oldOffset = offset;
      if (!result.questions) result.questions = [];
      if (!result.answers) result.answers = [];
      if (!result.authorities) result.authorities = [];
      if (!result.additionals) result.additionals = [];
      header.encode(result, buf, offset);
      offset += header.encode.bytes;
      offset = encodeList(result.questions, question, buf, offset);
      offset = encodeList(result.answers, answer, buf, offset);
      offset = encodeList(result.authorities, answer, buf, offset);
      offset = encodeList(result.additionals, answer, buf, offset);
      exports.encode.bytes = offset - oldOffset;
      if (allocing && exports.encode.bytes !== buf.length) {
        return buf.slice(0, exports.encode.bytes);
      }
      return buf;
    };
    exports.encode.bytes = 0;
    exports.decode = function(buf, offset) {
      if (!offset) offset = 0;
      const oldOffset = offset;
      const result = header.decode(buf, offset);
      offset += header.decode.bytes;
      offset = decodeList(result.questions, question, buf, offset);
      offset = decodeList(result.answers, answer, buf, offset);
      offset = decodeList(result.authorities, answer, buf, offset);
      offset = decodeList(result.additionals, answer, buf, offset);
      exports.decode.bytes = offset - oldOffset;
      return result;
    };
    exports.decode.bytes = 0;
    exports.encodingLength = function(result) {
      return header.encodingLength(result) + encodingLengthList(result.questions || [], question) + encodingLengthList(result.answers || [], answer) + encodingLengthList(result.authorities || [], answer) + encodingLengthList(result.additionals || [], answer);
    };
    exports.streamEncode = function(result) {
      const buf = exports.encode(result);
      const sbuf = Buffer5.alloc(2);
      sbuf.writeUInt16BE(buf.byteLength);
      const combine = Buffer5.concat([sbuf, buf]);
      exports.streamEncode.bytes = combine.byteLength;
      return combine;
    };
    exports.streamEncode.bytes = 0;
    exports.streamDecode = function(sbuf) {
      const len = sbuf.readUInt16BE(0);
      if (sbuf.byteLength < len + 2) {
        return null;
      }
      const result = exports.decode(sbuf.slice(2));
      exports.streamDecode.bytes = exports.decode.bytes;
      return result;
    };
    exports.streamDecode.bytes = 0;
    function encodingLengthList(list, enc) {
      let len = 0;
      for (let i = 0; i < list.length; i++) len += enc.encodingLength(list[i]);
      return len;
    }
    function encodeList(list, enc, buf, offset) {
      for (let i = 0; i < list.length; i++) {
        enc.encode(list[i], buf, offset);
        offset += enc.encode.bytes;
      }
      return offset;
    }
    function decodeList(list, enc, buf, offset) {
      for (let i = 0; i < list.length; i++) {
        list[i] = enc.decode(buf, offset);
        offset += enc.decode.bytes;
      }
      return offset;
    }
  }
});

// src/index.js
var import_dns_packet = __toESM(require_dns_packet(), 1);

// src/doh.js
var import_buffer = __toESM(require_buffer(), 1);

// src/constants.js
var UPSTREAM_URL = "https://dns.quad9.net/dns-query";
var UPSTREAM_TIMEOUT_MS = 5e3;
var MAX_CACHE_TTL = 86400;
var DEFAULT_TTL = 60;
var ECS_OPTION_CODE = 8;
var IPV4_ECS_PREFIX = 24;
var IPV6_ECS_PREFIX = 48;
var EDNS_PAYLOAD_SIZE = 1232;
var MAX_DNS_MESSAGE_SIZE = 65535;
var CACHE_BASE = "https://doh-cache/";
var CACHEABLE_RCODES = ["NOERROR", "NXDOMAIN"];

// src/doh.js
function base64urlToBuffer(base64url) {
  if (!/^[A-Za-z0-9_-]+$/.test(base64url)) {
    throw new Error("dns parameter is not valid base64url");
  }
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return import_buffer.Buffer.from(bytes);
}
function parseGetRequest(url) {
  const dnsParam = url.searchParams.get("dns");
  if (!dnsParam) {
    throw new Error("Missing dns query parameter");
  }
  if (dnsParam.length > 2048) {
    throw new Error("dns parameter too long");
  }
  return base64urlToBuffer(dnsParam);
}
async function parsePostRequest(request) {
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (contentType && contentType !== "application/dns-message") {
    throw new Error("Unsupported Content-Type — expected application/dns-message");
  }
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DNS_MESSAGE_SIZE) {
    throw new Error("DNS message too large");
  }
  const body = import_buffer.Buffer.from(await request.arrayBuffer());
  if (body.length === 0) {
    throw new Error("Empty POST body");
  }
  if (body.length > MAX_DNS_MESSAGE_SIZE) {
    throw new Error("DNS message too large");
  }
  return body;
}

// src/ecs.js
function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || null;
}
function parseIPv4(ip) {
  const parts = String(ip).split(".").map(Number);
  if (parts.length !== 4) {
    return null;
  }
  return parts.every((p) => Number.isInteger(p) && p >= 0 && p <= 255) ? parts : null;
}
function maskIPv4(ip, prefixLength = IPV4_ECS_PREFIX) {
  const parts = parseIPv4(ip);
  if (!parts || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return null;
  }
  const fullBytes = Math.floor(prefixLength / 8);
  const remainder = prefixLength % 8;
  if (remainder > 0) {
    parts[fullBytes] &= 255 << 8 - remainder & 255;
  }
  for (let i = fullBytes + (remainder > 0 ? 1 : 0); i < 4; i++) {
    parts[i] = 0;
  }
  return parts.join(".");
}
function parseIPv6(ip) {
  let addr = String(ip).trim().toLowerCase();
  if (!addr.includes(":")) {
    return null;
  }
  const v4Match = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(addr);
  if (v4Match) {
    const v4 = parseIPv4(v4Match[1]);
    if (!v4) {
      return null;
    }
    addr = `${addr.slice(0, -v4Match[1].length)}${(v4[0] << 8 | v4[1]).toString(16)}:${(v4[2] << 8 | v4[3]).toString(16)}`;
  }
  const halves = addr.split("::");
  if (halves.length > 2) {
    return null;
  }
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (halves.length === 2 ? missing < 1 : missing !== 0)) {
    return null;
  }
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
    return null;
  }
  return groups.map((g) => parseInt(g, 16));
}
function maskIPv6(ip, prefixLength = IPV6_ECS_PREFIX) {
  const groups = parseIPv6(ip);
  if (!groups || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 128) {
    return null;
  }
  const fullGroups = Math.floor(prefixLength / 16);
  const remainder = prefixLength % 16;
  if (remainder > 0) {
    groups[fullGroups] &= 65535 << 16 - remainder & 65535;
  }
  for (let i = fullGroups + (remainder > 0 ? 1 : 0); i < 8; i++) {
    groups[i] = 0;
  }
  return groups.map((g) => g.toString(16)).join(":");
}
function maskIp(ip, prefixLength) {
  if (String(ip).includes(":")) {
    return maskIPv6(ip, Math.min(prefixLength, 128));
  }
  return maskIPv4(ip, Math.min(prefixLength, 32));
}
function findOptRecord(parsedPacket) {
  return parsedPacket.additionals.find((r) => r.type === "OPT") || null;
}
function createOptRecord() {
  return {
    name: ".",
    type: "OPT",
    udpPayloadSize: EDNS_PAYLOAD_SIZE,
    extendedRcode: 0,
    ednsVersion: 0,
    flags: 0,
    options: []
  };
}
function findClientEcs(optRecord) {
  if (!optRecord) {
    return null;
  }
  return optRecord.options.find((o) => o.code === ECS_OPTION_CODE || o.type === "CLIENT_SUBNET") || null;
}
function keepOnlyEcs(optRecord, ecsOption) {
  if (optRecord) {
    optRecord.options = ecsOption ? [ecsOption] : [];
  }
}
function normalizeClientEcs(clientEcs) {
  const sourcePrefixLength = Number.isInteger(clientEcs.sourcePrefixLength) ? clientEcs.sourcePrefixLength : 0;
  return {
    code: ECS_OPTION_CODE,
    ip: maskIp(clientEcs.ip || "", sourcePrefixLength) || clientEcs.ip || "",
    family: clientEcs.family,
    sourcePrefixLength,
    scopePrefixLength: 0
  };
}
function injectECS(parsedPacket, clientIp) {
  const optRecord = findOptRecord(parsedPacket);
  const clientEcs = findClientEcs(optRecord);
  if (!clientIp) {
    keepOnlyEcs(optRecord, clientEcs);
    return clientEcs ? normalizeClientEcs(clientEcs) : null;
  }
  if (clientEcs && clientEcs.sourcePrefixLength === 0) {
    keepOnlyEcs(optRecord, null);
    return null;
  }
  const isV6 = clientIp.includes(":");
  const family = isV6 ? 2 : 1;
  const maxPrefix = isV6 ? IPV6_ECS_PREFIX : IPV4_ECS_PREFIX;
  let sourcePrefixLength = maxPrefix;
  if (clientEcs && clientEcs.family === family && Number.isInteger(clientEcs.sourcePrefixLength)) {
    sourcePrefixLength = Math.min(maxPrefix, clientEcs.sourcePrefixLength);
  }
  const maskedIp = sourcePrefixLength > 0 ? maskIp(clientIp, sourcePrefixLength) : null;
  if (!maskedIp) {
    keepOnlyEcs(optRecord, clientEcs);
    return clientEcs ? normalizeClientEcs(clientEcs) : null;
  }
  const ecsOption = {
    code: ECS_OPTION_CODE,
    ip: maskedIp,
    sourcePrefixLength,
    scopePrefixLength: 0,
    family
  };
  if (!optRecord) {
    parsedPacket.additionals.push(createOptRecord());
  }
  keepOnlyEcs(findOptRecord(parsedPacket), ecsOption);
  return ecsOption;
}
function getDnssecOk(parsedPacket) {
  const optRecord = findOptRecord(parsedPacket);
  if (optRecord) {
    return !!(optRecord.flags & 1 << 15);
  }
  return false;
}

// src/cache.js
var import_buffer2 = __toESM(require_buffer(), 1);
function buildCacheKey(questions, ecsOption, dnssecOk, checkingDisabled = false) {
  const q = questions[0];
  const parts = [
    q.name,
    q.type || "A",
    q.class || "IN"
  ];
  if (ecsOption) {
    parts.push(`ecs${ecsOption.family}_${ecsOption.sourcePrefixLength}_${ecsOption.ip}`);
  } else {
    parts.push("ecsnone");
  }
  parts.push(`do${dnssecOk ? 1 : 0}`);
  parts.push(`cd${checkingDisabled ? 1 : 0}`);
  return parts.join("|");
}
function buildCacheRequest(cacheKey) {
  const url = CACHE_BASE + encodeURIComponent(cacheKey);
  return new Request(url);
}
async function getFromCache(cacheRequest, requestId) {
  try {
    const response = await caches.default.match(cacheRequest);
    if (!response) {
      return null;
    }
    const dnsBuffer = import_buffer2.Buffer.from(await response.arrayBuffer());
    if (dnsBuffer.length >= 2 && Number.isInteger(requestId)) {
      dnsBuffer.writeUInt16BE(requestId & 65535, 0);
    }
    const headers = new Headers(response.headers);
    headers.set("X-Cache", "HIT");
    headers.set("X-Cache-TTL", response.headers.get("X-Cache-TTL") || "unknown");
    return new Response(dnsBuffer, { headers });
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
}
async function storeInCache(cacheRequest, dnsResponseBuffer, ttl, maxCacheTtl = MAX_CACHE_TTL) {
  try {
    const maxTTL = Math.min(ttl, maxCacheTtl);
    const headers = {
      "Content-Type": "application/dns-message",
      "Cache-Control": `public, max-age=${maxTTL}, s-maxage=${maxTTL}`,
      "X-Cache-TTL": String(maxTTL)
    };
    const response = new Response(dnsResponseBuffer, { headers });
    await caches.default.put(cacheRequest, response);
  } catch (e) {
    console.error("Cache write error:", e);
  }
}
function getMinTTL(decodedResponse) {
  const answerTTLs = (decodedResponse.answers || []).filter((rr) => rr.type !== "OPT" && typeof rr.ttl === "number").map((rr) => rr.ttl);
  if (answerTTLs.length > 0) {
    return Math.min(...answerTTLs);
  }
  const soa = (decodedResponse.authorities || []).find((rr) => rr.type === "SOA");
  if (soa) {
    const soaTTL = typeof soa.ttl === "number" ? soa.ttl : DEFAULT_TTL;
    const minimum = soa.data && typeof soa.data.minimum === "number" ? soa.data.minimum : DEFAULT_TTL;
    return Math.max(0, Math.min(soaTTL, minimum));
  }
  return DEFAULT_TTL;
}

// src/upstream.js
var import_buffer3 = __toESM(require_buffer(), 1);
async function queryUpstream(dnsWireFormat, config) {
  const { upstreamUrl = UPSTREAM_URL, upstreamTimeoutMs = UPSTREAM_TIMEOUT_MS } = config || {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), upstreamTimeoutMs);
  try {
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/dns-message",
        "Accept": "application/dns-message"
      },
      body: dnsWireFormat,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`upstream returned HTTP ${response.status}`);
    }
    const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
    if (contentType && !contentType.includes("application/dns-message")) {
      throw new Error(`unexpected upstream Content-Type: ${contentType}`);
    }
    return import_buffer3.Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeoutId);
  }
}

// src/response.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept"
};
function formatResponse(dnsWireFormat, ttl) {
  const headers = {
    "Content-Type": "application/dns-message",
    ...CORS_HEADERS,
    "X-Cache": "MISS"
  };
  if (ttl > 0) {
    headers["Cache-Control"] = `public, max-age=${ttl}`;
  } else {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  }
  return new Response(dnsWireFormat, { headers });
}
function errorResponse(status, message) {
  const body = JSON.stringify({
    error: true,
    message,
    status
  });
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      ...CORS_HEADERS,
      "Cache-Control": "no-store"
    }
  });
}

// src/config.js
function toInt(value, fallback, min) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}
function resolveConfig(env) {
  const vars = env || {};
  return {
    upstreamUrl: typeof vars.UPSTREAM_DOH_URL === "string" && vars.UPSTREAM_DOH_URL ? vars.UPSTREAM_DOH_URL : UPSTREAM_URL,
    upstreamTimeoutMs: toInt(vars.UPSTREAM_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS, 1),
    // 允许设为 0 表示关闭缓存
    maxCacheTtl: toInt(vars.CACHE_TTL_MAX, MAX_CACHE_TTL, 0)
  };
}

// src/index.js
var CD_FLAG = 16;
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...CORS_HEADERS,
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (pathname !== "/") {
      return errorResponse(404, "Not Found — use the root path /");
    }
    try {
      const config = resolveConfig(env);
      let dnsWireFormat;
      if (request.method === "GET") {
        try {
          dnsWireFormat = parseGetRequest(url);
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else if (request.method === "POST") {
        try {
          dnsWireFormat = await parsePostRequest(request);
        } catch (e) {
          return errorResponse(400, e.message);
        }
      } else {
        return errorResponse(405, "Method Not Allowed — use GET or POST");
      }
      let parsed;
      try {
        parsed = (0, import_dns_packet.decode)(dnsWireFormat);
      } catch (e) {
        return errorResponse(400, "Invalid DNS message — failed to decode");
      }
      if (parsed.type !== "query" || parsed.opcode !== "QUERY") {
        return errorResponse(400, "Only standard DNS queries are supported");
      }
      if (parsed.questions.length !== 1) {
        return errorResponse(400, "Exactly one question is required");
      }
      const clientIp = getClientIp(request);
      const ecsOption = injectECS(parsed, clientIp);
      const dnssecOk = getDnssecOk(parsed);
      const checkingDisabled = !!(parsed.flags & CD_FLAG);
      const cacheKey = buildCacheKey(parsed.questions, ecsOption, dnssecOk, checkingDisabled);
      const cacheRequest = buildCacheRequest(cacheKey);
      const cachedResponse = await getFromCache(cacheRequest, parsed.id);
      if (cachedResponse) {
        return cachedResponse;
      }
      let modifiedWireFormat;
      try {
        modifiedWireFormat = (0, import_dns_packet.encode)(parsed);
      } catch (e) {
        return errorResponse(500, "Failed to encode modified DNS message");
      }
      let upstreamBuf;
      try {
        upstreamBuf = await queryUpstream(modifiedWireFormat, config);
      } catch (e) {
        console.error("Upstream DNS query failed:", e.message);
        if (e.name === "AbortError") {
          return errorResponse(504, "Upstream DNS query timed out");
        }
        return errorResponse(502, "Upstream DNS query failed");
      }
      let decodedUpstream;
      try {
        decodedUpstream = (0, import_dns_packet.decode)(upstreamBuf);
      } catch (e) {
        return formatResponse(upstreamBuf, 0);
      }
      if (decodedUpstream.id !== parsed.id) {
        upstreamBuf.writeUInt16BE(parsed.id, 0);
        decodedUpstream.id = parsed.id;
      }
      const ttl = getMinTTL(decodedUpstream);
      const cacheable = config.maxCacheTtl > 0 && ttl > 0 && !decodedUpstream.flag_tc && CACHEABLE_RCODES.includes(decodedUpstream.rcode);
      if (cacheable) {
        ctx.waitUntil(storeInCache(cacheRequest, upstreamBuf, ttl, config.maxCacheTtl));
      }
      return formatResponse(upstreamBuf, ttl);
    } catch (e) {
      console.error("Unhandled error:", e);
      return errorResponse(500, "Internal Server Error");
    }
  }
};
export {
  index_default as default
};
