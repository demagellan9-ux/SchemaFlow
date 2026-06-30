// ============================================================
// ZWebApp.gs (UPDATED) — Public API Layer with Login/Logout
// Prefixed Z_ to guarantee it loads last alphabetically
// ============================================================

var _sessionToken = null; // Global per execution

function doGet(e) {
  // Route based on page parameter
  var page = e.parameter.page || "login";
  
  if (page === "app") {
    return HtmlService
      .createTemplateFromFile("index_app")
      .evaluate()
      .setTitle("Attendance Tracker")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  } else {
    // Default to login page
    return HtmlService
      .createTemplateFromFile("index_login")
      .evaluate()
      .setTitle("Attendance Tracker — Login")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function _ok(data) { return { success: true, data: data }; }
function _err(e) {
  Logger.log("ATS Error: " + (e.stack || e.message));
  return { success: false, error: e.message || "An unexpected error occurred." };
}

// ══════════════════════════════════════════════════════════
// AUTH API
// ══════════════════════════════════════════════════════════

function login(username, password) {
  try {
    var result = AuthService.login(username, password);
    _sessionToken = result.session_token;
    return _ok(result);
  } catch (e) { return _err(e); }
}

function logout(sessionToken) {
  try {
    var result = AuthService.logout(sessionToken);
    _sessionToken = null;
    return result;
  } catch (e) { return _err(e); }
}

function getCurrentUser(sessionToken) {
  try {
    var ctx = AuthService.getCallerContext(sessionToken);
    return _ok({
      username: ctx.username,
      email: ctx.email,
      emp_id: ctx.emp_id,
      emp_name: ctx.employee ? ctx.employee.emp_name : ctx.emp_id,
      role: ctx.role,
      permission: ctx.permission
    });
  } catch (e) { return _err(e); }
}

function validateSession(sessionToken) {
  try {
    AuthService.getCallerContext(sessionToken);
    return _ok({ valid: true });
  } catch (e) {
    return { success: false, error: "Session invalid. Please login again." };
  }
}

// ══════════════════════════════════════════════════════════
// SHIFT API (Session Token Required)
// ══════════════════════════════════════════════════════════

function getCurrentShift(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.getCurrentShift(sessionToken));
  } catch (e) { return _err(e); }
}

function startShift(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.startShift(sessionToken));
  } catch (e) { return _err(e); }
}

function endShift(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.endShift(sessionToken));
  } catch (e) { return _err(e); }
}

function startBreak(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.startBreak(sessionToken));
  } catch (e) { return _err(e); }
}

function endBreak(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.endBreak(sessionToken));
  } catch (e) { return _err(e); }
}

function startLunch(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.startLunch(sessionToken));
  } catch (e) { return _err(e); }
}

function endLunch(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.endLunch(sessionToken));
  } catch (e) { return _err(e); }
}

function logTask(sessionToken, description) {
  try {
    AuthService.requireEmployee(sessionToken);
    var desc = ValidationService.validateDescription(description);
    return _ok(ShiftService.logTask(sessionToken, desc));
  } catch (e) { return _err(e); }
}

function getEmployeeByID(sessionToken, empID) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(SheetRepository.getEmployeeByID(empID));
  } catch (e) { return _err(e); }
}

function getRecoverableShift(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.getRecoverableShift(sessionToken));
  } catch (e) { return _err(e); }
}

function resumeLastShift(sessionToken) {
  try {
    AuthService.requireEmployee(sessionToken);
    return _ok(ShiftService.resumeLastShift(sessionToken));
  } catch (e) { return _err(e); }
}
