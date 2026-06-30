// ============================================================
// SheetRepository.gs (UPDATED) — All Sheet I/O
// Updated for Users sheet: Username, PasswordHash, PasswordSalt, SessionToken, Email, Emp_ID, Role, Status, Permission
// ============================================================

var SheetRepository = (function () {

  function _sheet(name) {
    var s = SpreadsheetApp.getActive().getSheetByName(name);
    if (!s) throw new Error("Sheet not found: " + name);
    return s;
  }

  function _readAll(sheetName, numCols) {
    var sheet = _sheet(sheetName);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    return sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  }

  function _pad(n) { return n < 10 ? "0" + n : "" + n; }

  // ── Duration sanitizer ─────────────────────────────────────
  function _sanitizeDuration(val) {
    if (!val) return "—";
    if (typeof val === "string" && /^\d{1,3}:\d{2}:\d{2}$/.test(val)) return val;
    if (val instanceof Date) {
      return _pad(val.getHours()) + ":" +
        _pad(val.getMinutes()) + ":" +
        _pad(val.getSeconds());
    }
    if (typeof val === "number" && val < 1) {
      var s = Math.round(val * 86400);
      return _pad(Math.floor(s / 3600)) + ":" +
        _pad(Math.floor((s % 3600) / 60)) + ":" +
        _pad(s % 60);
    }
    return val.toString();
  }

  // ══════════════════════════════════════════════════════════
  // USERS — Username/Password Auth (WebUI owned)
  // Schema: Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
  // ══════════════════════════════════════════════════════════

  function getUserByUsername(username) {
    username = String(username || "").trim().toLowerCase();
    var rows = _readAll(SHEET.USERS, COL.USERS.COUNT);

    for (var i = 0; i < rows.length; i++) {
      var u = String(rows[i][COL.USERS.USERNAME - 1] || "").trim().toLowerCase();
      if (u === username) {
        return _mapUser(rows[i]);
      }
    }
    return null;
  }

  function getUserBySessionToken(token) {
    if (!token) return null;
    var rows = _readAll(SHEET.USERS, COL.USERS.COUNT);

    for (var i = 0; i < rows.length; i++) {
      var st = String(rows[i][COL.USERS.SESSION_TOKEN - 1] || "").trim();
      if (st === token) {
        return _mapUser(rows[i]);
      }
    }
    return null;
  }

  function _mapUser(row) {
    return {
      username: String(row[COL.USERS.USERNAME - 1] || "").trim(),
      password_hash: String(row[COL.USERS.PASSWORD_HASH - 1] || ""),
      password_salt: String(row[COL.USERS.PASSWORD_SALT - 1] || ""),
      session_token: String(row[COL.USERS.SESSION_TOKEN - 1] || "").trim(),
      email: String(row[COL.USERS.EMAIL - 1] || "").toLowerCase().trim(),
      emp_id: String(row[COL.USERS.EMP_ID - 1] || "").trim(),
      role: String(row[COL.USERS.ROLE - 1] || ""),
      status: String(row[COL.USERS.STATUS - 1] || STATUS.ACTIVE).toLowerCase(),
      permission_level: String(row[COL.USERS.PERMISSION_LEVEL - 1] || "").toLowerCase()
    };
  }

  function updateSessionToken(username, token) {
    var sheet = _sheet(SHEET.USERS);
    var rows = _readAll(SHEET.USERS, COL.USERS.COUNT);
    username = String(username || "").trim().toLowerCase();

    for (var i = 0; i < rows.length; i++) {
      var u = String(rows[i][COL.USERS.USERNAME - 1] || "").trim().toLowerCase();
      if (u === username) {
        sheet.getRange(i + 2, COL.USERS.SESSION_TOKEN).setValue(token);
        return true;
      }
    }
    return false;
  }

  function clearSessionToken(username) {
    return updateSessionToken(username, "");
  }

  function getUserByEmail(email) {
    email = String(email || "").trim().toLowerCase();
    var rows = _readAll(SHEET.USERS, COL.USERS.COUNT);

    for (var i = 0; i < rows.length; i++) {
      var e = String(rows[i][COL.USERS.EMAIL - 1] || "").trim().toLowerCase();
      if (e === email) {
        return _mapUser(rows[i]);
      }
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // EMPLOYEES — Read only (AppSheet owns)
  // ══════════════════════════════════════════════════════════

  function getEmployeeByEmail(email) {
    var data = _readAll(SHEET.EMPLOYEES, COL.EMPLOYEES.COUNT);
    var em = email.toString().trim().toLowerCase();
    for (var i = 0; i < data.length; i++) {
      if (data[i][COL.EMPLOYEES.EMAIL - 1].toString().trim().toLowerCase() === em)
        return _rowToEmployee(data[i]);
    }
    return null;
  }

  function getEmployeeByID(empID) {
    var data = _readAll(SHEET.EMPLOYEES, COL.EMPLOYEES.COUNT);
    var id = empID.toString().trim();
    for (var i = 0; i < data.length; i++) {
      if (data[i][COL.EMPLOYEES.EMP_ID - 1].toString().trim() === id)
        return _rowToEmployee(data[i]);
    }
    return null;
  }

  function getAllEmployees() {
    var data = _readAll(SHEET.EMPLOYEES, COL.EMPLOYEES.COUNT);
    return data.filter(function (r) { return r[0]; }).map(_rowToEmployee);
  }

  function _rowToEmployee(row) {
    return {
      emp_id: row[COL.EMPLOYEES.EMP_ID - 1].toString(),
      emp_name: row[COL.EMPLOYEES.EMP_NAME - 1].toString(),
      email: row[COL.EMPLOYEES.EMAIL - 1].toString().toLowerCase(),
      department: row[COL.EMPLOYEES.DEPARTMENT - 1].toString(),
      role: row[COL.EMPLOYEES.ROLE - 1].toString(),
      status: row[COL.EMPLOYEES.STATUS - 1].toString().toLowerCase(),
      permission_level: row[COL.EMPLOYEES.PERMISSION_LEVEL - 1]
        ? row[COL.EMPLOYEES.PERMISSION_LEVEL - 1].toString().toLowerCase()
        : "employee"
    };
  }

  // ══════════════════════════════════════════════════════════
  // SHIFTS — WebUI owned, read/write
  // ══════════════════════════════════════════════════════════

  function getActiveShiftByEmpID(empID) {
    var data = _readAll(SHEET.SHIFTS, COL.SHIFTS.COUNT);
    for (var i = data.length - 1; i >= 0; i--) {
      if (
        data[i][COL.SHIFTS.EMP_ID - 1].toString() === empID.toString() &&
        data[i][COL.SHIFTS.STATUS - 1].toString().toLowerCase() === STATUS.ACTIVE
      ) return { row: i + 2, shift: _rowToShift(data[i]) };
    }
    return null;
  }

  function getShiftsByEmpID(empID, limit) {
    var data = _readAll(SHEET.SHIFTS, COL.SHIFTS.COUNT);
    var results = [];
    limit = limit || 10;
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i][COL.SHIFTS.EMP_ID - 1].toString() !== empID.toString()) continue;
      results.push(_rowToShift(data[i]));
      if (results.length >= limit) break;
    }
    return results;
  }

  function _rowToShift(row) {
    var startRaw = row[COL.SHIFTS.START_TIME - 1];
    var endRaw = row[COL.SHIFTS.END_TIME - 1];
    var hoursRaw = row[COL.SHIFTS.TOTAL_HOURS - 1];
    return {
      shift_id: row[COL.SHIFTS.SHIFT_ID - 1].toString(),
      emp_id: row[COL.SHIFTS.EMP_ID - 1].toString(),
      date: row[COL.SHIFTS.DATE - 1] ? new Date(row[COL.SHIFTS.DATE - 1]) : null,
      start_time: startRaw ? new Date(startRaw) : null,
      end_time: endRaw && endRaw.toString() !== "" ? new Date(endRaw) : null,
      total_hours: _sanitizeDuration(hoursRaw),
      status: row[COL.SHIFTS.STATUS - 1].toString().toLowerCase()
    };
  }

  function insertShift(shift) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) {
      throw new Error("System is currently busy. Please try again.");
    }

    try {
      var sheet = _sheet(SHEET.SHIFTS);
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      sheet.appendRow([
        shift.shift_id,
        shift.emp_id,
        today,
        shift.start_time,
        "",
        "",
        STATUS.ACTIVE
      ]);
    } finally {
      lock.releaseLock();
    }
  }

  function closeShift(rowNum, endTime, totalHours) {
    var sheet = _sheet(SHEET.SHIFTS);
    sheet.getRange(rowNum, COL.SHIFTS.END_TIME)
      .setValue(endTime)
      .setNumberFormat("MM/dd/yyyy HH:mm:ss");
    sheet.getRange(rowNum, COL.SHIFTS.TOTAL_HOURS)
      .setValue(totalHours)
      .setNumberFormat("@");
    sheet.getRange(rowNum, COL.SHIFTS.STATUS)
      .setValue(STATUS.CLOSED);
  }

  function restoreShift(rowNum) {
    var sheet = _sheet(SHEET.SHIFTS);
    sheet.getRange(rowNum, COL.SHIFTS.END_TIME).setValue("");
    sheet.getRange(rowNum, COL.SHIFTS.TOTAL_HOURS).setValue("").setNumberFormat("@");
    sheet.getRange(rowNum, COL.SHIFTS.STATUS).setValue(STATUS.ACTIVE);
  }

  function getLatestShiftByEmpID(empID) {
    var sheet = _sheet(SHEET.SHIFTS);
    var data = sheet.getDataRange().getValues();

    var latest = null;
    var latestTime = 0;
    var latestRow = null;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[COL.SHIFTS.EMP_ID - 1] !== empID) continue;

      var start = new Date(row[COL.SHIFTS.START_TIME - 1]).getTime();
      if (!start) continue;

      if (start > latestTime) {
        latestTime = start;
        latest = {
          shift_id: row[COL.SHIFTS.SHIFT_ID - 1],
          emp_id: row[COL.SHIFTS.EMP_ID - 1],
          date: row[COL.SHIFTS.DATE - 1],
          start_time: row[COL.SHIFTS.START_TIME - 1],
          end_time: row[COL.SHIFTS.END_TIME - 1],
          total_hours: row[COL.SHIFTS.TOTAL_HOURS - 1],
          status: row[COL.SHIFTS.STATUS - 1]
        };
        latestRow = i + 1;
      }
    }

    if (!latest) return null;
    return { shift: latest, row: latestRow };
  }

  function getLastClosedShift(empID) {
    var data = _readAll(SHEET.SHIFTS, COL.SHIFTS.COUNT);
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i][COL.SHIFTS.EMP_ID - 1].toString() === empID.toString() &&
        data[i][COL.SHIFTS.STATUS - 1].toString().toLowerCase() === STATUS.CLOSED)
        return { row: i + 2, shift: _rowToShift(data[i]) };
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // ACTIVITIES — WebUI owned, read/write
  // ══════════════════════════════════════════════════════════

  function getOpenActivityByShift(shiftID) {
    var data = _readAll(SHEET.ACTIVITIES, COL.ACTIVITIES.COUNT);
    for (var i = data.length - 1; i >= 0; i--) {
      var sid = data[i][COL.ACTIVITIES.SHIFT_ID - 1].toString().trim();
      var endVal = data[i][COL.ACTIVITIES.END_TIME - 1];
      var isEmpty = !endVal || endVal.toString().trim() === "";
      if (sid === shiftID.toString() && isEmpty)
        return { row: i + 2, activity: _rowToActivity(data[i]) };
    }
    return null;
  }

  function getActivitiesByShift(shiftID) {
    var data = _readAll(SHEET.ACTIVITIES, COL.ACTIVITIES.COUNT);
    var results = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i][COL.ACTIVITIES.SHIFT_ID - 1].toString().trim() === shiftID.toString())
        results.push(_rowToActivity(data[i]));
    }
    return results;
  }

  function countActivityTypeByShift(shiftID, type) {
    var data = _readAll(SHEET.ACTIVITIES, COL.ACTIVITIES.COUNT);
    var count = 0;
    for (var i = 0; i < data.length; i++) {
      if (
        data[i][COL.ACTIVITIES.SHIFT_ID - 1].toString() === shiftID &&
        data[i][COL.ACTIVITIES.TYPE - 1].toString() === type
      ) count++;
    }
    return count;
  }

  function _rowToActivity(row) {
    var startRaw = row[COL.ACTIVITIES.START_TIME - 1];
    var endRaw = row[COL.ACTIVITIES.END_TIME - 1];
    return {
      activity_id: row[COL.ACTIVITIES.ACTIVITY_ID - 1].toString(),
      shift_id: row[COL.ACTIVITIES.SHIFT_ID - 1].toString(),
      type: row[COL.ACTIVITIES.TYPE - 1].toString(),
      description: row[COL.ACTIVITIES.DESCRIPTION - 1].toString(),
      start_time: startRaw ? new Date(startRaw) : null,
      end_time: endRaw && endRaw.toString() !== "" ? new Date(endRaw) : null,
      duration: _sanitizeDuration(row[COL.ACTIVITIES.DURATION - 1])
    };
  }

  function insertActivity(activity) {
    var sheet = _sheet(SHEET.ACTIVITIES);
    var newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, 7).setValues([[
      activity.activity_id,
      activity.shift_id,
      activity.type,
      activity.description || "",
      activity.start_time,
      "", ""
    ]]);
    sheet.getRange(newRow, COL.ACTIVITIES.START_TIME)
      .setNumberFormat("MM/dd/yyyy HH:mm:ss");
  }

  function closeActivity(rowNum, endTime, duration) {
    var sheet = _sheet(SHEET.ACTIVITIES);
    sheet.getRange(rowNum, COL.ACTIVITIES.END_TIME)
      .setValue(endTime)
      .setNumberFormat("MM/dd/yyyy HH:mm:ss");
    sheet.getRange(rowNum, COL.ACTIVITIES.DURATION)
      .setValue(duration)
      .setNumberFormat("@");
  }

  // ══════════════════════════════════════════════════════════
  // AUDIT LOGS — WebUI owned, append only
  // ══════════════════════════════════════════════════════════

  function appendAuditLog(email, action, target, metadata) {
    var sheet = _sheet(SHEET.AUDIT);
    var newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, 5).setValues([[
      new Date(),
      email || "unknown",
      action || "UNKNOWN",
      target || "",
      metadata ? JSON.stringify(metadata) : ""
    ]]);
    sheet.getRange(newRow, 1).setNumberFormat("MM/dd/yyyy HH:mm:ss");
  }

  // ══════════════════════════════════════════════════════════
  // ID GENERATORS
  // ══════════════════════════════════════════════════════════

  function nextShiftID() {
    return ID_PREFIX.SHIFT + "_" + Utilities.getUuid().replace(/-/g, "").substring(0, 8);
  }

  function nextActivityID() {
    return ID_PREFIX.ACTIVITY + "_" + Utilities.getUuid().replace(/-/g, "").substring(0, 8);
  }

  return {
    // Users / Auth
    getUserByUsername,
    getUserBySessionToken,
    getUserByEmail,
    updateSessionToken,
    clearSessionToken,
    
    // Employees
    getEmployeeByEmail,
    getEmployeeByID,
    getAllEmployees,
    
    // Shifts
    getActiveShiftByEmpID,
    getShiftsByEmpID,
    insertShift,
    closeShift,
    restoreShift,
    nextShiftID,
    getLatestShiftByEmpID,
    getLastClosedShift,
    
    // Activities
    getOpenActivityByShift,
    getActivitiesByShift,
    countActivityTypeByShift,
    insertActivity,
    closeActivity,
    nextActivityID,
    
    // Audit
    appendAuditLog
  };

})();
