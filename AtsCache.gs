// ============================================================
// AtsCache.gs — Per-user session cache with TTL
// Improves performance by caching frequently accessed data
// ============================================================

var AtsCache = (function() {

  var _c = CacheService.getScriptCache();

  // ── Key builder ────────────────────────────────────────
  function _k(ns, id) {
    return "ats:" + ns + ":" + (id || "global");
  }

  // ── Get cached value ───────────────────────────────────
  function get(ns, id) {
    try {
      var v = _c.get(_k(ns, id));
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  // ── Set cached value with TTL (default 30 min) ────────
  function put(ns, id, data, ttl) {
    try {
      _c.put(_k(ns, id), JSON.stringify(data), ttl || CACHE_TTL);
    } catch (e) {
      // Cache service errors are non-blocking
    }
  }

  // ── Remove cached value ────────────────────────────────
  function remove(ns, id) {
    try {
      _c.remove(_k(ns, id));
    } catch (e) {
      // Cache service errors are non-blocking
    }
  }

  // ══════════════════════════════════════════════════════════
  // USER CACHE
  // ══════════════════════════════════════════════════════════

  function getUser(sessionToken) {
    return get("user", sessionToken);
  }

  function putUser(sessionToken, data) {
    put("user", sessionToken, data, 1800); // 30 minutes
  }

  function clearUser(sessionToken) {
    remove("user", sessionToken);
  }

  // ══════════════════════════════════════════════════════════
  // ACTIVE SHIFT CACHE
  // ══════════════════════════════════════════════════════════

  function getActiveShift(empID) {
    return get("shift", empID);
  }

  function putActiveShift(empID, data) {
    put("shift", empID, data, CACHE_TTL);
  }

  function clearActiveShift(empID) {
    remove("shift", empID);
  }

  // ══════════════════════════════════════════════════════════
  // DIRECTORY CACHE
  // ══════════════════════════════════════════════════════════

  function getDirectory() {
    return get("dir", "all");
  }

  function putDirectory(data) {
    put("dir", "all", data, 3600); // 60 minutes
  }

  function clearDirectory() {
    remove("dir", "all");
  }

  // ══════════════════════════════════════════════════════════
  // BATCH CLEAR
  // ══════════════════════════════════════════════════════════

  function clearAll(empID, sessionToken) {
    clearUser(sessionToken);
    clearActiveShift(empID);
    clearDirectory();
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════

  return {
    // User cache
    getUser: getUser,
    putUser: putUser,
    clearUser: clearUser,

    // Active shift cache
    getActiveShift: getActiveShift,
    putActiveShift: putActiveShift,
    clearActiveShift: clearActiveShift,

    // Directory cache
    getDirectory: getDirectory,
    putDirectory: putDirectory,
    clearDirectory: clearDirectory,

    // Batch operations
    clearAll: clearAll
  };

})();
