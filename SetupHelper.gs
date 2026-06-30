// ============================================================
// SetupHelper.gs — User Creation & Setup Utilities
// Run these functions from Apps Script Console (Ctrl+Enter)
// ============================================================

/**
 * Create a new user with hashed password
 * @param {string} username - Unique login name (lowercase)
 * @param {string} password - Plaintext password (will be hashed)
 * @param {string} email - User email
 * @param {string} empID - Employee ID (from Employees sheet)
 * @param {string} role - Display role (any text)
 * @param {string} permission - "admin", "manager", or "employee"
 */
function createUser(username, password, email, empID, role, permission) {
  if (!username || !password) {
    throw new Error("Username and password are required.");
  }

  username = String(username).trim().toLowerCase();
  email = String(email).trim().toLowerCase();
  empID = String(empID).trim();
  role = String(role).trim();
  permission = String(permission).trim().toLowerCase();

  // Validate permission
  if (!["admin", "manager", "employee"].includes(permission)) {
    throw new Error("Permission must be: admin, manager, or employee");
  }

  // Hash password
  var hash = CryptoService.hashPassword(password);

  // Check if user already exists
  var existing = SheetRepository.getUserByUsername(username);
  if (existing) {
    throw new Error("User already exists: " + username);
  }

  // Add to Users sheet
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  sheet.appendRow([
    username,
    hash.hash,
    hash.salt,
    "", // SessionToken (empty initially)
    email,
    empID,
    role,
    "active",
    permission
  ]);

  Logger.log("✅ User created successfully: " + username);
  Logger.log("   Email: " + email);
  Logger.log("   Permission: " + permission);
  Logger.log("   Status: active");
}

/**
 * Reset a user's password
 * @param {string} username - Username
 * @param {string} newPassword - New password
 */
function resetUserPassword(username, newPassword) {
  if (!username || !newPassword) {
    throw new Error("Username and password are required.");
  }

  username = String(username).trim().toLowerCase();

  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  // Find user row
  var userRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username) {
      userRow = i + 1;
      break;
    }
  }

  if (userRow === -1) {
    throw new Error("User not found: " + username);
  }

  // Hash new password
  var hash = CryptoService.hashPassword(newPassword);

  // Update cells
  sheet.getRange(userRow, 2).setValue(hash.hash);    // PasswordHash
  sheet.getRange(userRow, 3).setValue(hash.salt);    // PasswordSalt
  sheet.getRange(userRow, 4).setValue("");           // Clear SessionToken

  Logger.log("✅ Password reset for: " + username);
}

/**
 * List all users
 */
function listAllUsers() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  Logger.log("=== ALL USERS ===");
  Logger.log("");

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue; // Skip empty rows

    var username = row[0];
    var email = row[4];
    var empID = row[5];
    var status = row[7];
    var permission = row[8];

    Logger.log((i) + ". " + username);
    Logger.log("   Email: " + email);
    Logger.log("   Emp ID: " + empID);
    Logger.log("   Permission: " + permission);
    Logger.log("   Status: " + status);
    Logger.log("");
  }
}

/**
 * Deactivate a user
 * @param {string} username - Username to deactivate
 */
function deactivateUser(username) {
  username = String(username).trim().toLowerCase();

  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username) {
      sheet.getRange(i + 1, 8).setValue("inactive"); // Status column
      sheet.getRange(i + 1, 4).setValue("");         // Clear SessionToken
      Logger.log("✅ User deactivated: " + username);
      return;
    }
  }

  throw new Error("User not found: " + username);
}

/**
 * Reactivate a user
 * @param {string} username - Username to reactivate
 */
function reactivateUser(username) {
  username = String(username).trim().toLowerCase();

  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username) {
      sheet.getRange(i + 1, 8).setValue("active");
      Logger.log("✅ User reactivated: " + username);
      return;
    }
  }

  throw new Error("User not found: " + username);
}

/**
 * Change user permission level
 * @param {string} username - Username
 * @param {string} newPermission - "admin", "manager", or "employee"
 */
function changeUserPermission(username, newPermission) {
  username = String(username).trim().toLowerCase();
  newPermission = String(newPermission).trim().toLowerCase();

  if (!["admin", "manager", "employee"].includes(newPermission)) {
    throw new Error("Permission must be: admin, manager, or employee");
  }

  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === username) {
      sheet.getRange(i + 1, 9).setValue(newPermission);
      Logger.log("✅ Permission changed for " + username + " → " + newPermission);
      return;
    }
  }

  throw new Error("User not found: " + username);
}

/**
 * Set up demo users for testing
 */
function setupDemoUsers() {
  Logger.log("Creating demo users...");

  try {
    createUser("admin", "admin123", "admin@company.com", "EMP001", "System Admin", "admin");
  } catch (e) {
    Logger.log("⚠️  Admin already exists: " + e.message);
  }

  try {
    createUser("manager", "manager123", "manager@company.com", "EMP002", "Store Manager", "manager");
  } catch (e) {
    Logger.log("⚠️  Manager already exists: " + e.message);
  }

  try {
    createUser("employee", "employee123", "employee@company.com", "EMP003", "Employee", "employee");
  } catch (e) {
    Logger.log("⚠️  Employee already exists: " + e.message);
  }

  Logger.log("");
  Logger.log("✅ Demo setup complete!");
  Logger.log("");
  Logger.log("Test credentials:");
  Logger.log("  Admin: admin / admin123");
  Logger.log("  Manager: manager / manager123");
  Logger.log("  Employee: employee / employee123");
}

/**
 * Test password verification
 * @param {string} username - Username
 * @param {string} password - Password to test
 */
function testLogin(username, password) {
  Logger.log("Testing login: " + username);

  try {
    var result = AuthService.login(username, password);
    Logger.log("✅ Login successful!");
    Logger.log("   Session: " + result.session_token.substring(0, 20) + "...");
    Logger.log("   User: " + result.user.emp_name);
    Logger.log("   Email: " + result.user.email);
    Logger.log("   Permission: " + result.user.permission);
  } catch (e) {
    Logger.log("❌ Login failed: " + e.message);
  }
}

/**
 * Verify system setup
 */
function verifySetup() {
  Logger.log("=== ATS v3.0 SETUP VERIFICATION ===");
  Logger.log("");

  // Check sheets exist
  var ss = SpreadsheetApp.getActive();
  var sheets = ["Employees", "Users", "Shifts", "Activities", "AuditLogs"];

  Logger.log("Checking sheets...");
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      var rows = sheet.getLastRow() - 1; // Minus header
      Logger.log("  ✅ " + name + " (" + rows + " rows)");
    } else {
      Logger.log("  ❌ " + name + " NOT FOUND");
    }
  });

  Logger.log("");
  Logger.log("Checking services...");

  // Check Constants
  try {
    if (ATS_VERSION) Logger.log("  ✅ Constants.gs loaded");
  } catch (e) {
    Logger.log("  ❌ Constants.gs missing");
  }

  // Check CryptoService
  try {
    if (CryptoService) Logger.log("  ✅ CryptoService.gs loaded");
  } catch (e) {
    Logger.log("  ❌ CryptoService.gs missing");
  }

  // Check AuthService
  try {
    if (AuthService) Logger.log("  ✅ AuthService.gs loaded");
  } catch (e) {
    Logger.log("  ❌ AuthService.gs missing");
  }

  // Check SheetRepository
  try {
    if (SheetRepository) Logger.log("  ✅ SheetRepository.gs loaded");
  } catch (e) {
    Logger.log("  ❌ SheetRepository.gs missing");
  }

  // Check ShiftService
  try {
    if (ShiftService) Logger.log("  ✅ ShiftService.gs loaded");
  } catch (e) {
    Logger.log("  ❌ ShiftService.gs missing");
  }

  Logger.log("");
  Logger.log("Checking Users sheet schema...");

  var sheet = ss.getSheetByName("Users");
  if (sheet) {
    var headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    var expectedHeaders = [
      "Username", "PasswordHash", "PasswordSalt", "SessionToken",
      "Email", "Emp_ID", "Role", "Status", "Permission"
    ];

    var correct = true;
    for (var i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        Logger.log("  ❌ Column " + (i + 1) + " should be: " + expectedHeaders[i]);
        Logger.log("     But found: " + headers[i]);
        correct = false;
      }
    }

    if (correct) {
      Logger.log("  ✅ Users sheet schema correct");
    }
  }

  Logger.log("");
  Logger.log("=== VERIFICATION COMPLETE ===");
}

/**
 * Clear all session tokens (force all users to re-login)
 */
function clearAllSessionTokens() {
  if (!confirm("This will log out all users. Continue?")) return;

  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) { // If username exists
      sheet.getRange(i + 1, 4).setValue(""); // Clear SessionToken
      count++;
    }
  }

  Logger.log("✅ Cleared session tokens for " + count + " users");
}

/**
 * Export users to log (for backup)
 */
function exportUsersToLog() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  Logger.log("=== USER EXPORT ===");
  Logger.log("");

  data.forEach(function(row, i) {
    if (i === 0) {
      Logger.log("HEADERS: " + row.join(" | "));
    } else if (row[0]) {
      Logger.log(
        row[0] + " | " + row[4] + " | " + row[5] + " | " + row[8] + " | " + row[7]
      );
    }
  });
}

// ══════════════════════════════════════════════════════════
// QUICK START
// ══════════════════════════════════════════════════════════

/**
 * One-click setup for new installation
 * Run this first!
 */
function quickStart() {
  Logger.log("🚀 ATS v3.0 Quick Start");
  Logger.log("");
  
  // Verify setup
  verifySetup();
  
  Logger.log("");
  Logger.log("✅ System verified!");
  Logger.log("");
  Logger.log("Next steps:");
  Logger.log("  1. Run: setupDemoUsers()");
  Logger.log("  2. Visit your web app URL");
  Logger.log("  3. Login with: admin / admin123");
  Logger.log("");
}
