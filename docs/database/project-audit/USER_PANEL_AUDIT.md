# VENM CLOTHING BRAND — USER PANEL AUDIT REPORT

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Audit Scope:** Complete inspection of storefront user-facing pages, interactive forms, modals, customer accounts, inquiry pipelines, and state persistence.

---

## 1. Executive Summary

The VENM User Panel delivers an immersive digital fashion experience designed around Gujarati heritage fused with Y2K and kinetic cybernetic streetwear. The storefront is intentionally architected not as a standard cart-and-checkout e-commerce shop, but as an **Exclusive Reference Catalog & Bespoke Custom Look Request Platform**. Customers browse style concepts, request custom tailoring or embroidery on existing pieces, or commission base garment sourcing.

---

## 2. Comprehensive User Feature Matrix

---

### Category A: Account Management

#### 1. Customer Registration
* **Frontend Component / Page:** [`src/pages/Login.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Login.jsx) & [`src/components/AuthModal.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/AuthModal.jsx) (Tab: 'register')
* **Route:** `/login` or global modal trigger
* **API Endpoint:** `POST /api/auth/register`
* **Controller / Service:** [`server/controllers/authController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L93) (`register`)
* **Database Entities:** `User`, `ActivityLog`
* **Exact Fields Written:**
  - `User`: `name`, `email` (lowercased), `phone` (10 digits), `passwordHash` (bcrypt 10 rounds), `role` (`"CUSTOMER"`)
  - `ActivityLog`: `action = "USER_REGISTERED"`, `entityType = "AUTH"`, `description`
* **Data Persistence:** **Database (PostgreSQL)** + JWT token in HTTP-only cookie `venm_admin_token` & `localStorage.getItem('venm_user')`.
* **Implementation Status:** **Fully Implemented**. Validates email or 10-digit phone, prevents duplicates, hashes passwords, auto-logs in user upon completion.

#### 2. Customer & Studio Login
* **Frontend Component / Page:** [`src/pages/Login.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Login.jsx) & [`src/components/AuthModal.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/AuthModal.jsx) (Tab: 'login')
* **Route:** `/login` or global modal trigger
* **API Endpoint:** `POST /api/auth/login`
* **Controller / Service:** [`server/controllers/authController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L6) (`login`)
* **Database Entities:** `User`, `ActivityLog`
* **Exact Fields Read:** `User.email`, `User.phone`, `User.name`, `User.passwordHash`, `User.role`
* **Exact Fields Written:** `ActivityLog.action = "USER_LOGIN"`, `entityType = "AUTH"`
* **Data Persistence:** **Database (PostgreSQL)** + sets JWT in HTTP-only cookie and browser storage.
* **Implementation Status:** **Fully Implemented**. Supports login by email, 10-digit phone number, or username; compares bcrypt hash.

#### 3. Google OAuth One-Click Sign-In
* **Frontend Component / Page:** [`src/pages/Login.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Login.jsx) & [`src/components/AuthModal.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/AuthModal.jsx)
* **Route:** `/login` or modal
* **API Endpoint:** `POST /api/auth/google`
* **Controller / Service:** [`server/controllers/authController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L169) (`googleLogin`)
* **Database Entities:** `User`, `ActivityLog`
* **Exact Fields Written:** Creates user with `name`, `email`, generated secure random `passwordHash`, `role: "CUSTOMER"` if not exists; logs `USER_LOGIN_GOOGLE`.
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Supports Google ID Token JWT decoding and fallback direct email sign-in.

#### 4. Customer Logout
* **Frontend Component / Page:** Navbar user pill, Profile page button, Login page button
* **Route:** Accessible across all pages
* **API Endpoint:** `POST /api/auth/logout`
* **Controller / Service:** [`server/controllers/authController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L266) (`logout`)
* **Database Entities:** `ActivityLog`
* **Exact Fields Written:** Logs `action = "USER_LOGOUT"` in `ActivityLog`; clears cookie and localStorage.
* **Data Persistence:** **Database (PostgreSQL)** (for audit log) + Browser cookie deletion.
* **Implementation Status:** **Fully Implemented**.

#### 5. User Profile View
* **Frontend Component / Page:** [`src/pages/Profile.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Profile.jsx)
* **Route:** `/profile`
* **API Endpoint:** Read from `currentUser` in `AuthContext` (populated from `/auth/login` or `/auth/me`)
* **Database Entities:** `User`
* **Exact Fields Read:** `User.id`, `User.name`, `User.email`, `User.phone`, `User.role`
* **Data Persistence:** **Database (PostgreSQL)** + local reactive state.
* **Implementation Status:** **Fully Implemented**. Displays verified customer badge, contact credentials, and bespoke inquiry history.

#### 6. Profile Image
* **Status:** **UI Mockup Only**.
* **Finding:** The database `User` table does not possess an `avatar` or `profileImage` field. The profile interface generates an avatar icon using user initials or Lucide React's `User` glyph.

#### 7. Customer Address
* **Status:** **Partially Implemented (Inquiry-Specific Only)**.
* **Finding:** There is no persistent address book table. Shipping / sizing location is optionally transmitted during bespoke look negotiations via WhatsApp or inquiry notes.

#### 8. Password Management / Reset
* **Status:** **Partially Implemented**.
* **Finding:** Passwords are fully hashed and authenticated using bcrypt on login and register. No automated "Forgot Password" SMTP email service is currently integrated; password changes are managed directly via database seed or admin intervention.

---

### Category B: Product & Reference Catalog

#### 1. Storefront Product Listing & Showcases
* **Frontend Components:**
  - Homepage Featured Showcase: [`src/pages/Home.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Home.jsx) (Coverflow Carousel + Grid)
  - Collection Product Listing: [`src/pages/CollectionDetail.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/CollectionDetail.jsx)
  - Product Cards: [`src/components/ProductCard.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/ProductCard.jsx)
* **Routes:** `/`, `/collection/:slug`
* **API Endpoints:** `GET /api/products`, `GET /api/collections/:slug`
* **Controller / Service:** [`server/controllers/productController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L4) (`getProducts`), [`server/controllers/collectionController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/collectionController.js#L23) (`getCollectionBySlug`)
* **Database Entities:** `Product`, `Collection`
* **Exact Fields Read:**
  - `Product`: `id`, `name`, `slug`, `images`, `sizes`, `category`, `collectionSlug`, `collectionName`, `estimatedPrice`, `priceDisplayMode`, `availability`, `isFeatured`, `isNavratriEdit`, `viewCount`
  - `Collection`: `id`, `name`, `slug`, `coverImage`, `tagline`, `description`, `season`, `status`
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Multi-mode viewing (3D Coverflow carousel or 3-column editorial grid), collection filtering, category tab filtering, and instant inquiry modal trigger.

#### 2. Detailed Style Reference View
* **Frontend Component / Page:** [`src/pages/ProductDetail.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/ProductDetail.jsx)
* **Route:** `/product/:slug`
* **API Endpoints:** `GET /api/products/:slug`, `POST /api/analytics/product-view`, `GET /api/products?collection=...`
* **Controllers:** `productController.getProductBySlug`, `activityController.recordProductView`
* **Database Entities:** `Product`, `ActivityLog`
* **Exact Fields Read:** All 29 `Product` fields.
* **Exact Fields Written:**
  - Automatically executes atomic increment: `Product.viewCount = viewCount + 1`.
  - Writes to `ActivityLog`: `action = "PRODUCT_VIEW"`, `entityType = "PRODUCT"`, `entityId = product.id`, `entityName = product.name`.
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Includes gallery thumbnail selection, full-screen image lightbox modal, size selector chips, pricing display mode formatter, customization guidance accordion, and related looks recommendations.

#### 3. Sizing & Custom Alterations Approach
* **Frontend Component:** `ProductDetail.jsx` and `InquiryModal.jsx`
* **Database Entity:** `Product`
* **Exact Fields Read:** `Product.sizes` (JSON array: `["S", "M", "L", "XL", "Custom"]`), `Product.sizingInfo`, `Product.customizationInfo`.
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Customers can select standard sizes or choose "Custom" to provide personalized body measurements.

---

### Category C: Customer Bespoke Inquiries

#### 1. Web Custom Look Inquiry Form
* **Frontend Component:** [`src/components/InquiryModal.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/InquiryModal.jsx)
* **Trigger:** "REQUEST THIS LOOK" buttons across homepage, collection pages, and product detail.
* **API Endpoint:** `POST /api/inquiries`
* **Controller / Service:** [`server/controllers/inquiryController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L4) (`createInquiry`)
* **Database Entities:** `Inquiry`, `ActivityLog`, `User`
* **Exact Fields Written to `Inquiry`:**
  - `userId` (attached automatically if client is logged in)
  - `clientName` (from verified profile or form input)
  - `clientContact` (email or phone)
  - `clientEmail` (verified email)
  - `clientPhone` (verified phone)
  - `userMeta` (JSON snapshot of client credentials)
  - `productId` (soft link to `Product.id`)
  - `productSlug` (soft link to `Product.slug`)
  - `productName` (product title)
  - `productImage` (cover image URL)
  - `productPrice` (estimated price snapshot)
  - `collectionName` (collection name)
  - `selectedSize` (e.g., `"M"`, `"Custom"`)
  - `requestType` (`"I already have the garment"` or `"Source base garment for me"`)
  - `note` (client custom embroidery / fit notes)
  - `status` (`"SUBMITTED"`)
* **Exact Fields Written to `ActivityLog`:**
  - `action = "INQUIRY_CREATED"`, `entityType = "INQUIRY"`, `entityId = inquiry.id`, `entityName = productName`, `description`
* **Data Persistence:** **Database (PostgreSQL)** + instant reactive update to `localStorage`.
* **Implementation Status:** **Fully Implemented**.

#### 2. WhatsApp Direct Inquiry Integration
* **Frontend Component:** `ProductDetail.jsx`, `InquiryModal.jsx`, `AdminDashboard.jsx`
* **API Endpoints:** `POST /api/analytics/whatsapp-click`, `POST /api/inquiries`
* **Controllers:** `server/app.js` and `inquiryController.js`
* **Database Entities:** `Setting`, `Inquiry`, `ActivityLog`
* **Mechanism:**
  - Reads studio WhatsApp number and pre-formatted template from `Setting.data.whatsapp`.
  - Replaces variables: `{{product_name}}`, `{{product_id}}`, `{{estimated_price}}`, `{{request_type}}`, `{{product_url}}`.
  - Launches official WhatsApp URL (`https://wa.me/917434096095?text=...`).
  - Records click event to `ActivityLog` (`WHATSAPP_INQUIRY_CLICKED`) and registers lead record in `Inquiry` table.
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**.

#### 3. Client Inquiry History
* **Frontend Component / Page:** [`src/pages/Profile.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Profile.jsx)
* **Route:** `/profile`
* **API Endpoint:** `GET /api/inquiries/my?userId=...&contact=...`
* **Controller / Service:** [`server/controllers/inquiryController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L93) (`getMyInquiries`)
* **Database Entity:** `Inquiry`
* **Exact Fields Read:** `id`, `createdAt`, `productName`, `productImage`, `productPrice`, `collectionName`, `selectedSize`, `requestType`, `note`, `status`
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Each inquiry tile shows requested piece, size, status, and direct WhatsApp followup action.

---

### Category D: Public Storefront & Atmosphere

#### 1. Real-Time Visitor Presence Tracking
* **Frontend Component:** `VisitorPresenceTracker` in [`src/App.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/App.jsx#L51)
* **API Endpoint:** `POST /api/analytics/heartbeat`
* **Controller:** [`server/controllers/activityController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/activityController.js#L26) (`recordHeartbeat`)
* **Mechanism:** Active browser tabs broadcast heartbeat pings every 20 seconds containing `sessionId`, `user`, and `currentPath`.
* **Persistence:** **In-Memory Store (`activeVisitors` Map)** on server.
* **Implementation Status:** **Fully Implemented**. Powers the real-time "Online Now" widget on the Admin Dashboard.

#### 2. Dynamic Homepage Sections (CMS-Driven)
* **Frontend Component / Page:** [`src/pages/Home.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Home.jsx) & [`src/pages/About.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/About.jsx)
* **API Endpoint:** `GET /api/homepage`
* **Database Entity:** `HomepageSection`
* **Exact Fields Read:** `sectionKey`, `enabled`, `displayOrder`, `content`
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Dynamically renders Hero, Featured Collection, Brand Statement, and Studio Manifesto.

#### 3. Top Announcement & Campaign Marquee
* **Frontend Component:** [`src/components/Navbar.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/Navbar.jsx#L58)
* **API Endpoints:** `GET /api/settings`, `GET /api/campaigns/active`
* **Database Entities:** `Setting`, `Campaign`
* **Exact Fields Read:** `Setting.data.active_fest`, `Campaign.announcement`, `Campaign.name`
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**.

#### 4. SEO & Dynamic Metadata Injection
* **Frontend Component:** [`src/data/settings.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/data/settings.js#L57) (`applySeoMetadata`)
* **Database Entity:** `Setting`
* **Exact Fields Read:** `Setting.data.seo.siteTitle`, `Setting.data.seo.metaDescription`, `Setting.data.general.brandName`
* **Data Persistence:** **Database (PostgreSQL)**.
* **Implementation Status:** **Fully Implemented**. Updates `document.title` and `<meta name="description">` dynamically based on administrative database settings.
