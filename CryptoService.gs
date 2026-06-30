// ============================================================
// CryptoService.gs — Password Hashing & Verification
// Uses Utilities.computeDigest (SHA-256) + salt for security
// ============================================================

var CryptoService = (function() {

  // ── Generate a random salt ─────────────────────────────────
  function _generateSalt(length) {
    length = length || 32;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var salt = "";
    for (var i = 0; i < length; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  // ── Hash password with salt using SHA-256 ──────────────────
  function hashPassword(plaintext, salt) {
    salt = salt || _generateSalt(32);
    
    // Combine password + salt
    var combined = plaintext + salt;
    
    // SHA-256 hash using Utilities API
    var hashed = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      combined
    );
    
    // Convert bytes to hex string
    var hexString = '';
    for (var i = 0; i < hashed.length; i++) {
      var hex = (hashed[i] & 0xff).toString(16);
      if (hex.length === 1) hexString += '0';
      hexString += hex;
    }
    
    return {
      hash: hexString,
      salt: salt
    };
  }

  // ── Verify password against stored hash ────────────────────
  function verifyPassword(plaintext, storedHash, salt) {
    var verification = hashPassword(plaintext, salt);
    
    // Constant-time comparison to prevent timing attacks
    return _constantTimeCompare(verification.hash, storedHash);
  }

  // ── Constant-time string comparison ────────────────────────
  function _constantTimeCompare(a, b) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // ── Generate secure session token ──────────────────────────
  function generateSessionToken() {
    var token = Utilities.getUuid().replace(/-/g, "").substring(0, 40);
    return token;
  }

  // ── Get current timestamp ──────────────────────────────────
  function now() {
    return new Date().getTime();
  }

  return {
    hashPassword,
    verifyPassword,
    generateSessionToken,
    now
  };

})();
