// ============================================================
// ShiftService.gs (UPDATED) — Accept sessionToken for auth
// ============================================================

var ShiftService = (function () {

  // ── Helpers ────────────────────────────────────────────────
  function _pad(n) { return n < 10 ? "0" + n : "" + n; }

  function _calcDuration(start, end) {
    if (!start || !end) return "00:00:00";
    var ms = new Date(end) - new Date(start);
    if (ms <= 0) return "00:00:00";
    var s = Math.floor(ms / 1000);
    return _pad(Math.floor(s / 3600)) + ":" + _pad(Math.floor((s % 3600) / 60)) + ":" + _pad(s % 60);
  }

  function _toSec(hms) {
    if (!hms || typeof hms !== "string") return 0;
    var p = hms.split(":").map(Number);
    return ((p[0] || 0) * 3600) + ((p[1] || 0) * 60) + (p[2] || 0);
  }

  function _secToHms(s) {
    s = Math.max(0, s || 0);
    return _pad(Math.floor(s / 3600)) + ":" + _pad(Math.floor((s % 3600) / 60)) + ":" + _pad(s % 60);
  }

  function _fmtTime(d) {
    if (!d) return "";
    try { return Utilities.formatDate(new Date(d), ATS_TIMEZONE, "hh:mm a"); }
    catch (e) { return ""; }
  }

  function _fmtDT(d) {
    if (!d) return "";
    try { return Utilities.formatDate(new Date(d), ATS_TIMEZONE, "MMM dd, yyyy hh:mm a"); }
    catch (e) { return ""; }
  }

  function _fmtDate(d) {
    if (!d) return "";
    try { return Utilities.formatDate(new Date(d), ATS_TIMEZONE, "MMM dd, yyyy"); }
    catch (e) { return ""; }
  }

  function _isOvernight(a, b) {
    if (!a || !b) return false;
    var da = new Date(a), db = new Date(b);
    return !(da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate());
  }

  // ── Format shift for frontend ──────────────────────────────
  function _fmt(shift) {
    if (!shift) return null;
    var s = shift.start_time;
    var e = shift.end_time;
    var ovn = _isOvernight(s, e);
    return {
      shift_id: shift.shift_id,
      emp_id: shift.emp_id,
      date: shift.date ? _fmtDate(shift.date) : "",
      start_time: s ? (ovn ? _fmtDT(s) : _fmtTime(s)) : "—",
      start_raw: s ? new Date(s).getTime() : null,
      end_time: e ? (ovn ? _fmtDT(e) : _fmtTime(e)) : null,
      total_hours: shift.total_hours || "—",
      status: shift.status,
      is_overnight: ovn
    };
  }

  // ── Format activity for frontend ──────────────────────────
  function _fmtAct(act) {
    if (!act) return null;
    var s = act.start_time;
    var e = act.end_time;
    var ovn = _isOvernight(s, e);
    return {
      activity_id: act.activity_id,
      shift_id: act.shift_id,
      type: act.type,
      description: act.description || "",
      start_time: s ? (ovn ? _fmtDT(s) : _fmtTime(s)) : "—",
      start_raw: s ? new Date(s).getTime() : null,
      end_time: e ? (ovn ? _fmtDT(e) : _fmtTime(e)) : null,
      duration: act.duration || "—"
    };
  }

  // ── Build full state object ────────────────────────────────
  function _buildState(ctx, shiftData) {
    if (!shiftData) {
      return {
        status: "off_shift",
        emp_id: ctx.emp_id,
        emp_name: ctx.employee ? ctx.employee.emp_name : "",
        role: ctx.role,
        permission: ctx.permission,
        shift: null,
        activity: null,
        activities: [],
        warnings: []
      };
    }

    var shift = shiftData.shift;
    var shiftID = shift.shift_id;
    var openAct = SheetRepository.getOpenActivityByShift(shiftID);
    var allActs = SheetRepository.getActivitiesByShift(shiftID);

    var status = "working";
    if (openAct) {
      if (openAct.activity.type === ACTIVITY_TYPE.BREAK) status = "break";
      if (openAct.activity.type === ACTIVITY_TYPE.LUNCH) status = "lunch";
    }

    return {
      status: status,
      emp_id: ctx.emp_id,
      emp_name: ctx.employee ? ctx.employee.emp_name : "",
      role: ctx.role,
      permission: ctx.permission,
      shift: _fmt(shift),
      activity: openAct ? _fmtAct(openAct.activity) : null,
      activities: allActs.map(_fmtAct),
      warnings: []
    };
  }

  // ── getCurrentShift ────────────────────────────────────────
  function getCurrentShift(sessionToken) {
    var ctx = AuthService.requireEmployee(sessionToken);

    ShiftGuardService.resolveStaleShift(ctx.emp_id, ctx.email);
    AtsCache.clearActiveShift(ctx.emp_id);

    var data = SheetRepository.getActiveShiftByEmpID(ctx.emp_id);

    if (data) {
      ShiftGuardService.resolveStaleActivities(data.shift.shift_id, ctx.email);
      data = SheetRepository.getActiveShiftByEmpID(ctx.emp_id);
    }

    return _buildState(ctx, data);
  }

  function getRecoverableShift(sessionToken) {
    var ctx = AuthService.requireEmployee(sessionToken);

    var last = SheetRepository.getLatestShiftByEmpID(ctx.emp_id);
    if (!last || !last.shift.end_time) return null;

    var now = new Date();
    var end = new Date(last.shift.end_time);
    var diffSec = Math.floor((now - end) / 1000);

    return {
      shift_id: last.shift.shift_id,
      secondsSinceEnd: diffSec,
      recoverable: diffSec <= 300,
      canStartNew: diffSec >= 3600
    };
  }

  function resumeLastShift(sessionToken) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);

      var last = SheetRepository.getLatestShiftByEmpID(ctx.emp_id);
      if (!last || !last.shift.end_time)
        throw new Error("No shift to resume.");

      var now = new Date();
      var end = new Date(last.shift.end_time);
      var diff = (now - end) / 1000;

      if (diff > 300)
        throw new Error("Resume window expired (5 minutes).");

      SheetRepository.restoreShift(last.row);
      AtsCache.clearActiveShift(ctx.emp_id);

      AuditService.logShiftStart(ctx.email, last.shift.shift_id, ctx.emp_id);

      return getCurrentShift(sessionToken);

    } finally { lock.releaseLock(); }
  }

  function startShift(sessionToken) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress. Try again."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);
      var stale = ShiftGuardService.resolveStaleShift(ctx.emp_id, ctx.email);
      AtsCache.clearActiveShift(ctx.emp_id);

      // Misclick recovery (reopen instead of new shift)
      var last = SheetRepository.getLatestShiftByEmpID(ctx.emp_id);

      if (last && last.shift.status === STATUS.CLOSED && last.shift.end_time) {
        var diff = (Date.now() - new Date(last.shift.end_time).getTime()) / 1000;
        if (diff <= 120) {
          SheetRepository.restoreShift(last.row);
          AtsCache.clearActiveShift(ctx.emp_id);
          return getCurrentShift(sessionToken);
        }
      }

      if (SheetRepository.getActiveShiftByEmpID(ctx.emp_id))
        throw new Error("You already have an active shift. End it first.");

      var now = new Date();
      var shiftID = SheetRepository.nextShiftID();

      SheetRepository.insertShift({
        shift_id: shiftID,
        emp_id: ctx.emp_id,
        start_time: now
      });

      AtsCache.clearActiveShift(ctx.emp_id);
      AuditService.logShiftStart(ctx.email, shiftID, ctx.emp_id);

      var result = getCurrentShift(sessionToken);
      if (stale.resolved) result.notice = stale.message;

      return result;

    } finally { lock.releaseLock(); }
  }

  function endShift(sessionToken) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress. Try again."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);
      var data = ShiftGuardService.validateShiftForAction(ctx.emp_id, ctx.email);
      var shiftID = data.shift.shift_id;

      var openAct = SheetRepository.getOpenActivityByShift(shiftID);
      if (openAct) {
        if (openAct.activity.type === ACTIVITY_TYPE.BREAK)
          throw new Error("End your break before ending the shift.");
        if (openAct.activity.type === ACTIVITY_TYPE.LUNCH)
          throw new Error("End your lunch before ending the shift.");
        _closeAct(openAct);
      }

      var now = new Date();
      var gross = Math.floor((now - new Date(data.shift.start_time)) / 1000);
      var deduct = 0;

      SheetRepository.getActivitiesByShift(shiftID).forEach(function (a) {
        if ((a.type === ACTIVITY_TYPE.BREAK || a.type === ACTIVITY_TYPE.LUNCH) && a.duration && a.end_time)
          deduct += _toSec(a.duration);
      });

      var net = _secToHms(Math.max(0, gross - deduct));
      SheetRepository.closeShift(data.row, now, net);
      AtsCache.clearActiveShift(ctx.emp_id);
      AuditService.logShiftEnd(ctx.email, shiftID, net);

      return Object.assign(_buildState(ctx, null), {
        summary: {
          shift_id: shiftID,
          start_time: _fmtDT(data.shift.start_time),
          end_time: _fmtDT(now),
          gross: _calcDuration(data.shift.start_time, now),
          deductions: _secToHms(deduct),
          duration: net
        }
      });

    } finally { lock.releaseLock(); }
  }

  function _closeAct(openActData) {
    var now = new Date();
    var duration = _calcDuration(openActData.activity.start_time, now);
    SheetRepository.closeActivity(openActData.row, now, duration);
    return duration;
  }

  function _startActivity(sessionToken, type, description) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress. Try again."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);
      var data = ShiftGuardService.validateShiftForAction(ctx.emp_id, ctx.email);
      var shiftID = data.shift.shift_id;
      var openAct = SheetRepository.getOpenActivityByShift(shiftID);

      if (openAct) {
        var cur = openAct.activity.type;
        if (cur === type) throw new Error("Already on " + type + ".");
        if (cur === ACTIVITY_TYPE.BREAK) throw new Error("End break before starting " + type + ".");
        if (cur === ACTIVITY_TYPE.LUNCH) throw new Error("End lunch before starting " + type + ".");
        _closeAct(openAct);
      }

      if (type === ACTIVITY_TYPE.BREAK) {
        if (SheetRepository.countActivityTypeByShift(shiftID, ACTIVITY_TYPE.BREAK) >= 2)
          throw new Error("Maximum 2 breaks allowed per shift.");
      }
      if (type === ACTIVITY_TYPE.LUNCH) {
        if (SheetRepository.countActivityTypeByShift(shiftID, ACTIVITY_TYPE.LUNCH) >= 1)
          throw new Error("Lunch already taken this shift.");
      }

      var now = new Date();
      var aid = SheetRepository.nextActivityID();
      SheetRepository.insertActivity({
        activity_id: aid,
        shift_id: shiftID,
        type: type,
        description: description || "",
        start_time: now
      });

      AtsCache.clearActiveShift(ctx.emp_id);
      AuditService.logActivityStart(ctx.email, aid, shiftID);

      return getCurrentShift(sessionToken);

    } finally { lock.releaseLock(); }
  }

  function _endActivity(sessionToken, type) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress. Try again."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);
      var data = ShiftGuardService.validateShiftForAction(ctx.emp_id, ctx.email);
      var shiftID = data.shift.shift_id;
      var openAct = SheetRepository.getOpenActivityByShift(shiftID);

      if (!openAct) throw new Error("No active " + type + " found.");
      if (openAct.activity.type !== type)
        throw new Error("You are not currently on " + type + ".");

      var duration = _closeAct(openAct);
      AtsCache.clearActiveShift(ctx.emp_id);
      AuditService.logActivityEnd(ctx.email, openAct.activity.activity_id, duration);

      return getCurrentShift(sessionToken);

    } finally { lock.releaseLock(); }
  }

  function logTask(sessionToken, description) {
    var lock = LockService.getUserLock();
    try { lock.waitLock(LOCK_TIMEOUT); }
    catch (e) { throw new Error("Another action is in progress."); }

    try {
      var ctx = AuthService.requireEmployee(sessionToken);
      var data = ShiftGuardService.validateShiftForAction(ctx.emp_id, ctx.email);
      var shiftID = data.shift.shift_id;

      var desc = ValidationService.validateDescription(description);
      if (!desc) throw new Error("Task description is required.");

      var now = new Date();
      var aid = SheetRepository.nextActivityID();

      SheetRepository.insertActivity({
        activity_id: aid,
        shift_id: shiftID,
        type: ACTIVITY_TYPE.TASK,
        description: desc,
        start_time: now
      });

      AuditService.log(ctx.email, "TASK_LOGGED", aid, {
        shift_id: shiftID,
        description: desc
      });

      AtsCache.clearActiveShift(ctx.emp_id);

      return getCurrentShift(sessionToken);

    } finally {
      lock.releaseLock();
    }
  }

  return {
    getCurrentShift,
    startShift,
    endShift,
    getRecoverableShift,
    resumeLastShift,
    logTask,
    startBreak: function (token) { return _startActivity(token, ACTIVITY_TYPE.BREAK); },
    endBreak: function (token) { return _endActivity(token, ACTIVITY_TYPE.BREAK); },
    startLunch: function (token) { return _startActivity(token, ACTIVITY_TYPE.LUNCH); },
    endLunch: function (token) { return _endActivity(token, ACTIVITY_TYPE.LUNCH); }
  };

})();
