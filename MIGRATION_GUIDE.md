# ATS v3.0 — Username/Password Authentication Migration Guide

## Overview

This guide walks you through transitioning your Attendance Tracking System from **email-based authentication** (Google Workspace) to **username-password authentication** with proper password hashing and session token management.

---

## 📋 What's Changing

### Before (Email-Based Auth)
- Automatic authentication using `Session.getActiveUser().getEmail()`
- No login form
- Users must be part of Google Workspace domain

### After (Username/Password Auth)
- Users login with username + password
- Passwords are hashed with SHA-256 + salt
- Session tokens manage authenticated sessions
- Works for any user, not just Google Workspace members
- Login page + main app page separation
- Logout functionality

---

## 🔧 Step 1: Replace Your Google Apps Script Files

### Files to Replace/Update

Replace these OLD files with the new versions:

| Old File | New File | Notes |
|----------|----------|-------|
| `AuthService.gs` | `AuthService.gs` | Updated for username/password |
| `SheetRepository.gs` | `SheetRepository_Updated.gs` | Rename to `SheetRepository.gs` |
| `ShiftService.gs` | `ShiftService_Updated.gs` | Rename to `ShiftService.gs` |
| `AuditService.gs` | `AuditService_Updated.gs` | Rename to `AuditService.gs` |
| `ZWebApp.gs` | `ZWebApp_Updated.gs` | Rename to `ZWebApp.gs` |

### New Files to Add

1. **Constants.gs** — Configuration & constants
2. **CryptoService.gs** — Password hashing
3. **index_login.html** — Login page
4. **index_app.html** — Main app (replaces `index.html`)

### Files That Stay the Same

- `ShiftGuardService.gs` ✅ No changes
- `ValidationService.gs` ✅ No changes
- `AtsCache.gs` ✅ No changes
- `Stylesheet` (CSS) ✅ No changes
- `Javascript.html` ✅ No changes

---

## 📊 Step 2: Update Google Sheets Schema

### Users Sheet

**OLD USERS SHEET** (if you have one):
```
Email | Emp_ID | Role | Status | Permission
```

**NEW USERS SHEET**:
```
Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
```

#### Column Details

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| **Username** | Text | `jsmith` | Unique login identifier. Lowercase recommended |
| **PasswordHash** | Text | `a7b2c3d4...` | SHA-256 hash (auto-generated) |
| **PasswordSalt** | Text | `xyz123abc...` | Random 32-char salt (auto-generated) |
| **SessionToken** | Text | `abc123xyz...` | Current session (auto-updated on login) |
| **Email** | Text | `john@company.com` | User email |
| **Emp_ID** | Text | `EMP001` | Link to Employees sheet |
| **Role** | Text | `admin` | Display role (can be any text) |
| **Status** | Text | `active` | `active` or `inactive` |
| **Permission** | Text | `admin` | `admin`, `manager`, or `employee` |

### Employees Sheet

**NO CHANGES** — Keep your existing schema:
```
emp_id | emp_name | email | department | role | status | created_at | updated_at | permission_level
```

### Shifts, Activities, Audit Logs

**NO CHANGES** — Keep existing schemas

---

## 🔐 Step 3: Populate the Users Sheet

### Initial User Setup (Manual)

1. Open the **Users** sheet in Google Sheets
2. Add header row (if not present):
   ```
   Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
   ```

3. **DO NOT MANUALLY ENTER PASSWORDS** — Use the setup script below

### Automatic User Creation (Recommended)

Create a setup script in **Apps Script**:

```javascript
function createUser(username, plaintextPassword, email, empID, role, permission) {
  var hash = CryptoService.hashPassword(plaintextPassword);
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  
  sheet.appendRow([
    username.toLowerCase().trim(),
    hash.hash,
    hash.salt,
    "",  // SessionToken (empty initially)
    email.toLowerCase().trim(),
    empID,
    role,
    "active",
    permission
  ]);
  
  Logger.log("✅ User created: " + username);
}

// Example usage:
function setupTestUsers() {
  createUser("jsmith", "password123", "john@company.com", "EMP001", "admin", "admin");
  createUser("mdoe", "password456", "mary@company.com", "EMP002", "employee", "employee");
}
```

**Run this in Apps Script console**:
1. Copy the functions above into your script
2. Run `setupTestUsers()`
3. Check the **Users** sheet for new rows

---

## 🚀 Step 4: Deploy the Web App

### Update Deployment

In Google Apps Script:

1. Click **Deploy** > **New deployment**
2. Select type: **Web app**
3. Execute as: **Your email**
4. Who has access: **Anyone**
5. Copy the new **Deployment URL**

### Test the Login Page

Visit your deployment URL. You should see:

```
⏱ Attendance Tracker
───────────────────
[Login Form]
```

If you see this, the login page is working! ✅

---

## 📱 Step 5: Login Flow

### First Time Login

1. Navigate to web app URL
2. Enter username: `jsmith`
3. Enter password: `password123` (from setup)
4. Click **Sign In**
5. You're redirected to the main app
6. Session token is stored in browser **localStorage**

### Session Management

- Session tokens are stored in `ATS_SESSION` key
- Tokens are 40-character random strings
- Tokens are cleared on **Logout**
- Tokens expire if user account is set to `inactive`

### Auto-Logout

Sessions are cleared when:
- User clicks **Logout**
- User account is deactivated
- Session token is invalid

---

## 🔒 Security Features

### Password Hashing

- Algorithm: **SHA-256**
- Salt: **32-character random**
- Stored: **Hash + Salt separately** (not plaintext password)

### Session Tokens

- Length: **40 characters**
- Generated: **Unique per login**
- Stored: **In Users sheet + browser localStorage**
- Expires: **On logout or session validation failure**

### Example Password Hash

For password `password123` with salt `xyz123abc...`:
```
Combined: password123xyz123abc...
SHA-256 Hash: a7b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 🛠️ Troubleshooting

### "Username or password is incorrect"

**Solutions**:
1. Check username is lowercase in Users sheet
2. Verify PasswordHash and PasswordSalt are not empty
3. Re-run `setupTestUsers()` to reset a user

### "Session expired. Please login again"

**Solutions**:
1. Clear browser localStorage: `localStorage.clear()`
2. Try logging in again
3. Check Users sheet — SessionToken should update on successful login

### "No session found"

**Solutions**:
1. You're visiting `?page=app` without logging in first
2. Visit the base URL (without `?page=app`) to access login page
3. Login first, then main app will load

### Passwords Not Hashing

**Solutions**:
1. Verify `CryptoService.gs` is deployed
2. Check `Constants.gs` is present
3. Run diagnostic: `diagnosisPasswordHash()` (create custom function to test)

---

## 📝 Step 6: Migration Checklist

- [ ] Backup old Google Sheets
- [ ] Create new Users sheet with correct columns
- [ ] Add Constants.gs to Apps Script
- [ ] Add CryptoService.gs to Apps Script
- [ ] Update AuthService.gs (replace)
- [ ] Update SheetRepository.gs (rename from `_Updated.gs`)
- [ ] Update ShiftService.gs (rename from `_Updated.gs`)
- [ ] Update AuditService.gs (rename from `_Updated.gs`)
- [ ] Update ZWebApp.gs (rename from `_Updated.gs`)
- [ ] Add index_login.html
- [ ] Add index_app.html (replaces old index.html)
- [ ] Run `setupTestUsers()` to create test accounts
- [ ] Deploy new web app
- [ ] Test login with test account
- [ ] Test shift tracking (start/end/break/lunch)
- [ ] Test logout
- [ ] Verify password hashing (check Users sheet)

---

## 🔄 Files Still Using Email (Need Updates)

If you have custom code using `Session.getActiveUser().getEmail()`:

### OLD CODE:
```javascript
var email = Session.getActiveUser().getEmail();
var ctx = AuthService.getCallerContext();
```

### NEW CODE:
```javascript
var sessionToken = ... // passed from frontend
var ctx = AuthService.getCallerContext(sessionToken);
var email = ctx.email;
```

**All backend functions now require `sessionToken` parameter** from the frontend.

---

## 💡 Usage Examples

### Create User Programmatically

```javascript
// In Apps Script
function addNewUser() {
  CryptoService.hashPassword("myPassword123");
  
  var result = CryptoService.hashPassword("myPassword123");
  
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  sheet.appendRow([
    "asmith",              // Username
    result.hash,           // PasswordHash
    result.salt,           // PasswordSalt
    "",                    // SessionToken
    "alice@company.com",   // Email
    "EMP003",              // Emp_ID
    "Senior Manager",      // Role
    "active",              // Status
    "manager"              // Permission
  ]);
}
```

### Reset User Password

```javascript
function resetUserPassword(username, newPassword) {
  var hash = CryptoService.hashPassword(newPassword);
  var sheet = SpreadsheetApp.getActive().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toLowerCase() === username.toLowerCase()) {
      sheet.getRange(i + 1, 2).setValue(hash.hash);      // PasswordHash
      sheet.getRange(i + 1, 3).setValue(hash.salt);      // PasswordSalt
      Logger.log("✅ Password reset for: " + username);
      return;
    }
  }
  Logger.log("❌ User not found: " + username);
}
```

### Verify Login Manually

```javascript
function testLogin(username, password) {
  try {
    var result = AuthService.login(username, password);
    Logger.log("✅ Login successful");
    Logger.log("Session: " + result.session_token);
    Logger.log("User: " + result.user.emp_name);
  } catch (e) {
    Logger.log("❌ Login failed: " + e.message);
  }
}
```

---

## 🎓 Key Code Changes

### API Endpoints — Session Token Required

#### Old (Email-based):
```javascript
function getCurrentShift() {
  var ctx = AuthService.getCallerContext();
  return ShiftService.getCurrentShift();
}
```

#### New (Token-based):
```javascript
function getCurrentShift(sessionToken) {
  AuthService.requireEmployee(sessionToken);
  return ShiftService.getCurrentShift(sessionToken);
}
```

### Frontend — Session Token in localStorage

```javascript
// Login
var sessionToken = response.session_token;
localStorage.setItem("ATS_SESSION", sessionToken);

// Every API call
var token = localStorage.getItem("ATS_SESSION");
google.script.run
  .withSuccessHandler(...)
  .getCurrentShift(token);

// Logout
localStorage.removeItem("ATS_SESSION");
```

---

## 🚨 Important Notes

1. **Don't Store Passwords Plaintext** — Always use `CryptoService.hashPassword()`
2. **Session Tokens Expire** — Implement token expiration if needed (not in v3.0)
3. **Update All APIs** — Any function called from frontend must accept `sessionToken`
4. **Test Thoroughly** — Test login, logout, shift tracking, session recovery
5. **Backup Data** — Always backup your Google Sheet before migration

---

## 📞 Support

If you encounter issues:

1. Check the **Apps Script Execution Log** (Ctrl+Enter)
2. Run **diagnostic functions**
3. Verify **Users sheet schema** matches exactly
4. Check **Constants.gs is deployed**
5. Verify **CryptoService.gs is deployed**

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Login page loads without errors
- [ ] Can login with test account
- [ ] Session token stored in localStorage
- [ ] Main app loads after login
- [ ] Can start/end shift
- [ ] Can start/end break
- [ ] Can start/end lunch
- [ ] Can log tasks
- [ ] Logout clears session
- [ ] Cannot access app without session token
- [ ] PasswordHash changes for different passwords
- [ ] SessionToken updates on each login

---

## 🎉 You're Done!

Your Attendance Tracking System is now using secure username/password authentication with proper session management.

**Next Steps**:
1. Monitor the **Audit Logs** sheet for all login/logout events
2. Set up password change policy for users
3. Configure **STALE_SHIFT_HOURS** and **STALE_ACTIVITY_HOURS** in Constants.gs
4. Train users on new login process

---

**Version**: ATS v3.0  
**Date**: 2025  
**Author**: Cloud Migration Guide
