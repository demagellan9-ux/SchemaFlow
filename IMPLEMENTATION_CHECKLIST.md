# ✅ ATS v3.0 Implementation Checklist

**Complete step-by-step guide to transition from email-based to username-password authentication**

---

## 🎯 Pre-Implementation (Read These First)

- [ ] **Read README.md** — Overview of system
- [ ] **Read MIGRATION_GUIDE.md** — Understand what's changing
- [ ] **Read IMPLEMENTATION_SUMMARY.md** — Architecture & code structure
- [ ] **Backup Your Spreadsheet** — Critical! Use File → Make a copy

---

## 📊 Phase 1: Database Schema (10 minutes)

### Step 1.1: Create Users Sheet

- [ ] Open your Google Sheet
- [ ] Insert new sheet named **"Users"**
- [ ] Add headers in row 1:
  ```
  Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
  ```
  - Make sure headers are EXACTLY as shown (order matters!)
- [ ] Freeze row 1 (View → Freeze → 1 row)

### Step 1.2: Verify Other Sheets

- [ ] ✅ Employees sheet exists (with: emp_id, emp_name, email, department, role, status, created_at, updated_at, permission_level)
- [ ] ✅ Shifts sheet exists (with: shift_id, emp_id, date, start_time, end_time, total_hours, status)
- [ ] ✅ Activities sheet exists (with: activity_id, shift_id, type, description, start_time, end_time, duration)
- [ ] ✅ AuditLogs sheet exists (with: timestamp, user_email, action, target, metadata)

---

## 🔧 Phase 2: Google Apps Script Setup (15 minutes)

### Step 2.1: Open Apps Script Editor

- [ ] Open your Google Sheet
- [ ] Click **Extensions → Apps Script**
- [ ] You're now in the Apps Script Editor

### Step 2.2: Add New Files

**For EACH file below:**

1. Click **+ File → Create new → Script/HTML**
2. Name it exactly as shown
3. Delete default content
4. Copy-paste the complete file content
5. Click Save (Ctrl+S)

#### Add These Google Apps Script Files (.gs)

- [ ] **Constants.gs** — Copy from `Constants.gs` file
  - This file has all the configuration
  - Must be added first!

- [ ] **CryptoService.gs** — Copy from `CryptoService.gs` file
  - Password hashing functionality
  - Required before AuthService

- [ ] **AuthService.gs** — Copy from `AuthService.gs` file
  - Username/password login logic
  - Replaces old email-based auth

- [ ] **SheetRepository.gs** — Copy from `SheetRepository_Updated.gs` file
  - All sheet I/O operations
  - Updated for Users sheet schema
  - **IMPORTANT**: Rename to `SheetRepository.gs` (remove "_Updated" suffix)

- [ ] **ShiftService.gs** — Copy from `ShiftService_Updated.gs` file
  - Shift management logic
  - Now accepts sessionToken parameter
  - **IMPORTANT**: Rename to `ShiftService.gs` (remove "_Updated" suffix)

- [ ] **AuditService.gs** — Copy from `AuditService_Updated.gs` file
  - Audit logging with login/logout
  - **IMPORTANT**: Rename to `AuditService.gs` (remove "_Updated" suffix)

- [ ] **ZWebApp.gs** — Copy from `ZWebApp_Updated.gs` file
  - Public API endpoints
  - Login/logout routes
  - **IMPORTANT**: Rename to `ZWebApp.gs` (remove "_Updated" suffix)

- [ ] **SetupHelper.gs** — Copy from `SetupHelper.gs` file
  - User management utilities
  - Run setup functions from here

#### Keep These Files (No Changes)

- [ ] ✅ **ShiftGuardService.gs** — No changes
- [ ] ✅ **ValidationService.gs** — No changes
- [ ] ✅ **AtsCache.gs** — No changes (if you have it)

#### Add These HTML Files

- [ ] **index_login.html** — Copy from `index_login.html` file
  - Login form page
  - Users see this first

- [ ] **index_app.html** — Copy from `index_app.html` file
  - Main tracker dashboard
  - This is the main app

#### Update/Keep CSS & JS Files

- [ ] ✅ **Stylesheet** (or `styles.css`) — Keep existing
  - No changes needed
  - `index_app.html` includes it with `<?!= include('Stylesheet'); ?>`

- [ ] ✅ **Javascript** (or `script.js`) — Keep existing
  - No changes needed
  - `index_app.html` includes it with `<?!= include('Javascript'); ?>`

### Step 2.3: Verify All Files Are Present

In Apps Script Editor, check the left sidebar. You should see:

```
✅ Constants.gs
✅ CryptoService.gs
✅ AuthService.gs
✅ SheetRepository.gs
✅ ShiftService.gs
✅ ShiftGuardService.gs
✅ ValidationService.gs
✅ AtsCache.gs (if you have it)
✅ AuditService.gs
✅ ZWebApp.gs
✅ SetupHelper.gs
✅ index_login.html
✅ index_app.html
✅ Stylesheet
✅ Javascript
```

**Don't forget to save each file!** (Ctrl+S)

---

## 🚀 Phase 3: Deployment (5 minutes)

### Step 3.1: Deploy as Web App

- [ ] In Apps Script Editor, click **Deploy** (top right)
- [ ] Click **+ New deployment**
- [ ] In "Select type" dropdown, choose **Web app**
- [ ] Set:
  - **Execute as**: Your email address
  - **Who has access**: Anyone
- [ ] Click **Deploy**
- [ ] A dialog appears with your deployment URL
- [ ] **Copy the URL** (you'll need it)
- [ ] Click **Close**

### Step 3.2: Test Deployment

- [ ] Paste your deployment URL in a new browser tab
- [ ] Wait 5-10 seconds for the page to load
- [ ] You should see the **Login Page** with:
  - ⏱ Logo
  - "Attendance Tracker" title
  - Username input field
  - Password input field
  - "Sign In" button

**If you see the login page, deployment is working!** ✅

---

## 👥 Phase 4: User Setup (10 minutes)

### Step 4.1: Create Demo Users

- [ ] In Apps Script Editor, open **SetupHelper.gs**
- [ ] Click somewhere in the file
- [ ] Press **Ctrl+Enter** (or click Run button)
- [ ] A popup asks "Select function to run" → Choose **setupDemoUsers**
- [ ] Click **Run**
- [ ] Wait for execution to complete
- [ ] Check the **Execution log** (bottom panel)
- [ ] Should see: `✅ Demo setup complete!`

### Step 4.2: Verify Users Were Created

- [ ] Go back to your Google Sheet
- [ ] Click the **Users** sheet
- [ ] You should see 3 new rows:
  ```
  admin     | [hash]        | [salt]       | [empty]  | admin@company.com     | EMP001 | System Admin   | active | admin
  manager   | [hash]        | [salt]       | [empty]  | manager@company.com   | EMP002 | Store Manager  | active | manager
  employee  | [hash]        | [salt]       | [empty]  | employee@company.com  | EMP003 | Employee       | active | employee
  ```
  - Hashes will be long strings (SHA-256)
  - SessionToken column should be empty
  - DO NOT edit these fields manually!

- [ ] ✅ If you see these 3 users, setup is correct!

### Step 4.3: Test Demo Login

- [ ] Go to your deployment URL
- [ ] Enter username: **admin**
- [ ] Enter password: **admin123**
- [ ] Click **Sign In**
- [ ] Wait 2-3 seconds...
- [ ] Should see the **Main Dashboard** with:
  - "⏱ ATS" logo in header
  - Your name and email
  - "⭕ Off Shift" status
  - "▶ Start Shift" button

**If you see the main dashboard, authentication is working!** ✅

### Step 4.4: Test Logout

- [ ] Click **🚪 Logout** button (top right)
- [ ] Confirm logout
- [ ] Should be back on login page

---

## 🎯 Phase 5: Functional Testing (15 minutes)

### Test Scenario 1: Start & End Shift

- [ ] Login as: **employee** / **employee123**
- [ ] Click **▶ Start Shift**
- [ ] Status changes to **🟢 Working**
- [ ] Timer shows elapsed time (updates every second)
- [ ] Click **⏹ End Shift**
- [ ] Confirm
- [ ] See shift summary with:
  - Start time
  - End time
  - Duration
  - Net hours (gross minus breaks)
- [ ] ✅ Shift tracking works!

### Test Scenario 2: Breaks

- [ ] Start a new shift
- [ ] Click **Start Break** (under ☕ Break)
- [ ] Status changes to **🟡 On Break**
- [ ] Click **End Break**
- [ ] Status changes back to **🟢 Working**
- [ ] ✅ Break tracking works!

### Test Scenario 3: Lunch

- [ ] With active shift, click **Start Lunch** (under 🍱 Lunch)
- [ ] Status changes to **🟠 On Lunch**
- [ ] Click **End Lunch**
- [ ] Status changes back to **🟢 Working**
- [ ] Try to start lunch again — should be disabled (only 1 per shift)
- [ ] ✅ Lunch tracking works!

### Test Scenario 4: Task Logging

- [ ] With active shift, scroll to **Log Task** card
- [ ] Enter a task description: "Email client"
- [ ] Click **➕ Log**
- [ ] Task appears in **Activity Log** table below
- [ ] End shift
- [ ] Task duration should show as "—" (tasks don't have end times)
- [ ] ✅ Task logging works!

### Test Scenario 5: Permission Levels

- [ ] Logout
- [ ] Try different users:
  - **admin** / **admin123** (should see all features)
  - **manager** / **manager123** (should see all features)
  - **employee** / **employee123** (should see all features)
- [ ] All should work the same (no permission restrictions in tracker UI)
- [ ] ✅ Permission system works!

---

## 🛡️ Phase 6: Security Verification (5 minutes)

### Step 6.1: Test Password Verification

- [ ] Login as **admin** with wrong password: **wrong123**
- [ ] Should see error: "Username or password is incorrect"
- [ ] Try again with correct password: **admin123**
- [ ] Should login successfully
- [ ] ✅ Password verification works!

### Step 6.2: Test Session Validation

- [ ] Open Browser DevTools (F12)
- [ ] Go to **Application → Local Storage**
- [ ] Find `ATS_SESSION` key
- [ ] Should contain a long token (40 characters)
- [ ] Close browser completely
- [ ] Reopen deployment URL
- [ ] Session should be cleared (back on login page)
- [ ] ✅ Session management works!

### Step 6.3: Check Password Hashing

- [ ] In Google Sheet, open **Users** sheet
- [ ] Look at PasswordHash column for any user
- [ ] Should be a long hex string (64 chars for SHA-256)
- [ ] Should NOT be the plaintext password
- [ ] Should be different for each user (even if same password)
- [ ] ✅ Password hashing works!

### Step 6.4: Verify Audit Logs

- [ ] Open **AuditLogs** sheet in Google Sheets
- [ ] Should see entries like:
  ```
  2025-01-15 10:30:45 | employee@company.com | LOGIN | employee@company.com | 
  2025-01-15 10:30:50 | employee@company.com | SHIFT_START | SH_abc123 | {"emp_id": "EMP003"}
  ```
- [ ] Timestamps should match your actions
- [ ] ✅ Audit logging works!

---

## 📝 Phase 7: Final Checklist

### Critical Checks

- [ ] All `.gs` files added to Apps Script (check sidebar)
- [ ] Users sheet has correct schema (9 columns exactly)
- [ ] Demo users created in Users sheet (3 rows)
- [ ] Web app deployed as "Anyone" access
- [ ] Login page loads without errors
- [ ] Can login with all 3 demo users
- [ ] Can start/end shifts
- [ ] Can start/end breaks
- [ ] Can start/end lunch
- [ ] Can log tasks
- [ ] Logout works (clears session)
- [ ] Passwords are hashed (not plaintext)
- [ ] Audit logs record actions
- [ ] Session tokens stored in localStorage

### User Experience Checks

- [ ] Login page is clean and responsive
- [ ] Main dashboard loads quickly
- [ ] Timer updates in real-time
- [ ] Buttons enable/disable appropriately
- [ ] Toast notifications appear
- [ ] Mobile layout works on phone

### Data Integrity Checks

- [ ] Shifts recorded correctly in Shifts sheet
- [ ] Activities recorded in Activities sheet
- [ ] Break/lunch durations calculated
- [ ] Overnight shifts handled correctly
- [ ] Shift hours deduct breaks/lunches
- [ ] Audit trail complete

---

## 🎉 Phase 8: Post-Implementation

### Backup & Documentation

- [ ] [ ] Backup your Google Sheet (File → Make a copy)
- [ ] [ ] Save all `.gs` files locally (for backup)
- [ ] [ ] Document your deployment URL
- [ ] [ ] Document admin user credentials
- [ ] [ ] Keep README.md & MIGRATION_GUIDE.md files

### Staff Training

- [ ] [ ] Show employees how to login
- [ ] [ ] Demonstrate start/end shift process
- [ ] [ ] Explain break & lunch tracking
- [ ] [ ] Show how to logout
- [ ] [ ] Collect feedback

### Monitoring

- [ ] [ ] Check AuditLogs daily (first week)
- [ ] [ ] Verify shifts are recorded correctly
- [ ] [ ] Monitor for errors in execution log
- [ ] [ ] Check for unusual login attempts

### Maintenance

- [ ] [ ] Schedule weekly backup of Google Sheet
- [ ] [ ] Archive old audit logs monthly (> 10,000 rows)
- [ ] [ ] Update user passwords quarterly
- [ ] [ ] Review permission levels quarterly

---

## 🚨 Troubleshooting During Implementation

### "I see a blank page"
- [ ] Wait 10 seconds (first load is slow)
- [ ] Hard refresh (Ctrl+F5)
- [ ] Check browser console for JavaScript errors (F12)
- [ ] Verify all `.gs` files saved (green checkmark in editor)

### "CryptoService is not defined"
- [ ] Verify `CryptoService.gs` is in Apps Script sidebar
- [ ] Make sure it's saved (Ctrl+S)
- [ ] Refresh browser
- [ ] Try running `verifySetup()` from SetupHelper

### "Cannot find Users sheet"
- [ ] Check if Users sheet exists in Google Sheets
- [ ] Verify column A has "Username" header
- [ ] Make sure sheet name is exactly "Users" (case-sensitive)
- [ ] Refresh the page

### "Login fails with correct password"
- [ ] Verify user exists in Users sheet
- [ ] Check PasswordHash is not empty
- [ ] Check PasswordSalt is not empty
- [ ] Try running `testLogin("admin", "admin123")`  in Apps Script console

### "Can't see main dashboard after login"
- [ ] Check browser console for errors (F12)
- [ ] Verify `index_app.html` exists in Apps Script
- [ ] Check deployment has "Anyone" access
- [ ] Try logging out and logging back in

### "Session expired error"
- [ ] Clear browser localStorage: `localStorage.clear()` in console (F12)
- [ ] Try logging in again
- [ ] Check Users sheet SessionToken column updates

---

## ✅ Success Criteria

You're done when:

- ✅ Login page displays correctly
- ✅ Can login with 3 demo users
- ✅ Dashboard shows shift controls
- ✅ Can start/end shift
- ✅ Can start/end break (max 2 per shift)
- ✅ Can start/end lunch (max 1 per shift)
- ✅ Can log tasks
- ✅ Logout works
- ✅ Passwords are hashed
- ✅ Audit logs record actions
- ✅ Session tokens work
- ✅ No errors in execution log
- ✅ All 5 sheets exist (Employees, Users, Shifts, Activities, AuditLogs)

---

## 📞 Need Help?

1. **Check the logs**: Apps Script → Executions → View detailed logs
2. **Read error messages**: They usually tell you exactly what's wrong
3. **Verify all files are present**: Check the sidebar for all `.gs` and `.html` files
4. **Test functions individually**:
   ```javascript
   // In Apps Script console:
   verifySetup()          // Check everything is deployed
   testLogin("admin", "admin123")  // Test auth
   listAllUsers()         // See all users
   ```
5. **Reference the docs**: README.md, MIGRATION_GUIDE.md, IMPLEMENTATION_SUMMARY.md

---

## 🎓 What's Next?

After successful implementation:

1. **Create real users** using `createUser()` function
2. **Train your team** on the new system
3. **Monitor usage** via audit logs
4. **Gather feedback** from employees
5. **Improve incrementally** based on feedback

---

## 📚 Reference Files

Keep these nearby during implementation:

- **README.md** — System overview
- **MIGRATION_GUIDE.md** — What changed from email auth
- **IMPLEMENTATION_SUMMARY.md** — Architecture details
- **Code comments** — Check `.gs` files for inline docs

---

**Version**: ATS v3.0  
**Date**: 2025  
**Status**: Complete & Ready

**You've got this!** 🚀
