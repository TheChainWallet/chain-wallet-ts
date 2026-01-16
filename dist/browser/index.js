import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { TransactionMessage, VersionedTransaction, PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';

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
const ACCOUNT_SEED = "account";
const INSTRUCTION_DATA_SEED = "ins";

var address$1 = "EY97THtfbhmcHDD7b5h8GgVvD6vk3eHUXEPUwaBUDqwG";
var metadata$1 = {
	name: "chain_wallet",
	version: "0.1.0",
	spec: "0.1.0",
	description: "Created with Anchor"
};
var instructions$1 = [
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
		name: "delay_change",
		discriminator: [
			198,
			149,
			223,
			233,
			250,
			43,
			226,
			8
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "delay",
				type: "u32"
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
		name: "meta_execute",
		discriminator: [
			2,
			147,
			81,
			115,
			138,
			37,
			87,
			10
		],
		accounts: [
			{
				name: "executor",
				writable: true,
				signer: true
			},
			{
				name: "singer",
				writable: true
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
						name: "MeataTransactionParams"
					}
				}
			}
		]
	},
	{
		name: "multisig_approval_reject",
		discriminator: [
			90,
			195,
			190,
			172,
			130,
			104,
			111,
			111
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								99,
								99,
								111,
								117,
								110,
								116
							]
						},
						{
							kind: "account",
							path: "wallet"
						}
					]
				}
			},
			{
				name: "wallet",
				writable: true
			},
			{
				name: "instruction_data",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								105,
								110,
								115
							]
						},
						{
							kind: "arg",
							path: "params.nonce"
						},
						{
							kind: "account",
							path: "wallet"
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
						name: "MultisigApprovalRejectParams"
					}
				}
			}
		]
	},
	{
		name: "multisig_execute",
		discriminator: [
			151,
			179,
			145,
			71,
			190,
			96,
			47,
			69
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								99,
								99,
								111,
								117,
								110,
								116
							]
						},
						{
							kind: "account",
							path: "wallet"
						}
					]
				}
			},
			{
				name: "wallet",
				writable: true
			},
			{
				name: "instruction_data",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								105,
								110,
								115
							]
						},
						{
							kind: "arg",
							path: "params.nonce"
						},
						{
							kind: "account",
							path: "wallet"
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
						name: "MultisigExecuteParams"
					}
				}
			}
		]
	},
	{
		name: "multisig_push",
		discriminator: [
			80,
			28,
			43,
			103,
			4,
			156,
			181,
			160
		],
		accounts: [
			{
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "custody_account",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								97,
								99,
								99,
								111,
								117,
								110,
								116
							]
						},
						{
							kind: "account",
							path: "wallet"
						}
					]
				}
			},
			{
				name: "wallet",
				writable: true
			},
			{
				name: "instruction_data",
				writable: true,
				pda: {
					seeds: [
						{
							kind: "const",
							value: [
								105,
								110,
								115
							]
						},
						{
							kind: "account",
							path: "custody_account.approval_nonce",
							account: "CustodyAccount"
						},
						{
							kind: "account",
							path: "wallet"
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
						name: "MultisigPushParams"
					}
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
				name: "user",
				writable: true,
				signer: true
			},
			{
				name: "wallet",
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
		name: "InstructionData",
		discriminator: [
			52,
			213,
			60,
			56,
			65,
			216,
			49,
			38
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
		name: "ChangeDelayEvent",
		discriminator: [
			230,
			170,
			228,
			141,
			253,
			224,
			220,
			117
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
		name: "MultisigApprovalEvent",
		discriminator: [
			196,
			40,
			19,
			192,
			67,
			70,
			183,
			142
		]
	},
	{
		name: "MultisigExecuteSuccessEvent",
		discriminator: [
			26,
			229,
			172,
			210,
			230,
			81,
			83,
			75
		]
	},
	{
		name: "MultisigPushEvent",
		discriminator: [
			230,
			48,
			123,
			159,
			219,
			200,
			196,
			193
		]
	},
	{
		name: "MultisigRejectEvent",
		discriminator: [
			142,
			70,
			61,
			120,
			69,
			115,
			174,
			235
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
	},
	{
		code: 6015,
		name: "NotReachExecuteTime",
		msg: "Not reach execute time"
	},
	{
		code: 6016,
		name: "TransactionCheckFail",
		msg: "Transaction check fail"
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
		name: "ApprovalReject",
		type: {
			kind: "enum",
			variants: [
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
		name: "ChangeDelayEvent",
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
					name: "delay",
					type: "u32"
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
					type: "u64"
				},
				{
					name: "meta_transactions",
					type: {
						vec: {
							defined: {
								name: "MetaTaransaction"
							}
						}
					}
				},
				{
					name: "meta_transaction_max_duration",
					type: "u32"
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
					name: "delay_seconds",
					type: "u32"
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
		name: "InstructionData",
		type: {
			kind: "struct",
			fields: [
				{
					name: "ins_hash",
					type: {
						array: [
							"u8",
							32
						]
					}
				},
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "approvers",
					type: {
						vec: "pubkey"
					}
				},
				{
					name: "rejects",
					type: {
						vec: "pubkey"
					}
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
		name: "MeataTransactionParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "hash_sign",
					type: {
						array: [
							"u8",
							64
						]
					}
				},
				{
					name: "sign_timestamp",
					type: "u64"
				},
				{
					name: "data",
					type: "bytes"
				}
			]
		}
	},
	{
		name: "MetaTaransaction",
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
				},
				{
					name: "timestamp",
					type: "u64"
				}
			]
		}
	},
	{
		name: "MultisigApprovalEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "user",
					type: "pubkey"
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
		name: "MultisigApprovalRejectParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "nonce",
					type: "u64"
				},
				{
					name: "approval_reject",
					type: {
						defined: {
							name: "ApprovalReject"
						}
					}
				}
			]
		}
	},
	{
		name: "MultisigExecuteParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "data",
					type: "bytes"
				},
				{
					name: "nonce",
					type: "u64"
				}
			]
		}
	},
	{
		name: "MultisigExecuteSuccessEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "user",
					type: "pubkey"
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
		name: "MultisigPushEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "user",
					type: "pubkey"
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
		name: "MultisigPushParams",
		type: {
			kind: "struct",
			fields: [
				{
					name: "data",
					type: "bytes"
				}
			]
		}
	},
	{
		name: "MultisigRejectEvent",
		type: {
			kind: "struct",
			fields: [
				{
					name: "wallet",
					type: "pubkey"
				},
				{
					name: "user",
					type: "pubkey"
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
					name: "amount",
					type: "u64"
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

/**
 * Generate a SHA-256 hash of a TransactionInstruction for multisig signing.
 *
 * This function computes a deterministic hash of a `TransactionInstruction`
 * by concatenating the following elements in order:
 * 1. Program ID (`programId.toBytes()`)
 * 2. Account metas (isSigner, isWritable flags + pubkey)
 *    - Optionally skip the first `skip` accounts
 * 3. Instruction data (`ins.data`)
 * 4. Nonce (8-byte big-endian representation)
 *
 * The resulting hash can be signed off-chain by wallet managers or executors
 * as part of a multisig workflow.
 *
 * ## Notes
 *
 * - `skip` allows ignoring the first N accounts in the instruction when hashing.
 * - The `nonce` ensures each instruction has a unique hash for multisig.
 * - The function works both in browser (Web Crypto API) and Node.js (crypto module).
 * - The hash is always a 32-byte SHA-256 digest returned as `Uint8Array`.
 *
 * @param ins - The `TransactionInstruction` to hash
 * @param skip - Number of leading accounts to skip in the hash computation
 * @param nonce - A unique nonce to include in the hash (8-byte big-endian)
 *
 * @returns A 32-byte SHA-256 hash of the instruction + nonce as `Uint8Array`
 *
 * @example
 * ```ts
 * const instruction: TransactionInstruction = ...;
 * const nonce = 123n;
 * const hash = await getTransactionHashWithNonce(instruction, 0, nonce);
 *
 * // Now hash can be signed off-chain by wallet managers for multisig approval
 * const signature = manager.signMessage(hash);
 * ```
 */
async function getTransactionHashWithNonce(ins, skip, nonce) {
    const chunks = [];
    // programId
    chunks.push(ins.programId.toBytes());
    // account metas
    ins.keys.forEach((account, index) => {
        if (index < skip)
            return;
        // // is_signer (1 byte)
        // chunks.push(Uint8Array.of(account.isSigner ? 0x01 : 0x00))
        // // is_writable (1 byte)
        // chunks.push(Uint8Array.of(account.isWritable ? 0x01 : 0x00))
        chunks.push(account.pubkey.toBytes());
    });
    // instruction data
    chunks.push(ins.data);
    // nonce (8-byte BE)
    const nonceBuf = new Uint8Array(8);
    const view = new DataView(nonceBuf.buffer);
    view.setBigUint64(0, nonce, false); // false = big-endian
    chunks.push(nonceBuf);
    // concat all
    const totalLen = chunks.reduce((s, x) => s + x.length, 0);
    const all = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
    }
    // hash (browser or Node)
    let digest;
    if (typeof crypto !== "undefined" && crypto.subtle) {
        // Browser
        digest = await crypto.subtle.digest("SHA-256", all);
        return new Uint8Array(digest);
    }
    else {
        // Node fallback
        const { createHash } = await import('crypto');
        const hash = createHash("sha256").update(Buffer.from(all)).digest();
        return new Uint8Array(hash);
    }
}
/**
 * Generate the hash for a meta-transaction.
 *
 * This hash **must be signed off-chain** by the signer (`singer`)
 * and later passed into {@link metaInstruction}.
 *
 * The hash includes:
 * - instruction data
 * - executor address
 * - nonce / skip value
 * - expiration timestamp
 *
 * ### Security
 * - Prevents replay attacks
 * - Binds the signature to a specific executor and time window
 *
 * @param ins - Original instruction to be executed via meta-transaction
 * @param skip - Nonce or sequence value to prevent duplicate execution
 * @param executor - Account that will submit the transaction on-chain
 * @param timestamp - Expiration timestamp (unix seconds)
 *
 * @returns Hash bytes that should be signed by the signer
 */
async function getMetaTransactionHash(ins, skip, executor, expireAt) {
    const chunks = [];
    // programId
    chunks.push(ins.programId.toBytes());
    // executor
    chunks.push(executor.toBytes());
    // account metas
    ins.keys.forEach((account, index) => {
        if (index < skip)
            return;
        const meta = new Uint8Array([
            account.isSigner ? 1 : 0,
            account.isWritable ? 1 : 0,
        ]);
        chunks.push(meta);
        chunks.push(account.pubkey.toBytes());
    });
    // instruction data
    chunks.push(ins.data);
    // timestamp (8-byte BE)
    const timestampBuf = new Uint8Array(8);
    const view = new DataView(timestampBuf.buffer);
    view.setBigUint64(0, expireAt, false); // false = big-endian
    chunks.push(timestampBuf);
    // concat all
    const totalLen = chunks.reduce((s, x) => s + x.length, 0);
    const all = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
    }
    // hash (browser or Node)
    let digest;
    if (typeof crypto !== "undefined" && crypto.subtle) {
        // Browser
        digest = await crypto.subtle.digest("SHA-256", all);
    }
    else {
        // Node fallback
        const { createHash } = await import('crypto');
        const hash = createHash("sha256").update(Buffer.from(all)).digest();
        return new Uint8Array(hash);
    }
    return new Uint8Array(digest);
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
        this.walletProgram.coder.instruction.encode("multisigPush", []);
        this.multisigPushDiscriminator = Uint8Array.from(executeDiscriminator);
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
        const seedBytes = new TextEncoder().encode(ACCOUNT_SEED);
        const [walletDataPubkey, _] = PublicKey.findProgramAddressSync([seedBytes, wallet.toBytes()], this.walletProgram.programId);
        return walletDataPubkey;
    }
    /**
     * Create a new on-chain wallet.
     *
     * This method builds a transaction that:
     * - derives a new wallet PDA using a timestamp-based nonce
     * - transfers rent-exempt lamports to the wallet account
     * - initializes wallet configuration such as threshold, executors, and admins
     *
     * ## Wallet Address Derivation
     *
     * The wallet address is derived as a Program Derived Address (PDA) using:
     * - a static seed: `"wallet"`
     * - a nonce generated from the current timestamp
     *
     * ## Notes
     * - The returned transaction is **not signed**
     * - The caller is responsible for signing and sending the transaction
     *
     * @param name - Human-readable wallet name
     * @param user - Wallet creator and initial owner
     * @param threshold - Number of required approvals to execute a transaction
     * @param executors - Accounts allowed to execute transactions
     * @param userAdmins - Accounts with administrative permissions
     *
     * @param nonce
     * @returns A `Transaction` that creates and initializes the wallet
     *
     * @example
     * ```ts
     * const tx = await walletClient.createWallet(
     *   "My Wallet",
     *   user.publicKey,
     *   2,
     *   [executor1.publicKey, executor2.publicKey],
     *   [admin.publicKey],
     * );
     *
     * await sendAndConfirmTransaction(connection, tx, [user]);
     * ```
     */
    async createWallet(name, user, threshold, executors, userAdmins, nonce) {
        if (!nonce) {
            nonce = new Date().getTime();
        }
        const nonceSeed = new Uint8Array(8);
        const view = new DataView(nonceSeed.buffer);
        view.setBigUint64(0, BigInt(nonce), true); // true = little-endian
        const walletSeed = new TextEncoder().encode("wallet");
        const [wallet, _] = PublicKey.findProgramAddressSync([walletSeed, nonceSeed], this.walletProgram.programId);
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
    getInstructionDataWithNonceWallet(nonce, wallet) {
        const nonceSeed = new Uint8Array(8);
        const view = new DataView(nonceSeed.buffer);
        view.setBigUint64(0, BigInt(nonce), true); // true = little-endian
        const [instructionDataAccount, _] = PublicKey.findProgramAddressSync([
            Buffer.from(INSTRUCTION_DATA_SEED),
            nonceSeed,
            wallet.toBytes()
        ], this.walletProgram.programId);
        return instructionDataAccount;
    }
    /**
     * Push a transaction instruction into the multisig flow.
     *
     * This method pushes the provided transaction instruction into the multisig flow.
     * It creates a multisig instruction that can later be approved or rejected by the wallet managers.
     *
     * ## Example
     * ```ts
     * const multisigPushIns = await walletClient.multisigPushInstruction(
     *   deleteInstruction,
     *   walletPublicKey,
     *   managerPublicKey
     * );
     * ```
     *
     * @param ins - The `TransactionInstruction` to push into the multisig flow
     * @param wallet - Public key of the wallet (manager) performing the operation
     * @param manager - Public key of the manager executing the operation
     *
     * @param nonce
     * @returns A `TransactionInstruction` that pushes the transaction into the multisig flow
     */
    async multisigPushInstruction(ins, wallet, manager, nonce) {
        const custodyAccountPubkey = this.findWalletDataPubkeyByWallet(wallet);
        if (nonce === undefined || nonce === null) {
            const custody = await this.walletProgram.account.custodyAccount.fetch(custodyAccountPubkey);
            nonce = custody.approvalNonce.toNumber();
        }
        const instructionDataPubkey = this.getInstructionDataWithNonceWallet(nonce, wallet);
        for (const [index, insKey] of ins.keys.entries()) {
            if (insKey.pubkey.toString() == wallet.toString()) {
                ins.keys[index].isSigner = false;
            }
            if (insKey.pubkey.toString() == custodyAccountPubkey.toString()) {
                ins.keys[index].isSigner = false;
            }
        }
        return await this.walletProgram.methods
            .multisigPush({
            data: ins.data
        })
            .accounts({
            user: manager,
            wallet: wallet,
            proxyProgram: ins.programId,
            //@ts-ignore
            instructionData: instructionDataPubkey
        })
            .remainingAccounts(ins.keys)
            .instruction();
    }
    /**
     * Approve or reject a transaction instruction in the multisig flow.
     *
     * This method allows the manager to approve or reject a multisig transaction.
     * It requires the `instructionNonce` to ensure the uniqueness of the transaction.
     *
     * ## Example
     * ```ts
     * await walletClient.multisigApprovalRejectInstruction(
     *   instructionNonce,
     *   walletPublicKey,
     *   managerPublicKey,
     *   'approve'
     * );
     * ```
     *
     * @param instructionNonce - A unique nonce to maintain the transaction's uniqueness
     * @param wallet - Public key of the wallet (manager) performing the approval or rejection
     * @param manager - Public key of the manager approving or rejecting the transaction
     * @param approvalOrReject - The approval or rejection status ('approve' or 'reject')
     *
     * @returns A `TransactionInstruction` that approves or rejects the transaction
     */
    async multisigApprovalRejectInstruction(instructionNonce, wallet, manager, approvalOrReject) {
        await this.walletProgram.methods
            .multisigApprovalReject({
            nonce: new BN(instructionNonce),
            approvalReject: approvalOrReject == "approve" ? { approval: {} } : { reject: {} }
        })
            .accounts({
            user: manager,
            wallet: wallet,
        })
            .instruction();
    }
    /**
     * Execute a multisig transaction instruction.
     *
     * This method executes a previously approved multisig transaction instruction.
     * It requires the `instructionNonce` and the transaction data to finalize and submit the transaction on-chain.
     *
     * ## Example
     * ```ts
     * await walletClient.multisigExecuteInstruction(
     *   deleteInstruction,
     *   instructionNonce,
     *   walletPublicKey,
     *   managerPublicKey
     * );
     * ```
     *
     * @param ins - The `TransactionInstruction` to execute in the multisig flow
     * @param instructionNonce - A unique nonce to maintain the transaction's uniqueness
     * @param wallet - Public key of the wallet (manager) performing the operation
     * @param manager - Public key of the manager executing the operation
     *
     * @returns A `TransactionInstruction` that executes the transaction on-chain
     */
    async multisigExecuteInstruction(ins, instructionNonce, wallet, manager) {
        if (ins.programId.toString() == this.walletProgram.programId.toString()) {
            ins.keys[0].pubkey = manager;
        }
        const custodyAccountPubkey = this.findWalletDataPubkeyByWallet(wallet);
        for (const [index, insKey] of ins.keys.entries()) {
            if (insKey.pubkey.toString() == wallet.toString()) {
                ins.keys[index].isSigner = false;
            }
            if (insKey.pubkey.toString() == custodyAccountPubkey.toString()) {
                ins.keys[index].isSigner = false;
            }
        }
        return await this.walletProgram.methods
            .multisigExecute({
            data: ins.data,
            nonce: new BN(instructionNonce),
        })
            .accounts({
            user: manager,
            wallet: wallet,
            proxyProgram: ins.programId
        })
            .remainingAccounts(ins.keys)
            .instruction();
    }
    /**
     * Delete executors from the wallet using multisig flow.
     *
     * This method follows the multisig flow to delete one or more executors from the wallet.
     * The process includes:
     * 1. Generating the delete executor instruction using `managerExecutorDeleteInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     * * ## Example
     * The process to delete executors with multisig approval:
     *      * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorIndexes = [0, 2];  // The indexes of the executors to delete
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     * // 2. Generate the delete executor instruction
     * const deleteIns = await walletClient.managerExecutorDeleteInstruction(walletPublicKey, executorIndexes);
     * // 3. Push the delete instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(deleteIns, walletPublicKey, managerPublicKey);
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(deleteIns, instructionNonce, walletPublicKey, managerPublicKey);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * @param wallet - Public key of the wallet (manager) performing the deletion
     * @param executorIndexs - Array of indexes of executors to remove
     * @param instructionNonce - Nonce for the instruction to maintain uniqueness in multisig flow
     * @param manager - Public key of the wallet manager
     * @param approvalOrReject - Approval or rejection status for the transaction
     *
     * @returns A promise that resolves when the deletion process is complete
     */
    async managerExecutorDeleteInstruction(wallet, executorIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorDelete(executorIndexs)
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Add executors to the wallet using multisig flow.
     *
     * This method follows the multisig flow to add one or more executors to the wallet.
     * The process includes:
     * 1. Generating the add executor instruction using `managerExecutorAddInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     *
     * ## Example
     * The process to add executors with multisig approval:
     *
     * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorPublicKeys = [
     *   new PublicKey('...'),  // Public key of the first executor
     *   new PublicKey('...')   // Public key of the second executor
     * ];
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     *
     * // 2. Generate the add executor instruction
     * const addIns = await walletClient.managerExecutorAddInstruction(walletPublicKey, executorPublicKeys);
     *
     * // 3. Push the add instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(addIns, walletPublicKey, managerPublicKey);
     *
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     *
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(addIns, instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * ## Notes
     * - The `walletPublicKey` is the public key of the wallet (manager) performing the addition.
     * - `executorPublicKeys` is an array of public keys of the executors to add.
     * - `instructionNonce` is a unique identifier to maintain the transaction's uniqueness and avoid replay attacks.
     * - `managerPublicKey` is the public key of the wallet manager who will approve or reject the transaction.
     * - `approvalOrReject` indicates whether the transaction should be approved or rejected.
     *
     * @param wallet - Public key of the wallet (manager) performing the addition
     * @param executorPublicKeys - Array of public keys of executors to add
     *
     * @returns A promise that resolves with a `TransactionInstruction` to add the specified executors (unsigned)
     */
    async managerExecutorAddInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorAdd({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Replace executors in the wallet using multisig flow.
     *
     * This method follows the multisig flow to replace one or more executors in the wallet.
     * The process includes:
     * 1. Generating the replace executor instruction using `managerExecutorReplaceInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     *
     * ## Example
     * The process to replace executors with multisig approval:
     *
     * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorPublicKeys = [
     *   new PublicKey('...'),  // Public key of the first new executor
     *   new PublicKey('...')   // Public key of the second new executor
     * ];
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     *
     * // 2. Generate the replace executor instruction
     * const replaceIns = await walletClient.managerExecutorReplaceInstruction(walletPublicKey, executorPublicKeys);
     *
     * // 3. Push the replace instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(replaceIns, walletPublicKey, managerPublicKey);
     *
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     *
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(replaceIns, instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * ## Notes
     * - The `walletPublicKey` is the public key of the wallet (manager) performing the replacement.
     * - `executorPublicKeys` is an array of public keys of the new executors to replace the old ones.
     * - `instructionNonce` is a unique identifier to maintain the transaction's uniqueness and avoid replay attacks.
     * - `managerPublicKey` is the public key of the wallet manager who will approve or reject the transaction.
     * - `approvalOrReject` indicates whether the transaction should be approved or rejected.
     *
     * @param wallet - Public key of the wallet (manager) performing the replacement
     * @param executorPublicKeys - Array of public keys of new executors to add
     *
     * @returns A promise that resolves with a `TransactionInstruction` to replace the specified executors (unsigned)
     */
    async managerExecutorReplaceInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorChange({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to delete one or more wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to remove specified managers from the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the delete manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for the existing managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing wallet managers can remove other managers.
     * - The `managerIndexs` correspond to the indexes of managers in the wallet's manager list.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the deletion
     * @param managerIndexs - Array of indexes of managers to remove
     *
     * @returns A `TransactionInstruction` to delete the specified managers (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the delete manager instruction
     * const deleteIns = await walletClient.managerMangersDeleteInstruction(
     *   walletPublicKey,
     *   [0, 2] // remove first and third manager
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(deleteIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerMangersDeleteInstruction(wallet, managerIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerDelete(managerIndexs)
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to add one or more wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to add new managers to the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the add manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for existing managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing wallet managers can add new managers.
     * - The instruction includes the new manager public keys in `remainingAccounts`.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the addition
     * @param managerPublicKeys - Array of new manager public keys to add
     *
     * @returns A `TransactionInstruction` to add the specified managers (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the add manager instruction
     * const addIns = await walletClient.managerMangersAddInstruction(
     *   walletPublicKey,
     *   [manager1.publicKey, manager2.publicKey]
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(addIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: existingManager1.publicKey, signature: existingManager1.signMessage(h.hash) },
     *     { signer: existingManager2.publicKey, signature: existingManager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerMangersAddInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerAdd({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to replace wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to replace the current manager list with the specified new managers.
     * The instruction is returned **not signed** and must be processed
     * through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the replace manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce the final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing managers can replace the manager list.
     * - The new managers are included in `remainingAccounts`.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the replacement
     * @param managerPublicKeys - Array of new manager public keys
     *
     * @returns A `TransactionInstruction` to replace managers (unsigned)
     *
     * @example
     * ```ts
     * const replaceIns = await walletClient.managerMangersReplaceInstruction(
     *   walletPublicKey,
     *   [manager1.publicKey, manager2.publicKey]
     * );
     *
     * const tx = new Transaction().add(replaceIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: existingManager1.publicKey, signature: existingManager1.signMessage(h.hash) },
     *     { signer: existingManager2.publicKey, signature: existingManager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerMangersReplaceInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerChange({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to change wallet multisig threshold (multisig flow).
     *
     * This method creates a `TransactionInstruction` for changing the wallet's
     * approval threshold. The instruction is returned **not signed** and must
     * be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the threshold change instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can change the threshold.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the change
     * @param threshold - New threshold value for approvals
     *
     * @returns A `TransactionInstruction` to change the threshold (unsigned)
     *
     * @example
     * ```ts
     * const thresholdIns = await walletClient.managerChangeThresholdInstruction(walletPublicKey, 2);
     * const tx = new Transaction().add(thresholdIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerChangeThresholdInstruction(wallet, threshold) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .thresholdChange(threshold)
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to change wallet account status (multisig flow).
     *
     * This method creates a `TransactionInstruction` for changing the wallet's
     * status (e.g., normal, frozen). The instruction is returned **not signed**
     * and must be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the status change instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can change the account status.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the status change
     * @param status - New account status
     *
     * @returns A `TransactionInstruction` to change the wallet status (unsigned)
     *
     * @example
     * ```ts
     * const statusIns = await walletClient.managerChangeStatusInstruction(walletPublicKey, { normal: {} });
     * const tx = new Transaction().add(statusIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerChangeStatusInstruction(wallet, status) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange({
            status: status
        })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Mark the wallet-related keys in a TransactionInstruction as unsigned.
     *
     * This method is used internally to modify a `TransactionInstruction` so that
     * the wallet's own keys (`wallet` and `walletDataPubkey`) are temporarily
     * marked with `isSigner = false`. This is necessary for the multisig flow,
     * allowing the instruction to be sent to the chain without requiring the
     * wallet's on-chain signature at this stage.
     *
     * The on-chain wallet program will internally restore the signer flags
     * (`isSigner = true`) when the transaction is executed.
     *
     * ## Notes
     *
     * - This is an internal helper; external callers normally do not need to call it.
     * - Ensures the instruction passes client-side validation before multi-signature execution.
     * - Only affects keys corresponding to the wallet and wallet data account.
     *
     * @param ins - The `TransactionInstruction` to modify
     * @param wallet - Public key of the wallet
     *
     * @returns The same `TransactionInstruction` with wallet-related keys marked as not signed
     *
     * @example
     * ```ts
     * const ins = await walletClient.managerExecutorDeleteInstruction(walletPublicKey, [0]);
     * const modifiedIns = walletClient.changeInstructionNotSign(ins, walletPublicKey);
     *
     * // Now `modifiedIns` can be included in a multisig transaction without requiring
     * // the wallet's on-chain signature immediately.
     * ```
     */
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
    /**
     * Generate a transaction instruction to replace wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to replace the wallet's
     * current rules with the specified new rules. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the replace rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce the final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can replace rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the rule change
     * @param rules - Array of new rules to replace
     *
     * @returns A `TransactionInstruction` to replace wallet rules (unsigned)
     *
     * @example
     * ```ts
     * const changeIns = await walletClient.managerRuleChangeInstruction(walletPublicKey, newRules);
     * const tx = new Transaction().add(changeIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerRuleChangeInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleChange({ rules: rules })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to add new wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to append new rules to
     * the wallet. The instruction is returned **not signed** and must be
     * processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the add rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can add rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the addition
     * @param rules - Array of new rules to add
     *
     * @returns A `TransactionInstruction` to add rules (unsigned)
     *
     * @example
     * ```ts
     * const addIns = await walletClient.managerRuleAddInstruction(walletPublicKey, newRules);
     * const tx = new Transaction().add(addIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerRuleAddInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleAdd({ rules: rules })
            .accounts({
            user: wallet,
            wallet: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    /**
     * Generate a transaction instruction to delete wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to remove rules by their
     * indexes from the wallet. The instruction is returned **not signed** and
     * must be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the delete rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can delete rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the deletion
     * @param ruleIndexs - Array of rule indexes to delete
     *
     * @returns A `TransactionInstruction` to delete rules (unsigned)
     *
     * @example
     * ```ts
     * const deleteIns = await walletClient.managerRuleDeleteInstruction(walletPublicKey, [0, 2]);
     * const tx = new Transaction().add(deleteIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    async managerRuleDeleteInstruction(wallet, ruleIndexs) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleDelete(ruleIndexs)
            .accounts({
            user: wallet,
            wallet: wallet,
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
    /**
     * Transform a delayed wallet transaction to be executed by a new executor.
     *
     * When the wallet has "delayed execution" enabled, all transactions are
     * stored as delayed transactions. This method modifies a delayed transaction
     * so that it can be executed by a different executor.
     *
     * Specifically, this method:
     * 1. Scans all instructions in the transaction.
     * 2. Checks if the instruction belongs to the wallet program and matches
     *    the normal execution discriminator.
     * 3. Replaces the first 8 bytes (discriminator) with the delayed execution discriminator.
     * 4. Updates the first key (executor) to `newExecutor`.
     *
     * ## Usage Scenario
     *
     * 1. Backend fetches the delayed transaction from storage.
     * 2. Call this method to set the desired executor for the transaction.
     * 3. The modified transaction can then be sent on-chain by the new executor.
     *
     * ## Notes
     *
     * - Only transactions that match the wallet program and the normal execute discriminator
     *   are modified.
     * - This method does not sign the transaction; signing must be done separately.
     * - It is intended for backend or relayer logic where delayed transactions
     *   are executed on behalf of the original creator.
     *
     * @param transaction - The delayed transaction to modify
     * @param newExecutor - Public key of the executor who will perform the transaction
     *
     * @returns The modified transaction, ready to be signed and sent by the new executor
     *
     * @example
     * ```ts
     * // 1. Fetch the delayed transaction from backend storage
     * const delayedTx = await backend.getDelayedTransaction(txId);
     *
     * // 2. Assign a new executor
     * const txForExecutor = await walletClient.delayExecuteTransaction(delayedTx, newExecutorPublicKey);
     *
     * // 3. Sign and send
     * await sendAndConfirmTransaction(connection, txForExecutor, [newExecutorKeypair]);
     * ```
     */
    async delayExecuteTransaction(transaction, newExecutor) {
        for (let instruction of transaction.instructions) {
            const slice = instruction.data.subarray(0, 8);
            if (instruction.programId.toString() == this.walletProgram.programId.toString() &&
                slice.every((b, i) => b === this.executeDiscriminator.charCodeAt(i))) {
                uint8ArrayAlterFirst(instruction.data, this.delayExecuteDiscriminator);
                instruction.keys[0].pubkey = newExecutor;
            }
        }
        return transaction;
    }
    /**
     * Build a meta-transaction instruction.
     *
     * This method executes a **pre-signed instruction** using a meta-transaction model:
     * the signer authorizes execution off-chain, while the executor submits the
     * transaction on-chain and pays the gas fee.
     *
     * ## Usage Flow
     *
     * 1. Call {@link getMetaTransactionHash} to generate the signing hash
     * 2. The `singer` signs the returned hash off-chain
     * 3. Call this method with the signature to build the on-chain instruction
     *
     * The program will verify:
     * - signature validity
     * - signer identity
     * - expiration timestamp
     *
     * @param ins - Original instruction to be executed
     * @param wallet - Wallet public key that owns the custody account
     * @param singer - Signer who authorized the meta-transaction off-chain
     * @param expireAt - Expiration timestamp (unix seconds)
     * @param signature - Signature produced by signing the meta-transaction hash
     * @param executor - Account that submits the transaction and pays gas
     *
     * @returns A `TransactionInstruction` ready to be sent on-chain
     * @example
     * ```ts
     * // 1. Prepare original instruction
     * const ins = program.methods
     *   .doSomething(...)
     *   .accounts(...)
     *   .instruction();
     *
     * // 2. Generate meta-transaction hash
     * const expireAt = BigInt(Math.floor(Date.now()  / 1000) + 60);
     * const skip = 0;
     *
     * const hash = await getMetaTransactionHash(
     *   ins,
     *   skip,
     *   executor.publicKey,
     *   expireAt,
     * );
     *
     * // 3. Sign hash off-chain
     * const signature = signerKeypair.signMessage(hash);
     *
     * // 4. Build meta instruction
     * const metaIx = await walletClient.metaInstruction(
     *   ins,
     *   walletPublicKey,
     *   signerKeypair.publicKey,
     *   expireAt,
     *   signature,
     *   executor.publicKey,
     * );
     *
     * // 5. Executor sends transaction
     * const tx = new Transaction().add(metaIx);
     * await sendAndConfirmTransaction(connection, tx, [executor]);
     * ```
     */
    async metaInstruction(ins, wallet, singer, expireAt, signature, executor) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const instruction = await this.walletProgram.methods.metaExecute({
            hashSign: Array.from(signature),
            signTimestamp: new BN(expireAt),
            data: ins.data
        })
            .accounts({
            executor: executor,
            singer: singer,
            custodyAccount: walletDataPubkey,
            proxyProgram: ins.programId
        }).remainingAccounts(ins.keys).instruction();
        return instruction;
    }
    async decodeTransactionMultiSig(transaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        let nonceInsNum = nonce;
        for (const [i, instructionForSigning] of transaction.instructions.entries()) {
            const ixData = instructionForSigning.data;
            const head8 = ixData.subarray(0, 8);
            if (ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))) {
                let proposalType = "MULITSIG";
                if (head8.equals(this.executeDiscriminator)) {
                    proposalType = "RISK_MULITSIG";
                }
                proposalTransactionInstructions.push({
                    instructionIndex: i,
                    nonce: nonceInsNum,
                    proposalType: proposalType
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

export { ACCOUNT_SEED, ChainWalletClient, DEFAULT_NET_WORK, INSTRUCTION_DATA_SEED, NotSupportError, ValidationError, assertTrue, getDefaultEndpoint, getMetaTransactionHash, getTransactionHashWithNonce, replaceWith, signHash32, toVersionTransaction, uint8ArrayAlterFirst };
//# sourceMappingURL=index.js.map
