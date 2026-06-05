# Manual Test Cases

Use this checklist to manually verify the full application flow. The database starts clean — no seed data.

---

## 1. Landing Page

- [ ] Page loads with warm off-white (`#FFF8F0`) background
- [ ] Stats section shows "0" for all values (empty database)
- [ ] "Apply for Verification" button navigates to application form
- [ ] "Check Application Status" button navigates to status tracker
- [ ] Categories grid shows all 8 trades with emoji icons
- [ ] Footer renders with brand, links, and hidden lock icon

## 2. Application Form — Step-by-Step

### App Handoff / Sign In
- [ ] Worker taps "Get verified" from the Flutter worker profile
- [ ] Portal opens with `?handoff=...` and pre-fills known profile details
- [ ] If handoff fails, portal asks the worker to sign in before submission
- [ ] Submission is blocked if no linked `worker_id` is available

### Step 1: Personal Info
- [ ] Cannot proceed without full name, phone, email, DOB, gender
- [ ] Validation errors appear inline for missing fields
- [ ] "Next" advances to Step 2 only when all fields are valid

### Step 2: Identity Documents
- [ ] Cannot proceed without ID front and ID back uploads
- [ ] File upload accepts images (JPEG, PNG) and shows preview
- [ ] Selfie is optional but noted as recommended

### Step 3: Professional Info
- [ ] Trade category dropdown lists all 8 trades
- [ ] Region dropdown lists all 10 Ghana regions
- [ ] Cannot proceed without trade, region, and city

### Step 4: Credentials
- [ ] Can add multiple certification files
- [ ] Can add training documents
- [ ] Can add portfolio images
- [ ] All are optional

### Step 5: References
- [ ] At least one reference row is shown by default
- [ ] Can add additional reference rows with "+" button
- [ ] Can remove reference rows
- [ ] References are optional

### Step 6: Review & Submit
- [ ] All entered data is displayed for review
- [ ] Must check "I confirm the information is accurate"
- [ ] Submit button shows progress: "Creating application..." then "Uploading document 1 of N..."
- [ ] On success: confirmation page shows the application number
- [ ] Supabase row includes the worker's real `worker_id`

## 3. Status Tracker

### Search by Application Number
- [ ] Enter the application number from the confirmation page
- [ ] Click "Track Application" or press Enter
- [ ] Application card appears with correct details and "Pending" badge

### Search by Phone Number
- [ ] Enter the phone number used in the application
- [ ] Application found with the same result

### Not Found
- [ ] Searching for a non-existent number shows "Application Not Found" card
- [ ] "Apply for Verification" link works

### Live Status Updates
- [ ] Green "Live" dot appears next to the status badge after search
- [ ] Open admin portal in a second browser tab
- [ ] Approve the application from admin side
- [ ] Status page auto-updates: green "Your status was just updated!" banner appears
- [ ] Status badge changes to "Approved"
- [ ] Congratulations card with shield icon appears

### Status-Specific Displays
- [ ] **Pending:** "Awaiting Review" message with clock icon
- [ ] **Under Review:** "Currently Under Review" message
- [ ] **Approved:** Celebration card with verification level
- [ ] **Rejected:** Red card with rejection reason + "Re-apply" button
- [ ] **More Info Needed:** Gold card with admin's message + "Upload Documents" button

### Refresh Button
- [ ] Clicking refresh re-fetches data from Supabase
- [ ] "Last checked" timestamp updates

## 4. Admin Dashboard

### Access
- [ ] "Admin Portal" button in nav works
- [ ] Triple-clicking footer brand logo navigates to admin
- [ ] Clicking hidden lock icon in footer navigates to admin
- [ ] Direct URL `#/portal/admin` works

### Dashboard Overview
- [ ] Stats cards show correct counts (initially 1 after submitting one application)
- [ ] Recent applications table shows the submitted application
- [ ] Clicking "View" on an application navigates to detail page
- [ ] Sidebar navigation works: Dashboard, All Applications, Pending, etc.

## 5. Application Detail (Admin)

### Profile & Professional Info
- [ ] Applicant name, phone, email, location displayed
- [ ] Trade, experience, submitted date shown
- [ ] Confidence score bar rendered
- [ ] Fraud indicators shown if any

### Documents
- [ ] Uploaded images appear as clickable thumbnails
- [ ] Clicking an image opens a lightbox preview
- [ ] PDFs show a PDF icon with external link
- [ ] "No documents uploaded" message if none exist

### References
- [ ] Reference names, relationships, phone numbers displayed

### Admin Actions
- [ ] **Mark as Under Review** button appears for pending applications
- [ ] **Approve** button opens modal with level selection (identity / professional / premium)
- [ ] **Reject** button opens modal with reason dropdown + free text
- [ ] **Request Info** button opens modal with message field

### Approve Flow
- [ ] Select a verification level
- [ ] Add optional admin notes
- [ ] Click "Approve Application"
- [ ] Status badge changes to "Approved" immediately
- [ ] Green "Approved" banner appears
- [ ] Audit log shows "Approved" entry with timestamp
- [ ] "Status updated" flash badge appears briefly
- [ ] The linked `workers.is_verified` value changes to `true`
- [ ] Flutter profile shows the verified badge after profile refresh

### Reject Flow
- [ ] Select a reason from dropdown
- [ ] Add optional additional context
- [ ] Click "Reject Application"
- [ ] Status badge changes to "Rejected"
- [ ] Red "Rejected" banner with reason appears
- [ ] Audit log updated

### Request More Info Flow
- [ ] Type a message to the applicant
- [ ] Optionally list required documents
- [ ] Click "Send Request"
- [ ] Status changes to "More Info Needed"
- [ ] Gold banner appears

### Realtime
- [ ] Green "Live" indicator in header
- [ ] Open the same application in a second admin tab
- [ ] Approve from one tab — the other tab updates automatically

### Audit Trail
- [ ] All actions appear chronologically
- [ ] Each entry shows: icon, label, admin name, timestamp
- [ ] Notes are displayed when present

## 6. Applications Table

### Filtering
- [ ] Status filter works: Pending, Under Review, Approved, Rejected, More Info
- [ ] Trade category filter works
- [ ] Region filter works
- [ ] Search by name or application number works
- [ ] "Clear filters" resets all filters

### Table
- [ ] Application count updates based on filters
- [ ] Clicking a row navigates to application detail
- [ ] Status badges are color-coded correctly

## 7. Audit Log Page

- [ ] All admin actions appear in reverse chronological order
- [ ] Filter by action type works
- [ ] Each entry shows admin name, action, notes, timestamp

## 8. Hidden Admin Access

- [ ] No "Admin Portal" button appears in the public navigation
- [ ] Triple-click footer brand logo opens admin portal
- [ ] Hovering near copyright text reveals a lock icon at ~40% opacity
- [ ] Clicking the lock icon opens admin portal
- [ ] Lock icon is keyboard-accessible (Tab to it, press Enter)
- [ ] Navigating to `#/portal/admin` directly works
- [ ] Sign Out button in admin sidebar navigates back to public home

## 9. Error Handling

- [ ] Submitting an empty search shows inline error
- [ ] Phone search works even with spaces/dashes in the number
- [ ] Admin action failure (approve/reject/request info) shows red error banner inside modal
- [ ] "Mark as Under Review" failure shows a temporary error message
- [ ] Network errors show user-friendly messages, not raw error objects
- [ ] Error boundary catches rendering errors and shows retry button

## 10. Responsive Design

- [ ] Landing page works on mobile (single column hero, stacked stats)
- [ ] Application form adapts to narrow screens
- [ ] Hamburger menu appears on mobile with Home, Apply, Check Status
- [ ] Mobile menu items navigate correctly and close the menu
- [ ] Admin sidebar collapses on mobile
- [ ] Status tracker is usable on mobile
- [ ] All buttons and inputs are touch-friendly (min 44px tap targets)
