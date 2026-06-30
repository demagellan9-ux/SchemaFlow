// ============================================================
// AuthService.gs — Username/Password Authentication
// Manages login, logout, and session token validation
// ============================================================

var AuthService = (function() {

  // ── Resolve permission level ───────────────────────────────
  function _resolvePermission(user) {
    if (user.permission_level) {
      var p = user.permission_level.toString().trim().toLowerCase();
      if (PERMISSION_HIERARCHY.includes(p)) return p;
    }
    // Fallback: parse free-text role
    var r = (user.role || "").toString().trim().toLowerCase();
    if (r === "admin" || r === "administrator" || r === "hr admin") return PERMISSION.ADMIN;
    if (r === "manager" || r === "supervisor" || r === "team lead" || r === "store manager") return PERMISSION.MANAGER;
    return PERMISSION.EMPLOYEE;
  }

  // ── Login: username + password ────────────────────────────
  function login(username, password) {
    username = String(username || "").trim().toLowerCase();
    password = String(password || "").trim();

    if (!username) throw new Error("Username is required.");
    if (!password) throw new Error("Password is required.");

    // Find user by username
    var user = SheetRepository.getUserByUsername(username);
    if (!user) throw new Error("Username or password is incorrect.");

    // Verify password
    var passwordValid = CryptoService.verifyPassword(
      password,
      user.password_hash,
      user.password_salt
    );

    if (!passwordValid) throw new Error("Username or password is incorrect.");

    if (user.status && user.status.toString().toLowerCase() !== STATUS.ACTIVE) {
      throw new Error("Your account is inactive. Contact your administrator.");
    }

    // Generate new session token
    var sessionToken = CryptoService.generateSessionToken();

    // Clear old session from cache before overwriting
    if (user.session_token) {
      AtsCache.clearUser(user.session_token);
    }

    // Update session token in sheet
    SheetRepository.updateSessionToken(username, sessionToken);

    // Log login
    AuditService.logLogin(user.email);

    // Return session context
    var ctx = getCallerContext(sessionToken);
    return {
      session_token: sessionToken,
      user: {
        username: ctx.username,
        email: ctx.email,
        emp_id: ctx.emp_id,
        emp_name: ctx.employee ? ctx.employee.emp_name : ctx.emp_id,
        role: ctx.role,
        permission: ctx.permission
      }
    };
  }

  // ── Logout: clear session token ────────────────────────────
  function logout(sessionToken) {
    try {
      var ctx = getCallerContext(sessionToken);
      SheetRepository.clearSessionToken(ctx.username);
      AtsCache.clearUser(ctx.username);
      AuditService.logLogout(ctx.email);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ── Get caller context from session token ──────────────────
  function getCallerContext(sessionToken) {
    if (!sessionToken) throw new Error("Session expired. Please login again.");

    // Check cache first
    var cached = AtsCache.getUser(sessionToken);
    if (cached) return cached;

    // Fetch from sheet
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
      
      // Double-check cache (another call might have loaded it)
      cached = AtsCache.getUser(sessionToken);
      if (cached) return cached;

      // Query Users sheet for this session token
      var user = SheetRepository.getUserBySessionToken(sessionToken);
      if (!user) throw new Error("Session expired. Please login again.");

      if (user.status && user.status.toString().toLowerCase() !== STATUS.ACTIVE) {
        throw new Error("Your account is inactive.");
      }

      // Fetch employee details
      var employee = SheetRepository.getEmployeeByID(user.emp_id);
      var permission = _resolvePermission(user);

      // Build context
      var ctx = {
        username: user.username,
        email: user.email,
        emp_id: user.emp_id,
        role: user.role,
        permission: permission,
        status: user.status,
        employee: employee || null
      };

      // Cache for 30 minutes
      AtsCache.putUser(sessionToken, ctx);

      return ctx;
    } finally {
      lock.releaseLock();
    }
  }

  // ── Permission hierarchy check ────────────────────────────
  function hasPermission(userPermission, required) {
    var uIdx = PERMISSION_HIERARCHY.indexOf((userPermission || "employee").toLowerCase());
    var rIdx = PERMISSION_HIERARCHY.indexOf((required || "employee").toLowerCase());
    return uIdx >= rIdx;
  }

  // ── Guards with session token ──────────────────────────────
  function require(sessionToken, level) {
    var ctx = getCallerContext(sessionToken);
    if (!hasPermission(ctx.permission, level)) {
      AuditService.logUnauthorized(ctx.email, level + "_ACCESS");
      throw new Error("Access denied. Requires " + level + " permission.");
    }
    return ctx;
  }

  function requireEmployee(sessionToken) {
    return require(sessionToken, PERMISSION.EMPLOYEE);
  }

  function requireManager(sessionToken) {
    return require(sessionToken, PERMISSION.MANAGER);
  }

  function requireAdmin(sessionToken) {
    return require(sessionToken, PERMISSION.ADMIN);
  }

  return {
    login,
    logout,
    getCallerContext,
    hasPermission,
    requireEmployee,
    requireManager,
    requireAdmin
  };

})();
