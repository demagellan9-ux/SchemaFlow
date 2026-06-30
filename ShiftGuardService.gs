// ============================================================
// ShiftGuardService.gs — Stale State Detection & Resolution
// ============================================================

var ShiftGuardService = (function() {

  function _pad(n) { return n < 10 ? "0"+n : ""+n; }

  function _calcDuration(start, end) {
    var ms = new Date(end) - new Date(start);
    if (ms <= 0) return "00:00:00";
    var s = Math.floor(ms/1000);
    return _pad(Math.floor(s/3600))+":"+_pad(Math.floor((s%3600)/60))+":"+_pad(s%60);
  }

  function _fmtDT(d) {
    if (!d) return "unknown";
    try { return Utilities.formatDate(new Date(d), ATS_TIMEZONE, "MMM dd, yyyy hh:mm a"); }
    catch(e) { return "unknown"; }
  }

  function _sameDay(a, b) {
    var da = new Date(a), db = new Date(b);
    return da.getFullYear()===db.getFullYear() &&
           da.getMonth()===db.getMonth() &&
           da.getDate()===db.getDate();
  }

  function _endOfDay(d) {
    var e = new Date(d); e.setHours(23,59,59,0); return e;
  }

  function _hoursDiff(from, to) {
    return (new Date(to) - new Date(from)) / 3600000;
  }

  // ── Resolve stale shift ────────────────────────────────────
  function resolveStaleShift(empID, email) {
    var data = SheetRepository.getActiveShiftByEmpID(empID);
    if (!data) return { resolved: false };

    var shift    = data.shift;
    var hoursOpen = _hoursDiff(shift.start_time, new Date());
    if (hoursOpen <= STALE_SHIFT_HOURS) return { resolved: false };

    // Force-close all open activities first
    _forceCloseActivities(shift.shift_id);

    var autoEnd  = new Date(new Date(shift.start_time).getTime() + STALE_SHIFT_HOURS * 3600000);
    var duration = _calcDuration(shift.start_time, autoEnd);

    SheetRepository.closeShift(data.row, autoEnd, duration);
    AtsCache.clearActiveShift(empID);

    AuditService.log(email || "system", AUDIT_ACTION.STALE_SHIFT_CLOSED, shift.shift_id, {
      emp_id: empID, hours_open: hoursOpen.toFixed(1), auto_end: _fmtDT(autoEnd)
    });

    return {
      resolved: true,
      message : "Your previous shift from " + _fmtDT(shift.start_time) +
                " was automatically closed after " + STALE_SHIFT_HOURS + " hours."
    };
  }

  // ── Resolve stale activities ───────────────────────────────
  function resolveStaleActivities(shiftID, email) {
    var open = SheetRepository.getOpenActivityByShift(shiftID);
    if (!open) return { resolved: false };

    var act       = open.activity;
    var hoursOpen = _hoursDiff(act.start_time, new Date());
    var crossed   = !_sameDay(act.start_time, new Date());

    if (hoursOpen <= STALE_ACTIVITY_HOURS && !crossed) return { resolved: false };

    var autoEnd  = crossed ? _endOfDay(act.start_time)
      : new Date(new Date(act.start_time).getTime() + STALE_ACTIVITY_HOURS * 3600000);
    var duration = _calcDuration(act.start_time, autoEnd);

    SheetRepository.closeActivity(open.row, autoEnd, duration);

    AuditService.log(email || "system", AUDIT_ACTION.STALE_ACTIVITY_CLOSED, act.activity_id, {
      type: act.type, hours_open: hoursOpen.toFixed(1)
    });

    return { resolved: true, type: act.type };
  }

  // ── Validate shift for action ──────────────────────────────
  function validateShiftForAction(empID, email) {
    var stale = resolveStaleShift(empID, email);
    AtsCache.clearActiveShift(empID);

    var data = SheetRepository.getActiveShiftByEmpID(empID);
    
    if (!data) {
      throw new Error(
        stale.resolved
          ? stale.message + " Please start a new shift."
          : "No active shift found."
      );
    }

    resolveStaleActivities(data.shift.shift_id, email);
    return data;
  }

  // ── Force-close all open activities for a shift ───────────
  function _forceCloseActivities(shiftID) {
    var now  = new Date();
    var open = SheetRepository.getOpenActivityByShift(shiftID);
    while (open) {
      var start    = new Date(open.activity.start_time);
      var autoEnd  = _endOfDay(start);
      var duration = _calcDuration(start, autoEnd);
      SheetRepository.closeActivity(open.row, autoEnd, duration);
      open = SheetRepository.getOpenActivityByShift(shiftID);
    }
  }

  return {
    resolveStaleShift,
    resolveStaleActivities,
    validateShiftForAction
  };

})();
