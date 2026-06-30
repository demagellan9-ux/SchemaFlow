// ============================================================
// Constants.gs — System Configuration
// ============================================================

var ATS_VERSION = "3.0";
var ATS_TIMEZONE = "America/New_York";

// ── Sheet names ────────────────────────────────────────────
var SHEET = {
  EMPLOYEES: "Employees",
  USERS: "Users",
  SHIFTS: "Shifts",
  ACTIVITIES: "Activities",
  AUDIT: "AuditLogs"
};

// ── Column indices (1-based) ───────────────────────────────
var COL = {
  // Employees: emp_id | emp_name | email | department | role | status | created_at | updated_at | permission_level
  EMPLOYEES: {
    EMP_ID: 1,
    EMP_NAME: 2,
    EMAIL: 3,
    DEPARTMENT: 4,
    ROLE: 5,
    STATUS: 6,
    CREATED_AT: 7,
    UPDATED_AT: 8,
    PERMISSION_LEVEL: 9,
    COUNT: 9
  },

  // Users: Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
  USERS: {
    USERNAME: 1,
    PASSWORD_HASH: 2,
    PASSWORD_SALT: 3,
    SESSION_TOKEN: 4,
    EMAIL: 5,
    EMP_ID: 6,
    ROLE: 7,
    STATUS: 8,
    PERMISSION_LEVEL: 9,
    COUNT: 9
  },

  // Shifts: shift_id | emp_id | date | start_time | end_time | total_hours | status
  SHIFTS: {
    SHIFT_ID: 1,
    EMP_ID: 2,
    DATE: 3,
    START_TIME: 4,
    END_TIME: 5,
    TOTAL_HOURS: 6,
    STATUS: 7,
    COUNT: 7
  },

  // Activities: activity_id | shift_id | type | description | start_time | end_time | duration
  ACTIVITIES: {
    ACTIVITY_ID: 1,
    SHIFT_ID: 2,
    TYPE: 3,
    DESCRIPTION: 4,
    START_TIME: 5,
    END_TIME: 6,
    DURATION: 7,
    COUNT: 7
  },

  // AuditLogs: timestamp | user_email | action | target | metadata
  AUDIT: {
    TIMESTAMP: 1,
    USER_EMAIL: 2,
    ACTION: 3,
    TARGET: 4,
    METADATA: 5,
    COUNT: 5
  }
};

// ── ID Prefixes ────────────────────────────────────────────
var ID_PREFIX = {
  SHIFT: "SH",
  ACTIVITY: "ACT"
};

// ── Status constants ───────────────────────────────────────
var STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
  INACTIVE: "inactive"
};

// ── Permission levels (ordered by hierarchy) ───────────────
var PERMISSION = {
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee"
};

var PERMISSION_HIERARCHY = ["employee", "manager", "admin"];

// ── Activity types ────────────────────────────────────────
var ACTIVITY_TYPE = {
  BREAK: "break",
  LUNCH: "lunch",
  TASK: "task"
};

// ── Audit actions ────────────────────────────────────────
var AUDIT_ACTION = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  SHIFT_START: "SHIFT_START",
  SHIFT_END: "SHIFT_END",
  UNAUTHORIZED: "UNAUTHORIZED",
  STALE_SHIFT_CLOSED: "STALE_SHIFT_CLOSED",
  STALE_ACTIVITY_CLOSED: "STALE_ACTIVITY_CLOSED"
};

// ── Configuration ────────────────────────────────────────
var STALE_SHIFT_HOURS = 12;      // Auto-close shifts after 12 hours
var STALE_ACTIVITY_HOURS = 4;    // Auto-close activities after 4 hours
var LOCK_TIMEOUT = 10000;        // Lock timeout in milliseconds
var CACHE_TTL = 1800;            // Cache TTL in seconds (30 minutes)
