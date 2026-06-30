// ============================================================
// ValidationService.gs — Input Sanitization & Validation
// ============================================================

var ValidationService = (function () {

  // ── Sanitize string value ──────────────────────────────────
  function sanitize(val, max) {
    if (!val) return "";
    var s = val.toString().trim();
    return max && s.length > max ? s.substring(0, max) : s;
  }

  // ── Require non-empty value ────────────────────────────────
  function required(val, field) {
    var v = sanitize(val);
    if (!v) throw new Error(field + " is required.");
    return v;
  }

  // ── Validate description (for tasks, activities) ──────────
  function validateDescription(desc) {
    return sanitize(desc, 200);
  }

  // ── Validate activity type ────────────────────────────────
  function validateActivityType(type) {
    var t = sanitize(type, 20).toLowerCase();
    if (!["break", "lunch", "task"].includes(t)) {
      throw new Error("Invalid activity type: " + type);
    }
    return t;
  }

  // ── Validate email format ──────────────────────────────────
  function validateEmail(email) {
    var e = sanitize(email).toLowerCase();
    if (!e.includes("@")) {
      throw new Error("Invalid email format: " + email);
    }
    return e;
  }

  // ── Validate username format ───────────────────────────────
  function validateUsername(username) {
    var u = sanitize(username, 50).toLowerCase();
    if (!u || u.length < 3) {
      throw new Error("Username must be at least 3 characters.");
    }
    if (!/^[a-z0-9_-]+$/.test(u)) {
      throw new Error("Username can only contain letters, numbers, underscores, and hyphens.");
    }
    return u;
  }

  // ── Validate password strength ────────────────────────────
  function validatePassword(password) {
    var p = password || "";
    if (p.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    return p;
  }

  return {
    sanitize,
    required,
    validateDescription,
    validateActivityType,
    validateEmail,
    validateUsername,
    validatePassword
  };

})();
