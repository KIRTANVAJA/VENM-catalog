# VENM CLOTHING BRAND — DATABASE PERSISTENCE & STORAGE AUDIT

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Focus:** Verification of true database persistence versus mock fallbacks, local storage, in-memory state, and static JSON fixtures.

---

## 1. Executive Summary

A critical requirement of this audit is to strictly distinguish features that write to the database from features that only simulate persistence via browser storage or static mock files. 

The audit reveals that **all core administrative CRUD operations and client interactions persist to the PostgreSQL database via Prisma ORM**. The static mock files ([`src/data/catalog.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/data/catalog.js), [`src/data/adminMock.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/data/adminMock.js)) and browser `localStorage` layers act solely as **initial seed templates, offline fallback caches, and optimistic UI buffers**, never superseding the PostgreSQL database when the backend is active.

---

## 2. Feature-by-Feature Persistence Verification Table

| Feature / Domain | Primary Data Store | Fallback / Cache Mechanism | True DB Persistence? | Audit Verdict & Source Proof |
| :--- | :--- | :--- | :---: | :--- |
| **User Registration** | PostgreSQL (`User`) | None | **YES** | Creates real row via `prisma.user.create()` ([`authController.js` L125](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L125)). |
| **User Login (Password)** | PostgreSQL (`User`) | None | **YES** | Compares bcrypt hash against database ([`authController.js` L48](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L48)). |
| **Google Sign-In** | PostgreSQL (`User`) | None | **YES** | Automatically creates database user if not present ([`authController.js` L213](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L213)). |
| **Admin Passkey Login** | PostgreSQL (`User`) | None | **YES** | Verifies PIN `1310` then calls `apiLogin()` against database ([`AdminPasskeyModal.jsx` L67](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/AdminPasskeyModal.jsx#L67)). |
| **Admin User Deletion** | PostgreSQL (`User`) | None | **YES** | Executes `prisma.user.delete()` ([`authController.js` L347](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L347)). |
| **Product Creation** | PostgreSQL (`Product`) | `adminMock.js` (Offline only) | **YES** | Executes `prisma.product.create()` ([`productController.js` L137](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L137)). |
| **Product Updates** | PostgreSQL (`Product`) | `adminMock.js` (Offline only) | **YES** | Executes `prisma.product.update()` ([`productController.js` L219](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L219)). |
| **Product Deletion** | PostgreSQL (`Product`) | `adminMock.js` (Offline only) | **YES** | Executes `prisma.product.delete()` ([`productController.js` L262](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L262)). |
| **Product View Count** | PostgreSQL (`Product`) | None | **YES** | Executes `prisma.product.updateMany({ data: { viewCount: { increment: 1 } } })` ([`activityController.js` L73](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/activityController.js#L73)). |
| **Collection CRUD** | PostgreSQL (`Collection`) | `adminMock.js` (Offline only) | **YES** | Executes `prisma.collection.create/update/delete()` ([`collectionController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/collectionController.js)). |
| **Category CRUD** | PostgreSQL (`Category`) | None | **YES** | Executes `prisma.category.create/update/delete()` ([`categoryController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/categoryController.js)). |
| **Campaign Management**| PostgreSQL (`Campaign`) | Local component state | **YES** | Executes `prisma.campaign.create/update/delete()` ([`campaignController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/campaignController.js)). |
| **Homepage CMS Copy** | PostgreSQL (`HomepageSection`)| `localStorage` (`venm_homepage_cms`) | **YES** | Executes `prisma.homepageSection.upsert()` ([`homepageController.js` L183](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/homepageController.js#L183)). |
| **Media Asset Index** | PostgreSQL (`Media`) | `adminMock.js` (Offline only) | **YES** | Executes `prisma.media.create/delete()` ([`mediaController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/mediaController.js)). |
| **Website Settings** | PostgreSQL (`Setting`) | `localStorage` (`venm_settings`) | **YES** | Executes `prisma.setting.upsert()` ([`settingsController.js` L89](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/settingsController.js#L89)). |
| **Web Look Inquiries** | PostgreSQL (`Inquiry`) | `localStorage` (`venm_inquiries_{uid}`) | **YES** | Executes `prisma.inquiry.create()` ([`inquiryController.js` L52](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L52)). |
| **WhatsApp Inquiry Clicks**| PostgreSQL (`ActivityLog`, `Inquiry`)| None | **YES** | Executes `prisma.activityLog.create()` and `prisma.inquiry.create()`. |
| **Activity Audit Trail** | PostgreSQL (`ActivityLog`) | None | **YES** | Executes `prisma.activityLog.create()` on every administrative action. |
| **Live Visitor Presence**| Server In-Memory (`activeVisitors` Map)| `sessionStorage` (`venm_session_id`) | **NO** (Ephemeral) | In-memory map on Node.js process; pruned every 45s ([`activityController.js` L45](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/activityController.js#L45)). |
| **Image Cropping Tool** | Browser HTML5 Canvas | Result saved in `Product.images` | **PARTIAL** | Cropping parameters are ephemeral; only the resultant image URL/data URI is persisted to DB. |
| **User Profile Avatar** | None | UI Glyphs / Initials | **NO** (UI Only) | No avatar field exists in schema or API. |
| **Customer Address Book**| None | Captured in inquiry notes | **NO** (UI/Note Only) | No persistent customer address book table. |

---

## 3. Investigation of Static Artifacts (`store.json`, `catalog.js`, `adminMock.js`)

1. **`server/data/store.json`:**
   - **Inspection Result:** This file contains a static JSON snapshot of seeded catalog items.
   - **Code Verification:** Ripgrep search across the entire codebase confirms that **`store.json` is not referenced, imported, or read anywhere in the project**. It is a legacy fixture and has no effect on runtime behavior.
2. **`src/data/catalog.js`:**
   - **Inspection Result:** Contains mock definitions of collections and products.
   - **Code Verification:** Used as the initial baseline in [`server/seed.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/seed.js#L3) to populate PostgreSQL upon database initialization, and as a fallback in frontend components if the backend API is temporarily offline during Vite development.
3. **`src/data/adminMock.js`:**
   - **Inspection Result:** Provides initial mock arrays for admin views during UI development.
   - **Code Verification:** In [`AdminProducts.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminProducts.jsx#L31-L43), `apiGetProducts()` is called immediately on component mount; mock data is only utilized in the `.catch()` block if the Express backend server is offline.

---

## 4. Resilience & Fallback Hierarchy

The application employs a **Stale-While-Revalidate (SWR)** caching pattern for critical storefront pages:
```
1. Instant Render:
   Component initializes from localStorage (cached product / collection / settings).
   -> Eliminates blank screen / layout shift.

2. Network Request:
   Component dispatches asynchronous fetch to Express API (e.g., apiGetProductBySlug).

3. Database Commit:
   Express API queries PostgreSQL via Prisma Client and returns fresh entity data.

4. Cache Refresh:
   Component updates React state with live data and synchronizes localStorage.
```

This guarantees 100% database persistence for all mutations while providing immediate visual feedback for storefront visitors.
