// ============================================================
// AuditService.gs (UPDATED) — Audit trail with login/logout
// ============================================================

var AuditService = (function () {

  function log(email, action, target, metadata) {
    try {
      SheetRepository.appendAuditLog(email, action, target, metadata);
    } catch (e) {
      Logger.log("AuditService error: " + e.message);
    }
  }

  return {
    log,
    
    logLogin: function (email) {
      log(email, AUDIT_ACTION.LOGIN, email, null);
    },
    
    logLogout: function (email) {
      log(email, "LOGOUT", email, null);
    },
    
    logShiftStart: function (email, shiftID, empID) {
      log(email, AUDIT_ACTION.SHIFT_START, shiftID, { emp_id: empID });
    },
    
    logShiftEnd: function (email, shiftID, duration) {
      log(email, AUDIT_ACTION.SHIFT_END, shiftID, { duration: duration });
    },
    
    logActivityStart: function (email, activityID, shiftID) {
      log(email, "ACTIVITY_START", activityID, { shift_id: shiftID });
    },
    
    logActivityEnd: function (email, activityID, duration) {
      log(email, "ACTIVITY_END", activityID, { duration: duration });
    },
    
    logUnauthorized: function (email, action) {
      log(email, AUDIT_ACTION.UNAUTHORIZED, action, null);
    }
  };

})();
