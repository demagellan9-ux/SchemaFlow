# ⏱ Attendance Tracking System v3.0

**Complete Username-Password Authentication System**

A production-ready employee attendance tracker using Google Sheets + Google Apps Script with secure username/password authentication, session management, and comprehensive audit logging.

---

## 🎯 Features

### Core Functionality
- ✅ **Employee Clock In/Out** — Track shift start and end times
- ✅ **Break Management** — Log up to 2 breaks per shift
- ✅ **Lunch Tracking** — Track 1 lunch period per shift
- ✅ **Activity Logging** — Log tasks and activities during shifts
- ✅ **Duration Calculation** — Auto-calculate shift hours with break/lunch deductions
- ✅ **Overnight Shifts** — Support for shifts crossing midnight (e.g., 9PM → 7AM)

### Authentication & Security
- ✅ **Username/Password Login** — Secure credential-based authentication
- ✅ **Password Hashing** — SHA-256 with salt (NOT plaintext)
- ✅ **Session Tokens** — Secure 40-character tokens stored in localStorage
- ✅ **Permission Levels** — Admin, Manager, Employee role hierarchy
- ✅ **Audit Logging** — Track all logins, logouts, and system actions

### Admin Features
- ✅ **User Management** — Create/deactivate users programmatically
- ✅ **Role Management** — Assign admin/manager/employee permissions
- ✅ **Password Reset** — Reset user passwords via Apps Script
- ✅ **Shift Recovery** — 5-minute window to resume accidentally ended shifts

### User Experience
- ✅ **Responsive Design** — Works on desktop, tablet, mobile
- ✅ **Real-time Timer** — Live elapsed time display
- ✅ **Activity Tracking** — View current and historical activities
- ✅ **Error Prevention** — Smart button states based on shift status
- ✅ **Toast Notifications** — Friendly status messages

---

## 📊 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Google Sheets | Data storage (Employees, Users, Shifts, Activities, Audit) |
| **Backend** | Google Apps Script | Business logic, authentication, session management |
| **Frontend** | HTML5 + CSS3 + Vanilla JS | UI/UX, API communication |
| **Authentication** | SHA-256 + Session Tokens | Secure password hashing & session management |
| **Security** | TLS + Same-origin | HTTPS encryption + browser security |

---

## 🚀 Quick Start

### 1. Copy All Files to Google Apps Script

```
Apps Script Editor (ctrl+shift+p in Sheets)
├── Constants.gs ✨ NEW
├── CryptoService.gs ✨ NEW
├── AuthService.gs 🔄 UPDATED
├── SheetRepository.gs 🔄 UPDATED
├── ShiftService.gs 🔄 UPDATED
├── ShiftGuardService.gs ✅ SAME
├── ValidationService.gs ✅ SAME
├── AtsCache.gs ✅ SAME
├── AuditService.gs 🔄 UPDATED
├── ZWebApp.gs 🔄 UPDATED
├── SetupHelper.gs ✨ NEW
├── index_login.html ✨ NEW
└── index_app.html ✨ NEW
```

### 2. Create Users Sheet Schema

In Google Sheets, create a **Users** sheet with headers:

```
Username | PasswordHash | PasswordSalt | SessionToken | Email | Emp_ID | Role | Status | Permission
```

### 3. Create Demo Users

In Apps Script Console (Ctrl+Enter):

```javascript
setupDemoUsers();
```

This creates 3 test users:
- **admin** / admin123 (permission: admin)
- **manager** / manager123 (permission: manager)
- **employee** / employee123 (permission: employee)

### 4. Deploy Web App

```
Apps Script → Deploy → New deployment
Select: Web app
Execute as: Your email
Who has access: Anyone
```

Copy the deployment URL and visit it!

### 5. Login

Use test credentials:
- Username: `admin`
- Password: `admin123`

---

## 📁 File Structure

### Google Apps Script Files

#### Core Services
- **Constants.gs** — All configuration constants
- **CryptoService.gs** — Password hashing with SHA-256 + salt
- **AuthService.gs** — Login, logout, permission checking
- **SheetRepository.gs** — All sheet I/O operations
- **ShiftService.gs** — Shift/break/lunch logic
- **ShiftGuardService.gs** — Stale state detection & recovery
- **AuditService.gs** — Audit trail logging
- **ValidationService.gs** — Input validation
- **AtsCache.gs** — Per-user session caching
- **SetupHelper.gs** — User creation & setup utilities

#### Web App Files
- **ZWebApp.gs** — Public API endpoints (login, shifts, activities)
- **index_login.html** — Login form page
- **index_app.html** — Main tracker dashboard
- **Stylesheet** — CSS styles
- **Javascript.html** — Frontend JavaScript

---

## 🔐 Authentication System

### Password Flow

```
User enters: "password123"
                ↓
CryptoService.hashPassword("password123")
  ├─ Generate 32-char salt
  ├─ Combine: "password123" + salt
  ├─ SHA-256 hash
  └─ Return: { hash, salt }
                ↓
Store in Users sheet:
  ├─ PasswordHash column: hash value
  └─ PasswordSalt column: salt value
```

### Session Token Flow

```
Login successful
  ↓
Generate 40-char token: "a7b2c3d4e5f6g7h8i9j0..."
  ↓
Store in Users sheet SessionToken column
  ↓
Return to browser
  ↓
localStorage.setItem("ATS_SESSION", token)
  ↓
Include token in every API call:
  google.script.run.getCurrentShift(sessionToken)
```

### Permission Hierarchy

```
Employee < Manager < Admin
```

Users are checked against this hierarchy for access control.

---

## 📊 Google Sheets Schema

### Users Sheet (NEW)

| Column | Field | Type | Example |
|--------|-------|------|---------|
| 1 | Username | Text | `jsmith` |
| 2 | PasswordHash | Text | `a7b2c3d4...` |
| 3 | PasswordSalt | Text | `xyz123abc...` |
| 4 | SessionToken | Text | `session_token_here` |
| 5 | Email | Text | `john@company.com` |
| 6 | Emp_ID | Text | `EMP001` |
| 7 | Role | Text | `Admin` |
| 8 | Status | Text | `active` |
| 9 | Permission | Text | `admin` |

### Employees Sheet (Existing)

```
emp_id | emp_name | email | department | role | status | created_at | updated_at | permission_level
```

### Shifts Sheet (Existing)

```
shift_id | emp_id | date | start_time | end_time | total_hours | status
```

### Activities Sheet (Existing)

```
activity_id | shift_id | type | description | start_time | end_time | duration
```

### AuditLogs Sheet (Existing)

```
timestamp | user_email | action | target | metadata
```

---

## 🔄 API Reference

### Authentication

```javascript
// Login (public endpoint)
login(username, password)
  → { session_token, user }

// Logout (authenticated)
logout(sessionToken)
  → { success: true/false }

// Validate session
validateSession(sessionToken)
  → { valid: true/false }

// Get current user
getCurrentUser(sessionToken)
  → { username, email, emp_id, emp_name, role, permission }
```

### Shift Management

```javascript
// All require sessionToken

getCurrentShift(sessionToken)
  → { status, shift, activity, activities, summary }

startShift(sessionToken)
  → { status, shift, activity, activities }

endShift(sessionToken)
  → { status, summary { shift_id, start_time, end_time, duration, gross, deductions } }

getRecoverableShift(sessionToken)
  → { shift_id, secondsSinceEnd, recoverable, canStartNew }

resumeLastShift(sessionToken)
  → { status, shift, activity, activities }
```

### Break & Lunch

```javascript
startBreak(sessionToken)
endBreak(sessionToken)
startLunch(sessionToken)
endLunch(sessionToken)

// All return: { status, shift, activity, activities }
```

### Activities

```javascript
logTask(sessionToken, description)
  → { status, shift, activity, activities }
```

---

## 🛠️ User Management

### Create User (Apps Script Console)

```javascript
createUser(username, password, email, empID, role, permission)

// Example:
createUser("jsmith", "SecurePass123", "john@company.com", "EMP001", "Admin", "admin");
```

### Reset Password

```javascript
resetUserPassword(username, newPassword)

// Example:
resetUserPassword("jsmith", "NewPass456");
```

### Change Permission

```javascript
changeUserPermission(username, newPermission)

// Example:
changeUserPermission("jsmith", "manager");
```

### List All Users

```javascript
listAllUsers()
// Prints all users to log
```

### Deactivate User

```javascript
deactivateUser(username)
// User cannot login anymore
```

### Reactivate User

```javascript
reactivateUser(username)
// User can login again
```

---

## 🧪 Testing

### Test Login

```javascript
testLogin("admin", "admin123")
// Output: ✅ Login successful!
```

### Verify Setup

```javascript
verifySetup()
// Checks all sheets exist, services loaded, schema correct
```

### Create Demo Users

```javascript
setupDemoUsers()
// Creates admin, manager, employee test accounts
```

---

## 🔒 Security Features

### ✅ Password Security
- SHA-256 hashing with salt
- 32-character random salt per user
- Not plaintext storage
- Constant-time comparison (timing attack resistant)

### ✅ Session Management
- 40-character random tokens
- Stored in Users sheet + browser localStorage
- Validated on every API call
- Cleared on logout

### ✅ Permission Control
- 3-tier hierarchy: Employee → Manager → Admin
- Checked before sensitive operations
- Audit logged for all unauthorized attempts

### ✅ Audit Trail
- All logins logged with timestamp
- All logouts recorded
- Shift start/end tracked
- Unauthorized access attempts recorded

---

## 📱 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Firefox | ✅ Full | Fully supported |
| Safari | ✅ Full | iOS & macOS |
| Edge | ✅ Full | Chromium-based |
| IE 11 | ❌ No | Use modern browser |

### Device Support

- ✅ Desktop (1920x1080+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

---

## 🚨 Troubleshooting

### Login Issues

**Problem**: "Username or password is incorrect"
- Check username matches exactly (case-sensitive password, not username)
- Verify user exists in Users sheet
- Verify PasswordHash and PasswordSalt are filled

**Problem**: "Session expired"
- Clear browser cache: `localStorage.clear()`
- Try logging in again
- Check browser console for errors

### Deployment Issues

**Problem**: "CryptoService is not defined"
- Add `CryptoService.gs` file to Apps Script
- Save & reload

**Problem**: "Cannot find sheet"
- Create missing sheet in Google Sheets
- Verify sheet names match exactly

### Performance Issues

**Problem**: Slow shift loading
- Check for many rows in Activities sheet
- Clear old audit logs if > 10,000 rows
- Check internet connection

---

## 📈 Performance Optimization

### Caching
- Session cache: 30 minutes (per user)
- Active shift cache: TTL configurable
- Directory cache: 60 minutes

### Sheet Queries
- Uses `getRange(row, col, numRows, numCols)` instead of `getDataRange()`
- Reads only required columns
- Indexes on key columns (emp_id, shift_id)

### Locks
- 10-second timeout on critical operations
- Prevents race conditions in concurrent shifts
- Auto-releases on error

---

## 📚 Documentation

- **MIGRATION_GUIDE.md** — Step-by-step migration from email auth
- **IMPLEMENTATION_SUMMARY.md** — Architecture & code overview
- **README.md** — This file
- **Code comments** — Inline documentation in each `.gs` file

---

## 🎓 Example Workflows

### Employee Starting Shift

```
1. Navigate to web app URL
2. See login page
3. Enter username "employee"
4. Enter password "employee123"
5. Click "Sign In"
6. Dashboard loads
7. Click "▶ Start Shift"
8. Shift starts, status changes to "🟢 Working"
9. Timer shows elapsed time
10. Can now start breaks, lunch, or log tasks
```

### Admin Creating User

```
1. Open Google Apps Script Console (Ctrl+Enter)
2. Run: createUser("asmith", "SecurePass", "alice@co.com", "EMP005", "Manager", "manager")
3. Check Users sheet — new row appears with hashed password
4. New user can now login with username "asmith"
```

### Manager Resetting Employee Password

```
1. Apps Script Console (Ctrl+Enter)
2. Run: resetUserPassword("jsmith", "TempPass123")
3. Tell employee: "Your password has been reset to: TempPass123"
4. Employee can now login and change it
```

---

## 📞 Support & Issues

### Common Issues

1. **"No session found"** → Visit base URL without `?page=app` parameter
2. **"Incorrect password"** → Check caps lock, verify user exists
3. **"Cannot read property of undefined"** → Verify all `.gs` files deployed
4. **"Sheet not found"** → Create missing sheet in Google Sheets

### Debug Logging

Enable logging in Apps Script:

```javascript
Logger.log("DEBUG: " + JSON.stringify(data));
// View via Executions panel
```

### Check Execution Log

```
Apps Script Editor → Executions → View logs
```

---

## 🔄 Maintenance

### Weekly Tasks
- [ ] Review audit logs for suspicious activity
- [ ] Monitor error logs in execution history

### Monthly Tasks
- [ ] Archive old shifts (> 1 year)
- [ ] Review inactive users
- [ ] Backup Google Sheet

### Quarterly Tasks
- [ ] Update password policy
- [ ] Review permission changes
- [ ] Test disaster recovery

---

## 📋 Deployment Checklist

- [ ] All `.gs` files copied to Apps Script
- [ ] Users sheet created with correct schema
- [ ] Demo users created via `setupDemoUsers()`
- [ ] Web app deployed as "Anyone" access
- [ ] Login page loads without errors
- [ ] Can login with test credentials
- [ ] Can start/end shifts
- [ ] Can start/end breaks and lunch
- [ ] Can log tasks
- [ ] Logout works (clears session)
- [ ] Session expires when user deactivated
- [ ] Audit logs record all actions

---

## 🎉 Ready to Go!

Your Attendance Tracking System is ready for production use.

### Next Steps

1. **Create real users** — Use `createUser()` for each employee
2. **Train employees** — Show login and basic usage
3. **Monitor usage** — Check audit logs daily
4. **Gather feedback** — Improve based on user feedback
5. **Scale up** — Add more features as needed

---

## 📄 License & Attribution

This system is provided as-is for internal use.

---

## 📞 Quick Help

**Can't remember a function?**
```
Open SetupHelper.gs → See all user management functions
```

**Need to reset everything?**
```javascript
clearAllSessionTokens()  // Force all users to re-login
```

**Want to export user list?**
```javascript
exportUsersToLog()  // Prints to execution log
```

---

## 🚀 Version Info

- **Version**: 3.0
- **Release**: 2025
- **Status**: Production Ready
- **Type**: Full-featured attendance tracker with auth

---

**Built with ❤️ for enterprise attendance tracking**

For questions, refer to the documentation files or check the code comments.
