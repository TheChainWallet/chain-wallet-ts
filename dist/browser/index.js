import { PublicKey, SendTransactionError, SystemProgram, TransactionInstruction, Transaction, TransactionMessage, VersionedTransaction, Connection } from '@solana/web3.js';
import * as borsh from '@coral-xyz/borsh';
import { createHash } from 'crypto';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var bn$1 = {exports: {}};

var _nodeResolve_empty = {};

var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	default: _nodeResolve_empty
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

var bn = bn$1.exports;

var hasRequiredBn;

function requireBn () {
	if (hasRequiredBn) return bn$1.exports;
	hasRequiredBn = 1;
	(function (module) {
		(function (module, exports$1) {

		  // Utils
		  function assert (val, msg) {
		    if (!val) throw new Error(msg || 'Assertion failed');
		  }

		  // Could use `inherits` module, but don't want to move from single file
		  // architecture yet.
		  function inherits (ctor, superCtor) {
		    ctor.super_ = superCtor;
		    var TempCtor = function () {};
		    TempCtor.prototype = superCtor.prototype;
		    ctor.prototype = new TempCtor();
		    ctor.prototype.constructor = ctor;
		  }

		  // BN

		  function BN (number, base, endian) {
		    if (BN.isBN(number)) {
		      return number;
		    }

		    this.negative = 0;
		    this.words = null;
		    this.length = 0;

		    // Reduction context
		    this.red = null;

		    if (number !== null) {
		      if (base === 'le' || base === 'be') {
		        endian = base;
		        base = 10;
		      }

		      this._init(number || 0, base || 10, endian || 'be');
		    }
		  }
		  if (typeof module === 'object') {
		    module.exports = BN;
		  } else {
		    exports$1.BN = BN;
		  }

		  BN.BN = BN;
		  BN.wordSize = 26;

		  var Buffer;
		  try {
		    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
		      Buffer = window.Buffer;
		    } else {
		      Buffer = require$$0.Buffer;
		    }
		  } catch (e) {
		  }

		  BN.isBN = function isBN (num) {
		    if (num instanceof BN) {
		      return true;
		    }

		    return num !== null && typeof num === 'object' &&
		      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
		  };

		  BN.max = function max (left, right) {
		    if (left.cmp(right) > 0) return left;
		    return right;
		  };

		  BN.min = function min (left, right) {
		    if (left.cmp(right) < 0) return left;
		    return right;
		  };

		  BN.prototype._init = function init (number, base, endian) {
		    if (typeof number === 'number') {
		      return this._initNumber(number, base, endian);
		    }

		    if (typeof number === 'object') {
		      return this._initArray(number, base, endian);
		    }

		    if (base === 'hex') {
		      base = 16;
		    }
		    assert(base === (base | 0) && base >= 2 && base <= 36);

		    number = number.toString().replace(/\s+/g, '');
		    var start = 0;
		    if (number[0] === '-') {
		      start++;
		      this.negative = 1;
		    }

		    if (start < number.length) {
		      if (base === 16) {
		        this._parseHex(number, start, endian);
		      } else {
		        this._parseBase(number, base, start);
		        if (endian === 'le') {
		          this._initArray(this.toArray(), base, endian);
		        }
		      }
		    }
		  };

		  BN.prototype._initNumber = function _initNumber (number, base, endian) {
		    if (number < 0) {
		      this.negative = 1;
		      number = -number;
		    }
		    if (number < 0x4000000) {
		      this.words = [number & 0x3ffffff];
		      this.length = 1;
		    } else if (number < 0x10000000000000) {
		      this.words = [
		        number & 0x3ffffff,
		        (number / 0x4000000) & 0x3ffffff
		      ];
		      this.length = 2;
		    } else {
		      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
		      this.words = [
		        number & 0x3ffffff,
		        (number / 0x4000000) & 0x3ffffff,
		        1
		      ];
		      this.length = 3;
		    }

		    if (endian !== 'le') return;

		    // Reverse the bytes
		    this._initArray(this.toArray(), base, endian);
		  };

		  BN.prototype._initArray = function _initArray (number, base, endian) {
		    // Perhaps a Uint8Array
		    assert(typeof number.length === 'number');
		    if (number.length <= 0) {
		      this.words = [0];
		      this.length = 1;
		      return this;
		    }

		    this.length = Math.ceil(number.length / 3);
		    this.words = new Array(this.length);
		    for (var i = 0; i < this.length; i++) {
		      this.words[i] = 0;
		    }

		    var j, w;
		    var off = 0;
		    if (endian === 'be') {
		      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
		        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
		        this.words[j] |= (w << off) & 0x3ffffff;
		        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
		        off += 24;
		        if (off >= 26) {
		          off -= 26;
		          j++;
		        }
		      }
		    } else if (endian === 'le') {
		      for (i = 0, j = 0; i < number.length; i += 3) {
		        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
		        this.words[j] |= (w << off) & 0x3ffffff;
		        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
		        off += 24;
		        if (off >= 26) {
		          off -= 26;
		          j++;
		        }
		      }
		    }
		    return this._strip();
		  };

		  function parseHex4Bits (string, index) {
		    var c = string.charCodeAt(index);
		    // '0' - '9'
		    if (c >= 48 && c <= 57) {
		      return c - 48;
		    // 'A' - 'F'
		    } else if (c >= 65 && c <= 70) {
		      return c - 55;
		    // 'a' - 'f'
		    } else if (c >= 97 && c <= 102) {
		      return c - 87;
		    } else {
		      assert(false, 'Invalid character in ' + string);
		    }
		  }

		  function parseHexByte (string, lowerBound, index) {
		    var r = parseHex4Bits(string, index);
		    if (index - 1 >= lowerBound) {
		      r |= parseHex4Bits(string, index - 1) << 4;
		    }
		    return r;
		  }

		  BN.prototype._parseHex = function _parseHex (number, start, endian) {
		    // Create possibly bigger array to ensure that it fits the number
		    this.length = Math.ceil((number.length - start) / 6);
		    this.words = new Array(this.length);
		    for (var i = 0; i < this.length; i++) {
		      this.words[i] = 0;
		    }

		    // 24-bits chunks
		    var off = 0;
		    var j = 0;

		    var w;
		    if (endian === 'be') {
		      for (i = number.length - 1; i >= start; i -= 2) {
		        w = parseHexByte(number, start, i) << off;
		        this.words[j] |= w & 0x3ffffff;
		        if (off >= 18) {
		          off -= 18;
		          j += 1;
		          this.words[j] |= w >>> 26;
		        } else {
		          off += 8;
		        }
		      }
		    } else {
		      var parseLength = number.length - start;
		      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
		        w = parseHexByte(number, start, i) << off;
		        this.words[j] |= w & 0x3ffffff;
		        if (off >= 18) {
		          off -= 18;
		          j += 1;
		          this.words[j] |= w >>> 26;
		        } else {
		          off += 8;
		        }
		      }
		    }

		    this._strip();
		  };

		  function parseBase (str, start, end, mul) {
		    var r = 0;
		    var b = 0;
		    var len = Math.min(str.length, end);
		    for (var i = start; i < len; i++) {
		      var c = str.charCodeAt(i) - 48;

		      r *= mul;

		      // 'a'
		      if (c >= 49) {
		        b = c - 49 + 0xa;

		      // 'A'
		      } else if (c >= 17) {
		        b = c - 17 + 0xa;

		      // '0' - '9'
		      } else {
		        b = c;
		      }
		      assert(c >= 0 && b < mul, 'Invalid character');
		      r += b;
		    }
		    return r;
		  }

		  BN.prototype._parseBase = function _parseBase (number, base, start) {
		    // Initialize as zero
		    this.words = [0];
		    this.length = 1;

		    // Find length of limb in base
		    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
		      limbLen++;
		    }
		    limbLen--;
		    limbPow = (limbPow / base) | 0;

		    var total = number.length - start;
		    var mod = total % limbLen;
		    var end = Math.min(total, total - mod) + start;

		    var word = 0;
		    for (var i = start; i < end; i += limbLen) {
		      word = parseBase(number, i, i + limbLen, base);

		      this.imuln(limbPow);
		      if (this.words[0] + word < 0x4000000) {
		        this.words[0] += word;
		      } else {
		        this._iaddn(word);
		      }
		    }

		    if (mod !== 0) {
		      var pow = 1;
		      word = parseBase(number, i, number.length, base);

		      for (i = 0; i < mod; i++) {
		        pow *= base;
		      }

		      this.imuln(pow);
		      if (this.words[0] + word < 0x4000000) {
		        this.words[0] += word;
		      } else {
		        this._iaddn(word);
		      }
		    }

		    this._strip();
		  };

		  BN.prototype.copy = function copy (dest) {
		    dest.words = new Array(this.length);
		    for (var i = 0; i < this.length; i++) {
		      dest.words[i] = this.words[i];
		    }
		    dest.length = this.length;
		    dest.negative = this.negative;
		    dest.red = this.red;
		  };

		  function move (dest, src) {
		    dest.words = src.words;
		    dest.length = src.length;
		    dest.negative = src.negative;
		    dest.red = src.red;
		  }

		  BN.prototype._move = function _move (dest) {
		    move(dest, this);
		  };

		  BN.prototype.clone = function clone () {
		    var r = new BN(null);
		    this.copy(r);
		    return r;
		  };

		  BN.prototype._expand = function _expand (size) {
		    while (this.length < size) {
		      this.words[this.length++] = 0;
		    }
		    return this;
		  };

		  // Remove leading `0` from `this`
		  BN.prototype._strip = function strip () {
		    while (this.length > 1 && this.words[this.length - 1] === 0) {
		      this.length--;
		    }
		    return this._normSign();
		  };

		  BN.prototype._normSign = function _normSign () {
		    // -0 = 0
		    if (this.length === 1 && this.words[0] === 0) {
		      this.negative = 0;
		    }
		    return this;
		  };

		  // Check Symbol.for because not everywhere where Symbol defined
		  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
		  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
		    try {
		      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
		    } catch (e) {
		      BN.prototype.inspect = inspect;
		    }
		  } else {
		    BN.prototype.inspect = inspect;
		  }

		  function inspect () {
		    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
		  }

		  /*

		  var zeros = [];
		  var groupSizes = [];
		  var groupBases = [];

		  var s = '';
		  var i = -1;
		  while (++i < BN.wordSize) {
		    zeros[i] = s;
		    s += '0';
		  }
		  groupSizes[0] = 0;
		  groupSizes[1] = 0;
		  groupBases[0] = 0;
		  groupBases[1] = 0;
		  var base = 2 - 1;
		  while (++base < 36 + 1) {
		    var groupSize = 0;
		    var groupBase = 1;
		    while (groupBase < (1 << BN.wordSize) / base) {
		      groupBase *= base;
		      groupSize += 1;
		    }
		    groupSizes[base] = groupSize;
		    groupBases[base] = groupBase;
		  }

		  */

		  var zeros = [
		    '',
		    '0',
		    '00',
		    '000',
		    '0000',
		    '00000',
		    '000000',
		    '0000000',
		    '00000000',
		    '000000000',
		    '0000000000',
		    '00000000000',
		    '000000000000',
		    '0000000000000',
		    '00000000000000',
		    '000000000000000',
		    '0000000000000000',
		    '00000000000000000',
		    '000000000000000000',
		    '0000000000000000000',
		    '00000000000000000000',
		    '000000000000000000000',
		    '0000000000000000000000',
		    '00000000000000000000000',
		    '000000000000000000000000',
		    '0000000000000000000000000'
		  ];

		  var groupSizes = [
		    0, 0,
		    25, 16, 12, 11, 10, 9, 8,
		    8, 7, 7, 7, 7, 6, 6,
		    6, 6, 6, 6, 6, 5, 5,
		    5, 5, 5, 5, 5, 5, 5,
		    5, 5, 5, 5, 5, 5, 5
		  ];

		  var groupBases = [
		    0, 0,
		    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
		    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
		    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
		    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
		    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
		  ];

		  BN.prototype.toString = function toString (base, padding) {
		    base = base || 10;
		    padding = padding | 0 || 1;

		    var out;
		    if (base === 16 || base === 'hex') {
		      out = '';
		      var off = 0;
		      var carry = 0;
		      for (var i = 0; i < this.length; i++) {
		        var w = this.words[i];
		        var word = (((w << off) | carry) & 0xffffff).toString(16);
		        carry = (w >>> (24 - off)) & 0xffffff;
		        off += 2;
		        if (off >= 26) {
		          off -= 26;
		          i--;
		        }
		        if (carry !== 0 || i !== this.length - 1) {
		          out = zeros[6 - word.length] + word + out;
		        } else {
		          out = word + out;
		        }
		      }
		      if (carry !== 0) {
		        out = carry.toString(16) + out;
		      }
		      while (out.length % padding !== 0) {
		        out = '0' + out;
		      }
		      if (this.negative !== 0) {
		        out = '-' + out;
		      }
		      return out;
		    }

		    if (base === (base | 0) && base >= 2 && base <= 36) {
		      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
		      var groupSize = groupSizes[base];
		      // var groupBase = Math.pow(base, groupSize);
		      var groupBase = groupBases[base];
		      out = '';
		      var c = this.clone();
		      c.negative = 0;
		      while (!c.isZero()) {
		        var r = c.modrn(groupBase).toString(base);
		        c = c.idivn(groupBase);

		        if (!c.isZero()) {
		          out = zeros[groupSize - r.length] + r + out;
		        } else {
		          out = r + out;
		        }
		      }
		      if (this.isZero()) {
		        out = '0' + out;
		      }
		      while (out.length % padding !== 0) {
		        out = '0' + out;
		      }
		      if (this.negative !== 0) {
		        out = '-' + out;
		      }
		      return out;
		    }

		    assert(false, 'Base should be between 2 and 36');
		  };

		  BN.prototype.toNumber = function toNumber () {
		    var ret = this.words[0];
		    if (this.length === 2) {
		      ret += this.words[1] * 0x4000000;
		    } else if (this.length === 3 && this.words[2] === 0x01) {
		      // NOTE: at this stage it is known that the top bit is set
		      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
		    } else if (this.length > 2) {
		      assert(false, 'Number can only safely store up to 53 bits');
		    }
		    return (this.negative !== 0) ? -ret : ret;
		  };

		  BN.prototype.toJSON = function toJSON () {
		    return this.toString(16, 2);
		  };

		  if (Buffer) {
		    BN.prototype.toBuffer = function toBuffer (endian, length) {
		      return this.toArrayLike(Buffer, endian, length);
		    };
		  }

		  BN.prototype.toArray = function toArray (endian, length) {
		    return this.toArrayLike(Array, endian, length);
		  };

		  var allocate = function allocate (ArrayType, size) {
		    if (ArrayType.allocUnsafe) {
		      return ArrayType.allocUnsafe(size);
		    }
		    return new ArrayType(size);
		  };

		  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
		    this._strip();

		    var byteLength = this.byteLength();
		    var reqLength = length || Math.max(1, byteLength);
		    assert(byteLength <= reqLength, 'byte array longer than desired length');
		    assert(reqLength > 0, 'Requested array length <= 0');

		    var res = allocate(ArrayType, reqLength);
		    var postfix = endian === 'le' ? 'LE' : 'BE';
		    this['_toArrayLike' + postfix](res, byteLength);
		    return res;
		  };

		  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
		    var position = 0;
		    var carry = 0;

		    for (var i = 0, shift = 0; i < this.length; i++) {
		      var word = (this.words[i] << shift) | carry;

		      res[position++] = word & 0xff;
		      if (position < res.length) {
		        res[position++] = (word >> 8) & 0xff;
		      }
		      if (position < res.length) {
		        res[position++] = (word >> 16) & 0xff;
		      }

		      if (shift === 6) {
		        if (position < res.length) {
		          res[position++] = (word >> 24) & 0xff;
		        }
		        carry = 0;
		        shift = 0;
		      } else {
		        carry = word >>> 24;
		        shift += 2;
		      }
		    }

		    if (position < res.length) {
		      res[position++] = carry;

		      while (position < res.length) {
		        res[position++] = 0;
		      }
		    }
		  };

		  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
		    var position = res.length - 1;
		    var carry = 0;

		    for (var i = 0, shift = 0; i < this.length; i++) {
		      var word = (this.words[i] << shift) | carry;

		      res[position--] = word & 0xff;
		      if (position >= 0) {
		        res[position--] = (word >> 8) & 0xff;
		      }
		      if (position >= 0) {
		        res[position--] = (word >> 16) & 0xff;
		      }

		      if (shift === 6) {
		        if (position >= 0) {
		          res[position--] = (word >> 24) & 0xff;
		        }
		        carry = 0;
		        shift = 0;
		      } else {
		        carry = word >>> 24;
		        shift += 2;
		      }
		    }

		    if (position >= 0) {
		      res[position--] = carry;

		      while (position >= 0) {
		        res[position--] = 0;
		      }
		    }
		  };

		  if (Math.clz32) {
		    BN.prototype._countBits = function _countBits (w) {
		      return 32 - Math.clz32(w);
		    };
		  } else {
		    BN.prototype._countBits = function _countBits (w) {
		      var t = w;
		      var r = 0;
		      if (t >= 0x1000) {
		        r += 13;
		        t >>>= 13;
		      }
		      if (t >= 0x40) {
		        r += 7;
		        t >>>= 7;
		      }
		      if (t >= 0x8) {
		        r += 4;
		        t >>>= 4;
		      }
		      if (t >= 0x02) {
		        r += 2;
		        t >>>= 2;
		      }
		      return r + t;
		    };
		  }

		  BN.prototype._zeroBits = function _zeroBits (w) {
		    // Short-cut
		    if (w === 0) return 26;

		    var t = w;
		    var r = 0;
		    if ((t & 0x1fff) === 0) {
		      r += 13;
		      t >>>= 13;
		    }
		    if ((t & 0x7f) === 0) {
		      r += 7;
		      t >>>= 7;
		    }
		    if ((t & 0xf) === 0) {
		      r += 4;
		      t >>>= 4;
		    }
		    if ((t & 0x3) === 0) {
		      r += 2;
		      t >>>= 2;
		    }
		    if ((t & 0x1) === 0) {
		      r++;
		    }
		    return r;
		  };

		  // Return number of used bits in a BN
		  BN.prototype.bitLength = function bitLength () {
		    var w = this.words[this.length - 1];
		    var hi = this._countBits(w);
		    return (this.length - 1) * 26 + hi;
		  };

		  function toBitArray (num) {
		    var w = new Array(num.bitLength());

		    for (var bit = 0; bit < w.length; bit++) {
		      var off = (bit / 26) | 0;
		      var wbit = bit % 26;

		      w[bit] = (num.words[off] >>> wbit) & 0x01;
		    }

		    return w;
		  }

		  // Number of trailing zero bits
		  BN.prototype.zeroBits = function zeroBits () {
		    if (this.isZero()) return 0;

		    var r = 0;
		    for (var i = 0; i < this.length; i++) {
		      var b = this._zeroBits(this.words[i]);
		      r += b;
		      if (b !== 26) break;
		    }
		    return r;
		  };

		  BN.prototype.byteLength = function byteLength () {
		    return Math.ceil(this.bitLength() / 8);
		  };

		  BN.prototype.toTwos = function toTwos (width) {
		    if (this.negative !== 0) {
		      return this.abs().inotn(width).iaddn(1);
		    }
		    return this.clone();
		  };

		  BN.prototype.fromTwos = function fromTwos (width) {
		    if (this.testn(width - 1)) {
		      return this.notn(width).iaddn(1).ineg();
		    }
		    return this.clone();
		  };

		  BN.prototype.isNeg = function isNeg () {
		    return this.negative !== 0;
		  };

		  // Return negative clone of `this`
		  BN.prototype.neg = function neg () {
		    return this.clone().ineg();
		  };

		  BN.prototype.ineg = function ineg () {
		    if (!this.isZero()) {
		      this.negative ^= 1;
		    }

		    return this;
		  };

		  // Or `num` with `this` in-place
		  BN.prototype.iuor = function iuor (num) {
		    while (this.length < num.length) {
		      this.words[this.length++] = 0;
		    }

		    for (var i = 0; i < num.length; i++) {
		      this.words[i] = this.words[i] | num.words[i];
		    }

		    return this._strip();
		  };

		  BN.prototype.ior = function ior (num) {
		    assert((this.negative | num.negative) === 0);
		    return this.iuor(num);
		  };

		  // Or `num` with `this`
		  BN.prototype.or = function or (num) {
		    if (this.length > num.length) return this.clone().ior(num);
		    return num.clone().ior(this);
		  };

		  BN.prototype.uor = function uor (num) {
		    if (this.length > num.length) return this.clone().iuor(num);
		    return num.clone().iuor(this);
		  };

		  // And `num` with `this` in-place
		  BN.prototype.iuand = function iuand (num) {
		    // b = min-length(num, this)
		    var b;
		    if (this.length > num.length) {
		      b = num;
		    } else {
		      b = this;
		    }

		    for (var i = 0; i < b.length; i++) {
		      this.words[i] = this.words[i] & num.words[i];
		    }

		    this.length = b.length;

		    return this._strip();
		  };

		  BN.prototype.iand = function iand (num) {
		    assert((this.negative | num.negative) === 0);
		    return this.iuand(num);
		  };

		  // And `num` with `this`
		  BN.prototype.and = function and (num) {
		    if (this.length > num.length) return this.clone().iand(num);
		    return num.clone().iand(this);
		  };

		  BN.prototype.uand = function uand (num) {
		    if (this.length > num.length) return this.clone().iuand(num);
		    return num.clone().iuand(this);
		  };

		  // Xor `num` with `this` in-place
		  BN.prototype.iuxor = function iuxor (num) {
		    // a.length > b.length
		    var a;
		    var b;
		    if (this.length > num.length) {
		      a = this;
		      b = num;
		    } else {
		      a = num;
		      b = this;
		    }

		    for (var i = 0; i < b.length; i++) {
		      this.words[i] = a.words[i] ^ b.words[i];
		    }

		    if (this !== a) {
		      for (; i < a.length; i++) {
		        this.words[i] = a.words[i];
		      }
		    }

		    this.length = a.length;

		    return this._strip();
		  };

		  BN.prototype.ixor = function ixor (num) {
		    assert((this.negative | num.negative) === 0);
		    return this.iuxor(num);
		  };

		  // Xor `num` with `this`
		  BN.prototype.xor = function xor (num) {
		    if (this.length > num.length) return this.clone().ixor(num);
		    return num.clone().ixor(this);
		  };

		  BN.prototype.uxor = function uxor (num) {
		    if (this.length > num.length) return this.clone().iuxor(num);
		    return num.clone().iuxor(this);
		  };

		  // Not ``this`` with ``width`` bitwidth
		  BN.prototype.inotn = function inotn (width) {
		    assert(typeof width === 'number' && width >= 0);

		    var bytesNeeded = Math.ceil(width / 26) | 0;
		    var bitsLeft = width % 26;

		    // Extend the buffer with leading zeroes
		    this._expand(bytesNeeded);

		    if (bitsLeft > 0) {
		      bytesNeeded--;
		    }

		    // Handle complete words
		    for (var i = 0; i < bytesNeeded; i++) {
		      this.words[i] = ~this.words[i] & 0x3ffffff;
		    }

		    // Handle the residue
		    if (bitsLeft > 0) {
		      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
		    }

		    // And remove leading zeroes
		    return this._strip();
		  };

		  BN.prototype.notn = function notn (width) {
		    return this.clone().inotn(width);
		  };

		  // Set `bit` of `this`
		  BN.prototype.setn = function setn (bit, val) {
		    assert(typeof bit === 'number' && bit >= 0);

		    var off = (bit / 26) | 0;
		    var wbit = bit % 26;

		    this._expand(off + 1);

		    if (val) {
		      this.words[off] = this.words[off] | (1 << wbit);
		    } else {
		      this.words[off] = this.words[off] & ~(1 << wbit);
		    }

		    return this._strip();
		  };

		  // Add `num` to `this` in-place
		  BN.prototype.iadd = function iadd (num) {
		    var r;

		    // negative + positive
		    if (this.negative !== 0 && num.negative === 0) {
		      this.negative = 0;
		      r = this.isub(num);
		      this.negative ^= 1;
		      return this._normSign();

		    // positive + negative
		    } else if (this.negative === 0 && num.negative !== 0) {
		      num.negative = 0;
		      r = this.isub(num);
		      num.negative = 1;
		      return r._normSign();
		    }

		    // a.length > b.length
		    var a, b;
		    if (this.length > num.length) {
		      a = this;
		      b = num;
		    } else {
		      a = num;
		      b = this;
		    }

		    var carry = 0;
		    for (var i = 0; i < b.length; i++) {
		      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
		      this.words[i] = r & 0x3ffffff;
		      carry = r >>> 26;
		    }
		    for (; carry !== 0 && i < a.length; i++) {
		      r = (a.words[i] | 0) + carry;
		      this.words[i] = r & 0x3ffffff;
		      carry = r >>> 26;
		    }

		    this.length = a.length;
		    if (carry !== 0) {
		      this.words[this.length] = carry;
		      this.length++;
		    // Copy the rest of the words
		    } else if (a !== this) {
		      for (; i < a.length; i++) {
		        this.words[i] = a.words[i];
		      }
		    }

		    return this;
		  };

		  // Add `num` to `this`
		  BN.prototype.add = function add (num) {
		    var res;
		    if (num.negative !== 0 && this.negative === 0) {
		      num.negative = 0;
		      res = this.sub(num);
		      num.negative ^= 1;
		      return res;
		    } else if (num.negative === 0 && this.negative !== 0) {
		      this.negative = 0;
		      res = num.sub(this);
		      this.negative = 1;
		      return res;
		    }

		    if (this.length > num.length) return this.clone().iadd(num);

		    return num.clone().iadd(this);
		  };

		  // Subtract `num` from `this` in-place
		  BN.prototype.isub = function isub (num) {
		    // this - (-num) = this + num
		    if (num.negative !== 0) {
		      num.negative = 0;
		      var r = this.iadd(num);
		      num.negative = 1;
		      return r._normSign();

		    // -this - num = -(this + num)
		    } else if (this.negative !== 0) {
		      this.negative = 0;
		      this.iadd(num);
		      this.negative = 1;
		      return this._normSign();
		    }

		    // At this point both numbers are positive
		    var cmp = this.cmp(num);

		    // Optimization - zeroify
		    if (cmp === 0) {
		      this.negative = 0;
		      this.length = 1;
		      this.words[0] = 0;
		      return this;
		    }

		    // a > b
		    var a, b;
		    if (cmp > 0) {
		      a = this;
		      b = num;
		    } else {
		      a = num;
		      b = this;
		    }

		    var carry = 0;
		    for (var i = 0; i < b.length; i++) {
		      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
		      carry = r >> 26;
		      this.words[i] = r & 0x3ffffff;
		    }
		    for (; carry !== 0 && i < a.length; i++) {
		      r = (a.words[i] | 0) + carry;
		      carry = r >> 26;
		      this.words[i] = r & 0x3ffffff;
		    }

		    // Copy rest of the words
		    if (carry === 0 && i < a.length && a !== this) {
		      for (; i < a.length; i++) {
		        this.words[i] = a.words[i];
		      }
		    }

		    this.length = Math.max(this.length, i);

		    if (a !== this) {
		      this.negative = 1;
		    }

		    return this._strip();
		  };

		  // Subtract `num` from `this`
		  BN.prototype.sub = function sub (num) {
		    return this.clone().isub(num);
		  };

		  function smallMulTo (self, num, out) {
		    out.negative = num.negative ^ self.negative;
		    var len = (self.length + num.length) | 0;
		    out.length = len;
		    len = (len - 1) | 0;

		    // Peel one iteration (compiler can't do it, because of code complexity)
		    var a = self.words[0] | 0;
		    var b = num.words[0] | 0;
		    var r = a * b;

		    var lo = r & 0x3ffffff;
		    var carry = (r / 0x4000000) | 0;
		    out.words[0] = lo;

		    for (var k = 1; k < len; k++) {
		      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
		      // note that ncarry could be >= 0x3ffffff
		      var ncarry = carry >>> 26;
		      var rword = carry & 0x3ffffff;
		      var maxJ = Math.min(k, num.length - 1);
		      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
		        var i = (k - j) | 0;
		        a = self.words[i] | 0;
		        b = num.words[j] | 0;
		        r = a * b + rword;
		        ncarry += (r / 0x4000000) | 0;
		        rword = r & 0x3ffffff;
		      }
		      out.words[k] = rword | 0;
		      carry = ncarry | 0;
		    }
		    if (carry !== 0) {
		      out.words[k] = carry | 0;
		    } else {
		      out.length--;
		    }

		    return out._strip();
		  }

		  // TODO(indutny): it may be reasonable to omit it for users who don't need
		  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
		  // multiplication (like elliptic secp256k1).
		  var comb10MulTo = function comb10MulTo (self, num, out) {
		    var a = self.words;
		    var b = num.words;
		    var o = out.words;
		    var c = 0;
		    var lo;
		    var mid;
		    var hi;
		    var a0 = a[0] | 0;
		    var al0 = a0 & 0x1fff;
		    var ah0 = a0 >>> 13;
		    var a1 = a[1] | 0;
		    var al1 = a1 & 0x1fff;
		    var ah1 = a1 >>> 13;
		    var a2 = a[2] | 0;
		    var al2 = a2 & 0x1fff;
		    var ah2 = a2 >>> 13;
		    var a3 = a[3] | 0;
		    var al3 = a3 & 0x1fff;
		    var ah3 = a3 >>> 13;
		    var a4 = a[4] | 0;
		    var al4 = a4 & 0x1fff;
		    var ah4 = a4 >>> 13;
		    var a5 = a[5] | 0;
		    var al5 = a5 & 0x1fff;
		    var ah5 = a5 >>> 13;
		    var a6 = a[6] | 0;
		    var al6 = a6 & 0x1fff;
		    var ah6 = a6 >>> 13;
		    var a7 = a[7] | 0;
		    var al7 = a7 & 0x1fff;
		    var ah7 = a7 >>> 13;
		    var a8 = a[8] | 0;
		    var al8 = a8 & 0x1fff;
		    var ah8 = a8 >>> 13;
		    var a9 = a[9] | 0;
		    var al9 = a9 & 0x1fff;
		    var ah9 = a9 >>> 13;
		    var b0 = b[0] | 0;
		    var bl0 = b0 & 0x1fff;
		    var bh0 = b0 >>> 13;
		    var b1 = b[1] | 0;
		    var bl1 = b1 & 0x1fff;
		    var bh1 = b1 >>> 13;
		    var b2 = b[2] | 0;
		    var bl2 = b2 & 0x1fff;
		    var bh2 = b2 >>> 13;
		    var b3 = b[3] | 0;
		    var bl3 = b3 & 0x1fff;
		    var bh3 = b3 >>> 13;
		    var b4 = b[4] | 0;
		    var bl4 = b4 & 0x1fff;
		    var bh4 = b4 >>> 13;
		    var b5 = b[5] | 0;
		    var bl5 = b5 & 0x1fff;
		    var bh5 = b5 >>> 13;
		    var b6 = b[6] | 0;
		    var bl6 = b6 & 0x1fff;
		    var bh6 = b6 >>> 13;
		    var b7 = b[7] | 0;
		    var bl7 = b7 & 0x1fff;
		    var bh7 = b7 >>> 13;
		    var b8 = b[8] | 0;
		    var bl8 = b8 & 0x1fff;
		    var bh8 = b8 >>> 13;
		    var b9 = b[9] | 0;
		    var bl9 = b9 & 0x1fff;
		    var bh9 = b9 >>> 13;

		    out.negative = self.negative ^ num.negative;
		    out.length = 19;
		    /* k = 0 */
		    lo = Math.imul(al0, bl0);
		    mid = Math.imul(al0, bh0);
		    mid = (mid + Math.imul(ah0, bl0)) | 0;
		    hi = Math.imul(ah0, bh0);
		    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
		    w0 &= 0x3ffffff;
		    /* k = 1 */
		    lo = Math.imul(al1, bl0);
		    mid = Math.imul(al1, bh0);
		    mid = (mid + Math.imul(ah1, bl0)) | 0;
		    hi = Math.imul(ah1, bh0);
		    lo = (lo + Math.imul(al0, bl1)) | 0;
		    mid = (mid + Math.imul(al0, bh1)) | 0;
		    mid = (mid + Math.imul(ah0, bl1)) | 0;
		    hi = (hi + Math.imul(ah0, bh1)) | 0;
		    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
		    w1 &= 0x3ffffff;
		    /* k = 2 */
		    lo = Math.imul(al2, bl0);
		    mid = Math.imul(al2, bh0);
		    mid = (mid + Math.imul(ah2, bl0)) | 0;
		    hi = Math.imul(ah2, bh0);
		    lo = (lo + Math.imul(al1, bl1)) | 0;
		    mid = (mid + Math.imul(al1, bh1)) | 0;
		    mid = (mid + Math.imul(ah1, bl1)) | 0;
		    hi = (hi + Math.imul(ah1, bh1)) | 0;
		    lo = (lo + Math.imul(al0, bl2)) | 0;
		    mid = (mid + Math.imul(al0, bh2)) | 0;
		    mid = (mid + Math.imul(ah0, bl2)) | 0;
		    hi = (hi + Math.imul(ah0, bh2)) | 0;
		    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
		    w2 &= 0x3ffffff;
		    /* k = 3 */
		    lo = Math.imul(al3, bl0);
		    mid = Math.imul(al3, bh0);
		    mid = (mid + Math.imul(ah3, bl0)) | 0;
		    hi = Math.imul(ah3, bh0);
		    lo = (lo + Math.imul(al2, bl1)) | 0;
		    mid = (mid + Math.imul(al2, bh1)) | 0;
		    mid = (mid + Math.imul(ah2, bl1)) | 0;
		    hi = (hi + Math.imul(ah2, bh1)) | 0;
		    lo = (lo + Math.imul(al1, bl2)) | 0;
		    mid = (mid + Math.imul(al1, bh2)) | 0;
		    mid = (mid + Math.imul(ah1, bl2)) | 0;
		    hi = (hi + Math.imul(ah1, bh2)) | 0;
		    lo = (lo + Math.imul(al0, bl3)) | 0;
		    mid = (mid + Math.imul(al0, bh3)) | 0;
		    mid = (mid + Math.imul(ah0, bl3)) | 0;
		    hi = (hi + Math.imul(ah0, bh3)) | 0;
		    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
		    w3 &= 0x3ffffff;
		    /* k = 4 */
		    lo = Math.imul(al4, bl0);
		    mid = Math.imul(al4, bh0);
		    mid = (mid + Math.imul(ah4, bl0)) | 0;
		    hi = Math.imul(ah4, bh0);
		    lo = (lo + Math.imul(al3, bl1)) | 0;
		    mid = (mid + Math.imul(al3, bh1)) | 0;
		    mid = (mid + Math.imul(ah3, bl1)) | 0;
		    hi = (hi + Math.imul(ah3, bh1)) | 0;
		    lo = (lo + Math.imul(al2, bl2)) | 0;
		    mid = (mid + Math.imul(al2, bh2)) | 0;
		    mid = (mid + Math.imul(ah2, bl2)) | 0;
		    hi = (hi + Math.imul(ah2, bh2)) | 0;
		    lo = (lo + Math.imul(al1, bl3)) | 0;
		    mid = (mid + Math.imul(al1, bh3)) | 0;
		    mid = (mid + Math.imul(ah1, bl3)) | 0;
		    hi = (hi + Math.imul(ah1, bh3)) | 0;
		    lo = (lo + Math.imul(al0, bl4)) | 0;
		    mid = (mid + Math.imul(al0, bh4)) | 0;
		    mid = (mid + Math.imul(ah0, bl4)) | 0;
		    hi = (hi + Math.imul(ah0, bh4)) | 0;
		    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
		    w4 &= 0x3ffffff;
		    /* k = 5 */
		    lo = Math.imul(al5, bl0);
		    mid = Math.imul(al5, bh0);
		    mid = (mid + Math.imul(ah5, bl0)) | 0;
		    hi = Math.imul(ah5, bh0);
		    lo = (lo + Math.imul(al4, bl1)) | 0;
		    mid = (mid + Math.imul(al4, bh1)) | 0;
		    mid = (mid + Math.imul(ah4, bl1)) | 0;
		    hi = (hi + Math.imul(ah4, bh1)) | 0;
		    lo = (lo + Math.imul(al3, bl2)) | 0;
		    mid = (mid + Math.imul(al3, bh2)) | 0;
		    mid = (mid + Math.imul(ah3, bl2)) | 0;
		    hi = (hi + Math.imul(ah3, bh2)) | 0;
		    lo = (lo + Math.imul(al2, bl3)) | 0;
		    mid = (mid + Math.imul(al2, bh3)) | 0;
		    mid = (mid + Math.imul(ah2, bl3)) | 0;
		    hi = (hi + Math.imul(ah2, bh3)) | 0;
		    lo = (lo + Math.imul(al1, bl4)) | 0;
		    mid = (mid + Math.imul(al1, bh4)) | 0;
		    mid = (mid + Math.imul(ah1, bl4)) | 0;
		    hi = (hi + Math.imul(ah1, bh4)) | 0;
		    lo = (lo + Math.imul(al0, bl5)) | 0;
		    mid = (mid + Math.imul(al0, bh5)) | 0;
		    mid = (mid + Math.imul(ah0, bl5)) | 0;
		    hi = (hi + Math.imul(ah0, bh5)) | 0;
		    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
		    w5 &= 0x3ffffff;
		    /* k = 6 */
		    lo = Math.imul(al6, bl0);
		    mid = Math.imul(al6, bh0);
		    mid = (mid + Math.imul(ah6, bl0)) | 0;
		    hi = Math.imul(ah6, bh0);
		    lo = (lo + Math.imul(al5, bl1)) | 0;
		    mid = (mid + Math.imul(al5, bh1)) | 0;
		    mid = (mid + Math.imul(ah5, bl1)) | 0;
		    hi = (hi + Math.imul(ah5, bh1)) | 0;
		    lo = (lo + Math.imul(al4, bl2)) | 0;
		    mid = (mid + Math.imul(al4, bh2)) | 0;
		    mid = (mid + Math.imul(ah4, bl2)) | 0;
		    hi = (hi + Math.imul(ah4, bh2)) | 0;
		    lo = (lo + Math.imul(al3, bl3)) | 0;
		    mid = (mid + Math.imul(al3, bh3)) | 0;
		    mid = (mid + Math.imul(ah3, bl3)) | 0;
		    hi = (hi + Math.imul(ah3, bh3)) | 0;
		    lo = (lo + Math.imul(al2, bl4)) | 0;
		    mid = (mid + Math.imul(al2, bh4)) | 0;
		    mid = (mid + Math.imul(ah2, bl4)) | 0;
		    hi = (hi + Math.imul(ah2, bh4)) | 0;
		    lo = (lo + Math.imul(al1, bl5)) | 0;
		    mid = (mid + Math.imul(al1, bh5)) | 0;
		    mid = (mid + Math.imul(ah1, bl5)) | 0;
		    hi = (hi + Math.imul(ah1, bh5)) | 0;
		    lo = (lo + Math.imul(al0, bl6)) | 0;
		    mid = (mid + Math.imul(al0, bh6)) | 0;
		    mid = (mid + Math.imul(ah0, bl6)) | 0;
		    hi = (hi + Math.imul(ah0, bh6)) | 0;
		    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
		    w6 &= 0x3ffffff;
		    /* k = 7 */
		    lo = Math.imul(al7, bl0);
		    mid = Math.imul(al7, bh0);
		    mid = (mid + Math.imul(ah7, bl0)) | 0;
		    hi = Math.imul(ah7, bh0);
		    lo = (lo + Math.imul(al6, bl1)) | 0;
		    mid = (mid + Math.imul(al6, bh1)) | 0;
		    mid = (mid + Math.imul(ah6, bl1)) | 0;
		    hi = (hi + Math.imul(ah6, bh1)) | 0;
		    lo = (lo + Math.imul(al5, bl2)) | 0;
		    mid = (mid + Math.imul(al5, bh2)) | 0;
		    mid = (mid + Math.imul(ah5, bl2)) | 0;
		    hi = (hi + Math.imul(ah5, bh2)) | 0;
		    lo = (lo + Math.imul(al4, bl3)) | 0;
		    mid = (mid + Math.imul(al4, bh3)) | 0;
		    mid = (mid + Math.imul(ah4, bl3)) | 0;
		    hi = (hi + Math.imul(ah4, bh3)) | 0;
		    lo = (lo + Math.imul(al3, bl4)) | 0;
		    mid = (mid + Math.imul(al3, bh4)) | 0;
		    mid = (mid + Math.imul(ah3, bl4)) | 0;
		    hi = (hi + Math.imul(ah3, bh4)) | 0;
		    lo = (lo + Math.imul(al2, bl5)) | 0;
		    mid = (mid + Math.imul(al2, bh5)) | 0;
		    mid = (mid + Math.imul(ah2, bl5)) | 0;
		    hi = (hi + Math.imul(ah2, bh5)) | 0;
		    lo = (lo + Math.imul(al1, bl6)) | 0;
		    mid = (mid + Math.imul(al1, bh6)) | 0;
		    mid = (mid + Math.imul(ah1, bl6)) | 0;
		    hi = (hi + Math.imul(ah1, bh6)) | 0;
		    lo = (lo + Math.imul(al0, bl7)) | 0;
		    mid = (mid + Math.imul(al0, bh7)) | 0;
		    mid = (mid + Math.imul(ah0, bl7)) | 0;
		    hi = (hi + Math.imul(ah0, bh7)) | 0;
		    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
		    w7 &= 0x3ffffff;
		    /* k = 8 */
		    lo = Math.imul(al8, bl0);
		    mid = Math.imul(al8, bh0);
		    mid = (mid + Math.imul(ah8, bl0)) | 0;
		    hi = Math.imul(ah8, bh0);
		    lo = (lo + Math.imul(al7, bl1)) | 0;
		    mid = (mid + Math.imul(al7, bh1)) | 0;
		    mid = (mid + Math.imul(ah7, bl1)) | 0;
		    hi = (hi + Math.imul(ah7, bh1)) | 0;
		    lo = (lo + Math.imul(al6, bl2)) | 0;
		    mid = (mid + Math.imul(al6, bh2)) | 0;
		    mid = (mid + Math.imul(ah6, bl2)) | 0;
		    hi = (hi + Math.imul(ah6, bh2)) | 0;
		    lo = (lo + Math.imul(al5, bl3)) | 0;
		    mid = (mid + Math.imul(al5, bh3)) | 0;
		    mid = (mid + Math.imul(ah5, bl3)) | 0;
		    hi = (hi + Math.imul(ah5, bh3)) | 0;
		    lo = (lo + Math.imul(al4, bl4)) | 0;
		    mid = (mid + Math.imul(al4, bh4)) | 0;
		    mid = (mid + Math.imul(ah4, bl4)) | 0;
		    hi = (hi + Math.imul(ah4, bh4)) | 0;
		    lo = (lo + Math.imul(al3, bl5)) | 0;
		    mid = (mid + Math.imul(al3, bh5)) | 0;
		    mid = (mid + Math.imul(ah3, bl5)) | 0;
		    hi = (hi + Math.imul(ah3, bh5)) | 0;
		    lo = (lo + Math.imul(al2, bl6)) | 0;
		    mid = (mid + Math.imul(al2, bh6)) | 0;
		    mid = (mid + Math.imul(ah2, bl6)) | 0;
		    hi = (hi + Math.imul(ah2, bh6)) | 0;
		    lo = (lo + Math.imul(al1, bl7)) | 0;
		    mid = (mid + Math.imul(al1, bh7)) | 0;
		    mid = (mid + Math.imul(ah1, bl7)) | 0;
		    hi = (hi + Math.imul(ah1, bh7)) | 0;
		    lo = (lo + Math.imul(al0, bl8)) | 0;
		    mid = (mid + Math.imul(al0, bh8)) | 0;
		    mid = (mid + Math.imul(ah0, bl8)) | 0;
		    hi = (hi + Math.imul(ah0, bh8)) | 0;
		    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
		    w8 &= 0x3ffffff;
		    /* k = 9 */
		    lo = Math.imul(al9, bl0);
		    mid = Math.imul(al9, bh0);
		    mid = (mid + Math.imul(ah9, bl0)) | 0;
		    hi = Math.imul(ah9, bh0);
		    lo = (lo + Math.imul(al8, bl1)) | 0;
		    mid = (mid + Math.imul(al8, bh1)) | 0;
		    mid = (mid + Math.imul(ah8, bl1)) | 0;
		    hi = (hi + Math.imul(ah8, bh1)) | 0;
		    lo = (lo + Math.imul(al7, bl2)) | 0;
		    mid = (mid + Math.imul(al7, bh2)) | 0;
		    mid = (mid + Math.imul(ah7, bl2)) | 0;
		    hi = (hi + Math.imul(ah7, bh2)) | 0;
		    lo = (lo + Math.imul(al6, bl3)) | 0;
		    mid = (mid + Math.imul(al6, bh3)) | 0;
		    mid = (mid + Math.imul(ah6, bl3)) | 0;
		    hi = (hi + Math.imul(ah6, bh3)) | 0;
		    lo = (lo + Math.imul(al5, bl4)) | 0;
		    mid = (mid + Math.imul(al5, bh4)) | 0;
		    mid = (mid + Math.imul(ah5, bl4)) | 0;
		    hi = (hi + Math.imul(ah5, bh4)) | 0;
		    lo = (lo + Math.imul(al4, bl5)) | 0;
		    mid = (mid + Math.imul(al4, bh5)) | 0;
		    mid = (mid + Math.imul(ah4, bl5)) | 0;
		    hi = (hi + Math.imul(ah4, bh5)) | 0;
		    lo = (lo + Math.imul(al3, bl6)) | 0;
		    mid = (mid + Math.imul(al3, bh6)) | 0;
		    mid = (mid + Math.imul(ah3, bl6)) | 0;
		    hi = (hi + Math.imul(ah3, bh6)) | 0;
		    lo = (lo + Math.imul(al2, bl7)) | 0;
		    mid = (mid + Math.imul(al2, bh7)) | 0;
		    mid = (mid + Math.imul(ah2, bl7)) | 0;
		    hi = (hi + Math.imul(ah2, bh7)) | 0;
		    lo = (lo + Math.imul(al1, bl8)) | 0;
		    mid = (mid + Math.imul(al1, bh8)) | 0;
		    mid = (mid + Math.imul(ah1, bl8)) | 0;
		    hi = (hi + Math.imul(ah1, bh8)) | 0;
		    lo = (lo + Math.imul(al0, bl9)) | 0;
		    mid = (mid + Math.imul(al0, bh9)) | 0;
		    mid = (mid + Math.imul(ah0, bl9)) | 0;
		    hi = (hi + Math.imul(ah0, bh9)) | 0;
		    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
		    w9 &= 0x3ffffff;
		    /* k = 10 */
		    lo = Math.imul(al9, bl1);
		    mid = Math.imul(al9, bh1);
		    mid = (mid + Math.imul(ah9, bl1)) | 0;
		    hi = Math.imul(ah9, bh1);
		    lo = (lo + Math.imul(al8, bl2)) | 0;
		    mid = (mid + Math.imul(al8, bh2)) | 0;
		    mid = (mid + Math.imul(ah8, bl2)) | 0;
		    hi = (hi + Math.imul(ah8, bh2)) | 0;
		    lo = (lo + Math.imul(al7, bl3)) | 0;
		    mid = (mid + Math.imul(al7, bh3)) | 0;
		    mid = (mid + Math.imul(ah7, bl3)) | 0;
		    hi = (hi + Math.imul(ah7, bh3)) | 0;
		    lo = (lo + Math.imul(al6, bl4)) | 0;
		    mid = (mid + Math.imul(al6, bh4)) | 0;
		    mid = (mid + Math.imul(ah6, bl4)) | 0;
		    hi = (hi + Math.imul(ah6, bh4)) | 0;
		    lo = (lo + Math.imul(al5, bl5)) | 0;
		    mid = (mid + Math.imul(al5, bh5)) | 0;
		    mid = (mid + Math.imul(ah5, bl5)) | 0;
		    hi = (hi + Math.imul(ah5, bh5)) | 0;
		    lo = (lo + Math.imul(al4, bl6)) | 0;
		    mid = (mid + Math.imul(al4, bh6)) | 0;
		    mid = (mid + Math.imul(ah4, bl6)) | 0;
		    hi = (hi + Math.imul(ah4, bh6)) | 0;
		    lo = (lo + Math.imul(al3, bl7)) | 0;
		    mid = (mid + Math.imul(al3, bh7)) | 0;
		    mid = (mid + Math.imul(ah3, bl7)) | 0;
		    hi = (hi + Math.imul(ah3, bh7)) | 0;
		    lo = (lo + Math.imul(al2, bl8)) | 0;
		    mid = (mid + Math.imul(al2, bh8)) | 0;
		    mid = (mid + Math.imul(ah2, bl8)) | 0;
		    hi = (hi + Math.imul(ah2, bh8)) | 0;
		    lo = (lo + Math.imul(al1, bl9)) | 0;
		    mid = (mid + Math.imul(al1, bh9)) | 0;
		    mid = (mid + Math.imul(ah1, bl9)) | 0;
		    hi = (hi + Math.imul(ah1, bh9)) | 0;
		    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
		    w10 &= 0x3ffffff;
		    /* k = 11 */
		    lo = Math.imul(al9, bl2);
		    mid = Math.imul(al9, bh2);
		    mid = (mid + Math.imul(ah9, bl2)) | 0;
		    hi = Math.imul(ah9, bh2);
		    lo = (lo + Math.imul(al8, bl3)) | 0;
		    mid = (mid + Math.imul(al8, bh3)) | 0;
		    mid = (mid + Math.imul(ah8, bl3)) | 0;
		    hi = (hi + Math.imul(ah8, bh3)) | 0;
		    lo = (lo + Math.imul(al7, bl4)) | 0;
		    mid = (mid + Math.imul(al7, bh4)) | 0;
		    mid = (mid + Math.imul(ah7, bl4)) | 0;
		    hi = (hi + Math.imul(ah7, bh4)) | 0;
		    lo = (lo + Math.imul(al6, bl5)) | 0;
		    mid = (mid + Math.imul(al6, bh5)) | 0;
		    mid = (mid + Math.imul(ah6, bl5)) | 0;
		    hi = (hi + Math.imul(ah6, bh5)) | 0;
		    lo = (lo + Math.imul(al5, bl6)) | 0;
		    mid = (mid + Math.imul(al5, bh6)) | 0;
		    mid = (mid + Math.imul(ah5, bl6)) | 0;
		    hi = (hi + Math.imul(ah5, bh6)) | 0;
		    lo = (lo + Math.imul(al4, bl7)) | 0;
		    mid = (mid + Math.imul(al4, bh7)) | 0;
		    mid = (mid + Math.imul(ah4, bl7)) | 0;
		    hi = (hi + Math.imul(ah4, bh7)) | 0;
		    lo = (lo + Math.imul(al3, bl8)) | 0;
		    mid = (mid + Math.imul(al3, bh8)) | 0;
		    mid = (mid + Math.imul(ah3, bl8)) | 0;
		    hi = (hi + Math.imul(ah3, bh8)) | 0;
		    lo = (lo + Math.imul(al2, bl9)) | 0;
		    mid = (mid + Math.imul(al2, bh9)) | 0;
		    mid = (mid + Math.imul(ah2, bl9)) | 0;
		    hi = (hi + Math.imul(ah2, bh9)) | 0;
		    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
		    w11 &= 0x3ffffff;
		    /* k = 12 */
		    lo = Math.imul(al9, bl3);
		    mid = Math.imul(al9, bh3);
		    mid = (mid + Math.imul(ah9, bl3)) | 0;
		    hi = Math.imul(ah9, bh3);
		    lo = (lo + Math.imul(al8, bl4)) | 0;
		    mid = (mid + Math.imul(al8, bh4)) | 0;
		    mid = (mid + Math.imul(ah8, bl4)) | 0;
		    hi = (hi + Math.imul(ah8, bh4)) | 0;
		    lo = (lo + Math.imul(al7, bl5)) | 0;
		    mid = (mid + Math.imul(al7, bh5)) | 0;
		    mid = (mid + Math.imul(ah7, bl5)) | 0;
		    hi = (hi + Math.imul(ah7, bh5)) | 0;
		    lo = (lo + Math.imul(al6, bl6)) | 0;
		    mid = (mid + Math.imul(al6, bh6)) | 0;
		    mid = (mid + Math.imul(ah6, bl6)) | 0;
		    hi = (hi + Math.imul(ah6, bh6)) | 0;
		    lo = (lo + Math.imul(al5, bl7)) | 0;
		    mid = (mid + Math.imul(al5, bh7)) | 0;
		    mid = (mid + Math.imul(ah5, bl7)) | 0;
		    hi = (hi + Math.imul(ah5, bh7)) | 0;
		    lo = (lo + Math.imul(al4, bl8)) | 0;
		    mid = (mid + Math.imul(al4, bh8)) | 0;
		    mid = (mid + Math.imul(ah4, bl8)) | 0;
		    hi = (hi + Math.imul(ah4, bh8)) | 0;
		    lo = (lo + Math.imul(al3, bl9)) | 0;
		    mid = (mid + Math.imul(al3, bh9)) | 0;
		    mid = (mid + Math.imul(ah3, bl9)) | 0;
		    hi = (hi + Math.imul(ah3, bh9)) | 0;
		    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
		    w12 &= 0x3ffffff;
		    /* k = 13 */
		    lo = Math.imul(al9, bl4);
		    mid = Math.imul(al9, bh4);
		    mid = (mid + Math.imul(ah9, bl4)) | 0;
		    hi = Math.imul(ah9, bh4);
		    lo = (lo + Math.imul(al8, bl5)) | 0;
		    mid = (mid + Math.imul(al8, bh5)) | 0;
		    mid = (mid + Math.imul(ah8, bl5)) | 0;
		    hi = (hi + Math.imul(ah8, bh5)) | 0;
		    lo = (lo + Math.imul(al7, bl6)) | 0;
		    mid = (mid + Math.imul(al7, bh6)) | 0;
		    mid = (mid + Math.imul(ah7, bl6)) | 0;
		    hi = (hi + Math.imul(ah7, bh6)) | 0;
		    lo = (lo + Math.imul(al6, bl7)) | 0;
		    mid = (mid + Math.imul(al6, bh7)) | 0;
		    mid = (mid + Math.imul(ah6, bl7)) | 0;
		    hi = (hi + Math.imul(ah6, bh7)) | 0;
		    lo = (lo + Math.imul(al5, bl8)) | 0;
		    mid = (mid + Math.imul(al5, bh8)) | 0;
		    mid = (mid + Math.imul(ah5, bl8)) | 0;
		    hi = (hi + Math.imul(ah5, bh8)) | 0;
		    lo = (lo + Math.imul(al4, bl9)) | 0;
		    mid = (mid + Math.imul(al4, bh9)) | 0;
		    mid = (mid + Math.imul(ah4, bl9)) | 0;
		    hi = (hi + Math.imul(ah4, bh9)) | 0;
		    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
		    w13 &= 0x3ffffff;
		    /* k = 14 */
		    lo = Math.imul(al9, bl5);
		    mid = Math.imul(al9, bh5);
		    mid = (mid + Math.imul(ah9, bl5)) | 0;
		    hi = Math.imul(ah9, bh5);
		    lo = (lo + Math.imul(al8, bl6)) | 0;
		    mid = (mid + Math.imul(al8, bh6)) | 0;
		    mid = (mid + Math.imul(ah8, bl6)) | 0;
		    hi = (hi + Math.imul(ah8, bh6)) | 0;
		    lo = (lo + Math.imul(al7, bl7)) | 0;
		    mid = (mid + Math.imul(al7, bh7)) | 0;
		    mid = (mid + Math.imul(ah7, bl7)) | 0;
		    hi = (hi + Math.imul(ah7, bh7)) | 0;
		    lo = (lo + Math.imul(al6, bl8)) | 0;
		    mid = (mid + Math.imul(al6, bh8)) | 0;
		    mid = (mid + Math.imul(ah6, bl8)) | 0;
		    hi = (hi + Math.imul(ah6, bh8)) | 0;
		    lo = (lo + Math.imul(al5, bl9)) | 0;
		    mid = (mid + Math.imul(al5, bh9)) | 0;
		    mid = (mid + Math.imul(ah5, bl9)) | 0;
		    hi = (hi + Math.imul(ah5, bh9)) | 0;
		    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
		    w14 &= 0x3ffffff;
		    /* k = 15 */
		    lo = Math.imul(al9, bl6);
		    mid = Math.imul(al9, bh6);
		    mid = (mid + Math.imul(ah9, bl6)) | 0;
		    hi = Math.imul(ah9, bh6);
		    lo = (lo + Math.imul(al8, bl7)) | 0;
		    mid = (mid + Math.imul(al8, bh7)) | 0;
		    mid = (mid + Math.imul(ah8, bl7)) | 0;
		    hi = (hi + Math.imul(ah8, bh7)) | 0;
		    lo = (lo + Math.imul(al7, bl8)) | 0;
		    mid = (mid + Math.imul(al7, bh8)) | 0;
		    mid = (mid + Math.imul(ah7, bl8)) | 0;
		    hi = (hi + Math.imul(ah7, bh8)) | 0;
		    lo = (lo + Math.imul(al6, bl9)) | 0;
		    mid = (mid + Math.imul(al6, bh9)) | 0;
		    mid = (mid + Math.imul(ah6, bl9)) | 0;
		    hi = (hi + Math.imul(ah6, bh9)) | 0;
		    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
		    w15 &= 0x3ffffff;
		    /* k = 16 */
		    lo = Math.imul(al9, bl7);
		    mid = Math.imul(al9, bh7);
		    mid = (mid + Math.imul(ah9, bl7)) | 0;
		    hi = Math.imul(ah9, bh7);
		    lo = (lo + Math.imul(al8, bl8)) | 0;
		    mid = (mid + Math.imul(al8, bh8)) | 0;
		    mid = (mid + Math.imul(ah8, bl8)) | 0;
		    hi = (hi + Math.imul(ah8, bh8)) | 0;
		    lo = (lo + Math.imul(al7, bl9)) | 0;
		    mid = (mid + Math.imul(al7, bh9)) | 0;
		    mid = (mid + Math.imul(ah7, bl9)) | 0;
		    hi = (hi + Math.imul(ah7, bh9)) | 0;
		    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
		    w16 &= 0x3ffffff;
		    /* k = 17 */
		    lo = Math.imul(al9, bl8);
		    mid = Math.imul(al9, bh8);
		    mid = (mid + Math.imul(ah9, bl8)) | 0;
		    hi = Math.imul(ah9, bh8);
		    lo = (lo + Math.imul(al8, bl9)) | 0;
		    mid = (mid + Math.imul(al8, bh9)) | 0;
		    mid = (mid + Math.imul(ah8, bl9)) | 0;
		    hi = (hi + Math.imul(ah8, bh9)) | 0;
		    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
		    w17 &= 0x3ffffff;
		    /* k = 18 */
		    lo = Math.imul(al9, bl9);
		    mid = Math.imul(al9, bh9);
		    mid = (mid + Math.imul(ah9, bl9)) | 0;
		    hi = Math.imul(ah9, bh9);
		    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
		    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
		    w18 &= 0x3ffffff;
		    o[0] = w0;
		    o[1] = w1;
		    o[2] = w2;
		    o[3] = w3;
		    o[4] = w4;
		    o[5] = w5;
		    o[6] = w6;
		    o[7] = w7;
		    o[8] = w8;
		    o[9] = w9;
		    o[10] = w10;
		    o[11] = w11;
		    o[12] = w12;
		    o[13] = w13;
		    o[14] = w14;
		    o[15] = w15;
		    o[16] = w16;
		    o[17] = w17;
		    o[18] = w18;
		    if (c !== 0) {
		      o[19] = c;
		      out.length++;
		    }
		    return out;
		  };

		  // Polyfill comb
		  if (!Math.imul) {
		    comb10MulTo = smallMulTo;
		  }

		  function bigMulTo (self, num, out) {
		    out.negative = num.negative ^ self.negative;
		    out.length = self.length + num.length;

		    var carry = 0;
		    var hncarry = 0;
		    for (var k = 0; k < out.length - 1; k++) {
		      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
		      // note that ncarry could be >= 0x3ffffff
		      var ncarry = hncarry;
		      hncarry = 0;
		      var rword = carry & 0x3ffffff;
		      var maxJ = Math.min(k, num.length - 1);
		      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
		        var i = k - j;
		        var a = self.words[i] | 0;
		        var b = num.words[j] | 0;
		        var r = a * b;

		        var lo = r & 0x3ffffff;
		        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
		        lo = (lo + rword) | 0;
		        rword = lo & 0x3ffffff;
		        ncarry = (ncarry + (lo >>> 26)) | 0;

		        hncarry += ncarry >>> 26;
		        ncarry &= 0x3ffffff;
		      }
		      out.words[k] = rword;
		      carry = ncarry;
		      ncarry = hncarry;
		    }
		    if (carry !== 0) {
		      out.words[k] = carry;
		    } else {
		      out.length--;
		    }

		    return out._strip();
		  }

		  function jumboMulTo (self, num, out) {
		    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
		    // var fftm = new FFTM();
		    // return fftm.mulp(self, num, out);
		    return bigMulTo(self, num, out);
		  }

		  BN.prototype.mulTo = function mulTo (num, out) {
		    var res;
		    var len = this.length + num.length;
		    if (this.length === 10 && num.length === 10) {
		      res = comb10MulTo(this, num, out);
		    } else if (len < 63) {
		      res = smallMulTo(this, num, out);
		    } else if (len < 1024) {
		      res = bigMulTo(this, num, out);
		    } else {
		      res = jumboMulTo(this, num, out);
		    }

		    return res;
		  };

		  // Multiply `this` by `num`
		  BN.prototype.mul = function mul (num) {
		    var out = new BN(null);
		    out.words = new Array(this.length + num.length);
		    return this.mulTo(num, out);
		  };

		  // Multiply employing FFT
		  BN.prototype.mulf = function mulf (num) {
		    var out = new BN(null);
		    out.words = new Array(this.length + num.length);
		    return jumboMulTo(this, num, out);
		  };

		  // In-place Multiplication
		  BN.prototype.imul = function imul (num) {
		    return this.clone().mulTo(num, this);
		  };

		  BN.prototype.imuln = function imuln (num) {
		    var isNegNum = num < 0;
		    if (isNegNum) num = -num;

		    assert(typeof num === 'number');
		    assert(num < 0x4000000);

		    // Carry
		    var carry = 0;
		    for (var i = 0; i < this.length; i++) {
		      var w = (this.words[i] | 0) * num;
		      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
		      carry >>= 26;
		      carry += (w / 0x4000000) | 0;
		      // NOTE: lo is 27bit maximum
		      carry += lo >>> 26;
		      this.words[i] = lo & 0x3ffffff;
		    }

		    if (carry !== 0) {
		      this.words[i] = carry;
		      this.length++;
		    }
		    this.length = num === 0 ? 1 : this.length;

		    return isNegNum ? this.ineg() : this;
		  };

		  BN.prototype.muln = function muln (num) {
		    return this.clone().imuln(num);
		  };

		  // `this` * `this`
		  BN.prototype.sqr = function sqr () {
		    return this.mul(this);
		  };

		  // `this` * `this` in-place
		  BN.prototype.isqr = function isqr () {
		    return this.imul(this.clone());
		  };

		  // Math.pow(`this`, `num`)
		  BN.prototype.pow = function pow (num) {
		    var w = toBitArray(num);
		    if (w.length === 0) return new BN(1);

		    // Skip leading zeroes
		    var res = this;
		    for (var i = 0; i < w.length; i++, res = res.sqr()) {
		      if (w[i] !== 0) break;
		    }

		    if (++i < w.length) {
		      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
		        if (w[i] === 0) continue;

		        res = res.mul(q);
		      }
		    }

		    return res;
		  };

		  // Shift-left in-place
		  BN.prototype.iushln = function iushln (bits) {
		    assert(typeof bits === 'number' && bits >= 0);
		    var r = bits % 26;
		    var s = (bits - r) / 26;
		    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
		    var i;

		    if (r !== 0) {
		      var carry = 0;

		      for (i = 0; i < this.length; i++) {
		        var newCarry = this.words[i] & carryMask;
		        var c = ((this.words[i] | 0) - newCarry) << r;
		        this.words[i] = c | carry;
		        carry = newCarry >>> (26 - r);
		      }

		      if (carry) {
		        this.words[i] = carry;
		        this.length++;
		      }
		    }

		    if (s !== 0) {
		      for (i = this.length - 1; i >= 0; i--) {
		        this.words[i + s] = this.words[i];
		      }

		      for (i = 0; i < s; i++) {
		        this.words[i] = 0;
		      }

		      this.length += s;
		    }

		    return this._strip();
		  };

		  BN.prototype.ishln = function ishln (bits) {
		    // TODO(indutny): implement me
		    assert(this.negative === 0);
		    return this.iushln(bits);
		  };

		  // Shift-right in-place
		  // NOTE: `hint` is a lowest bit before trailing zeroes
		  // NOTE: if `extended` is present - it will be filled with destroyed bits
		  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
		    assert(typeof bits === 'number' && bits >= 0);
		    var h;
		    if (hint) {
		      h = (hint - (hint % 26)) / 26;
		    } else {
		      h = 0;
		    }

		    var r = bits % 26;
		    var s = Math.min((bits - r) / 26, this.length);
		    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
		    var maskedWords = extended;

		    h -= s;
		    h = Math.max(0, h);

		    // Extended mode, copy masked part
		    if (maskedWords) {
		      for (var i = 0; i < s; i++) {
		        maskedWords.words[i] = this.words[i];
		      }
		      maskedWords.length = s;
		    }

		    if (s === 0) ; else if (this.length > s) {
		      this.length -= s;
		      for (i = 0; i < this.length; i++) {
		        this.words[i] = this.words[i + s];
		      }
		    } else {
		      this.words[0] = 0;
		      this.length = 1;
		    }

		    var carry = 0;
		    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
		      var word = this.words[i] | 0;
		      this.words[i] = (carry << (26 - r)) | (word >>> r);
		      carry = word & mask;
		    }

		    // Push carried bits as a mask
		    if (maskedWords && carry !== 0) {
		      maskedWords.words[maskedWords.length++] = carry;
		    }

		    if (this.length === 0) {
		      this.words[0] = 0;
		      this.length = 1;
		    }

		    return this._strip();
		  };

		  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
		    // TODO(indutny): implement me
		    assert(this.negative === 0);
		    return this.iushrn(bits, hint, extended);
		  };

		  // Shift-left
		  BN.prototype.shln = function shln (bits) {
		    return this.clone().ishln(bits);
		  };

		  BN.prototype.ushln = function ushln (bits) {
		    return this.clone().iushln(bits);
		  };

		  // Shift-right
		  BN.prototype.shrn = function shrn (bits) {
		    return this.clone().ishrn(bits);
		  };

		  BN.prototype.ushrn = function ushrn (bits) {
		    return this.clone().iushrn(bits);
		  };

		  // Test if n bit is set
		  BN.prototype.testn = function testn (bit) {
		    assert(typeof bit === 'number' && bit >= 0);
		    var r = bit % 26;
		    var s = (bit - r) / 26;
		    var q = 1 << r;

		    // Fast case: bit is much higher than all existing words
		    if (this.length <= s) return false;

		    // Check bit and return
		    var w = this.words[s];

		    return !!(w & q);
		  };

		  // Return only lowers bits of number (in-place)
		  BN.prototype.imaskn = function imaskn (bits) {
		    assert(typeof bits === 'number' && bits >= 0);
		    var r = bits % 26;
		    var s = (bits - r) / 26;

		    assert(this.negative === 0, 'imaskn works only with positive numbers');

		    if (this.length <= s) {
		      return this;
		    }

		    if (r !== 0) {
		      s++;
		    }
		    this.length = Math.min(s, this.length);

		    if (r !== 0) {
		      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
		      this.words[this.length - 1] &= mask;
		    }

		    return this._strip();
		  };

		  // Return only lowers bits of number
		  BN.prototype.maskn = function maskn (bits) {
		    return this.clone().imaskn(bits);
		  };

		  // Add plain number `num` to `this`
		  BN.prototype.iaddn = function iaddn (num) {
		    assert(typeof num === 'number');
		    assert(num < 0x4000000);
		    if (num < 0) return this.isubn(-num);

		    // Possible sign change
		    if (this.negative !== 0) {
		      if (this.length === 1 && (this.words[0] | 0) <= num) {
		        this.words[0] = num - (this.words[0] | 0);
		        this.negative = 0;
		        return this;
		      }

		      this.negative = 0;
		      this.isubn(num);
		      this.negative = 1;
		      return this;
		    }

		    // Add without checks
		    return this._iaddn(num);
		  };

		  BN.prototype._iaddn = function _iaddn (num) {
		    this.words[0] += num;

		    // Carry
		    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
		      this.words[i] -= 0x4000000;
		      if (i === this.length - 1) {
		        this.words[i + 1] = 1;
		      } else {
		        this.words[i + 1]++;
		      }
		    }
		    this.length = Math.max(this.length, i + 1);

		    return this;
		  };

		  // Subtract plain number `num` from `this`
		  BN.prototype.isubn = function isubn (num) {
		    assert(typeof num === 'number');
		    assert(num < 0x4000000);
		    if (num < 0) return this.iaddn(-num);

		    if (this.negative !== 0) {
		      this.negative = 0;
		      this.iaddn(num);
		      this.negative = 1;
		      return this;
		    }

		    this.words[0] -= num;

		    if (this.length === 1 && this.words[0] < 0) {
		      this.words[0] = -this.words[0];
		      this.negative = 1;
		    } else {
		      // Carry
		      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
		        this.words[i] += 0x4000000;
		        this.words[i + 1] -= 1;
		      }
		    }

		    return this._strip();
		  };

		  BN.prototype.addn = function addn (num) {
		    return this.clone().iaddn(num);
		  };

		  BN.prototype.subn = function subn (num) {
		    return this.clone().isubn(num);
		  };

		  BN.prototype.iabs = function iabs () {
		    this.negative = 0;

		    return this;
		  };

		  BN.prototype.abs = function abs () {
		    return this.clone().iabs();
		  };

		  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
		    var len = num.length + shift;
		    var i;

		    this._expand(len);

		    var w;
		    var carry = 0;
		    for (i = 0; i < num.length; i++) {
		      w = (this.words[i + shift] | 0) + carry;
		      var right = (num.words[i] | 0) * mul;
		      w -= right & 0x3ffffff;
		      carry = (w >> 26) - ((right / 0x4000000) | 0);
		      this.words[i + shift] = w & 0x3ffffff;
		    }
		    for (; i < this.length - shift; i++) {
		      w = (this.words[i + shift] | 0) + carry;
		      carry = w >> 26;
		      this.words[i + shift] = w & 0x3ffffff;
		    }

		    if (carry === 0) return this._strip();

		    // Subtraction overflow
		    assert(carry === -1);
		    carry = 0;
		    for (i = 0; i < this.length; i++) {
		      w = -(this.words[i] | 0) + carry;
		      carry = w >> 26;
		      this.words[i] = w & 0x3ffffff;
		    }
		    this.negative = 1;

		    return this._strip();
		  };

		  BN.prototype._wordDiv = function _wordDiv (num, mode) {
		    var shift = this.length - num.length;

		    var a = this.clone();
		    var b = num;

		    // Normalize
		    var bhi = b.words[b.length - 1] | 0;
		    var bhiBits = this._countBits(bhi);
		    shift = 26 - bhiBits;
		    if (shift !== 0) {
		      b = b.ushln(shift);
		      a.iushln(shift);
		      bhi = b.words[b.length - 1] | 0;
		    }

		    // Initialize quotient
		    var m = a.length - b.length;
		    var q;

		    if (mode !== 'mod') {
		      q = new BN(null);
		      q.length = m + 1;
		      q.words = new Array(q.length);
		      for (var i = 0; i < q.length; i++) {
		        q.words[i] = 0;
		      }
		    }

		    var diff = a.clone()._ishlnsubmul(b, 1, m);
		    if (diff.negative === 0) {
		      a = diff;
		      if (q) {
		        q.words[m] = 1;
		      }
		    }

		    for (var j = m - 1; j >= 0; j--) {
		      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
		        (a.words[b.length + j - 1] | 0);

		      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
		      // (0x7ffffff)
		      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

		      a._ishlnsubmul(b, qj, j);
		      while (a.negative !== 0) {
		        qj--;
		        a.negative = 0;
		        a._ishlnsubmul(b, 1, j);
		        if (!a.isZero()) {
		          a.negative ^= 1;
		        }
		      }
		      if (q) {
		        q.words[j] = qj;
		      }
		    }
		    if (q) {
		      q._strip();
		    }
		    a._strip();

		    // Denormalize
		    if (mode !== 'div' && shift !== 0) {
		      a.iushrn(shift);
		    }

		    return {
		      div: q || null,
		      mod: a
		    };
		  };

		  // NOTE: 1) `mode` can be set to `mod` to request mod only,
		  //       to `div` to request div only, or be absent to
		  //       request both div & mod
		  //       2) `positive` is true if unsigned mod is requested
		  BN.prototype.divmod = function divmod (num, mode, positive) {
		    assert(!num.isZero());

		    if (this.isZero()) {
		      return {
		        div: new BN(0),
		        mod: new BN(0)
		      };
		    }

		    var div, mod, res;
		    if (this.negative !== 0 && num.negative === 0) {
		      res = this.neg().divmod(num, mode);

		      if (mode !== 'mod') {
		        div = res.div.neg();
		      }

		      if (mode !== 'div') {
		        mod = res.mod.neg();
		        if (positive && mod.negative !== 0) {
		          mod.iadd(num);
		        }
		      }

		      return {
		        div: div,
		        mod: mod
		      };
		    }

		    if (this.negative === 0 && num.negative !== 0) {
		      res = this.divmod(num.neg(), mode);

		      if (mode !== 'mod') {
		        div = res.div.neg();
		      }

		      return {
		        div: div,
		        mod: res.mod
		      };
		    }

		    if ((this.negative & num.negative) !== 0) {
		      res = this.neg().divmod(num.neg(), mode);

		      if (mode !== 'div') {
		        mod = res.mod.neg();
		        if (positive && mod.negative !== 0) {
		          mod.isub(num);
		        }
		      }

		      return {
		        div: res.div,
		        mod: mod
		      };
		    }

		    // Both numbers are positive at this point

		    // Strip both numbers to approximate shift value
		    if (num.length > this.length || this.cmp(num) < 0) {
		      return {
		        div: new BN(0),
		        mod: this
		      };
		    }

		    // Very short reduction
		    if (num.length === 1) {
		      if (mode === 'div') {
		        return {
		          div: this.divn(num.words[0]),
		          mod: null
		        };
		      }

		      if (mode === 'mod') {
		        return {
		          div: null,
		          mod: new BN(this.modrn(num.words[0]))
		        };
		      }

		      return {
		        div: this.divn(num.words[0]),
		        mod: new BN(this.modrn(num.words[0]))
		      };
		    }

		    return this._wordDiv(num, mode);
		  };

		  // Find `this` / `num`
		  BN.prototype.div = function div (num) {
		    return this.divmod(num, 'div', false).div;
		  };

		  // Find `this` % `num`
		  BN.prototype.mod = function mod (num) {
		    return this.divmod(num, 'mod', false).mod;
		  };

		  BN.prototype.umod = function umod (num) {
		    return this.divmod(num, 'mod', true).mod;
		  };

		  // Find Round(`this` / `num`)
		  BN.prototype.divRound = function divRound (num) {
		    var dm = this.divmod(num);

		    // Fast case - exact division
		    if (dm.mod.isZero()) return dm.div;

		    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

		    var half = num.ushrn(1);
		    var r2 = num.andln(1);
		    var cmp = mod.cmp(half);

		    // Round down
		    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

		    // Round up
		    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
		  };

		  BN.prototype.modrn = function modrn (num) {
		    var isNegNum = num < 0;
		    if (isNegNum) num = -num;

		    assert(num <= 0x3ffffff);
		    var p = (1 << 26) % num;

		    var acc = 0;
		    for (var i = this.length - 1; i >= 0; i--) {
		      acc = (p * acc + (this.words[i] | 0)) % num;
		    }

		    return isNegNum ? -acc : acc;
		  };

		  // WARNING: DEPRECATED
		  BN.prototype.modn = function modn (num) {
		    return this.modrn(num);
		  };

		  // In-place division by number
		  BN.prototype.idivn = function idivn (num) {
		    var isNegNum = num < 0;
		    if (isNegNum) num = -num;

		    assert(num <= 0x3ffffff);

		    var carry = 0;
		    for (var i = this.length - 1; i >= 0; i--) {
		      var w = (this.words[i] | 0) + carry * 0x4000000;
		      this.words[i] = (w / num) | 0;
		      carry = w % num;
		    }

		    this._strip();
		    return isNegNum ? this.ineg() : this;
		  };

		  BN.prototype.divn = function divn (num) {
		    return this.clone().idivn(num);
		  };

		  BN.prototype.egcd = function egcd (p) {
		    assert(p.negative === 0);
		    assert(!p.isZero());

		    var x = this;
		    var y = p.clone();

		    if (x.negative !== 0) {
		      x = x.umod(p);
		    } else {
		      x = x.clone();
		    }

		    // A * x + B * y = x
		    var A = new BN(1);
		    var B = new BN(0);

		    // C * x + D * y = y
		    var C = new BN(0);
		    var D = new BN(1);

		    var g = 0;

		    while (x.isEven() && y.isEven()) {
		      x.iushrn(1);
		      y.iushrn(1);
		      ++g;
		    }

		    var yp = y.clone();
		    var xp = x.clone();

		    while (!x.isZero()) {
		      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
		      if (i > 0) {
		        x.iushrn(i);
		        while (i-- > 0) {
		          if (A.isOdd() || B.isOdd()) {
		            A.iadd(yp);
		            B.isub(xp);
		          }

		          A.iushrn(1);
		          B.iushrn(1);
		        }
		      }

		      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
		      if (j > 0) {
		        y.iushrn(j);
		        while (j-- > 0) {
		          if (C.isOdd() || D.isOdd()) {
		            C.iadd(yp);
		            D.isub(xp);
		          }

		          C.iushrn(1);
		          D.iushrn(1);
		        }
		      }

		      if (x.cmp(y) >= 0) {
		        x.isub(y);
		        A.isub(C);
		        B.isub(D);
		      } else {
		        y.isub(x);
		        C.isub(A);
		        D.isub(B);
		      }
		    }

		    return {
		      a: C,
		      b: D,
		      gcd: y.iushln(g)
		    };
		  };

		  // This is reduced incarnation of the binary EEA
		  // above, designated to invert members of the
		  // _prime_ fields F(p) at a maximal speed
		  BN.prototype._invmp = function _invmp (p) {
		    assert(p.negative === 0);
		    assert(!p.isZero());

		    var a = this;
		    var b = p.clone();

		    if (a.negative !== 0) {
		      a = a.umod(p);
		    } else {
		      a = a.clone();
		    }

		    var x1 = new BN(1);
		    var x2 = new BN(0);

		    var delta = b.clone();

		    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
		      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
		      if (i > 0) {
		        a.iushrn(i);
		        while (i-- > 0) {
		          if (x1.isOdd()) {
		            x1.iadd(delta);
		          }

		          x1.iushrn(1);
		        }
		      }

		      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
		      if (j > 0) {
		        b.iushrn(j);
		        while (j-- > 0) {
		          if (x2.isOdd()) {
		            x2.iadd(delta);
		          }

		          x2.iushrn(1);
		        }
		      }

		      if (a.cmp(b) >= 0) {
		        a.isub(b);
		        x1.isub(x2);
		      } else {
		        b.isub(a);
		        x2.isub(x1);
		      }
		    }

		    var res;
		    if (a.cmpn(1) === 0) {
		      res = x1;
		    } else {
		      res = x2;
		    }

		    if (res.cmpn(0) < 0) {
		      res.iadd(p);
		    }

		    return res;
		  };

		  BN.prototype.gcd = function gcd (num) {
		    if (this.isZero()) return num.abs();
		    if (num.isZero()) return this.abs();

		    var a = this.clone();
		    var b = num.clone();
		    a.negative = 0;
		    b.negative = 0;

		    // Remove common factor of two
		    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
		      a.iushrn(1);
		      b.iushrn(1);
		    }

		    do {
		      while (a.isEven()) {
		        a.iushrn(1);
		      }
		      while (b.isEven()) {
		        b.iushrn(1);
		      }

		      var r = a.cmp(b);
		      if (r < 0) {
		        // Swap `a` and `b` to make `a` always bigger than `b`
		        var t = a;
		        a = b;
		        b = t;
		      } else if (r === 0 || b.cmpn(1) === 0) {
		        break;
		      }

		      a.isub(b);
		    } while (true);

		    return b.iushln(shift);
		  };

		  // Invert number in the field F(num)
		  BN.prototype.invm = function invm (num) {
		    return this.egcd(num).a.umod(num);
		  };

		  BN.prototype.isEven = function isEven () {
		    return (this.words[0] & 1) === 0;
		  };

		  BN.prototype.isOdd = function isOdd () {
		    return (this.words[0] & 1) === 1;
		  };

		  // And first word and num
		  BN.prototype.andln = function andln (num) {
		    return this.words[0] & num;
		  };

		  // Increment at the bit position in-line
		  BN.prototype.bincn = function bincn (bit) {
		    assert(typeof bit === 'number');
		    var r = bit % 26;
		    var s = (bit - r) / 26;
		    var q = 1 << r;

		    // Fast case: bit is much higher than all existing words
		    if (this.length <= s) {
		      this._expand(s + 1);
		      this.words[s] |= q;
		      return this;
		    }

		    // Add bit and propagate, if needed
		    var carry = q;
		    for (var i = s; carry !== 0 && i < this.length; i++) {
		      var w = this.words[i] | 0;
		      w += carry;
		      carry = w >>> 26;
		      w &= 0x3ffffff;
		      this.words[i] = w;
		    }
		    if (carry !== 0) {
		      this.words[i] = carry;
		      this.length++;
		    }
		    return this;
		  };

		  BN.prototype.isZero = function isZero () {
		    return this.length === 1 && this.words[0] === 0;
		  };

		  BN.prototype.cmpn = function cmpn (num) {
		    var negative = num < 0;

		    if (this.negative !== 0 && !negative) return -1;
		    if (this.negative === 0 && negative) return 1;

		    this._strip();

		    var res;
		    if (this.length > 1) {
		      res = 1;
		    } else {
		      if (negative) {
		        num = -num;
		      }

		      assert(num <= 0x3ffffff, 'Number is too big');

		      var w = this.words[0] | 0;
		      res = w === num ? 0 : w < num ? -1 : 1;
		    }
		    if (this.negative !== 0) return -res | 0;
		    return res;
		  };

		  // Compare two numbers and return:
		  // 1 - if `this` > `num`
		  // 0 - if `this` == `num`
		  // -1 - if `this` < `num`
		  BN.prototype.cmp = function cmp (num) {
		    if (this.negative !== 0 && num.negative === 0) return -1;
		    if (this.negative === 0 && num.negative !== 0) return 1;

		    var res = this.ucmp(num);
		    if (this.negative !== 0) return -res | 0;
		    return res;
		  };

		  // Unsigned comparison
		  BN.prototype.ucmp = function ucmp (num) {
		    // At this point both numbers have the same sign
		    if (this.length > num.length) return 1;
		    if (this.length < num.length) return -1;

		    var res = 0;
		    for (var i = this.length - 1; i >= 0; i--) {
		      var a = this.words[i] | 0;
		      var b = num.words[i] | 0;

		      if (a === b) continue;
		      if (a < b) {
		        res = -1;
		      } else if (a > b) {
		        res = 1;
		      }
		      break;
		    }
		    return res;
		  };

		  BN.prototype.gtn = function gtn (num) {
		    return this.cmpn(num) === 1;
		  };

		  BN.prototype.gt = function gt (num) {
		    return this.cmp(num) === 1;
		  };

		  BN.prototype.gten = function gten (num) {
		    return this.cmpn(num) >= 0;
		  };

		  BN.prototype.gte = function gte (num) {
		    return this.cmp(num) >= 0;
		  };

		  BN.prototype.ltn = function ltn (num) {
		    return this.cmpn(num) === -1;
		  };

		  BN.prototype.lt = function lt (num) {
		    return this.cmp(num) === -1;
		  };

		  BN.prototype.lten = function lten (num) {
		    return this.cmpn(num) <= 0;
		  };

		  BN.prototype.lte = function lte (num) {
		    return this.cmp(num) <= 0;
		  };

		  BN.prototype.eqn = function eqn (num) {
		    return this.cmpn(num) === 0;
		  };

		  BN.prototype.eq = function eq (num) {
		    return this.cmp(num) === 0;
		  };

		  //
		  // A reduce context, could be using montgomery or something better, depending
		  // on the `m` itself.
		  //
		  BN.red = function red (num) {
		    return new Red(num);
		  };

		  BN.prototype.toRed = function toRed (ctx) {
		    assert(!this.red, 'Already a number in reduction context');
		    assert(this.negative === 0, 'red works only with positives');
		    return ctx.convertTo(this)._forceRed(ctx);
		  };

		  BN.prototype.fromRed = function fromRed () {
		    assert(this.red, 'fromRed works only with numbers in reduction context');
		    return this.red.convertFrom(this);
		  };

		  BN.prototype._forceRed = function _forceRed (ctx) {
		    this.red = ctx;
		    return this;
		  };

		  BN.prototype.forceRed = function forceRed (ctx) {
		    assert(!this.red, 'Already a number in reduction context');
		    return this._forceRed(ctx);
		  };

		  BN.prototype.redAdd = function redAdd (num) {
		    assert(this.red, 'redAdd works only with red numbers');
		    return this.red.add(this, num);
		  };

		  BN.prototype.redIAdd = function redIAdd (num) {
		    assert(this.red, 'redIAdd works only with red numbers');
		    return this.red.iadd(this, num);
		  };

		  BN.prototype.redSub = function redSub (num) {
		    assert(this.red, 'redSub works only with red numbers');
		    return this.red.sub(this, num);
		  };

		  BN.prototype.redISub = function redISub (num) {
		    assert(this.red, 'redISub works only with red numbers');
		    return this.red.isub(this, num);
		  };

		  BN.prototype.redShl = function redShl (num) {
		    assert(this.red, 'redShl works only with red numbers');
		    return this.red.shl(this, num);
		  };

		  BN.prototype.redMul = function redMul (num) {
		    assert(this.red, 'redMul works only with red numbers');
		    this.red._verify2(this, num);
		    return this.red.mul(this, num);
		  };

		  BN.prototype.redIMul = function redIMul (num) {
		    assert(this.red, 'redMul works only with red numbers');
		    this.red._verify2(this, num);
		    return this.red.imul(this, num);
		  };

		  BN.prototype.redSqr = function redSqr () {
		    assert(this.red, 'redSqr works only with red numbers');
		    this.red._verify1(this);
		    return this.red.sqr(this);
		  };

		  BN.prototype.redISqr = function redISqr () {
		    assert(this.red, 'redISqr works only with red numbers');
		    this.red._verify1(this);
		    return this.red.isqr(this);
		  };

		  // Square root over p
		  BN.prototype.redSqrt = function redSqrt () {
		    assert(this.red, 'redSqrt works only with red numbers');
		    this.red._verify1(this);
		    return this.red.sqrt(this);
		  };

		  BN.prototype.redInvm = function redInvm () {
		    assert(this.red, 'redInvm works only with red numbers');
		    this.red._verify1(this);
		    return this.red.invm(this);
		  };

		  // Return negative clone of `this` % `red modulo`
		  BN.prototype.redNeg = function redNeg () {
		    assert(this.red, 'redNeg works only with red numbers');
		    this.red._verify1(this);
		    return this.red.neg(this);
		  };

		  BN.prototype.redPow = function redPow (num) {
		    assert(this.red && !num.red, 'redPow(normalNum)');
		    this.red._verify1(this);
		    return this.red.pow(this, num);
		  };

		  // Prime numbers with efficient reduction
		  var primes = {
		    k256: null,
		    p224: null,
		    p192: null,
		    p25519: null
		  };

		  // Pseudo-Mersenne prime
		  function MPrime (name, p) {
		    // P = 2 ^ N - K
		    this.name = name;
		    this.p = new BN(p, 16);
		    this.n = this.p.bitLength();
		    this.k = new BN(1).iushln(this.n).isub(this.p);

		    this.tmp = this._tmp();
		  }

		  MPrime.prototype._tmp = function _tmp () {
		    var tmp = new BN(null);
		    tmp.words = new Array(Math.ceil(this.n / 13));
		    return tmp;
		  };

		  MPrime.prototype.ireduce = function ireduce (num) {
		    // Assumes that `num` is less than `P^2`
		    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
		    var r = num;
		    var rlen;

		    do {
		      this.split(r, this.tmp);
		      r = this.imulK(r);
		      r = r.iadd(this.tmp);
		      rlen = r.bitLength();
		    } while (rlen > this.n);

		    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
		    if (cmp === 0) {
		      r.words[0] = 0;
		      r.length = 1;
		    } else if (cmp > 0) {
		      r.isub(this.p);
		    } else {
		      if (r.strip !== undefined) {
		        // r is a BN v4 instance
		        r.strip();
		      } else {
		        // r is a BN v5 instance
		        r._strip();
		      }
		    }

		    return r;
		  };

		  MPrime.prototype.split = function split (input, out) {
		    input.iushrn(this.n, 0, out);
		  };

		  MPrime.prototype.imulK = function imulK (num) {
		    return num.imul(this.k);
		  };

		  function K256 () {
		    MPrime.call(
		      this,
		      'k256',
		      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
		  }
		  inherits(K256, MPrime);

		  K256.prototype.split = function split (input, output) {
		    // 256 = 9 * 26 + 22
		    var mask = 0x3fffff;

		    var outLen = Math.min(input.length, 9);
		    for (var i = 0; i < outLen; i++) {
		      output.words[i] = input.words[i];
		    }
		    output.length = outLen;

		    if (input.length <= 9) {
		      input.words[0] = 0;
		      input.length = 1;
		      return;
		    }

		    // Shift by 9 limbs
		    var prev = input.words[9];
		    output.words[output.length++] = prev & mask;

		    for (i = 10; i < input.length; i++) {
		      var next = input.words[i] | 0;
		      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
		      prev = next;
		    }
		    prev >>>= 22;
		    input.words[i - 10] = prev;
		    if (prev === 0 && input.length > 10) {
		      input.length -= 10;
		    } else {
		      input.length -= 9;
		    }
		  };

		  K256.prototype.imulK = function imulK (num) {
		    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
		    num.words[num.length] = 0;
		    num.words[num.length + 1] = 0;
		    num.length += 2;

		    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
		    var lo = 0;
		    for (var i = 0; i < num.length; i++) {
		      var w = num.words[i] | 0;
		      lo += w * 0x3d1;
		      num.words[i] = lo & 0x3ffffff;
		      lo = w * 0x40 + ((lo / 0x4000000) | 0);
		    }

		    // Fast length reduction
		    if (num.words[num.length - 1] === 0) {
		      num.length--;
		      if (num.words[num.length - 1] === 0) {
		        num.length--;
		      }
		    }
		    return num;
		  };

		  function P224 () {
		    MPrime.call(
		      this,
		      'p224',
		      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
		  }
		  inherits(P224, MPrime);

		  function P192 () {
		    MPrime.call(
		      this,
		      'p192',
		      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
		  }
		  inherits(P192, MPrime);

		  function P25519 () {
		    // 2 ^ 255 - 19
		    MPrime.call(
		      this,
		      '25519',
		      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
		  }
		  inherits(P25519, MPrime);

		  P25519.prototype.imulK = function imulK (num) {
		    // K = 0x13
		    var carry = 0;
		    for (var i = 0; i < num.length; i++) {
		      var hi = (num.words[i] | 0) * 0x13 + carry;
		      var lo = hi & 0x3ffffff;
		      hi >>>= 26;

		      num.words[i] = lo;
		      carry = hi;
		    }
		    if (carry !== 0) {
		      num.words[num.length++] = carry;
		    }
		    return num;
		  };

		  // Exported mostly for testing purposes, use plain name instead
		  BN._prime = function prime (name) {
		    // Cached version of prime
		    if (primes[name]) return primes[name];

		    var prime;
		    if (name === 'k256') {
		      prime = new K256();
		    } else if (name === 'p224') {
		      prime = new P224();
		    } else if (name === 'p192') {
		      prime = new P192();
		    } else if (name === 'p25519') {
		      prime = new P25519();
		    } else {
		      throw new Error('Unknown prime ' + name);
		    }
		    primes[name] = prime;

		    return prime;
		  };

		  //
		  // Base reduction engine
		  //
		  function Red (m) {
		    if (typeof m === 'string') {
		      var prime = BN._prime(m);
		      this.m = prime.p;
		      this.prime = prime;
		    } else {
		      assert(m.gtn(1), 'modulus must be greater than 1');
		      this.m = m;
		      this.prime = null;
		    }
		  }

		  Red.prototype._verify1 = function _verify1 (a) {
		    assert(a.negative === 0, 'red works only with positives');
		    assert(a.red, 'red works only with red numbers');
		  };

		  Red.prototype._verify2 = function _verify2 (a, b) {
		    assert((a.negative | b.negative) === 0, 'red works only with positives');
		    assert(a.red && a.red === b.red,
		      'red works only with red numbers');
		  };

		  Red.prototype.imod = function imod (a) {
		    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

		    move(a, a.umod(this.m)._forceRed(this));
		    return a;
		  };

		  Red.prototype.neg = function neg (a) {
		    if (a.isZero()) {
		      return a.clone();
		    }

		    return this.m.sub(a)._forceRed(this);
		  };

		  Red.prototype.add = function add (a, b) {
		    this._verify2(a, b);

		    var res = a.add(b);
		    if (res.cmp(this.m) >= 0) {
		      res.isub(this.m);
		    }
		    return res._forceRed(this);
		  };

		  Red.prototype.iadd = function iadd (a, b) {
		    this._verify2(a, b);

		    var res = a.iadd(b);
		    if (res.cmp(this.m) >= 0) {
		      res.isub(this.m);
		    }
		    return res;
		  };

		  Red.prototype.sub = function sub (a, b) {
		    this._verify2(a, b);

		    var res = a.sub(b);
		    if (res.cmpn(0) < 0) {
		      res.iadd(this.m);
		    }
		    return res._forceRed(this);
		  };

		  Red.prototype.isub = function isub (a, b) {
		    this._verify2(a, b);

		    var res = a.isub(b);
		    if (res.cmpn(0) < 0) {
		      res.iadd(this.m);
		    }
		    return res;
		  };

		  Red.prototype.shl = function shl (a, num) {
		    this._verify1(a);
		    return this.imod(a.ushln(num));
		  };

		  Red.prototype.imul = function imul (a, b) {
		    this._verify2(a, b);
		    return this.imod(a.imul(b));
		  };

		  Red.prototype.mul = function mul (a, b) {
		    this._verify2(a, b);
		    return this.imod(a.mul(b));
		  };

		  Red.prototype.isqr = function isqr (a) {
		    return this.imul(a, a.clone());
		  };

		  Red.prototype.sqr = function sqr (a) {
		    return this.mul(a, a);
		  };

		  Red.prototype.sqrt = function sqrt (a) {
		    if (a.isZero()) return a.clone();

		    var mod3 = this.m.andln(3);
		    assert(mod3 % 2 === 1);

		    // Fast case
		    if (mod3 === 3) {
		      var pow = this.m.add(new BN(1)).iushrn(2);
		      return this.pow(a, pow);
		    }

		    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
		    //
		    // Find Q and S, that Q * 2 ^ S = (P - 1)
		    var q = this.m.subn(1);
		    var s = 0;
		    while (!q.isZero() && q.andln(1) === 0) {
		      s++;
		      q.iushrn(1);
		    }
		    assert(!q.isZero());

		    var one = new BN(1).toRed(this);
		    var nOne = one.redNeg();

		    // Find quadratic non-residue
		    // NOTE: Max is such because of generalized Riemann hypothesis.
		    var lpow = this.m.subn(1).iushrn(1);
		    var z = this.m.bitLength();
		    z = new BN(2 * z * z).toRed(this);

		    while (this.pow(z, lpow).cmp(nOne) !== 0) {
		      z.redIAdd(nOne);
		    }

		    var c = this.pow(z, q);
		    var r = this.pow(a, q.addn(1).iushrn(1));
		    var t = this.pow(a, q);
		    var m = s;
		    while (t.cmp(one) !== 0) {
		      var tmp = t;
		      for (var i = 0; tmp.cmp(one) !== 0; i++) {
		        tmp = tmp.redSqr();
		      }
		      assert(i < m);
		      var b = this.pow(c, new BN(1).iushln(m - i - 1));

		      r = r.redMul(b);
		      c = b.redSqr();
		      t = t.redMul(c);
		      m = i;
		    }

		    return r;
		  };

		  Red.prototype.invm = function invm (a) {
		    var inv = a._invmp(this.m);
		    if (inv.negative !== 0) {
		      inv.negative = 0;
		      return this.imod(inv).redNeg();
		    } else {
		      return this.imod(inv);
		    }
		  };

		  Red.prototype.pow = function pow (a, num) {
		    if (num.isZero()) return new BN(1).toRed(this);
		    if (num.cmpn(1) === 0) return a.clone();

		    var windowSize = 4;
		    var wnd = new Array(1 << windowSize);
		    wnd[0] = new BN(1).toRed(this);
		    wnd[1] = a;
		    for (var i = 2; i < wnd.length; i++) {
		      wnd[i] = this.mul(wnd[i - 1], a);
		    }

		    var res = wnd[0];
		    var current = 0;
		    var currentLen = 0;
		    var start = num.bitLength() % 26;
		    if (start === 0) {
		      start = 26;
		    }

		    for (i = num.length - 1; i >= 0; i--) {
		      var word = num.words[i];
		      for (var j = start - 1; j >= 0; j--) {
		        var bit = (word >> j) & 1;
		        if (res !== wnd[0]) {
		          res = this.sqr(res);
		        }

		        if (bit === 0 && current === 0) {
		          currentLen = 0;
		          continue;
		        }

		        current <<= 1;
		        current |= bit;
		        currentLen++;
		        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

		        res = this.mul(res, wnd[current]);
		        currentLen = 0;
		        current = 0;
		      }
		      start = 26;
		    }

		    return res;
		  };

		  Red.prototype.convertTo = function convertTo (num) {
		    var r = num.umod(this.m);

		    return r === num ? r.clone() : r;
		  };

		  Red.prototype.convertFrom = function convertFrom (num) {
		    var res = num.clone();
		    res.red = null;
		    return res;
		  };

		  //
		  // Montgomery method engine
		  //

		  BN.mont = function mont (num) {
		    return new Mont(num);
		  };

		  function Mont (m) {
		    Red.call(this, m);

		    this.shift = this.m.bitLength();
		    if (this.shift % 26 !== 0) {
		      this.shift += 26 - (this.shift % 26);
		    }

		    this.r = new BN(1).iushln(this.shift);
		    this.r2 = this.imod(this.r.sqr());
		    this.rinv = this.r._invmp(this.m);

		    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
		    this.minv = this.minv.umod(this.r);
		    this.minv = this.r.sub(this.minv);
		  }
		  inherits(Mont, Red);

		  Mont.prototype.convertTo = function convertTo (num) {
		    return this.imod(num.ushln(this.shift));
		  };

		  Mont.prototype.convertFrom = function convertFrom (num) {
		    var r = this.imod(num.mul(this.rinv));
		    r.red = null;
		    return r;
		  };

		  Mont.prototype.imul = function imul (a, b) {
		    if (a.isZero() || b.isZero()) {
		      a.words[0] = 0;
		      a.length = 1;
		      return a;
		    }

		    var t = a.imul(b);
		    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
		    var u = t.isub(c).iushrn(this.shift);
		    var res = u;

		    if (u.cmp(this.m) >= 0) {
		      res = u.isub(this.m);
		    } else if (u.cmpn(0) < 0) {
		      res = u.iadd(this.m);
		    }

		    return res._forceRed(this);
		  };

		  Mont.prototype.mul = function mul (a, b) {
		    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

		    var t = a.mul(b);
		    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
		    var u = t.isub(c).iushrn(this.shift);
		    var res = u;
		    if (u.cmp(this.m) >= 0) {
		      res = u.isub(this.m);
		    } else if (u.cmpn(0) < 0) {
		      res = u.iadd(this.m);
		    }

		    return res._forceRed(this);
		  };

		  Mont.prototype.invm = function invm (a) {
		    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
		    var res = this.imod(a._invmp(this.m).mul(this.r2));
		    return res._forceRed(this);
		  };
		})(module, bn); 
	} (bn$1));
	return bn$1.exports;
}

var bnExports = requireBn();
var BN = /*@__PURE__*/getDefaultExportFromCjs(bnExports);

var buffer = {};

var base64Js = {};

var hasRequiredBase64Js;

function requireBase64Js () {
	if (hasRequiredBase64Js) return base64Js;
	hasRequiredBase64Js = 1;

	base64Js.byteLength = byteLength;
	base64Js.toByteArray = toByteArray;
	base64Js.fromByteArray = fromByteArray;

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i];
	  revLookup[code.charCodeAt(i)] = i;
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function getLens (b64) {
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=');
	  if (validLen === -1) validLen = len;

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4);

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp;
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

	  var curByte = 0;

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen;

	  var i;
	  for (i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)];
	    arr[curByte++] = (tmp >> 16) & 0xFF;
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    );
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    );
	  }

	  return parts.join('')
	}
	return base64Js;
}

var ieee754 = {};

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */

var hasRequiredIeee754;

function requireIeee754 () {
	if (hasRequiredIeee754) return ieee754;
	hasRequiredIeee754 = 1;
	ieee754.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	};

	ieee754.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

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
	      m = ((value * c) - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	};
	return ieee754;
}

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

var hasRequiredBuffer;

function requireBuffer () {
	if (hasRequiredBuffer) return buffer;
	hasRequiredBuffer = 1;
	(function (exports$1) {

		const base64 = requireBase64Js();
		const ieee754 = requireIeee754();
		const customInspectSymbol =
		  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
		    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
		    : null;

		exports$1.Buffer = Buffer;
		exports$1.SlowBuffer = SlowBuffer;
		exports$1.INSPECT_MAX_BYTES = 50;

		const K_MAX_LENGTH = 0x7fffffff;
		exports$1.kMaxLength = K_MAX_LENGTH;

		/**
		 * If `Buffer.TYPED_ARRAY_SUPPORT`:
		 *   === true    Use Uint8Array implementation (fastest)
		 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
		 *               implementation (most compatible, even IE6)
		 *
		 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
		 * Opera 11.6+, iOS 4.2+.
		 *
		 * We report that the browser does not support typed arrays if the are not subclassable
		 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
		 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
		 * for __proto__ and has a buggy typed array implementation.
		 */
		Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

		if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
		    typeof console.error === 'function') {
		  console.error(
		    'This browser lacks typed array (Uint8Array) support which is required by ' +
		    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
		  );
		}

		function typedArraySupport () {
		  // Can typed array instances can be augmented?
		  try {
		    const arr = new Uint8Array(1);
		    const proto = { foo: function () { return 42 } };
		    Object.setPrototypeOf(proto, Uint8Array.prototype);
		    Object.setPrototypeOf(arr, proto);
		    return arr.foo() === 42
		  } catch (e) {
		    return false
		  }
		}

		Object.defineProperty(Buffer.prototype, 'parent', {
		  enumerable: true,
		  get: function () {
		    if (!Buffer.isBuffer(this)) return undefined
		    return this.buffer
		  }
		});

		Object.defineProperty(Buffer.prototype, 'offset', {
		  enumerable: true,
		  get: function () {
		    if (!Buffer.isBuffer(this)) return undefined
		    return this.byteOffset
		  }
		});

		function createBuffer (length) {
		  if (length > K_MAX_LENGTH) {
		    throw new RangeError('The value "' + length + '" is invalid for option "size"')
		  }
		  // Return an augmented `Uint8Array` instance
		  const buf = new Uint8Array(length);
		  Object.setPrototypeOf(buf, Buffer.prototype);
		  return buf
		}

		/**
		 * The Buffer constructor returns instances of `Uint8Array` that have their
		 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
		 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
		 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
		 * returns a single octet.
		 *
		 * The `Uint8Array` prototype remains unmodified.
		 */

		function Buffer (arg, encodingOrOffset, length) {
		  // Common case.
		  if (typeof arg === 'number') {
		    if (typeof encodingOrOffset === 'string') {
		      throw new TypeError(
		        'The "string" argument must be of type string. Received type number'
		      )
		    }
		    return allocUnsafe(arg)
		  }
		  return from(arg, encodingOrOffset, length)
		}

		Buffer.poolSize = 8192; // not used by this implementation

		function from (value, encodingOrOffset, length) {
		  if (typeof value === 'string') {
		    return fromString(value, encodingOrOffset)
		  }

		  if (ArrayBuffer.isView(value)) {
		    return fromArrayView(value)
		  }

		  if (value == null) {
		    throw new TypeError(
		      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		      'or Array-like Object. Received type ' + (typeof value)
		    )
		  }

		  if (isInstance(value, ArrayBuffer) ||
		      (value && isInstance(value.buffer, ArrayBuffer))) {
		    return fromArrayBuffer(value, encodingOrOffset, length)
		  }

		  if (typeof SharedArrayBuffer !== 'undefined' &&
		      (isInstance(value, SharedArrayBuffer) ||
		      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
		    return fromArrayBuffer(value, encodingOrOffset, length)
		  }

		  if (typeof value === 'number') {
		    throw new TypeError(
		      'The "value" argument must not be of type number. Received type number'
		    )
		  }

		  const valueOf = value.valueOf && value.valueOf();
		  if (valueOf != null && valueOf !== value) {
		    return Buffer.from(valueOf, encodingOrOffset, length)
		  }

		  const b = fromObject(value);
		  if (b) return b

		  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
		      typeof value[Symbol.toPrimitive] === 'function') {
		    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
		  }

		  throw new TypeError(
		    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		    'or Array-like Object. Received type ' + (typeof value)
		  )
		}

		/**
		 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
		 * if value is a number.
		 * Buffer.from(str[, encoding])
		 * Buffer.from(array)
		 * Buffer.from(buffer)
		 * Buffer.from(arrayBuffer[, byteOffset[, length]])
		 **/
		Buffer.from = function (value, encodingOrOffset, length) {
		  return from(value, encodingOrOffset, length)
		};

		// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
		// https://github.com/feross/buffer/pull/148
		Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
		Object.setPrototypeOf(Buffer, Uint8Array);

		function assertSize (size) {
		  if (typeof size !== 'number') {
		    throw new TypeError('"size" argument must be of type number')
		  } else if (size < 0) {
		    throw new RangeError('The value "' + size + '" is invalid for option "size"')
		  }
		}

		function alloc (size, fill, encoding) {
		  assertSize(size);
		  if (size <= 0) {
		    return createBuffer(size)
		  }
		  if (fill !== undefined) {
		    // Only pay attention to encoding if it's a string. This
		    // prevents accidentally sending in a number that would
		    // be interpreted as a start offset.
		    return typeof encoding === 'string'
		      ? createBuffer(size).fill(fill, encoding)
		      : createBuffer(size).fill(fill)
		  }
		  return createBuffer(size)
		}

		/**
		 * Creates a new filled Buffer instance.
		 * alloc(size[, fill[, encoding]])
		 **/
		Buffer.alloc = function (size, fill, encoding) {
		  return alloc(size, fill, encoding)
		};

		function allocUnsafe (size) {
		  assertSize(size);
		  return createBuffer(size < 0 ? 0 : checked(size) | 0)
		}

		/**
		 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
		 * */
		Buffer.allocUnsafe = function (size) {
		  return allocUnsafe(size)
		};
		/**
		 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
		 */
		Buffer.allocUnsafeSlow = function (size) {
		  return allocUnsafe(size)
		};

		function fromString (string, encoding) {
		  if (typeof encoding !== 'string' || encoding === '') {
		    encoding = 'utf8';
		  }

		  if (!Buffer.isEncoding(encoding)) {
		    throw new TypeError('Unknown encoding: ' + encoding)
		  }

		  const length = byteLength(string, encoding) | 0;
		  let buf = createBuffer(length);

		  const actual = buf.write(string, encoding);

		  if (actual !== length) {
		    // Writing a hex string, for example, that contains invalid characters will
		    // cause everything after the first invalid character to be ignored. (e.g.
		    // 'abxxcd' will be treated as 'ab')
		    buf = buf.slice(0, actual);
		  }

		  return buf
		}

		function fromArrayLike (array) {
		  const length = array.length < 0 ? 0 : checked(array.length) | 0;
		  const buf = createBuffer(length);
		  for (let i = 0; i < length; i += 1) {
		    buf[i] = array[i] & 255;
		  }
		  return buf
		}

		function fromArrayView (arrayView) {
		  if (isInstance(arrayView, Uint8Array)) {
		    const copy = new Uint8Array(arrayView);
		    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
		  }
		  return fromArrayLike(arrayView)
		}

		function fromArrayBuffer (array, byteOffset, length) {
		  if (byteOffset < 0 || array.byteLength < byteOffset) {
		    throw new RangeError('"offset" is outside of buffer bounds')
		  }

		  if (array.byteLength < byteOffset + (length || 0)) {
		    throw new RangeError('"length" is outside of buffer bounds')
		  }

		  let buf;
		  if (byteOffset === undefined && length === undefined) {
		    buf = new Uint8Array(array);
		  } else if (length === undefined) {
		    buf = new Uint8Array(array, byteOffset);
		  } else {
		    buf = new Uint8Array(array, byteOffset, length);
		  }

		  // Return an augmented `Uint8Array` instance
		  Object.setPrototypeOf(buf, Buffer.prototype);

		  return buf
		}

		function fromObject (obj) {
		  if (Buffer.isBuffer(obj)) {
		    const len = checked(obj.length) | 0;
		    const buf = createBuffer(len);

		    if (buf.length === 0) {
		      return buf
		    }

		    obj.copy(buf, 0, 0, len);
		    return buf
		  }

		  if (obj.length !== undefined) {
		    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
		      return createBuffer(0)
		    }
		    return fromArrayLike(obj)
		  }

		  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
		    return fromArrayLike(obj.data)
		  }
		}

		function checked (length) {
		  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
		  // length is NaN (which is otherwise coerced to zero.)
		  if (length >= K_MAX_LENGTH) {
		    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
		                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
		  }
		  return length | 0
		}

		function SlowBuffer (length) {
		  if (+length != length) { // eslint-disable-line eqeqeq
		    length = 0;
		  }
		  return Buffer.alloc(+length)
		}

		Buffer.isBuffer = function isBuffer (b) {
		  return b != null && b._isBuffer === true &&
		    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
		};

		Buffer.compare = function compare (a, b) {
		  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
		  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
		  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
		    throw new TypeError(
		      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
		    )
		  }

		  if (a === b) return 0

		  let x = a.length;
		  let y = b.length;

		  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
		    if (a[i] !== b[i]) {
		      x = a[i];
		      y = b[i];
		      break
		    }
		  }

		  if (x < y) return -1
		  if (y < x) return 1
		  return 0
		};

		Buffer.isEncoding = function isEncoding (encoding) {
		  switch (String(encoding).toLowerCase()) {
		    case 'hex':
		    case 'utf8':
		    case 'utf-8':
		    case 'ascii':
		    case 'latin1':
		    case 'binary':
		    case 'base64':
		    case 'ucs2':
		    case 'ucs-2':
		    case 'utf16le':
		    case 'utf-16le':
		      return true
		    default:
		      return false
		  }
		};

		Buffer.concat = function concat (list, length) {
		  if (!Array.isArray(list)) {
		    throw new TypeError('"list" argument must be an Array of Buffers')
		  }

		  if (list.length === 0) {
		    return Buffer.alloc(0)
		  }

		  let i;
		  if (length === undefined) {
		    length = 0;
		    for (i = 0; i < list.length; ++i) {
		      length += list[i].length;
		    }
		  }

		  const buffer = Buffer.allocUnsafe(length);
		  let pos = 0;
		  for (i = 0; i < list.length; ++i) {
		    let buf = list[i];
		    if (isInstance(buf, Uint8Array)) {
		      if (pos + buf.length > buffer.length) {
		        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
		        buf.copy(buffer, pos);
		      } else {
		        Uint8Array.prototype.set.call(
		          buffer,
		          buf,
		          pos
		        );
		      }
		    } else if (!Buffer.isBuffer(buf)) {
		      throw new TypeError('"list" argument must be an Array of Buffers')
		    } else {
		      buf.copy(buffer, pos);
		    }
		    pos += buf.length;
		  }
		  return buffer
		};

		function byteLength (string, encoding) {
		  if (Buffer.isBuffer(string)) {
		    return string.length
		  }
		  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
		    return string.byteLength
		  }
		  if (typeof string !== 'string') {
		    throw new TypeError(
		      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
		      'Received type ' + typeof string
		    )
		  }

		  const len = string.length;
		  const mustMatch = (arguments.length > 2 && arguments[2] === true);
		  if (!mustMatch && len === 0) return 0

		  // Use a for loop to avoid recursion
		  let loweredCase = false;
		  for (;;) {
		    switch (encoding) {
		      case 'ascii':
		      case 'latin1':
		      case 'binary':
		        return len
		      case 'utf8':
		      case 'utf-8':
		        return utf8ToBytes(string).length
		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return len * 2
		      case 'hex':
		        return len >>> 1
		      case 'base64':
		        return base64ToBytes(string).length
		      default:
		        if (loweredCase) {
		          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
		        }
		        encoding = ('' + encoding).toLowerCase();
		        loweredCase = true;
		    }
		  }
		}
		Buffer.byteLength = byteLength;

		function slowToString (encoding, start, end) {
		  let loweredCase = false;

		  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
		  // property of a typed array.

		  // This behaves neither like String nor Uint8Array in that we set start/end
		  // to their upper/lower bounds if the value passed is out of range.
		  // undefined is handled specially as per ECMA-262 6th Edition,
		  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
		  if (start === undefined || start < 0) {
		    start = 0;
		  }
		  // Return early if start > this.length. Done here to prevent potential uint32
		  // coercion fail below.
		  if (start > this.length) {
		    return ''
		  }

		  if (end === undefined || end > this.length) {
		    end = this.length;
		  }

		  if (end <= 0) {
		    return ''
		  }

		  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
		  end >>>= 0;
		  start >>>= 0;

		  if (end <= start) {
		    return ''
		  }

		  if (!encoding) encoding = 'utf8';

		  while (true) {
		    switch (encoding) {
		      case 'hex':
		        return hexSlice(this, start, end)

		      case 'utf8':
		      case 'utf-8':
		        return utf8Slice(this, start, end)

		      case 'ascii':
		        return asciiSlice(this, start, end)

		      case 'latin1':
		      case 'binary':
		        return latin1Slice(this, start, end)

		      case 'base64':
		        return base64Slice(this, start, end)

		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return utf16leSlice(this, start, end)

		      default:
		        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
		        encoding = (encoding + '').toLowerCase();
		        loweredCase = true;
		    }
		  }
		}

		// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
		// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
		// reliably in a browserify context because there could be multiple different
		// copies of the 'buffer' package in use. This method works even for Buffer
		// instances that were created from another copy of the `buffer` package.
		// See: https://github.com/feross/buffer/issues/154
		Buffer.prototype._isBuffer = true;

		function swap (b, n, m) {
		  const i = b[n];
		  b[n] = b[m];
		  b[m] = i;
		}

		Buffer.prototype.swap16 = function swap16 () {
		  const len = this.length;
		  if (len % 2 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 16-bits')
		  }
		  for (let i = 0; i < len; i += 2) {
		    swap(this, i, i + 1);
		  }
		  return this
		};

		Buffer.prototype.swap32 = function swap32 () {
		  const len = this.length;
		  if (len % 4 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 32-bits')
		  }
		  for (let i = 0; i < len; i += 4) {
		    swap(this, i, i + 3);
		    swap(this, i + 1, i + 2);
		  }
		  return this
		};

		Buffer.prototype.swap64 = function swap64 () {
		  const len = this.length;
		  if (len % 8 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 64-bits')
		  }
		  for (let i = 0; i < len; i += 8) {
		    swap(this, i, i + 7);
		    swap(this, i + 1, i + 6);
		    swap(this, i + 2, i + 5);
		    swap(this, i + 3, i + 4);
		  }
		  return this
		};

		Buffer.prototype.toString = function toString () {
		  const length = this.length;
		  if (length === 0) return ''
		  if (arguments.length === 0) return utf8Slice(this, 0, length)
		  return slowToString.apply(this, arguments)
		};

		Buffer.prototype.toLocaleString = Buffer.prototype.toString;

		Buffer.prototype.equals = function equals (b) {
		  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
		  if (this === b) return true
		  return Buffer.compare(this, b) === 0
		};

		Buffer.prototype.inspect = function inspect () {
		  let str = '';
		  const max = exports$1.INSPECT_MAX_BYTES;
		  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
		  if (this.length > max) str += ' ... ';
		  return '<Buffer ' + str + '>'
		};
		if (customInspectSymbol) {
		  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
		}

		Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
		  if (isInstance(target, Uint8Array)) {
		    target = Buffer.from(target, target.offset, target.byteLength);
		  }
		  if (!Buffer.isBuffer(target)) {
		    throw new TypeError(
		      'The "target" argument must be one of type Buffer or Uint8Array. ' +
		      'Received type ' + (typeof target)
		    )
		  }

		  if (start === undefined) {
		    start = 0;
		  }
		  if (end === undefined) {
		    end = target ? target.length : 0;
		  }
		  if (thisStart === undefined) {
		    thisStart = 0;
		  }
		  if (thisEnd === undefined) {
		    thisEnd = this.length;
		  }

		  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
		    throw new RangeError('out of range index')
		  }

		  if (thisStart >= thisEnd && start >= end) {
		    return 0
		  }
		  if (thisStart >= thisEnd) {
		    return -1
		  }
		  if (start >= end) {
		    return 1
		  }

		  start >>>= 0;
		  end >>>= 0;
		  thisStart >>>= 0;
		  thisEnd >>>= 0;

		  if (this === target) return 0

		  let x = thisEnd - thisStart;
		  let y = end - start;
		  const len = Math.min(x, y);

		  const thisCopy = this.slice(thisStart, thisEnd);
		  const targetCopy = target.slice(start, end);

		  for (let i = 0; i < len; ++i) {
		    if (thisCopy[i] !== targetCopy[i]) {
		      x = thisCopy[i];
		      y = targetCopy[i];
		      break
		    }
		  }

		  if (x < y) return -1
		  if (y < x) return 1
		  return 0
		};

		// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
		// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
		//
		// Arguments:
		// - buffer - a Buffer to search
		// - val - a string, Buffer, or number
		// - byteOffset - an index into `buffer`; will be clamped to an int32
		// - encoding - an optional encoding, relevant is val is a string
		// - dir - true for indexOf, false for lastIndexOf
		function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
		  // Empty buffer means no match
		  if (buffer.length === 0) return -1

		  // Normalize byteOffset
		  if (typeof byteOffset === 'string') {
		    encoding = byteOffset;
		    byteOffset = 0;
		  } else if (byteOffset > 0x7fffffff) {
		    byteOffset = 0x7fffffff;
		  } else if (byteOffset < -2147483648) {
		    byteOffset = -2147483648;
		  }
		  byteOffset = +byteOffset; // Coerce to Number.
		  if (numberIsNaN(byteOffset)) {
		    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
		    byteOffset = dir ? 0 : (buffer.length - 1);
		  }

		  // Normalize byteOffset: negative offsets start from the end of the buffer
		  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
		  if (byteOffset >= buffer.length) {
		    if (dir) return -1
		    else byteOffset = buffer.length - 1;
		  } else if (byteOffset < 0) {
		    if (dir) byteOffset = 0;
		    else return -1
		  }

		  // Normalize val
		  if (typeof val === 'string') {
		    val = Buffer.from(val, encoding);
		  }

		  // Finally, search either indexOf (if dir is true) or lastIndexOf
		  if (Buffer.isBuffer(val)) {
		    // Special case: looking for empty string/buffer always fails
		    if (val.length === 0) {
		      return -1
		    }
		    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
		  } else if (typeof val === 'number') {
		    val = val & 0xFF; // Search for a byte value [0-255]
		    if (typeof Uint8Array.prototype.indexOf === 'function') {
		      if (dir) {
		        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
		      } else {
		        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
		      }
		    }
		    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
		  }

		  throw new TypeError('val must be string, number or Buffer')
		}

		function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
		  let indexSize = 1;
		  let arrLength = arr.length;
		  let valLength = val.length;

		  if (encoding !== undefined) {
		    encoding = String(encoding).toLowerCase();
		    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
		        encoding === 'utf16le' || encoding === 'utf-16le') {
		      if (arr.length < 2 || val.length < 2) {
		        return -1
		      }
		      indexSize = 2;
		      arrLength /= 2;
		      valLength /= 2;
		      byteOffset /= 2;
		    }
		  }

		  function read (buf, i) {
		    if (indexSize === 1) {
		      return buf[i]
		    } else {
		      return buf.readUInt16BE(i * indexSize)
		    }
		  }

		  let i;
		  if (dir) {
		    let foundIndex = -1;
		    for (i = byteOffset; i < arrLength; i++) {
		      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
		        if (foundIndex === -1) foundIndex = i;
		        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
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
		          break
		        }
		      }
		      if (found) return i
		    }
		  }

		  return -1
		}

		Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
		  return this.indexOf(val, byteOffset, encoding) !== -1
		};

		Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
		  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
		};

		Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
		  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
		};

		function hexWrite (buf, string, offset, length) {
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
		    if (numberIsNaN(parsed)) return i
		    buf[offset + i] = parsed;
		  }
		  return i
		}

		function utf8Write (buf, string, offset, length) {
		  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
		}

		function asciiWrite (buf, string, offset, length) {
		  return blitBuffer(asciiToBytes(string), buf, offset, length)
		}

		function base64Write (buf, string, offset, length) {
		  return blitBuffer(base64ToBytes(string), buf, offset, length)
		}

		function ucs2Write (buf, string, offset, length) {
		  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
		}

		Buffer.prototype.write = function write (string, offset, length, encoding) {
		  // Buffer#write(string)
		  if (offset === undefined) {
		    encoding = 'utf8';
		    length = this.length;
		    offset = 0;
		  // Buffer#write(string, encoding)
		  } else if (length === undefined && typeof offset === 'string') {
		    encoding = offset;
		    length = this.length;
		    offset = 0;
		  // Buffer#write(string, offset[, length][, encoding])
		  } else if (isFinite(offset)) {
		    offset = offset >>> 0;
		    if (isFinite(length)) {
		      length = length >>> 0;
		      if (encoding === undefined) encoding = 'utf8';
		    } else {
		      encoding = length;
		      length = undefined;
		    }
		  } else {
		    throw new Error(
		      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
		    )
		  }

		  const remaining = this.length - offset;
		  if (length === undefined || length > remaining) length = remaining;

		  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
		    throw new RangeError('Attempt to write outside buffer bounds')
		  }

		  if (!encoding) encoding = 'utf8';

		  let loweredCase = false;
		  for (;;) {
		    switch (encoding) {
		      case 'hex':
		        return hexWrite(this, string, offset, length)

		      case 'utf8':
		      case 'utf-8':
		        return utf8Write(this, string, offset, length)

		      case 'ascii':
		      case 'latin1':
		      case 'binary':
		        return asciiWrite(this, string, offset, length)

		      case 'base64':
		        // Warning: maxLength not taken into account in base64Write
		        return base64Write(this, string, offset, length)

		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return ucs2Write(this, string, offset, length)

		      default:
		        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
		        encoding = ('' + encoding).toLowerCase();
		        loweredCase = true;
		    }
		  }
		};

		Buffer.prototype.toJSON = function toJSON () {
		  return {
		    type: 'Buffer',
		    data: Array.prototype.slice.call(this._arr || this, 0)
		  }
		};

		function base64Slice (buf, start, end) {
		  if (start === 0 && end === buf.length) {
		    return base64.fromByteArray(buf)
		  } else {
		    return base64.fromByteArray(buf.slice(start, end))
		  }
		}

		function utf8Slice (buf, start, end) {
		  end = Math.min(buf.length, end);
		  const res = [];

		  let i = start;
		  while (i < end) {
		    const firstByte = buf[i];
		    let codePoint = null;
		    let bytesPerSequence = (firstByte > 0xEF)
		      ? 4
		      : (firstByte > 0xDF)
		          ? 3
		          : (firstByte > 0xBF)
		              ? 2
		              : 1;

		    if (i + bytesPerSequence <= end) {
		      let secondByte, thirdByte, fourthByte, tempCodePoint;

		      switch (bytesPerSequence) {
		        case 1:
		          if (firstByte < 0x80) {
		            codePoint = firstByte;
		          }
		          break
		        case 2:
		          secondByte = buf[i + 1];
		          if ((secondByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
		            if (tempCodePoint > 0x7F) {
		              codePoint = tempCodePoint;
		            }
		          }
		          break
		        case 3:
		          secondByte = buf[i + 1];
		          thirdByte = buf[i + 2];
		          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
		            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
		              codePoint = tempCodePoint;
		            }
		          }
		          break
		        case 4:
		          secondByte = buf[i + 1];
		          thirdByte = buf[i + 2];
		          fourthByte = buf[i + 3];
		          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
		            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
		              codePoint = tempCodePoint;
		            }
		          }
		      }
		    }

		    if (codePoint === null) {
		      // we did not generate a valid codePoint so insert a
		      // replacement char (U+FFFD) and advance only 1 byte
		      codePoint = 0xFFFD;
		      bytesPerSequence = 1;
		    } else if (codePoint > 0xFFFF) {
		      // encode to utf16 (surrogate pair dance)
		      codePoint -= 0x10000;
		      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
		      codePoint = 0xDC00 | codePoint & 0x3FF;
		    }

		    res.push(codePoint);
		    i += bytesPerSequence;
		  }

		  return decodeCodePointsArray(res)
		}

		// Based on http://stackoverflow.com/a/22747272/680742, the browser with
		// the lowest limit is Chrome, with 0x10000 args.
		// We go 1 magnitude less, for safety
		const MAX_ARGUMENTS_LENGTH = 0x1000;

		function decodeCodePointsArray (codePoints) {
		  const len = codePoints.length;
		  if (len <= MAX_ARGUMENTS_LENGTH) {
		    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
		  }

		  // Decode in chunks to avoid "call stack size exceeded".
		  let res = '';
		  let i = 0;
		  while (i < len) {
		    res += String.fromCharCode.apply(
		      String,
		      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
		    );
		  }
		  return res
		}

		function asciiSlice (buf, start, end) {
		  let ret = '';
		  end = Math.min(buf.length, end);

		  for (let i = start; i < end; ++i) {
		    ret += String.fromCharCode(buf[i] & 0x7F);
		  }
		  return ret
		}

		function latin1Slice (buf, start, end) {
		  let ret = '';
		  end = Math.min(buf.length, end);

		  for (let i = start; i < end; ++i) {
		    ret += String.fromCharCode(buf[i]);
		  }
		  return ret
		}

		function hexSlice (buf, start, end) {
		  const len = buf.length;

		  if (!start || start < 0) start = 0;
		  if (!end || end < 0 || end > len) end = len;

		  let out = '';
		  for (let i = start; i < end; ++i) {
		    out += hexSliceLookupTable[buf[i]];
		  }
		  return out
		}

		function utf16leSlice (buf, start, end) {
		  const bytes = buf.slice(start, end);
		  let res = '';
		  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
		  for (let i = 0; i < bytes.length - 1; i += 2) {
		    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
		  }
		  return res
		}

		Buffer.prototype.slice = function slice (start, end) {
		  const len = this.length;
		  start = ~~start;
		  end = end === undefined ? len : ~~end;

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
		  // Return an augmented `Uint8Array` instance
		  Object.setPrototypeOf(newBuf, Buffer.prototype);

		  return newBuf
		};

		/*
		 * Need to make sure that buffer isn't trying to write out of bounds.
		 */
		function checkOffset (offset, ext, length) {
		  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
		  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
		}

		Buffer.prototype.readUintLE =
		Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let val = this[offset];
		  let mul = 1;
		  let i = 0;
		  while (++i < byteLength && (mul *= 0x100)) {
		    val += this[offset + i] * mul;
		  }

		  return val
		};

		Buffer.prototype.readUintBE =
		Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    checkOffset(offset, byteLength, this.length);
		  }

		  let val = this[offset + --byteLength];
		  let mul = 1;
		  while (byteLength > 0 && (mul *= 0x100)) {
		    val += this[offset + --byteLength] * mul;
		  }

		  return val
		};

		Buffer.prototype.readUint8 =
		Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 1, this.length);
		  return this[offset]
		};

		Buffer.prototype.readUint16LE =
		Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  return this[offset] | (this[offset + 1] << 8)
		};

		Buffer.prototype.readUint16BE =
		Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  return (this[offset] << 8) | this[offset + 1]
		};

		Buffer.prototype.readUint32LE =
		Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return ((this[offset]) |
		      (this[offset + 1] << 8) |
		      (this[offset + 2] << 16)) +
		      (this[offset + 3] * 0x1000000)
		};

		Buffer.prototype.readUint32BE =
		Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset] * 0x1000000) +
		    ((this[offset + 1] << 16) |
		    (this[offset + 2] << 8) |
		    this[offset + 3])
		};

		Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const lo = first +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 24;

		  const hi = this[++offset] +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    last * 2 ** 24;

		  return BigInt(lo) + (BigInt(hi) << BigInt(32))
		});

		Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const hi = first * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    this[++offset];

		  const lo = this[++offset] * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    last;

		  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
		});

		Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let val = this[offset];
		  let mul = 1;
		  let i = 0;
		  while (++i < byteLength && (mul *= 0x100)) {
		    val += this[offset + i] * mul;
		  }
		  mul *= 0x80;

		  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		  return val
		};

		Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let i = byteLength;
		  let mul = 1;
		  let val = this[offset + --i];
		  while (i > 0 && (mul *= 0x100)) {
		    val += this[offset + --i] * mul;
		  }
		  mul *= 0x80;

		  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		  return val
		};

		Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 1, this.length);
		  if (!(this[offset] & 0x80)) return (this[offset])
		  return ((0xff - this[offset] + 1) * -1)
		};

		Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  const val = this[offset] | (this[offset + 1] << 8);
		  return (val & 0x8000) ? val | 0xFFFF0000 : val
		};

		Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  const val = this[offset + 1] | (this[offset] << 8);
		  return (val & 0x8000) ? val | 0xFFFF0000 : val
		};

		Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset]) |
		    (this[offset + 1] << 8) |
		    (this[offset + 2] << 16) |
		    (this[offset + 3] << 24)
		};

		Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset] << 24) |
		    (this[offset + 1] << 16) |
		    (this[offset + 2] << 8) |
		    (this[offset + 3])
		};

		Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const val = this[offset + 4] +
		    this[offset + 5] * 2 ** 8 +
		    this[offset + 6] * 2 ** 16 +
		    (last << 24); // Overflow

		  return (BigInt(val) << BigInt(32)) +
		    BigInt(first +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 24)
		});

		Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const val = (first << 24) + // Overflow
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    this[++offset];

		  return (BigInt(val) << BigInt(32)) +
		    BigInt(this[++offset] * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    last)
		});

		Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);
		  return ieee754.read(this, offset, true, 23, 4)
		};

		Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);
		  return ieee754.read(this, offset, false, 23, 4)
		};

		Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 8, this.length);
		  return ieee754.read(this, offset, true, 52, 8)
		};

		Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 8, this.length);
		  return ieee754.read(this, offset, false, 52, 8)
		};

		function checkInt (buf, value, offset, ext, max, min) {
		  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
		  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
		  if (offset + ext > buf.length) throw new RangeError('Index out of range')
		}

		Buffer.prototype.writeUintLE =
		Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
		    checkInt(this, value, offset, byteLength, maxBytes, 0);
		  }

		  let mul = 1;
		  let i = 0;
		  this[offset] = value & 0xFF;
		  while (++i < byteLength && (mul *= 0x100)) {
		    this[offset + i] = (value / mul) & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeUintBE =
		Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
		    checkInt(this, value, offset, byteLength, maxBytes, 0);
		  }

		  let i = byteLength - 1;
		  let mul = 1;
		  this[offset + i] = value & 0xFF;
		  while (--i >= 0 && (mul *= 0x100)) {
		    this[offset + i] = (value / mul) & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeUint8 =
		Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
		  this[offset] = (value & 0xff);
		  return offset + 1
		};

		Buffer.prototype.writeUint16LE =
		Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  return offset + 2
		};

		Buffer.prototype.writeUint16BE =
		Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		  this[offset] = (value >>> 8);
		  this[offset + 1] = (value & 0xff);
		  return offset + 2
		};

		Buffer.prototype.writeUint32LE =
		Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		  this[offset + 3] = (value >>> 24);
		  this[offset + 2] = (value >>> 16);
		  this[offset + 1] = (value >>> 8);
		  this[offset] = (value & 0xff);
		  return offset + 4
		};

		Buffer.prototype.writeUint32BE =
		Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		  this[offset] = (value >>> 24);
		  this[offset + 1] = (value >>> 16);
		  this[offset + 2] = (value >>> 8);
		  this[offset + 3] = (value & 0xff);
		  return offset + 4
		};

		function wrtBigUInt64LE (buf, value, offset, min, max) {
		  checkIntBI(value, min, max, buf, offset, 7);

		  let lo = Number(value & BigInt(0xffffffff));
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  return offset
		}

		function wrtBigUInt64BE (buf, value, offset, min, max) {
		  checkIntBI(value, min, max, buf, offset, 7);

		  let lo = Number(value & BigInt(0xffffffff));
		  buf[offset + 7] = lo;
		  lo = lo >> 8;
		  buf[offset + 6] = lo;
		  lo = lo >> 8;
		  buf[offset + 5] = lo;
		  lo = lo >> 8;
		  buf[offset + 4] = lo;
		  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
		  buf[offset + 3] = hi;
		  hi = hi >> 8;
		  buf[offset + 2] = hi;
		  hi = hi >> 8;
		  buf[offset + 1] = hi;
		  hi = hi >> 8;
		  buf[offset] = hi;
		  return offset + 8
		}

		Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
		  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
		});

		Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
		  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
		});

		Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    const limit = Math.pow(2, (8 * byteLength) - 1);

		    checkInt(this, value, offset, byteLength, limit - 1, -limit);
		  }

		  let i = 0;
		  let mul = 1;
		  let sub = 0;
		  this[offset] = value & 0xFF;
		  while (++i < byteLength && (mul *= 0x100)) {
		    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
		      sub = 1;
		    }
		    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    const limit = Math.pow(2, (8 * byteLength) - 1);

		    checkInt(this, value, offset, byteLength, limit - 1, -limit);
		  }

		  let i = byteLength - 1;
		  let mul = 1;
		  let sub = 0;
		  this[offset + i] = value & 0xFF;
		  while (--i >= 0 && (mul *= 0x100)) {
		    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
		      sub = 1;
		    }
		    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -128);
		  if (value < 0) value = 0xff + value + 1;
		  this[offset] = (value & 0xff);
		  return offset + 1
		};

		Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  return offset + 2
		};

		Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
		  this[offset] = (value >>> 8);
		  this[offset + 1] = (value & 0xff);
		  return offset + 2
		};

		Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  this[offset + 2] = (value >>> 16);
		  this[offset + 3] = (value >>> 24);
		  return offset + 4
		};

		Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
		  if (value < 0) value = 0xffffffff + value + 1;
		  this[offset] = (value >>> 24);
		  this[offset + 1] = (value >>> 16);
		  this[offset + 2] = (value >>> 8);
		  this[offset + 3] = (value & 0xff);
		  return offset + 4
		};

		Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
		  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
		});

		Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
		  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
		});

		function checkIEEE754 (buf, value, offset, ext, max, min) {
		  if (offset + ext > buf.length) throw new RangeError('Index out of range')
		  if (offset < 0) throw new RangeError('Index out of range')
		}

		function writeFloat (buf, value, offset, littleEndian, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    checkIEEE754(buf, value, offset, 4);
		  }
		  ieee754.write(buf, value, offset, littleEndian, 23, 4);
		  return offset + 4
		}

		Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
		  return writeFloat(this, value, offset, true, noAssert)
		};

		Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
		  return writeFloat(this, value, offset, false, noAssert)
		};

		function writeDouble (buf, value, offset, littleEndian, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    checkIEEE754(buf, value, offset, 8);
		  }
		  ieee754.write(buf, value, offset, littleEndian, 52, 8);
		  return offset + 8
		}

		Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
		  return writeDouble(this, value, offset, true, noAssert)
		};

		Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
		  return writeDouble(this, value, offset, false, noAssert)
		};

		// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
		Buffer.prototype.copy = function copy (target, targetStart, start, end) {
		  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
		  if (!start) start = 0;
		  if (!end && end !== 0) end = this.length;
		  if (targetStart >= target.length) targetStart = target.length;
		  if (!targetStart) targetStart = 0;
		  if (end > 0 && end < start) end = start;

		  // Copy 0 bytes; we're done
		  if (end === start) return 0
		  if (target.length === 0 || this.length === 0) return 0

		  // Fatal error conditions
		  if (targetStart < 0) {
		    throw new RangeError('targetStart out of bounds')
		  }
		  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
		  if (end < 0) throw new RangeError('sourceEnd out of bounds')

		  // Are we oob?
		  if (end > this.length) end = this.length;
		  if (target.length - targetStart < end - start) {
		    end = target.length - targetStart + start;
		  }

		  const len = end - start;

		  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
		    // Use built-in when available, missing from IE11
		    this.copyWithin(targetStart, start, end);
		  } else {
		    Uint8Array.prototype.set.call(
		      target,
		      this.subarray(start, end),
		      targetStart
		    );
		  }

		  return len
		};

		// Usage:
		//    buffer.fill(number[, offset[, end]])
		//    buffer.fill(buffer[, offset[, end]])
		//    buffer.fill(string[, offset[, end]][, encoding])
		Buffer.prototype.fill = function fill (val, start, end, encoding) {
		  // Handle string cases:
		  if (typeof val === 'string') {
		    if (typeof start === 'string') {
		      encoding = start;
		      start = 0;
		      end = this.length;
		    } else if (typeof end === 'string') {
		      encoding = end;
		      end = this.length;
		    }
		    if (encoding !== undefined && typeof encoding !== 'string') {
		      throw new TypeError('encoding must be a string')
		    }
		    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
		      throw new TypeError('Unknown encoding: ' + encoding)
		    }
		    if (val.length === 1) {
		      const code = val.charCodeAt(0);
		      if ((encoding === 'utf8' && code < 128) ||
		          encoding === 'latin1') {
		        // Fast path: If `val` fits into a single byte, use that numeric value.
		        val = code;
		      }
		    }
		  } else if (typeof val === 'number') {
		    val = val & 255;
		  } else if (typeof val === 'boolean') {
		    val = Number(val);
		  }

		  // Invalid ranges are not set to a default, so can range check early.
		  if (start < 0 || this.length < start || this.length < end) {
		    throw new RangeError('Out of range index')
		  }

		  if (end <= start) {
		    return this
		  }

		  start = start >>> 0;
		  end = end === undefined ? this.length : end >>> 0;

		  if (!val) val = 0;

		  let i;
		  if (typeof val === 'number') {
		    for (i = start; i < end; ++i) {
		      this[i] = val;
		    }
		  } else {
		    const bytes = Buffer.isBuffer(val)
		      ? val
		      : Buffer.from(val, encoding);
		    const len = bytes.length;
		    if (len === 0) {
		      throw new TypeError('The value "' + val +
		        '" is invalid for argument "value"')
		    }
		    for (i = 0; i < end - start; ++i) {
		      this[i + start] = bytes[i % len];
		    }
		  }

		  return this
		};

		// CUSTOM ERRORS
		// =============

		// Simplified versions from Node, changed for Buffer-only usage
		const errors = {};
		function E (sym, getMessage, Base) {
		  errors[sym] = class NodeError extends Base {
		    constructor () {
		      super();

		      Object.defineProperty(this, 'message', {
		        value: getMessage.apply(this, arguments),
		        writable: true,
		        configurable: true
		      });

		      // Add the error code to the name to include it in the stack trace.
		      this.name = `${this.name} [${sym}]`;
		      // Access the stack to generate the error message including the error code
		      // from the name.
		      this.stack; // eslint-disable-line no-unused-expressions
		      // Reset the name to the actual name.
		      delete this.name;
		    }

		    get code () {
		      return sym
		    }

		    set code (value) {
		      Object.defineProperty(this, 'code', {
		        configurable: true,
		        enumerable: true,
		        value,
		        writable: true
		      });
		    }

		    toString () {
		      return `${this.name} [${sym}]: ${this.message}`
		    }
		  };
		}

		E('ERR_BUFFER_OUT_OF_BOUNDS',
		  function (name) {
		    if (name) {
		      return `${name} is outside of buffer bounds`
		    }

		    return 'Attempt to access memory outside buffer bounds'
		  }, RangeError);
		E('ERR_INVALID_ARG_TYPE',
		  function (name, actual) {
		    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
		  }, TypeError);
		E('ERR_OUT_OF_RANGE',
		  function (str, range, input) {
		    let msg = `The value of "${str}" is out of range.`;
		    let received = input;
		    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
		      received = addNumericalSeparator(String(input));
		    } else if (typeof input === 'bigint') {
		      received = String(input);
		      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
		        received = addNumericalSeparator(received);
		      }
		      received += 'n';
		    }
		    msg += ` It must be ${range}. Received ${received}`;
		    return msg
		  }, RangeError);

		function addNumericalSeparator (val) {
		  let res = '';
		  let i = val.length;
		  const start = val[0] === '-' ? 1 : 0;
		  for (; i >= start + 4; i -= 3) {
		    res = `_${val.slice(i - 3, i)}${res}`;
		  }
		  return `${val.slice(0, i)}${res}`
		}

		// CHECK FUNCTIONS
		// ===============

		function checkBounds (buf, offset, byteLength) {
		  validateNumber(offset, 'offset');
		  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
		    boundsError(offset, buf.length - (byteLength + 1));
		  }
		}

		function checkIntBI (value, min, max, buf, offset, byteLength) {
		  if (value > max || value < min) {
		    const n = typeof min === 'bigint' ? 'n' : '';
		    let range;
		    {
		      if (min === 0 || min === BigInt(0)) {
		        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
		      } else {
		        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
		                `${(byteLength + 1) * 8 - 1}${n}`;
		      }
		    }
		    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
		  }
		  checkBounds(buf, offset, byteLength);
		}

		function validateNumber (value, name) {
		  if (typeof value !== 'number') {
		    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
		  }
		}

		function boundsError (value, length, type) {
		  if (Math.floor(value) !== value) {
		    validateNumber(value, type);
		    throw new errors.ERR_OUT_OF_RANGE('offset', 'an integer', value)
		  }

		  if (length < 0) {
		    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
		  }

		  throw new errors.ERR_OUT_OF_RANGE('offset',
		                                    `>= ${0} and <= ${length}`,
		                                    value)
		}

		// HELPER FUNCTIONS
		// ================

		const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

		function base64clean (str) {
		  // Node takes equal signs as end of the Base64 encoding
		  str = str.split('=')[0];
		  // Node strips out invalid characters like \n and \t from the string, base64-js does not
		  str = str.trim().replace(INVALID_BASE64_RE, '');
		  // Node converts strings with length < 2 to ''
		  if (str.length < 2) return ''
		  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
		  while (str.length % 4 !== 0) {
		    str = str + '=';
		  }
		  return str
		}

		function utf8ToBytes (string, units) {
		  units = units || Infinity;
		  let codePoint;
		  const length = string.length;
		  let leadSurrogate = null;
		  const bytes = [];

		  for (let i = 0; i < length; ++i) {
		    codePoint = string.charCodeAt(i);

		    // is surrogate component
		    if (codePoint > 0xD7FF && codePoint < 0xE000) {
		      // last char was a lead
		      if (!leadSurrogate) {
		        // no lead yet
		        if (codePoint > 0xDBFF) {
		          // unexpected trail
		          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		          continue
		        } else if (i + 1 === length) {
		          // unpaired lead
		          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		          continue
		        }

		        // valid lead
		        leadSurrogate = codePoint;

		        continue
		      }

		      // 2 leads in a row
		      if (codePoint < 0xDC00) {
		        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		        leadSurrogate = codePoint;
		        continue
		      }

		      // valid surrogate pair
		      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
		    } else if (leadSurrogate) {
		      // valid bmp char, but last char was a lead
		      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		    }

		    leadSurrogate = null;

		    // encode utf8
		    if (codePoint < 0x80) {
		      if ((units -= 1) < 0) break
		      bytes.push(codePoint);
		    } else if (codePoint < 0x800) {
		      if ((units -= 2) < 0) break
		      bytes.push(
		        codePoint >> 0x6 | 0xC0,
		        codePoint & 0x3F | 0x80
		      );
		    } else if (codePoint < 0x10000) {
		      if ((units -= 3) < 0) break
		      bytes.push(
		        codePoint >> 0xC | 0xE0,
		        codePoint >> 0x6 & 0x3F | 0x80,
		        codePoint & 0x3F | 0x80
		      );
		    } else if (codePoint < 0x110000) {
		      if ((units -= 4) < 0) break
		      bytes.push(
		        codePoint >> 0x12 | 0xF0,
		        codePoint >> 0xC & 0x3F | 0x80,
		        codePoint >> 0x6 & 0x3F | 0x80,
		        codePoint & 0x3F | 0x80
		      );
		    } else {
		      throw new Error('Invalid code point')
		    }
		  }

		  return bytes
		}

		function asciiToBytes (str) {
		  const byteArray = [];
		  for (let i = 0; i < str.length; ++i) {
		    // Node's code seems to be doing this and not & 0x7F..
		    byteArray.push(str.charCodeAt(i) & 0xFF);
		  }
		  return byteArray
		}

		function utf16leToBytes (str, units) {
		  let c, hi, lo;
		  const byteArray = [];
		  for (let i = 0; i < str.length; ++i) {
		    if ((units -= 2) < 0) break

		    c = str.charCodeAt(i);
		    hi = c >> 8;
		    lo = c % 256;
		    byteArray.push(lo);
		    byteArray.push(hi);
		  }

		  return byteArray
		}

		function base64ToBytes (str) {
		  return base64.toByteArray(base64clean(str))
		}

		function blitBuffer (src, dst, offset, length) {
		  let i;
		  for (i = 0; i < length; ++i) {
		    if ((i + offset >= dst.length) || (i >= src.length)) break
		    dst[i + offset] = src[i];
		  }
		  return i
		}

		// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
		// the `instanceof` check but they should be treated as of that type.
		// See: https://github.com/feross/buffer/issues/166
		function isInstance (obj, type) {
		  return obj instanceof type ||
		    (obj != null && obj.constructor != null && obj.constructor.name != null &&
		      obj.constructor.name === type.name)
		}
		function numberIsNaN (obj) {
		  // For IE11 support
		  return obj !== obj // eslint-disable-line no-self-compare
		}

		// Create lookup table for `toString('hex')`
		// See: https://github.com/feross/buffer/issues/219
		const hexSliceLookupTable = (function () {
		  const alphabet = '0123456789abcdef';
		  const table = new Array(256);
		  for (let i = 0; i < 16; ++i) {
		    const i16 = i * 16;
		    for (let j = 0; j < 16; ++j) {
		      table[i16 + j] = alphabet[i] + alphabet[j];
		    }
		  }
		  return table
		})();

		// Return not function with Error if BigInt not supported
		function defineBigIntMethod (fn) {
		  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
		}

		function BufferBigIntNotDefined () {
		  throw new Error('BigInt not supported')
		} 
	} (buffer));
	return buffer;
}

var bufferExports = requireBuffer();

var safeBuffer = {exports: {}};

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

var hasRequiredSafeBuffer;

function requireSafeBuffer () {
	if (hasRequiredSafeBuffer) return safeBuffer.exports;
	hasRequiredSafeBuffer = 1;
	(function (module, exports$1) {
		/* eslint-disable node/no-deprecated-api */
		var buffer = requireBuffer();
		var Buffer = buffer.Buffer;

		// alternative to using Object.keys for old browsers
		function copyProps (src, dst) {
		  for (var key in src) {
		    dst[key] = src[key];
		  }
		}
		if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
		  module.exports = buffer;
		} else {
		  // Copy properties from require('buffer')
		  copyProps(buffer, exports$1);
		  exports$1.Buffer = SafeBuffer;
		}

		function SafeBuffer (arg, encodingOrOffset, length) {
		  return Buffer(arg, encodingOrOffset, length)
		}

		SafeBuffer.prototype = Object.create(Buffer.prototype);

		// Copy static methods from Buffer
		copyProps(Buffer, SafeBuffer);

		SafeBuffer.from = function (arg, encodingOrOffset, length) {
		  if (typeof arg === 'number') {
		    throw new TypeError('Argument must not be a number')
		  }
		  return Buffer(arg, encodingOrOffset, length)
		};

		SafeBuffer.alloc = function (size, fill, encoding) {
		  if (typeof size !== 'number') {
		    throw new TypeError('Argument must be a number')
		  }
		  var buf = Buffer(size);
		  if (fill !== undefined) {
		    if (typeof encoding === 'string') {
		      buf.fill(fill, encoding);
		    } else {
		      buf.fill(fill);
		    }
		  } else {
		    buf.fill(0);
		  }
		  return buf
		};

		SafeBuffer.allocUnsafe = function (size) {
		  if (typeof size !== 'number') {
		    throw new TypeError('Argument must be a number')
		  }
		  return Buffer(size)
		};

		SafeBuffer.allocUnsafeSlow = function (size) {
		  if (typeof size !== 'number') {
		    throw new TypeError('Argument must be a number')
		  }
		  return buffer.SlowBuffer(size)
		}; 
	} (safeBuffer, safeBuffer.exports));
	return safeBuffer.exports;
}

var src;
var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src;
	hasRequiredSrc = 1;
	// base-x encoding / decoding
	// Copyright (c) 2018 base-x contributors
	// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
	// Distributed under the MIT software license, see the accompanying
	// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
	// @ts-ignore
	var _Buffer = requireSafeBuffer().Buffer;
	function base (ALPHABET) {
	  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
	  var BASE_MAP = new Uint8Array(256);
	  for (var j = 0; j < BASE_MAP.length; j++) {
	    BASE_MAP[j] = 255;
	  }
	  for (var i = 0; i < ALPHABET.length; i++) {
	    var x = ALPHABET.charAt(i);
	    var xc = x.charCodeAt(0);
	    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
	    BASE_MAP[xc] = i;
	  }
	  var BASE = ALPHABET.length;
	  var LEADER = ALPHABET.charAt(0);
	  var FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
	  var iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up
	  function encode (source) {
	    if (Array.isArray(source) || source instanceof Uint8Array) { source = _Buffer.from(source); }
	    if (!_Buffer.isBuffer(source)) { throw new TypeError('Expected Buffer') }
	    if (source.length === 0) { return '' }
	        // Skip & count leading zeroes.
	    var zeroes = 0;
	    var length = 0;
	    var pbegin = 0;
	    var pend = source.length;
	    while (pbegin !== pend && source[pbegin] === 0) {
	      pbegin++;
	      zeroes++;
	    }
	        // Allocate enough space in big-endian base58 representation.
	    var size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
	    var b58 = new Uint8Array(size);
	        // Process the bytes.
	    while (pbegin !== pend) {
	      var carry = source[pbegin];
	            // Apply "b58 = b58 * 256 + ch".
	      var i = 0;
	      for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
	        carry += (256 * b58[it1]) >>> 0;
	        b58[it1] = (carry % BASE) >>> 0;
	        carry = (carry / BASE) >>> 0;
	      }
	      if (carry !== 0) { throw new Error('Non-zero carry') }
	      length = i;
	      pbegin++;
	    }
	        // Skip leading zeroes in base58 result.
	    var it2 = size - length;
	    while (it2 !== size && b58[it2] === 0) {
	      it2++;
	    }
	        // Translate the result into a string.
	    var str = LEADER.repeat(zeroes);
	    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]); }
	    return str
	  }
	  function decodeUnsafe (source) {
	    if (typeof source !== 'string') { throw new TypeError('Expected String') }
	    if (source.length === 0) { return _Buffer.alloc(0) }
	    var psz = 0;
	        // Skip and count leading '1's.
	    var zeroes = 0;
	    var length = 0;
	    while (source[psz] === LEADER) {
	      zeroes++;
	      psz++;
	    }
	        // Allocate enough space in big-endian base256 representation.
	    var size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
	    var b256 = new Uint8Array(size);
	        // Process the characters.
	    while (psz < source.length) {
	            // Find code of next character
	      var charCode = source.charCodeAt(psz);
	            // Base map can not be indexed using char code
	      if (charCode > 255) { return }
	            // Decode character
	      var carry = BASE_MAP[charCode];
	            // Invalid character
	      if (carry === 255) { return }
	      var i = 0;
	      for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
	        carry += (BASE * b256[it3]) >>> 0;
	        b256[it3] = (carry % 256) >>> 0;
	        carry = (carry / 256) >>> 0;
	      }
	      if (carry !== 0) { throw new Error('Non-zero carry') }
	      length = i;
	      psz++;
	    }
	        // Skip leading zeroes in b256.
	    var it4 = size - length;
	    while (it4 !== size && b256[it4] === 0) {
	      it4++;
	    }
	    var vch = _Buffer.allocUnsafe(zeroes + (size - it4));
	    vch.fill(0x00, 0, zeroes);
	    var j = zeroes;
	    while (it4 !== size) {
	      vch[j++] = b256[it4++];
	    }
	    return vch
	  }
	  function decode (string) {
	    var buffer = decodeUnsafe(string);
	    if (buffer) { return buffer }
	    throw new Error('Non-base' + BASE + ' character')
	  }
	  return {
	    encode: encode,
	    decodeUnsafe: decodeUnsafe,
	    decode: decode
	  }
	}
	src = base;
	return src;
}

var bs58;
var hasRequiredBs58;

function requireBs58 () {
	if (hasRequiredBs58) return bs58;
	hasRequiredBs58 = 1;
	var basex = requireSrc();
	var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

	bs58 = basex(ALPHABET);
	return bs58;
}

var bs58Exports = requireBs58();
var bs58$1 = /*@__PURE__*/getDefaultExportFromCjs(bs58Exports);

var camelcase = {exports: {}};

var hasRequiredCamelcase;

function requireCamelcase () {
	if (hasRequiredCamelcase) return camelcase.exports;
	hasRequiredCamelcase = 1;

	const UPPERCASE = /[\p{Lu}]/u;
	const LOWERCASE = /[\p{Ll}]/u;
	const LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
	const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
	const SEPARATORS = /[_.\- ]+/;

	const LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source);
	const SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, 'gu');
	const NUMBERS_AND_IDENTIFIER = new RegExp('\\d+' + IDENTIFIER.source, 'gu');

	const preserveCamelCase = (string, toLowerCase, toUpperCase) => {
		let isLastCharLower = false;
		let isLastCharUpper = false;
		let isLastLastCharUpper = false;

		for (let i = 0; i < string.length; i++) {
			const character = string[i];

			if (isLastCharLower && UPPERCASE.test(character)) {
				string = string.slice(0, i) + '-' + string.slice(i);
				isLastCharLower = false;
				isLastLastCharUpper = isLastCharUpper;
				isLastCharUpper = true;
				i++;
			} else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character)) {
				string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
				isLastLastCharUpper = isLastCharUpper;
				isLastCharUpper = false;
				isLastCharLower = true;
			} else {
				isLastCharLower = toLowerCase(character) === character && toUpperCase(character) !== character;
				isLastLastCharUpper = isLastCharUpper;
				isLastCharUpper = toUpperCase(character) === character && toLowerCase(character) !== character;
			}
		}

		return string;
	};

	const preserveConsecutiveUppercase = (input, toLowerCase) => {
		LEADING_CAPITAL.lastIndex = 0;

		return input.replace(LEADING_CAPITAL, m1 => toLowerCase(m1));
	};

	const postProcess = (input, toUpperCase) => {
		SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
		NUMBERS_AND_IDENTIFIER.lastIndex = 0;

		return input.replace(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier))
			.replace(NUMBERS_AND_IDENTIFIER, m => toUpperCase(m));
	};

	const camelCase = (input, options) => {
		if (!(typeof input === 'string' || Array.isArray(input))) {
			throw new TypeError('Expected the input to be `string | string[]`');
		}

		options = {
			pascalCase: false,
			preserveConsecutiveUppercase: false,
			...options
		};

		if (Array.isArray(input)) {
			input = input.map(x => x.trim())
				.filter(x => x.length)
				.join('-');
		} else {
			input = input.trim();
		}

		if (input.length === 0) {
			return '';
		}

		const toLowerCase = options.locale === false ?
			string => string.toLowerCase() :
			string => string.toLocaleLowerCase(options.locale);
		const toUpperCase = options.locale === false ?
			string => string.toUpperCase() :
			string => string.toLocaleUpperCase(options.locale);

		if (input.length === 1) {
			return options.pascalCase ? toUpperCase(input) : toLowerCase(input);
		}

		const hasUpperCase = input !== toLowerCase(input);

		if (hasUpperCase) {
			input = preserveCamelCase(input, toLowerCase, toUpperCase);
		}

		input = input.replace(LEADING_SEPARATORS, '');

		if (options.preserveConsecutiveUppercase) {
			input = preserveConsecutiveUppercase(input, toLowerCase);
		} else {
			input = toLowerCase(input);
		}

		if (options.pascalCase) {
			input = toUpperCase(input.charAt(0)) + input.slice(1);
		}

		return postProcess(input, toUpperCase);
	};

	camelcase.exports = camelCase;
	// TODO: Remove this for the next major release
	camelcase.exports.default = camelCase;
	return camelcase.exports;
}

var camelcaseExports = requireCamelcase();
var camelCase = /*@__PURE__*/getDefaultExportFromCjs(camelcaseExports);

/*============================================================================*/


function zero$1(buf) { let len = buf.length; while (--len >= 0) { buf[len] = 0; } }
/* The three kinds of block type */

const MIN_MATCH$1    = 3;
const MAX_MATCH$1    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

const LENGTH_CODES$1  = 29;
/* number of length codes, not counting the special END_BLOCK code */

const LITERALS$1      = 256;
/* number of literal bytes 0..255 */

const L_CODES$1       = LITERALS$1 + 1 + LENGTH_CODES$1;
/* number of Literal or Length codes, including the END_BLOCK code */

const D_CODES$1       = 30;
/* eslint-enable comma-spacing,array-bracket-spacing */

/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

const DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1
const static_ltree  = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

const static_dtree  = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

const _dist_code    = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

const _length_code  = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

const base_length   = new Array(LENGTH_CODES$1);
zero$1(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

const base_dist     = new Array(D_CODES$1);
zero$1(base_dist);

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It isn't worth it to make additional optimizations as in original.
// Small size is preferable.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

const adler32 = (adler, buf, len, pos) => {
  let s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
};


var adler32_1 = adler32;

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

// Use ordinary array, since untyped makes no boost here
const makeTable = () => {
  let c, table = [];

  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
};

// Create table on load. Just 255 signed longs. Not a problem.
const crcTable = new Uint32Array(makeTable());


const crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;

  crc ^= -1;

  for (let i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
};


var crc32_1 = crc32;

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var messages = {
  2:      'need dictionary',     /* Z_NEED_DICT       2  */
  1:      'stream end',          /* Z_STREAM_END      1  */
  0:      '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

var constants$2 = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  Z_MEM_ERROR:       -4,
  Z_BUF_ERROR:       -5,
  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

const _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

var assign = function (obj /*from1, from2, from3, ...*/) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// Join array of chunks to single array.
var flattenChunks = (chunks) => {
  // calculate data length
  let len = 0;

  for (let i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }

  // join chunks
  const result = new Uint8Array(len);

  for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
};

var common = {
	assign: assign,
	flattenChunks: flattenChunks
};

// String encode/decode helpers


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safari
//
let STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
const _utf8len = new Uint8Array(256);
for (let q = 0; q < 256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


// convert string to array (typed, when possible)
var string2buf = (str) => {
  if (typeof TextEncoder === 'function' && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }

  let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new Uint8Array(buf_len);

  // convert
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper
const buf2binstring = (buf, len) => {
  // On Chrome, the arguments in a function call that are allowed is `65534`.
  // If the length of the buffer is smaller than that, we can use this optimization,
  // otherwise we will take a slower path.
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }

  let result = '';
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};


// convert array to string
var buf2string = (buf, max) => {
  const len = max || buf.length;

  if (typeof TextDecoder === 'function' && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max));
  }

  let i, out;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  const utf16buf = new Array(len * 2);

  for (out = 0, i = 0; i < len;) {
    let c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    let c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
var utf8border = (buf, max) => {

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means buffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

var strings = {
	string2buf: string2buf,
	buf2string: buf2string,
	utf8border: utf8border
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

var zstream = ZStream;

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

// See state defs from inflate.js
const BAD$1 = 16209;       /* got a data error -- remain here until reset */
const TYPE$1 = 16191;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
var inffast = function inflate_fast(strm, start) {
  let _in;                    /* local strm.input */
  let last;                   /* have enough input while in < last */
  let _out;                   /* local strm.output */
  let beg;                    /* inflate()'s initial strm.output */
  let end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  let dmax;                   /* maximum distance from zlib header */
//#endif
  let wsize;                  /* window size or zero if not using window */
  let whave;                  /* valid bytes in the window */
  let wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  let s_window;               /* allocated sliding window, if wsize != 0 */
  let hold;                   /* local strm.hold */
  let bits;                   /* local strm.bits */
  let lcode;                  /* local strm.lencode */
  let dcode;                  /* local strm.distcode */
  let lmask;                  /* mask for first level of length codes */
  let dmask;                  /* mask for first level of distance codes */
  let here;                   /* retrieved table entry */
  let op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  let len;                    /* match length, unused bytes */
  let dist;                   /* match distance */
  let from;                   /* where to copy match from */
  let from_source;


  let input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  const state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD$1;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD$1;
                  break top;
                }

// (!) This block is disabled in zlib defaults,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD$1;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE$1;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD$1;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

const MAXBITS = 15;
const ENOUGH_LENS$1 = 852;
const ENOUGH_DISTS$1 = 592;
//const ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

const CODES$1 = 0;
const LENS$1 = 1;
const DISTS$1 = 2;

const lbase = new Uint16Array([ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
]);

const lext = new Uint8Array([ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
]);

const dbase = new Uint16Array([ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
]);

const dext = new Uint8Array([ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
]);

const inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) =>
{
  const bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  let len = 0;               /* a code's length in bits */
  let sym = 0;               /* index of code symbols */
  let min = 0, max = 0;          /* minimum and maximum code lengths */
  let root = 0;              /* number of index bits for root table */
  let curr = 0;              /* number of index bits for current table */
  let drop = 0;              /* code bits to drop for sub-table */
  let left = 0;                   /* number of prefix codes available */
  let used = 0;              /* code entries in table used */
  let huff = 0;              /* Huffman code */
  let incr;              /* for incrementing code, index */
  let fill;              /* index for replicating entries */
  let low;               /* low bits for current root entry */
  let mask;              /* mask for low root bits */
  let next;             /* next available space in table */
  let base = null;     /* base value table to use */
//  let shoextra;    /* extra bits table to use */
  let match;                  /* use base and extra for symbol >= match */
  const count = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
  const offs = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
  let extra = null;

  let here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES$1 || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES$1) {
    base = extra = work;    /* dummy value--not used */
    match = 20;

  } else if (type === LENS$1) {
    base = lbase;
    extra = lext;
    match = 257;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    match = 0;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
    (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
    return 1;
  }

  /* process all codes and make table entries */
  for (;;) {
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] + 1 < match) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] >= match) {
      here_op = extra[work[sym] - match];
      here_val = base[work[sym] - match];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS$1 && used > ENOUGH_LENS$1) ||
        (type === DISTS$1 && used > ENOUGH_DISTS$1)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};


var inftrees = inflate_table;

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.






const CODES = 0;
const LENS = 1;
const DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/

const {
  Z_FINISH: Z_FINISH$1, Z_BLOCK, Z_TREES,
  Z_OK: Z_OK$1, Z_STREAM_END: Z_STREAM_END$1, Z_NEED_DICT: Z_NEED_DICT$1, Z_STREAM_ERROR: Z_STREAM_ERROR$1, Z_DATA_ERROR: Z_DATA_ERROR$1, Z_MEM_ERROR: Z_MEM_ERROR$1, Z_BUF_ERROR,
  Z_DEFLATED
} = constants$2;


/* STATES ====================================================================*/
/* ===========================================================================*/


const    HEAD = 16180;       /* i: waiting for magic header */
const    FLAGS = 16181;      /* i: waiting for method and flags (gzip) */
const    TIME = 16182;       /* i: waiting for modification time (gzip) */
const    OS = 16183;         /* i: waiting for extra flags and operating system (gzip) */
const    EXLEN = 16184;      /* i: waiting for extra length (gzip) */
const    EXTRA = 16185;      /* i: waiting for extra bytes (gzip) */
const    NAME = 16186;       /* i: waiting for end of file name (gzip) */
const    COMMENT = 16187;    /* i: waiting for end of comment (gzip) */
const    HCRC = 16188;       /* i: waiting for header crc (gzip) */
const    DICTID = 16189;    /* i: waiting for dictionary check value */
const    DICT = 16190;      /* waiting for inflateSetDictionary() call */
const        TYPE = 16191;      /* i: waiting for type bits, including last-flag bit */
const        TYPEDO = 16192;    /* i: same, but skip check to exit inflate on new block */
const        STORED = 16193;    /* i: waiting for stored size (length and complement) */
const        COPY_ = 16194;     /* i/o: same as COPY below, but only first time in */
const        COPY = 16195;      /* i/o: waiting for input or output to copy stored block */
const        TABLE = 16196;     /* i: waiting for dynamic block table lengths */
const        LENLENS = 16197;   /* i: waiting for code length code lengths */
const        CODELENS = 16198;  /* i: waiting for length/lit and distance code lengths */
const            LEN_ = 16199;      /* i: same as LEN below, but only first time in */
const            LEN = 16200;       /* i: waiting for length/lit/eob code */
const            LENEXT = 16201;    /* i: waiting for length extra bits */
const            DIST = 16202;      /* i: waiting for distance code */
const            DISTEXT = 16203;   /* i: waiting for distance extra bits */
const            MATCH = 16204;     /* o: waiting for output space to copy string */
const            LIT = 16205;       /* o: waiting for output space to write literal */
const    CHECK = 16206;     /* i: waiting for 32-bit check value */
const    LENGTH = 16207;    /* i: waiting for 32-bit length (gzip) */
const    DONE = 16208;      /* finished check, done -- remain here until reset */
const    BAD = 16209;       /* got a data error -- remain here until reset */
const    MEM = 16210;       /* got an inflate() memory error -- remain here until reset */
const    SYNC = 16211;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
//const ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

const MAX_WBITS = 15;
/* 32K LZ77 window */
const DEF_WBITS = MAX_WBITS;


const zswap32 = (q) => {

  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
};


function InflateState() {
  this.strm = null;           /* pointer back to this zlib stream */
  this.mode = 0;              /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip,
                                 bit 2 true to validate check value */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib), or
                                 -1 if raw or no header yet */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new Uint16Array(320); /* temporary storage for code lengths */
  this.work = new Uint16Array(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new Int32Array(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}


const inflateStateCheck = (strm) => {

  if (!strm) {
    return 1;
  }
  const state = strm.state;
  if (!state || state.strm !== strm ||
    state.mode < HEAD || state.mode > SYNC) {
    return 1;
  }
  return 0;
};


const inflateResetKeep = (strm) => {

  if (inflateStateCheck(strm)) { return Z_STREAM_ERROR$1; }
  const state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.flags = -1;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
  state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK$1;
};


const inflateReset = (strm) => {

  if (inflateStateCheck(strm)) { return Z_STREAM_ERROR$1; }
  const state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

};


const inflateReset2 = (strm, windowBits) => {
  let wrap;

  /* get the state */
  if (inflateStateCheck(strm)) { return Z_STREAM_ERROR$1; }
  const state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 5;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
};


const inflateInit2 = (strm, windowBits) => {

  if (!strm) { return Z_STREAM_ERROR$1; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  const state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.strm = strm;
  state.window = null/*Z_NULL*/;
  state.mode = HEAD;     /* to pass state test in inflateReset2() */
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$1) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
};


const inflateInit = (strm) => {

  return inflateInit2(strm, DEF_WBITS);
};


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
let virgin = true;

let lenfix, distfix; // We have no pointers in JS, so keep tables separate


const fixedtables = (state) => {

  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);

    /* literal/length table */
    let sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inftrees(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inftrees(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
};


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
const updatewindow = (strm, src, end, copy) => {

  let dist;
  const state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new Uint8Array(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    state.window.set(src.subarray(end - state.wsize, end), 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      state.window.set(src.subarray(end - copy, end), 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
};


const inflate$2 = (strm, flush) => {

  let state;
  let input, output;          // input/output buffers
  let next;                   /* next input INDEX */
  let put;                    /* next output INDEX */
  let have, left;             /* available input and output */
  let hold;                   /* bit buffer */
  let bits;                   /* bits in bit buffer */
  let _in, _out;              /* save starting available input and output */
  let copy;                   /* number of stored or match bytes to copy */
  let from;                   /* where to copy match bytes from */
  let from_source;
  let here = 0;               /* current decoding table entry */
  let here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //let last;                   /* parent table entry */
  let last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  let len;                    /* length to copy for repeats, bits to drop */
  let ret;                    /* return code */
  const hbuf = new Uint8Array(4);    /* buffer for gzip header crc calculation */
  let opts;

  let n; // temporary variable for NEED_BITS

  const order = /* permutation of code lengths */
    new Uint8Array([ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ]);


  if (inflateStateCheck(strm) || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR$1;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK$1;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
      case HEAD:
        if (state.wrap === 0) {
          state.mode = TYPEDO;
          break;
        }
        //=== NEEDBITS(16);
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
          if (state.wbits === 0) {
            state.wbits = 15;
          }
          state.check = 0/*crc32(0L, Z_NULL, 0)*/;
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32_1(state.check, hbuf, 2, 0);
          //===//

          //=== INITBITS();
          hold = 0;
          bits = 0;
          //===//
          state.mode = FLAGS;
          break;
        }
        if (state.head) {
          state.head.done = false;
        }
        if (!(state.wrap & 1) ||   /* check if zlib header allowed */
          (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
          strm.msg = 'incorrect header check';
          state.mode = BAD;
          break;
        }
        if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
          strm.msg = 'unknown compression method';
          state.mode = BAD;
          break;
        }
        //--- DROPBITS(4) ---//
        hold >>>= 4;
        bits -= 4;
        //---//
        len = (hold & 0x0f)/*BITS(4)*/ + 8;
        if (state.wbits === 0) {
          state.wbits = len;
        }
        if (len > 15 || len > state.wbits) {
          strm.msg = 'invalid window size';
          state.mode = BAD;
          break;
        }

        // !!! pako patch. Force use `options.windowBits` if passed.
        // Required to always use max window size by default.
        state.dmax = 1 << state.wbits;
        //state.dmax = 1 << len;

        state.flags = 0;               /* indicate zlib header */
        //Tracev((stderr, "inflate:   zlib header ok\n"));
        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
        state.mode = hold & 0x200 ? DICTID : TYPE;
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        break;
      case FLAGS:
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.flags = hold;
        if ((state.flags & 0xff) !== Z_DEFLATED) {
          strm.msg = 'unknown compression method';
          state.mode = BAD;
          break;
        }
        if (state.flags & 0xe000) {
          strm.msg = 'unknown header flags set';
          state.mode = BAD;
          break;
        }
        if (state.head) {
          state.head.text = ((hold >> 8) & 1);
        }
        if ((state.flags & 0x0200) && (state.wrap & 4)) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32_1(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = TIME;
        /* falls through */
      case TIME:
        //=== NEEDBITS(32); */
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (state.head) {
          state.head.time = hold;
        }
        if ((state.flags & 0x0200) && (state.wrap & 4)) {
          //=== CRC4(state.check, hold)
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          hbuf[2] = (hold >>> 16) & 0xff;
          hbuf[3] = (hold >>> 24) & 0xff;
          state.check = crc32_1(state.check, hbuf, 4, 0);
          //===
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = OS;
        /* falls through */
      case OS:
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (state.head) {
          state.head.xflags = (hold & 0xff);
          state.head.os = (hold >> 8);
        }
        if ((state.flags & 0x0200) && (state.wrap & 4)) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32_1(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = EXLEN;
        /* falls through */
      case EXLEN:
        if (state.flags & 0x0400) {
          //=== NEEDBITS(16); */
          while (bits < 16) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          state.length = hold;
          if (state.head) {
            state.head.extra_len = hold;
          }
          if ((state.flags & 0x0200) && (state.wrap & 4)) {
            //=== CRC2(state.check, hold);
            hbuf[0] = hold & 0xff;
            hbuf[1] = (hold >>> 8) & 0xff;
            state.check = crc32_1(state.check, hbuf, 2, 0);
            //===//
          }
          //=== INITBITS();
          hold = 0;
          bits = 0;
          //===//
        }
        else if (state.head) {
          state.head.extra = null/*Z_NULL*/;
        }
        state.mode = EXTRA;
        /* falls through */
      case EXTRA:
        if (state.flags & 0x0400) {
          copy = state.length;
          if (copy > have) { copy = have; }
          if (copy) {
            if (state.head) {
              len = state.head.extra_len - state.length;
              if (!state.head.extra) {
                // Use untyped array for more convenient processing later
                state.head.extra = new Uint8Array(state.head.extra_len);
              }
              state.head.extra.set(
                input.subarray(
                  next,
                  // extra field is limited to 65536 bytes
                  // - no need for additional size check
                  next + copy
                ),
                /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                len
              );
              //zmemcpy(state.head.extra + len, next,
              //        len + copy > state.head.extra_max ?
              //        state.head.extra_max - len : copy);
            }
            if ((state.flags & 0x0200) && (state.wrap & 4)) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            state.length -= copy;
          }
          if (state.length) { break inf_leave; }
        }
        state.length = 0;
        state.mode = NAME;
        /* falls through */
      case NAME:
        if (state.flags & 0x0800) {
          if (have === 0) { break inf_leave; }
          copy = 0;
          do {
            // TODO: 2 or 1 bytes?
            len = input[next + copy++];
            /* use constant limit because in js we should not preallocate memory */
            if (state.head && len &&
                (state.length < 65536 /*state.head.name_max*/)) {
              state.head.name += String.fromCharCode(len);
            }
          } while (len && copy < have);

          if ((state.flags & 0x0200) && (state.wrap & 4)) {
            state.check = crc32_1(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          if (len) { break inf_leave; }
        }
        else if (state.head) {
          state.head.name = null;
        }
        state.length = 0;
        state.mode = COMMENT;
        /* falls through */
      case COMMENT:
        if (state.flags & 0x1000) {
          if (have === 0) { break inf_leave; }
          copy = 0;
          do {
            len = input[next + copy++];
            /* use constant limit because in js we should not preallocate memory */
            if (state.head && len &&
                (state.length < 65536 /*state.head.comm_max*/)) {
              state.head.comment += String.fromCharCode(len);
            }
          } while (len && copy < have);
          if ((state.flags & 0x0200) && (state.wrap & 4)) {
            state.check = crc32_1(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          if (len) { break inf_leave; }
        }
        else if (state.head) {
          state.head.comment = null;
        }
        state.mode = HCRC;
        /* falls through */
      case HCRC:
        if (state.flags & 0x0200) {
          //=== NEEDBITS(16); */
          while (bits < 16) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          if ((state.wrap & 4) && hold !== (state.check & 0xffff)) {
            strm.msg = 'header crc mismatch';
            state.mode = BAD;
            break;
          }
          //=== INITBITS();
          hold = 0;
          bits = 0;
          //===//
        }
        if (state.head) {
          state.head.hcrc = ((state.flags >> 9) & 1);
          state.head.done = true;
        }
        strm.adler = state.check = 0;
        state.mode = TYPE;
        break;
      case DICTID:
        //=== NEEDBITS(32); */
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        strm.adler = state.check = zswap32(hold);
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = DICT;
        /* falls through */
      case DICT:
        if (state.havedict === 0) {
          //--- RESTORE() ---
          strm.next_out = put;
          strm.avail_out = left;
          strm.next_in = next;
          strm.avail_in = have;
          state.hold = hold;
          state.bits = bits;
          //---
          return Z_NEED_DICT$1;
        }
        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
        state.mode = TYPE;
        /* falls through */
      case TYPE:
        if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
        /* falls through */
      case TYPEDO:
        if (state.last) {
          //--- BYTEBITS() ---//
          hold >>>= bits & 7;
          bits -= bits & 7;
          //---//
          state.mode = CHECK;
          break;
        }
        //=== NEEDBITS(3); */
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.last = (hold & 0x01)/*BITS(1)*/;
        //--- DROPBITS(1) ---//
        hold >>>= 1;
        bits -= 1;
        //---//

        switch ((hold & 0x03)/*BITS(2)*/) {
          case 0:                             /* stored block */
            //Tracev((stderr, "inflate:     stored block%s\n",
            //        state.last ? " (last)" : ""));
            state.mode = STORED;
            break;
          case 1:                             /* fixed block */
            fixedtables(state);
            //Tracev((stderr, "inflate:     fixed codes block%s\n",
            //        state.last ? " (last)" : ""));
            state.mode = LEN_;             /* decode codes */
            if (flush === Z_TREES) {
              //--- DROPBITS(2) ---//
              hold >>>= 2;
              bits -= 2;
              //---//
              break inf_leave;
            }
            break;
          case 2:                             /* dynamic block */
            //Tracev((stderr, "inflate:     dynamic codes block%s\n",
            //        state.last ? " (last)" : ""));
            state.mode = TABLE;
            break;
          case 3:
            strm.msg = 'invalid block type';
            state.mode = BAD;
        }
        //--- DROPBITS(2) ---//
        hold >>>= 2;
        bits -= 2;
        //---//
        break;
      case STORED:
        //--- BYTEBITS() ---// /* go to byte boundary */
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        //=== NEEDBITS(32); */
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
          strm.msg = 'invalid stored block lengths';
          state.mode = BAD;
          break;
        }
        state.length = hold & 0xffff;
        //Tracev((stderr, "inflate:       stored length %u\n",
        //        state.length));
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = COPY_;
        if (flush === Z_TREES) { break inf_leave; }
        /* falls through */
      case COPY_:
        state.mode = COPY;
        /* falls through */
      case COPY:
        copy = state.length;
        if (copy) {
          if (copy > have) { copy = have; }
          if (copy > left) { copy = left; }
          if (copy === 0) { break inf_leave; }
          //--- zmemcpy(put, next, copy); ---
          output.set(input.subarray(next, next + copy), put);
          //---//
          have -= copy;
          next += copy;
          left -= copy;
          put += copy;
          state.length -= copy;
          break;
        }
        //Tracev((stderr, "inflate:       stored end\n"));
        state.mode = TYPE;
        break;
      case TABLE:
        //=== NEEDBITS(14); */
        while (bits < 14) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
        //--- DROPBITS(5) ---//
        hold >>>= 5;
        bits -= 5;
        //---//
        state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
        //--- DROPBITS(5) ---//
        hold >>>= 5;
        bits -= 5;
        //---//
        state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
        //--- DROPBITS(4) ---//
        hold >>>= 4;
        bits -= 4;
        //---//
//#ifndef PKZIP_BUG_WORKAROUND
        if (state.nlen > 286 || state.ndist > 30) {
          strm.msg = 'too many length or distance symbols';
          state.mode = BAD;
          break;
        }
//#endif
        //Tracev((stderr, "inflate:       table sizes ok\n"));
        state.have = 0;
        state.mode = LENLENS;
        /* falls through */
      case LENLENS:
        while (state.have < state.ncode) {
          //=== NEEDBITS(3);
          while (bits < 3) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
          //--- DROPBITS(3) ---//
          hold >>>= 3;
          bits -= 3;
          //---//
        }
        while (state.have < 19) {
          state.lens[order[state.have++]] = 0;
        }
        // We have separate tables & no pointers. 2 commented lines below not needed.
        //state.next = state.codes;
        //state.lencode = state.next;
        // Switch to use dynamic table
        state.lencode = state.lendyn;
        state.lenbits = 7;

        opts = { bits: state.lenbits };
        ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
        state.lenbits = opts.bits;

        if (ret) {
          strm.msg = 'invalid code lengths set';
          state.mode = BAD;
          break;
        }
        //Tracev((stderr, "inflate:       code lengths ok\n"));
        state.have = 0;
        state.mode = CODELENS;
        /* falls through */
      case CODELENS:
        while (state.have < state.nlen + state.ndist) {
          for (;;) {
            here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
            here_bits = here >>> 24;
            here_op = (here >>> 16) & 0xff;
            here_val = here & 0xffff;

            if ((here_bits) <= bits) { break; }
            //--- PULLBYTE() ---//
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
            //---//
          }
          if (here_val < 16) {
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            state.lens[state.have++] = here_val;
          }
          else {
            if (here_val === 16) {
              //=== NEEDBITS(here.bits + 2);
              n = here_bits + 2;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              //--- DROPBITS(here.bits) ---//
              hold >>>= here_bits;
              bits -= here_bits;
              //---//
              if (state.have === 0) {
                strm.msg = 'invalid bit length repeat';
                state.mode = BAD;
                break;
              }
              len = state.lens[state.have - 1];
              copy = 3 + (hold & 0x03);//BITS(2);
              //--- DROPBITS(2) ---//
              hold >>>= 2;
              bits -= 2;
              //---//
            }
            else if (here_val === 17) {
              //=== NEEDBITS(here.bits + 3);
              n = here_bits + 3;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              //--- DROPBITS(here.bits) ---//
              hold >>>= here_bits;
              bits -= here_bits;
              //---//
              len = 0;
              copy = 3 + (hold & 0x07);//BITS(3);
              //--- DROPBITS(3) ---//
              hold >>>= 3;
              bits -= 3;
              //---//
            }
            else {
              //=== NEEDBITS(here.bits + 7);
              n = here_bits + 7;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              //--- DROPBITS(here.bits) ---//
              hold >>>= here_bits;
              bits -= here_bits;
              //---//
              len = 0;
              copy = 11 + (hold & 0x7f);//BITS(7);
              //--- DROPBITS(7) ---//
              hold >>>= 7;
              bits -= 7;
              //---//
            }
            if (state.have + copy > state.nlen + state.ndist) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            while (copy--) {
              state.lens[state.have++] = len;
            }
          }
        }

        /* handle error breaks in while */
        if (state.mode === BAD) { break; }

        /* check for end-of-block code (better have one) */
        if (state.lens[256] === 0) {
          strm.msg = 'invalid code -- missing end-of-block';
          state.mode = BAD;
          break;
        }

        /* build code tables -- note: do not change the lenbits or distbits
           values here (9 and 6) without reading the comments in inftrees.h
           concerning the ENOUGH constants, which depend on those values */
        state.lenbits = 9;

        opts = { bits: state.lenbits };
        ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
        // We have separate tables & no pointers. 2 commented lines below not needed.
        // state.next_index = opts.table_index;
        state.lenbits = opts.bits;
        // state.lencode = state.next;

        if (ret) {
          strm.msg = 'invalid literal/lengths set';
          state.mode = BAD;
          break;
        }

        state.distbits = 6;
        //state.distcode.copy(state.codes);
        // Switch to use dynamic table
        state.distcode = state.distdyn;
        opts = { bits: state.distbits };
        ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
        // We have separate tables & no pointers. 2 commented lines below not needed.
        // state.next_index = opts.table_index;
        state.distbits = opts.bits;
        // state.distcode = state.next;

        if (ret) {
          strm.msg = 'invalid distances set';
          state.mode = BAD;
          break;
        }
        //Tracev((stderr, 'inflate:       codes ok\n'));
        state.mode = LEN_;
        if (flush === Z_TREES) { break inf_leave; }
        /* falls through */
      case LEN_:
        state.mode = LEN;
        /* falls through */
      case LEN:
        if (have >= 6 && left >= 258) {
          //--- RESTORE() ---
          strm.next_out = put;
          strm.avail_out = left;
          strm.next_in = next;
          strm.avail_in = have;
          state.hold = hold;
          state.bits = bits;
          //---
          inffast(strm, _out);
          //--- LOAD() ---
          put = strm.next_out;
          output = strm.output;
          left = strm.avail_out;
          next = strm.next_in;
          input = strm.input;
          have = strm.avail_in;
          hold = state.hold;
          bits = state.bits;
          //---

          if (state.mode === TYPE) {
            state.back = -1;
          }
          break;
        }
        state.back = 0;
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if (here_bits <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_op && (here_op & 0xf0) === 0) {
          last_bits = here_bits;
          last_op = here_op;
          last_val = here_val;
          for (;;) {
            here = state.lencode[last_val +
                    ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
            here_bits = here >>> 24;
            here_op = (here >>> 16) & 0xff;
            here_val = here & 0xffff;

            if ((last_bits + here_bits) <= bits) { break; }
            //--- PULLBYTE() ---//
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
            //---//
          }
          //--- DROPBITS(last.bits) ---//
          hold >>>= last_bits;
          bits -= last_bits;
          //---//
          state.back += last_bits;
        }
        //--- DROPBITS(here.bits) ---//
        hold >>>= here_bits;
        bits -= here_bits;
        //---//
        state.back += here_bits;
        state.length = here_val;
        if (here_op === 0) {
          //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
          //        "inflate:         literal '%c'\n" :
          //        "inflate:         literal 0x%02x\n", here.val));
          state.mode = LIT;
          break;
        }
        if (here_op & 32) {
          //Tracevv((stderr, "inflate:         end of block\n"));
          state.back = -1;
          state.mode = TYPE;
          break;
        }
        if (here_op & 64) {
          strm.msg = 'invalid literal/length code';
          state.mode = BAD;
          break;
        }
        state.extra = here_op & 15;
        state.mode = LENEXT;
        /* falls through */
      case LENEXT:
        if (state.extra) {
          //=== NEEDBITS(state.extra);
          n = state.extra;
          while (bits < n) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
          //--- DROPBITS(state.extra) ---//
          hold >>>= state.extra;
          bits -= state.extra;
          //---//
          state.back += state.extra;
        }
        //Tracevv((stderr, "inflate:         length %u\n", state.length));
        state.was = state.length;
        state.mode = DIST;
        /* falls through */
      case DIST:
        for (;;) {
          here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if ((here_op & 0xf0) === 0) {
          last_bits = here_bits;
          last_op = here_op;
          last_val = here_val;
          for (;;) {
            here = state.distcode[last_val +
                    ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
            here_bits = here >>> 24;
            here_op = (here >>> 16) & 0xff;
            here_val = here & 0xffff;

            if ((last_bits + here_bits) <= bits) { break; }
            //--- PULLBYTE() ---//
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
            //---//
          }
          //--- DROPBITS(last.bits) ---//
          hold >>>= last_bits;
          bits -= last_bits;
          //---//
          state.back += last_bits;
        }
        //--- DROPBITS(here.bits) ---//
        hold >>>= here_bits;
        bits -= here_bits;
        //---//
        state.back += here_bits;
        if (here_op & 64) {
          strm.msg = 'invalid distance code';
          state.mode = BAD;
          break;
        }
        state.offset = here_val;
        state.extra = (here_op) & 15;
        state.mode = DISTEXT;
        /* falls through */
      case DISTEXT:
        if (state.extra) {
          //=== NEEDBITS(state.extra);
          n = state.extra;
          while (bits < n) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
          //--- DROPBITS(state.extra) ---//
          hold >>>= state.extra;
          bits -= state.extra;
          //---//
          state.back += state.extra;
        }
//#ifdef INFLATE_STRICT
        if (state.offset > state.dmax) {
          strm.msg = 'invalid distance too far back';
          state.mode = BAD;
          break;
        }
//#endif
        //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
        state.mode = MATCH;
        /* falls through */
      case MATCH:
        if (left === 0) { break inf_leave; }
        copy = _out - left;
        if (state.offset > copy) {         /* copy from window */
          copy = state.offset - copy;
          if (copy > state.whave) {
            if (state.sane) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break;
            }
// (!) This block is disabled in zlib defaults,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
          }
          if (copy > state.wnext) {
            copy -= state.wnext;
            from = state.wsize - copy;
          }
          else {
            from = state.wnext - copy;
          }
          if (copy > state.length) { copy = state.length; }
          from_source = state.window;
        }
        else {                              /* copy from output */
          from_source = output;
          from = put - state.offset;
          copy = state.length;
        }
        if (copy > left) { copy = left; }
        left -= copy;
        state.length -= copy;
        do {
          output[put++] = from_source[from++];
        } while (--copy);
        if (state.length === 0) { state.mode = LEN; }
        break;
      case LIT:
        if (left === 0) { break inf_leave; }
        output[put++] = state.length;
        left--;
        state.mode = LEN;
        break;
      case CHECK:
        if (state.wrap) {
          //=== NEEDBITS(32);
          while (bits < 32) {
            if (have === 0) { break inf_leave; }
            have--;
            // Use '|' instead of '+' to make sure that result is signed
            hold |= input[next++] << bits;
            bits += 8;
          }
          //===//
          _out -= left;
          strm.total_out += _out;
          state.total += _out;
          if ((state.wrap & 4) && _out) {
            strm.adler = state.check =
                /*UPDATE_CHECK(state.check, put - _out, _out);*/
                (state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out));

          }
          _out = left;
          // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
          if ((state.wrap & 4) && (state.flags ? hold : zswap32(hold)) !== state.check) {
            strm.msg = 'incorrect data check';
            state.mode = BAD;
            break;
          }
          //=== INITBITS();
          hold = 0;
          bits = 0;
          //===//
          //Tracev((stderr, "inflate:   check matches trailer\n"));
        }
        state.mode = LENGTH;
        /* falls through */
      case LENGTH:
        if (state.wrap && state.flags) {
          //=== NEEDBITS(32);
          while (bits < 32) {
            if (have === 0) { break inf_leave; }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          //===//
          if ((state.wrap & 4) && hold !== (state.total & 0xffffffff)) {
            strm.msg = 'incorrect length check';
            state.mode = BAD;
            break;
          }
          //=== INITBITS();
          hold = 0;
          bits = 0;
          //===//
          //Tracev((stderr, "inflate:   length matches trailer\n"));
        }
        state.mode = DONE;
        /* falls through */
      case DONE:
        ret = Z_STREAM_END$1;
        break inf_leave;
      case BAD:
        ret = Z_DATA_ERROR$1;
        break inf_leave;
      case MEM:
        return Z_MEM_ERROR$1;
      case SYNC:
        /* falls through */
      default:
        return Z_STREAM_ERROR$1;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH$1))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if ((state.wrap & 4) && _out) {
    strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH$1) && ret === Z_OK$1) {
    ret = Z_BUF_ERROR;
  }
  return ret;
};


const inflateEnd = (strm) => {

  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }

  let state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK$1;
};


const inflateGetHeader = (strm, head) => {

  /* check state */
  if (inflateStateCheck(strm)) { return Z_STREAM_ERROR$1; }
  const state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR$1; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK$1;
};


const inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;

  let state;
  let dictid;
  let ret;

  /* check state */
  if (inflateStateCheck(strm)) { return Z_STREAM_ERROR$1; }
  state = strm.state;

  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }

  /* check for correct dictionary identifier */
  if (state.mode === DICT) {
    dictid = 1; /* adler32(0, null, 0)*/
    /* dictid = adler32(dictid, dictionary, dictLength); */
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR$1;
    }
  }
  /* copy dictionary to window using updatewindow(), which will amend the
   existing dictionary if appropriate */
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR$1;
  }
  state.havedict = 1;
  // Tracev((stderr, "inflate:   dictionary set\n"));
  return Z_OK$1;
};


var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$2;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
module.exports.inflateCodesUsed = inflateCodesUsed;
module.exports.inflateCopy = inflateCopy;
module.exports.inflateGetDictionary = inflateGetDictionary;
module.exports.inflateMark = inflateMark;
module.exports.inflatePrime = inflatePrime;
module.exports.inflateSync = inflateSync;
module.exports.inflateSyncPoint = inflateSyncPoint;
module.exports.inflateUndermine = inflateUndermine;
module.exports.inflateValidate = inflateValidate;
*/

var inflate_1$2 = {
	inflateReset: inflateReset_1,
	inflateReset2: inflateReset2_1,
	inflateResetKeep: inflateResetKeep_1,
	inflateInit: inflateInit_1,
	inflateInit2: inflateInit2_1,
	inflate: inflate_2$1,
	inflateEnd: inflateEnd_1,
	inflateGetHeader: inflateGetHeader_1,
	inflateSetDictionary: inflateSetDictionary_1,
	inflateInfo: inflateInfo
};

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

var gzheader = GZheader;

const toString = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

const {
  Z_NO_FLUSH, Z_FINISH,
  Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR
} = constants$2;

/* ===========================================================================*/


/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overridden.
 **/

/**
 * Inflate.result -> Uint8Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 * - `dictionary`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * const pako = require('pako')
 * const chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
 * const chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * const inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
function Inflate$1(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ''
  }, options || {});

  const opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  let status  = inflate_1$2.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }

  this.header = new gzheader();

  inflate_1$2.inflateGetHeader(this.strm, this.header);

  // Setup dictionary
  if (opt.dictionary) {
    // Convert data if needed
    if (typeof opt.dictionary === 'string') {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) { //In raw mode we need to set the dictionary early
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
}

/**
 * Inflate#push(data[, flush_mode]) -> Boolean
 * - data (Uint8Array|ArrayBuffer): input data
 * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE
 *   flush modes. See constants. Skipped or `false` means Z_NO_FLUSH,
 *   `true` means Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. If end of stream detected,
 * [[Inflate#onEnd]] will be called.
 *
 * `flush_mode` is not needed for normal operation, because end of stream
 * detected automatically. You may try to use it for advanced things, but
 * this functionality was not tested.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate$1.prototype.push = function (data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  const dictionary = this.options.dictionary;
  let status, _flush_mode, last_avail_out;

  if (this.ended) return false;

  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;

  // Convert data if needed
  if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  for (;;) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = inflate_1$2.inflate(strm, _flush_mode);

    if (status === Z_NEED_DICT && dictionary) {
      status = inflate_1$2.inflateSetDictionary(strm, dictionary);

      if (status === Z_OK) {
        status = inflate_1$2.inflate(strm, _flush_mode);
      } else if (status === Z_DATA_ERROR) {
        // Replace code with more verbose
        status = Z_NEED_DICT;
      }
    }

    // Skip snyc markers if more data follows and not raw mode
    while (strm.avail_in > 0 &&
           status === Z_STREAM_END &&
           strm.state.wrap > 0 &&
           data[strm.next_in] !== 0)
    {
      inflate_1$2.inflateReset(strm);
      status = inflate_1$2.inflate(strm, _flush_mode);
    }

    switch (status) {
      case Z_STREAM_ERROR:
      case Z_DATA_ERROR:
      case Z_NEED_DICT:
      case Z_MEM_ERROR:
        this.onEnd(status);
        this.ended = true;
        return false;
    }

    // Remember real `avail_out` value, because we may patch out buffer content
    // to align utf8 strings boundaries.
    last_avail_out = strm.avail_out;

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === Z_STREAM_END) {

        if (this.options.to === 'string') {

          let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          let tail = strm.next_out - next_out_utf8;
          let utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail & realign counters
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);

          this.onData(utf8str);

        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
    }

    // Must repeat iteration if out buffer is full
    if (status === Z_OK && last_avail_out === 0) continue;

    // Finalize if end of stream reached.
    if (status === Z_STREAM_END) {
      status = inflate_1$2.inflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return true;
    }

    if (strm.avail_in === 0) break;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|String): output data. When string output requested,
 *   each chunk will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate$1.prototype.onData = function (chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (Z_FINISH). By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate$1.prototype.onEnd = function (status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|String
 * - data (Uint8Array|ArrayBuffer): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * const pako = require('pako');
 * const input = pako.deflate(new Uint8Array([1,2,3,4,5,6,7,8,9]));
 * let output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err) {
 *   console.log(err);
 * }
 * ```
 **/
function inflate$1(input, options) {
  const inflator = new Inflate$1(options);

  inflator.push(input);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) throw inflator.msg || messages[inflator.err];

  return inflator.result;
}
var inflate_2 = inflate$1;

var inflate_1$1 = {
	inflate: inflate_2};

const { inflate} = inflate_1$1;
var inflate_1 = inflate;

var eventemitter3 = {exports: {}};

var hasRequiredEventemitter3;

function requireEventemitter3 () {
	if (hasRequiredEventemitter3) return eventemitter3.exports;
	hasRequiredEventemitter3 = 1;
	(function (module) {

		var has = Object.prototype.hasOwnProperty
		  , prefix = '~';

		/**
		 * Constructor to create a storage for our `EE` objects.
		 * An `Events` instance is a plain object whose properties are event names.
		 *
		 * @constructor
		 * @private
		 */
		function Events() {}

		//
		// We try to not inherit from `Object.prototype`. In some engines creating an
		// instance in this way is faster than calling `Object.create(null)` directly.
		// If `Object.create(null)` is not supported we prefix the event names with a
		// character to make sure that the built-in object properties are not
		// overridden or used as an attack vector.
		//
		if (Object.create) {
		  Events.prototype = Object.create(null);

		  //
		  // This hack is needed because the `__proto__` property is still inherited in
		  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
		  //
		  if (!new Events().__proto__) prefix = false;
		}

		/**
		 * Representation of a single event listener.
		 *
		 * @param {Function} fn The listener function.
		 * @param {*} context The context to invoke the listener with.
		 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
		 * @constructor
		 * @private
		 */
		function EE(fn, context, once) {
		  this.fn = fn;
		  this.context = context;
		  this.once = once || false;
		}

		/**
		 * Add a listener for a given event.
		 *
		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} context The context to invoke the listener with.
		 * @param {Boolean} once Specify if the listener is a one-time listener.
		 * @returns {EventEmitter}
		 * @private
		 */
		function addListener(emitter, event, fn, context, once) {
		  if (typeof fn !== 'function') {
		    throw new TypeError('The listener must be a function');
		  }

		  var listener = new EE(fn, context || emitter, once)
		    , evt = prefix ? prefix + event : event;

		  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
		  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
		  else emitter._events[evt] = [emitter._events[evt], listener];

		  return emitter;
		}

		/**
		 * Clear event by name.
		 *
		 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
		 * @param {(String|Symbol)} evt The Event name.
		 * @private
		 */
		function clearEvent(emitter, evt) {
		  if (--emitter._eventsCount === 0) emitter._events = new Events();
		  else delete emitter._events[evt];
		}

		/**
		 * Minimal `EventEmitter` interface that is molded against the Node.js
		 * `EventEmitter` interface.
		 *
		 * @constructor
		 * @public
		 */
		function EventEmitter() {
		  this._events = new Events();
		  this._eventsCount = 0;
		}

		/**
		 * Return an array listing the events for which the emitter has registered
		 * listeners.
		 *
		 * @returns {Array}
		 * @public
		 */
		EventEmitter.prototype.eventNames = function eventNames() {
		  var names = []
		    , events
		    , name;

		  if (this._eventsCount === 0) return names;

		  for (name in (events = this._events)) {
		    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
		  }

		  if (Object.getOwnPropertySymbols) {
		    return names.concat(Object.getOwnPropertySymbols(events));
		  }

		  return names;
		};

		/**
		 * Return the listeners registered for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Array} The registered listeners.
		 * @public
		 */
		EventEmitter.prototype.listeners = function listeners(event) {
		  var evt = prefix ? prefix + event : event
		    , handlers = this._events[evt];

		  if (!handlers) return [];
		  if (handlers.fn) return [handlers.fn];

		  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
		    ee[i] = handlers[i].fn;
		  }

		  return ee;
		};

		/**
		 * Return the number of listeners listening to a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Number} The number of listeners.
		 * @public
		 */
		EventEmitter.prototype.listenerCount = function listenerCount(event) {
		  var evt = prefix ? prefix + event : event
		    , listeners = this._events[evt];

		  if (!listeners) return 0;
		  if (listeners.fn) return 1;
		  return listeners.length;
		};

		/**
		 * Calls each of the listeners registered for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @returns {Boolean} `true` if the event had listeners, else `false`.
		 * @public
		 */
		EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
		  var evt = prefix ? prefix + event : event;

		  if (!this._events[evt]) return false;

		  var listeners = this._events[evt]
		    , len = arguments.length
		    , args
		    , i;

		  if (listeners.fn) {
		    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

		    switch (len) {
		      case 1: return listeners.fn.call(listeners.context), true;
		      case 2: return listeners.fn.call(listeners.context, a1), true;
		      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
		      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
		      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
		      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
		    }

		    for (i = 1, args = new Array(len -1); i < len; i++) {
		      args[i - 1] = arguments[i];
		    }

		    listeners.fn.apply(listeners.context, args);
		  } else {
		    var length = listeners.length
		      , j;

		    for (i = 0; i < length; i++) {
		      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

		      switch (len) {
		        case 1: listeners[i].fn.call(listeners[i].context); break;
		        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
		        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
		        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
		        default:
		          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
		            args[j - 1] = arguments[j];
		          }

		          listeners[i].fn.apply(listeners[i].context, args);
		      }
		    }
		  }

		  return true;
		};

		/**
		 * Add a listener for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} [context=this] The context to invoke the listener with.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.on = function on(event, fn, context) {
		  return addListener(this, event, fn, context, false);
		};

		/**
		 * Add a one-time listener for a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn The listener function.
		 * @param {*} [context=this] The context to invoke the listener with.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.once = function once(event, fn, context) {
		  return addListener(this, event, fn, context, true);
		};

		/**
		 * Remove the listeners of a given event.
		 *
		 * @param {(String|Symbol)} event The event name.
		 * @param {Function} fn Only remove the listeners that match this function.
		 * @param {*} context Only remove the listeners that have this context.
		 * @param {Boolean} once Only remove one-time listeners.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
		  var evt = prefix ? prefix + event : event;

		  if (!this._events[evt]) return this;
		  if (!fn) {
		    clearEvent(this, evt);
		    return this;
		  }

		  var listeners = this._events[evt];

		  if (listeners.fn) {
		    if (
		      listeners.fn === fn &&
		      (!once || listeners.once) &&
		      (!context || listeners.context === context)
		    ) {
		      clearEvent(this, evt);
		    }
		  } else {
		    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
		      if (
		        listeners[i].fn !== fn ||
		        (once && !listeners[i].once) ||
		        (context && listeners[i].context !== context)
		      ) {
		        events.push(listeners[i]);
		      }
		    }

		    //
		    // Reset the array, or remove it completely if we have no more listeners.
		    //
		    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
		    else clearEvent(this, evt);
		  }

		  return this;
		};

		/**
		 * Remove all listeners, or those of the specified event.
		 *
		 * @param {(String|Symbol)} [event] The event name.
		 * @returns {EventEmitter} `this`.
		 * @public
		 */
		EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
		  var evt;

		  if (event) {
		    evt = prefix ? prefix + event : event;
		    if (this._events[evt]) clearEvent(this, evt);
		  } else {
		    this._events = new Events();
		    this._eventsCount = 0;
		  }

		  return this;
		};

		//
		// Alias methods names because people roll like that.
		//
		EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
		EventEmitter.prototype.addListener = EventEmitter.prototype.on;

		//
		// Expose the prefix.
		//
		EventEmitter.prefixed = prefix;

		//
		// Allow `EventEmitter` to be imported as module namespace.
		//
		EventEmitter.EventEmitter = EventEmitter;

		//
		// Expose the module.
		//
		{
		  module.exports = EventEmitter;
		} 
	} (eventemitter3));
	return eventemitter3.exports;
}

var eventemitter3Exports = requireEventemitter3();
var EventEmitter = /*@__PURE__*/getDefaultExportFromCjs(eventemitter3Exports);

/**
 * Splits an array into chunks
 *
 * @param array Array of objects to chunk.
 * @param size The max size of a chunk.
 * @returns A two dimensional array where each T[] length is < the provided size.
 */
function chunks(array, size) {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) => array.slice(index * size, (index + 1) * size));
}
/**
 * Check if a transaction object is a VersionedTransaction or not
 *
 * @param tx
 * @returns bool
 */
const isVersionedTransaction = (tx) => {
    return "version" in tx;
};

function decode$2(array) {
    const decoder = new TextDecoder("utf-8") // Browser https://caniuse.com/textencoder.
        ; // Node.
    return decoder.decode(array);
}

function encode$1(data) {
    return bs58$1.encode(data);
}
function decode(data) {
    return bufferExports.Buffer.from(data, "base64");
}

function isCompositeAccounts(accountItem) {
    return "accounts" in accountItem;
}
// Deterministic IDL address as a function of the program id.
async function idlAddress(programId) {
    const base = (await PublicKey.findProgramAddress([], programId))[0];
    return await PublicKey.createWithSeed(base, seed(), programId);
}
// Seed for generating the idlAddress.
function seed() {
    return "anchor:idl";
}
const IDL_ACCOUNT_LAYOUT = borsh.struct([
    borsh.publicKey("authority"),
    borsh.vecU8("data"),
]);
function decodeIdlAccount(data) {
    return IDL_ACCOUNT_LAYOUT.decode(data);
}
/**
 * Convert the given IDL to camelCase.
 *
 * The IDL is generated from Rust which has different conventions compared to
 * JS/TS, e.g. instruction names in Rust are snake_case.
 *
 * The conversion happens automatically for programs, however, if you are using
 * internals such as `BorshInstructionCoder` and you only have the original
 * (not camelCase) IDL, you might need to use this function.
 *
 * @param idl IDL to convert to camelCase
 * @returns camelCase version of the IDL
 */
function convertIdlToCamelCase(idl) {
    const KEYS_TO_CONVERT = ["name", "path", "account", "relations", "generic"];
    // `my_account.field` is getting converted to `myAccountField` but we
    // need `myAccount.field`.
    const toCamelCase = (s) => s.split(".").map(camelCase).join(".");
    const recursivelyConvertNamesToCamelCase = (obj) => {
        for (const key in obj) {
            const val = obj[key];
            if (KEYS_TO_CONVERT.includes(key)) {
                obj[key] = Array.isArray(val) ? val.map(toCamelCase) : toCamelCase(val);
            }
            else if (typeof val === "object") {
                recursivelyConvertNamesToCamelCase(val);
            }
        }
    };
    const camelCasedIdl = structuredClone(idl);
    recursivelyConvertNamesToCamelCase(camelCasedIdl);
    return camelCasedIdl;
}
/** Conveniently handle all defined field kinds with proper type support. */
function handleDefinedFields(fields, unitCb, namedCb, tupleCb) {
    // Unit
    if (!(fields === null || fields === void 0 ? void 0 : fields.length))
        return unitCb();
    // Named
    if (fields[0].name) {
        return namedCb(fields);
    }
    // Tuple
    return tupleCb(fields);
}

function parseIdlErrors(idl) {
    const errors = new Map();
    if (idl.errors) {
        idl.errors.forEach((e) => {
            var _a;
            let msg = (_a = e.msg) !== null && _a !== void 0 ? _a : e.name;
            errors.set(e.code, msg);
        });
    }
    return errors;
}
function toInstruction(idlIx, ...args) {
    if (idlIx.args.length != args.length) {
        throw new Error("Invalid argument length");
    }
    const ix = {};
    let idx = 0;
    idlIx.args.forEach((ixArg) => {
        ix[ixArg.name] = args[idx];
        idx += 1;
    });
    return ix;
}
// Throws error if any account required for the `ix` is not given.
function validateAccounts(ixAccounts, accounts = {}) {
    ixAccounts.forEach((acc) => {
        if (isCompositeAccounts(acc)) {
            validateAccounts(acc.accounts, accounts[acc.name]);
        }
        else {
            if (!accounts[acc.name]) {
                throw new Error(`Account \`${acc.name}\` not provided.`);
            }
        }
    });
}
// Translates an address to a Pubkey.
function translateAddress(address) {
    return address instanceof PublicKey ? address : new PublicKey(address);
}

/**
 * A `StructFailure` represents a single specific failure in validation.
 */

/**
 * `StructError` objects are thrown (or returned) when validation fails.
 *
 * Validation logic is design to exit early for maximum performance. The error
 * represents the first error encountered during validation. For more detail,
 * the `error.failures` property is a generator function that can be run to
 * continue validation and receive all the failures in the data.
 */
class StructError extends TypeError {
  constructor(failure, failures) {
    let cached;
    const {
      message,
      ...rest
    } = failure;
    const {
      path
    } = failure;
    const msg = path.length === 0 ? message : "At path: " + path.join('.') + " -- " + message;
    super(msg);
    this.value = void 0;
    this.key = void 0;
    this.type = void 0;
    this.refinement = void 0;
    this.path = void 0;
    this.branch = void 0;
    this.failures = void 0;
    Object.assign(this, rest);
    this.name = this.constructor.name;

    this.failures = () => {
      var _cached;

      return (_cached = cached) != null ? _cached : cached = [failure, ...failures()];
    };
  }

}

/**
 * Check if a value is an iterator.
 */
function isIterable(x) {
  return isObject(x) && typeof x[Symbol.iterator] === 'function';
}
/**
 * Check if a value is a plain object.
 */


function isObject(x) {
  return typeof x === 'object' && x != null;
}
/**
 * Return a value as a printable string.
 */

function print(value) {
  return typeof value === 'string' ? JSON.stringify(value) : "" + value;
}
/**
 * Shifts (removes and returns) the first value from the `input` iterator.
 * Like `Array.prototype.shift()` but for an `Iterator`.
 */

function shiftIterator(input) {
  const {
    done,
    value
  } = input.next();
  return done ? undefined : value;
}
/**
 * Convert a single validation result to a failure.
 */

function toFailure(result, context, struct, value) {
  if (result === true) {
    return;
  } else if (result === false) {
    result = {};
  } else if (typeof result === 'string') {
    result = {
      message: result
    };
  }

  const {
    path,
    branch
  } = context;
  const {
    type
  } = struct;
  const {
    refinement,
    message = "Expected a value of type `" + type + "`" + (refinement ? " with refinement `" + refinement + "`" : '') + ", but received: `" + print(value) + "`"
  } = result;
  return {
    value,
    type,
    refinement,
    key: path[path.length - 1],
    path,
    branch,
    ...result,
    message
  };
}
/**
 * Convert a validation result to an iterable of failures.
 */

function* toFailures(result, context, struct, value) {
  if (!isIterable(result)) {
    result = [result];
  }

  for (const r of result) {
    const failure = toFailure(r, context, struct, value);

    if (failure) {
      yield failure;
    }
  }
}
/**
 * Check a value against a struct, traversing deeply into nested values, and
 * returning an iterator of failures or success.
 */

function* run(value, struct, options) {
  if (options === void 0) {
    options = {};
  }

  const {
    path = [],
    branch = [value],
    coerce = false,
    mask = false
  } = options;
  const ctx = {
    path,
    branch
  };

  if (coerce) {
    value = struct.coercer(value, ctx);

    if (mask && struct.type !== 'type' && isObject(struct.schema) && isObject(value) && !Array.isArray(value)) {
      for (const key in value) {
        if (struct.schema[key] === undefined) {
          delete value[key];
        }
      }
    }
  }

  let valid = true;

  for (const failure of struct.validator(value, ctx)) {
    valid = false;
    yield [failure, undefined];
  }

  for (let [k, v, s] of struct.entries(value, ctx)) {
    const ts = run(v, s, {
      path: k === undefined ? path : [...path, k],
      branch: k === undefined ? branch : [...branch, v],
      coerce,
      mask
    });

    for (const t of ts) {
      if (t[0]) {
        valid = false;
        yield [t[0], undefined];
      } else if (coerce) {
        v = t[1];

        if (k === undefined) {
          value = v;
        } else if (value instanceof Map) {
          value.set(k, v);
        } else if (value instanceof Set) {
          value.add(v);
        } else if (isObject(value)) {
          value[k] = v;
        }
      }
    }
  }

  if (valid) {
    for (const failure of struct.refiner(value, ctx)) {
      valid = false;
      yield [failure, undefined];
    }
  }

  if (valid) {
    yield [undefined, value];
  }
}

/**
 * `Struct` objects encapsulate the validation logic for a specific type of
 * values. Once constructed, you use the `assert`, `is` or `validate` helpers to
 * validate unknown input data against the struct.
 */

class Struct {
  constructor(props) {
    this.TYPE = void 0;
    this.type = void 0;
    this.schema = void 0;
    this.coercer = void 0;
    this.validator = void 0;
    this.refiner = void 0;
    this.entries = void 0;
    const {
      type,
      schema,
      validator,
      refiner,
      coercer = value => value,
      entries = function* () {}
    } = props;
    this.type = type;
    this.schema = schema;
    this.entries = entries;
    this.coercer = coercer;

    if (validator) {
      this.validator = (value, context) => {
        const result = validator(value, context);
        return toFailures(result, context, this, value);
      };
    } else {
      this.validator = () => [];
    }

    if (refiner) {
      this.refiner = (value, context) => {
        const result = refiner(value, context);
        return toFailures(result, context, this, value);
      };
    } else {
      this.refiner = () => [];
    }
  }
  /**
   * Assert that a value passes the struct's validation, throwing if it doesn't.
   */


  assert(value) {
    return assert(value, this);
  }
  /**
   * Create a value with the struct's coercion logic, then validate it.
   */


  create(value) {
    return create(value, this);
  }
  /**
   * Check if a value passes the struct's validation.
   */


  is(value) {
    return is(value, this);
  }
  /**
   * Mask a value, coercing and validating it, but returning only the subset of
   * properties defined by the struct's schema.
   */


  mask(value) {
    return mask(value, this);
  }
  /**
   * Validate a value with the struct's validation logic, returning a tuple
   * representing the result.
   *
   * You may optionally pass `true` for the `withCoercion` argument to coerce
   * the value before attempting to validate it. If you do, the result will
   * contain the coerced result when successful.
   */


  validate(value, options) {
    if (options === void 0) {
      options = {};
    }

    return validate(value, this, options);
  }

}
/**
 * Assert that a value passes a struct, throwing if it doesn't.
 */

function assert(value, struct) {
  const result = validate(value, struct);

  if (result[0]) {
    throw result[0];
  }
}
/**
 * Create a value with the coercion logic of struct and validate it.
 */

function create(value, struct) {
  const result = validate(value, struct, {
    coerce: true
  });

  if (result[0]) {
    throw result[0];
  } else {
    return result[1];
  }
}
/**
 * Mask a value, returning only the subset of properties defined by a struct.
 */

function mask(value, struct) {
  const result = validate(value, struct, {
    coerce: true,
    mask: true
  });

  if (result[0]) {
    throw result[0];
  } else {
    return result[1];
  }
}
/**
 * Check if a value passes a struct.
 */

function is(value, struct) {
  const result = validate(value, struct);
  return !result[0];
}
/**
 * Validate a value against a struct, returning an error if invalid, or the
 * value (with potential coercion) if valid.
 */

function validate(value, struct, options) {
  if (options === void 0) {
    options = {};
  }

  const tuples = run(value, struct, options);
  const tuple = shiftIterator(tuples);

  if (tuple[0]) {
    const error = new StructError(tuple[0], function* () {
      for (const t of tuples) {
        if (t[0]) {
          yield t[0];
        }
      }
    });
    return [error, undefined];
  } else {
    const v = tuple[1];
    return [undefined, v];
  }
}
/**
 * Define a new struct type with a custom validation function.
 */

function define(name, validator) {
  return new Struct({
    type: name,
    schema: null,
    validator
  });
}

/**
 * Ensure that any value passes validation.
 */

function any() {
  return define('any', () => true);
}
function array(Element) {
  return new Struct({
    type: 'array',
    schema: Element,

    *entries(value) {
      if (Element && Array.isArray(value)) {
        for (const [i, v] of value.entries()) {
          yield [i, v, Element];
        }
      }
    },

    coercer(value) {
      return Array.isArray(value) ? value.slice() : value;
    },

    validator(value) {
      return Array.isArray(value) || "Expected an array value, but received: " + print(value);
    }

  });
}
/**
 * Ensure that a value is a boolean.
 */

function boolean() {
  return define('boolean', value => {
    return typeof value === 'boolean';
  });
}
function literal(constant) {
  const description = print(constant);
  return new Struct({
    type: 'literal',
    schema: constant ,

    validator(value) {
      return value === constant || "Expected the literal `" + description + "`, but received: " + print(value);
    }

  });
}
/**
 * Augment an existing struct to allow `null` values.
 */

function nullable(struct) {
  return new Struct({ ...struct,
    validator: (value, ctx) => value === null || struct.validator(value, ctx),
    refiner: (value, ctx) => value === null || struct.refiner(value, ctx)
  });
}
/**
 * Ensure that a value is a number.
 */

function number() {
  return define('number', value => {
    return typeof value === 'number' && !isNaN(value) || "Expected a number, but received: " + print(value);
  });
}
/**
 * Augment a struct to allow `undefined` values.
 */

function optional(struct) {
  return new Struct({ ...struct,
    validator: (value, ctx) => value === undefined || struct.validator(value, ctx),
    refiner: (value, ctx) => value === undefined || struct.refiner(value, ctx)
  });
}
/**
 * Ensure that a value is a string.
 */

function string() {
  return define('string', value => {
    return typeof value === 'string' || "Expected a string, but received: " + print(value);
  });
}
/**
 * Ensure that a value has a set of known properties of specific types.
 *
 * Note: Unrecognized properties are allowed and untouched. This is similar to
 * how TypeScript's structural typing works.
 */

function type(schema) {
  const keys = Object.keys(schema);
  return new Struct({
    type: 'type',
    schema,

    *entries(value) {
      if (isObject(value)) {
        for (const k of keys) {
          yield [k, value[k], schema[k]];
        }
      }
    },

    validator(value) {
      return isObject(value) || "Expected an object, but received: " + print(value);
    }

  });
}
/**
 * Ensure that a value matches one of a set of types.
 */

function union$1(Structs) {
  const description = Structs.map(s => s.type).join(' | ');
  return new Struct({
    type: 'union',
    schema: null,

    coercer(value, ctx) {
      const firstMatch = Structs.find(s => {
        const [e] = s.validate(value, {
          coerce: true
        });
        return !e;
      }) || unknown();
      return firstMatch.coercer(value, ctx);
    },

    validator(value, ctx) {
      const failures = [];

      for (const S of Structs) {
        const [...tuples] = run(value, S, ctx);
        const [first] = tuples;

        if (!first[0]) {
          return [];
        } else {
          for (const [failure] of tuples) {
            if (failure) {
              failures.push(failure);
            }
          }
        }
      }

      return ["Expected the value to satisfy a union of `" + description + "`, but received: " + print(value), ...failures];
    }

  });
}
/**
 * Ensure that any value passes validation, without widening its type to `any`.
 */

function unknown() {
  return define('unknown', () => true);
}

/**
 * Augment a `Struct` to add an additional coercion step to its input.
 *
 * This allows you to transform input data before validating it, to increase the
 * likelihood that it passes validation—for example for default values, parsing
 * different formats, etc.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */

function coerce(struct, condition, coercer) {
  return new Struct({ ...struct,
    coercer: (value, ctx) => {
      return is(value, condition) ? struct.coercer(coercer(value, ctx), ctx) : struct.coercer(value, ctx);
    }
  });
}
const GET_MULTIPLE_ACCOUNTS_LIMIT = 99;
async function getMultipleAccountsAndContext(connection, publicKeys, commitment) {
    if (publicKeys.length <= GET_MULTIPLE_ACCOUNTS_LIMIT) {
        return await getMultipleAccountsAndContextCore(connection, publicKeys, commitment);
    }
    else {
        const batches = chunks(publicKeys, GET_MULTIPLE_ACCOUNTS_LIMIT);
        const results = await Promise.all(batches.map((batch) => getMultipleAccountsAndContextCore(connection, batch, commitment)));
        return results.flat();
    }
}
async function getMultipleAccountsAndContextCore(connection, publicKeys, commitmentOverride) {
    const commitment = commitmentOverride !== null && commitmentOverride !== void 0 ? commitmentOverride : connection.commitment;
    const { value: accountInfos, context } = await connection.getMultipleAccountsInfoAndContext(publicKeys, commitment);
    const accounts = accountInfos.map((account, idx) => {
        if (account === null) {
            return null;
        }
        return {
            publicKey: publicKeys[idx],
            account,
            context,
        };
    });
    return accounts;
}
// copy from @solana/web3.js that has a commitment param
async function simulateTransaction(connection, transaction, signers, commitment, includeAccounts) {
    var _a;
    if (signers && signers.length > 0) {
        transaction.sign(...signers);
    }
    // @ts-expect-error
    const message = transaction._compile();
    const signData = message.serialize();
    // @ts-expect-error
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString("base64");
    const config = {
        encoding: "base64",
        commitment: commitment !== null && commitment !== void 0 ? commitment : connection.commitment,
    };
    if (includeAccounts) {
        const addresses = (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds()).map((key) => key.toBase58());
        config["accounts"] = {
            encoding: "base64",
            addresses,
        };
    }
    if (signers && signers.length > 0) {
        config.sigVerify = true;
    }
    const args = [encodedTransaction, config];
    // @ts-expect-error
    const unsafeRes = await connection._rpcRequest("simulateTransaction", args);
    const res = create(unsafeRes, SimulatedTransactionResponseStruct);
    if ("error" in res) {
        let logs;
        if ("data" in res.error) {
            logs = (_a = res.error.data) === null || _a === void 0 ? void 0 : _a.logs;
            if (logs && Array.isArray(logs)) {
                const traceIndent = "\n    ";
                const logTrace = traceIndent + logs.join(traceIndent);
                console.error(res.error.message, logTrace);
            }
        }
        throw new SendTransactionError("failed to simulate transaction: " + res.error.message, logs);
    }
    return res.result;
}
// copy from @solana/web3.js
function jsonRpcResult(schema) {
    return coerce(createRpcResult(schema), UnknownRpcResult, (value) => {
        if ("error" in value) {
            return value;
        }
        else {
            return {
                ...value,
                result: create(value.result, schema),
            };
        }
    });
}
// copy from @solana/web3.js
const UnknownRpcResult = createRpcResult(unknown());
// copy from @solana/web3.js
function createRpcResult(result) {
    return union$1([
        type({
            jsonrpc: literal("2.0"),
            id: string(),
            result,
        }),
        type({
            jsonrpc: literal("2.0"),
            id: string(),
            error: type({
                code: unknown(),
                message: string(),
                data: optional(any()),
            }),
        }),
    ]);
}
// copy from @solana/web3.js
function jsonRpcResultAndContext(value) {
    return jsonRpcResult(type({
        context: type({
            slot: number(),
        }),
        value,
    }));
}
// copy from @solana/web3.js
const SimulatedTransactionResponseStruct = jsonRpcResultAndContext(type({
    err: nullable(union$1([type({}), string()])),
    logs: nullable(array(string())),
    accounts: optional(nullable(array(nullable(type({
        executable: boolean(),
        owner: string(),
        lamports: number(),
        data: array(string()),
        rentEpoch: optional(number()),
    }))))),
    unitsConsumed: optional(number()),
}));

/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 */
class AnchorProvider {
    /**
     * @param connection The cluster connection where the program is deployed.
     * @param wallet     The wallet used to pay for and sign all transactions.
     * @param opts       Transaction confirmation options to use by default.
     */
    constructor(connection, wallet, opts = AnchorProvider.defaultOptions()) {
        this.connection = connection;
        this.wallet = wallet;
        this.opts = opts;
        this.publicKey = wallet === null || wallet === void 0 ? void 0 : wallet.publicKey;
    }
    static defaultOptions() {
        return {
            preflightCommitment: "processed",
            commitment: "processed",
        };
    }
    /**
     * Returns a `Provider` with a wallet read from the local filesystem.
     *
     * @param url  The network cluster url.
     * @param opts The default transaction confirmation options.
     *
     * (This api is for Node only.)
     */
    static local(url, opts = AnchorProvider.defaultOptions()) {
        {
            throw new Error(`Provider local is not available on browser.`);
        }
    }
    /**
     * Returns a `Provider` read from the `ANCHOR_PROVIDER_URL` environment
     * variable
     *
     * (This api is for Node only.)
     */
    static env() {
        {
            throw new Error(`Provider env is not available on browser.`);
        }
    }
    /**
     * Sends the given transaction, paid for and signed by the provider's wallet.
     *
     * @param tx      The transaction to send.
     * @param signers The signers of the transaction.
     * @param opts    Transaction confirmation options.
     */
    async sendAndConfirm(tx, signers, opts) {
        var _a, _b, _c, _d;
        if (opts === undefined) {
            opts = this.opts;
        }
        if (isVersionedTransaction(tx)) {
            if (signers) {
                tx.sign(signers);
            }
        }
        else {
            tx.feePayer = (_a = tx.feePayer) !== null && _a !== void 0 ? _a : this.wallet.publicKey;
            tx.recentBlockhash = (await this.connection.getLatestBlockhash(opts.preflightCommitment)).blockhash;
            if (signers) {
                for (const signer of signers) {
                    tx.partialSign(signer);
                }
            }
        }
        tx = await this.wallet.signTransaction(tx);
        const rawTx = tx.serialize();
        try {
            return await sendAndConfirmRawTransaction(this.connection, rawTx, opts);
        }
        catch (err) {
            // thrown if the underlying 'confirmTransaction' encounters a failed tx
            // the 'confirmTransaction' error does not return logs so we make another rpc call to get them
            if (err instanceof ConfirmError) {
                // choose the shortest available commitment for 'getTransaction'
                // (the json RPC does not support any shorter than "confirmed" for 'getTransaction')
                // because that will see the tx sent with `sendAndConfirmRawTransaction` no matter which
                // commitment `sendAndConfirmRawTransaction` used
                const txSig = encode$1(isVersionedTransaction(tx)
                    ? ((_b = tx.signatures) === null || _b === void 0 ? void 0 : _b[0]) || new Uint8Array()
                    : (_c = tx.signature) !== null && _c !== void 0 ? _c : new Uint8Array());
                const maxVer = isVersionedTransaction(tx) ? 0 : undefined;
                const failedTx = await this.connection.getTransaction(txSig, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: maxVer,
                });
                if (!failedTx) {
                    throw err;
                }
                else {
                    const logs = (_d = failedTx.meta) === null || _d === void 0 ? void 0 : _d.logMessages;
                    throw !logs ? err : new SendTransactionError(err.message, logs);
                }
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Similar to `send`, but for an array of transactions and signers.
     * All transactions need to be of the same type, it doesn't support a mix of `VersionedTransaction`s and `Transaction`s.
     *
     * @param txWithSigners Array of transactions and signers.
     * @param opts          Transaction confirmation options.
     */
    async sendAll(txWithSigners, opts) {
        var _a, _b, _c;
        if (opts === undefined) {
            opts = this.opts;
        }
        const recentBlockhash = (await this.connection.getLatestBlockhash(opts.preflightCommitment)).blockhash;
        let txs = txWithSigners.map((r) => {
            var _a, _b;
            if (isVersionedTransaction(r.tx)) {
                let tx = r.tx;
                if (r.signers) {
                    tx.sign(r.signers);
                }
                return tx;
            }
            else {
                let tx = r.tx;
                let signers = (_a = r.signers) !== null && _a !== void 0 ? _a : [];
                tx.feePayer = (_b = tx.feePayer) !== null && _b !== void 0 ? _b : this.wallet.publicKey;
                tx.recentBlockhash = recentBlockhash;
                signers.forEach((kp) => {
                    tx.partialSign(kp);
                });
                return tx;
            }
        });
        const signedTxs = await this.wallet.signAllTransactions(txs);
        const sigs = [];
        for (let k = 0; k < txs.length; k += 1) {
            const tx = signedTxs[k];
            const rawTx = tx.serialize();
            try {
                sigs.push(await sendAndConfirmRawTransaction(this.connection, rawTx, opts));
            }
            catch (err) {
                // thrown if the underlying 'confirmTransaction' encounters a failed tx
                // the 'confirmTransaction' error does not return logs so we make another rpc call to get them
                if (err instanceof ConfirmError) {
                    // choose the shortest available commitment for 'getTransaction'
                    // (the json RPC does not support any shorter than "confirmed" for 'getTransaction')
                    // because that will see the tx sent with `sendAndConfirmRawTransaction` no matter which
                    // commitment `sendAndConfirmRawTransaction` used
                    const txSig = encode$1(isVersionedTransaction(tx)
                        ? ((_a = tx.signatures) === null || _a === void 0 ? void 0 : _a[0]) || new Uint8Array()
                        : (_b = tx.signature) !== null && _b !== void 0 ? _b : new Uint8Array());
                    const maxVer = isVersionedTransaction(tx) ? 0 : undefined;
                    const failedTx = await this.connection.getTransaction(txSig, {
                        commitment: "confirmed",
                        maxSupportedTransactionVersion: maxVer,
                    });
                    if (!failedTx) {
                        throw err;
                    }
                    else {
                        const logs = (_c = failedTx.meta) === null || _c === void 0 ? void 0 : _c.logMessages;
                        throw !logs ? err : new SendTransactionError(err.message, logs);
                    }
                }
                else {
                    throw err;
                }
            }
        }
        return sigs;
    }
    /**
     * Simulates the given transaction, returning emitted logs from execution.
     *
     * @param tx      The transaction to send.
     * @param signers The signers of the transaction. If unset, the transaction
     *                will be simulated with the "sigVerify: false" option. This
     *                allows for simulation of transactions without asking the
     *                wallet for a signature.
     * @param opts    Transaction confirmation options.
     */
    async simulate(tx, signers, commitment, includeAccounts) {
        let recentBlockhash = (await this.connection.getLatestBlockhash(commitment !== null && commitment !== void 0 ? commitment : this.connection.commitment)).blockhash;
        let result;
        if (isVersionedTransaction(tx)) {
            if (signers && signers.length > 0) {
                tx.sign(signers);
                tx = await this.wallet.signTransaction(tx);
            }
            // Doesn't support includeAccounts which has been changed to something
            // else in later versions of this function.
            result = await this.connection.simulateTransaction(tx, { commitment });
        }
        else {
            tx.feePayer = tx.feePayer || this.wallet.publicKey;
            tx.recentBlockhash = recentBlockhash;
            if (signers && signers.length > 0) {
                tx = await this.wallet.signTransaction(tx);
            }
            result = await simulateTransaction(this.connection, tx, signers, commitment, includeAccounts);
        }
        if (result.value.err) {
            throw new SimulateError(result.value);
        }
        return result.value;
    }
}
class SimulateError extends Error {
    constructor(simulationResponse, message) {
        super(message);
        this.simulationResponse = simulationResponse;
    }
}
// Copy of Connection.sendAndConfirmRawTransaction that throws
// a better error if 'confirmTransaction` returns an error status
async function sendAndConfirmRawTransaction(connection, rawTransaction, options) {
    const sendOptions = options
        ? {
            skipPreflight: options.skipPreflight,
            preflightCommitment: options.preflightCommitment || options.commitment,
            maxRetries: options.maxRetries,
            minContextSlot: options.minContextSlot,
        }
        : {};
    let status;
    const startTime = Date.now();
    while (Date.now() - startTime < 60000) {
        try {
            const signature = await connection.sendRawTransaction(rawTransaction, sendOptions);
            if (options === null || options === void 0 ? void 0 : options.blockhash) {
                if (sendOptions.maxRetries === 0) {
                    const abortSignal = AbortSignal.timeout(15000);
                    status = (await connection.confirmTransaction({ abortSignal, signature, ...options.blockhash }, options && options.commitment)).value;
                }
                else {
                    status = (await connection.confirmTransaction({ signature, ...options.blockhash }, options && options.commitment)).value;
                }
            }
            else {
                status = (await connection.confirmTransaction(signature, options && options.commitment)).value;
            }
            if (status.err) {
                throw new ConfirmError(`Raw transaction ${signature} failed (${JSON.stringify(status)})`);
            }
            return signature;
        }
        catch (err) {
            if (err.name === "TimeoutError") {
                continue;
            }
            throw err;
        }
    }
    throw Error("Transaction failed to confirm in 60s");
}
class ConfirmError extends Error {
    constructor(message) {
        super(message);
    }
}
/**
 * Returns the default provider being used by the client.
 */
function getProvider() {
    {
        return AnchorProvider.local();
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var dist = {};

// Instruction errors.
Object.defineProperty(dist, "__esModule", { value: true });
var ANCHOR_ERROR__REQUIRE_EQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_EQ_VIOLATED = ANCHOR_ERROR__REQUIRE_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_VIOLATED = ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_PROGRAM_ID = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_PROGRAM_ID = ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION = ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION_DELEGATE = dist.ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION_DELEGATE = ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION = ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION = ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_METADATA_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_METADATA_ADDRESS = ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_MEMBER_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_MEMBER_ADDRESS = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_GROUP_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_GROUP_ADDRESS = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION = ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_TOKEN_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_TOKEN_TOKEN_PROGRAM = ANCHOR_ERROR__CONSTRAINT_MINT_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TOKEN_PROGRAM = ANCHOR_ERROR__CONSTRAINT_TOKEN_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_TOKEN_PROGRAM = ANCHOR_ERROR__CONSTRAINT_ACCOUNT_IS_NONE = dist.ANCHOR_ERROR__CONSTRAINT_ACCOUNT_IS_NONE = ANCHOR_ERROR__CONSTRAINT_SPACE = dist.ANCHOR_ERROR__CONSTRAINT_SPACE = ANCHOR_ERROR__CONSTRAINT_MINT_DECIMALS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_DECIMALS = ANCHOR_ERROR__CONSTRAINT_MINT_FREEZE_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_FREEZE_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_MINT_MINT_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_MINT_AUTHORITY = ANCHOR_ERROR__CONSTRAINT_TOKEN_OWNER = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_OWNER = ANCHOR_ERROR__CONSTRAINT_TOKEN_MINT = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_MINT = ANCHOR_ERROR__CONSTRAINT_ZERO = dist.ANCHOR_ERROR__CONSTRAINT_ZERO = ANCHOR_ERROR__CONSTRAINT_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_ADDRESS = ANCHOR_ERROR__CONSTRAINT_CLOSE = dist.ANCHOR_ERROR__CONSTRAINT_CLOSE = ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_INIT = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_INIT = ANCHOR_ERROR__CONSTRAINT_ASSOCIATED = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED = ANCHOR_ERROR__CONSTRAINT_STATE = dist.ANCHOR_ERROR__CONSTRAINT_STATE = ANCHOR_ERROR__CONSTRAINT_EXECUTABLE = dist.ANCHOR_ERROR__CONSTRAINT_EXECUTABLE = ANCHOR_ERROR__CONSTRAINT_SEEDS = dist.ANCHOR_ERROR__CONSTRAINT_SEEDS = ANCHOR_ERROR__CONSTRAINT_RENT_EXEMPT = dist.ANCHOR_ERROR__CONSTRAINT_RENT_EXEMPT = ANCHOR_ERROR__CONSTRAINT_OWNER = dist.ANCHOR_ERROR__CONSTRAINT_OWNER = ANCHOR_ERROR__CONSTRAINT_RAW = dist.ANCHOR_ERROR__CONSTRAINT_RAW = ANCHOR_ERROR__CONSTRAINT_SIGNER = dist.ANCHOR_ERROR__CONSTRAINT_SIGNER = ANCHOR_ERROR__CONSTRAINT_HAS_ONE = dist.ANCHOR_ERROR__CONSTRAINT_HAS_ONE = ANCHOR_ERROR__CONSTRAINT_MUT = dist.ANCHOR_ERROR__CONSTRAINT_MUT = ANCHOR_ERROR__EVENT_INSTRUCTION_STUB = dist.ANCHOR_ERROR__EVENT_INSTRUCTION_STUB = ANCHOR_ERROR__IDL_ACCOUNT_NOT_EMPTY = dist.ANCHOR_ERROR__IDL_ACCOUNT_NOT_EMPTY = ANCHOR_ERROR__IDL_INSTRUCTION_INVALID_PROGRAM = dist.ANCHOR_ERROR__IDL_INSTRUCTION_INVALID_PROGRAM = ANCHOR_ERROR__IDL_INSTRUCTION_STUB = dist.ANCHOR_ERROR__IDL_INSTRUCTION_STUB = ANCHOR_ERROR__INSTRUCTION_DID_NOT_SERIALIZE = dist.ANCHOR_ERROR__INSTRUCTION_DID_NOT_SERIALIZE = ANCHOR_ERROR__INSTRUCTION_DID_NOT_DESERIALIZE = dist.ANCHOR_ERROR__INSTRUCTION_DID_NOT_DESERIALIZE = ANCHOR_ERROR__INSTRUCTION_FALLBACK_NOT_FOUND = dist.ANCHOR_ERROR__INSTRUCTION_FALLBACK_NOT_FOUND = ANCHOR_ERROR__INSTRUCTION_MISSING = dist.ANCHOR_ERROR__INSTRUCTION_MISSING = void 0;
var ANCHOR_ERROR__DEPRECATED = dist.ANCHOR_ERROR__DEPRECATED = ANCHOR_ERROR__INVALID_NUMERIC_CONVERSION = dist.ANCHOR_ERROR__INVALID_NUMERIC_CONVERSION = ANCHOR_ERROR__TRYING_TO_INIT_PAYER_AS_PROGRAM_ACCOUNT = dist.ANCHOR_ERROR__TRYING_TO_INIT_PAYER_AS_PROGRAM_ACCOUNT = ANCHOR_ERROR__DECLARED_PROGRAM_ID_MISMATCH = dist.ANCHOR_ERROR__DECLARED_PROGRAM_ID_MISMATCH = ANCHOR_ERROR__ACCOUNT_DUPLICATE_REALLOCS = dist.ANCHOR_ERROR__ACCOUNT_DUPLICATE_REALLOCS = ANCHOR_ERROR__ACCOUNT_REALLOC_EXCEEDS_LIMIT = dist.ANCHOR_ERROR__ACCOUNT_REALLOC_EXCEEDS_LIMIT = ANCHOR_ERROR__ACCOUNT_SYSVAR_MISMATCH = dist.ANCHOR_ERROR__ACCOUNT_SYSVAR_MISMATCH = ANCHOR_ERROR__ACCOUNT_NOT_ASSOCIATED_TOKEN_ACCOUNT = dist.ANCHOR_ERROR__ACCOUNT_NOT_ASSOCIATED_TOKEN_ACCOUNT = ANCHOR_ERROR__ACCOUNT_NOT_PROGRAM_DATA = dist.ANCHOR_ERROR__ACCOUNT_NOT_PROGRAM_DATA = ANCHOR_ERROR__ACCOUNT_NOT_INITIALIZED = dist.ANCHOR_ERROR__ACCOUNT_NOT_INITIALIZED = ANCHOR_ERROR__ACCOUNT_NOT_SYSTEM_OWNED = dist.ANCHOR_ERROR__ACCOUNT_NOT_SYSTEM_OWNED = ANCHOR_ERROR__ACCOUNT_NOT_SIGNER = dist.ANCHOR_ERROR__ACCOUNT_NOT_SIGNER = ANCHOR_ERROR__INVALID_PROGRAM_EXECUTABLE = dist.ANCHOR_ERROR__INVALID_PROGRAM_EXECUTABLE = ANCHOR_ERROR__INVALID_PROGRAM_ID = dist.ANCHOR_ERROR__INVALID_PROGRAM_ID = ANCHOR_ERROR__ACCOUNT_OWNED_BY_WRONG_PROGRAM = dist.ANCHOR_ERROR__ACCOUNT_OWNED_BY_WRONG_PROGRAM = ANCHOR_ERROR__ACCOUNT_NOT_MUTABLE = dist.ANCHOR_ERROR__ACCOUNT_NOT_MUTABLE = ANCHOR_ERROR__ACCOUNT_NOT_ENOUGH_KEYS = dist.ANCHOR_ERROR__ACCOUNT_NOT_ENOUGH_KEYS = ANCHOR_ERROR__ACCOUNT_DID_NOT_SERIALIZE = dist.ANCHOR_ERROR__ACCOUNT_DID_NOT_SERIALIZE = ANCHOR_ERROR__ACCOUNT_DID_NOT_DESERIALIZE = dist.ANCHOR_ERROR__ACCOUNT_DID_NOT_DESERIALIZE = ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_MISMATCH = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_MISMATCH = ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_NOT_FOUND = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_NOT_FOUND = ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_ALREADY_SET = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_ALREADY_SET = ANCHOR_ERROR__REQUIRE_GTE_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_GTE_VIOLATED = ANCHOR_ERROR__REQUIRE_GT_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_GT_VIOLATED = ANCHOR_ERROR__REQUIRE_KEYS_NEQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_KEYS_NEQ_VIOLATED = ANCHOR_ERROR__REQUIRE_NEQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_NEQ_VIOLATED = ANCHOR_ERROR__REQUIRE_KEYS_EQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_KEYS_EQ_VIOLATED = void 0;
/** 8 byte instruction identifier not provided. */
var ANCHOR_ERROR__INSTRUCTION_MISSING = dist.ANCHOR_ERROR__INSTRUCTION_MISSING = 100;
/** Fallback functions are not supported. */
var ANCHOR_ERROR__INSTRUCTION_FALLBACK_NOT_FOUND = dist.ANCHOR_ERROR__INSTRUCTION_FALLBACK_NOT_FOUND = 101;
/** The program could not deserialize the given instruction. */
var ANCHOR_ERROR__INSTRUCTION_DID_NOT_DESERIALIZE = dist.ANCHOR_ERROR__INSTRUCTION_DID_NOT_DESERIALIZE = 102;
/** The program could not serialize the given instruction. */
var ANCHOR_ERROR__INSTRUCTION_DID_NOT_SERIALIZE = dist.ANCHOR_ERROR__INSTRUCTION_DID_NOT_SERIALIZE = 103;
// IDL instruction errors.
/** The program was compiled without idl instructions. */
var ANCHOR_ERROR__IDL_INSTRUCTION_STUB = dist.ANCHOR_ERROR__IDL_INSTRUCTION_STUB = 1000;
/** The transaction was given an invalid program for the IDL instruction. */
var ANCHOR_ERROR__IDL_INSTRUCTION_INVALID_PROGRAM = dist.ANCHOR_ERROR__IDL_INSTRUCTION_INVALID_PROGRAM = 1001;
/** IDL account must be empty in order to resize, try closing first. */
var ANCHOR_ERROR__IDL_ACCOUNT_NOT_EMPTY = dist.ANCHOR_ERROR__IDL_ACCOUNT_NOT_EMPTY = 1002;
// Event instructions.
/** The program was compiled without `event-cpi` feature. */
var ANCHOR_ERROR__EVENT_INSTRUCTION_STUB = dist.ANCHOR_ERROR__EVENT_INSTRUCTION_STUB = 1500;
// Constraint errors.
/** A mut constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MUT = dist.ANCHOR_ERROR__CONSTRAINT_MUT = 2000;
/** A has one constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_HAS_ONE = dist.ANCHOR_ERROR__CONSTRAINT_HAS_ONE = 2001;
/** A signer constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_SIGNER = dist.ANCHOR_ERROR__CONSTRAINT_SIGNER = 2002;
/** A raw constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_RAW = dist.ANCHOR_ERROR__CONSTRAINT_RAW = 2003;
/** An owner constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_OWNER = dist.ANCHOR_ERROR__CONSTRAINT_OWNER = 2004;
/** A rent exemption constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_RENT_EXEMPT = dist.ANCHOR_ERROR__CONSTRAINT_RENT_EXEMPT = 2005;
/** A seeds constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_SEEDS = dist.ANCHOR_ERROR__CONSTRAINT_SEEDS = 2006;
/** An executable constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_EXECUTABLE = dist.ANCHOR_ERROR__CONSTRAINT_EXECUTABLE = 2007;
/** Deprecated Error, feel free to replace with something else. */
var ANCHOR_ERROR__CONSTRAINT_STATE = dist.ANCHOR_ERROR__CONSTRAINT_STATE = 2008;
/** An associated constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_ASSOCIATED = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED = 2009;
/** An associated init constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_INIT = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_INIT = 2010;
/** A close constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_CLOSE = dist.ANCHOR_ERROR__CONSTRAINT_CLOSE = 2011;
/** An address constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_ADDRESS = 2012;
/** Expected zero account discriminant. */
var ANCHOR_ERROR__CONSTRAINT_ZERO = dist.ANCHOR_ERROR__CONSTRAINT_ZERO = 2013;
/** A token mint constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_TOKEN_MINT = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_MINT = 2014;
/** A token owner constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_TOKEN_OWNER = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_OWNER = 2015;
/** A mint mint authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_MINT_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_MINT_AUTHORITY = 2016;
/** A mint freeze authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_FREEZE_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_FREEZE_AUTHORITY = 2017;
/** A mint decimals constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_DECIMALS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_DECIMALS = 2018;
/** A space constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_SPACE = dist.ANCHOR_ERROR__CONSTRAINT_SPACE = 2019;
/** A required account for the constraint is None. */
var ANCHOR_ERROR__CONSTRAINT_ACCOUNT_IS_NONE = dist.ANCHOR_ERROR__CONSTRAINT_ACCOUNT_IS_NONE = 2020;
/** A token account token program constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_TOKEN_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_TOKEN_TOKEN_PROGRAM = 2021;
/** A mint token program constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TOKEN_PROGRAM = 2022;
/** An associated token account token program constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_TOKEN_TOKEN_PROGRAM = dist.ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_TOKEN_TOKEN_PROGRAM = 2023;
/** A group pointer extension constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION = 2024;
/** A group pointer extension authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_AUTHORITY = 2025;
/** A group pointer extension group address constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_GROUP_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_GROUP_ADDRESS = 2026;
/** A group member pointer extension constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION = 2027;
/** A group member pointer extension authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_AUTHORITY = 2028;
/** A group member pointer extension group address constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_MEMBER_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_MEMBER_ADDRESS = 2029;
/** A metadata pointer extension constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION = 2030;
/** A metadata pointer extension authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_AUTHORITY = 2031;
/** A metadata pointer extension metadata address constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_METADATA_ADDRESS = dist.ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_METADATA_ADDRESS = 2032;
/** A close authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION = 2033;
/** A close authority extension authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION_AUTHORITY = 2034;
/** A permanent delegate extension constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION = 2035;
/** A permanent delegate extension delegate constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION_DELEGATE = dist.ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION_DELEGATE = 2036;
/** A transfer hook extension constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION = 2037;
/** A transfer hook extension authority constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_AUTHORITY = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_AUTHORITY = 2038;
/** A transfer hook extension transfer hook program id constraint was violated. */
var ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_PROGRAM_ID = dist.ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_PROGRAM_ID = 2039;
// Require errors.
/** A require expression was violated. */
var ANCHOR_ERROR__REQUIRE_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_VIOLATED = 2500;
/** A require_eq expression was violated. */
ANCHOR_ERROR__REQUIRE_EQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_EQ_VIOLATED = 2501;
/** A require_keys_eq expression was violated. */
var ANCHOR_ERROR__REQUIRE_KEYS_EQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_KEYS_EQ_VIOLATED = 2502;
/** A require_neq expression was violated. */
var ANCHOR_ERROR__REQUIRE_NEQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_NEQ_VIOLATED = 2503;
/** A require_keys_neq expression was violated. */
var ANCHOR_ERROR__REQUIRE_KEYS_NEQ_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_KEYS_NEQ_VIOLATED = 2504;
/** A require_gt expression was violated. */
var ANCHOR_ERROR__REQUIRE_GT_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_GT_VIOLATED = 2505;
/** A require_gte expression was violated. */
var ANCHOR_ERROR__REQUIRE_GTE_VIOLATED = dist.ANCHOR_ERROR__REQUIRE_GTE_VIOLATED = 2506;
// Account errors.
/** The account discriminator was already set on this account. */
var ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_ALREADY_SET = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_ALREADY_SET = 3000;
/** No 8 byte discriminator was found on the account. */
var ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_NOT_FOUND = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_NOT_FOUND = 3001;
/** 8 byte discriminator did not match what was expected. */
var ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_MISMATCH = dist.ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_MISMATCH = 3002;
/** Failed to deserialize the account. */
var ANCHOR_ERROR__ACCOUNT_DID_NOT_DESERIALIZE = dist.ANCHOR_ERROR__ACCOUNT_DID_NOT_DESERIALIZE = 3003;
/** Failed to serialize the account. */
var ANCHOR_ERROR__ACCOUNT_DID_NOT_SERIALIZE = dist.ANCHOR_ERROR__ACCOUNT_DID_NOT_SERIALIZE = 3004;
/** Not enough account keys given to the instruction. */
var ANCHOR_ERROR__ACCOUNT_NOT_ENOUGH_KEYS = dist.ANCHOR_ERROR__ACCOUNT_NOT_ENOUGH_KEYS = 3005;
/** The given account is not mutable. */
var ANCHOR_ERROR__ACCOUNT_NOT_MUTABLE = dist.ANCHOR_ERROR__ACCOUNT_NOT_MUTABLE = 3006;
/** The given account is owned by a different program than expected. */
var ANCHOR_ERROR__ACCOUNT_OWNED_BY_WRONG_PROGRAM = dist.ANCHOR_ERROR__ACCOUNT_OWNED_BY_WRONG_PROGRAM = 3007;
/** Program ID was not as expected. */
var ANCHOR_ERROR__INVALID_PROGRAM_ID = dist.ANCHOR_ERROR__INVALID_PROGRAM_ID = 3008;
/** Program account is not executable. */
var ANCHOR_ERROR__INVALID_PROGRAM_EXECUTABLE = dist.ANCHOR_ERROR__INVALID_PROGRAM_EXECUTABLE = 3009;
/** The given account did not sign. */
var ANCHOR_ERROR__ACCOUNT_NOT_SIGNER = dist.ANCHOR_ERROR__ACCOUNT_NOT_SIGNER = 3010;
/** The given account is not owned by the system program. */
var ANCHOR_ERROR__ACCOUNT_NOT_SYSTEM_OWNED = dist.ANCHOR_ERROR__ACCOUNT_NOT_SYSTEM_OWNED = 3011;
/** The program expected this account to be already initialized. */
var ANCHOR_ERROR__ACCOUNT_NOT_INITIALIZED = dist.ANCHOR_ERROR__ACCOUNT_NOT_INITIALIZED = 3012;
/** The given account is not a program data account. */
var ANCHOR_ERROR__ACCOUNT_NOT_PROGRAM_DATA = dist.ANCHOR_ERROR__ACCOUNT_NOT_PROGRAM_DATA = 3013;
/** The given account is not the associated token account. */
var ANCHOR_ERROR__ACCOUNT_NOT_ASSOCIATED_TOKEN_ACCOUNT = dist.ANCHOR_ERROR__ACCOUNT_NOT_ASSOCIATED_TOKEN_ACCOUNT = 3014;
/** The given public key does not match the required sysvar. */
var ANCHOR_ERROR__ACCOUNT_SYSVAR_MISMATCH = dist.ANCHOR_ERROR__ACCOUNT_SYSVAR_MISMATCH = 3015;
/** The account reallocation exceeds the MAX_PERMITTED_DATA_INCREASE limit. */
var ANCHOR_ERROR__ACCOUNT_REALLOC_EXCEEDS_LIMIT = dist.ANCHOR_ERROR__ACCOUNT_REALLOC_EXCEEDS_LIMIT = 3016;
/** The account was duplicated for more than one reallocation. */
var ANCHOR_ERROR__ACCOUNT_DUPLICATE_REALLOCS = dist.ANCHOR_ERROR__ACCOUNT_DUPLICATE_REALLOCS = 3017;
// Miscellaneous errors.
/** The declared program id does not match the actual program id. */
var ANCHOR_ERROR__DECLARED_PROGRAM_ID_MISMATCH = dist.ANCHOR_ERROR__DECLARED_PROGRAM_ID_MISMATCH = 4100;
/** You cannot/should not initialize the payer account as a program account. */
var ANCHOR_ERROR__TRYING_TO_INIT_PAYER_AS_PROGRAM_ACCOUNT = dist.ANCHOR_ERROR__TRYING_TO_INIT_PAYER_AS_PROGRAM_ACCOUNT = 4101;
/** The program could not perform the numeric conversion, out of range integral type conversion attempted. */
var ANCHOR_ERROR__INVALID_NUMERIC_CONVERSION = dist.ANCHOR_ERROR__INVALID_NUMERIC_CONVERSION = 4102;
// Deprecated errors.
/** The API being used is deprecated and should no longer be used. */
ANCHOR_ERROR__DEPRECATED = dist.ANCHOR_ERROR__DEPRECATED = 5000;
const _FEATURES = new Map();
function isSet(key) {
    return _FEATURES.get(key) !== undefined;
}

class IdlError extends Error {
    constructor(message) {
        super(message);
        this.name = "IdlError";
    }
}
class ProgramErrorStack {
    constructor(stack) {
        this.stack = stack;
    }
    static parse(logs) {
        var _a;
        const programKeyRegex = /^Program (\w*) invoke/;
        const successRegex = /^Program \w* success/;
        const programStack = [];
        for (let i = 0; i < logs.length; i++) {
            if (successRegex.exec(logs[i])) {
                programStack.pop();
                continue;
            }
            const programKey = (_a = programKeyRegex.exec(logs[i])) === null || _a === void 0 ? void 0 : _a[1];
            if (!programKey) {
                continue;
            }
            programStack.push(new PublicKey(programKey));
        }
        return new ProgramErrorStack(programStack);
    }
}
class AnchorError extends Error {
    constructor(errorCode, errorMessage, errorLogs, logs, origin, comparedValues) {
        super(errorLogs.join("\n").replace("Program log: ", ""));
        this.errorLogs = errorLogs;
        this.logs = logs;
        this.error = { errorCode, errorMessage, comparedValues, origin };
        this._programErrorStack = ProgramErrorStack.parse(logs);
    }
    static parse(logs) {
        if (!logs) {
            return null;
        }
        const anchorErrorLogIndex = logs.findIndex((log) => log.startsWith("Program log: AnchorError"));
        if (anchorErrorLogIndex === -1) {
            return null;
        }
        const anchorErrorLog = logs[anchorErrorLogIndex];
        const errorLogs = [anchorErrorLog];
        let comparedValues;
        if (anchorErrorLogIndex + 1 < logs.length) {
            // This catches the comparedValues where the following is logged
            // <AnchorError>
            // Left:
            // <Pubkey>
            // Right:
            // <Pubkey>
            if (logs[anchorErrorLogIndex + 1] === "Program log: Left:") {
                const pubkeyRegex = /^Program log: (.*)$/;
                const leftPubkey = pubkeyRegex.exec(logs[anchorErrorLogIndex + 2])[1];
                const rightPubkey = pubkeyRegex.exec(logs[anchorErrorLogIndex + 4])[1];
                comparedValues = [
                    new PublicKey(leftPubkey),
                    new PublicKey(rightPubkey),
                ];
                errorLogs.push(...logs.slice(anchorErrorLogIndex + 1, anchorErrorLogIndex + 5));
            }
            // This catches the comparedValues where the following is logged
            // <AnchorError>
            // Left: <value>
            // Right: <value>
            else if (logs[anchorErrorLogIndex + 1].startsWith("Program log: Left:")) {
                const valueRegex = /^Program log: (Left|Right): (.*)$/;
                const leftValue = valueRegex.exec(logs[anchorErrorLogIndex + 1])[2];
                const rightValue = valueRegex.exec(logs[anchorErrorLogIndex + 2])[2];
                errorLogs.push(...logs.slice(anchorErrorLogIndex + 1, anchorErrorLogIndex + 3));
                comparedValues = [leftValue, rightValue];
            }
        }
        const regexNoInfo = /^Program log: AnchorError occurred\. Error Code: (.*)\. Error Number: (\d*)\. Error Message: (.*)\./;
        const noInfoAnchorErrorLog = regexNoInfo.exec(anchorErrorLog);
        const regexFileLine = /^Program log: AnchorError thrown in (.*):(\d*)\. Error Code: (.*)\. Error Number: (\d*)\. Error Message: (.*)\./;
        const fileLineAnchorErrorLog = regexFileLine.exec(anchorErrorLog);
        const regexAccountName = /^Program log: AnchorError caused by account: (.*)\. Error Code: (.*)\. Error Number: (\d*)\. Error Message: (.*)\./;
        const accountNameAnchorErrorLog = regexAccountName.exec(anchorErrorLog);
        if (noInfoAnchorErrorLog) {
            const [errorCodeString, errorNumber, errorMessage] = noInfoAnchorErrorLog.slice(1, 4);
            const errorCode = {
                code: errorCodeString,
                number: parseInt(errorNumber),
            };
            return new AnchorError(errorCode, errorMessage, errorLogs, logs, undefined, comparedValues);
        }
        else if (fileLineAnchorErrorLog) {
            const [file, line, errorCodeString, errorNumber, errorMessage] = fileLineAnchorErrorLog.slice(1, 6);
            const errorCode = {
                code: errorCodeString,
                number: parseInt(errorNumber),
            };
            const fileLine = { file, line: parseInt(line) };
            return new AnchorError(errorCode, errorMessage, errorLogs, logs, fileLine, comparedValues);
        }
        else if (accountNameAnchorErrorLog) {
            const [accountName, errorCodeString, errorNumber, errorMessage] = accountNameAnchorErrorLog.slice(1, 5);
            const origin = accountName;
            const errorCode = {
                code: errorCodeString,
                number: parseInt(errorNumber),
            };
            return new AnchorError(errorCode, errorMessage, errorLogs, logs, origin, comparedValues);
        }
        else {
            return null;
        }
    }
    get program() {
        return this._programErrorStack.stack[this._programErrorStack.stack.length - 1];
    }
    get programErrorStack() {
        return this._programErrorStack.stack;
    }
    toString() {
        return this.message;
    }
}
// An error from a user defined program.
class ProgramError extends Error {
    constructor(code, msg, logs) {
        super();
        this.code = code;
        this.msg = msg;
        this.logs = logs;
        if (logs) {
            this._programErrorStack = ProgramErrorStack.parse(logs);
        }
    }
    static parse(err, idlErrors) {
        const errString = err.toString();
        // TODO: don't rely on the error string. web3.js should preserve the error
        //       code information instead of giving us an untyped string.
        let unparsedErrorCode;
        if (errString.includes("custom program error:")) {
            let components = errString.split("custom program error: ");
            if (components.length !== 2) {
                return null;
            }
            else {
                unparsedErrorCode = components[1];
            }
        }
        else {
            const matches = errString.match(/"Custom":([0-9]+)}/g);
            if (!matches || matches.length > 1) {
                return null;
            }
            unparsedErrorCode = matches[0].match(/([0-9]+)/g)[0];
        }
        let errorCode;
        try {
            errorCode = parseInt(unparsedErrorCode);
        }
        catch (parseErr) {
            return null;
        }
        // Parse user error.
        let errorMsg = idlErrors.get(errorCode);
        if (errorMsg !== undefined) {
            return new ProgramError(errorCode, errorMsg, err.logs);
        }
        // Parse framework internal error.
        errorMsg = LangErrorMessage.get(errorCode);
        if (errorMsg !== undefined) {
            return new ProgramError(errorCode, errorMsg, err.logs);
        }
        // Unable to parse the error. Just return the untranslated error.
        return null;
    }
    get program() {
        var _a;
        return (_a = this._programErrorStack) === null || _a === void 0 ? void 0 : _a.stack[this._programErrorStack.stack.length - 1];
    }
    get programErrorStack() {
        var _a;
        return (_a = this._programErrorStack) === null || _a === void 0 ? void 0 : _a.stack;
    }
    toString() {
        return this.msg;
    }
}
function translateError(err, idlErrors) {
    if (isSet("debug-logs")) {
        console.log("Translating error:", err);
    }
    const anchorError = AnchorError.parse(err.logs);
    if (anchorError) {
        return anchorError;
    }
    const programError = ProgramError.parse(err, idlErrors);
    if (programError) {
        return programError;
    }
    if (err.logs) {
        const handler = {
            get: function (target, prop) {
                if (prop === "programErrorStack") {
                    return target.programErrorStack.stack;
                }
                else if (prop === "program") {
                    return target.programErrorStack.stack[err.programErrorStack.stack.length - 1];
                }
                else {
                    // this is the normal way to return all other props
                    // without modifying them.
                    // @ts-expect-error
                    return Reflect.get(...arguments);
                }
            },
        };
        err.programErrorStack = ProgramErrorStack.parse(err.logs);
        return new Proxy(err, handler);
    }
    return err;
}
const LangErrorCode = {
    // Instructions.
    InstructionMissing: ANCHOR_ERROR__INSTRUCTION_MISSING,
    InstructionFallbackNotFound: ANCHOR_ERROR__INSTRUCTION_FALLBACK_NOT_FOUND,
    InstructionDidNotDeserialize: ANCHOR_ERROR__INSTRUCTION_DID_NOT_DESERIALIZE,
    InstructionDidNotSerialize: ANCHOR_ERROR__INSTRUCTION_DID_NOT_SERIALIZE,
    // IDL instructions.
    IdlInstructionStub: ANCHOR_ERROR__IDL_INSTRUCTION_STUB,
    IdlInstructionInvalidProgram: ANCHOR_ERROR__IDL_INSTRUCTION_INVALID_PROGRAM,
    IdlAccountNotEmpty: ANCHOR_ERROR__IDL_ACCOUNT_NOT_EMPTY,
    // Event instructions.
    EventInstructionStub: ANCHOR_ERROR__EVENT_INSTRUCTION_STUB,
    // Constraints.
    ConstraintMut: ANCHOR_ERROR__CONSTRAINT_MUT,
    ConstraintHasOne: ANCHOR_ERROR__CONSTRAINT_HAS_ONE,
    ConstraintSigner: ANCHOR_ERROR__CONSTRAINT_SIGNER,
    ConstraintRaw: ANCHOR_ERROR__CONSTRAINT_RAW,
    ConstraintOwner: ANCHOR_ERROR__CONSTRAINT_OWNER,
    ConstraintRentExempt: ANCHOR_ERROR__CONSTRAINT_RENT_EXEMPT,
    ConstraintSeeds: ANCHOR_ERROR__CONSTRAINT_SEEDS,
    ConstraintExecutable: ANCHOR_ERROR__CONSTRAINT_EXECUTABLE,
    ConstraintState: ANCHOR_ERROR__CONSTRAINT_STATE,
    ConstraintAssociated: ANCHOR_ERROR__CONSTRAINT_ASSOCIATED,
    ConstraintAssociatedInit: ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_INIT,
    ConstraintClose: ANCHOR_ERROR__CONSTRAINT_CLOSE,
    ConstraintAddress: ANCHOR_ERROR__CONSTRAINT_ADDRESS,
    ConstraintZero: ANCHOR_ERROR__CONSTRAINT_ZERO,
    ConstraintTokenMint: ANCHOR_ERROR__CONSTRAINT_TOKEN_MINT,
    ConstraintTokenOwner: ANCHOR_ERROR__CONSTRAINT_TOKEN_OWNER,
    ConstraintMintMintAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_MINT_AUTHORITY,
    ConstraintMintFreezeAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_FREEZE_AUTHORITY,
    ConstraintMintDecimals: ANCHOR_ERROR__CONSTRAINT_MINT_DECIMALS,
    ConstraintSpace: ANCHOR_ERROR__CONSTRAINT_SPACE,
    ConstraintAccountIsNone: ANCHOR_ERROR__CONSTRAINT_ACCOUNT_IS_NONE,
    ConstraintTokenTokenProgram: ANCHOR_ERROR__CONSTRAINT_TOKEN_TOKEN_PROGRAM,
    ConstraintMintTokenProgram: ANCHOR_ERROR__CONSTRAINT_MINT_TOKEN_PROGRAM,
    ConstraintAssociatedTokenTokenProgram: ANCHOR_ERROR__CONSTRAINT_ASSOCIATED_TOKEN_TOKEN_PROGRAM,
    ConstraintMintGroupPointerExtension: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION,
    ConstraintMintGroupPointerExtensionAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_AUTHORITY,
    ConstraintMintGroupPointerExtensionGroupAddress: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_POINTER_EXTENSION_GROUP_ADDRESS,
    ConstraintMintGroupMemberPointerExtension: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION,
    ConstraintMintGroupMemberPointerExtensionAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_AUTHORITY,
    ConstraintMintGroupMemberPointerExtensionMemberAddress: ANCHOR_ERROR__CONSTRAINT_MINT_GROUP_MEMBER_POINTER_EXTENSION_MEMBER_ADDRESS,
    ConstraintMintMetadataPointerExtension: ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION,
    ConstraintMintMetadataPointerExtensionAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_AUTHORITY,
    ConstraintMintMetadataPointerExtensionMetadataAddress: ANCHOR_ERROR__CONSTRAINT_MINT_METADATA_POINTER_EXTENSION_METADATA_ADDRESS,
    ConstraintMintCloseAuthorityExtension: ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION,
    ConstraintMintCloseAuthorityExtensionAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_CLOSE_AUTHORITY_EXTENSION_AUTHORITY,
    ConstraintMintPermanentDelegateExtension: ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION,
    ConstraintMintPermanentDelegateExtensionDelegate: ANCHOR_ERROR__CONSTRAINT_MINT_PERMANENT_DELEGATE_EXTENSION_DELEGATE,
    ConstraintMintTransferHookExtension: ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION,
    ConstraintMintTransferHookExtensionAuthority: ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_AUTHORITY,
    ConstraintMintTransferHookExtensionProgramId: ANCHOR_ERROR__CONSTRAINT_MINT_TRANSFER_HOOK_EXTENSION_PROGRAM_ID,
    // Require.
    RequireViolated: ANCHOR_ERROR__REQUIRE_VIOLATED,
    RequireEqViolated: ANCHOR_ERROR__REQUIRE_EQ_VIOLATED,
    RequireKeysEqViolated: ANCHOR_ERROR__REQUIRE_KEYS_EQ_VIOLATED,
    RequireNeqViolated: ANCHOR_ERROR__REQUIRE_NEQ_VIOLATED,
    RequireKeysNeqViolated: ANCHOR_ERROR__REQUIRE_KEYS_NEQ_VIOLATED,
    RequireGtViolated: ANCHOR_ERROR__REQUIRE_GT_VIOLATED,
    RequireGteViolated: ANCHOR_ERROR__REQUIRE_GTE_VIOLATED,
    // Accounts.
    AccountDiscriminatorAlreadySet: ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_ALREADY_SET,
    AccountDiscriminatorNotFound: ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_NOT_FOUND,
    AccountDiscriminatorMismatch: ANCHOR_ERROR__ACCOUNT_DISCRIMINATOR_MISMATCH,
    AccountDidNotDeserialize: ANCHOR_ERROR__ACCOUNT_DID_NOT_DESERIALIZE,
    AccountDidNotSerialize: ANCHOR_ERROR__ACCOUNT_DID_NOT_SERIALIZE,
    AccountNotEnoughKeys: ANCHOR_ERROR__ACCOUNT_NOT_ENOUGH_KEYS,
    AccountNotMutable: ANCHOR_ERROR__ACCOUNT_NOT_MUTABLE,
    AccountOwnedByWrongProgram: ANCHOR_ERROR__ACCOUNT_OWNED_BY_WRONG_PROGRAM,
    InvalidProgramId: ANCHOR_ERROR__INVALID_PROGRAM_ID,
    InvalidProgramExecutable: ANCHOR_ERROR__INVALID_PROGRAM_EXECUTABLE,
    AccountNotSigner: ANCHOR_ERROR__ACCOUNT_NOT_SIGNER,
    AccountNotSystemOwned: ANCHOR_ERROR__ACCOUNT_NOT_SYSTEM_OWNED,
    AccountNotInitialized: ANCHOR_ERROR__ACCOUNT_NOT_INITIALIZED,
    AccountNotProgramData: ANCHOR_ERROR__ACCOUNT_NOT_PROGRAM_DATA,
    AccountNotAssociatedTokenAccount: ANCHOR_ERROR__ACCOUNT_NOT_ASSOCIATED_TOKEN_ACCOUNT,
    AccountSysvarMismatch: ANCHOR_ERROR__ACCOUNT_SYSVAR_MISMATCH,
    AccountReallocExceedsLimit: ANCHOR_ERROR__ACCOUNT_REALLOC_EXCEEDS_LIMIT,
    AccountDuplicateReallocs: ANCHOR_ERROR__ACCOUNT_DUPLICATE_REALLOCS,
    // Miscellaneous
    DeclaredProgramIdMismatch: ANCHOR_ERROR__DECLARED_PROGRAM_ID_MISMATCH,
    TryingToInitPayerAsProgramAccount: ANCHOR_ERROR__TRYING_TO_INIT_PAYER_AS_PROGRAM_ACCOUNT,
    InvalidNumericConversion: ANCHOR_ERROR__INVALID_NUMERIC_CONVERSION,
    // Used for APIs that shouldn't be used anymore.
    Deprecated: ANCHOR_ERROR__DEPRECATED,
};
const LangErrorMessage = new Map([
    // Instructions.
    [LangErrorCode.InstructionMissing, "Instruction discriminator not provided"],
    [
        LangErrorCode.InstructionFallbackNotFound,
        "Fallback functions are not supported",
    ],
    [
        LangErrorCode.InstructionDidNotDeserialize,
        "The program could not deserialize the given instruction",
    ],
    [
        LangErrorCode.InstructionDidNotSerialize,
        "The program could not serialize the given instruction",
    ],
    // Idl instructions.
    [
        LangErrorCode.IdlInstructionStub,
        "The program was compiled without idl instructions",
    ],
    [
        LangErrorCode.IdlInstructionInvalidProgram,
        "The transaction was given an invalid program for the IDL instruction",
    ],
    [
        LangErrorCode.IdlAccountNotEmpty,
        "IDL account must be empty in order to resize, try closing first",
    ],
    // Event instructions.
    [
        LangErrorCode.EventInstructionStub,
        "The program was compiled without `event-cpi` feature",
    ],
    // Constraints.
    [LangErrorCode.ConstraintMut, "A mut constraint was violated"],
    [LangErrorCode.ConstraintHasOne, "A has one constraint was violated"],
    [LangErrorCode.ConstraintSigner, "A signer constraint was violated"],
    [LangErrorCode.ConstraintRaw, "A raw constraint was violated"],
    [LangErrorCode.ConstraintOwner, "An owner constraint was violated"],
    [
        LangErrorCode.ConstraintRentExempt,
        "A rent exemption constraint was violated",
    ],
    [LangErrorCode.ConstraintSeeds, "A seeds constraint was violated"],
    [LangErrorCode.ConstraintExecutable, "An executable constraint was violated"],
    [
        LangErrorCode.ConstraintState,
        "Deprecated Error, feel free to replace with something else",
    ],
    [LangErrorCode.ConstraintAssociated, "An associated constraint was violated"],
    [
        LangErrorCode.ConstraintAssociatedInit,
        "An associated init constraint was violated",
    ],
    [LangErrorCode.ConstraintClose, "A close constraint was violated"],
    [LangErrorCode.ConstraintAddress, "An address constraint was violated"],
    [LangErrorCode.ConstraintZero, "Expected zero account discriminant"],
    [LangErrorCode.ConstraintTokenMint, "A token mint constraint was violated"],
    [LangErrorCode.ConstraintTokenOwner, "A token owner constraint was violated"],
    [
        LangErrorCode.ConstraintMintMintAuthority,
        "A mint mint authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintFreezeAuthority,
        "A mint freeze authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintDecimals,
        "A mint decimals constraint was violated",
    ],
    [LangErrorCode.ConstraintSpace, "A space constraint was violated"],
    [
        LangErrorCode.ConstraintAccountIsNone,
        "A required account for the constraint is None",
    ],
    [
        LangErrorCode.ConstraintTokenTokenProgram,
        "A token account token program constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintTokenProgram,
        "A mint token program constraint was violated",
    ],
    [
        LangErrorCode.ConstraintAssociatedTokenTokenProgram,
        "An associated token account token program constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupPointerExtension,
        "A group pointer extension constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupPointerExtensionAuthority,
        "A group pointer extension authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupPointerExtensionGroupAddress,
        "A group pointer extension group address constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupMemberPointerExtension,
        "A group member pointer extension constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupMemberPointerExtensionAuthority,
        "A group member pointer extension authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintGroupMemberPointerExtensionMemberAddress,
        "A group member pointer extension group address constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintMetadataPointerExtension,
        "A metadata pointer extension constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintMetadataPointerExtensionAuthority,
        "A metadata pointer extension authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintMetadataPointerExtensionMetadataAddress,
        "A metadata pointer extension metadata address constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintCloseAuthorityExtension,
        "A close authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintCloseAuthorityExtensionAuthority,
        "A close authority extension authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintPermanentDelegateExtension,
        "A permanent delegate extension constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintPermanentDelegateExtensionDelegate,
        "A permanent delegate extension delegate constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintTransferHookExtension,
        "A transfer hook extension constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintTransferHookExtensionAuthority,
        "A transfer hook extension authority constraint was violated",
    ],
    [
        LangErrorCode.ConstraintMintTransferHookExtensionProgramId,
        "A transfer hook extension transfer hook program id constraint was violated",
    ],
    // Require.
    [LangErrorCode.RequireViolated, "A require expression was violated"],
    [LangErrorCode.RequireEqViolated, "A require_eq expression was violated"],
    [
        LangErrorCode.RequireKeysEqViolated,
        "A require_keys_eq expression was violated",
    ],
    [LangErrorCode.RequireNeqViolated, "A require_neq expression was violated"],
    [
        LangErrorCode.RequireKeysNeqViolated,
        "A require_keys_neq expression was violated",
    ],
    [LangErrorCode.RequireGtViolated, "A require_gt expression was violated"],
    [LangErrorCode.RequireGteViolated, "A require_gte expression was violated"],
    // Accounts.
    [
        LangErrorCode.AccountDiscriminatorAlreadySet,
        "The account discriminator was already set on this account",
    ],
    [
        LangErrorCode.AccountDiscriminatorNotFound,
        "No discriminator was found on the account",
    ],
    [
        LangErrorCode.AccountDiscriminatorMismatch,
        "Account discriminator did not match what was expected",
    ],
    [LangErrorCode.AccountDidNotDeserialize, "Failed to deserialize the account"],
    [LangErrorCode.AccountDidNotSerialize, "Failed to serialize the account"],
    [
        LangErrorCode.AccountNotEnoughKeys,
        "Not enough account keys given to the instruction",
    ],
    [LangErrorCode.AccountNotMutable, "The given account is not mutable"],
    [
        LangErrorCode.AccountOwnedByWrongProgram,
        "The given account is owned by a different program than expected",
    ],
    [LangErrorCode.InvalidProgramId, "Program ID was not as expected"],
    [LangErrorCode.InvalidProgramExecutable, "Program account is not executable"],
    [LangErrorCode.AccountNotSigner, "The given account did not sign"],
    [
        LangErrorCode.AccountNotSystemOwned,
        "The given account is not owned by the system program",
    ],
    [
        LangErrorCode.AccountNotInitialized,
        "The program expected this account to be already initialized",
    ],
    [
        LangErrorCode.AccountNotProgramData,
        "The given account is not a program data account",
    ],
    [
        LangErrorCode.AccountNotAssociatedTokenAccount,
        "The given account is not the associated token account",
    ],
    [
        LangErrorCode.AccountSysvarMismatch,
        "The given public key does not match the required sysvar",
    ],
    [
        LangErrorCode.AccountReallocExceedsLimit,
        "The account reallocation exceeds the MAX_PERMITTED_DATA_INCREASE limit",
    ],
    [
        LangErrorCode.AccountDuplicateReallocs,
        "The account was duplicated for more than one reallocation",
    ],
    // Miscellaneous
    [
        LangErrorCode.DeclaredProgramIdMismatch,
        "The declared program id does not match the actual program id",
    ],
    [
        LangErrorCode.TryingToInitPayerAsProgramAccount,
        "You cannot/should not initialize the payer account as a program account",
    ],
    [
        LangErrorCode.InvalidNumericConversion,
        "The program could not perform the numeric conversion, out of range integral type conversion attempted",
    ],
    // Deprecated
    [
        LangErrorCode.Deprecated,
        "The API being used is deprecated and should no longer be used",
    ],
]);

class IdlCoder {
    static fieldLayout(field, types = [], genericArgs) {
        const fieldName = field.name;
        switch (field.type) {
            case "bool": {
                return borsh.bool(fieldName);
            }
            case "u8": {
                return borsh.u8(fieldName);
            }
            case "i8": {
                return borsh.i8(fieldName);
            }
            case "u16": {
                return borsh.u16(fieldName);
            }
            case "i16": {
                return borsh.i16(fieldName);
            }
            case "u32": {
                return borsh.u32(fieldName);
            }
            case "i32": {
                return borsh.i32(fieldName);
            }
            case "f32": {
                return borsh.f32(fieldName);
            }
            case "u64": {
                return borsh.u64(fieldName);
            }
            case "i64": {
                return borsh.i64(fieldName);
            }
            case "f64": {
                return borsh.f64(fieldName);
            }
            case "u128": {
                return borsh.u128(fieldName);
            }
            case "i128": {
                return borsh.i128(fieldName);
            }
            case "u256": {
                return borsh.u256(fieldName);
            }
            case "i256": {
                return borsh.i256(fieldName);
            }
            case "bytes": {
                return borsh.vecU8(fieldName);
            }
            case "string": {
                return borsh.str(fieldName);
            }
            case "pubkey": {
                return borsh.publicKey(fieldName);
            }
            default: {
                if ("option" in field.type) {
                    return borsh.option(IdlCoder.fieldLayout({ type: field.type.option }, types, genericArgs), fieldName);
                }
                if ("vec" in field.type) {
                    return borsh.vec(IdlCoder.fieldLayout({ type: field.type.vec }, types, genericArgs), fieldName);
                }
                if ("array" in field.type) {
                    let [type, len] = field.type.array;
                    len = IdlCoder.resolveArrayLen(len, genericArgs);
                    return borsh.array(IdlCoder.fieldLayout({ type }, types, genericArgs), len, fieldName);
                }
                if ("defined" in field.type) {
                    if (!types) {
                        throw new IdlError("User defined types not provided");
                    }
                    const definedName = field.type.defined.name;
                    const typeDef = types.find((t) => t.name === definedName);
                    if (!typeDef) {
                        throw new IdlError(`Type not found: ${field.name}`);
                    }
                    return IdlCoder.typeDefLayout({
                        typeDef,
                        types,
                        genericArgs: genericArgs !== null && genericArgs !== void 0 ? genericArgs : field.type.defined.generics,
                        name: fieldName,
                    });
                }
                if ("generic" in field.type) {
                    const genericArg = genericArgs === null || genericArgs === void 0 ? void 0 : genericArgs.at(0);
                    if ((genericArg === null || genericArg === void 0 ? void 0 : genericArg.kind) !== "type") {
                        throw new IdlError(`Invalid generic field: ${field.name}`);
                    }
                    return IdlCoder.fieldLayout({ ...field, type: genericArg.type }, types);
                }
                throw new IdlError(`Not yet implemented: ${JSON.stringify(field.type)}`);
            }
        }
    }
    /**
     * Get the type layout of the given defined type(struct or enum).
     */
    static typeDefLayout({ typeDef, types, name, genericArgs, }) {
        switch (typeDef.type.kind) {
            case "struct": {
                const fieldLayouts = handleDefinedFields(typeDef.type.fields, () => [], (fields) => fields.map((f) => {
                    const genArgs = genericArgs
                        ? IdlCoder.resolveGenericArgs({
                            type: f.type,
                            typeDef,
                            genericArgs,
                        })
                        : genericArgs;
                    return IdlCoder.fieldLayout(f, types, genArgs);
                }), (fields) => fields.map((f, i) => {
                    const genArgs = genericArgs
                        ? IdlCoder.resolveGenericArgs({
                            type: f,
                            typeDef,
                            genericArgs,
                        })
                        : genericArgs;
                    return IdlCoder.fieldLayout({ name: i.toString(), type: f }, types, genArgs);
                }));
                return borsh.struct(fieldLayouts, name);
            }
            case "enum": {
                const variants = typeDef.type.variants.map((variant) => {
                    const fieldLayouts = handleDefinedFields(variant.fields, () => [], (fields) => fields.map((f) => {
                        const genArgs = genericArgs
                            ? IdlCoder.resolveGenericArgs({
                                type: f.type,
                                typeDef,
                                genericArgs,
                            })
                            : genericArgs;
                        return IdlCoder.fieldLayout(f, types, genArgs);
                    }), (fields) => fields.map((f, i) => {
                        const genArgs = genericArgs
                            ? IdlCoder.resolveGenericArgs({
                                type: f,
                                typeDef,
                                genericArgs,
                            })
                            : genericArgs;
                        return IdlCoder.fieldLayout({ name: i.toString(), type: f }, types, genArgs);
                    }));
                    return borsh.struct(fieldLayouts, variant.name);
                });
                if (name !== undefined) {
                    // Buffer-layout lib requires the name to be null (on construction)
                    // when used as a field.
                    return borsh.rustEnum(variants).replicate(name);
                }
                return borsh.rustEnum(variants, name);
            }
            case "type": {
                return IdlCoder.fieldLayout({ type: typeDef.type.alias, name }, types);
            }
        }
    }
    /**
     * Get the type of the size in bytes. Returns `1` for variable length types.
     */
    static typeSize(ty, idl, genericArgs) {
        var _a;
        switch (ty) {
            case "bool":
                return 1;
            case "u8":
                return 1;
            case "i8":
                return 1;
            case "i16":
                return 2;
            case "u16":
                return 2;
            case "u32":
                return 4;
            case "i32":
                return 4;
            case "f32":
                return 4;
            case "u64":
                return 8;
            case "i64":
                return 8;
            case "f64":
                return 8;
            case "u128":
                return 16;
            case "i128":
                return 16;
            case "u256":
                return 32;
            case "i256":
                return 32;
            case "bytes":
                return 1;
            case "string":
                return 1;
            case "pubkey":
                return 32;
            default:
                if ("option" in ty) {
                    return 1 + IdlCoder.typeSize(ty.option, idl, genericArgs);
                }
                if ("coption" in ty) {
                    return 4 + IdlCoder.typeSize(ty.coption, idl, genericArgs);
                }
                if ("vec" in ty) {
                    return 1;
                }
                if ("array" in ty) {
                    let [type, len] = ty.array;
                    len = IdlCoder.resolveArrayLen(len, genericArgs);
                    return IdlCoder.typeSize(type, idl, genericArgs) * len;
                }
                if ("defined" in ty) {
                    const typeDef = (_a = idl.types) === null || _a === void 0 ? void 0 : _a.find((t) => t.name === ty.defined.name);
                    if (!typeDef) {
                        throw new IdlError(`Type not found: ${JSON.stringify(ty)}`);
                    }
                    const typeSize = (type) => {
                        const genArgs = genericArgs !== null && genericArgs !== void 0 ? genericArgs : ty.defined.generics;
                        const args = genArgs
                            ? IdlCoder.resolveGenericArgs({
                                type,
                                typeDef,
                                genericArgs: genArgs,
                            })
                            : genArgs;
                        return IdlCoder.typeSize(type, idl, args);
                    };
                    switch (typeDef.type.kind) {
                        case "struct": {
                            return handleDefinedFields(typeDef.type.fields, () => [0], (fields) => fields.map((f) => typeSize(f.type)), (fields) => fields.map((f) => typeSize(f))).reduce((acc, size) => acc + size, 0);
                        }
                        case "enum": {
                            const variantSizes = typeDef.type.variants.map((variant) => {
                                return handleDefinedFields(variant.fields, () => [0], (fields) => fields.map((f) => typeSize(f.type)), (fields) => fields.map((f) => typeSize(f))).reduce((acc, size) => acc + size, 0);
                            });
                            return Math.max(...variantSizes) + 1;
                        }
                        case "type": {
                            return IdlCoder.typeSize(typeDef.type.alias, idl, genericArgs);
                        }
                    }
                }
                if ("generic" in ty) {
                    const genericArg = genericArgs === null || genericArgs === void 0 ? void 0 : genericArgs.at(0);
                    if ((genericArg === null || genericArg === void 0 ? void 0 : genericArg.kind) !== "type") {
                        throw new IdlError(`Invalid generic: ${ty.generic}`);
                    }
                    return IdlCoder.typeSize(genericArg.type, idl, genericArgs);
                }
                throw new Error(`Invalid type ${JSON.stringify(ty)}`);
        }
    }
    /**
     * Resolve the generic array length or return the constant-sized array length.
     */
    static resolveArrayLen(len, genericArgs) {
        if (typeof len === "number")
            return len;
        if (genericArgs) {
            const genericLen = genericArgs.find((g) => g.kind === "const");
            if ((genericLen === null || genericLen === void 0 ? void 0 : genericLen.kind) === "const") {
                len = +genericLen.value;
            }
        }
        if (typeof len !== "number") {
            throw new IdlError("Generic array length did not resolve");
        }
        return len;
    }
    /**
     * Recursively resolve generic arguments i.e. replace all generics with the
     * actual type that they hold based on the initial `genericArgs` given.
     */
    static resolveGenericArgs({ type, typeDef, genericArgs, isDefined, }) {
        if (typeof type !== "object")
            return null;
        for (const index in typeDef.generics) {
            const defGeneric = typeDef.generics[index];
            if ("generic" in type && defGeneric.name === type.generic) {
                return [genericArgs[index]];
            }
            if ("option" in type) {
                const args = IdlCoder.resolveGenericArgs({
                    type: type.option,
                    typeDef,
                    genericArgs,
                    isDefined,
                });
                if (!args || !isDefined)
                    return args;
                if (args[0].kind === "type") {
                    return [
                        {
                            kind: "type",
                            type: { option: args[0].type },
                        },
                    ];
                }
            }
            if ("vec" in type) {
                const args = IdlCoder.resolveGenericArgs({
                    type: type.vec,
                    typeDef,
                    genericArgs,
                    isDefined,
                });
                if (!args || !isDefined)
                    return args;
                if (args[0].kind === "type") {
                    return [
                        {
                            kind: "type",
                            type: { vec: args[0].type },
                        },
                    ];
                }
            }
            if ("array" in type) {
                const [elTy, len] = type.array;
                const isGenericLen = typeof len === "object";
                const args = IdlCoder.resolveGenericArgs({
                    type: elTy,
                    typeDef,
                    genericArgs,
                    isDefined,
                }) || [];
                // Check all generics for matching const generic length
                if (isGenericLen) {
                    const matchingGeneric = typeDef.generics.findIndex((g) => g.name === len.generic);
                    if (matchingGeneric !== -1) {
                        args.push(genericArgs[matchingGeneric]);
                    }
                }
                if (args.length > 0) {
                    if (!isDefined)
                        return args;
                    if (args[0].kind === "type" && args[1].kind === "const") {
                        return [
                            {
                                kind: "type",
                                type: { array: [args[0].type, +args[1].value] },
                            },
                        ];
                    }
                }
                // Only generic len
                if (isGenericLen && defGeneric.name === len.generic) {
                    const arg = genericArgs[index];
                    if (!isDefined)
                        return [arg];
                    return [
                        {
                            kind: "type",
                            type: { array: [elTy, +arg.value] },
                        },
                    ];
                }
                // Non-generic
                return null;
            }
            if ("defined" in type) {
                if (!type.defined.generics)
                    return null;
                return type.defined.generics
                    .flatMap((g) => {
                    switch (g.kind) {
                        case "type":
                            return IdlCoder.resolveGenericArgs({
                                type: g.type,
                                typeDef,
                                genericArgs,
                                isDefined: true,
                            });
                        case "const":
                            return [g];
                    }
                })
                    .filter((g) => g !== null);
            }
        }
        return null;
    }
}

/**
 * Encodes and decodes program instructions.
 */
class BorshInstructionCoder {
    constructor(idl) {
        this.idl = idl;
        const ixLayouts = idl.instructions.map((ix) => {
            const name = ix.name;
            const fieldLayouts = ix.args.map((arg) => IdlCoder.fieldLayout(arg, idl.types));
            const layout = borsh.struct(fieldLayouts, name);
            return [name, { discriminator: ix.discriminator, layout }];
        });
        this.ixLayouts = new Map(ixLayouts);
    }
    /**
     * Encodes a program instruction.
     */
    encode(ixName, ix) {
        const buffer = bufferExports.Buffer.alloc(1000); // TODO: use a tighter buffer.
        const encoder = this.ixLayouts.get(ixName);
        if (!encoder) {
            throw new Error(`Unknown method: ${ixName}`);
        }
        const len = encoder.layout.encode(ix, buffer);
        const data = buffer.slice(0, len);
        return bufferExports.Buffer.concat([bufferExports.Buffer.from(encoder.discriminator), data]);
    }
    /**
     * Decodes a program instruction.
     */
    decode(ix, encoding = "hex") {
        if (typeof ix === "string") {
            ix = encoding === "hex" ? bufferExports.Buffer.from(ix, "hex") : bs58$1.decode(ix);
        }
        for (const [name, layout] of this.ixLayouts) {
            const givenDisc = ix.subarray(0, layout.discriminator.length);
            const matches = givenDisc.equals(bufferExports.Buffer.from(layout.discriminator));
            if (matches) {
                return {
                    name,
                    data: layout.layout.decode(ix.subarray(givenDisc.length)),
                };
            }
        }
        return null;
    }
    /**
     * Returns a formatted table of all the fields in the given instruction data.
     */
    format(ix, accountMetas) {
        return InstructionFormatter.format(ix, accountMetas, this.idl);
    }
}
class InstructionFormatter {
    static format(ix, accountMetas, idl) {
        const idlIx = idl.instructions.find((i) => ix.name === i.name);
        if (!idlIx) {
            console.error("Invalid instruction given");
            return null;
        }
        const args = idlIx.args.map((idlField) => {
            return {
                name: idlField.name,
                type: InstructionFormatter.formatIdlType(idlField.type),
                data: InstructionFormatter.formatIdlData(idlField, ix.data[idlField.name], idl.types),
            };
        });
        const flatIdlAccounts = InstructionFormatter.flattenIdlAccounts(idlIx.accounts);
        const accounts = accountMetas.map((meta, idx) => {
            if (idx < flatIdlAccounts.length) {
                return {
                    name: flatIdlAccounts[idx].name,
                    ...meta,
                };
            }
            // "Remaining accounts" are unnamed in Anchor.
            else {
                return {
                    name: undefined,
                    ...meta,
                };
            }
        });
        return {
            args,
            accounts,
        };
    }
    static formatIdlType(idlType) {
        if (typeof idlType === "string") {
            return idlType;
        }
        if ("option" in idlType) {
            return `Option<${this.formatIdlType(idlType.option)}>`;
        }
        if ("coption" in idlType) {
            return `COption<${this.formatIdlType(idlType.coption)}>`;
        }
        if ("vec" in idlType) {
            return `Vec<${this.formatIdlType(idlType.vec)}>`;
        }
        if ("array" in idlType) {
            return `Array<${idlType.array[0]}; ${idlType.array[1]}>`;
        }
        if ("defined" in idlType) {
            const name = idlType.defined.name;
            if (idlType.defined.generics) {
                const generics = idlType.defined.generics
                    .map((g) => {
                    switch (g.kind) {
                        case "type":
                            return InstructionFormatter.formatIdlType(g.type);
                        case "const":
                            return g.value;
                    }
                })
                    .join(", ");
                return `${name}<${generics}>`;
            }
            return name;
        }
        throw new Error(`Unknown IDL type: ${idlType}`);
    }
    static formatIdlData(idlField, data, types) {
        if (typeof idlField.type === "string") {
            return data.toString();
        }
        if ("vec" in idlField.type) {
            return ("[" +
                data
                    .map((d) => this.formatIdlData({ name: "", type: idlField.type.vec }, d, types))
                    .join(", ") +
                "]");
        }
        if ("option" in idlField.type) {
            return data === null
                ? "null"
                : this.formatIdlData({ name: "", type: idlField.type.option }, data, types);
        }
        if ("defined" in idlField.type) {
            if (!types) {
                throw new Error("User defined types not provided");
            }
            const definedName = idlField.type.defined.name;
            const typeDef = types.find((t) => t.name === definedName);
            if (!typeDef) {
                throw new Error(`Type not found: ${definedName}`);
            }
            return InstructionFormatter.formatIdlDataDefined(typeDef, data, types);
        }
        return "unknown";
    }
    static formatIdlDataDefined(typeDef, data, types) {
        switch (typeDef.type.kind) {
            case "struct": {
                return ("{ " +
                    handleDefinedFields(typeDef.type.fields, () => "", (fields) => {
                        return Object.entries(data)
                            .map(([key, val]) => {
                            const field = fields.find((f) => f.name === key);
                            if (!field) {
                                throw new Error(`Field not found: ${key}`);
                            }
                            return (key +
                                ": " +
                                InstructionFormatter.formatIdlData(field, val, types));
                        })
                            .join(", ");
                    }, (fields) => {
                        return Object.entries(data)
                            .map(([key, val]) => {
                            return (key +
                                ": " +
                                InstructionFormatter.formatIdlData({ name: "", type: fields[key] }, val, types));
                        })
                            .join(", ");
                    }) +
                    " }");
            }
            case "enum": {
                const variantName = Object.keys(data)[0];
                const variant = typeDef.type.variants.find((v) => v.name === variantName);
                if (!variant) {
                    throw new Error(`Unable to find variant: ${variantName}`);
                }
                const enumValue = data[variantName];
                return handleDefinedFields(variant.fields, () => variantName, (fields) => {
                    const namedFields = Object.keys(enumValue)
                        .map((f) => {
                        const fieldData = enumValue[f];
                        const idlField = fields.find((v) => v.name === f);
                        if (!idlField) {
                            throw new Error(`Field not found: ${f}`);
                        }
                        return (f +
                            ": " +
                            InstructionFormatter.formatIdlData(idlField, fieldData, types));
                    })
                        .join(", ");
                    return `${variantName} { ${namedFields} }`;
                }, (fields) => {
                    const tupleFields = Object.entries(enumValue)
                        .map(([key, val]) => {
                        return (key +
                            ": " +
                            InstructionFormatter.formatIdlData({ name: "", type: fields[key] }, val, types));
                    })
                        .join(", ");
                    return `${variantName} { ${tupleFields} }`;
                });
            }
            case "type": {
                return InstructionFormatter.formatIdlType(typeDef.type.alias);
            }
        }
    }
    static flattenIdlAccounts(accounts, prefix) {
        return accounts
            .map((account) => {
            const accName = sentenceCase(account.name);
            if (account.hasOwnProperty("accounts")) {
                const newPrefix = prefix ? `${prefix} > ${accName}` : accName;
                return InstructionFormatter.flattenIdlAccounts(account.accounts, newPrefix);
            }
            else {
                return {
                    ...account,
                    name: prefix ? `${prefix} > ${accName}` : accName,
                };
            }
        })
            .flat();
    }
}
function sentenceCase(field) {
    const result = field.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Encodes and decodes account objects.
 */
class BorshAccountsCoder {
    constructor(idl) {
        this.idl = idl;
        if (!idl.accounts) {
            this.accountLayouts = new Map();
            return;
        }
        const types = idl.types;
        if (!types) {
            throw new Error("Accounts require `idl.types`");
        }
        const layouts = idl.accounts.map((acc) => {
            const typeDef = types.find((ty) => ty.name === acc.name);
            if (!typeDef) {
                throw new Error(`Account not found: ${acc.name}`);
            }
            return [
                acc.name,
                {
                    discriminator: acc.discriminator,
                    layout: IdlCoder.typeDefLayout({ typeDef, types }),
                },
            ];
        });
        this.accountLayouts = new Map(layouts);
    }
    async encode(accountName, account) {
        const buffer = bufferExports.Buffer.alloc(1000); // TODO: use a tighter buffer.
        const layout = this.accountLayouts.get(accountName);
        if (!layout) {
            throw new Error(`Unknown account: ${accountName}`);
        }
        const len = layout.layout.encode(account, buffer);
        const accountData = buffer.slice(0, len);
        const discriminator = this.accountDiscriminator(accountName);
        return bufferExports.Buffer.concat([discriminator, accountData]);
    }
    decode(accountName, data) {
        // Assert the account discriminator is correct.
        const discriminator = this.accountDiscriminator(accountName);
        if (discriminator.compare(data.slice(0, discriminator.length))) {
            throw new Error("Invalid account discriminator");
        }
        return this.decodeUnchecked(accountName, data);
    }
    decodeAny(data) {
        for (const [name, layout] of this.accountLayouts) {
            const givenDisc = data.subarray(0, layout.discriminator.length);
            const matches = givenDisc.equals(bufferExports.Buffer.from(layout.discriminator));
            if (matches)
                return this.decodeUnchecked(name, data);
        }
        throw new Error("Account not found");
    }
    decodeUnchecked(accountName, acc) {
        // Chop off the discriminator before decoding.
        const discriminator = this.accountDiscriminator(accountName);
        const data = acc.subarray(discriminator.length);
        const layout = this.accountLayouts.get(accountName);
        if (!layout) {
            throw new Error(`Unknown account: ${accountName}`);
        }
        return layout.layout.decode(data);
    }
    memcmp(accountName, appendData) {
        const discriminator = this.accountDiscriminator(accountName);
        return {
            offset: 0,
            bytes: bs58$1.encode(appendData ? bufferExports.Buffer.concat([discriminator, appendData]) : discriminator),
        };
    }
    size(accountName) {
        return (this.accountDiscriminator(accountName).length +
            IdlCoder.typeSize({ defined: { name: accountName } }, this.idl));
    }
    /**
     * Get the unique discriminator prepended to all anchor accounts.
     *
     * @param name The name of the account to get the discriminator of.
     */
    accountDiscriminator(name) {
        var _a;
        const account = (_a = this.idl.accounts) === null || _a === void 0 ? void 0 : _a.find((acc) => acc.name === name);
        if (!account) {
            throw new Error(`Account not found: ${name}`);
        }
        return bufferExports.Buffer.from(account.discriminator);
    }
}

class BorshEventCoder {
    constructor(idl) {
        if (!idl.events) {
            this.layouts = new Map();
            return;
        }
        const types = idl.types;
        if (!types) {
            throw new Error("Events require `idl.types`");
        }
        const layouts = idl.events.map((ev) => {
            const typeDef = types.find((ty) => ty.name === ev.name);
            if (!typeDef) {
                throw new Error(`Event not found: ${ev.name}`);
            }
            return [
                ev.name,
                {
                    discriminator: ev.discriminator,
                    layout: IdlCoder.typeDefLayout({ typeDef, types }),
                },
            ];
        });
        this.layouts = new Map(layouts);
    }
    decode(log) {
        let logArr;
        // This will throw if log length is not a multiple of 4.
        try {
            logArr = decode(log);
        }
        catch (e) {
            return null;
        }
        for (const [name, layout] of this.layouts) {
            const givenDisc = logArr.subarray(0, layout.discriminator.length);
            const matches = givenDisc.equals(bufferExports.Buffer.from(layout.discriminator));
            if (matches) {
                return {
                    name,
                    data: layout.layout.decode(logArr.subarray(givenDisc.length)),
                };
            }
        }
        return null;
    }
}

/**
 * Encodes and decodes user-defined types.
 */
class BorshTypesCoder {
    constructor(idl) {
        const types = idl.types;
        if (!types) {
            this.typeLayouts = new Map();
            return;
        }
        const layouts = types
            .filter((ty) => !ty.generics)
            .map((ty) => [
            ty.name,
            IdlCoder.typeDefLayout({ typeDef: ty, types }),
        ]);
        this.typeLayouts = new Map(layouts);
    }
    encode(name, type) {
        const buffer = bufferExports.Buffer.alloc(1000); // TODO: use a tighter buffer.
        const layout = this.typeLayouts.get(name);
        if (!layout) {
            throw new Error(`Unknown type: ${name}`);
        }
        const len = layout.encode(type, buffer);
        return buffer.slice(0, len);
    }
    decode(name, data) {
        const layout = this.typeLayouts.get(name);
        if (!layout) {
            throw new Error(`Unknown type: ${name}`);
        }
        return layout.decode(data);
    }
}

/**
 * BorshCoder is the default Coder for Anchor programs implementing the
 * borsh based serialization interface.
 */
class BorshCoder {
    constructor(idl) {
        this.instruction = new BorshInstructionCoder(idl);
        this.accounts = new BorshAccountsCoder(idl);
        this.events = new BorshEventCoder(idl);
        this.types = new BorshTypesCoder(idl);
    }
}

/* The MIT License (MIT)
 *
 * Copyright 2015-2018 Peter A. Bigot
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Base class for layout objects.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
 *
 * @param {Number} span - Initializer for {@link Layout#span|span}.  The
 * parameter must be an integer; a negative value signifies that the
 * span is {@link Layout#getSpan|value-specific}.
 *
 * @param {string} [property] - Initializer for {@link
 * Layout#property|property}.
 *
 * @abstract
 */
class Layout {
  constructor(span, property) {
    if (!Number.isInteger(span)) {
      throw new TypeError('span must be an integer');
    }

    /** The span of the layout in bytes.
     *
     * Positive values are generally expected.
     *
     * Zero will only appear in {@link Constant}s and in {@link
     * Sequence}s where the {@link Sequence#count|count} is zero.
     *
     * A negative value indicates that the span is value-specific, and
     * must be obtained using {@link Layout#getSpan|getSpan}. */
    this.span = span;

    /** The property name used when this layout is represented in an
     * Object.
     *
     * Used only for layouts that {@link Layout#decode|decode} to Object
     * instances.  If left undefined the span of the unnamed layout will
     * be treated as padding: it will not be mutated by {@link
     * Layout#encode|encode} nor represented as a property in the
     * decoded Object. */
    this.property = property;
  }

  /** Function to create an Object into which decoded properties will
   * be written.
   *
   * Used only for layouts that {@link Layout#decode|decode} to Object
   * instances, which means:
   * * {@link Structure}
   * * {@link Union}
   * * {@link VariantLayout}
   * * {@link BitStructure}
   *
   * If left undefined the JavaScript representation of these layouts
   * will be Object instances.
   *
   * See {@link bindConstructorLayout}.
   */
  makeDestinationObject() {
    return {};
  }

  /**
   * Decode from a Buffer into an JavaScript value.
   *
   * @param {Buffer} b - the buffer from which encoded data is read.
   *
   * @param {Number} [offset] - the offset at which the encoded data
   * starts.  If absent a zero offset is inferred.
   *
   * @returns {(Number|Array|Object)} - the value of the decoded data.
   *
   * @abstract
   */
  decode(b, offset) {
    throw new Error('Layout is abstract');
  }

  /**
   * Encode a JavaScript value into a Buffer.
   *
   * @param {(Number|Array|Object)} src - the value to be encoded into
   * the buffer.  The type accepted depends on the (sub-)type of {@link
   * Layout}.
   *
   * @param {Buffer} b - the buffer into which encoded data will be
   * written.
   *
   * @param {Number} [offset] - the offset at which the encoded data
   * starts.  If absent a zero offset is inferred.
   *
   * @returns {Number} - the number of bytes encoded, including the
   * space skipped for internal padding, but excluding data such as
   * {@link Sequence#count|lengths} when stored {@link
   * ExternalLayout|externally}.  This is the adjustment to `offset`
   * producing the offset where data for the next layout would be
   * written.
   *
   * @abstract
   */
  encode(src, b, offset) {
    throw new Error('Layout is abstract');
  }

  /**
   * Calculate the span of a specific instance of a layout.
   *
   * @param {Buffer} b - the buffer that contains an encoded instance.
   *
   * @param {Number} [offset] - the offset at which the encoded instance
   * starts.  If absent a zero offset is inferred.
   *
   * @return {Number} - the number of bytes covered by the layout
   * instance.  If this method is not overridden in a subclass the
   * definition-time constant {@link Layout#span|span} will be
   * returned.
   *
   * @throws {RangeError} - if the length of the value cannot be
   * determined.
   */
  getSpan(b, offset) {
    if (0 > this.span) {
      throw new RangeError('indeterminate span');
    }
    return this.span;
  }

  /**
   * Replicate the layout using a new property.
   *
   * This function must be used to get a structurally-equivalent layout
   * with a different name since all {@link Layout} instances are
   * immutable.
   *
   * **NOTE** This is a shallow copy.  All fields except {@link
   * Layout#property|property} are strictly equal to the origin layout.
   *
   * @param {String} property - the value for {@link
   * Layout#property|property} in the replica.
   *
   * @returns {Layout} - the copy with {@link Layout#property|property}
   * set to `property`.
   */
  replicate(property) {
    const rv = Object.create(this.constructor.prototype);
    Object.assign(rv, this);
    rv.property = property;
    return rv;
  }

  /**
   * Create an object from layout properties and an array of values.
   *
   * **NOTE** This function returns `undefined` if invoked on a layout
   * that does not return its value as an Object.  Objects are
   * returned for things that are a {@link Structure}, which includes
   * {@link VariantLayout|variant layouts} if they are structures, and
   * excludes {@link Union}s.  If you want this feature for a union
   * you must use {@link Union.getVariant|getVariant} to select the
   * desired layout.
   *
   * @param {Array} values - an array of values that correspond to the
   * default order for properties.  As with {@link Layout#decode|decode}
   * layout elements that have no property name are skipped when
   * iterating over the array values.  Only the top-level properties are
   * assigned; arguments are not assigned to properties of contained
   * layouts.  Any unused values are ignored.
   *
   * @return {(Object|undefined)}
   */
  fromArray(values) {
    return undefined;
  }
}
var Layout_2 = Layout;

/* Provide text that carries a name (such as for a function that will
 * be throwing an error) annotated with the property of a given layout
 * (such as one for which the value was unacceptable).
 *
 * @ignore */
function nameWithProperty(name, lo) {
  if (lo.property) {
    return name + '[' + lo.property + ']';
  }
  return name;
}

/**
 * An object that behaves like a layout but does not consume space
 * within its containing layout.
 *
 * This is primarily used to obtain metadata about a member, such as a
 * {@link OffsetLayout} that can provide data about a {@link
 * Layout#getSpan|value-specific span}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support {@link
 * ExternalLayout#isCount|isCount} or other {@link Layout} functions.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @abstract
 * @augments {Layout}
 */
class ExternalLayout extends Layout {
  /**
   * Return `true` iff the external layout decodes to an unsigned
   * integer layout.
   *
   * In that case it can be used as the source of {@link
   * Sequence#count|Sequence counts}, {@link Blob#length|Blob lengths},
   * or as {@link UnionLayoutDiscriminator#layout|external union
   * discriminators}.
   *
   * @abstract
   */
  isCount() {
    throw new Error('ExternalLayout is abstract');
  }
}

/**
 * An {@link ExternalLayout} that supports accessing a {@link Layout}
 * at a fixed offset from the start of another Layout.  The offset may
 * be before, within, or after the base layout.
 *
 * *Factory*: {@link module:Layout.offset|offset}
 *
 * @param {Layout} layout - initializer for {@link
 * OffsetLayout#layout|layout}, modulo `property`.
 *
 * @param {Number} [offset] - Initializes {@link
 * OffsetLayout#offset|offset}.  Defaults to zero.
 *
 * @param {string} [property] - Optional new property name for a
 * {@link Layout#replicate| replica} of `layout` to be used as {@link
 * OffsetLayout#layout|layout}.  If not provided the `layout` is used
 * unchanged.
 *
 * @augments {Layout}
 */
class OffsetLayout extends ExternalLayout {
  constructor(layout, offset, property) {
    if (!(layout instanceof Layout)) {
      throw new TypeError('layout must be a Layout');
    }

    if (undefined === offset) {
      offset = 0;
    } else if (!Number.isInteger(offset)) {
      throw new TypeError('offset must be integer or undefined');
    }

    super(layout.span, property || layout.property);

    /** The subordinated layout. */
    this.layout = layout;

    /** The location of {@link OffsetLayout#layout} relative to the
     * start of another layout.
     *
     * The value may be positive or negative, but an error will thrown
     * if at the point of use it goes outside the span of the Buffer
     * being accessed.  */
    this.offset = offset;
  }

  /** @override */
  isCount() {
    return ((this.layout instanceof UInt)
            || (this.layout instanceof UIntBE));
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    return this.layout.decode(b, offset + this.offset);
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    return this.layout.encode(src, b, offset + this.offset);
  }
}

/**
 * Represent an unsigned integer in little-endian format.
 *
 * *Factory*: {@link module:Layout.u8|u8}, {@link
 *  module:Layout.u16|u16}, {@link module:Layout.u24|u24}, {@link
 *  module:Layout.u32|u32}, {@link module:Layout.u40|u40}, {@link
 *  module:Layout.u48|u48}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */
class UInt extends Layout {
  constructor(span, property) {
    super(span, property);
    if (6 < this.span) {
      throw new RangeError('span must not exceed 6 bytes');
    }
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    return b.readUIntLE(offset, this.span);
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    b.writeUIntLE(src, offset, this.span);
    return this.span;
  }
}

/**
 * Represent an unsigned integer in big-endian format.
 *
 * *Factory*: {@link module:Layout.u8be|u8be}, {@link
 * module:Layout.u16be|u16be}, {@link module:Layout.u24be|u24be},
 * {@link module:Layout.u32be|u32be}, {@link
 * module:Layout.u40be|u40be}, {@link module:Layout.u48be|u48be}
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */
class UIntBE extends Layout {
  constructor(span, property) {
    super( span, property);
    if (6 < this.span) {
      throw new RangeError('span must not exceed 6 bytes');
    }
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    return b.readUIntBE(offset, this.span);
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    b.writeUIntBE(src, offset, this.span);
    return this.span;
  }
}

const V2E32 = Math.pow(2, 32);

/* True modulus high and low 32-bit words, where low word is always
 * non-negative. */
function divmodInt64(src) {
  const hi32 = Math.floor(src / V2E32);
  const lo32 = src - (hi32 * V2E32);
  return {hi32, lo32};
}
/* Reconstruct Number from quotient and non-negative remainder */
function roundedInt64(hi32, lo32) {
  return hi32 * V2E32 + lo32;
}

/**
 * Represent an unsigned 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.nu64|nu64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */
class NearUInt64 extends Layout {
  constructor(property) {
    super(8, property);
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const lo32 = b.readUInt32LE(offset);
    const hi32 = b.readUInt32LE(offset + 4);
    return roundedInt64(hi32, lo32);
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const split = divmodInt64(src);
    b.writeUInt32LE(split.lo32, offset);
    b.writeUInt32LE(split.hi32, offset + 4);
    return 8;
  }
}

/**
 * Represent a signed 64-bit integer in little-endian format when
 * encoded and as a near integral JavaScript Number when decoded.
 *
 * *Factory*: {@link module:Layout.ns64|ns64}
 *
 * **NOTE** Values with magnitude greater than 2^52 may not decode to
 * the exact value of the encoded representation.
 *
 * @augments {Layout}
 */
class NearInt64 extends Layout {
  constructor(property) {
    super(8, property);
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const lo32 = b.readUInt32LE(offset);
    const hi32 = b.readInt32LE(offset + 4);
    return roundedInt64(hi32, lo32);
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const split = divmodInt64(src);
    b.writeUInt32LE(split.lo32, offset);
    b.writeInt32LE(split.hi32, offset + 4);
    return 8;
  }
}

/**
 * Represent a contiguous sequence of arbitrary layout elements as an
 * Object.
 *
 * *Factory*: {@link module:Layout.struct|struct}
 *
 * **NOTE** The {@link Layout#span|span} of the structure is variable
 * if any layout in {@link Structure#fields|fields} has a variable
 * span.  When {@link Layout#encode|encoding} we must have a value for
 * all variable-length fields, or we wouldn't be able to figure out
 * how much space to use for storage.  We can only identify the value
 * for a field when it has a {@link Layout#property|property}.  As
 * such, although a structure may contain both unnamed fields and
 * variable-length fields, it cannot contain an unnamed
 * variable-length field.
 *
 * @param {Layout[]} fields - initializer for {@link
 * Structure#fields|fields}.  An error is raised if this contains a
 * variable-length field for which a {@link Layout#property|property}
 * is not defined.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @param {Boolean} [decodePrefixes] - initializer for {@link
 * Structure#decodePrefixes|property}.
 *
 * @throws {Error} - if `fields` contains an unnamed variable-length
 * layout.
 *
 * @augments {Layout}
 */
class Structure extends Layout {
  constructor(fields, property, decodePrefixes) {
    if (!(Array.isArray(fields)
          && fields.reduce((acc, v) => acc && (v instanceof Layout), true))) {
      throw new TypeError('fields must be array of Layout instances');
    }
    if (('boolean' === typeof property)
        && (undefined === decodePrefixes)) {
      decodePrefixes = property;
      property = undefined;
    }

    /* Verify absence of unnamed variable-length fields. */
    for (const fd of fields) {
      if ((0 > fd.span)
          && (undefined === fd.property)) {
        throw new Error('fields cannot contain unnamed variable-length layout');
      }
    }

    let span = -1;
    try {
      span = fields.reduce((span, fd) => span + fd.getSpan(), 0);
    } catch (e) {
    }
    super(span, property);

    /** The sequence of {@link Layout} values that comprise the
     * structure.
     *
     * The individual elements need not be the same type, and may be
     * either scalar or aggregate layouts.  If a member layout leaves
     * its {@link Layout#property|property} undefined the
     * corresponding region of the buffer associated with the element
     * will not be mutated.
     *
     * @type {Layout[]} */
    this.fields = fields;

    /** Control behavior of {@link Layout#decode|decode()} given short
     * buffers.
     *
     * In some situations a structure many be extended with additional
     * fields over time, with older installations providing only a
     * prefix of the full structure.  If this property is `true`
     * decoding will accept those buffers and leave subsequent fields
     * undefined, as long as the buffer ends at a field boundary.
     * Defaults to `false`. */
    this.decodePrefixes = !!decodePrefixes;
  }

  /** @override */
  getSpan(b, offset) {
    if (0 <= this.span) {
      return this.span;
    }
    if (undefined === offset) {
      offset = 0;
    }
    let span = 0;
    try {
      span = this.fields.reduce((span, fd) => {
        const fsp = fd.getSpan(b, offset);
        offset += fsp;
        return span + fsp;
      }, 0);
    } catch (e) {
      throw new RangeError('indeterminate span');
    }
    return span;
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const dest = this.makeDestinationObject();
    for (const fd of this.fields) {
      if (undefined !== fd.property) {
        dest[fd.property] = fd.decode(b, offset);
      }
      offset += fd.getSpan(b, offset);
      if (this.decodePrefixes
          && (b.length === offset)) {
        break;
      }
    }
    return dest;
  }

  /** Implement {@link Layout#encode|encode} for {@link Structure}.
   *
   * If `src` is missing a property for a member with a defined {@link
   * Layout#property|property} the corresponding region of the buffer is
   * left unmodified. */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const firstOffset = offset;
    let lastOffset = 0;
    let lastWrote = 0;
    for (const fd of this.fields) {
      let span = fd.span;
      lastWrote = (0 < span) ? span : 0;
      if (undefined !== fd.property) {
        const fv = src[fd.property];
        if (undefined !== fv) {
          lastWrote = fd.encode(fv, b, offset);
          if (0 > span) {
            /* Read the as-encoded span, which is not necessarily the
             * same as what we wrote. */
            span = fd.getSpan(b, offset);
          }
        }
      }
      lastOffset = offset;
      offset += span;
    }
    /* Use (lastOffset + lastWrote) instead of offset because the last
     * item may have had a dynamic length and we don't want to include
     * the padding between it and the end of the space reserved for
     * it. */
    return (lastOffset + lastWrote) - firstOffset;
  }

  /** @override */
  fromArray(values) {
    const dest = this.makeDestinationObject();
    for (const fd of this.fields) {
      if ((undefined !== fd.property)
          && (0 < values.length)) {
        dest[fd.property] = values.shift();
      }
    }
    return dest;
  }

  /**
   * Get access to the layout of a given property.
   *
   * @param {String} property - the structure member of interest.
   *
   * @return {Layout} - the layout associated with `property`, or
   * undefined if there is no such property.
   */
  layoutFor(property) {
    if ('string' !== typeof property) {
      throw new TypeError('property must be string');
    }
    for (const fd of this.fields) {
      if (fd.property === property) {
        return fd;
      }
    }
  }

  /**
   * Get the offset of a structure member.
   *
   * @param {String} property - the structure member of interest.
   *
   * @return {Number} - the offset in bytes to the start of `property`
   * within the structure, or undefined if `property` is not a field
   * within the structure.  If the property is a member but follows a
   * variable-length structure member a negative number will be
   * returned.
   */
  offsetOf(property) {
    if ('string' !== typeof property) {
      throw new TypeError('property must be string');
    }
    let offset = 0;
    for (const fd of this.fields) {
      if (fd.property === property) {
        return offset;
      }
      if (0 > fd.span) {
        offset = -1;
      } else if (0 <= offset) {
        offset += fd.span;
      }
    }
  }
}

/**
 * An object that can provide a {@link
 * Union#discriminator|discriminator} API for {@link Union}.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * UnionDiscriminator#encode|encode} or {@link
 * UnionDiscriminator#decode|decode} functions.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}.
 *
 * @abstract
 */
class UnionDiscriminator {
  constructor(property) {
    /** The {@link Layout#property|property} to be used when the
     * discriminator is referenced in isolation (generally when {@link
     * Union#decode|Union decode} cannot delegate to a specific
     * variant). */
    this.property = property;
  }

  /** Analog to {@link Layout#decode|Layout decode} for union discriminators.
   *
   * The implementation of this method need not reference the buffer if
   * variant information is available through other means. */
  decode() {
    throw new Error('UnionDiscriminator is abstract');
  }

  /** Analog to {@link Layout#decode|Layout encode} for union discriminators.
   *
   * The implementation of this method need not store the value if
   * variant information is maintained through other means. */
  encode() {
    throw new Error('UnionDiscriminator is abstract');
  }
}

/**
 * An object that can provide a {@link
 * UnionDiscriminator|discriminator API} for {@link Union} using an
 * unsigned integral {@link Layout} instance located either inside or
 * outside the union.
 *
 * @param {ExternalLayout} layout - initializes {@link
 * UnionLayoutDiscriminator#layout|layout}.  Must satisfy {@link
 * ExternalLayout#isCount|isCount()}.
 *
 * @param {string} [property] - Default for {@link
 * UnionDiscriminator#property|property}, superseding the property
 * from `layout`, but defaulting to `variant` if neither `property`
 * nor layout provide a property name.
 *
 * @augments {UnionDiscriminator}
 */
class UnionLayoutDiscriminator extends UnionDiscriminator {
  constructor(layout, property) {
    if (!((layout instanceof ExternalLayout)
          && layout.isCount())) {
      throw new TypeError('layout must be an unsigned integer ExternalLayout');
    }

    super(property || layout.property || 'variant');

    /** The {@link ExternalLayout} used to access the discriminator
     * value. */
    this.layout = layout;
  }

  /** Delegate decoding to {@link UnionLayoutDiscriminator#layout|layout}. */
  decode(b, offset) {
    return this.layout.decode(b, offset);
  }

  /** Delegate encoding to {@link UnionLayoutDiscriminator#layout|layout}. */
  encode(src, b, offset) {
    return this.layout.encode(src, b, offset);
  }
}

/**
 * Represent any number of span-compatible layouts.
 *
 * *Factory*: {@link module:Layout.union|union}
 *
 * If the union has a {@link Union#defaultLayout|default layout} that
 * layout must have a non-negative {@link Layout#span|span}.  The span
 * of a fixed-span union includes its {@link
 * Union#discriminator|discriminator} if the variant is a {@link
 * Union#usesPrefixDiscriminator|prefix of the union}, plus the span
 * of its {@link Union#defaultLayout|default layout}.
 *
 * If the union does not have a default layout then the encoded span
 * of the union depends on the encoded span of its variant (which may
 * be fixed or variable).
 *
 * {@link VariantLayout#layout|Variant layout}s are added through
 * {@link Union#addVariant|addVariant}.  If the union has a default
 * layout, the span of the {@link VariantLayout#layout|layout
 * contained by the variant} must not exceed the span of the {@link
 * Union#defaultLayout|default layout} (minus the span of a {@link
 * Union#usesPrefixDiscriminator|prefix disriminator}, if used).  The
 * span of the variant will equal the span of the union itself.
 *
 * The variant for a buffer can only be identified from the {@link
 * Union#discriminator|discriminator} {@link
 * UnionDiscriminator#property|property} (in the case of the {@link
 * Union#defaultLayout|default layout}), or by using {@link
 * Union#getVariant|getVariant} and examining the resulting {@link
 * VariantLayout} instance.
 *
 * A variant compatible with a JavaScript object can be identified
 * using {@link Union#getSourceVariant|getSourceVariant}.
 *
 * @param {(UnionDiscriminator|ExternalLayout|Layout)} discr - How to
 * identify the layout used to interpret the union contents.  The
 * parameter must be an instance of {@link UnionDiscriminator}, an
 * {@link ExternalLayout} that satisfies {@link
 * ExternalLayout#isCount|isCount()}, or {@link UInt} (or {@link
 * UIntBE}).  When a non-external layout element is passed the layout
 * appears at the start of the union.  In all cases the (synthesized)
 * {@link UnionDiscriminator} instance is recorded as {@link
 * Union#discriminator|discriminator}.
 *
 * @param {(Layout|null)} defaultLayout - initializer for {@link
 * Union#defaultLayout|defaultLayout}.  If absent defaults to `null`.
 * If `null` there is no default layout: the union has data-dependent
 * length and attempts to decode or encode unrecognized variants will
 * throw an exception.  A {@link Layout} instance must have a
 * non-negative {@link Layout#span|span}, and if it lacks a {@link
 * Layout#property|property} the {@link
 * Union#defaultLayout|defaultLayout} will be a {@link
 * Layout#replicate|replica} with property `content`.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */
class Union extends Layout {
  constructor(discr, defaultLayout, property) {
    const upv = ((discr instanceof UInt)
               || (discr instanceof UIntBE));
    if (upv) {
      discr = new UnionLayoutDiscriminator(new OffsetLayout(discr));
    } else if ((discr instanceof ExternalLayout)
               && discr.isCount()) {
      discr = new UnionLayoutDiscriminator(discr);
    } else if (!(discr instanceof UnionDiscriminator)) {
      throw new TypeError('discr must be a UnionDiscriminator '
                          + 'or an unsigned integer layout');
    }
    if (undefined === defaultLayout) {
      defaultLayout = null;
    }
    if (!((null === defaultLayout)
          || (defaultLayout instanceof Layout))) {
      throw new TypeError('defaultLayout must be null or a Layout');
    }
    if (null !== defaultLayout) {
      if (0 > defaultLayout.span) {
        throw new Error('defaultLayout must have constant span');
      }
      if (undefined === defaultLayout.property) {
        defaultLayout = defaultLayout.replicate('content');
      }
    }

    /* The union span can be estimated only if there's a default
     * layout.  The union spans its default layout, plus any prefix
     * variant layout.  By construction both layouts, if present, have
     * non-negative span. */
    let span = -1;
    if (defaultLayout) {
      span = defaultLayout.span;
      if ((0 <= span) && upv) {
        span += discr.layout.span;
      }
    }
    super(span, property);

    /** The interface for the discriminator value in isolation.
     *
     * This a {@link UnionDiscriminator} either passed to the
     * constructor or synthesized from the `discr` constructor
     * argument.  {@link
     * Union#usesPrefixDiscriminator|usesPrefixDiscriminator} will be
     * `true` iff the `discr` parameter was a non-offset {@link
     * Layout} instance. */
    this.discriminator = discr;

    /** `true` if the {@link Union#discriminator|discriminator} is the
     * first field in the union.
     *
     * If `false` the discriminator is obtained from somewhere
     * else. */
    this.usesPrefixDiscriminator = upv;

    /** The layout for non-discriminator content when the value of the
     * discriminator is not recognized.
     *
     * This is the value passed to the constructor.  It is
     * structurally equivalent to the second component of {@link
     * Union#layout|layout} but may have a different property
     * name. */
    this.defaultLayout = defaultLayout;

    /** A registry of allowed variants.
     *
     * The keys are unsigned integers which should be compatible with
     * {@link Union.discriminator|discriminator}.  The property value
     * is the corresponding {@link VariantLayout} instances assigned
     * to this union by {@link Union#addVariant|addVariant}.
     *
     * **NOTE** The registry remains mutable so that variants can be
     * {@link Union#addVariant|added} at any time.  Users should not
     * manipulate the content of this property. */
    this.registry = {};

    /* Private variable used when invoking getSourceVariant */
    let boundGetSourceVariant = this.defaultGetSourceVariant.bind(this);

    /** Function to infer the variant selected by a source object.
     *
     * Defaults to {@link
     * Union#defaultGetSourceVariant|defaultGetSourceVariant} but may
     * be overridden using {@link
     * Union#configGetSourceVariant|configGetSourceVariant}.
     *
     * @param {Object} src - as with {@link
     * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
     *
     * @returns {(undefined|VariantLayout)} The default variant
     * (`undefined`) or first registered variant that uses a property
     * available in `src`. */
    this.getSourceVariant = function(src) {
      return boundGetSourceVariant(src);
    };

    /** Function to override the implementation of {@link
     * Union#getSourceVariant|getSourceVariant}.
     *
     * Use this if the desired variant cannot be identified using the
     * algorithm of {@link
     * Union#defaultGetSourceVariant|defaultGetSourceVariant}.
     *
     * **NOTE** The provided function will be invoked bound to this
     * Union instance, providing local access to {@link
     * Union#registry|registry}.
     *
     * @param {Function} gsv - a function that follows the API of
     * {@link Union#defaultGetSourceVariant|defaultGetSourceVariant}. */
    this.configGetSourceVariant = function(gsv) {
      boundGetSourceVariant = gsv.bind(this);
    };
  }

  /** @override */
  getSpan(b, offset) {
    if (0 <= this.span) {
      return this.span;
    }
    if (undefined === offset) {
      offset = 0;
    }
    /* Default layouts always have non-negative span, so we don't have
     * one and we have to recognize the variant which will in turn
     * determine the span. */
    const vlo = this.getVariant(b, offset);
    if (!vlo) {
      throw new Error('unable to determine span for unrecognized variant');
    }
    return vlo.getSpan(b, offset);
  }

  /**
   * Method to infer a registered Union variant compatible with `src`.
   *
   * The first satisified rule in the following sequence defines the
   * return value:
   * * If `src` has properties matching the Union discriminator and
   *   the default layout, `undefined` is returned regardless of the
   *   value of the discriminator property (this ensures the default
   *   layout will be used);
   * * If `src` has a property matching the Union discriminator, the
   *   value of the discriminator identifies a registered variant, and
   *   either (a) the variant has no layout, or (b) `src` has the
   *   variant's property, then the variant is returned (because the
   *   source satisfies the constraints of the variant it identifies);
   * * If `src` does not have a property matching the Union
   *   discriminator, but does have a property matching a registered
   *   variant, then the variant is returned (because the source
   *   matches a variant without an explicit conflict);
   * * An error is thrown (because we either can't identify a variant,
   *   or we were explicitly told the variant but can't satisfy it).
   *
   * @param {Object} src - an object presumed to be compatible with
   * the content of the Union.
   *
   * @return {(undefined|VariantLayout)} - as described above.
   *
   * @throws {Error} - if `src` cannot be associated with a default or
   * registered variant.
   */
  defaultGetSourceVariant(src) {
    if (src.hasOwnProperty(this.discriminator.property)) {
      if (this.defaultLayout
          && src.hasOwnProperty(this.defaultLayout.property)) {
        return undefined;
      }
      const vlo = this.registry[src[this.discriminator.property]];
      if (vlo
          && ((!vlo.layout)
              || src.hasOwnProperty(vlo.property))) {
        return vlo;
      }
    } else {
      for (const tag in this.registry) {
        const vlo = this.registry[tag];
        if (src.hasOwnProperty(vlo.property)) {
          return vlo;
        }
      }
    }
    throw new Error('unable to infer src variant');
  }

  /** Implement {@link Layout#decode|decode} for {@link Union}.
   *
   * If the variant is {@link Union#addVariant|registered} the return
   * value is an instance of that variant, with no explicit
   * discriminator.  Otherwise the {@link Union#defaultLayout|default
   * layout} is used to decode the content. */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    let dest;
    const dlo = this.discriminator;
    const discr = dlo.decode(b, offset);
    let clo = this.registry[discr];
    if (undefined === clo) {
      let contentOffset = 0;
      clo = this.defaultLayout;
      if (this.usesPrefixDiscriminator) {
        contentOffset = dlo.layout.span;
      }
      dest = this.makeDestinationObject();
      dest[dlo.property] = discr;
      dest[clo.property] = this.defaultLayout.decode(b, offset + contentOffset);
    } else {
      dest = clo.decode(b, offset);
    }
    return dest;
  }

  /** Implement {@link Layout#encode|encode} for {@link Union}.
   *
   * This API assumes the `src` object is consistent with the union's
   * {@link Union#defaultLayout|default layout}.  To encode variants
   * use the appropriate variant-specific {@link VariantLayout#encode}
   * method. */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    const vlo = this.getSourceVariant(src);
    if (undefined === vlo) {
      const dlo = this.discriminator;
      const clo = this.defaultLayout;
      let contentOffset = 0;
      if (this.usesPrefixDiscriminator) {
        contentOffset = dlo.layout.span;
      }
      dlo.encode(src[dlo.property], b, offset);
      return contentOffset + clo.encode(src[clo.property], b,
                                        offset + contentOffset);
    }
    return vlo.encode(src, b, offset);
  }

  /** Register a new variant structure within a union.  The newly
   * created variant is returned.
   *
   * @param {Number} variant - initializer for {@link
   * VariantLayout#variant|variant}.
   *
   * @param {Layout} layout - initializer for {@link
   * VariantLayout#layout|layout}.
   *
   * @param {String} property - initializer for {@link
   * Layout#property|property}.
   *
   * @return {VariantLayout} */
  addVariant(variant, layout, property) {
    const rv = new VariantLayout(this, variant, layout, property);
    this.registry[variant] = rv;
    return rv;
  }

  /**
   * Get the layout associated with a registered variant.
   *
   * If `vb` does not produce a registered variant the function returns
   * `undefined`.
   *
   * @param {(Number|Buffer)} vb - either the variant number, or a
   * buffer from which the discriminator is to be read.
   *
   * @param {Number} offset - offset into `vb` for the start of the
   * union.  Used only when `vb` is an instance of {Buffer}.
   *
   * @return {({VariantLayout}|undefined)}
   */
  getVariant(vb, offset) {
    let variant = vb;
    if (Buffer.isBuffer(vb)) {
      if (undefined === offset) {
        offset = 0;
      }
      variant = this.discriminator.decode(vb, offset);
    }
    return this.registry[variant];
  }
}

/**
 * Represent a specific variant within a containing union.
 *
 * **NOTE** The {@link Layout#span|span} of the variant may include
 * the span of the {@link Union#discriminator|discriminator} used to
 * identify it, but values read and written using the variant strictly
 * conform to the content of {@link VariantLayout#layout|layout}.
 *
 * **NOTE** User code should not invoke this constructor directly.  Use
 * the union {@link Union#addVariant|addVariant} helper method.
 *
 * @param {Union} union - initializer for {@link
 * VariantLayout#union|union}.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} [layout] - initializer for {@link
 * VariantLayout#layout|layout}.  If absent the variant carries no
 * data.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.  Unlike many other layouts, variant
 * layouts normally include a property name so they can be identified
 * within their containing {@link Union}.  The property identifier may
 * be absent only if `layout` is is absent.
 *
 * @augments {Layout}
 */
class VariantLayout extends Layout {
  constructor(union, variant, layout, property) {
    if (!(union instanceof Union)) {
      throw new TypeError('union must be a Union');
    }
    if ((!Number.isInteger(variant)) || (0 > variant)) {
      throw new TypeError('variant must be a (non-negative) integer');
    }
    if (('string' === typeof layout)
        && (undefined === property)) {
      property = layout;
      layout = null;
    }
    if (layout) {
      if (!(layout instanceof Layout)) {
        throw new TypeError('layout must be a Layout');
      }
      if ((null !== union.defaultLayout)
          && (0 <= layout.span)
          && (layout.span > union.defaultLayout.span)) {
        throw new Error('variant span exceeds span of containing union');
      }
      if ('string' !== typeof property) {
        throw new TypeError('variant must have a String property');
      }
    }
    let span = union.span;
    if (0 > union.span) {
      span = layout ? layout.span : 0;
      if ((0 <= span) && union.usesPrefixDiscriminator) {
        span += union.discriminator.layout.span;
      }
    }
    super(span, property);

    /** The {@link Union} to which this variant belongs. */
    this.union = union;

    /** The unsigned integral value identifying this variant within
     * the {@link Union#discriminator|discriminator} of the containing
     * union. */
    this.variant = variant;

    /** The {@link Layout} to be used when reading/writing the
     * non-discriminator part of the {@link
     * VariantLayout#union|union}.  If `null` the variant carries no
     * data. */
    this.layout = layout || null;
  }

  /** @override */
  getSpan(b, offset) {
    if (0 <= this.span) {
      /* Will be equal to the containing union span if that is not
       * variable. */
      return this.span;
    }
    if (undefined === offset) {
      offset = 0;
    }
    let contentOffset = 0;
    if (this.union.usesPrefixDiscriminator) {
      contentOffset = this.union.discriminator.layout.span;
    }
    /* Span is defined solely by the variant (and prefix discriminator) */
    return contentOffset + this.layout.getSpan(b, offset + contentOffset);
  }

  /** @override */
  decode(b, offset) {
    const dest = this.makeDestinationObject();
    if (undefined === offset) {
      offset = 0;
    }
    if (this !== this.union.getVariant(b, offset)) {
      throw new Error('variant mismatch');
    }
    let contentOffset = 0;
    if (this.union.usesPrefixDiscriminator) {
      contentOffset = this.union.discriminator.layout.span;
    }
    if (this.layout) {
      dest[this.property] = this.layout.decode(b, offset + contentOffset);
    } else if (this.property) {
      dest[this.property] = true;
    } else if (this.union.usesPrefixDiscriminator) {
      dest[this.union.discriminator.property] = this.variant;
    }
    return dest;
  }

  /** @override */
  encode(src, b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    let contentOffset = 0;
    if (this.union.usesPrefixDiscriminator) {
      contentOffset = this.union.discriminator.layout.span;
    }
    if (this.layout
        && (!src.hasOwnProperty(this.property))) {
      throw new TypeError('variant lacks property ' + this.property);
    }
    this.union.discriminator.encode(this.variant, b, offset);
    let span = contentOffset;
    if (this.layout) {
      this.layout.encode(src[this.property], b, offset + contentOffset);
      span += this.layout.getSpan(b, offset + contentOffset);
      if ((0 <= this.union.span)
          && (span > this.union.span)) {
        throw new Error('encoded variant overruns containing union');
      }
    }
    return span;
  }

  /** Delegate {@link Layout#fromArray|fromArray} to {@link
   * VariantLayout#layout|layout}. */
  fromArray(values) {
    if (this.layout) {
      return this.layout.fromArray(values);
    }
  }
}
/* eslint-enable no-extend-native */

/**
 * Contain a fixed-length block of arbitrary data, represented as a
 * Buffer.
 *
 * *Factory*: {@link module:Layout.blob|blob}
 *
 * @param {(Number|ExternalLayout)} length - initializes {@link
 * Blob#length|length}.
 *
 * @param {String} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @augments {Layout}
 */
class Blob$1 extends Layout {
  constructor(length, property) {
    if (!(((length instanceof ExternalLayout) && length.isCount())
          || (Number.isInteger(length) && (0 <= length)))) {
      throw new TypeError('length must be positive integer '
                          + 'or an unsigned integer ExternalLayout');
    }

    let span = -1;
    if (!(length instanceof ExternalLayout)) {
      span = length;
    }
    super(span, property);

    /** The number of bytes in the blob.
     *
     * This may be a non-negative integer, or an instance of {@link
     * ExternalLayout} that satisfies {@link
     * ExternalLayout#isCount|isCount()}. */
    this.length = length;
  }

  /** @override */
  getSpan(b, offset) {
    let span = this.span;
    if (0 > span) {
      span = this.length.decode(b, offset);
    }
    return span;
  }

  /** @override */
  decode(b, offset) {
    if (undefined === offset) {
      offset = 0;
    }
    let span = this.span;
    if (0 > span) {
      span = this.length.decode(b, offset);
    }
    return b.slice(offset, offset + span);
  }

  /** Implement {@link Layout#encode|encode} for {@link Blob}.
   *
   * **NOTE** If {@link Layout#count|count} is an instance of {@link
   * ExternalLayout} then the length of `src` will be encoded as the
   * count after `src` is encoded. */
  encode(src, b, offset) {
    let span = this.length;
    if (this.length instanceof ExternalLayout) {
      span = src.length;
    }
    if (!(Buffer.isBuffer(src)
          && (span === src.length))) {
      throw new TypeError(nameWithProperty('Blob.encode', this)
                          + ' requires (length ' + span + ') Buffer as src');
    }
    if ((offset + span) > b.length) {
      throw new RangeError('encoding overruns Buffer');
    }
    b.write(src.toString('hex'), offset, span, 'hex');
    if (this.length instanceof ExternalLayout) {
      this.length.encode(span, b, offset);
    }
    return span;
  }
}

/** Factory for {@link OffsetLayout}. */
var offset = ((layout, offset, property) => new OffsetLayout(layout, offset, property));

/** Factory for {@link UInt|unsigned int layouts} spanning one
 * byte. */
var u8 = (property => new UInt(1, property));

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning four bytes. */
var u32 = (property => new UInt(4, property));

/** Factory for {@link NearUInt64|little-endian unsigned int
 * layouts} interpreted as Numbers. */
var nu64 = (property => new NearUInt64(property));

/** Factory for {@link NearInt64|little-endian signed int layouts}
 * interpreted as Numbers. */
var ns64 = (property => new NearInt64(property));

/** Factory for {@link Structure} values. */
var struct = ((fields, property, decodePrefixes) => new Structure(fields, property, decodePrefixes));

/** Factory for {@link Union} values. */
var union = ((discr, defaultLayout, property) => new Union(discr, defaultLayout, property));

/** Factory for {@link Blob} values. */
var blob = ((length, property) => new Blob$1(length, property));
class RustStringLayout extends Layout_2 {
    constructor(property) {
        super(-1, property);
        this.property = property;
        this.layout = struct([
            u32("length"),
            u32("lengthPadding"),
            blob(offset(u32(), -8), "chars"),
        ], this.property);
    }
    encode(src, b, offset = 0) {
        if (src === null || src === undefined) {
            return this.layout.span;
        }
        const data = {
            chars: Buffer.from(src, "utf8"),
        };
        return this.layout.encode(data, b, offset);
    }
    decode(b, offset = 0) {
        const data = this.layout.decode(b, offset);
        return data["chars"].toString();
    }
    getSpan(b, offset = 0) {
        return (u32().span +
            u32().span +
            new BN(new Uint8Array(b).slice(offset, offset + 4), 10, "le").toNumber());
    }
}
function rustStringLayout(property) {
    return new RustStringLayout(property);
}
function publicKey$2(property) {
    return blob(32, property);
}
const LAYOUT = union(u32("instruction"));
LAYOUT.addVariant(0, struct([
    ns64("lamports"),
    ns64("space"),
    publicKey$2("owner"),
]), "createAccount");
LAYOUT.addVariant(1, struct([publicKey$2("owner")]), "assign");
LAYOUT.addVariant(2, struct([ns64("lamports")]), "transfer");
LAYOUT.addVariant(3, struct([
    publicKey$2("base"),
    rustStringLayout("seed"),
    ns64("lamports"),
    ns64("space"),
    publicKey$2("owner"),
]), "createAccountWithSeed");
LAYOUT.addVariant(4, struct([publicKey$2("authorized")]), "advanceNonceAccount");
LAYOUT.addVariant(5, struct([ns64("lamports")]), "withdrawNonceAccount");
LAYOUT.addVariant(6, struct([publicKey$2("authorized")]), "initializeNonceAccount");
LAYOUT.addVariant(7, struct([publicKey$2("authorized")]), "authorizeNonceAccount");
LAYOUT.addVariant(8, struct([ns64("space")]), "allocate");
LAYOUT.addVariant(9, struct([
    publicKey$2("base"),
    rustStringLayout("seed"),
    ns64("space"),
    publicKey$2("owner"),
]), "allocateWithSeed");
LAYOUT.addVariant(10, struct([
    publicKey$2("base"),
    rustStringLayout("seed"),
    publicKey$2("owner"),
]), "assignWithSeed");
LAYOUT.addVariant(11, struct([
    ns64("lamports"),
    rustStringLayout("seed"),
    publicKey$2("owner"),
]), "transferWithSeed");
Math.max(...Object.values(LAYOUT.registry).map((r) => r.span));
class WrappedLayout$1 extends Layout_2 {
    constructor(layout, decoder, encoder, property) {
        super(layout.span, property);
        this.layout = layout;
        this.decoder = decoder;
        this.encoder = encoder;
    }
    decode(b, offset) {
        return this.decoder(this.layout.decode(b, offset));
    }
    encode(src, b, offset) {
        return this.layout.encode(this.encoder(src), b, offset);
    }
    getSpan(b, offset) {
        return this.layout.getSpan(b, offset);
    }
}
function publicKey$1(property) {
    return new WrappedLayout$1(blob(32), (b) => new PublicKey(b), (key) => key.toBuffer(), property);
}
struct([
    u32("version"),
    u32("state"),
    publicKey$1("authorizedPubkey"),
    publicKey$1("nonce"),
    struct([nu64("lamportsPerSignature")], "feeCalculator"),
]);

new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

var browserPonyfill = {exports: {}};

(function (module, exports$1) {
var global = typeof self !== 'undefined' ? self : commonjsGlobal;
var __self__ = (function () {
function F() {
this.fetch = false;
this.DOMException = global.DOMException;
}
F.prototype = global;
return new F();
})();
(function(self) {

((function (exports$1) {

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports$1.DOMException = self.DOMException;
  try {
    new exports$1.DOMException();
  } catch (err) {
    exports$1.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports$1.DOMException.prototype = Object.create(Error.prototype);
    exports$1.DOMException.prototype.constructor = exports$1.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports$1.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports$1.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports$1.Headers = Headers;
  exports$1.Request = Request;
  exports$1.Response = Response;
  exports$1.fetch = fetch;

  Object.defineProperty(exports$1, '__esModule', { value: true });

  return exports$1;

}))({});
})(__self__);
__self__.fetch.ponyfill = true;
// Remove "polyfill" property added by whatwg-fetch
delete __self__.fetch.polyfill;
// Choose between native implementation (global) or custom implementation (__self__)
// var ctx = global.fetch ? global : __self__;
var ctx = __self__; // this line disable service worker support temporarily
exports$1 = ctx.fetch; // To enable: import fetch from 'cross-fetch'
exports$1.default = ctx.fetch; // For TypeScript consumers without esModuleInterop.
exports$1.fetch = ctx.fetch; // To enable: import {fetch} from 'cross-fetch'
exports$1.Headers = ctx.Headers;
exports$1.Request = ctx.Request;
exports$1.Response = ctx.Response;
module.exports = exports$1;
}(browserPonyfill, browserPonyfill.exports));
borsh.rustEnum([
    borsh.struct([], "uninitialized"),
    borsh.struct([borsh.option(borsh.publicKey(), "authorityAddress")], "buffer"),
    borsh.struct([borsh.publicKey("programdataAddress")], "program"),
    borsh.struct([
        borsh.u64("slot"),
        borsh.option(borsh.publicKey(), "upgradeAuthorityAddress"),
    ], "programData"),
], undefined, borsh.u32());

const PROGRAM_LOG = "Program log: ";
const PROGRAM_DATA = "Program data: ";
const PROGRAM_LOG_START_INDEX = PROGRAM_LOG.length;
const PROGRAM_DATA_START_INDEX = PROGRAM_DATA.length;
class EventManager {
    constructor(programId, provider, coder) {
        this._programId = programId;
        this._provider = provider;
        this._eventParser = new EventParser(programId, coder);
        this._eventCallbacks = new Map();
        this._eventListeners = new Map();
        this._listenerIdCount = 0;
    }
    addEventListener(eventName, callback, commitment) {
        var _a;
        let listener = this._listenerIdCount;
        this._listenerIdCount += 1;
        // Store the listener into the event map.
        if (!this._eventListeners.has(eventName)) {
            this._eventListeners.set(eventName, []);
        }
        this._eventListeners.set(eventName, ((_a = this._eventListeners.get(eventName)) !== null && _a !== void 0 ? _a : []).concat(listener));
        // Store the callback into the listener map.
        this._eventCallbacks.set(listener, [eventName, callback]);
        // Create the subscription singleton, if needed.
        if (this._onLogsSubscriptionId !== undefined) {
            return listener;
        }
        this._onLogsSubscriptionId = this._provider.connection.onLogs(this._programId, (logs, ctx) => {
            if (logs.err) {
                return;
            }
            for (const event of this._eventParser.parseLogs(logs.logs)) {
                const allListeners = this._eventListeners.get(event.name);
                if (allListeners) {
                    allListeners.forEach((listener) => {
                        const listenerCb = this._eventCallbacks.get(listener);
                        if (listenerCb) {
                            const [, callback] = listenerCb;
                            callback(event.data, ctx.slot, logs.signature);
                        }
                    });
                }
            }
        }, commitment);
        return listener;
    }
    async removeEventListener(listener) {
        // Get the callback.
        const callback = this._eventCallbacks.get(listener);
        if (!callback) {
            throw new Error(`Event listener ${listener} doesn't exist!`);
        }
        const [eventName] = callback;
        // Get the listeners.
        let listeners = this._eventListeners.get(eventName);
        if (!listeners) {
            throw new Error(`Event listeners don't exist for ${eventName}!`);
        }
        // Update both maps.
        this._eventCallbacks.delete(listener);
        listeners = listeners.filter((l) => l !== listener);
        this._eventListeners.set(eventName, listeners);
        if (listeners.length === 0) {
            this._eventListeners.delete(eventName);
        }
        // Kill the websocket connection if all listeners have been removed.
        if (this._eventCallbacks.size === 0) {
            if (this._eventListeners.size !== 0) {
                throw new Error(`Expected event listeners size to be 0 but got ${this._eventListeners.size}`);
            }
            if (this._onLogsSubscriptionId !== undefined) {
                await this._provider.connection.removeOnLogsListener(this._onLogsSubscriptionId);
                this._onLogsSubscriptionId = undefined;
            }
        }
    }
}
class EventParser {
    constructor(programId, coder) {
        this.coder = coder;
        this.programId = programId;
    }
    // Each log given, represents an array of messages emitted by
    // a single transaction, which can execute many different programs across
    // CPI boundaries. However, the subscription is only interested in the
    // events emitted by *this* program. In achieving this, we keep track of the
    // program execution context by parsing each log and looking for a CPI
    // `invoke` call. If one exists, we know a new program is executing. So we
    // push the programId onto a stack and switch the program context. This
    // allows us to track, for a given log, which program was executing during
    // its emission, thereby allowing us to know if a given log event was
    // emitted by *this* program. If it was, then we parse the raw string and
    // emit the event if the string matches the event being subscribed to.
    *parseLogs(logs, errorOnDecodeFailure = false) {
        const logScanner = new LogScanner(logs);
        const execution = new ExecutionContext();
        let log = logScanner.next();
        while (log !== null) {
            let [event, newProgram, didPop] = this.handleLog(execution, log, errorOnDecodeFailure);
            if (event) {
                yield event;
            }
            if (newProgram) {
                execution.push(newProgram);
            }
            if (didPop) {
                execution.pop();
            }
            log = logScanner.next();
        }
    }
    // Main log handler. Returns a three element array of the event, the
    // next program that was invoked for CPI, and a boolean indicating if
    // a program has completed execution (and thus should be popped off the
    // execution stack).
    handleLog(execution, log, errorOnDecodeFailure) {
        // Executing program is this program.
        if (execution.stack.length > 0 &&
            execution.program() === this.programId.toString()) {
            return this.handleProgramLog(log, errorOnDecodeFailure);
        }
        // Executing program is not this program.
        else {
            return [null, ...this.handleSystemLog(log)];
        }
    }
    // Handles logs from *this* program.
    handleProgramLog(log, errorOnDecodeFailure) {
        // This is a `msg!` log or a `sol_log_data` log.
        if (log.startsWith(PROGRAM_LOG) || log.startsWith(PROGRAM_DATA)) {
            const logStr = log.startsWith(PROGRAM_LOG)
                ? log.slice(PROGRAM_LOG_START_INDEX)
                : log.slice(PROGRAM_DATA_START_INDEX);
            const event = this.coder.events.decode(logStr);
            if (errorOnDecodeFailure && event === null) {
                throw new Error(`Unable to decode event ${logStr}`);
            }
            return [event, null, false];
        }
        // System log.
        else {
            return [null, ...this.handleSystemLog(log)];
        }
    }
    // Handles logs when the current program being executing is *not* this.
    handleSystemLog(log) {
        // System component.
        const logStart = log.split(":")[0];
        // Did the program finish executing?
        if (logStart.match(/^Program (.*) success/g) !== null) {
            return [null, true];
            // Recursive call.
        }
        else if (logStart.startsWith(`Program ${this.programId.toString()} invoke`)) {
            return [this.programId.toString(), false];
        }
        // CPI call.
        else if (logStart.includes("invoke")) {
            return ["cpi", false]; // Any string will do.
        }
        else {
            return [null, false];
        }
    }
}
// Stack frame execution context, allowing one to track what program is
// executing for a given log.
class ExecutionContext {
    constructor() {
        this.stack = [];
    }
    program() {
        if (!this.stack.length) {
            throw new Error("Expected the stack to have elements");
        }
        return this.stack[this.stack.length - 1];
    }
    push(newProgram) {
        this.stack.push(newProgram);
    }
    pop() {
        if (!this.stack.length) {
            throw new Error("Expected the stack to have elements");
        }
        this.stack.pop();
    }
}
class LogScanner {
    constructor(logs) {
        this.logs = logs;
    }
    next() {
        if (this.logs.length === 0) {
            return null;
        }
        let l = this.logs[0];
        this.logs = this.logs.slice(1);
        return l;
    }
}

function splitArgsAndCtx(idlIx, args) {
    var _a, _b;
    let options = {};
    const inputLen = idlIx.args ? idlIx.args.length : 0;
    if (args.length > inputLen) {
        if (args.length !== inputLen + 1) {
            throw new Error(`provided too many arguments ${args} to instruction ${idlIx === null || idlIx === void 0 ? void 0 : idlIx.name} expecting: ${(_b = (_a = idlIx.args) === null || _a === void 0 ? void 0 : _a.map((a) => a.name)) !== null && _b !== void 0 ? _b : []}`);
        }
        options = args.pop();
    }
    return [args, options];
}

class InstructionNamespaceFactory {
    static build(idlIx, encodeFn, programId) {
        if (idlIx.name === "_inner") {
            throw new IdlError("the _inner name is reserved");
        }
        const ix = (...args) => {
            const [ixArgs, ctx] = splitArgsAndCtx(idlIx, [...args]);
            validateAccounts(idlIx.accounts, ctx.accounts);
            validateInstruction(idlIx, ...args);
            const keys = ix.accounts(ctx.accounts);
            if (ctx.remainingAccounts !== undefined) {
                keys.push(...ctx.remainingAccounts);
            }
            if (isSet("debug-logs")) {
                console.log("Outgoing account metas:", keys);
            }
            return new TransactionInstruction({
                keys,
                programId,
                data: encodeFn(idlIx.name, toInstruction(idlIx, ...ixArgs)),
            });
        };
        // Utility fn for ordering the accounts for this instruction.
        ix["accounts"] = (accs) => {
            return InstructionNamespaceFactory.accountsArray(accs, idlIx.accounts, programId, idlIx.name);
        };
        return ix;
    }
    static accountsArray(ctx, accounts, programId, ixName) {
        if (!ctx) {
            return [];
        }
        return accounts
            .map((acc) => {
            if (isCompositeAccounts(acc)) {
                const rpcAccs = ctx[acc.name];
                return InstructionNamespaceFactory.accountsArray(rpcAccs, acc.accounts, programId, ixName).flat();
            }
            let pubkey;
            try {
                pubkey = translateAddress(ctx[acc.name]);
            }
            catch (err) {
                throw new Error(`Wrong input type for account "${acc.name}" in the instruction accounts object${ixName !== undefined ? ' for instruction "' + ixName + '"' : ""}. Expected PublicKey or string.`);
            }
            const isOptional = acc.optional && pubkey.equals(programId);
            const isWritable = Boolean(acc.writable && !isOptional);
            const isSigner = Boolean(acc.signer && !isOptional);
            return {
                pubkey,
                isWritable,
                isSigner,
            };
        })
            .flat();
    }
}
// Throws error if any argument required for the `ix` is not given.
function validateInstruction(ix, ...args) {
    // todo
}

class TransactionFactory {
    static build(idlIx, ixFn) {
        const txFn = (...args) => {
            var _a, _b, _c;
            const [, ctx] = splitArgsAndCtx(idlIx, [...args]);
            const tx = new Transaction();
            if (ctx.preInstructions && ctx.instructions) {
                throw new Error("instructions is deprecated, use preInstructions");
            }
            (_a = ctx.preInstructions) === null || _a === void 0 ? void 0 : _a.forEach((ix) => tx.add(ix));
            (_b = ctx.instructions) === null || _b === void 0 ? void 0 : _b.forEach((ix) => tx.add(ix));
            tx.add(ixFn(...args));
            (_c = ctx.postInstructions) === null || _c === void 0 ? void 0 : _c.forEach((ix) => tx.add(ix));
            return tx;
        };
        return txFn;
    }
}

class RpcFactory {
    static build(idlIx, txFn, idlErrors, provider) {
        const rpc = async (...args) => {
            var _a;
            const tx = txFn(...args);
            const [, ctx] = splitArgsAndCtx(idlIx, [...args]);
            if (provider.sendAndConfirm === undefined) {
                throw new Error("This function requires 'Provider.sendAndConfirm' to be implemented.");
            }
            try {
                return await provider.sendAndConfirm(tx, (_a = ctx.signers) !== null && _a !== void 0 ? _a : [], ctx.options);
            }
            catch (err) {
                throw translateError(err, idlErrors);
            }
        };
        return rpc;
    }
}

class AccountFactory {
    static build(idl, coder, programId, provider) {
        var _a;
        return ((_a = idl.accounts) !== null && _a !== void 0 ? _a : []).reduce((accountFns, acc) => {
            accountFns[acc.name] = new AccountClient(idl, acc, programId, provider, coder);
            return accountFns;
        }, {});
    }
}
class AccountClient {
    /**
     * Returns the number of bytes in this account.
     */
    get size() {
        return this._size;
    }
    /**
     * Returns the program ID owning all accounts.
     */
    get programId() {
        return this._programId;
    }
    /**
     * Returns the client's wallet and network provider.
     */
    get provider() {
        return this._provider;
    }
    /**
     * Returns the coder.
     */
    get coder() {
        return this._coder;
    }
    constructor(idl, idlAccount, programId, provider, coder) {
        this._idlAccount = idlAccount;
        this._programId = programId;
        this._provider = provider !== null && provider !== void 0 ? provider : getProvider();
        this._coder = coder !== null && coder !== void 0 ? coder : new BorshCoder(idl);
        this._size = this._coder.accounts.size(idlAccount.name);
    }
    /**
     * Returns a deserialized account, returning null if it doesn't exist.
     *
     * @param address The address of the account to fetch.
     */
    async fetchNullable(address, commitment) {
        const { data } = await this.fetchNullableAndContext(address, commitment);
        return data;
    }
    /**
     * Returns a deserialized account along with the associated rpc response context, returning null if it doesn't exist.
     *
     * @param address The address of the account to fetch.
     */
    async fetchNullableAndContext(address, commitment) {
        const accountInfo = await this.getAccountInfoAndContext(address, commitment);
        const { value, context } = accountInfo;
        return {
            data: value && value.data.length !== 0
                ? this._coder.accounts.decode(this._idlAccount.name, value.data)
                : null,
            context,
        };
    }
    /**
     * Returns a deserialized account.
     *
     * @param address The address of the account to fetch.
     */
    async fetch(address, commitment) {
        const { data } = await this.fetchNullableAndContext(address, commitment);
        if (data === null) {
            throw new Error(`Account does not exist or has no data ${address.toString()}`);
        }
        return data;
    }
    /**
     * Returns a deserialized account along with the associated rpc response context.
     *
     * @param address The address of the account to fetch.
     */
    async fetchAndContext(address, commitment) {
        const { data, context } = await this.fetchNullableAndContext(address, commitment);
        if (data === null) {
            throw new Error(`Account does not exist ${address.toString()}`);
        }
        return { data, context };
    }
    /**
     * Returns multiple deserialized accounts.
     * Accounts not found or with wrong discriminator are returned as null.
     *
     * @param addresses The addresses of the accounts to fetch.
     */
    async fetchMultiple(addresses, commitment) {
        const accounts = await this.fetchMultipleAndContext(addresses, commitment);
        return accounts.map((account) => (account ? account.data : null));
    }
    /**
     * Returns multiple deserialized accounts.
     * Accounts not found or with wrong discriminator are returned as null.
     *
     * @param addresses The addresses of the accounts to fetch.
     */
    async fetchMultipleAndContext(addresses, commitment) {
        const accounts = await getMultipleAccountsAndContext(this._provider.connection, addresses.map((address) => translateAddress(address)), commitment);
        // Decode accounts where discriminator is correct, null otherwise
        return accounts.map((result) => {
            if (result == null) {
                return null;
            }
            const { account, context } = result;
            return {
                data: this._coder.accounts.decode(this._idlAccount.name, account.data),
                context,
            };
        });
    }
    /**
     * Returns all instances of this account type for the program.
     *
     * @param filters User-provided filters to narrow the results from `connection.getProgramAccounts`.
     *
     *                When filters are not defined this method returns all
     *                the account instances.
     *
     *                When filters are of type `Buffer`, the filters are appended
     *                after the discriminator.
     *
     *                When filters are of type `GetProgramAccountsFilter[]`,
     *                filters are appended after the discriminator filter.
     */
    async all(filters) {
        const filter = this.coder.accounts.memcmp(this._idlAccount.name, filters instanceof Buffer ? filters : undefined);
        const coderFilters = [];
        if ((filter === null || filter === void 0 ? void 0 : filter.offset) != undefined && (filter === null || filter === void 0 ? void 0 : filter.bytes) != undefined) {
            coderFilters.push({
                memcmp: { offset: filter.offset, bytes: filter.bytes },
            });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.dataSize) != undefined) {
            coderFilters.push({ dataSize: filter.dataSize });
        }
        let resp = await this._provider.connection.getProgramAccounts(this._programId, {
            commitment: this._provider.connection.commitment,
            filters: [...coderFilters, ...(Array.isArray(filters) ? filters : [])],
        });
        return resp.map(({ pubkey, account }) => {
            return {
                publicKey: pubkey,
                account: this._coder.accounts.decode(this._idlAccount.name, account.data),
            };
        });
    }
    /**
     * Returns an `EventEmitter` emitting a "change" event whenever the account
     * changes.
     */
    subscribe(address, commitment) {
        const sub = subscriptions.get(address.toString());
        if (sub) {
            return sub.ee;
        }
        const ee = new EventEmitter();
        address = translateAddress(address);
        const listener = this._provider.connection.onAccountChange(address, (acc) => {
            const account = this._coder.accounts.decode(this._idlAccount.name, acc.data);
            ee.emit("change", account);
        }, commitment);
        subscriptions.set(address.toString(), {
            ee,
            listener,
        });
        return ee;
    }
    /**
     * Unsubscribes from the account at the given address.
     */
    async unsubscribe(address) {
        let sub = subscriptions.get(address.toString());
        if (!sub) {
            console.warn("Address is not subscribed");
            return;
        }
        if (subscriptions) {
            await this._provider.connection
                .removeAccountChangeListener(sub.listener)
                .then(() => {
                subscriptions.delete(address.toString());
            })
                .catch(console.error);
        }
    }
    /**
     * Returns an instruction for creating this account.
     */
    async createInstruction(signer, sizeOverride) {
        const size = this.size;
        if (this._provider.publicKey === undefined) {
            throw new Error("This function requires the Provider interface implementor to have a 'publicKey' field.");
        }
        return SystemProgram.createAccount({
            fromPubkey: this._provider.publicKey,
            newAccountPubkey: signer.publicKey,
            space: sizeOverride !== null && sizeOverride !== void 0 ? sizeOverride : size,
            lamports: await this._provider.connection.getMinimumBalanceForRentExemption(sizeOverride !== null && sizeOverride !== void 0 ? sizeOverride : size),
            programId: this._programId,
        });
    }
    async getAccountInfo(address, commitment) {
        return await this._provider.connection.getAccountInfo(translateAddress(address), commitment);
    }
    async getAccountInfoAndContext(address, commitment) {
        return await this._provider.connection.getAccountInfoAndContext(translateAddress(address), commitment);
    }
}
// Tracks all subscriptions.
const subscriptions = new Map();

class SimulateFactory {
    static build(idlIx, txFn, idlErrors, provider, coder, programId, idl) {
        const simulate = async (...args) => {
            var _a;
            const tx = txFn(...args);
            const [, ctx] = splitArgsAndCtx(idlIx, [...args]);
            let resp = undefined;
            if (provider.simulate === undefined) {
                throw new Error("This function requires 'Provider.simulate' to be implemented.");
            }
            try {
                resp = await provider.simulate(tx, ctx.signers, (_a = ctx.options) === null || _a === void 0 ? void 0 : _a.commitment);
            }
            catch (err) {
                throw translateError(err, idlErrors);
            }
            if (resp === undefined) {
                throw new Error("Unable to simulate transaction");
            }
            const logs = resp.logs;
            if (!logs) {
                throw new Error("Simulated logs not found");
            }
            const events = [];
            if (idl.events) {
                let parser = new EventParser(programId, coder);
                for (const event of parser.parseLogs(logs)) {
                    events.push(event);
                }
            }
            return { events, raw: logs };
        };
        return simulate;
    }
}

function uint64(property) {
    return new WrappedLayout(blob(8), (b) => u64.fromBuffer(b), (n) => n.toBuffer(), property);
}
function publicKey(property) {
    return new WrappedLayout(blob(32), (b) => new PublicKey(b), (key) => key.toBuffer(), property);
}
function coption(layout, property) {
    return new COptionLayout(layout, property);
}
class WrappedLayout extends Layout_2 {
    constructor(layout, decoder, encoder, property) {
        super(layout.span, property);
        this.layout = layout;
        this.decoder = decoder;
        this.encoder = encoder;
    }
    decode(b, offset) {
        return this.decoder(this.layout.decode(b, offset));
    }
    encode(src, b, offset) {
        return this.layout.encode(this.encoder(src), b, offset);
    }
    getSpan(b, offset) {
        return this.layout.getSpan(b, offset);
    }
}
class COptionLayout extends Layout_2 {
    constructor(layout, property) {
        super(-1, property);
        this.layout = layout;
        this.discriminator = u32();
    }
    encode(src, b, offset = 0) {
        if (src === null || src === undefined) {
            return this.layout.span + this.discriminator.encode(0, b, offset);
        }
        this.discriminator.encode(1, b, offset);
        return this.layout.encode(src, b, offset + 4) + 4;
    }
    decode(b, offset = 0) {
        const discriminator = this.discriminator.decode(b, offset);
        if (discriminator === 0) {
            return null;
        }
        else if (discriminator === 1) {
            return this.layout.decode(b, offset + 4);
        }
        throw new Error("Invalid coption " + this.layout.property);
    }
    getSpan(b, offset = 0) {
        return this.layout.getSpan(b, offset + 4) + 4;
    }
}
class u64 extends BN {
    /**
     * Convert to Buffer representation
     */
    toBuffer() {
        const a = super.toArray().reverse();
        const b = Buffer.from(a);
        if (b.length === 8) {
            return b;
        }
        if (b.length >= 8) {
            throw new Error("u64 too large");
        }
        const zeroPad = Buffer.alloc(8);
        b.copy(zeroPad);
        return zeroPad;
    }
    /**
     * Construct a u64 from Buffer representation
     */
    static fromBuffer(buffer) {
        if (buffer.length !== 8) {
            throw new Error(`Invalid buffer length: ${buffer.length}`);
        }
        return new u64([...buffer]
            .reverse()
            .map((i) => `00${i.toString(16)}`.slice(-2))
            .join(""), 16);
    }
}
const TOKEN_ACCOUNT_LAYOUT = struct([
    publicKey("mint"),
    publicKey("owner"),
    uint64("amount"),
    coption(publicKey(), "delegate"),
    ((p) => {
        const U = union(u8("discriminator"), null, p);
        U.addVariant(0, struct([]), "uninitialized");
        U.addVariant(1, struct([]), "initialized");
        U.addVariant(2, struct([]), "frozen");
        return U;
    })("state"),
    coption(uint64(), "isNative"),
    uint64("delegatedAmount"),
    coption(publicKey(), "closeAuthority"),
]);
function decodeTokenAccount(b) {
    return TOKEN_ACCOUNT_LAYOUT.decode(b);
}

// Populates a given accounts context with PDAs and common missing accounts.
class AccountsResolver {
    constructor(_args, _accounts, _provider, _programId, _idlIx, accountNamespace, _idlTypes, _customResolver) {
        this._args = _args;
        this._accounts = _accounts;
        this._provider = _provider;
        this._programId = _programId;
        this._idlIx = _idlIx;
        this._idlTypes = _idlTypes;
        this._customResolver = _customResolver;
        this._accountStore = new AccountStore(_provider, accountNamespace, _programId);
    }
    args(args) {
        this._args = args;
    }
    // Note: We serially resolve PDAs one by one rather than doing them
    //       in parallel because there can be dependencies between
    //       addresses. That is, one PDA can be used as a seed in another.
    async resolve() {
        this.resolveEventCpi(this._idlIx.accounts);
        this.resolveConst(this._idlIx.accounts);
        // Auto populate pdas and relations until we stop finding new accounts
        let depth = 0;
        while ((await this.resolvePdasAndRelations(this._idlIx.accounts)) +
            (await this.resolveCustom()) >
            0) {
            depth++;
            if (depth === 16) {
                const isResolvable = (acc) => {
                    if (!isCompositeAccounts(acc)) {
                        return !!(acc.address || acc.pda || acc.relations);
                    }
                    return acc.accounts.some(isResolvable);
                };
                const getPaths = (accs, path = [], paths = []) => {
                    for (const acc of accs) {
                        if (isCompositeAccounts(acc)) {
                            paths.push(...getPaths(acc.accounts, [...path, acc.name]));
                        }
                        else {
                            paths.push([...path, acc.name]);
                        }
                    }
                    return paths;
                };
                const resolvableAccs = this._idlIx.accounts.filter(isResolvable);
                const unresolvedAccs = getPaths(resolvableAccs)
                    .filter((path) => !this.get(path))
                    .map((path) => path.reduce((acc, p) => acc + "." + p))
                    .map((acc) => `\`${acc}\``)
                    .join(", ");
                throw new Error([
                    `Reached maximum depth for account resolution.`,
                    `Unresolved accounts: ${unresolvedAccs}`,
                ].join(" "));
            }
        }
    }
    resolveOptionals(accounts) {
        Object.assign(this._accounts, this.resolveOptionalsHelper(accounts, this._idlIx.accounts));
    }
    get(path) {
        // Only return if pubkey
        const ret = path.reduce((acc, subPath) => acc && acc[subPath], this._accounts);
        if (ret && ret.toBase58) {
            return ret;
        }
    }
    set(path, value) {
        let cur = this._accounts;
        path.forEach((p, i) => {
            var _a;
            const isLast = i === path.length - 1;
            if (isLast) {
                cur[p] = value;
            }
            cur[p] = (_a = cur[p]) !== null && _a !== void 0 ? _a : {};
            cur = cur[p];
        });
    }
    resolveOptionalsHelper(partialAccounts, accounts) {
        const nestedAccountsGeneric = {};
        // Looping through accountItem array instead of on partialAccounts, so
        // we only traverse array once
        for (const accountItem of accounts) {
            const accountName = accountItem.name;
            const partialAccount = partialAccounts[accountName];
            // Skip if the account isn't included (thus would be undefined)
            if (partialAccount === undefined)
                continue;
            if (isPartialAccounts(partialAccount)) {
                // is compound accounts, recurse one level deeper
                if (isCompositeAccounts(accountItem)) {
                    nestedAccountsGeneric[accountName] = this.resolveOptionalsHelper(partialAccount, accountItem["accounts"]);
                }
                else {
                    // Here we try our best to recover gracefully. If there are optionals we can't check, we will fail then.
                    nestedAccountsGeneric[accountName] = flattenPartialAccounts(partialAccount);
                }
            }
            else {
                // if not compound accounts, do null/optional check and proceed
                if (partialAccount !== null) {
                    nestedAccountsGeneric[accountName] = translateAddress(partialAccount);
                }
                else if (accountItem["optional"]) {
                    nestedAccountsGeneric[accountName] = this._programId;
                }
            }
        }
        return nestedAccountsGeneric;
    }
    async resolveCustom() {
        if (this._customResolver) {
            const { accounts, resolved } = await this._customResolver({
                args: this._args,
                accounts: this._accounts,
                provider: this._provider,
                programId: this._programId,
                idlIx: this._idlIx,
            });
            this._accounts = accounts;
            return resolved;
        }
        return 0;
    }
    /**
     * Resolve event CPI accounts `eventAuthority` and `program`.
     *
     * Accounts will only be resolved if they are declared next to each other to
     * reduce the chance of name collision.
     */
    resolveEventCpi(accounts, path = []) {
        for (const i in accounts) {
            const accountOrAccounts = accounts[i];
            if (isCompositeAccounts(accountOrAccounts)) {
                this.resolveEventCpi(accountOrAccounts.accounts, [
                    ...path,
                    accountOrAccounts.name,
                ]);
            }
            // Validate next index exists
            const nextIndex = +i + 1;
            if (nextIndex === accounts.length)
                return;
            const currentName = accounts[i].name;
            const nextName = accounts[nextIndex].name;
            // Populate event CPI accounts if they exist
            if (currentName === "eventAuthority" && nextName === "program") {
                const currentPath = [...path, currentName];
                const nextPath = [...path, nextName];
                if (!this.get(currentPath)) {
                    this.set(currentPath, PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], this._programId)[0]);
                }
                if (!this.get(nextPath)) {
                    this.set(nextPath, this._programId);
                }
                return;
            }
        }
    }
    resolveConst(accounts, path = []) {
        for (const accountOrAccounts of accounts) {
            const name = accountOrAccounts.name;
            if (isCompositeAccounts(accountOrAccounts)) {
                this.resolveConst(accountOrAccounts.accounts, [...path, name]);
            }
            else {
                const account = accountOrAccounts;
                if ((account.signer || account.address) && !this.get([...path, name])) {
                    // Default signers to the provider
                    if (account.signer) {
                        if (!this._provider.publicKey) {
                            throw new Error("This function requires the `Provider` interface implementor to have a `publicKey` field.");
                        }
                        this.set([...path, name], this._provider.publicKey);
                    }
                    // Set based on `address` field
                    if (account.address) {
                        this.set([...path, name], translateAddress(account.address));
                    }
                }
            }
        }
    }
    async resolvePdasAndRelations(accounts, path = []) {
        let found = 0;
        for (const accountOrAccounts of accounts) {
            const name = accountOrAccounts.name;
            if (isCompositeAccounts(accountOrAccounts)) {
                found += await this.resolvePdasAndRelations(accountOrAccounts.accounts, [...path, name]);
            }
            else {
                const account = accountOrAccounts;
                if ((account.pda || account.relations) && !this.get([...path, name])) {
                    found++;
                    // Accounts might not get resolved successfully if a seed depends on
                    // another seed to be resolved *and* the accounts for resolution are
                    // out of order. In this case, skip the accounts that throw in order
                    // to resolve those accounts later.
                    try {
                        if (account.pda) {
                            const seeds = await Promise.all(account.pda.seeds.map((seed) => this.toBuffer(seed, path)));
                            if (seeds.some((seed) => !seed)) {
                                continue;
                            }
                            const programId = await this.parseProgramId(account, path);
                            const [pubkey] = PublicKey.findProgramAddressSync(seeds, programId);
                            this.set([...path, name], pubkey);
                        }
                    }
                    catch { }
                    try {
                        if (account.relations) {
                            const accountKey = this.get([...path, account.relations[0]]);
                            if (accountKey) {
                                const account = await this._accountStore.fetchAccount({
                                    publicKey: accountKey,
                                });
                                this.set([...path, name], account[name]);
                            }
                        }
                    }
                    catch { }
                }
            }
        }
        return found;
    }
    async parseProgramId(account, path = []) {
        var _a;
        if (!((_a = account.pda) === null || _a === void 0 ? void 0 : _a.program)) {
            return this._programId;
        }
        const buf = await this.toBuffer(account.pda.program, path);
        if (!buf) {
            throw new Error(`Program seed not resolved: ${account.name}`);
        }
        return new PublicKey(buf);
    }
    async toBuffer(seed, path = []) {
        switch (seed.kind) {
            case "const":
                return this.toBufferConst(seed);
            case "arg":
                return await this.toBufferArg(seed);
            case "account":
                return await this.toBufferAccount(seed, path);
            default:
                throw new Error(`Unexpected seed: ${seed}`);
        }
    }
    toBufferConst(seed) {
        return this.toBufferValue("bytes", seed.value);
    }
    async toBufferArg(seed) {
        const [name, ...path] = seed.path.split(".");
        const index = this._idlIx.args.findIndex((arg) => arg.name === name);
        if (index === -1) {
            throw new Error(`Unable to find argument for seed: ${name}`);
        }
        const value = path.reduce((acc, path) => (acc !== null && acc !== void 0 ? acc : {})[path], this._args[index]);
        if (value === undefined) {
            return;
        }
        const type = this.getType(this._idlIx.args[index].type, path);
        return this.toBufferValue(type, value);
    }
    async toBufferAccount(seed, path = []) {
        const [name, ...paths] = seed.path.split(".");
        const fieldPubkey = this.get([...path, name]);
        if (!fieldPubkey)
            return;
        // The seed is a pubkey of the account.
        if (!paths.length) {
            return this.toBufferValue("pubkey", fieldPubkey);
        }
        if (!seed.account) {
            throw new Error(`Seed account is required in order to resolve type: ${seed.path}`);
        }
        // The key is account data.
        //
        // Fetch and deserialize it.
        const account = await this._accountStore.fetchAccount({
            publicKey: fieldPubkey,
            name: seed.account,
        });
        // Dereference all fields in the path to get the field value
        // used in the seed.
        let accountValue = account;
        let currentPaths = paths;
        while (currentPaths.length > 0) {
            accountValue = accountValue[currentPaths[0]];
            currentPaths = currentPaths.slice(1);
        }
        if (accountValue === undefined)
            return;
        const type = this.getType({ defined: { name: seed.account } }, paths);
        return this.toBufferValue(type, accountValue);
    }
    /**
     * Converts the given idl valaue into a Buffer. The values here must be
     * primitives, e.g. no structs.
     */
    toBufferValue(type, value) {
        switch (type) {
            case "u8":
            case "i8":
                return Buffer.from([value]);
            case "u16":
            case "i16":
                return new BN(value).toArrayLike(Buffer, "le", 2);
            case "u32":
            case "i32":
                return new BN(value).toArrayLike(Buffer, "le", 4);
            case "u64":
            case "i64":
                return new BN(value).toArrayLike(Buffer, "le", 8);
            case "u128":
            case "i128":
                return new BN(value).toArrayLike(Buffer, "le", 16);
            case "u256":
            case "i256":
                return new BN(value).toArrayLike(Buffer, "le", 32);
            case "string":
                return Buffer.from(value);
            case "pubkey":
                return value.toBuffer();
            case "bytes":
                return Buffer.from(value);
            default:
                if (type === null || type === void 0 ? void 0 : type.array) {
                    return Buffer.from(value);
                }
                throw new Error(`Unexpected seed type: ${type}`);
        }
    }
    /**
     * Recursively get the type at some path of either a primitive or a user
     * defined struct.
     */
    getType(type, path = []) {
        var _a;
        const typeName = (_a = type === null || type === void 0 ? void 0 : type.defined) === null || _a === void 0 ? void 0 : _a.name;
        if (typeName) {
            // Handle token account separately
            if (typeName === "tokenAccount") {
                switch (path.at(0)) {
                    case "mint":
                    case "owner":
                        return "pubkey";
                    case "amount":
                    case "delagatedAmount":
                        return "u64";
                    default:
                        throw new Error(`Unknown token account path: ${path}`);
                }
            }
            const definedType = this._idlTypes.find((t) => t.name === typeName);
            if (!definedType) {
                throw new Error(`Type not found: ${typeName}`);
            }
            // Only named structs are supported
            const [fieldName, ...subPath] = path;
            const fields = definedType.type
                .fields;
            const field = fields.find((field) => field.name === fieldName);
            if (!field) {
                throw new Error(`Field not found: ${fieldName}`);
            }
            return this.getType(field.type, subPath);
        }
        return type;
    }
}
// TODO: this should be configurable to avoid unnecessary requests.
class AccountStore {
    constructor(_provider, accounts, programId) {
        this._provider = _provider;
        this._cache = new Map();
        this._idls = {};
        this._idls[programId.toBase58()] = accounts;
    }
    async fetchAccount({ publicKey, name, }) {
        const address = publicKey.toBase58();
        if (!this._cache.has(address)) {
            const accountInfo = await this._provider.connection.getAccountInfo(publicKey);
            if (accountInfo === null) {
                throw new Error(`Account not found: ${address}`);
            }
            if (name === "tokenAccount") {
                const account = decodeTokenAccount(accountInfo.data);
                this._cache.set(address, account);
            }
            else {
                const accounts = await this.getAccountsNs(accountInfo.owner);
                if (accounts) {
                    const accountNs = Object.values(accounts)[0];
                    if (accountNs) {
                        const account = accountNs.coder.accounts.decodeAny(accountInfo.data);
                        this._cache.set(address, account);
                    }
                }
            }
        }
        return this._cache.get(address);
    }
    async getAccountsNs(programId) {
        const programIdStr = programId.toBase58();
        if (!this._idls[programIdStr]) {
            const idl = await Program.fetchIdl(programId, this._provider);
            if (idl) {
                const program = new Program(idl, this._provider);
                this._idls[programIdStr] = program.account;
            }
        }
        return this._idls[programIdStr];
    }
}

class MethodsBuilderFactory {
    static build(provider, programId, idlIx, ixFn, txFn, rpcFn, simulateFn, viewFn, accountNamespace, idlTypes, customResolver) {
        return (...args) => new MethodsBuilder(args, ixFn, txFn, rpcFn, simulateFn, viewFn, provider, programId, idlIx, accountNamespace, idlTypes, customResolver);
    }
}
function isPartialAccounts(partialAccount) {
    return (typeof partialAccount === "object" &&
        partialAccount !== null &&
        !("_bn" in partialAccount) // Ensures not a pubkey
    );
}
function flattenPartialAccounts(partialAccounts, throwOnNull) {
    const toReturn = {};
    for (const accountName in partialAccounts) {
        const account = partialAccounts[accountName];
        if (account === null) {
            throw new Error("Failed to resolve optionals due to IDL type mismatch with input accounts!");
        }
        toReturn[accountName] = isPartialAccounts(account)
            ? flattenPartialAccounts(account)
            : translateAddress(account);
    }
    return toReturn;
}
class MethodsBuilder {
    constructor(_args, _ixFn, _txFn, _rpcFn, _simulateFn, _viewFn, provider, programId, idlIx, accountNamespace, idlTypes, customResolver) {
        this._args = _args;
        this._ixFn = _ixFn;
        this._txFn = _txFn;
        this._rpcFn = _rpcFn;
        this._simulateFn = _simulateFn;
        this._viewFn = _viewFn;
        this._accounts = {};
        this._remainingAccounts = [];
        this._signers = [];
        this._preInstructions = [];
        this._postInstructions = [];
        this._resolveAccounts = true;
        this._accountsResolver = new AccountsResolver(_args, this._accounts, provider, programId, idlIx, accountNamespace, idlTypes, customResolver);
    }
    args(args) {
        this._args = args;
        this._accountsResolver.args(args);
    }
    /**
     * Set instruction accounts with account resolution.
     *
     * This method only accepts accounts that cannot be resolved.
     *
     * See {@link accountsPartial} for overriding the account resolution or
     * {@link accountsStrict} for strictly specifying all accounts.
     */
    accounts(accounts) {
        // @ts-ignore
        return this.accountsPartial(accounts);
    }
    /**
     * Set instruction accounts with account resolution.
     *
     * There is no functional difference between this method and {@link accounts}
     * method, the only difference is this method allows specifying all accounts
     * even if they can be resolved. On the other hand, {@link accounts} method
     * doesn't accept accounts that can be resolved.
     */
    accountsPartial(accounts) {
        this._resolveAccounts = true;
        this._accountsResolver.resolveOptionals(accounts);
        return this;
    }
    /**
     * Set instruction accounts without account resolution.
     *
     * All accounts strictly need to be specified when this method is used.
     *
     * See {@link accounts} and {@link accountsPartial} methods for automatically
     * resolving accounts.
     *
     * @param accounts instruction accounts
     */
    accountsStrict(accounts) {
        this._resolveAccounts = false;
        this._accountsResolver.resolveOptionals(accounts);
        return this;
    }
    /**
     * Set instruction signers.
     *
     * Note that calling this method appends the given signers to the existing
     * signers (instead of overriding them).
     *
     * @param signers signers to append
     */
    signers(signers) {
        this._signers = this._signers.concat(signers);
        return this;
    }
    /**
     * Set remaining accounts.
     *
     * Note that calling this method appends the given accounts to the existing
     * remaining accounts (instead of overriding them).
     *
     * @param accounts remaining accounts
     */
    remainingAccounts(accounts) {
        this._remainingAccounts = this._remainingAccounts.concat(accounts);
        return this;
    }
    /**
     * Set previous instructions.
     *
     * See {@link postInstructions} to set the post instructions instead.
     *
     * @param ixs instructions
     * @param prepend whether to prepend to the existing previous instructions
     */
    preInstructions(ixs, prepend = false) {
        if (prepend) {
            this._preInstructions = ixs.concat(this._preInstructions);
        }
        else {
            this._preInstructions = this._preInstructions.concat(ixs);
        }
        return this;
    }
    /**
     * Set post instructions.
     *
     * See {@link preInstructions} to set the previous instructions instead.
     *
     * @param ixs instructions
     */
    postInstructions(ixs) {
        this._postInstructions = this._postInstructions.concat(ixs);
        return this;
    }
    /**
     * Get the public keys of the instruction accounts.
     *
     * The return type is an object with account names as keys and their public
     * keys as their values.
     *
     * Note that an account key is `undefined` if the account hasn't yet been
     * specified or resolved.
     */
    async pubkeys() {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        // @ts-ignore
        return this._accounts;
    }
    /**
     * Create an instruction based on the current configuration.
     *
     * See {@link transaction} to create a transaction instead.
     *
     * @returns the transaction instruction
     */
    async instruction() {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        // @ts-ignore
        return this._ixFn(...this._args, {
            accounts: this._accounts,
            signers: this._signers,
            remainingAccounts: this._remainingAccounts,
            preInstructions: this._preInstructions,
            postInstructions: this._postInstructions,
        });
    }
    /**
     * Create a transaction based on the current configuration.
     *
     * This method doesn't send the created transaction. Use {@link rpc} method
     * to conveniently send an confirm the configured transaction.
     *
     * See {@link instruction} to only create an instruction instead.
     *
     * @returns the transaction
     */
    async transaction() {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        // @ts-ignore
        return this._txFn(...this._args, {
            accounts: this._accounts,
            signers: this._signers,
            remainingAccounts: this._remainingAccounts,
            preInstructions: this._preInstructions,
            postInstructions: this._postInstructions,
        });
    }
    /**
     * Simulate the configured transaction.
     *
     * @param options confirmation options
     * @returns the simulation response
     */
    async simulate(options) {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        // @ts-ignore
        return this._simulateFn(...this._args, {
            accounts: this._accounts,
            signers: this._signers,
            remainingAccounts: this._remainingAccounts,
            preInstructions: this._preInstructions,
            postInstructions: this._postInstructions,
            options,
        });
    }
    /**
     * View the configured transaction.
     *
     * Note that to use this method, the instruction needs to return a value and
     * all its accounts must be read-only.
     *
     * @param options confirmation options
     * @returns the return value of the instruction
     */
    async view(options) {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        if (!this._viewFn) {
            throw new Error([
                "Method does not support views.",
                "The instruction should return a value, and its accounts must be read-only",
            ].join(" "));
        }
        // @ts-ignore
        return this._viewFn(...this._args, {
            accounts: this._accounts,
            signers: this._signers,
            remainingAccounts: this._remainingAccounts,
            preInstructions: this._preInstructions,
            postInstructions: this._postInstructions,
            options,
        });
    }
    /**
     * Send and confirm the configured transaction.
     *
     * See {@link rpcAndKeys} to both send the transaction and get the resolved
     * account public keys.
     *
     * @param options confirmation options
     * @returns the transaction signature
     */
    async rpc(options) {
        if (this._resolveAccounts) {
            await this._accountsResolver.resolve();
        }
        // @ts-ignore
        return this._rpcFn(...this._args, {
            accounts: this._accounts,
            signers: this._signers,
            remainingAccounts: this._remainingAccounts,
            preInstructions: this._preInstructions,
            postInstructions: this._postInstructions,
            options,
        });
    }
    /**
     * Conveniently call both {@link rpc} and {@link pubkeys} methods.
     *
     * @param options confirmation options
     * @returns the transaction signature and account public keys
     */
    async rpcAndKeys(options) {
        return {
            signature: await this.rpc(options),
            pubkeys: (await this.pubkeys()),
        };
    }
    /**
     * Get instruction information necessary to include the instruction inside a
     * transaction.
     *
     * # Example
     *
     * ```ts
     * const { instruction, signers, pubkeys } = await method.prepare();
     * ```
     */
    async prepare() {
        return {
            instruction: await this.instruction(),
            signers: this._signers,
            pubkeys: await this.pubkeys(),
        };
    }
}

class ViewFactory {
    static build(programId, idlIx, simulateFn, idl) {
        const isWritable = idlIx.accounts.find((a) => a.writable);
        const hasReturn = !!idlIx.returns;
        if (isWritable || !hasReturn)
            return;
        const view = async (...args) => {
            let simulationResult = await simulateFn(...args);
            const returnPrefix = `Program return: ${programId} `;
            let returnLog = simulationResult.raw.find((l) => l.startsWith(returnPrefix));
            if (!returnLog) {
                throw new Error("View expected return log");
            }
            let returnData = decode(returnLog.slice(returnPrefix.length));
            let returnType = idlIx.returns;
            if (!returnType) {
                throw new Error("View expected return type");
            }
            const coder = IdlCoder.fieldLayout({ type: returnType }, idl.types);
            return coder.decode(returnData);
        };
        return view;
    }
}

class NamespaceFactory {
    /**
     * Generates all namespaces for a given program.
     */
    static build(idl, coder, programId, provider, getCustomResolver) {
        const rpc = {};
        const instruction = {};
        const transaction = {};
        const simulate = {};
        const methods = {};
        const view = {};
        const idlErrors = parseIdlErrors(idl);
        const account = idl.accounts
            ? AccountFactory.build(idl, coder, programId, provider)
            : {};
        idl.instructions.forEach((idlIx) => {
            const ixItem = InstructionNamespaceFactory.build(idlIx, (ixName, ix) => coder.instruction.encode(ixName, ix), programId);
            const txItem = TransactionFactory.build(idlIx, ixItem);
            const rpcItem = RpcFactory.build(idlIx, txItem, idlErrors, provider);
            const simulateItem = SimulateFactory.build(idlIx, txItem, idlErrors, provider, coder, programId, idl);
            const viewItem = ViewFactory.build(programId, idlIx, simulateItem, idl);
            const methodItem = MethodsBuilderFactory.build(provider, programId, idlIx, ixItem, txItem, rpcItem, simulateItem, viewItem, account, idl.types || [], getCustomResolver === null || getCustomResolver === void 0 ? void 0 : getCustomResolver(idlIx));
            const name = idlIx.name;
            instruction[name] = ixItem;
            transaction[name] = txItem;
            rpc[name] = rpcItem;
            simulate[name] = simulateItem;
            methods[name] = methodItem;
            if (viewItem) {
                view[name] = viewItem;
            }
        });
        return [
            rpc,
            instruction,
            transaction,
            account,
            simulate,
            methods,
            view,
        ];
    }
}

/**
 * ## Program
 *
 * Program provides the IDL deserialized client representation of an Anchor
 * program.
 *
 * This API is the one stop shop for all things related to communicating with
 * on-chain programs. Among other things, one can send transactions, fetch
 * deserialized accounts, decode instruction data, subscribe to account
 * changes, and listen to events.
 *
 * In addition to field accessors and methods, the object provides a set of
 * dynamically generated properties, also known as namespaces, that
 * map one-to-one to program methods and accounts. These namespaces generally
 *  can be used as follows:
 *
 * ## Usage
 *
 * ```javascript
 * program.<namespace>.<program-specific-method>
 * ```
 *
 * API specifics are namespace dependent. The examples used in the documentation
 * below will refer to the two counter examples found
 * [here](https://github.com/coral-xyz/anchor#examples).
 */
class Program {
    /**
     * Address of the program.
     */
    get programId() {
        return this._programId;
    }
    /**
     * IDL in camelCase format to work in TypeScript.
     *
     * See {@link rawIdl} field if you need the original IDL.
     */
    get idl() {
        return this._idl;
    }
    /**
     * Raw IDL i.e. the original IDL without camelCase conversion.
     *
     * See {@link idl} field if you need the camelCased version of the IDL.
     */
    get rawIdl() {
        return this._rawIdl;
    }
    /**
     * Coder for serializing requests.
     */
    get coder() {
        return this._coder;
    }
    /**
     * Wallet and network provider.
     */
    get provider() {
        return this._provider;
    }
    /**
     * @param idl       The interface definition.
     * @param provider  The network and wallet context to use. If not provided
     *                  then uses [[getProvider]].
     * @param getCustomResolver A function that returns a custom account resolver
     *                          for the given instruction. This is useful for resolving
     *                          public keys of missing accounts when building instructions
     */
    constructor(idl, provider = getProvider(), coder, getCustomResolver) {
        // Fields.
        this._idl = convertIdlToCamelCase(idl);
        this._rawIdl = idl;
        this._provider = provider;
        this._programId = translateAddress(idl.address);
        this._coder = coder !== null && coder !== void 0 ? coder : new BorshCoder(this._idl);
        this._events = new EventManager(this._programId, provider, this._coder);
        // Dynamic namespaces.
        const [rpc, instruction, transaction, account, simulate, methods, views] = NamespaceFactory.build(this._idl, this._coder, this._programId, provider, getCustomResolver);
        this.rpc = rpc;
        this.instruction = instruction;
        this.transaction = transaction;
        this.account = account;
        this.simulate = simulate;
        this.methods = methods;
        this.views = views;
    }
    /**
     * Generates a Program client by fetching the IDL from the network.
     *
     * In order to use this method, an IDL must have been previously initialized
     * via the anchor CLI's `anchor idl init` command.
     *
     * @param programId The on-chain address of the program.
     * @param provider  The network and wallet context.
     */
    static async at(address, provider) {
        const programId = translateAddress(address);
        const idl = await Program.fetchIdl(programId, provider);
        if (!idl) {
            throw new Error(`IDL not found for program: ${address.toString()}`);
        }
        return new Program(idl, provider);
    }
    /**
     * Fetches an idl from the blockchain.
     *
     * In order to use this method, an IDL must have been previously initialized
     * via the anchor CLI's `anchor idl init` command.
     *
     * @param programId The on-chain address of the program.
     * @param provider  The network and wallet context.
     */
    static async fetchIdl(address, provider) {
        provider = provider !== null && provider !== void 0 ? provider : getProvider();
        const programId = translateAddress(address);
        const idlAddr = await idlAddress(programId);
        const accountInfo = await provider.connection.getAccountInfo(idlAddr);
        if (!accountInfo) {
            return null;
        }
        // Chop off account discriminator.
        let idlAccount = decodeIdlAccount(accountInfo.data.slice(8));
        const inflatedIdl = inflate_1(idlAccount.data);
        return JSON.parse(decode$2(inflatedIdl));
    }
    /**
     * Invokes the given callback every time the given event is emitted.
     *
     * @param eventName The PascalCase name of the event, provided by the IDL.
     * @param callback  The function to invoke whenever the event is emitted from
     *                  program logs.
     */
    addEventListener(eventName, callback, commitment) {
        return this._events.addEventListener(eventName, callback, commitment);
    }
    /**
     * Unsubscribes from the given eventName.
     */
    async removeEventListener(listener) {
        return await this._events.removeEventListener(listener);
    }
}

new PublicKey("11111111111111111111111111111111");

const DEFAULT_NET_WORK = 'Mainnet';
const mainnetEndpoint = 'https://api.mainnet-beta.solana.com';
const devnetEndpoint = 'https://api.devnet.solana.com';
const testnetEndpoint = 'https://api.testnet.solana.com';
const getDefaultEndpoint = (network) => {
    let endpoint = 'https://api.mainnet-beta.solana.com';
    if (network == 'Mainnet') {
        endpoint = mainnetEndpoint;
    }
    else if (network == 'Testnet') {
        endpoint = testnetEndpoint;
    }
    else if (network == 'Devnet') {
        endpoint = devnetEndpoint;
    }
    return endpoint;
};
const ACCOUNR_SEED = "account";

var address$1 = "EY97THtfbhmcHDD7b5h8GgVvD6vk3eHUXEPUwaBUDqwG";
var metadata$1 = {
	name: "chain_wallet",
	version: "0.1.0",
	spec: "0.1.0",
	description: "Created with Anchor"
};
var instructions$1 = [
	{
		name: "approval",
		discriminator: [
			230,
			210,
			15,
			235,
			90,
			219,
			237,
			191
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ApprovalParams"
					}
				}
			}
		]
	},
	{
		name: "config_init",
		discriminator: [
			13,
			236,
			164,
			173,
			106,
			253,
			164,
			185
		],
		accounts: [
			{
				name: "admin",
				writable: true,
				signer: true
			},
			{
				name: "delay_executor"
			},
			{
				name: "lock_pubkey"
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "withdraw_config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								102,
								101,
								101,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ConfigInitParams"
					}
				}
			}
		]
	},
	{
		name: "create",
		discriminator: [
			24,
			30,
			200,
			40,
			5,
			28,
			7,
			119
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "CreateParams"
					}
				}
			}
		]
	},
	{
		name: "delay_execute",
		discriminator: [
			121,
			45,
			160,
			248,
			173,
			63,
			156,
			116
		],
		accounts: [
			{
				name: "executor",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "data",
				type: "bytes"
			}
		]
	},
	{
		name: "execute",
		discriminator: [
			130,
			221,
			242,
			154,
			13,
			193,
			189,
			29
		],
		accounts: [
			{
				name: "executor",
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "data",
				type: "bytes"
			}
		]
	},
	{
		name: "executor_add",
		discriminator: [
			114,
			34,
			11,
			155,
			193,
			89,
			101,
			127
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ExecutorChangeParams"
					}
				}
			}
		]
	},
	{
		name: "executor_change",
		discriminator: [
			68,
			54,
			255,
			94,
			170,
			63,
			84,
			238
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ExecutorChangeParams"
					}
				}
			}
		]
	},
	{
		name: "executor_delete",
		discriminator: [
			146,
			225,
			195,
			29,
			144,
			131,
			33,
			154
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "lock",
		discriminator: [
			21,
			19,
			208,
			43,
			237,
			62,
			255,
			87
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
		]
	},
	{
		name: "manager_add",
		discriminator: [
			123,
			110,
			158,
			145,
			189,
			183,
			234,
			69
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ManagerChangeParams"
					}
				}
			}
		]
	},
	{
		name: "manager_change",
		discriminator: [
			29,
			179,
			122,
			60,
			204,
			82,
			109,
			110
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ManagerChangeParams"
					}
				}
			}
		]
	},
	{
		name: "manager_delete",
		discriminator: [
			249,
			99,
			112,
			237,
			117,
			73,
			58,
			136
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "rule_add",
		discriminator: [
			250,
			137,
			172,
			148,
			5,
			85,
			21,
			204
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "RuleChangeParams"
					}
				}
			}
		]
	},
	{
		name: "rule_change",
		discriminator: [
			198,
			133,
			20,
			153,
			134,
			79,
			108,
			207
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "RuleChangeParams"
					}
				}
			}
		]
	},
	{
		name: "rule_delete",
		discriminator: [
			11,
			131,
			211,
			70,
			210,
			239,
			242,
			254
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "status_change",
		discriminator: [
			51,
			5,
			36,
			80,
			107,
			95,
			220,
			167
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ChangeStatusParams"
					}
				}
			}
		]
	},
	{
		name: "threshold_change",
		discriminator: [
			177,
			194,
			49,
			12,
			133,
			103,
			210,
			111
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: "u8"
			}
		]
	},
	{
		name: "withdraw",
		discriminator: [
			183,
			18,
			70,
			156,
			148,
			109,
			161,
			34
		],
		accounts: [
			{
				name: "withdrawer",
				writable: true,
				signer: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "withdraw_config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								102,
								101,
								101,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "amount",
				type: "u64"
			}
		]
	}
];
var accounts$1 = [
	{
		name: "ConfigState",
		discriminator: [
			193,
			77,
			160,
			128,
			208,
			254,
			180,
			135
		]
	},
	{
		name: "CustodyAccount",
		discriminator: [
			6,
			34,
			189,
			110,
			69,
			211,
			16,
			27
		]
	},
	{
		name: "WithdrawerConfig",
		discriminator: [
			136,
			110,
			35,
			225,
			43,
			26,
			201,
			136
		]
	}
];
var events$1 = [
	{
		name: "AddExecutorsEvent",
		discriminator: [
			1,
			85,
			207,
			173,
			65,
			251,
			248,
			67
		]
	},
	{
		name: "AddManagersEvent",
		discriminator: [
			168,
			230,
			250,
			112,
			24,
			159,
			36,
			88
		]
	},
	{
		name: "AddRuleEvent",
		discriminator: [
			223,
			162,
			56,
			204,
			87,
			131,
			246,
			95
		]
	},
	{
		name: "ChangeAutoLockEvent",
		discriminator: [
			105,
			101,
			87,
			181,
			39,
			72,
			215,
			240
		]
	},
	{
		name: "ChangeExecutorsEvent",
		discriminator: [
			98,
			250,
			240,
			32,
			157,
			29,
			155,
			102
		]
	},
	{
		name: "ChangeManagersEvent",
		discriminator: [
			47,
			156,
			56,
			10,
			127,
			254,
			118,
			239
		]
	},
	{
		name: "ChangeRuleEvent",
		discriminator: [
			73,
			110,
			247,
			83,
			175,
			241,
			169,
			226
		]
	},
	{
		name: "ChangeStatusEvent",
		discriminator: [
			50,
			41,
			130,
			153,
			207,
			107,
			22,
			141
		]
	},
	{
		name: "ChangeThresholdEvent",
		discriminator: [
			103,
			107,
			231,
			238,
			83,
			168,
			180,
			227
		]
	},
	{
		name: "CreateEvent",
		discriminator: [
			27,
			114,
			169,
			77,
			222,
			235,
			99,
			118
		]
	},
	{
		name: "DelExecutorsEvent",
		discriminator: [
			193,
			122,
			8,
			83,
			200,
			97,
			125,
			85
		]
	},
	{
		name: "DelManagersEvent",
		discriminator: [
			252,
			131,
			156,
			136,
			195,
			65,
			166,
			250
		]
	},
	{
		name: "DelRuleEvent",
		discriminator: [
			178,
			97,
			68,
			90,
			30,
			5,
			160,
			172
		]
	},
	{
		name: "DelayPushEvent",
		discriminator: [
			4,
			76,
			98,
			197,
			54,
			212,
			220,
			94
		]
	},
	{
		name: "ExecuteApprovalSuccessEvent",
		discriminator: [
			109,
			101,
			24,
			9,
			4,
			112,
			221,
			77
		]
	},
	{
		name: "ExecuteDelaySuccessEvent",
		discriminator: [
			181,
			173,
			187,
			29,
			100,
			48,
			131,
			81
		]
	},
	{
		name: "RiskApprovalPushEvent",
		discriminator: [
			191,
			175,
			124,
			80,
			77,
			96,
			44,
			78
		]
	},
	{
		name: "RiskLockEvent",
		discriminator: [
			207,
			224,
			26,
			12,
			212,
			240,
			240,
			45
		]
	},
	{
		name: "RiskRejectEvent",
		discriminator: [
			171,
			79,
			59,
			64,
			191,
			55,
			30,
			59
		]
	}
];
var errors$1 = [
	{
		code: 6000,
		name: "AuthNotAllowed",
		msg: "No authority"
	},
	{
		code: 6001,
		name: "ParamsError",
		msg: "Params error"
	},
	{
		code: 6002,
		name: "InsufficeientBalance",
		msg: "Insufficient balance"
	},
	{
		code: 6003,
		name: "CacluteError",
		msg: "Caclute error"
	},
	{
		code: 6004,
		name: "FeeWithdrawerWrong",
		msg: "Feewithdrawer wrong"
	},
	{
		code: 6005,
		name: "ProxyExecuteError",
		msg: "Proxy execute error"
	},
	{
		code: 6006,
		name: "OutOfLength",
		msg: "Index out of length"
	},
	{
		code: 6007,
		name: "CannotChangeOwner",
		msg: "Can not change owner"
	},
	{
		code: 6008,
		name: "HashNotEqual",
		msg: "Hash not equal"
	},
	{
		code: 6009,
		name: "NotEnoughSignatures",
		msg: "Not enough signatures"
	},
	{
		code: 6010,
		name: "SignatureError",
		msg: "Signatures error"
	},
	{
		code: 6011,
		name: "TransactionNoWallet",
		msg: "Transaction should have wallet account"
	},
	{
		code: 6012,
		name: "NonceWrong",
		msg: "Wrong nonce"
	},
	{
		code: 6013,
		name: "ManagerNotBeEmpty",
		msg: "Managers can not be empty"
	},
	{
		code: 6014,
		name: "LockAccountNotExecutable",
		msg: "Lock account exector can executable"
	}
];
var types$1 = [
	{
		name: "AccountPassFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "AccountPassTokenFilter",
		type: {
			kind: "struct",
			fields: [
				{
					name: "in_or_not",
					type: {
						defined: {
							name: "InOrNot"
						}
					}
				},
				{
					name: "list",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "token",
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "AccountStatus",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Normal"
				},
				{
					name: "Delay",
					fields: [
						"u32"
					]
				},
				{
					name: "Locked"
				}
			]
		}
	},
	{
		name: "AddExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "AddManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "AddRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ApprovalParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "data",
					type: "bytes"
				},
				{
					name: "hashs",
					type: {
						vec: {
							array: [
								"u8",
								64
							]
						}
					}
				},
				{
					name: "nonce",
					type: "u64"
				}
			]
		}
	},
	{
		name: "BalanceType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Lamports"
				},
				{
					name: "Token"
				}
			]
		}
	},
	{
		name: "CallProgramFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "ChangeAutoLockEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeStatusEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeStatusParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				}
			]
		}
	},
	{
		name: "ChangeThresholdEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ConfigInitParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_transaction",
					type: "u64"
				},
				{
					name: "fee_create",
					type: "u64"
				},
				{
					name: "withdrawers",
					type: {
						vec: {
							defined: {
								name: "FeeWithdrawer"
							}
						}
					}
				}
			]
		}
	},
	{
		name: "ConfigState",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_transaction",
					type: "u64"
				},
				{
					name: "fee_create",
					type: "u64"
				},
				{
					name: "delay_executor",
					type: "pubkey"
				},
				{
					name: "admin",
					type: "pubkey"
				},
				{
					name: "lock_pubkey",
					docs: [
						"use to lock account when execute with trigger lock"
					],
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "CreateEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "custody",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "name",
					type: {
						option: "string"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "CreateParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "executor_num",
					type: "u8"
				},
				{
					name: "user_admins_num",
					type: "u8"
				},
				{
					name: "name",
					type: {
						option: "string"
					}
				}
			]
		}
	},
	{
		name: "CustodyAccount",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "delay_transactions",
					type: {
						vec: {
							defined: {
								name: "DelayTransaction"
							}
						}
					}
				},
				{
					name: "need_approval_transactions",
					type: {
						vec: {
							defined: {
								name: "NeedApprovalTransaction"
							}
						}
					}
				},
				{
					name: "approval_nonce",
					type: {
						array: [
							"u64",
							5
						]
					}
				},
				{
					name: "delay_nonce",
					type: "u64"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "seeds_nonce",
					type: "u64"
				},
				{
					name: "bumps",
					type: "u8"
				},
				{
					name: "wallet_bumps",
					type: "u8"
				}
			]
		}
	},
	{
		name: "DelExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelayPushEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "timestamp",
					type: "i64"
				},
				{
					name: "execute_at",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelayTransaction",
		type: {
			kind: "struct",
			fields: [
				{
					name: "created_at",
					type: "i64"
				},
				{
					name: "execute_at",
					type: "i64"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				}
			]
		}
	},
	{
		name: "ExecuteApprovalSuccessEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: {
						array: [
							"u64",
							5
						]
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecuteDelaySuccessEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecutorChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "executor_num",
					type: "u8"
				}
			]
		}
	},
	{
		name: "FeeWithdrawer",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rate",
					type: "u64"
				},
				{
					name: "withdrawer",
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "FillterType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Wallet",
					fields: [
						{
							defined: {
								name: "WalletFilter"
							}
						}
					]
				},
				{
					name: "Token",
					fields: [
						{
							defined: {
								name: "TokenFilter"
							}
						}
					]
				},
				{
					name: "CallProgram",
					fields: [
						{
							defined: {
								name: "CallProgramFilter"
							}
						}
					]
				},
				{
					name: "AccountPass",
					fields: [
						{
							defined: {
								name: "AccountPassFilter"
							}
						}
					]
				},
				{
					name: "AccountPassToken",
					fields: [
						{
							defined: {
								name: "AccountPassTokenFilter"
							}
						}
					]
				}
			]
		}
	},
	{
		name: "InOrNot",
		type: {
			kind: "enum",
			variants: [
				{
					name: "In"
				},
				{
					name: "NotIn"
				}
			]
		}
	},
	{
		name: "ManagerChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "manager_num",
					type: "u8"
				}
			]
		}
	},
	{
		name: "NeedApprovalTransaction",
		type: {
			kind: "struct",
			fields: [
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				}
			]
		}
	},
	{
		name: "RiskApprovalPushEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "RiskLockEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "RiskRejectEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executor",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "Rule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fillter",
					type: {
						defined: {
							name: "FillterType"
						}
					}
				},
				{
					name: "rule_type",
					type: {
						defined: {
							name: "RuleType"
						}
					}
				},
				{
					name: "trigger_type",
					type: {
						defined: {
							name: "TriggerType"
						}
					}
				}
			]
		}
	},
	{
		name: "RuleChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				}
			]
		}
	},
	{
		name: "RuleType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Effect"
				},
				{
					name: "TransferAmount",
					fields: [
						{
							defined: {
								name: "TransferAmountRule"
							}
						}
					]
				},
				{
					name: "TransferFreq",
					fields: [
						{
							defined: {
								name: "TransferFreqRule"
							}
						}
					]
				},
				{
					name: "TransferTimes",
					fields: [
						{
							defined: {
								name: "TransferFreqTimesRule"
							}
						}
					]
				},
				{
					name: "TransactionParams",
					fields: [
						{
							defined: {
								name: "TransactionParamsRule"
							}
						}
					]
				},
				{
					name: "TransactionTimes",
					fields: [
						{
							defined: {
								name: "TransactionInvokeTimesRule"
							}
						}
					]
				}
			]
		}
	},
	{
		name: "TokenFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "TransactionByteRule",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Equal",
					fields: [
						"bytes"
					]
				},
				{
					name: "Between",
					fields: [
						"bytes",
						"bytes"
					]
				}
			]
		}
	},
	{
		name: "TransactionInvokeTimesRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "threshold_amount",
					type: "u64"
				}
			]
		}
	},
	{
		name: "TransactionParamsRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "from",
					type: "u32"
				},
				{
					name: "to",
					type: "u32"
				},
				{
					name: "is_hit_trigger",
					type: "bool"
				},
				{
					name: "byte_rule",
					type: {
						defined: {
							name: "TransactionByteRule"
						}
					}
				}
			]
		}
	},
	{
		name: "TransferAmountRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				}
			]
		}
	},
	{
		name: "TransferFreqRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				},
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u128"
				},
				{
					name: "threshold_amount",
					type: "u128"
				}
			]
		}
	},
	{
		name: "TransferFreqTimesRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				},
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "threshold_amount",
					type: "u64"
				}
			]
		}
	},
	{
		name: "TransferType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "From"
				},
				{
					name: "To"
				}
			]
		}
	},
	{
		name: "TriggerType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Lock"
				},
				{
					name: "Approval"
				},
				{
					name: "Reject"
				}
			]
		}
	},
	{
		name: "WalletFilter",
		type: {
			kind: "struct",
			fields: [
			]
		}
	},
	{
		name: "WithdrawerConfig",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_withdrawer",
					type: {
						vec: {
							defined: {
								name: "FeeWithdrawer"
							}
						}
					}
				}
			]
		}
	}
];
var devWalletIdl = {
	address: address$1,
	metadata: metadata$1,
	instructions: instructions$1,
	accounts: accounts$1,
	events: events$1,
	errors: errors$1,
	types: types$1
};

var address = "EY97THtfbhmcHDD7b5h8GgVvD6vk3eHUXEPUwaBUDqwG";
var metadata = {
	name: "chain_wallet",
	version: "0.1.0",
	spec: "0.1.0",
	description: "Created with Anchor"
};
var instructions = [
	{
		name: "approval",
		discriminator: [
			230,
			210,
			15,
			235,
			90,
			219,
			237,
			191
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ApprovalParams"
					}
				}
			}
		]
	},
	{
		name: "config_init",
		discriminator: [
			13,
			236,
			164,
			173,
			106,
			253,
			164,
			185
		],
		accounts: [
			{
				name: "admin",
				writable: true,
				signer: true
			},
			{
				name: "delay_executor"
			},
			{
				name: "lock_pubkey"
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "withdraw_config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								102,
								101,
								101,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ConfigInitParams"
					}
				}
			}
		]
	},
	{
		name: "create",
		discriminator: [
			24,
			30,
			200,
			40,
			5,
			28,
			7,
			119
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "CreateParams"
					}
				}
			}
		]
	},
	{
		name: "delay_execute",
		discriminator: [
			121,
			45,
			160,
			248,
			173,
			63,
			156,
			116
		],
		accounts: [
			{
				name: "executor",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "data",
				type: "bytes"
			}
		]
	},
	{
		name: "execute",
		discriminator: [
			130,
			221,
			242,
			154,
			13,
			193,
			189,
			29
		],
		accounts: [
			{
				name: "executor",
				signer: true
			},
			{
				name: "custody_account"
			},
			{
				name: "config",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "data",
				type: "bytes"
			}
		]
	},
	{
		name: "executor_add",
		discriminator: [
			114,
			34,
			11,
			155,
			193,
			89,
			101,
			127
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ExecutorChangeParams"
					}
				}
			}
		]
	},
	{
		name: "executor_change",
		discriminator: [
			68,
			54,
			255,
			94,
			170,
			63,
			84,
			238
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ExecutorChangeParams"
					}
				}
			}
		]
	},
	{
		name: "executor_delete",
		discriminator: [
			146,
			225,
			195,
			29,
			144,
			131,
			33,
			154
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "lock",
		discriminator: [
			21,
			19,
			208,
			43,
			237,
			62,
			255,
			87
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "proxy_program"
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
		]
	},
	{
		name: "manager_add",
		discriminator: [
			123,
			110,
			158,
			145,
			189,
			183,
			234,
			69
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ManagerChangeParams"
					}
				}
			}
		]
	},
	{
		name: "manager_change",
		discriminator: [
			29,
			179,
			122,
			60,
			204,
			82,
			109,
			110
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ManagerChangeParams"
					}
				}
			}
		]
	},
	{
		name: "manager_delete",
		discriminator: [
			249,
			99,
			112,
			237,
			117,
			73,
			58,
			136
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "rule_add",
		discriminator: [
			250,
			137,
			172,
			148,
			5,
			85,
			21,
			204
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "RuleChangeParams"
					}
				}
			}
		]
	},
	{
		name: "rule_change",
		discriminator: [
			198,
			133,
			20,
			153,
			134,
			79,
			108,
			207
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "RuleChangeParams"
					}
				}
			}
		]
	},
	{
		name: "rule_delete",
		discriminator: [
			11,
			131,
			211,
			70,
			210,
			239,
			242,
			254
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					vec: "u32"
				}
			}
		]
	},
	{
		name: "status_change",
		discriminator: [
			51,
			5,
			36,
			80,
			107,
			95,
			220,
			167
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: {
					defined: {
						name: "ChangeStatusParams"
					}
				}
			}
		]
	},
	{
		name: "threshold_change",
		discriminator: [
			177,
			194,
			49,
			12,
			133,
			103,
			210,
			111
		],
		accounts: [
			{
				name: "manager",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				signer: true
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "params",
				type: "u8"
			}
		]
	},
	{
		name: "withdraw",
		discriminator: [
			183,
			18,
			70,
			156,
			148,
			109,
			161,
			34
		],
		accounts: [
			{
				name: "withdrawer",
				writable: true,
				signer: true
			},
			{
				name: "config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								112,
								112,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "withdraw_config",
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								102,
								101,
								101,
								45,
								99,
								111,
								110,
								102,
								105,
								103
							]
						}
					]
				}
			},
			{
				name: "system_program",
				address: "11111111111111111111111111111111"
			}
		],
		args: [
			{
				name: "amount",
				type: "u64"
			}
		]
	}
];
var accounts = [
	{
		name: "ConfigState",
		discriminator: [
			193,
			77,
			160,
			128,
			208,
			254,
			180,
			135
		]
	},
	{
		name: "CustodyAccount",
		discriminator: [
			6,
			34,
			189,
			110,
			69,
			211,
			16,
			27
		]
	},
	{
		name: "WithdrawerConfig",
		discriminator: [
			136,
			110,
			35,
			225,
			43,
			26,
			201,
			136
		]
	}
];
var events = [
	{
		name: "AddExecutorsEvent",
		discriminator: [
			1,
			85,
			207,
			173,
			65,
			251,
			248,
			67
		]
	},
	{
		name: "AddManagersEvent",
		discriminator: [
			168,
			230,
			250,
			112,
			24,
			159,
			36,
			88
		]
	},
	{
		name: "AddRuleEvent",
		discriminator: [
			223,
			162,
			56,
			204,
			87,
			131,
			246,
			95
		]
	},
	{
		name: "ChangeAutoLockEvent",
		discriminator: [
			105,
			101,
			87,
			181,
			39,
			72,
			215,
			240
		]
	},
	{
		name: "ChangeExecutorsEvent",
		discriminator: [
			98,
			250,
			240,
			32,
			157,
			29,
			155,
			102
		]
	},
	{
		name: "ChangeManagersEvent",
		discriminator: [
			47,
			156,
			56,
			10,
			127,
			254,
			118,
			239
		]
	},
	{
		name: "ChangeRuleEvent",
		discriminator: [
			73,
			110,
			247,
			83,
			175,
			241,
			169,
			226
		]
	},
	{
		name: "ChangeStatusEvent",
		discriminator: [
			50,
			41,
			130,
			153,
			207,
			107,
			22,
			141
		]
	},
	{
		name: "ChangeThresholdEvent",
		discriminator: [
			103,
			107,
			231,
			238,
			83,
			168,
			180,
			227
		]
	},
	{
		name: "CreateEvent",
		discriminator: [
			27,
			114,
			169,
			77,
			222,
			235,
			99,
			118
		]
	},
	{
		name: "DelExecutorsEvent",
		discriminator: [
			193,
			122,
			8,
			83,
			200,
			97,
			125,
			85
		]
	},
	{
		name: "DelManagersEvent",
		discriminator: [
			252,
			131,
			156,
			136,
			195,
			65,
			166,
			250
		]
	},
	{
		name: "DelRuleEvent",
		discriminator: [
			178,
			97,
			68,
			90,
			30,
			5,
			160,
			172
		]
	},
	{
		name: "DelayPushEvent",
		discriminator: [
			4,
			76,
			98,
			197,
			54,
			212,
			220,
			94
		]
	},
	{
		name: "ExecuteApprovalFailEvent",
		discriminator: [
			90,
			160,
			229,
			160,
			176,
			220,
			199,
			249
		]
	},
	{
		name: "ExecuteApprovalSuccessEvent",
		discriminator: [
			109,
			101,
			24,
			9,
			4,
			112,
			221,
			77
		]
	},
	{
		name: "ExecuteDelayFailEvent",
		discriminator: [
			104,
			167,
			210,
			5,
			103,
			244,
			153,
			200
		]
	},
	{
		name: "ExecuteDelaySuccessEvent",
		discriminator: [
			181,
			173,
			187,
			29,
			100,
			48,
			131,
			81
		]
	},
	{
		name: "RiskApprovalPushEvent",
		discriminator: [
			191,
			175,
			124,
			80,
			77,
			96,
			44,
			78
		]
	},
	{
		name: "RiskLockEvent",
		discriminator: [
			207,
			224,
			26,
			12,
			212,
			240,
			240,
			45
		]
	},
	{
		name: "RiskRejectEvent",
		discriminator: [
			171,
			79,
			59,
			64,
			191,
			55,
			30,
			59
		]
	}
];
var errors = [
	{
		code: 6000,
		name: "AuthNotAllowed",
		msg: "No authority"
	},
	{
		code: 6001,
		name: "ParamsError",
		msg: "Params error"
	},
	{
		code: 6002,
		name: "InsufficeientBalance",
		msg: "Insufficient balance"
	},
	{
		code: 6003,
		name: "CacluteError",
		msg: "Caclute error"
	},
	{
		code: 6004,
		name: "FeeWithdrawerWrong",
		msg: "Feewithdrawer wrong"
	},
	{
		code: 6005,
		name: "ProxyExecuteError",
		msg: "Proxy execute error"
	},
	{
		code: 6006,
		name: "OutOfLength",
		msg: "Index out of length"
	},
	{
		code: 6007,
		name: "CannotChangeOwner",
		msg: "Can not change owner"
	},
	{
		code: 6008,
		name: "HashNotEqual",
		msg: "Hash not equal"
	},
	{
		code: 6009,
		name: "NotEnoughSignatures",
		msg: "Not enough signatures"
	},
	{
		code: 6010,
		name: "SignatureError",
		msg: "Signatures error"
	},
	{
		code: 6011,
		name: "TransactionNoWallet",
		msg: "Transaction should have wallet account"
	},
	{
		code: 6012,
		name: "NonceWrong",
		msg: "Wrong nonce"
	},
	{
		code: 6013,
		name: "ManagerNotBeEmpty",
		msg: "Managers can not be empty"
	},
	{
		code: 6014,
		name: "LockAccountNotExecutable",
		msg: "Lock account exector can executable"
	}
];
var types = [
	{
		name: "AccountPassFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "AccountPassTokenFilter",
		type: {
			kind: "struct",
			fields: [
				{
					name: "in_or_not",
					type: {
						defined: {
							name: "InOrNot"
						}
					}
				},
				{
					name: "list",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "token",
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "AccountStatus",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Normal"
				},
				{
					name: "Delay",
					fields: [
						"u32"
					]
				},
				{
					name: "Locked"
				}
			]
		}
	},
	{
		name: "AddExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "AddManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "AddRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ApprovalParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "data",
					type: "bytes"
				},
				{
					name: "hashs",
					type: {
						vec: {
							array: [
								"u8",
								64
							]
						}
					}
				},
				{
					name: "nonce",
					type: "u64"
				}
			]
		}
	},
	{
		name: "BalanceType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Lamports"
				},
				{
					name: "Token"
				}
			]
		}
	},
	{
		name: "CallProgramFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "ChangeAutoLockEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeStatusEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ChangeStatusParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				}
			]
		}
	},
	{
		name: "ChangeThresholdEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ConfigInitParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_transaction",
					type: "u64"
				},
				{
					name: "fee_create",
					type: "u64"
				},
				{
					name: "withdrawers",
					type: {
						vec: {
							defined: {
								name: "FeeWithdrawer"
							}
						}
					}
				}
			]
		}
	},
	{
		name: "ConfigState",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_transaction",
					type: "u64"
				},
				{
					name: "fee_create",
					type: "u64"
				},
				{
					name: "delay_executor",
					type: "pubkey"
				},
				{
					name: "admin",
					type: "pubkey"
				},
				{
					name: "lock_pubkey",
					docs: [
						"use to lock account when execute with trigger lock"
					],
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "CreateEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "custody",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "name",
					type: {
						option: "string"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "CreateParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "executor_num",
					type: "u8"
				},
				{
					name: "user_admins_num",
					type: "u8"
				},
				{
					name: "name",
					type: {
						option: "string"
					}
				}
			]
		}
	},
	{
		name: "CustodyAccount",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "delay_transactions",
					type: {
						vec: {
							defined: {
								name: "DelayTransaction"
							}
						}
					}
				},
				{
					name: "need_approval_transactions",
					type: {
						vec: {
							defined: {
								name: "NeedApprovalTransaction"
							}
						}
					}
				},
				{
					name: "approval_nonce",
					type: {
						array: [
							"u64",
							5
						]
					}
				},
				{
					name: "delay_nonce",
					type: "u64"
				},
				{
					name: "status",
					type: {
						defined: {
							name: "AccountStatus"
						}
					}
				},
				{
					name: "threshold",
					type: "u8"
				},
				{
					name: "enable_auto_lock",
					type: "bool"
				},
				{
					name: "seeds_nonce",
					type: "u64"
				},
				{
					name: "bumps",
					type: "u8"
				},
				{
					name: "wallet_bumps",
					type: "u8"
				}
			]
		}
	},
	{
		name: "DelExecutorsEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "executors",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelManagersEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "managers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelRuleEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "user",
					type: "pubkey"
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelayPushEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "timestamp",
					type: "i64"
				},
				{
					name: "execute_at",
					type: "i64"
				}
			]
		}
	},
	{
		name: "DelayTransaction",
		type: {
			kind: "struct",
			fields: [
				{
					name: "created_at",
					type: "i64"
				},
				{
					name: "execute_at",
					type: "i64"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				}
			]
		}
	},
	{
		name: "ExecuteApprovalFailEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: {
						array: [
							"u64",
							5
						]
					}
				},
				{
					name: "reason",
					type: "string"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecuteApprovalSuccessEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: {
						array: [
							"u64",
							5
						]
					}
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecuteDelayFailEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "error_code",
					type: "u64"
				},
				{
					name: "reason",
					type: "string"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecuteDelaySuccessEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "ExecutorChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "executor_num",
					type: "u8"
				}
			]
		}
	},
	{
		name: "FeeWithdrawer",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rate",
					type: "u64"
				},
				{
					name: "withdrawer",
					type: "pubkey"
				}
			]
		}
	},
	{
		name: "FillterType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Wallet",
					fields: [
						{
							defined: {
								name: "WalletFilter"
							}
						}
					]
				},
				{
					name: "Token",
					fields: [
						{
							defined: {
								name: "TokenFilter"
							}
						}
					]
				},
				{
					name: "CallProgram",
					fields: [
						{
							defined: {
								name: "CallProgramFilter"
							}
						}
					]
				},
				{
					name: "AccountPass",
					fields: [
						{
							defined: {
								name: "AccountPassFilter"
							}
						}
					]
				},
				{
					name: "AccountPassToken",
					fields: [
						{
							defined: {
								name: "AccountPassTokenFilter"
							}
						}
					]
				}
			]
		}
	},
	{
		name: "InOrNot",
		type: {
			kind: "enum",
			variants: [
				{
					name: "In"
				},
				{
					name: "NotIn"
				}
			]
		}
	},
	{
		name: "ManagerChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "manager_num",
					type: "u8"
				}
			]
		}
	},
	{
		name: "NeedApprovalTransaction",
		type: {
			kind: "struct",
			fields: [
				{
					name: "hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				}
			]
		}
	},
	{
		name: "RiskApprovalPushEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "RiskLockEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "RiskRejectEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "timestamp",
					type: "i64"
				}
			]
		}
	},
	{
		name: "Rule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fillter",
					type: {
						defined: {
							name: "FillterType"
						}
					}
				},
				{
					name: "rule_type",
					type: {
						defined: {
							name: "RuleType"
						}
					}
				},
				{
					name: "trigger_type",
					type: {
						defined: {
							name: "TriggerType"
						}
					}
				}
			]
		}
	},
	{
		name: "RuleChangeParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "rules",
					type: {
						vec: {
							defined: {
								name: "Rule"
							}
						}
					}
				}
			]
		}
	},
	{
		name: "RuleType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Effect"
				},
				{
					name: "TransferAmount",
					fields: [
						{
							defined: {
								name: "TransferAmountRule"
							}
						}
					]
				},
				{
					name: "TransferFreq",
					fields: [
						{
							defined: {
								name: "TransferFreqRule"
							}
						}
					]
				},
				{
					name: "TransferTimes",
					fields: [
						{
							defined: {
								name: "TransferFreqTimesRule"
							}
						}
					]
				},
				{
					name: "TransactionParams",
					fields: [
						{
							defined: {
								name: "TransactionParamsRule"
							}
						}
					]
				},
				{
					name: "TransactionTimes",
					fields: [
						{
							defined: {
								name: "TransactionInvokeTimesRule"
							}
						}
					]
				}
			]
		}
	},
	{
		name: "TokenFilter",
		type: {
			kind: "enum",
			variants: [
				{
					name: "InList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				},
				{
					name: "NotInList",
					fields: [
						{
							vec: "pubkey"
						}
					]
				}
			]
		}
	},
	{
		name: "TransactionByteRule",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Equal",
					fields: [
						"bytes"
					]
				},
				{
					name: "Between",
					fields: [
						"bytes",
						"bytes"
					]
				}
			]
		}
	},
	{
		name: "TransactionInvokeTimesRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "threshold_amount",
					type: "u64"
				}
			]
		}
	},
	{
		name: "TransactionParamsRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "from",
					type: "u32"
				},
				{
					name: "to",
					type: "u32"
				},
				{
					name: "is_hit_trigger",
					type: "bool"
				},
				{
					name: "byte_rule",
					type: {
						defined: {
							name: "TransactionByteRule"
						}
					}
				}
			]
		}
	},
	{
		name: "TransferAmountRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				}
			]
		}
	},
	{
		name: "TransferFreqRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				},
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u128"
				},
				{
					name: "threshold_amount",
					type: "u128"
				}
			]
		}
	},
	{
		name: "TransferFreqTimesRule",
		type: {
			kind: "struct",
			fields: [
				{
					name: "balance_type",
					type: {
						defined: {
							name: "BalanceType"
						}
					}
				},
				{
					name: "transfer_direction",
					type: {
						defined: {
							name: "TransferType"
						}
					}
				},
				{
					name: "interval",
					type: "i64"
				},
				{
					name: "time_slot",
					type: "i64"
				},
				{
					name: "amount",
					type: "u64"
				},
				{
					name: "threshold_amount",
					type: "u64"
				}
			]
		}
	},
	{
		name: "TransferType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "From"
				},
				{
					name: "To"
				}
			]
		}
	},
	{
		name: "TriggerType",
		type: {
			kind: "enum",
			variants: [
				{
					name: "Lock"
				},
				{
					name: "Approval"
				},
				{
					name: "Reject"
				}
			]
		}
	},
	{
		name: "WalletFilter",
		type: {
			kind: "struct",
			fields: [
			]
		}
	},
	{
		name: "WithdrawerConfig",
		type: {
			kind: "struct",
			fields: [
				{
					name: "fee_withdrawer",
					type: {
						vec: {
							defined: {
								name: "FeeWithdrawer"
							}
						}
					}
				}
			]
		}
	}
];
var mainWalletIdl = {
	address: address,
	metadata: metadata,
	instructions: instructions,
	accounts: accounts,
	events: events,
	errors: errors,
	types: types
};

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var naclFast = {exports: {}};

var hasRequiredNaclFast;

function requireNaclFast () {
	if (hasRequiredNaclFast) return naclFast.exports;
	hasRequiredNaclFast = 1;
	(function (module) {
		(function(nacl) {

		// Ported in 2014 by Dmitry Chestnykh and Devi Mandiri.
		// Public domain.
		//
		// Implementation derived from TweetNaCl version 20140427.
		// See for details: http://tweetnacl.cr.yp.to/

		var gf = function(init) {
		  var i, r = new Float64Array(16);
		  if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
		  return r;
		};

		//  Pluggable, initialized in high-level API below.
		var randombytes = function(/* x, n */) { throw new Error('no PRNG'); };

		var _0 = new Uint8Array(16);
		var _9 = new Uint8Array(32); _9[0] = 9;

		var gf0 = gf(),
		    gf1 = gf([1]),
		    _121665 = gf([0xdb41, 1]),
		    D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
		    D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]),
		    X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]),
		    Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]),
		    I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);

		function ts64(x, i, h, l) {
		  x[i]   = (h >> 24) & 0xff;
		  x[i+1] = (h >> 16) & 0xff;
		  x[i+2] = (h >>  8) & 0xff;
		  x[i+3] = h & 0xff;
		  x[i+4] = (l >> 24)  & 0xff;
		  x[i+5] = (l >> 16)  & 0xff;
		  x[i+6] = (l >>  8)  & 0xff;
		  x[i+7] = l & 0xff;
		}

		function vn(x, xi, y, yi, n) {
		  var i,d = 0;
		  for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
		  return (1 & ((d - 1) >>> 8)) - 1;
		}

		function crypto_verify_16(x, xi, y, yi) {
		  return vn(x,xi,y,yi,16);
		}

		function crypto_verify_32(x, xi, y, yi) {
		  return vn(x,xi,y,yi,32);
		}

		function core_salsa20(o, p, k, c) {
		  var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
		      j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
		      j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
		      j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
		      j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
		      j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
		      j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
		      j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
		      j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
		      j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
		      j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
		      j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
		      j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
		      j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
		      j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
		      j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

		  var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
		      x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
		      x15 = j15, u;

		  for (var i = 0; i < 20; i += 2) {
		    u = x0 + x12 | 0;
		    x4 ^= u<<7 | u>>>(32-7);
		    u = x4 + x0 | 0;
		    x8 ^= u<<9 | u>>>(32-9);
		    u = x8 + x4 | 0;
		    x12 ^= u<<13 | u>>>(32-13);
		    u = x12 + x8 | 0;
		    x0 ^= u<<18 | u>>>(32-18);

		    u = x5 + x1 | 0;
		    x9 ^= u<<7 | u>>>(32-7);
		    u = x9 + x5 | 0;
		    x13 ^= u<<9 | u>>>(32-9);
		    u = x13 + x9 | 0;
		    x1 ^= u<<13 | u>>>(32-13);
		    u = x1 + x13 | 0;
		    x5 ^= u<<18 | u>>>(32-18);

		    u = x10 + x6 | 0;
		    x14 ^= u<<7 | u>>>(32-7);
		    u = x14 + x10 | 0;
		    x2 ^= u<<9 | u>>>(32-9);
		    u = x2 + x14 | 0;
		    x6 ^= u<<13 | u>>>(32-13);
		    u = x6 + x2 | 0;
		    x10 ^= u<<18 | u>>>(32-18);

		    u = x15 + x11 | 0;
		    x3 ^= u<<7 | u>>>(32-7);
		    u = x3 + x15 | 0;
		    x7 ^= u<<9 | u>>>(32-9);
		    u = x7 + x3 | 0;
		    x11 ^= u<<13 | u>>>(32-13);
		    u = x11 + x7 | 0;
		    x15 ^= u<<18 | u>>>(32-18);

		    u = x0 + x3 | 0;
		    x1 ^= u<<7 | u>>>(32-7);
		    u = x1 + x0 | 0;
		    x2 ^= u<<9 | u>>>(32-9);
		    u = x2 + x1 | 0;
		    x3 ^= u<<13 | u>>>(32-13);
		    u = x3 + x2 | 0;
		    x0 ^= u<<18 | u>>>(32-18);

		    u = x5 + x4 | 0;
		    x6 ^= u<<7 | u>>>(32-7);
		    u = x6 + x5 | 0;
		    x7 ^= u<<9 | u>>>(32-9);
		    u = x7 + x6 | 0;
		    x4 ^= u<<13 | u>>>(32-13);
		    u = x4 + x7 | 0;
		    x5 ^= u<<18 | u>>>(32-18);

		    u = x10 + x9 | 0;
		    x11 ^= u<<7 | u>>>(32-7);
		    u = x11 + x10 | 0;
		    x8 ^= u<<9 | u>>>(32-9);
		    u = x8 + x11 | 0;
		    x9 ^= u<<13 | u>>>(32-13);
		    u = x9 + x8 | 0;
		    x10 ^= u<<18 | u>>>(32-18);

		    u = x15 + x14 | 0;
		    x12 ^= u<<7 | u>>>(32-7);
		    u = x12 + x15 | 0;
		    x13 ^= u<<9 | u>>>(32-9);
		    u = x13 + x12 | 0;
		    x14 ^= u<<13 | u>>>(32-13);
		    u = x14 + x13 | 0;
		    x15 ^= u<<18 | u>>>(32-18);
		  }
		   x0 =  x0 +  j0 | 0;
		   x1 =  x1 +  j1 | 0;
		   x2 =  x2 +  j2 | 0;
		   x3 =  x3 +  j3 | 0;
		   x4 =  x4 +  j4 | 0;
		   x5 =  x5 +  j5 | 0;
		   x6 =  x6 +  j6 | 0;
		   x7 =  x7 +  j7 | 0;
		   x8 =  x8 +  j8 | 0;
		   x9 =  x9 +  j9 | 0;
		  x10 = x10 + j10 | 0;
		  x11 = x11 + j11 | 0;
		  x12 = x12 + j12 | 0;
		  x13 = x13 + j13 | 0;
		  x14 = x14 + j14 | 0;
		  x15 = x15 + j15 | 0;

		  o[ 0] = x0 >>>  0 & 0xff;
		  o[ 1] = x0 >>>  8 & 0xff;
		  o[ 2] = x0 >>> 16 & 0xff;
		  o[ 3] = x0 >>> 24 & 0xff;

		  o[ 4] = x1 >>>  0 & 0xff;
		  o[ 5] = x1 >>>  8 & 0xff;
		  o[ 6] = x1 >>> 16 & 0xff;
		  o[ 7] = x1 >>> 24 & 0xff;

		  o[ 8] = x2 >>>  0 & 0xff;
		  o[ 9] = x2 >>>  8 & 0xff;
		  o[10] = x2 >>> 16 & 0xff;
		  o[11] = x2 >>> 24 & 0xff;

		  o[12] = x3 >>>  0 & 0xff;
		  o[13] = x3 >>>  8 & 0xff;
		  o[14] = x3 >>> 16 & 0xff;
		  o[15] = x3 >>> 24 & 0xff;

		  o[16] = x4 >>>  0 & 0xff;
		  o[17] = x4 >>>  8 & 0xff;
		  o[18] = x4 >>> 16 & 0xff;
		  o[19] = x4 >>> 24 & 0xff;

		  o[20] = x5 >>>  0 & 0xff;
		  o[21] = x5 >>>  8 & 0xff;
		  o[22] = x5 >>> 16 & 0xff;
		  o[23] = x5 >>> 24 & 0xff;

		  o[24] = x6 >>>  0 & 0xff;
		  o[25] = x6 >>>  8 & 0xff;
		  o[26] = x6 >>> 16 & 0xff;
		  o[27] = x6 >>> 24 & 0xff;

		  o[28] = x7 >>>  0 & 0xff;
		  o[29] = x7 >>>  8 & 0xff;
		  o[30] = x7 >>> 16 & 0xff;
		  o[31] = x7 >>> 24 & 0xff;

		  o[32] = x8 >>>  0 & 0xff;
		  o[33] = x8 >>>  8 & 0xff;
		  o[34] = x8 >>> 16 & 0xff;
		  o[35] = x8 >>> 24 & 0xff;

		  o[36] = x9 >>>  0 & 0xff;
		  o[37] = x9 >>>  8 & 0xff;
		  o[38] = x9 >>> 16 & 0xff;
		  o[39] = x9 >>> 24 & 0xff;

		  o[40] = x10 >>>  0 & 0xff;
		  o[41] = x10 >>>  8 & 0xff;
		  o[42] = x10 >>> 16 & 0xff;
		  o[43] = x10 >>> 24 & 0xff;

		  o[44] = x11 >>>  0 & 0xff;
		  o[45] = x11 >>>  8 & 0xff;
		  o[46] = x11 >>> 16 & 0xff;
		  o[47] = x11 >>> 24 & 0xff;

		  o[48] = x12 >>>  0 & 0xff;
		  o[49] = x12 >>>  8 & 0xff;
		  o[50] = x12 >>> 16 & 0xff;
		  o[51] = x12 >>> 24 & 0xff;

		  o[52] = x13 >>>  0 & 0xff;
		  o[53] = x13 >>>  8 & 0xff;
		  o[54] = x13 >>> 16 & 0xff;
		  o[55] = x13 >>> 24 & 0xff;

		  o[56] = x14 >>>  0 & 0xff;
		  o[57] = x14 >>>  8 & 0xff;
		  o[58] = x14 >>> 16 & 0xff;
		  o[59] = x14 >>> 24 & 0xff;

		  o[60] = x15 >>>  0 & 0xff;
		  o[61] = x15 >>>  8 & 0xff;
		  o[62] = x15 >>> 16 & 0xff;
		  o[63] = x15 >>> 24 & 0xff;
		}

		function core_hsalsa20(o,p,k,c) {
		  var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
		      j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
		      j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
		      j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
		      j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
		      j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
		      j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
		      j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
		      j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
		      j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
		      j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
		      j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
		      j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
		      j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
		      j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
		      j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

		  var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
		      x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
		      x15 = j15, u;

		  for (var i = 0; i < 20; i += 2) {
		    u = x0 + x12 | 0;
		    x4 ^= u<<7 | u>>>(32-7);
		    u = x4 + x0 | 0;
		    x8 ^= u<<9 | u>>>(32-9);
		    u = x8 + x4 | 0;
		    x12 ^= u<<13 | u>>>(32-13);
		    u = x12 + x8 | 0;
		    x0 ^= u<<18 | u>>>(32-18);

		    u = x5 + x1 | 0;
		    x9 ^= u<<7 | u>>>(32-7);
		    u = x9 + x5 | 0;
		    x13 ^= u<<9 | u>>>(32-9);
		    u = x13 + x9 | 0;
		    x1 ^= u<<13 | u>>>(32-13);
		    u = x1 + x13 | 0;
		    x5 ^= u<<18 | u>>>(32-18);

		    u = x10 + x6 | 0;
		    x14 ^= u<<7 | u>>>(32-7);
		    u = x14 + x10 | 0;
		    x2 ^= u<<9 | u>>>(32-9);
		    u = x2 + x14 | 0;
		    x6 ^= u<<13 | u>>>(32-13);
		    u = x6 + x2 | 0;
		    x10 ^= u<<18 | u>>>(32-18);

		    u = x15 + x11 | 0;
		    x3 ^= u<<7 | u>>>(32-7);
		    u = x3 + x15 | 0;
		    x7 ^= u<<9 | u>>>(32-9);
		    u = x7 + x3 | 0;
		    x11 ^= u<<13 | u>>>(32-13);
		    u = x11 + x7 | 0;
		    x15 ^= u<<18 | u>>>(32-18);

		    u = x0 + x3 | 0;
		    x1 ^= u<<7 | u>>>(32-7);
		    u = x1 + x0 | 0;
		    x2 ^= u<<9 | u>>>(32-9);
		    u = x2 + x1 | 0;
		    x3 ^= u<<13 | u>>>(32-13);
		    u = x3 + x2 | 0;
		    x0 ^= u<<18 | u>>>(32-18);

		    u = x5 + x4 | 0;
		    x6 ^= u<<7 | u>>>(32-7);
		    u = x6 + x5 | 0;
		    x7 ^= u<<9 | u>>>(32-9);
		    u = x7 + x6 | 0;
		    x4 ^= u<<13 | u>>>(32-13);
		    u = x4 + x7 | 0;
		    x5 ^= u<<18 | u>>>(32-18);

		    u = x10 + x9 | 0;
		    x11 ^= u<<7 | u>>>(32-7);
		    u = x11 + x10 | 0;
		    x8 ^= u<<9 | u>>>(32-9);
		    u = x8 + x11 | 0;
		    x9 ^= u<<13 | u>>>(32-13);
		    u = x9 + x8 | 0;
		    x10 ^= u<<18 | u>>>(32-18);

		    u = x15 + x14 | 0;
		    x12 ^= u<<7 | u>>>(32-7);
		    u = x12 + x15 | 0;
		    x13 ^= u<<9 | u>>>(32-9);
		    u = x13 + x12 | 0;
		    x14 ^= u<<13 | u>>>(32-13);
		    u = x14 + x13 | 0;
		    x15 ^= u<<18 | u>>>(32-18);
		  }

		  o[ 0] = x0 >>>  0 & 0xff;
		  o[ 1] = x0 >>>  8 & 0xff;
		  o[ 2] = x0 >>> 16 & 0xff;
		  o[ 3] = x0 >>> 24 & 0xff;

		  o[ 4] = x5 >>>  0 & 0xff;
		  o[ 5] = x5 >>>  8 & 0xff;
		  o[ 6] = x5 >>> 16 & 0xff;
		  o[ 7] = x5 >>> 24 & 0xff;

		  o[ 8] = x10 >>>  0 & 0xff;
		  o[ 9] = x10 >>>  8 & 0xff;
		  o[10] = x10 >>> 16 & 0xff;
		  o[11] = x10 >>> 24 & 0xff;

		  o[12] = x15 >>>  0 & 0xff;
		  o[13] = x15 >>>  8 & 0xff;
		  o[14] = x15 >>> 16 & 0xff;
		  o[15] = x15 >>> 24 & 0xff;

		  o[16] = x6 >>>  0 & 0xff;
		  o[17] = x6 >>>  8 & 0xff;
		  o[18] = x6 >>> 16 & 0xff;
		  o[19] = x6 >>> 24 & 0xff;

		  o[20] = x7 >>>  0 & 0xff;
		  o[21] = x7 >>>  8 & 0xff;
		  o[22] = x7 >>> 16 & 0xff;
		  o[23] = x7 >>> 24 & 0xff;

		  o[24] = x8 >>>  0 & 0xff;
		  o[25] = x8 >>>  8 & 0xff;
		  o[26] = x8 >>> 16 & 0xff;
		  o[27] = x8 >>> 24 & 0xff;

		  o[28] = x9 >>>  0 & 0xff;
		  o[29] = x9 >>>  8 & 0xff;
		  o[30] = x9 >>> 16 & 0xff;
		  o[31] = x9 >>> 24 & 0xff;
		}

		function crypto_core_salsa20(out,inp,k,c) {
		  core_salsa20(out,inp,k,c);
		}

		function crypto_core_hsalsa20(out,inp,k,c) {
		  core_hsalsa20(out,inp,k,c);
		}

		var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
		            // "expand 32-byte k"

		function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
		  var z = new Uint8Array(16), x = new Uint8Array(64);
		  var u, i;
		  for (i = 0; i < 16; i++) z[i] = 0;
		  for (i = 0; i < 8; i++) z[i] = n[i];
		  while (b >= 64) {
		    crypto_core_salsa20(x,z,k,sigma);
		    for (i = 0; i < 64; i++) c[cpos+i] = m[mpos+i] ^ x[i];
		    u = 1;
		    for (i = 8; i < 16; i++) {
		      u = u + (z[i] & 0xff) | 0;
		      z[i] = u & 0xff;
		      u >>>= 8;
		    }
		    b -= 64;
		    cpos += 64;
		    mpos += 64;
		  }
		  if (b > 0) {
		    crypto_core_salsa20(x,z,k,sigma);
		    for (i = 0; i < b; i++) c[cpos+i] = m[mpos+i] ^ x[i];
		  }
		  return 0;
		}

		function crypto_stream_salsa20(c,cpos,b,n,k) {
		  var z = new Uint8Array(16), x = new Uint8Array(64);
		  var u, i;
		  for (i = 0; i < 16; i++) z[i] = 0;
		  for (i = 0; i < 8; i++) z[i] = n[i];
		  while (b >= 64) {
		    crypto_core_salsa20(x,z,k,sigma);
		    for (i = 0; i < 64; i++) c[cpos+i] = x[i];
		    u = 1;
		    for (i = 8; i < 16; i++) {
		      u = u + (z[i] & 0xff) | 0;
		      z[i] = u & 0xff;
		      u >>>= 8;
		    }
		    b -= 64;
		    cpos += 64;
		  }
		  if (b > 0) {
		    crypto_core_salsa20(x,z,k,sigma);
		    for (i = 0; i < b; i++) c[cpos+i] = x[i];
		  }
		  return 0;
		}

		function crypto_stream(c,cpos,d,n,k) {
		  var s = new Uint8Array(32);
		  crypto_core_hsalsa20(s,n,k,sigma);
		  var sn = new Uint8Array(8);
		  for (var i = 0; i < 8; i++) sn[i] = n[i+16];
		  return crypto_stream_salsa20(c,cpos,d,sn,s);
		}

		function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
		  var s = new Uint8Array(32);
		  crypto_core_hsalsa20(s,n,k,sigma);
		  var sn = new Uint8Array(8);
		  for (var i = 0; i < 8; i++) sn[i] = n[i+16];
		  return crypto_stream_salsa20_xor(c,cpos,m,mpos,d,sn,s);
		}

		/*
		* Port of Andrew Moon's Poly1305-donna-16. Public domain.
		* https://github.com/floodyberry/poly1305-donna
		*/

		var poly1305 = function(key) {
		  this.buffer = new Uint8Array(16);
		  this.r = new Uint16Array(10);
		  this.h = new Uint16Array(10);
		  this.pad = new Uint16Array(8);
		  this.leftover = 0;
		  this.fin = 0;

		  var t0, t1, t2, t3, t4, t5, t6, t7;

		  t0 = key[ 0] & 0xff | (key[ 1] & 0xff) << 8; this.r[0] = ( t0                     ) & 0x1fff;
		  t1 = key[ 2] & 0xff | (key[ 3] & 0xff) << 8; this.r[1] = ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
		  t2 = key[ 4] & 0xff | (key[ 5] & 0xff) << 8; this.r[2] = ((t1 >>> 10) | (t2 <<  6)) & 0x1f03;
		  t3 = key[ 6] & 0xff | (key[ 7] & 0xff) << 8; this.r[3] = ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
		  t4 = key[ 8] & 0xff | (key[ 9] & 0xff) << 8; this.r[4] = ((t3 >>>  4) | (t4 << 12)) & 0x00ff;
		  this.r[5] = ((t4 >>>  1)) & 0x1ffe;
		  t5 = key[10] & 0xff | (key[11] & 0xff) << 8; this.r[6] = ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
		  t6 = key[12] & 0xff | (key[13] & 0xff) << 8; this.r[7] = ((t5 >>> 11) | (t6 <<  5)) & 0x1f81;
		  t7 = key[14] & 0xff | (key[15] & 0xff) << 8; this.r[8] = ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
		  this.r[9] = ((t7 >>>  5)) & 0x007f;

		  this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
		  this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
		  this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
		  this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
		  this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
		  this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
		  this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
		  this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
		};

		poly1305.prototype.blocks = function(m, mpos, bytes) {
		  var hibit = this.fin ? 0 : (1 << 11);
		  var t0, t1, t2, t3, t4, t5, t6, t7, c;
		  var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;

		  var h0 = this.h[0],
		      h1 = this.h[1],
		      h2 = this.h[2],
		      h3 = this.h[3],
		      h4 = this.h[4],
		      h5 = this.h[5],
		      h6 = this.h[6],
		      h7 = this.h[7],
		      h8 = this.h[8],
		      h9 = this.h[9];

		  var r0 = this.r[0],
		      r1 = this.r[1],
		      r2 = this.r[2],
		      r3 = this.r[3],
		      r4 = this.r[4],
		      r5 = this.r[5],
		      r6 = this.r[6],
		      r7 = this.r[7],
		      r8 = this.r[8],
		      r9 = this.r[9];

		  while (bytes >= 16) {
		    t0 = m[mpos+ 0] & 0xff | (m[mpos+ 1] & 0xff) << 8; h0 += ( t0                     ) & 0x1fff;
		    t1 = m[mpos+ 2] & 0xff | (m[mpos+ 3] & 0xff) << 8; h1 += ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
		    t2 = m[mpos+ 4] & 0xff | (m[mpos+ 5] & 0xff) << 8; h2 += ((t1 >>> 10) | (t2 <<  6)) & 0x1fff;
		    t3 = m[mpos+ 6] & 0xff | (m[mpos+ 7] & 0xff) << 8; h3 += ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
		    t4 = m[mpos+ 8] & 0xff | (m[mpos+ 9] & 0xff) << 8; h4 += ((t3 >>>  4) | (t4 << 12)) & 0x1fff;
		    h5 += ((t4 >>>  1)) & 0x1fff;
		    t5 = m[mpos+10] & 0xff | (m[mpos+11] & 0xff) << 8; h6 += ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
		    t6 = m[mpos+12] & 0xff | (m[mpos+13] & 0xff) << 8; h7 += ((t5 >>> 11) | (t6 <<  5)) & 0x1fff;
		    t7 = m[mpos+14] & 0xff | (m[mpos+15] & 0xff) << 8; h8 += ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
		    h9 += ((t7 >>> 5)) | hibit;

		    c = 0;

		    d0 = c;
		    d0 += h0 * r0;
		    d0 += h1 * (5 * r9);
		    d0 += h2 * (5 * r8);
		    d0 += h3 * (5 * r7);
		    d0 += h4 * (5 * r6);
		    c = (d0 >>> 13); d0 &= 0x1fff;
		    d0 += h5 * (5 * r5);
		    d0 += h6 * (5 * r4);
		    d0 += h7 * (5 * r3);
		    d0 += h8 * (5 * r2);
		    d0 += h9 * (5 * r1);
		    c += (d0 >>> 13); d0 &= 0x1fff;

		    d1 = c;
		    d1 += h0 * r1;
		    d1 += h1 * r0;
		    d1 += h2 * (5 * r9);
		    d1 += h3 * (5 * r8);
		    d1 += h4 * (5 * r7);
		    c = (d1 >>> 13); d1 &= 0x1fff;
		    d1 += h5 * (5 * r6);
		    d1 += h6 * (5 * r5);
		    d1 += h7 * (5 * r4);
		    d1 += h8 * (5 * r3);
		    d1 += h9 * (5 * r2);
		    c += (d1 >>> 13); d1 &= 0x1fff;

		    d2 = c;
		    d2 += h0 * r2;
		    d2 += h1 * r1;
		    d2 += h2 * r0;
		    d2 += h3 * (5 * r9);
		    d2 += h4 * (5 * r8);
		    c = (d2 >>> 13); d2 &= 0x1fff;
		    d2 += h5 * (5 * r7);
		    d2 += h6 * (5 * r6);
		    d2 += h7 * (5 * r5);
		    d2 += h8 * (5 * r4);
		    d2 += h9 * (5 * r3);
		    c += (d2 >>> 13); d2 &= 0x1fff;

		    d3 = c;
		    d3 += h0 * r3;
		    d3 += h1 * r2;
		    d3 += h2 * r1;
		    d3 += h3 * r0;
		    d3 += h4 * (5 * r9);
		    c = (d3 >>> 13); d3 &= 0x1fff;
		    d3 += h5 * (5 * r8);
		    d3 += h6 * (5 * r7);
		    d3 += h7 * (5 * r6);
		    d3 += h8 * (5 * r5);
		    d3 += h9 * (5 * r4);
		    c += (d3 >>> 13); d3 &= 0x1fff;

		    d4 = c;
		    d4 += h0 * r4;
		    d4 += h1 * r3;
		    d4 += h2 * r2;
		    d4 += h3 * r1;
		    d4 += h4 * r0;
		    c = (d4 >>> 13); d4 &= 0x1fff;
		    d4 += h5 * (5 * r9);
		    d4 += h6 * (5 * r8);
		    d4 += h7 * (5 * r7);
		    d4 += h8 * (5 * r6);
		    d4 += h9 * (5 * r5);
		    c += (d4 >>> 13); d4 &= 0x1fff;

		    d5 = c;
		    d5 += h0 * r5;
		    d5 += h1 * r4;
		    d5 += h2 * r3;
		    d5 += h3 * r2;
		    d5 += h4 * r1;
		    c = (d5 >>> 13); d5 &= 0x1fff;
		    d5 += h5 * r0;
		    d5 += h6 * (5 * r9);
		    d5 += h7 * (5 * r8);
		    d5 += h8 * (5 * r7);
		    d5 += h9 * (5 * r6);
		    c += (d5 >>> 13); d5 &= 0x1fff;

		    d6 = c;
		    d6 += h0 * r6;
		    d6 += h1 * r5;
		    d6 += h2 * r4;
		    d6 += h3 * r3;
		    d6 += h4 * r2;
		    c = (d6 >>> 13); d6 &= 0x1fff;
		    d6 += h5 * r1;
		    d6 += h6 * r0;
		    d6 += h7 * (5 * r9);
		    d6 += h8 * (5 * r8);
		    d6 += h9 * (5 * r7);
		    c += (d6 >>> 13); d6 &= 0x1fff;

		    d7 = c;
		    d7 += h0 * r7;
		    d7 += h1 * r6;
		    d7 += h2 * r5;
		    d7 += h3 * r4;
		    d7 += h4 * r3;
		    c = (d7 >>> 13); d7 &= 0x1fff;
		    d7 += h5 * r2;
		    d7 += h6 * r1;
		    d7 += h7 * r0;
		    d7 += h8 * (5 * r9);
		    d7 += h9 * (5 * r8);
		    c += (d7 >>> 13); d7 &= 0x1fff;

		    d8 = c;
		    d8 += h0 * r8;
		    d8 += h1 * r7;
		    d8 += h2 * r6;
		    d8 += h3 * r5;
		    d8 += h4 * r4;
		    c = (d8 >>> 13); d8 &= 0x1fff;
		    d8 += h5 * r3;
		    d8 += h6 * r2;
		    d8 += h7 * r1;
		    d8 += h8 * r0;
		    d8 += h9 * (5 * r9);
		    c += (d8 >>> 13); d8 &= 0x1fff;

		    d9 = c;
		    d9 += h0 * r9;
		    d9 += h1 * r8;
		    d9 += h2 * r7;
		    d9 += h3 * r6;
		    d9 += h4 * r5;
		    c = (d9 >>> 13); d9 &= 0x1fff;
		    d9 += h5 * r4;
		    d9 += h6 * r3;
		    d9 += h7 * r2;
		    d9 += h8 * r1;
		    d9 += h9 * r0;
		    c += (d9 >>> 13); d9 &= 0x1fff;

		    c = (((c << 2) + c)) | 0;
		    c = (c + d0) | 0;
		    d0 = c & 0x1fff;
		    c = (c >>> 13);
		    d1 += c;

		    h0 = d0;
		    h1 = d1;
		    h2 = d2;
		    h3 = d3;
		    h4 = d4;
		    h5 = d5;
		    h6 = d6;
		    h7 = d7;
		    h8 = d8;
		    h9 = d9;

		    mpos += 16;
		    bytes -= 16;
		  }
		  this.h[0] = h0;
		  this.h[1] = h1;
		  this.h[2] = h2;
		  this.h[3] = h3;
		  this.h[4] = h4;
		  this.h[5] = h5;
		  this.h[6] = h6;
		  this.h[7] = h7;
		  this.h[8] = h8;
		  this.h[9] = h9;
		};

		poly1305.prototype.finish = function(mac, macpos) {
		  var g = new Uint16Array(10);
		  var c, mask, f, i;

		  if (this.leftover) {
		    i = this.leftover;
		    this.buffer[i++] = 1;
		    for (; i < 16; i++) this.buffer[i] = 0;
		    this.fin = 1;
		    this.blocks(this.buffer, 0, 16);
		  }

		  c = this.h[1] >>> 13;
		  this.h[1] &= 0x1fff;
		  for (i = 2; i < 10; i++) {
		    this.h[i] += c;
		    c = this.h[i] >>> 13;
		    this.h[i] &= 0x1fff;
		  }
		  this.h[0] += (c * 5);
		  c = this.h[0] >>> 13;
		  this.h[0] &= 0x1fff;
		  this.h[1] += c;
		  c = this.h[1] >>> 13;
		  this.h[1] &= 0x1fff;
		  this.h[2] += c;

		  g[0] = this.h[0] + 5;
		  c = g[0] >>> 13;
		  g[0] &= 0x1fff;
		  for (i = 1; i < 10; i++) {
		    g[i] = this.h[i] + c;
		    c = g[i] >>> 13;
		    g[i] &= 0x1fff;
		  }
		  g[9] -= (1 << 13);

		  mask = (c ^ 1) - 1;
		  for (i = 0; i < 10; i++) g[i] &= mask;
		  mask = ~mask;
		  for (i = 0; i < 10; i++) this.h[i] = (this.h[i] & mask) | g[i];

		  this.h[0] = ((this.h[0]       ) | (this.h[1] << 13)                    ) & 0xffff;
		  this.h[1] = ((this.h[1] >>>  3) | (this.h[2] << 10)                    ) & 0xffff;
		  this.h[2] = ((this.h[2] >>>  6) | (this.h[3] <<  7)                    ) & 0xffff;
		  this.h[3] = ((this.h[3] >>>  9) | (this.h[4] <<  4)                    ) & 0xffff;
		  this.h[4] = ((this.h[4] >>> 12) | (this.h[5] <<  1) | (this.h[6] << 14)) & 0xffff;
		  this.h[5] = ((this.h[6] >>>  2) | (this.h[7] << 11)                    ) & 0xffff;
		  this.h[6] = ((this.h[7] >>>  5) | (this.h[8] <<  8)                    ) & 0xffff;
		  this.h[7] = ((this.h[8] >>>  8) | (this.h[9] <<  5)                    ) & 0xffff;

		  f = this.h[0] + this.pad[0];
		  this.h[0] = f & 0xffff;
		  for (i = 1; i < 8; i++) {
		    f = (((this.h[i] + this.pad[i]) | 0) + (f >>> 16)) | 0;
		    this.h[i] = f & 0xffff;
		  }

		  mac[macpos+ 0] = (this.h[0] >>> 0) & 0xff;
		  mac[macpos+ 1] = (this.h[0] >>> 8) & 0xff;
		  mac[macpos+ 2] = (this.h[1] >>> 0) & 0xff;
		  mac[macpos+ 3] = (this.h[1] >>> 8) & 0xff;
		  mac[macpos+ 4] = (this.h[2] >>> 0) & 0xff;
		  mac[macpos+ 5] = (this.h[2] >>> 8) & 0xff;
		  mac[macpos+ 6] = (this.h[3] >>> 0) & 0xff;
		  mac[macpos+ 7] = (this.h[3] >>> 8) & 0xff;
		  mac[macpos+ 8] = (this.h[4] >>> 0) & 0xff;
		  mac[macpos+ 9] = (this.h[4] >>> 8) & 0xff;
		  mac[macpos+10] = (this.h[5] >>> 0) & 0xff;
		  mac[macpos+11] = (this.h[5] >>> 8) & 0xff;
		  mac[macpos+12] = (this.h[6] >>> 0) & 0xff;
		  mac[macpos+13] = (this.h[6] >>> 8) & 0xff;
		  mac[macpos+14] = (this.h[7] >>> 0) & 0xff;
		  mac[macpos+15] = (this.h[7] >>> 8) & 0xff;
		};

		poly1305.prototype.update = function(m, mpos, bytes) {
		  var i, want;

		  if (this.leftover) {
		    want = (16 - this.leftover);
		    if (want > bytes)
		      want = bytes;
		    for (i = 0; i < want; i++)
		      this.buffer[this.leftover + i] = m[mpos+i];
		    bytes -= want;
		    mpos += want;
		    this.leftover += want;
		    if (this.leftover < 16)
		      return;
		    this.blocks(this.buffer, 0, 16);
		    this.leftover = 0;
		  }

		  if (bytes >= 16) {
		    want = bytes - (bytes % 16);
		    this.blocks(m, mpos, want);
		    mpos += want;
		    bytes -= want;
		  }

		  if (bytes) {
		    for (i = 0; i < bytes; i++)
		      this.buffer[this.leftover + i] = m[mpos+i];
		    this.leftover += bytes;
		  }
		};

		function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
		  var s = new poly1305(k);
		  s.update(m, mpos, n);
		  s.finish(out, outpos);
		  return 0;
		}

		function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
		  var x = new Uint8Array(16);
		  crypto_onetimeauth(x,0,m,mpos,n,k);
		  return crypto_verify_16(h,hpos,x,0);
		}

		function crypto_secretbox(c,m,d,n,k) {
		  var i;
		  if (d < 32) return -1;
		  crypto_stream_xor(c,0,m,0,d,n,k);
		  crypto_onetimeauth(c, 16, c, 32, d - 32, c);
		  for (i = 0; i < 16; i++) c[i] = 0;
		  return 0;
		}

		function crypto_secretbox_open(m,c,d,n,k) {
		  var i;
		  var x = new Uint8Array(32);
		  if (d < 32) return -1;
		  crypto_stream(x,0,32,n,k);
		  if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return -1;
		  crypto_stream_xor(m,0,c,0,d,n,k);
		  for (i = 0; i < 32; i++) m[i] = 0;
		  return 0;
		}

		function set25519(r, a) {
		  var i;
		  for (i = 0; i < 16; i++) r[i] = a[i]|0;
		}

		function car25519(o) {
		  var i, v, c = 1;
		  for (i = 0; i < 16; i++) {
		    v = o[i] + c + 65535;
		    c = Math.floor(v / 65536);
		    o[i] = v - c * 65536;
		  }
		  o[0] += c-1 + 37 * (c-1);
		}

		function sel25519(p, q, b) {
		  var t, c = ~(b-1);
		  for (var i = 0; i < 16; i++) {
		    t = c & (p[i] ^ q[i]);
		    p[i] ^= t;
		    q[i] ^= t;
		  }
		}

		function pack25519(o, n) {
		  var i, j, b;
		  var m = gf(), t = gf();
		  for (i = 0; i < 16; i++) t[i] = n[i];
		  car25519(t);
		  car25519(t);
		  car25519(t);
		  for (j = 0; j < 2; j++) {
		    m[0] = t[0] - 0xffed;
		    for (i = 1; i < 15; i++) {
		      m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
		      m[i-1] &= 0xffff;
		    }
		    m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
		    b = (m[15]>>16) & 1;
		    m[14] &= 0xffff;
		    sel25519(t, m, 1-b);
		  }
		  for (i = 0; i < 16; i++) {
		    o[2*i] = t[i] & 0xff;
		    o[2*i+1] = t[i]>>8;
		  }
		}

		function neq25519(a, b) {
		  var c = new Uint8Array(32), d = new Uint8Array(32);
		  pack25519(c, a);
		  pack25519(d, b);
		  return crypto_verify_32(c, 0, d, 0);
		}

		function par25519(a) {
		  var d = new Uint8Array(32);
		  pack25519(d, a);
		  return d[0] & 1;
		}

		function unpack25519(o, n) {
		  var i;
		  for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
		  o[15] &= 0x7fff;
		}

		function A(o, a, b) {
		  for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
		}

		function Z(o, a, b) {
		  for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
		}

		function M(o, a, b) {
		  var v, c,
		     t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
		     t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
		    t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
		    t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
		    b0 = b[0],
		    b1 = b[1],
		    b2 = b[2],
		    b3 = b[3],
		    b4 = b[4],
		    b5 = b[5],
		    b6 = b[6],
		    b7 = b[7],
		    b8 = b[8],
		    b9 = b[9],
		    b10 = b[10],
		    b11 = b[11],
		    b12 = b[12],
		    b13 = b[13],
		    b14 = b[14],
		    b15 = b[15];

		  v = a[0];
		  t0 += v * b0;
		  t1 += v * b1;
		  t2 += v * b2;
		  t3 += v * b3;
		  t4 += v * b4;
		  t5 += v * b5;
		  t6 += v * b6;
		  t7 += v * b7;
		  t8 += v * b8;
		  t9 += v * b9;
		  t10 += v * b10;
		  t11 += v * b11;
		  t12 += v * b12;
		  t13 += v * b13;
		  t14 += v * b14;
		  t15 += v * b15;
		  v = a[1];
		  t1 += v * b0;
		  t2 += v * b1;
		  t3 += v * b2;
		  t4 += v * b3;
		  t5 += v * b4;
		  t6 += v * b5;
		  t7 += v * b6;
		  t8 += v * b7;
		  t9 += v * b8;
		  t10 += v * b9;
		  t11 += v * b10;
		  t12 += v * b11;
		  t13 += v * b12;
		  t14 += v * b13;
		  t15 += v * b14;
		  t16 += v * b15;
		  v = a[2];
		  t2 += v * b0;
		  t3 += v * b1;
		  t4 += v * b2;
		  t5 += v * b3;
		  t6 += v * b4;
		  t7 += v * b5;
		  t8 += v * b6;
		  t9 += v * b7;
		  t10 += v * b8;
		  t11 += v * b9;
		  t12 += v * b10;
		  t13 += v * b11;
		  t14 += v * b12;
		  t15 += v * b13;
		  t16 += v * b14;
		  t17 += v * b15;
		  v = a[3];
		  t3 += v * b0;
		  t4 += v * b1;
		  t5 += v * b2;
		  t6 += v * b3;
		  t7 += v * b4;
		  t8 += v * b5;
		  t9 += v * b6;
		  t10 += v * b7;
		  t11 += v * b8;
		  t12 += v * b9;
		  t13 += v * b10;
		  t14 += v * b11;
		  t15 += v * b12;
		  t16 += v * b13;
		  t17 += v * b14;
		  t18 += v * b15;
		  v = a[4];
		  t4 += v * b0;
		  t5 += v * b1;
		  t6 += v * b2;
		  t7 += v * b3;
		  t8 += v * b4;
		  t9 += v * b5;
		  t10 += v * b6;
		  t11 += v * b7;
		  t12 += v * b8;
		  t13 += v * b9;
		  t14 += v * b10;
		  t15 += v * b11;
		  t16 += v * b12;
		  t17 += v * b13;
		  t18 += v * b14;
		  t19 += v * b15;
		  v = a[5];
		  t5 += v * b0;
		  t6 += v * b1;
		  t7 += v * b2;
		  t8 += v * b3;
		  t9 += v * b4;
		  t10 += v * b5;
		  t11 += v * b6;
		  t12 += v * b7;
		  t13 += v * b8;
		  t14 += v * b9;
		  t15 += v * b10;
		  t16 += v * b11;
		  t17 += v * b12;
		  t18 += v * b13;
		  t19 += v * b14;
		  t20 += v * b15;
		  v = a[6];
		  t6 += v * b0;
		  t7 += v * b1;
		  t8 += v * b2;
		  t9 += v * b3;
		  t10 += v * b4;
		  t11 += v * b5;
		  t12 += v * b6;
		  t13 += v * b7;
		  t14 += v * b8;
		  t15 += v * b9;
		  t16 += v * b10;
		  t17 += v * b11;
		  t18 += v * b12;
		  t19 += v * b13;
		  t20 += v * b14;
		  t21 += v * b15;
		  v = a[7];
		  t7 += v * b0;
		  t8 += v * b1;
		  t9 += v * b2;
		  t10 += v * b3;
		  t11 += v * b4;
		  t12 += v * b5;
		  t13 += v * b6;
		  t14 += v * b7;
		  t15 += v * b8;
		  t16 += v * b9;
		  t17 += v * b10;
		  t18 += v * b11;
		  t19 += v * b12;
		  t20 += v * b13;
		  t21 += v * b14;
		  t22 += v * b15;
		  v = a[8];
		  t8 += v * b0;
		  t9 += v * b1;
		  t10 += v * b2;
		  t11 += v * b3;
		  t12 += v * b4;
		  t13 += v * b5;
		  t14 += v * b6;
		  t15 += v * b7;
		  t16 += v * b8;
		  t17 += v * b9;
		  t18 += v * b10;
		  t19 += v * b11;
		  t20 += v * b12;
		  t21 += v * b13;
		  t22 += v * b14;
		  t23 += v * b15;
		  v = a[9];
		  t9 += v * b0;
		  t10 += v * b1;
		  t11 += v * b2;
		  t12 += v * b3;
		  t13 += v * b4;
		  t14 += v * b5;
		  t15 += v * b6;
		  t16 += v * b7;
		  t17 += v * b8;
		  t18 += v * b9;
		  t19 += v * b10;
		  t20 += v * b11;
		  t21 += v * b12;
		  t22 += v * b13;
		  t23 += v * b14;
		  t24 += v * b15;
		  v = a[10];
		  t10 += v * b0;
		  t11 += v * b1;
		  t12 += v * b2;
		  t13 += v * b3;
		  t14 += v * b4;
		  t15 += v * b5;
		  t16 += v * b6;
		  t17 += v * b7;
		  t18 += v * b8;
		  t19 += v * b9;
		  t20 += v * b10;
		  t21 += v * b11;
		  t22 += v * b12;
		  t23 += v * b13;
		  t24 += v * b14;
		  t25 += v * b15;
		  v = a[11];
		  t11 += v * b0;
		  t12 += v * b1;
		  t13 += v * b2;
		  t14 += v * b3;
		  t15 += v * b4;
		  t16 += v * b5;
		  t17 += v * b6;
		  t18 += v * b7;
		  t19 += v * b8;
		  t20 += v * b9;
		  t21 += v * b10;
		  t22 += v * b11;
		  t23 += v * b12;
		  t24 += v * b13;
		  t25 += v * b14;
		  t26 += v * b15;
		  v = a[12];
		  t12 += v * b0;
		  t13 += v * b1;
		  t14 += v * b2;
		  t15 += v * b3;
		  t16 += v * b4;
		  t17 += v * b5;
		  t18 += v * b6;
		  t19 += v * b7;
		  t20 += v * b8;
		  t21 += v * b9;
		  t22 += v * b10;
		  t23 += v * b11;
		  t24 += v * b12;
		  t25 += v * b13;
		  t26 += v * b14;
		  t27 += v * b15;
		  v = a[13];
		  t13 += v * b0;
		  t14 += v * b1;
		  t15 += v * b2;
		  t16 += v * b3;
		  t17 += v * b4;
		  t18 += v * b5;
		  t19 += v * b6;
		  t20 += v * b7;
		  t21 += v * b8;
		  t22 += v * b9;
		  t23 += v * b10;
		  t24 += v * b11;
		  t25 += v * b12;
		  t26 += v * b13;
		  t27 += v * b14;
		  t28 += v * b15;
		  v = a[14];
		  t14 += v * b0;
		  t15 += v * b1;
		  t16 += v * b2;
		  t17 += v * b3;
		  t18 += v * b4;
		  t19 += v * b5;
		  t20 += v * b6;
		  t21 += v * b7;
		  t22 += v * b8;
		  t23 += v * b9;
		  t24 += v * b10;
		  t25 += v * b11;
		  t26 += v * b12;
		  t27 += v * b13;
		  t28 += v * b14;
		  t29 += v * b15;
		  v = a[15];
		  t15 += v * b0;
		  t16 += v * b1;
		  t17 += v * b2;
		  t18 += v * b3;
		  t19 += v * b4;
		  t20 += v * b5;
		  t21 += v * b6;
		  t22 += v * b7;
		  t23 += v * b8;
		  t24 += v * b9;
		  t25 += v * b10;
		  t26 += v * b11;
		  t27 += v * b12;
		  t28 += v * b13;
		  t29 += v * b14;
		  t30 += v * b15;

		  t0  += 38 * t16;
		  t1  += 38 * t17;
		  t2  += 38 * t18;
		  t3  += 38 * t19;
		  t4  += 38 * t20;
		  t5  += 38 * t21;
		  t6  += 38 * t22;
		  t7  += 38 * t23;
		  t8  += 38 * t24;
		  t9  += 38 * t25;
		  t10 += 38 * t26;
		  t11 += 38 * t27;
		  t12 += 38 * t28;
		  t13 += 38 * t29;
		  t14 += 38 * t30;
		  // t15 left as is

		  // first car
		  c = 1;
		  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
		  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
		  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
		  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
		  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
		  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
		  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
		  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
		  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
		  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
		  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
		  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
		  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
		  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
		  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
		  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
		  t0 += c-1 + 37 * (c-1);

		  // second car
		  c = 1;
		  v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
		  v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
		  v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
		  v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
		  v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
		  v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
		  v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
		  v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
		  v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
		  v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
		  v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
		  v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
		  v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
		  v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
		  v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
		  v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
		  t0 += c-1 + 37 * (c-1);

		  o[ 0] = t0;
		  o[ 1] = t1;
		  o[ 2] = t2;
		  o[ 3] = t3;
		  o[ 4] = t4;
		  o[ 5] = t5;
		  o[ 6] = t6;
		  o[ 7] = t7;
		  o[ 8] = t8;
		  o[ 9] = t9;
		  o[10] = t10;
		  o[11] = t11;
		  o[12] = t12;
		  o[13] = t13;
		  o[14] = t14;
		  o[15] = t15;
		}

		function S(o, a) {
		  M(o, a, a);
		}

		function inv25519(o, i) {
		  var c = gf();
		  var a;
		  for (a = 0; a < 16; a++) c[a] = i[a];
		  for (a = 253; a >= 0; a--) {
		    S(c, c);
		    if(a !== 2 && a !== 4) M(c, c, i);
		  }
		  for (a = 0; a < 16; a++) o[a] = c[a];
		}

		function pow2523(o, i) {
		  var c = gf();
		  var a;
		  for (a = 0; a < 16; a++) c[a] = i[a];
		  for (a = 250; a >= 0; a--) {
		      S(c, c);
		      if(a !== 1) M(c, c, i);
		  }
		  for (a = 0; a < 16; a++) o[a] = c[a];
		}

		function crypto_scalarmult(q, n, p) {
		  var z = new Uint8Array(32);
		  var x = new Float64Array(80), r, i;
		  var a = gf(), b = gf(), c = gf(),
		      d = gf(), e = gf(), f = gf();
		  for (i = 0; i < 31; i++) z[i] = n[i];
		  z[31]=(n[31]&127)|64;
		  z[0]&=248;
		  unpack25519(x,p);
		  for (i = 0; i < 16; i++) {
		    b[i]=x[i];
		    d[i]=a[i]=c[i]=0;
		  }
		  a[0]=d[0]=1;
		  for (i=254; i>=0; --i) {
		    r=(z[i>>>3]>>>(i&7))&1;
		    sel25519(a,b,r);
		    sel25519(c,d,r);
		    A(e,a,c);
		    Z(a,a,c);
		    A(c,b,d);
		    Z(b,b,d);
		    S(d,e);
		    S(f,a);
		    M(a,c,a);
		    M(c,b,e);
		    A(e,a,c);
		    Z(a,a,c);
		    S(b,a);
		    Z(c,d,f);
		    M(a,c,_121665);
		    A(a,a,d);
		    M(c,c,a);
		    M(a,d,f);
		    M(d,b,x);
		    S(b,e);
		    sel25519(a,b,r);
		    sel25519(c,d,r);
		  }
		  for (i = 0; i < 16; i++) {
		    x[i+16]=a[i];
		    x[i+32]=c[i];
		    x[i+48]=b[i];
		    x[i+64]=d[i];
		  }
		  var x32 = x.subarray(32);
		  var x16 = x.subarray(16);
		  inv25519(x32,x32);
		  M(x16,x16,x32);
		  pack25519(q,x16);
		  return 0;
		}

		function crypto_scalarmult_base(q, n) {
		  return crypto_scalarmult(q, n, _9);
		}

		function crypto_box_keypair(y, x) {
		  randombytes(x, 32);
		  return crypto_scalarmult_base(y, x);
		}

		function crypto_box_beforenm(k, y, x) {
		  var s = new Uint8Array(32);
		  crypto_scalarmult(s, x, y);
		  return crypto_core_hsalsa20(k, _0, s, sigma);
		}

		var crypto_box_afternm = crypto_secretbox;
		var crypto_box_open_afternm = crypto_secretbox_open;

		function crypto_box(c, m, d, n, y, x) {
		  var k = new Uint8Array(32);
		  crypto_box_beforenm(k, y, x);
		  return crypto_box_afternm(c, m, d, n, k);
		}

		function crypto_box_open(m, c, d, n, y, x) {
		  var k = new Uint8Array(32);
		  crypto_box_beforenm(k, y, x);
		  return crypto_box_open_afternm(m, c, d, n, k);
		}

		var K = [
		  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
		  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
		  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
		  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
		  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
		  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
		  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
		  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
		  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
		  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
		  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
		  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
		  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
		  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
		  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
		  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
		  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
		  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
		  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
		  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
		  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
		  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
		  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
		  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
		  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
		  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
		  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
		  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
		  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
		  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
		  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
		  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
		  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
		  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
		  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
		  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
		  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
		  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
		  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
		  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
		];

		function crypto_hashblocks_hl(hh, hl, m, n) {
		  var wh = new Int32Array(16), wl = new Int32Array(16),
		      bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7,
		      bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7,
		      th, tl, i, j, h, l, a, b, c, d;

		  var ah0 = hh[0],
		      ah1 = hh[1],
		      ah2 = hh[2],
		      ah3 = hh[3],
		      ah4 = hh[4],
		      ah5 = hh[5],
		      ah6 = hh[6],
		      ah7 = hh[7],

		      al0 = hl[0],
		      al1 = hl[1],
		      al2 = hl[2],
		      al3 = hl[3],
		      al4 = hl[4],
		      al5 = hl[5],
		      al6 = hl[6],
		      al7 = hl[7];

		  var pos = 0;
		  while (n >= 128) {
		    for (i = 0; i < 16; i++) {
		      j = 8 * i + pos;
		      wh[i] = (m[j+0] << 24) | (m[j+1] << 16) | (m[j+2] << 8) | m[j+3];
		      wl[i] = (m[j+4] << 24) | (m[j+5] << 16) | (m[j+6] << 8) | m[j+7];
		    }
		    for (i = 0; i < 80; i++) {
		      bh0 = ah0;
		      bh1 = ah1;
		      bh2 = ah2;
		      bh3 = ah3;
		      bh4 = ah4;
		      bh5 = ah5;
		      bh6 = ah6;
		      bh7 = ah7;

		      bl0 = al0;
		      bl1 = al1;
		      bl2 = al2;
		      bl3 = al3;
		      bl4 = al4;
		      bl5 = al5;
		      bl6 = al6;
		      bl7 = al7;

		      // add
		      h = ah7;
		      l = al7;

		      a = l & 0xffff; b = l >>> 16;
		      c = h & 0xffff; d = h >>> 16;

		      // Sigma1
		      h = ((ah4 >>> 14) | (al4 << (32-14))) ^ ((ah4 >>> 18) | (al4 << (32-18))) ^ ((al4 >>> (41-32)) | (ah4 << (32-(41-32))));
		      l = ((al4 >>> 14) | (ah4 << (32-14))) ^ ((al4 >>> 18) | (ah4 << (32-18))) ^ ((ah4 >>> (41-32)) | (al4 << (32-(41-32))));

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      // Ch
		      h = (ah4 & ah5) ^ (~ah4 & ah6);
		      l = (al4 & al5) ^ (~al4 & al6);

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      // K
		      h = K[i*2];
		      l = K[i*2+1];

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      // w
		      h = wh[i%16];
		      l = wl[i%16];

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      b += a >>> 16;
		      c += b >>> 16;
		      d += c >>> 16;

		      th = c & 0xffff | d << 16;
		      tl = a & 0xffff | b << 16;

		      // add
		      h = th;
		      l = tl;

		      a = l & 0xffff; b = l >>> 16;
		      c = h & 0xffff; d = h >>> 16;

		      // Sigma0
		      h = ((ah0 >>> 28) | (al0 << (32-28))) ^ ((al0 >>> (34-32)) | (ah0 << (32-(34-32)))) ^ ((al0 >>> (39-32)) | (ah0 << (32-(39-32))));
		      l = ((al0 >>> 28) | (ah0 << (32-28))) ^ ((ah0 >>> (34-32)) | (al0 << (32-(34-32)))) ^ ((ah0 >>> (39-32)) | (al0 << (32-(39-32))));

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      // Maj
		      h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2);
		      l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2);

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      b += a >>> 16;
		      c += b >>> 16;
		      d += c >>> 16;

		      bh7 = (c & 0xffff) | (d << 16);
		      bl7 = (a & 0xffff) | (b << 16);

		      // add
		      h = bh3;
		      l = bl3;

		      a = l & 0xffff; b = l >>> 16;
		      c = h & 0xffff; d = h >>> 16;

		      h = th;
		      l = tl;

		      a += l & 0xffff; b += l >>> 16;
		      c += h & 0xffff; d += h >>> 16;

		      b += a >>> 16;
		      c += b >>> 16;
		      d += c >>> 16;

		      bh3 = (c & 0xffff) | (d << 16);
		      bl3 = (a & 0xffff) | (b << 16);

		      ah1 = bh0;
		      ah2 = bh1;
		      ah3 = bh2;
		      ah4 = bh3;
		      ah5 = bh4;
		      ah6 = bh5;
		      ah7 = bh6;
		      ah0 = bh7;

		      al1 = bl0;
		      al2 = bl1;
		      al3 = bl2;
		      al4 = bl3;
		      al5 = bl4;
		      al6 = bl5;
		      al7 = bl6;
		      al0 = bl7;

		      if (i%16 === 15) {
		        for (j = 0; j < 16; j++) {
		          // add
		          h = wh[j];
		          l = wl[j];

		          a = l & 0xffff; b = l >>> 16;
		          c = h & 0xffff; d = h >>> 16;

		          h = wh[(j+9)%16];
		          l = wl[(j+9)%16];

		          a += l & 0xffff; b += l >>> 16;
		          c += h & 0xffff; d += h >>> 16;

		          // sigma0
		          th = wh[(j+1)%16];
		          tl = wl[(j+1)%16];
		          h = ((th >>> 1) | (tl << (32-1))) ^ ((th >>> 8) | (tl << (32-8))) ^ (th >>> 7);
		          l = ((tl >>> 1) | (th << (32-1))) ^ ((tl >>> 8) | (th << (32-8))) ^ ((tl >>> 7) | (th << (32-7)));

		          a += l & 0xffff; b += l >>> 16;
		          c += h & 0xffff; d += h >>> 16;

		          // sigma1
		          th = wh[(j+14)%16];
		          tl = wl[(j+14)%16];
		          h = ((th >>> 19) | (tl << (32-19))) ^ ((tl >>> (61-32)) | (th << (32-(61-32)))) ^ (th >>> 6);
		          l = ((tl >>> 19) | (th << (32-19))) ^ ((th >>> (61-32)) | (tl << (32-(61-32)))) ^ ((tl >>> 6) | (th << (32-6)));

		          a += l & 0xffff; b += l >>> 16;
		          c += h & 0xffff; d += h >>> 16;

		          b += a >>> 16;
		          c += b >>> 16;
		          d += c >>> 16;

		          wh[j] = (c & 0xffff) | (d << 16);
		          wl[j] = (a & 0xffff) | (b << 16);
		        }
		      }
		    }

		    // add
		    h = ah0;
		    l = al0;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[0];
		    l = hl[0];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[0] = ah0 = (c & 0xffff) | (d << 16);
		    hl[0] = al0 = (a & 0xffff) | (b << 16);

		    h = ah1;
		    l = al1;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[1];
		    l = hl[1];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[1] = ah1 = (c & 0xffff) | (d << 16);
		    hl[1] = al1 = (a & 0xffff) | (b << 16);

		    h = ah2;
		    l = al2;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[2];
		    l = hl[2];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[2] = ah2 = (c & 0xffff) | (d << 16);
		    hl[2] = al2 = (a & 0xffff) | (b << 16);

		    h = ah3;
		    l = al3;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[3];
		    l = hl[3];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[3] = ah3 = (c & 0xffff) | (d << 16);
		    hl[3] = al3 = (a & 0xffff) | (b << 16);

		    h = ah4;
		    l = al4;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[4];
		    l = hl[4];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[4] = ah4 = (c & 0xffff) | (d << 16);
		    hl[4] = al4 = (a & 0xffff) | (b << 16);

		    h = ah5;
		    l = al5;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[5];
		    l = hl[5];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[5] = ah5 = (c & 0xffff) | (d << 16);
		    hl[5] = al5 = (a & 0xffff) | (b << 16);

		    h = ah6;
		    l = al6;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[6];
		    l = hl[6];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[6] = ah6 = (c & 0xffff) | (d << 16);
		    hl[6] = al6 = (a & 0xffff) | (b << 16);

		    h = ah7;
		    l = al7;

		    a = l & 0xffff; b = l >>> 16;
		    c = h & 0xffff; d = h >>> 16;

		    h = hh[7];
		    l = hl[7];

		    a += l & 0xffff; b += l >>> 16;
		    c += h & 0xffff; d += h >>> 16;

		    b += a >>> 16;
		    c += b >>> 16;
		    d += c >>> 16;

		    hh[7] = ah7 = (c & 0xffff) | (d << 16);
		    hl[7] = al7 = (a & 0xffff) | (b << 16);

		    pos += 128;
		    n -= 128;
		  }

		  return n;
		}

		function crypto_hash(out, m, n) {
		  var hh = new Int32Array(8),
		      hl = new Int32Array(8),
		      x = new Uint8Array(256),
		      i, b = n;

		  hh[0] = 0x6a09e667;
		  hh[1] = 0xbb67ae85;
		  hh[2] = 0x3c6ef372;
		  hh[3] = 0xa54ff53a;
		  hh[4] = 0x510e527f;
		  hh[5] = 0x9b05688c;
		  hh[6] = 0x1f83d9ab;
		  hh[7] = 0x5be0cd19;

		  hl[0] = 0xf3bcc908;
		  hl[1] = 0x84caa73b;
		  hl[2] = 0xfe94f82b;
		  hl[3] = 0x5f1d36f1;
		  hl[4] = 0xade682d1;
		  hl[5] = 0x2b3e6c1f;
		  hl[6] = 0xfb41bd6b;
		  hl[7] = 0x137e2179;

		  crypto_hashblocks_hl(hh, hl, m, n);
		  n %= 128;

		  for (i = 0; i < n; i++) x[i] = m[b-n+i];
		  x[n] = 128;

		  n = 256-128*(n<112?1:0);
		  x[n-9] = 0;
		  ts64(x, n-8,  (b / 0x20000000) | 0, b << 3);
		  crypto_hashblocks_hl(hh, hl, x, n);

		  for (i = 0; i < 8; i++) ts64(out, 8*i, hh[i], hl[i]);

		  return 0;
		}

		function add(p, q) {
		  var a = gf(), b = gf(), c = gf(),
		      d = gf(), e = gf(), f = gf(),
		      g = gf(), h = gf(), t = gf();

		  Z(a, p[1], p[0]);
		  Z(t, q[1], q[0]);
		  M(a, a, t);
		  A(b, p[0], p[1]);
		  A(t, q[0], q[1]);
		  M(b, b, t);
		  M(c, p[3], q[3]);
		  M(c, c, D2);
		  M(d, p[2], q[2]);
		  A(d, d, d);
		  Z(e, b, a);
		  Z(f, d, c);
		  A(g, d, c);
		  A(h, b, a);

		  M(p[0], e, f);
		  M(p[1], h, g);
		  M(p[2], g, f);
		  M(p[3], e, h);
		}

		function cswap(p, q, b) {
		  var i;
		  for (i = 0; i < 4; i++) {
		    sel25519(p[i], q[i], b);
		  }
		}

		function pack(r, p) {
		  var tx = gf(), ty = gf(), zi = gf();
		  inv25519(zi, p[2]);
		  M(tx, p[0], zi);
		  M(ty, p[1], zi);
		  pack25519(r, ty);
		  r[31] ^= par25519(tx) << 7;
		}

		function scalarmult(p, q, s) {
		  var b, i;
		  set25519(p[0], gf0);
		  set25519(p[1], gf1);
		  set25519(p[2], gf1);
		  set25519(p[3], gf0);
		  for (i = 255; i >= 0; --i) {
		    b = (s[(i/8)|0] >> (i&7)) & 1;
		    cswap(p, q, b);
		    add(q, p);
		    add(p, p);
		    cswap(p, q, b);
		  }
		}

		function scalarbase(p, s) {
		  var q = [gf(), gf(), gf(), gf()];
		  set25519(q[0], X);
		  set25519(q[1], Y);
		  set25519(q[2], gf1);
		  M(q[3], X, Y);
		  scalarmult(p, q, s);
		}

		function crypto_sign_keypair(pk, sk, seeded) {
		  var d = new Uint8Array(64);
		  var p = [gf(), gf(), gf(), gf()];
		  var i;

		  if (!seeded) randombytes(sk, 32);
		  crypto_hash(d, sk, 32);
		  d[0] &= 248;
		  d[31] &= 127;
		  d[31] |= 64;

		  scalarbase(p, d);
		  pack(pk, p);

		  for (i = 0; i < 32; i++) sk[i+32] = pk[i];
		  return 0;
		}

		var L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);

		function modL(r, x) {
		  var carry, i, j, k;
		  for (i = 63; i >= 32; --i) {
		    carry = 0;
		    for (j = i - 32, k = i - 12; j < k; ++j) {
		      x[j] += carry - 16 * x[i] * L[j - (i - 32)];
		      carry = Math.floor((x[j] + 128) / 256);
		      x[j] -= carry * 256;
		    }
		    x[j] += carry;
		    x[i] = 0;
		  }
		  carry = 0;
		  for (j = 0; j < 32; j++) {
		    x[j] += carry - (x[31] >> 4) * L[j];
		    carry = x[j] >> 8;
		    x[j] &= 255;
		  }
		  for (j = 0; j < 32; j++) x[j] -= carry * L[j];
		  for (i = 0; i < 32; i++) {
		    x[i+1] += x[i] >> 8;
		    r[i] = x[i] & 255;
		  }
		}

		function reduce(r) {
		  var x = new Float64Array(64), i;
		  for (i = 0; i < 64; i++) x[i] = r[i];
		  for (i = 0; i < 64; i++) r[i] = 0;
		  modL(r, x);
		}

		// Note: difference from C - smlen returned, not passed as argument.
		function crypto_sign(sm, m, n, sk) {
		  var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
		  var i, j, x = new Float64Array(64);
		  var p = [gf(), gf(), gf(), gf()];

		  crypto_hash(d, sk, 32);
		  d[0] &= 248;
		  d[31] &= 127;
		  d[31] |= 64;

		  var smlen = n + 64;
		  for (i = 0; i < n; i++) sm[64 + i] = m[i];
		  for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];

		  crypto_hash(r, sm.subarray(32), n+32);
		  reduce(r);
		  scalarbase(p, r);
		  pack(sm, p);

		  for (i = 32; i < 64; i++) sm[i] = sk[i];
		  crypto_hash(h, sm, n + 64);
		  reduce(h);

		  for (i = 0; i < 64; i++) x[i] = 0;
		  for (i = 0; i < 32; i++) x[i] = r[i];
		  for (i = 0; i < 32; i++) {
		    for (j = 0; j < 32; j++) {
		      x[i+j] += h[i] * d[j];
		    }
		  }

		  modL(sm.subarray(32), x);
		  return smlen;
		}

		function unpackneg(r, p) {
		  var t = gf(), chk = gf(), num = gf(),
		      den = gf(), den2 = gf(), den4 = gf(),
		      den6 = gf();

		  set25519(r[2], gf1);
		  unpack25519(r[1], p);
		  S(num, r[1]);
		  M(den, num, D);
		  Z(num, num, r[2]);
		  A(den, r[2], den);

		  S(den2, den);
		  S(den4, den2);
		  M(den6, den4, den2);
		  M(t, den6, num);
		  M(t, t, den);

		  pow2523(t, t);
		  M(t, t, num);
		  M(t, t, den);
		  M(t, t, den);
		  M(r[0], t, den);

		  S(chk, r[0]);
		  M(chk, chk, den);
		  if (neq25519(chk, num)) M(r[0], r[0], I);

		  S(chk, r[0]);
		  M(chk, chk, den);
		  if (neq25519(chk, num)) return -1;

		  if (par25519(r[0]) === (p[31]>>7)) Z(r[0], gf0, r[0]);

		  M(r[3], r[0], r[1]);
		  return 0;
		}

		function crypto_sign_open(m, sm, n, pk) {
		  var i;
		  var t = new Uint8Array(32), h = new Uint8Array(64);
		  var p = [gf(), gf(), gf(), gf()],
		      q = [gf(), gf(), gf(), gf()];

		  if (n < 64) return -1;

		  if (unpackneg(q, pk)) return -1;

		  for (i = 0; i < n; i++) m[i] = sm[i];
		  for (i = 0; i < 32; i++) m[i+32] = pk[i];
		  crypto_hash(h, m, n);
		  reduce(h);
		  scalarmult(p, q, h);

		  scalarbase(q, sm.subarray(32));
		  add(p, q);
		  pack(t, p);

		  n -= 64;
		  if (crypto_verify_32(sm, 0, t, 0)) {
		    for (i = 0; i < n; i++) m[i] = 0;
		    return -1;
		  }

		  for (i = 0; i < n; i++) m[i] = sm[i + 64];
		  return n;
		}

		var crypto_secretbox_KEYBYTES = 32,
		    crypto_secretbox_NONCEBYTES = 24,
		    crypto_secretbox_ZEROBYTES = 32,
		    crypto_secretbox_BOXZEROBYTES = 16,
		    crypto_scalarmult_BYTES = 32,
		    crypto_scalarmult_SCALARBYTES = 32,
		    crypto_box_PUBLICKEYBYTES = 32,
		    crypto_box_SECRETKEYBYTES = 32,
		    crypto_box_BEFORENMBYTES = 32,
		    crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
		    crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
		    crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
		    crypto_sign_BYTES = 64,
		    crypto_sign_PUBLICKEYBYTES = 32,
		    crypto_sign_SECRETKEYBYTES = 64,
		    crypto_sign_SEEDBYTES = 32,
		    crypto_hash_BYTES = 64;

		nacl.lowlevel = {
		  crypto_core_hsalsa20: crypto_core_hsalsa20,
		  crypto_stream_xor: crypto_stream_xor,
		  crypto_stream: crypto_stream,
		  crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
		  crypto_stream_salsa20: crypto_stream_salsa20,
		  crypto_onetimeauth: crypto_onetimeauth,
		  crypto_onetimeauth_verify: crypto_onetimeauth_verify,
		  crypto_verify_16: crypto_verify_16,
		  crypto_verify_32: crypto_verify_32,
		  crypto_secretbox: crypto_secretbox,
		  crypto_secretbox_open: crypto_secretbox_open,
		  crypto_scalarmult: crypto_scalarmult,
		  crypto_scalarmult_base: crypto_scalarmult_base,
		  crypto_box_beforenm: crypto_box_beforenm,
		  crypto_box_afternm: crypto_box_afternm,
		  crypto_box: crypto_box,
		  crypto_box_open: crypto_box_open,
		  crypto_box_keypair: crypto_box_keypair,
		  crypto_hash: crypto_hash,
		  crypto_sign: crypto_sign,
		  crypto_sign_keypair: crypto_sign_keypair,
		  crypto_sign_open: crypto_sign_open,

		  crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
		  crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
		  crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
		  crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
		  crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
		  crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
		  crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
		  crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
		  crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
		  crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
		  crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
		  crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
		  crypto_sign_BYTES: crypto_sign_BYTES,
		  crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
		  crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
		  crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
		  crypto_hash_BYTES: crypto_hash_BYTES,

		  gf: gf,
		  D: D,
		  L: L,
		  pack25519: pack25519,
		  unpack25519: unpack25519,
		  M: M,
		  A: A,
		  S: S,
		  Z: Z,
		  pow2523: pow2523,
		  add: add,
		  set25519: set25519,
		  modL: modL,
		  scalarmult: scalarmult,
		  scalarbase: scalarbase,
		};

		/* High-level API */

		function checkLengths(k, n) {
		  if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
		  if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
		}

		function checkBoxLengths(pk, sk) {
		  if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
		  if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
		}

		function checkArrayTypes() {
		  for (var i = 0; i < arguments.length; i++) {
		    if (!(arguments[i] instanceof Uint8Array))
		      throw new TypeError('unexpected type, use Uint8Array');
		  }
		}

		function cleanup(arr) {
		  for (var i = 0; i < arr.length; i++) arr[i] = 0;
		}

		nacl.randomBytes = function(n) {
		  var b = new Uint8Array(n);
		  randombytes(b, n);
		  return b;
		};

		nacl.secretbox = function(msg, nonce, key) {
		  checkArrayTypes(msg, nonce, key);
		  checkLengths(key, nonce);
		  var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
		  var c = new Uint8Array(m.length);
		  for (var i = 0; i < msg.length; i++) m[i+crypto_secretbox_ZEROBYTES] = msg[i];
		  crypto_secretbox(c, m, m.length, nonce, key);
		  return c.subarray(crypto_secretbox_BOXZEROBYTES);
		};

		nacl.secretbox.open = function(box, nonce, key) {
		  checkArrayTypes(box, nonce, key);
		  checkLengths(key, nonce);
		  var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
		  var m = new Uint8Array(c.length);
		  for (var i = 0; i < box.length; i++) c[i+crypto_secretbox_BOXZEROBYTES] = box[i];
		  if (c.length < 32) return null;
		  if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
		  return m.subarray(crypto_secretbox_ZEROBYTES);
		};

		nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
		nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
		nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;

		nacl.scalarMult = function(n, p) {
		  checkArrayTypes(n, p);
		  if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
		  if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
		  var q = new Uint8Array(crypto_scalarmult_BYTES);
		  crypto_scalarmult(q, n, p);
		  return q;
		};

		nacl.scalarMult.base = function(n) {
		  checkArrayTypes(n);
		  if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
		  var q = new Uint8Array(crypto_scalarmult_BYTES);
		  crypto_scalarmult_base(q, n);
		  return q;
		};

		nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
		nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;

		nacl.box = function(msg, nonce, publicKey, secretKey) {
		  var k = nacl.box.before(publicKey, secretKey);
		  return nacl.secretbox(msg, nonce, k);
		};

		nacl.box.before = function(publicKey, secretKey) {
		  checkArrayTypes(publicKey, secretKey);
		  checkBoxLengths(publicKey, secretKey);
		  var k = new Uint8Array(crypto_box_BEFORENMBYTES);
		  crypto_box_beforenm(k, publicKey, secretKey);
		  return k;
		};

		nacl.box.after = nacl.secretbox;

		nacl.box.open = function(msg, nonce, publicKey, secretKey) {
		  var k = nacl.box.before(publicKey, secretKey);
		  return nacl.secretbox.open(msg, nonce, k);
		};

		nacl.box.open.after = nacl.secretbox.open;

		nacl.box.keyPair = function() {
		  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
		  var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
		  crypto_box_keypair(pk, sk);
		  return {publicKey: pk, secretKey: sk};
		};

		nacl.box.keyPair.fromSecretKey = function(secretKey) {
		  checkArrayTypes(secretKey);
		  if (secretKey.length !== crypto_box_SECRETKEYBYTES)
		    throw new Error('bad secret key size');
		  var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
		  crypto_scalarmult_base(pk, secretKey);
		  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
		};

		nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
		nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
		nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
		nacl.box.nonceLength = crypto_box_NONCEBYTES;
		nacl.box.overheadLength = nacl.secretbox.overheadLength;

		nacl.sign = function(msg, secretKey) {
		  checkArrayTypes(msg, secretKey);
		  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
		    throw new Error('bad secret key size');
		  var signedMsg = new Uint8Array(crypto_sign_BYTES+msg.length);
		  crypto_sign(signedMsg, msg, msg.length, secretKey);
		  return signedMsg;
		};

		nacl.sign.open = function(signedMsg, publicKey) {
		  checkArrayTypes(signedMsg, publicKey);
		  if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
		    throw new Error('bad public key size');
		  var tmp = new Uint8Array(signedMsg.length);
		  var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
		  if (mlen < 0) return null;
		  var m = new Uint8Array(mlen);
		  for (var i = 0; i < m.length; i++) m[i] = tmp[i];
		  return m;
		};

		nacl.sign.detached = function(msg, secretKey) {
		  var signedMsg = nacl.sign(msg, secretKey);
		  var sig = new Uint8Array(crypto_sign_BYTES);
		  for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
		  return sig;
		};

		nacl.sign.detached.verify = function(msg, sig, publicKey) {
		  checkArrayTypes(msg, sig, publicKey);
		  if (sig.length !== crypto_sign_BYTES)
		    throw new Error('bad signature size');
		  if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
		    throw new Error('bad public key size');
		  var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
		  var m = new Uint8Array(crypto_sign_BYTES + msg.length);
		  var i;
		  for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
		  for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
		  return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
		};

		nacl.sign.keyPair = function() {
		  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
		  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
		  crypto_sign_keypair(pk, sk);
		  return {publicKey: pk, secretKey: sk};
		};

		nacl.sign.keyPair.fromSecretKey = function(secretKey) {
		  checkArrayTypes(secretKey);
		  if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
		    throw new Error('bad secret key size');
		  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
		  for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
		  return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
		};

		nacl.sign.keyPair.fromSeed = function(seed) {
		  checkArrayTypes(seed);
		  if (seed.length !== crypto_sign_SEEDBYTES)
		    throw new Error('bad seed size');
		  var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
		  var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
		  for (var i = 0; i < 32; i++) sk[i] = seed[i];
		  crypto_sign_keypair(pk, sk, true);
		  return {publicKey: pk, secretKey: sk};
		};

		nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
		nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
		nacl.sign.seedLength = crypto_sign_SEEDBYTES;
		nacl.sign.signatureLength = crypto_sign_BYTES;

		nacl.hash = function(msg) {
		  checkArrayTypes(msg);
		  var h = new Uint8Array(crypto_hash_BYTES);
		  crypto_hash(h, msg, msg.length);
		  return h;
		};

		nacl.hash.hashLength = crypto_hash_BYTES;

		nacl.verify = function(x, y) {
		  checkArrayTypes(x, y);
		  // Zero length arguments are considered not equal.
		  if (x.length === 0 || y.length === 0) return false;
		  if (x.length !== y.length) return false;
		  return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
		};

		nacl.setPRNG = function(fn) {
		  randombytes = fn;
		};

		(function() {
		  // Initialize PRNG if environment provides CSPRNG.
		  // If not, methods calling randombytes will throw.
		  var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
		  if (crypto && crypto.getRandomValues) {
		    // Browsers.
		    var QUOTA = 65536;
		    nacl.setPRNG(function(x, n) {
		      var i, v = new Uint8Array(n);
		      for (i = 0; i < n; i += QUOTA) {
		        crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
		      }
		      for (i = 0; i < n; i++) x[i] = v[i];
		      cleanup(v);
		    });
		  } else if (typeof commonjsRequire !== 'undefined') {
		    // Node.js.
		    crypto = require$$0;
		    if (crypto && crypto.randomBytes) {
		      nacl.setPRNG(function(x, n) {
		        var i, v = crypto.randomBytes(n);
		        for (i = 0; i < n; i++) x[i] = v[i];
		        cleanup(v);
		      });
		    }
		  }
		})();

		})(module.exports ? module.exports : (self.nacl = self.nacl || {})); 
	} (naclFast));
	return naclFast.exports;
}

var naclFastExports = requireNaclFast();

function getTransactionHashWithNonce(ins, skip, nonce) {
    const hash = createHash('sha256');
    hash.update(ins.programId.toBytes());
    ins.keys.forEach((account, index) => {
        if (index < skip) {
            return;
        }
        const metaByte1 = account.isSigner ? 0x01 : 0x00;
        const metaByte2 = account.isWritable ? 0x01 : 0x00;
        hash.update(new Uint8Array([metaByte1, metaByte2]));
        hash.update(account.pubkey.toBytes());
    });
    hash.update(ins.data);
    const nonceBuffer = Buffer.alloc(8);
    const nonceBig = nonce;
    nonceBuffer.writeBigUInt64BE(nonceBig);
    hash.update(nonceBuffer);
    return hash.digest();
}
function signHash32(hash, keypair) {
    if (hash.length !== 32) {
        throw new Error('Hash must be 32 bytes');
    }
    return naclFastExports.sign.detached(hash, keypair.secretKey);
}
const uint8ArrayAlterFirst = (data, replaceFirst) => {
    data.set(replaceFirst, 0);
};
function replaceWith(array, target, replacer, equalsFn) {
    const eq = equalsFn || ((a, b) => a === b);
    for (let i = 0; i < array.length; i++) {
        if (eq(array[i], target)) {
            array[i] = replacer;
        }
    }
}
function toVersionTransaction(tx, payer, recentBlockhash) {
    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: recentBlockhash,
        instructions: tx.instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
}

function assertTrue(bool, error) {
    if (!bool) {
        throw error;
    }
}
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
class NotSupportError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotSupportError";
    }
}

class ChainWalletClient {
    constructor(opt) {
        let network = DEFAULT_NET_WORK;
        if (opt?.network) {
            network = opt?.network;
        }
        let endpoint = getDefaultEndpoint(network);
        if (opt?.endpoint) {
            endpoint = opt.endpoint;
        }
        const connect = new Connection(endpoint);
        this.connect = connect;
        this.provider = new AnchorProvider(connect, dummyWallet, opt?.confirmOptions);
        switch (network) {
            case 'Devnet':
                this.walletProgram = new Program(devWalletIdl, this.provider);
                break;
            case "Testnet":
                throw new NotSupportError("not supported testnet");
            case "Mainnet":
                this.walletProgram = new Program(mainWalletIdl, this.provider);
                break;
        }
        const delayExecuteDiscriminator = this.walletProgram.coder.instruction.encode("delayExecute", []);
        this.delayExecuteDiscriminator = Uint8Array.from(delayExecuteDiscriminator);
        const executeDiscriminator = this.walletProgram.coder.instruction.encode("execute", []);
        this.executeDiscriminator = Uint8Array.from(executeDiscriminator);
    }
    async executorTxConvert(tx, wallet, executor) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let ins of instructions) {
            if (ins.keys.filter(d => d.pubkey.equals(wallet) && d.isSigner)) {
                const newKeys = ins.keys.map(k => {
                    if (k.pubkey.equals(wallet)) {
                        return {
                            ...k,
                            isSigner: false
                        };
                    }
                    return k;
                });
                const insNew = await this.walletProgram.methods
                    .execute(ins.data)
                    .accounts({
                    executor: executor,
                    custodyAccount: walletDataPubkey,
                    proxyProgram: ins.programId
                })
                    .remainingAccounts(newKeys).instruction();
                txNew.add(insNew);
            }
            else {
                txNew.add(ins);
            }
        }
        return txNew;
    }
    findWalletDataPubkeyByWallet(wallet) {
        const [walletDataPubkey, _] = PublicKey.findProgramAddressSync([Buffer.from(ACCOUNR_SEED), wallet.toBuffer()], this.walletProgram.programId);
        return walletDataPubkey;
    }
    async createWallet(name, user, threshold, executors, userAdmins) {
        const nonce = new Date().getTime();
        const nonceSeed = Buffer.alloc(8);
        nonceSeed.writeBigUInt64LE(BigInt(nonce));
        const [wallet, _] = PublicKey.findProgramAddressSync([Buffer.from("wallet"), nonceSeed], this.walletProgram.programId);
        const remainingAccounts = [];
        executors.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        userAdmins.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        const createIns = await this.walletProgram.methods.create({
            nonce: new BN(nonce),
            status: { normal: {} },
            threshold: threshold,
            executorNum: executors.length,
            userAdminsNum: userAdmins.length,
            enableAutoLock: true,
            name: name
        }).accounts({
            user: user,
            custodyAccount: this.findWalletDataPubkeyByWallet(wallet),
        }).remainingAccounts(remainingAccounts)
            .instruction();
        const createTx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: wallet,
            lamports: await this.connect.getMinimumBalanceForRentExemption(0, "processed")
        }), createIns);
        return createTx;
    }
    async managerExecuteTx(tx, wallet, manager, pubkeyAndHashs) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let [index, ins] of instructions.entries()) {
            if (pubkeyAndHashs.find(item => item.instructionIndex == index)) {
                const transactionInstructionSignature = pubkeyAndHashs.find(item => item.instructionIndex == index);
                const approvalParams = {
                    data: ins.data,
                    hashs: transactionInstructionSignature.signatures.map(item => Array.from(item.signature)),
                    nonce: new BN(transactionInstructionSignature.nonce),
                };
                let signatures = transactionInstructionSignature?.signatures;
                signatures?.reverse();
                signatures?.forEach(d => {
                    ins.keys.unshift({
                        pubkey: d.singer,
                        isSigner: false,
                        isWritable: true
                    });
                });
                const insNew = await this.walletProgram.methods
                    .approval(approvalParams)
                    .accounts({
                    user: manager,
                    custodyAccount: walletDataPubkey,
                    proxyProgram: this.walletProgram.programId,
                })
                    .remainingAccounts(ins.keys).instruction();
                txNew.add(insNew);
            }
            else {
                txNew.add(ins);
            }
        }
        return txNew;
    }
    async convertToMultiSigInstruction(instruction, wallet, nonce) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const approvalParams = {
            data: instruction.data,
            hashs: [],
            nonce: new BN(nonce),
        };
        const ins = await this.walletProgram.methods
            .approval(approvalParams)
            .accounts({
            user: wallet,
            custodyAccount: walletDataPubkey,
            proxyProgram: this.walletProgram.programId,
        })
            .remainingAccounts(instruction.keys).instruction();
        const hash = getTransactionHashWithNonce(ins, 0, BigInt(nonce));
        return {
            instruction: ins,
            hash: hash,
        };
    }
    async convertToMultiSigTx(tx, wallet, nonce) {
        const hashIndexes = [];
        for (let [index, instruction] of tx.instructions.entries()) {
            if (instruction.keys.find(item => item.pubkey.equals(wallet) && item.isSigner)) {
                const instructionWithHash = await this.convertToMultiSigInstruction(instruction, wallet, nonce);
                instruction = instructionWithHash.instruction;
                nonce++;
                hashIndexes.push({ hash: instructionWithHash.hash, transactionIndex: index });
            }
        }
        return {
            tx: tx,
            hashIndexes: hashIndexes,
        };
    }
    async managerExecutorDeleteInstruction(wallet, executorIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorDelete(executorIndexs)
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerExecutorAddInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorAdd({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerExecutorReplaceInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorChange({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerMangersDeleteInstruction(wallet, managerIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerDelete(managerIndexs)
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerMangersAddInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerAdd({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerMangersReplaceInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerChange({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerChangeThresholdInstruction(wallet, threshold) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .thresholdChange(threshold)
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerChangeStatusInstruction(wallet, status) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange({
            status: status
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    changeInstructionNotSign(ins, wallet) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        ins.keys = ins.keys.map(item => {
            const isExcluded = item.pubkey.equals(walletDataPubkey) || item.pubkey.equals(wallet);
            return ({
                isSigner: isExcluded ? false : item.isSigner,
                isWritable: item.isWritable,
                pubkey: item.pubkey
            });
        });
        return ins;
    }
    async managerRuleChangeInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleChange({ rules: rules })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerRuleAddInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleAdd({ rules: rules })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerRuleDeleteInstruction(wallet, ruleIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleDelete(ruleIndexs)
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async delayExecuteVersionTransaction(transaction, newExecutor) {
        const transactionAfter = await this.delayExecuteTransaction(transaction, newExecutor);
        const repo = await this.connect.getLatestBlockhash();
        return toVersionTransaction(transactionAfter, newExecutor, repo.blockhash);
    }
    async delayExecuteTransaction(transaction, newExecutor) {
        for (let instruction of transaction.instructions) {
            if (instruction.programId.toString() == this.walletProgram.programId.toString() &&
                instruction.data.subarray(0, 8).equals(Buffer.from(this.executeDiscriminator))) {
                uint8ArrayAlterFirst(instruction.data, this.delayExecuteDiscriminator);
                instruction.keys[0].pubkey = newExecutor;
            }
        }
        return transaction;
    }
    async decodeVersionTransactionMultiSig(versionedTransaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        // If have look table. get look table
        const publicKeys = versionedTransaction.message.staticAccountKeys;
        const compiledInstructions = versionedTransaction.message.compiledInstructions;
        assertTrue(compiledInstructions.length !== 0, new ValidationError("No multi sig instruction found."));
        for (let addressTableLookup of versionedTransaction.message.addressTableLookups) {
            const res = await this.connect.getAddressLookupTable(addressTableLookup.accountKey);
            if (res.value?.state.addresses) {
                publicKeys.push(...res.value?.state.addresses);
            }
        }
        let nonceInsNum = 0n;
        // check had approval
        for (const [i, mci] of compiledInstructions.entries()) {
            const ixData = Buffer.from(mci.data);
            const programId = publicKeys[mci.programIdIndex];
            const instructionForSigning = new TransactionInstruction({
                programId: programId,
                data: Buffer.from(mci.data),
                keys: mci.accountKeyIndexes.map((i) => ({
                    pubkey: publicKeys[i],
                    isSigner: versionedTransaction.message.isAccountSigner(i),
                    isWritable: versionedTransaction.message.isAccountWritable(i),
                })),
            });
            if (ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))) {
                const hashBuffer = getTransactionHashWithNonce(instructionForSigning, 0, nonce + nonceInsNum);
                proposalTransactionInstructions.push({
                    hash: hashBuffer,
                    instructionIndex: i,
                    nonce: nonceInsNum
                });
                nonceInsNum += 1n;
            }
        }
        return proposalTransactionInstructions;
    }
    async decodeTransactionMultiSig(transaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        let nonceInsNum = nonce;
        for (const [i, instructionForSigning] of transaction.instructions.entries()) {
            const ixData = Buffer.from(instructionForSigning.data);
            if (ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))) {
                const hashBuffer = getTransactionHashWithNonce(instructionForSigning, 0, nonceInsNum);
                proposalTransactionInstructions.push({
                    hash: hashBuffer,
                    instructionIndex: i,
                    nonce: nonceInsNum
                });
                nonceInsNum += 1n;
            }
        }
        return proposalTransactionInstructions;
    }
}
const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
};

export { ACCOUNR_SEED, ChainWalletClient, DEFAULT_NET_WORK, NotSupportError, ValidationError, assertTrue, getDefaultEndpoint, getTransactionHashWithNonce, replaceWith, signHash32, toVersionTransaction, uint8ArrayAlterFirst };
//# sourceMappingURL=index.js.map
