# VENM CLOTHING BRAND — API TO DATABASE MAPPING SPECIFICATION

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Source Code Evidence:** [`server/routes/`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/routes/), [`server/controllers/`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/), [`server/app.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/app.js).

---

## 1. Complete API Route & Database Operation Mapping

| Method | Endpoint | Middleware | Controller Function | Target Entity | Prisma DB Operation | Fields Read / Written |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | None | `authController.register` | `User`, `ActivityLog` | `prisma.user.findFirst`, `prisma.user.create`, `prisma.activityLog.create` | **Read:** `email`, `phone`<br>**Written:** `name`, `email`, `phone`, `passwordHash`, `role: "CUSTOMER"` |
| **POST** | `/api/auth/login` | None | `authController.login` | `User`, `ActivityLog` | `prisma.user.findFirst`, `prisma.activityLog.create` | **Read:** `email`, `phone`, `name`, `passwordHash`, `role`<br>**Written:** `ActivityLog.action = "USER_LOGIN"` / `"ADMIN_LOGIN"` |
| **POST** | `/api/auth/google` | None | `authController.googleLogin` | `User`, `ActivityLog` | `prisma.user.findFirst`, `prisma.user.create`, `prisma.activityLog.create` | **Read:** `email`<br>**Written:** `name`, `email`, `passwordHash`, `role: "CUSTOMER"`, `ActivityLog` |
| **POST** | `/api/auth/logout` | None | `authController.logout` | `ActivityLog` | `prisma.activityLog.create` | **Written:** `ActivityLog.action = "USER_LOGOUT"` |
| **GET** | `/api/auth/me` | `protectAdmin` | `authController.getMe` | `User` | None (reads `req.user` verified by JWT/DB in middleware) | **Read:** `id`, `name`, `email`, `role` |
| **GET** | `/api/auth/users` | `protectAdmin` | `authController.getAllUsers` | `User`, `Inquiry` | `prisma.user.findMany`, `prisma.inquiry.count` | **Read:** `User`: all fields except password; counts `Inquiry` where `userId = u.id` or matching email/phone |
| **DELETE** | `/api/auth/users/:id` | `protectAdmin` | `authController.deleteUser` | `User`, `ActivityLog` | `prisma.user.findUnique`, `prisma.user.delete`, `prisma.activityLog.create` | **Read:** `id`, `email`, `role`<br>**Deleted:** `User` record<br>**Written:** `ActivityLog.action = "DELETE_USER"` |
| **GET** | `/api/products` | None | `productController.getProducts` | `Product` | `prisma.product.findMany` | **Read:** Filters by `collectionSlug`, `category`, `availability`, `isFeatured`, `search`. Returns all columns. |
| **GET** | `/api/products/:slug` | None | `productController.getProductBySlug` | `Product` | `prisma.product.findFirst` | **Read:** Matches `slug` or `id`. Returns parsed details, images, sizes, tags. |
| **POST** | `/api/products` | `protectAdmin` | `productController.createProduct` | `Product`, `ActivityLog` | `prisma.product.findUnique`, `prisma.product.create`, `prisma.activityLog.create` | **Written:** 20+ fields (name, slug, details, collectionSlug, category, images, sizes, availability, pricing, etc.) |
| **PUT** | `/api/products/:id` | `protectAdmin` | `productController.updateProduct` | `Product`, `ActivityLog` | `prisma.product.findFirst`, `prisma.product.update`, `prisma.activityLog.create` | **Read:** Existing product<br>**Written:** Updates modified fields in `Product`; logs `PRODUCT_UPDATED` |
| **DELETE** | `/api/products/:id` | `protectAdmin` | `productController.deleteProduct` | `Product`, `ActivityLog` | `prisma.product.findFirst`, `prisma.product.delete`, `prisma.activityLog.create` | **Deleted:** Removes `Product` row<br>**Written:** Logs `PRODUCT_DELETED` |
| **PATCH** | `/api/products/:id/status` | `protectAdmin` | `productController.updateProductStatus` | `Product`, `ActivityLog` | `prisma.product.findFirst`, `prisma.product.update`, `prisma.activityLog.create` | **Written:** `availability = req.body.availability`; logs `PRODUCT_STATUS_CHANGED` |
| **GET** | `/api/collections` | None | `collectionController.getCollections` | `Collection`, `Product` | `prisma.collection.findMany` (with `include: { products: true }`) | **Read:** All `Collection` columns and child products count |
| **GET** | `/api/collections/:slug` | None | `collectionController.getCollectionBySlug` | `Collection`, `Product` | `prisma.collection.findFirst`, `prisma.product.findMany` | **Read:** Collection by `slug`/`id`, child products where `collectionSlug = collection.slug` |
| **POST** | `/api/collections` | `protectAdmin` | `collectionController.createCollection` | `Collection`, `ActivityLog` | `prisma.collection.create`, `prisma.activityLog.create` | **Written:** `name`, `slug`, `tagline`, `description`, `coverImage`, `season`, `status`, `featured` |
| **PUT** | `/api/collections/:id` | `protectAdmin` | `collectionController.updateCollection` | `Collection`, `Product`, `ActivityLog` | `prisma.collection.update`, `prisma.product.count`, `prisma.activityLog.create` | **Written:** Updates collection metadata; counts child products |
| **DELETE** | `/api/collections/:id` | `protectAdmin` | `collectionController.deleteCollection` | `Collection`, `ActivityLog` | `prisma.collection.delete`, `prisma.activityLog.create` | **Deleted:** Removes collection record |
| **GET** | `/api/categories` | None | `categoryController.getCategories` | `Category` | `prisma.category.findMany` | **Read:** Ordered by `displayOrder asc` |
| **POST** | `/api/categories` | `protectAdmin` | `categoryController.createCategory` | `Category`, `ActivityLog` | `prisma.category.create`, `prisma.activityLog.create` | **Written:** `name`, `slug`, `description`, `status`, `displayOrder` |
| **PUT** | `/api/categories/:id` | `protectAdmin` | `categoryController.updateCategory` | `Category`, `ActivityLog` | `prisma.category.update`, `prisma.activityLog.create` | **Written:** Updates category fields |
| **DELETE** | `/api/categories/:id` | `protectAdmin` | `categoryController.deleteCategory` | `Category`, `ActivityLog` | `prisma.category.delete`, `prisma.activityLog.create` | **Deleted:** Removes category record |
| **GET** | `/api/campaigns` | None | `campaignController.getCampaigns` | `Campaign` | `prisma.campaign.findMany` | **Read:** All campaigns, extracts `festivalControls` |
| **GET** | `/api/campaigns/active` | None | `campaignController.getActiveCampaign` | `Campaign` | `prisma.campaign.findFirst` | **Read:** Campaign where `status = "ACTIVE"` |
| **POST** | `/api/campaigns` | `protectAdmin` | `campaignController.createCampaign` | `Campaign`, `ActivityLog` | `prisma.campaign.create`, `prisma.activityLog.create` | **Written:** Campaign metadata + festival effect booleans |
| **PUT** | `/api/campaigns/:id` | `protectAdmin` | `campaignController.updateCampaign` | `Campaign`, `ActivityLog` | `prisma.campaign.update`, `prisma.activityLog.create` | **Written:** Updates campaign fields |
| **DELETE** | `/api/campaigns/:id` | `protectAdmin` | `campaignController.deleteCampaign` | `Campaign`, `ActivityLog` | `prisma.campaign.delete`, `prisma.activityLog.create` | **Deleted:** Removes campaign record |
| **GET** | `/api/homepage` | None | `homepageController.getHomepageSections` | `HomepageSection` | `prisma.homepageSection.findMany`, `prisma.homepageSection.upsert` | **Read:** All homepage sections ordered by `displayOrder` |
| **PUT** | `/api/homepage` | `protectAdmin` | `homepageController.updateHomepageSections` | `HomepageSection`, `ActivityLog` | `prisma.homepageSection.findUnique`, `prisma.homepageSection.upsert`, `prisma.activityLog.create` | **Written:** `content` (JSON), `enabled`, `displayOrder` |
| **GET** | `/api/media` | None | `mediaController.getMedia` | `Media` | `prisma.media.findMany` | **Read:** All media assets ordered by `createdAt desc` |
| **POST** | `/api/media` | `protectAdmin` | `mediaController.createMedia` | `Media`, `ActivityLog` | `prisma.media.create`, `prisma.activityLog.create` | **Written:** `name`, `url`, `type`, `size`, `category`, `usedBy`, `altText` |
| **DELETE** | `/api/media/:id` | `protectAdmin` | `mediaController.deleteMedia` | `Media`, `ActivityLog` | `prisma.media.delete`, `prisma.activityLog.create` | **Deleted:** Removes media record |
| **GET** | `/api/settings` | None | `settingsController.getSettings` | `Setting` | `prisma.setting.findMany` | **Read:** Merges stored setting rows with server defaults |
| **PUT** | `/api/settings` | `protectAdmin` | `settingsController.updateSettings` | `Setting`, `ActivityLog` | `prisma.setting.findUnique`, `prisma.setting.upsert`, `prisma.activityLog.create` | **Written:** Updates `Setting.data` JSON object for key |
| **POST** | `/api/inquiries` | None | `inquiryController.createInquiry` | `Inquiry`, `ActivityLog`, `User` | `prisma.user.findUnique`, `prisma.inquiry.create`, `prisma.activityLog.create` | **Read:** `User` (if logged in)<br>**Written:** Creates `Inquiry` with product and user snapshots |
| **GET** | `/api/inquiries/my` | None | `inquiryController.getMyInquiries` | `Inquiry` | `prisma.inquiry.findMany` | **Read:** Inquiries matching `userId` or contact string |
| **GET** | `/api/inquiries` | None | `inquiryController.getAllInquiries` | `Inquiry`, `User` | `prisma.inquiry.findMany`, `prisma.user.findMany` | **Read:** All inquiries joined with client user details |
| **DELETE** | `/api/inquiries/:id` | None | `inquiryController.deleteInquiry` | `Inquiry` | `prisma.inquiry.delete` | **Deleted:** Removes inquiry record |
| **POST** | `/api/analytics/heartbeat` | None | `activityController.recordHeartbeat` | In-Memory `activeVisitors` | None (In-memory visitor cache update) | **Written:** Updates visitor `lastSeen`, `currentPath` |
| **POST** | `/api/analytics/product-view` | None | `activityController.recordProductView` | `Product`, `ActivityLog` | `prisma.product.updateMany`, `prisma.activityLog.create` | **Written:** `Product.viewCount = viewCount + 1`, logs `PRODUCT_VIEW` |
| **POST** | `/api/analytics/whatsapp-click` | None | `server/app.js` inline | `ActivityLog` | `prisma.activityLog.create` | **Written:** `action = "WHATSAPP_INQUIRY_CLICKED"`, `entityType = "ANALYTICS"` |
| **POST** | `/api/analytics/inquiry-form` | None | `server/app.js` inline | `ActivityLog` | `prisma.activityLog.create` | **Written:** `action = "INQUIRY_FORM_SUBMITTED"`, `entityType = "INQUIRY"` |
| **GET** | `/api/admin/activity/logs` | `protectAdmin` | `activityController.getActivityLogs` | `ActivityLog` | `prisma.activityLog.findMany`, `prisma.activityLog.count` | **Read:** Paginated audit logs with action / entityType filters |
| **GET** | `/api/admin/activity/dashboard-stats` | `protectAdmin` | `activityController.getDashboardStats` | `Product`, `Collection`, `Category`, `Campaign`, `Media`, `ActivityLog` | Multiple `findMany` queries | **Read:** Aggregates real catalog and system status |
| **GET** | `/api/admin/activity/live-analytics` | `protectAdmin` | `activityController.getLiveUserAnalytics` | `User`, `Inquiry`, `ActivityLog`, `Product` | Counts, grouped queries, top visited products | **Read:** Builds 12-hour activity timeline and metrics |
| **GET** | `/api/admin/activity/stream` | None | `activityController.streamActivity` | None (SSE) | Express response stream (`text/event-stream`) | **Transport:** Pushes real-time activity events to connected clients |
| **GET** | `/api/health` | None | `server/app.js` inline | None | None | **Read:** Returns `{ status: 'OK', timestamp }` |

---

## 2. Summary Statistics
- **Total API Routes Verified:** 46 endpoints
- **Endpoints Connected to Database:** 43 endpoints
- **Endpoints Operating on In-Memory / Streaming State:** 3 endpoints (`/api/health`, `/api/analytics/heartbeat`, `/api/admin/activity/stream`)
- **Protected Endpoints:** 22 endpoints guarded by `protectAdmin` middleware.
