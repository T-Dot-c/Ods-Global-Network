# Page Brief: Unauthorized (`/unauthorized`)

> **DOCUMENT TYPE**: Legacy Analysis / Page Specification (Batch 1)  
> **TARGET ROUTE**: `/unauthorized`  
> **SOURCE FILE**: [`resource/client/src/components/Unauthorized.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Unauthorized.tsx#L1-L11)  
> **ROUTE WIRING**: [`resource/client/src/App.tsx:L182`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/App.tsx#L182) & [`resource/client/src/components/Dashbords/PrivateRoute.tsx:L17`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Dashbords/PrivateRoute.tsx#L17)  
> **AUDIT DATE**: 2026-10-05

---

### 1. Identity
- **Route**: `/unauthorized` (configured in [`resource/client/src/App.tsx:L182`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/App.tsx#L182)).
- **Legacy File Path**: `resource/client/src/components/Unauthorized.tsx`.
- **Access Level**: Public route; reached when any authenticated user attempts to access a protected dashboard or resource beyond their assigned permissions.
- **Arrival Points**: Dispatched by `PrivateRoute.tsx` when a logged-in user's role does not match `requiredRole` (e.g. customer attempting to reach `/admin-dashboard` or `/admin/user-lists`).

---

### 2. Purpose
Informs a logged-in user that their current authorization credentials do not grant them permission to view or interact with the requested view or admin resource.

---

### 3. Visible Content (Word-for-Word Copy)
*All user-facing strings copied verbatim from [`Unauthorized.tsx:L3-L6`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Unauthorized.tsx#L3-L6):*

- **Heading**: `"Unauthorized"`
- **Message Body**: `"You do not have permission to view this page."`

*(Note: The page has zero buttons, zero links, zero headers, zero footers, and zero navigation prompts).*

---

### 4. Fields and Rules
- **Input Fields**: None. Purely static display component.

---

### 5. States and Flows
1. **Initial / Only State**: Displays a raw centered `div` with a red header and text message on a blank background:
   ```html
   <div class="text-center p-10">
     <h1 class="text-3xl font-bold text-red-600">Unauthorized</h1>
     <p class="text-lg mt-2">You do not have permission to view this page.</p>
   </div>
   ```
2. **Dead-End Condition**: The user is trapped on this screen without a "Go to Home", "Back to My Dashboard", or "Sign Out" button. The only escape is using the browser back button or typing a new URL manually.

---

### 6. Data and Backend
- **Endpoint**: None. Does not make any HTTP requests.
- **Client Route Guard ([`resource/client/src/components/Dashbords/PrivateRoute.tsx`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/client/src/components/Dashbords/PrivateRoute.tsx#L1-L22))**:
  - Checks if user is authenticated; if not, navigates to `/login`.
  - Checks if `requiredRole` matches `user.role`; if not, navigates to `/unauthorized`.

---

### 7. Dependencies
- **External Dependencies**: None.
- **Styling**: Tailwind utility classes (`text-center p-10 text-3xl font-bold text-red-600 text-lg mt-2`).

---

### 8. Security Observations (Scope Section 10 & Directive §8 / §17)
1. **Proper RBAC Enforcement Indicator**: Serves an essential role in preventing horizontal or vertical privilege escalation at the client UI routing layer.
2. **Missing Security Information**: Does not log or alert administrators of attempted unauthorized access to sensitive administrative routes.
3. **Session Trapping**: By failing to provide a clear logout or dashboard recovery link, confused users may assume the entire application is broken.

---

### 9. Scope Mapping
- **Scope Document**: [`KPIs & SCOPES ODS GLOBAL NET .txt`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/resource/KPIs%20&%20SCOPES%20ODS%20GLOBAL%20NET%20.txt#L141-L151)
  - **Section 10 (Security)**: Explicitly mandates `"Role-based access control"`.
- **Verdict**: Direct match for RBAC route protection error handling.

---

### 10. Gaps and Conflicts
- **Brand Standards**: Lacks ODS brand aesthetics, luxury colors (`#0F285B` Deep Navy, `#BE9B49` Gold), background textures, and typography.
- **Usability Gaps**: Missing recovery call-to-actions ("Return to Dashboard", "Switch Account", "Contact Support").

---

### 11. Current State in Modern Codebase
- **Frontend**: In the current modern codebase ([`Frontend/src/App.tsx:L83-L92`](file:///d:/Ods%20Global/Source%20Code/Ods-Global-Network/Frontend/src/App.tsx#L83-L92)), role-based protection is implemented by redirecting unauthorized attempts back to the user's assigned dashboard:
  ```typescript
  if (user.role !== requiredRole) {
    setCurrentView(ROLE_TO_DASHBOARD[user.role]);
    return null;
  }
  ```
  Consequently, an unauthorized user is gracefully kept in their own permitted portal rather than stranded on a dead-end error page.
- **Backend**: Protected backend endpoints return HTTP 401 or 403 JSON payloads.

---

### 12. Suggested Bucket & Rationale
- **Suggested Bucket**: **Adapt** (or integrate into standard layout as an error boundary)
- **One-Line Reason**: Essential for comprehensive RBAC defense-in-depth, but should be built as a polished ODS-branded 403 Forbidden state with safe return-to-dashboard and sign-out actions, rather than an isolated dead-end route.
