# Security Vulnerabilities Detailed Findings Report

This report catalogs the exact findings from the static code security review of the saFeConnect codebase.

## 🔧 Backend Findings (FastAPI)

### [SEC-B01] Wildcard CORS Allow Origins Configured
- **Severity**: `Low`
- **Component Layer**: API Gateway / Middleware
- **Description**: CORSMiddleware allow_origins is set to ['*'], which allows any web page to request resources from the API.
- **Security Impact**: Low - Client-side scripts on arbitrary domains can execute unauthorized cross-origin requests.
- **Remediation**: Restrict allowed origins to trusted domains, e.g., using environment variables or a specific domains whitelist.

### [SEC-B02] Hardcoded JWT Secret Key fallback in Server Configuration
- **Severity**: `Low`
- **Component Layer**: Cryptography / Auth
- **Description**: JWT_SECRET is hardcoded in server.py config parameters.
- **Security Impact**: Low - In case environment variables fail to load, a static fallback is used which could be leaked in repository history.
- **Remediation**: Remove hardcoded fallback and strictly require os.environ['JWT_SECRET']. Raise startup error if not found.

### [SEC-B03] Lack of Sensitive PII Data Masking in logs
- **Severity**: `Low`
- **Component Layer**: Logging & Auditing
- **Description**: System logging does not perform automated regex sanitization to mask email/phone/password inputs from logs.
- **Security Impact**: Low - Accidental leakage of user phone numbers or emails in server output logs.
- **Remediation**: Implement custom log filters or middleware to intercept and mask sensitive payload fields before printing.

### [SEC-B04] Missing API Throttling & Rate Limiter
- **Severity**: `Low`
- **Component Layer**: Rate Limiting
- **Description**: FastAPI does not configure SlowAPI or similar throttling libraries on sensitive auth or travel endpoints.
- **Security Impact**: Low - Vulnerability to credential stuffing or brute-forcing of API tokens.
- **Remediation**: Integrate 'slowapi' middleware and configure limit decorators (e.g. 5 requests/minute on login/signup).

### [SEC-B05] Excessively Long JWT Token Expiration Validity
- **Severity**: `Low`
- **Component Layer**: Auth / Session
- **Description**: JWT session tokens are configured to remain valid for 30 consecutive days.
- **Security Impact**: Low - Compromised tokens remain authorized for an extended duration, increasing window of opportunity.
- **Remediation**: Reduce token TTL to 1-2 hours and introduce Refresh Token rotation patterns for persistent user login.

### [SEC-B06] Non-configurable Bcrypt Salt Work Factor
- **Severity**: `Low`
- **Component Layer**: Cryptography / Passwords
- **Description**: Password hashing relies on default gensalt work factor (12 rounds) which cannot be dynamically configured.
- **Security Impact**: Low - Inability to scale hashing complexity up or down based on security policies or hardware upgrades.
- **Remediation**: Expose the work factor parameter as an environment variable configuration (e.g., BCRYPT_ROUNDS=12).

### [SEC-B07] Missing Content-Security-Policy (CSP) headers
- **Severity**: `Low`
- **Component Layer**: HTTP Security Headers
- **Description**: The backend FastAPI server does not automatically append the 'Content-Security-Policy' HTTP header in responses.
- **Security Impact**: Low - Missing layer of defence against Cross-Site Scripting (XSS) injection vectors.
- **Remediation**: Use FastAPI middleware to add basic security headers such as 'Content-Security-Policy: default-src 'self''.

### [SEC-B08] Missing X-Frame-Options Header on API Endpoints
- **Severity**: `Low`
- **Component Layer**: HTTP Security Headers
- **Description**: API responses lack 'X-Frame-Options: DENY' and 'X-Content-Type-Options: nosniff' header parameters.
- **Security Impact**: Low - Potential for frontend wrapper framing clickjacking attacks in legacy browsers.
- **Remediation**: Incorporate secure header configuration in FastAPI middleware parameters to inject nosniff and DENY.

### [SEC-B09] Absence of Strong Password Complexity Enforcement
- **Severity**: `Low`
- **Component Layer**: Authentication Policy
- **Description**: The Signup schema validates email formats but accepts arbitrary strings as passwords without character entropy checks.
- **Security Impact**: Low - Users can register simple passwords like 'password123', leading to easy compromise.
- **Remediation**: Add regex validation in SignupReq model ensuring passwords contain uppercase, lowercase, numbers, and special symbols.

### [SEC-B10] Unauthenticated Read Exposure on Guides Catalog
- **Severity**: `Low`
- **Component Layer**: Access Control
- **Description**: The `/api/guides` and `/api/guides/locations` endpoints do not check for valid JWT headers.
- **Security Impact**: Low - Unauthenticated crawlers can parse and copy travel guides data and profile info.
- **Remediation**: Apply get_current_user Dependency injection to the guides directory list handler to authenticate requests.

### [SEC-B11] Potential for Verbose Exception Trace Leakage
- **Severity**: `Low`
- **Component Layer**: Error Handling
- **Description**: Server custom error decorators do not fully mask system level database or motor network connection failures.
- **Security Impact**: Low - Server runtime stack trace outputs could expose DB table variables under query failures.
- **Remediation**: Ensure all unhandled exceptions are caught and replaced with generic 500 error responses in production environments.

### [SEC-B12] Lack of Explicit MongoDB Query Timeout Limits
- **Severity**: `Low`
- **Component Layer**: Database / Resiliency
- **Description**: Motor MongoDB queries do not specify max_time_ms limits on data retrieval cursors.
- **Security Impact**: Low - Slow queries on unindexed fields can tie up backend database sockets indefinitely, triggering resource exhaustion.
- **Remediation**: Pass max_time_ms parameters (e.g. 5000ms) to MongoDB queries to drop stuck requests automatically.

### [SEC-B13] Use of Plaintext Connection Strings in .env
- **Severity**: `Low`
- **Component Layer**: Secrets Management
- **Description**: MongoDB credentials are read directly as a raw connection string from the local environment configurations.
- **Security Impact**: Low - Compromise of config logs or runner environments exposes database administrator credentials.
- **Remediation**: In production, query cloud secret stores (like AWS Secrets Manager / Azure Vault) dynamically on boot.

### [SEC-B14] Use of Bcrypt Hashing Over Argon2id Standards
- **Severity**: `Low`
- **Component Layer**: Cryptography / Hashing
- **Description**: System relies on Bcrypt for credential safety. Although secure, Bcrypt is vulnerable to GPU-accelerated brute forcing compared to Argon2id.
- **Security Impact**: Low - Slightly lower resistance to offline custom hash cracking compared to Argon2 memory-hard algorithms.
- **Remediation**: Upgrade hashing architecture to utilize Argon2id algorithm (e.g., using passlib with argon2 backend).


## 🌐 Frontend Findings (Expo/React Native)

### [SEC-F01] PII & JWT Tokens Stored in LocalStorage / Async Storage
- **Severity**: `Low`
- **Component Layer**: Client-side Storage
- **Description**: User sessions and authentication tokens are cached using basic Expo AsyncStorage or web local storage API.
- **Security Impact**: Low - Susceptible to unauthorized extraction in the event of an XSS (Cross-Site Scripting) compromise.
- **Remediation**: Migrate token storage to SecureStore on native environments and HttpOnly cookies for web browsers.

### [SEC-F02] Lack of Automated Inactivity Logout TTL
- **Severity**: `Low`
- **Component Layer**: Session Management
- **Description**: The client application fails to track user interaction events and has no automatic inactivity session termination logic.
- **Security Impact**: Low - Leftover unlocked device sessions can be accessed by unauthorized secondary users.
- **Remediation**: Add an inactivity timer context that tracks screen touch/navigate events and triggers auth logout after 15 minutes.

### [SEC-F03] Static Backend Base API URL hardcoded in source assets
- **Severity**: `Low`
- **Component Layer**: Configuration Safety
- **Description**: API URL constants fallback to local environment endpoints directly within codebase config values.
- **Security Impact**: Low - Hardcoded staging/development IPs could be compiled into final client build distributions.
- **Remediation**: Adopt strictly runtime dynamic configuration injection and compile variables exclusively through CI parameters.

### [SEC-F04] Missing Content-Security-Policy (CSP) meta configuration in index.html
- **Severity**: `Low`
- **Component Layer**: HTTP Security Meta Tags
- **Description**: The frontend static web entry does not provide metadata defining resource load directives.
- **Security Impact**: Low - Increased susceptibility to inline styles/scripts execution and third-party resource hotlinking.
- **Remediation**: Integrate a CSP `<meta>` block to define allowed source domains for connect, script, and style requests.

### [SEC-F05] Absence of Client-Side Text Length Restrictions
- **Severity**: `Low`
- **Component Layer**: Input Validation
- **Description**: Form inputs (e.g. bio, name, message fields) do not specify maxLength parameters, allowing users to paste huge chunks.
- **Security Impact**: Low - Potential for client-side rendering crashes or denial of service through huge payload buffers.
- **Remediation**: Implement character count locks and limit text inputs to realistic thresholds before submission.

### [SEC-F06] Lack of Frame-Busting scripts in web entry pages
- **Severity**: `Low`
- **Component Layer**: Clickjacking Protection
- **Description**: Web layouts lack frame-busting JavaScript checks to prevent the React app from being loaded within an iframe context.
- **Security Impact**: Low - Increased potential for frame overlays clickjacking targeting solo-travellers.
- **Remediation**: Inject frame-busting JS snippet check: `if (top !== self) { top.location = self.location; }`.

### [SEC-F07] Missing Password Visibility Warnings on Login Forms
- **Severity**: `Low`
- **Component Layer**: User Interface Security
- **Description**: Login forms provide standard password masks but do not feature shoulder-surfing warnings or clear warning UI alerts.
- **Security Impact**: Low - Increased exposure to shoulder surfing in public places like airports or hotels.
- **Remediation**: Add toggles to hide/show input password text with clean icons and show caution messages in dense environments.

### [SEC-F08] Presence of verbose logs in production code bundles
- **Severity**: `Low`
- **Component Layer**: Logging & Debugging
- **Description**: Codebase references `console.log` statements for debugging connection responses and auth token availability.
- **Security Impact**: Low - Exposes routing endpoints and metadata formats to user inspection via browser console.
- **Remediation**: Configure babel-plugin-transform-remove-console or similar packaging rules to strip log calls during build.

### [SEC-F09] Missing Subresource Integrity (SRI) on static CDN imports
- **Severity**: `Low`
- **Component Layer**: Subresource Integrity
- **Description**: External resources (e.g. fonts, vector graphics, maps) do not check integrity checksums.
- **Security Impact**: Low - Third-party compromise of asset CDN leads to injection of rogue code scripts in clients.
- **Remediation**: Append `integrity='sha384-...'` validation parameters to all static third-party CSS or JS elements.

### [SEC-F10] Lack of Client-Side API Request Throttling
- **Severity**: `Low`
- **Component Layer**: Throttling
- **Description**: Submit buttons do not configure debouncing/throttling middleware, allowing fast repeat taps.
- **Security Impact**: Low - Users can spawn hundreds of duplicate booking or match requests before response registers.
- **Remediation**: Integrate lodash.debounce or state-disabled submit actions to lock buttons until request resolves.

### [SEC-F11] Use of Outdated/Legacy Peer Dependencies
- **Severity**: `Low`
- **Component Layer**: Dependencies Management
- **Description**: Frontend package configurations require `--legacy-peer-deps` parameter flags to resolve correctly.
- **Security Impact**: Low - Inclusion of deprecated packages with indirect CVE risks or potential compatibility bugs.
- **Remediation**: Incrementally update react-native and peer libraries to resolve package version conflicts natively.

### [SEC-F12] Lack of HTML Sanitization in Chat Markdown parser
- **Severity**: `Low`
- **Component Layer**: Data Sanitization
- **Description**: Chat components print raw texts without stripping potential inline script elements before rendering.
- **Security Impact**: Low - Exposure to persistent client XSS in private group chat messages.
- **Remediation**: Use library helpers like `dompurify` to filter out HTML tags in parsed messages before layout binding.

### [SEC-F13] Lack of Custom Error Boundaries on Feed Views
- **Severity**: `Low`
- **Component Layer**: Error Boundary Coverage
- **Description**: The community feed layout does not run under a component-level error boundary context.
- **Security Impact**: Low - Single bad post structure crash causes entire app shell to terminate and white-screen.
- **Remediation**: Implement React ErrorBoundary around feed loops to display clean fallback cards if layout fails.

### [SEC-F14] Inability to prevent plain HTTP Image Loading
- **Severity**: `Low`
- **Component Layer**: HTTPS Transport Validation
- **Description**: Profile picture URL parameters allow plain http links (e.g., http://example.com/avatar.jpg).
- **Security Impact**: Low - Mixed content warnings or unencrypted image asset transfer over local networks.
- **Remediation**: Implement regex parser replacing http prefixes with secure https equivalents, or block plain HTTP source loads.

