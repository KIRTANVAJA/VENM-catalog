# VENM CLOTHING BRAND — ALL DATABASE FIELDS & COMPLETE INVENTORY

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Schema Source File:** [`prisma/schema.prisma`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma)  

---

## 1. Complete Entity Field Inventory Tables

---

### ENTITY: User

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `email` | String | No | No | Yes | No | None |
| `phone` | String | No | No | Yes | Yes | None |
| `passwordHash` | String | No | No | No | No | None |
| `role` | String | No | No | No | No | `"CUSTOMER"` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Collection

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `slug` | String | No | No | Yes | No | None |
| `tagline` | String | No | No | No | Yes | None |
| `description` | String | No | No | No | Yes | None |
| `coverImage` | String | No | No | No | No | None |
| `season` | String | No | No | No | Yes | None |
| `status` | String | No | No | No | No | `"ACTIVE"` |
| `featured` | Boolean | No | No | No | No | `false` |
| `displayOrder` | Int | No | No | No | No | `0` |
| `products` | Product[] (Relation) | No | No | No | No | Virtual 1:N Relation |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Category

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `slug` | String | No | No | Yes | No | None |
| `description` | String | No | No | No | Yes | None |
| `status` | String | No | No | No | No | `"Active"` |
| `displayOrder` | Int | No | No | No | No | `0` |
| `products` | Product[] (Relation) | No | No | No | No | Virtual 1:N Relation |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Product

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `slug` | String | No | No | Yes | No | None |
| `description` | String | No | No | No | Yes | None |
| `details` | String (JSON Array) | No | No | No | No | `"[]"` |
| `collectionId` | String | No | Yes (`Collection.id`) | No | Yes | None |
| `collection` | Collection (Relation) | No | Rel | No | Yes | `fields: [collectionId], references: [id]` |
| `categoryId` | String | No | Yes (`Category.id`) | No | Yes | None |
| `categoryObj` | Category (Relation) | No | Rel | No | Yes | `fields: [categoryId], references: [id]` |
| `collectionSlug` | String | No | No | No | Yes | None |
| `collectionName` | String | No | No | No | Yes | None |
| `category` | String | No | No | No | Yes | None |
| `images` | String (JSON Array) | No | No | No | No | `"[]"` |
| `sizes` | String (JSON Array) | No | No | No | No | `"[]"` |
| `availability` | String | No | No | No | No | `"REQUESTABLE"` |
| `estimatedPrice` | String | No | No | No | Yes | `"Estimated from ₹1,800"` |
| `minPrice` | String | No | No | No | Yes | None |
| `maxPrice` | String | No | No | No | Yes | None |
| `priceDisplayMode`| String | No | No | No | Yes | `"STARTING_FROM"` |
| `customizationInfo`| String | No | No | No | Yes | `"Custom embroidery, fit adjustments..."` |
| `sizingInfo` | String | No | No | No | Yes | `"Custom sizing available..."` |
| `sourceAttribution`| String | No | No | No | Yes | `"VENM Reference Design"` |
| `isFeatured` | Boolean | No | No | No | No | `false` |
| `isNavratriEdit` | Boolean | No | No | No | No | `false` |
| `tags` | String (JSON Array) | No | No | No | No | `"[]"` |
| `garmentCare` | String | No | No | No | Yes | None |
| `viewCount` | Int | No | No | No | No | `0` |
| `displayOrder` | Int | No | No | No | No | `0` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Campaign

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `slug` | String | No | No | Yes | No | None |
| `description` | String | No | No | No | Yes | None |
| `image` | String | No | No | No | Yes | None |
| `announcement` | String | No | No | No | Yes | None |
| `startDate` | String | No | No | No | Yes | None |
| `endDate` | String | No | No | No | Yes | None |
| `status` | String | No | No | No | No | `"ACTIVE"` |
| `theme` | String | No | No | No | Yes | `"Festive"` |
| `festivalLights` | Boolean | No | No | No | No | `true` |
| `dandiya` | Boolean | No | No | No | No | `true` |
| `chunri` | Boolean | No | No | No | No | `true` |
| `bangles` | Boolean | No | No | No | No | `false` |
| `festivalGlow` | Boolean | No | No | No | No | `true` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: HomepageSection

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `sectionKey` | String | No | No | Yes | No | None |
| `name` | String | No | No | No | No | None |
| `enabled` | Boolean | No | No | No | No | `true` |
| `displayOrder` | Int | No | No | No | No | `0` |
| `content` | String (JSON Object) | No | No | No | No | `"{}"` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Media

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `name` | String | No | No | No | No | None |
| `url` | String | No | No | No | No | None |
| `type` | String | No | No | No | Yes | `"image/webp"` |
| `size` | String | No | No | No | Yes | None |
| `category` | String | No | No | No | Yes | `"Products"` |
| `usedBy` | String | No | No | No | Yes | `"Catalog"` |
| `altText` | String | No | No | No | Yes | None |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: Setting

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `sectionKey` | String | No | No | Yes | No | None |
| `data` | String (JSON Object) | No | No | No | No | `"{}"` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

### ENTITY: ActivityLog

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `adminUserId` | String | No | No | No | Yes | None |
| `adminEmail` | String | No | No | No | Yes | None |
| `action` | String | No | No | No | No | None |
| `entityType` | String | No | No | No | No | None |
| `entityId` | String | No | No | No | Yes | None |
| `entityName` | String | No | No | No | Yes | None |
| `description` | String | No | No | No | Yes | None |
| `metadata` | String (JSON Object) | No | No | No | Yes | `"{}"` |
| `createdAt` | DateTime | No | No | No | No | `now()` |

---

### ENTITY: Inquiry

| Field | Actual Data Type | Primary Key | Foreign Key | Unique | Nullable | Default |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| `id` | String | Yes | No | Yes | No | `uuid()` |
| `userId` | String | No | No | No | Yes | None |
| `clientName` | String | No | No | No | Yes | None |
| `clientContact` | String | No | No | No | Yes | None |
| `clientEmail` | String | No | No | No | Yes | None |
| `clientPhone` | String | No | No | No | Yes | None |
| `userMeta` | String (JSON Object) | No | No | No | Yes | `"{}"` |
| `productId` | String | No | No | No | Yes | None |
| `productSlug` | String | No | No | No | Yes | None |
| `productName` | String | No | No | No | No | None |
| `productImage` | String | No | No | No | Yes | None |
| `productPrice` | String | No | No | No | Yes | None |
| `collectionName` | String | No | No | No | Yes | None |
| `selectedSize` | String | No | No | No | Yes | None |
| `requestType` | String | No | No | No | Yes | `"I have my garment"` |
| `note` | String | No | No | No | Yes | None |
| `status` | String | No | No | No | No | `"SUBMITTED"` |
| `createdAt` | DateTime | No | No | No | No | `now()` |
| `updatedAt` | DateTime | No | No | No | No | Auto-updated (`@updatedAt`) |

---

## 2. Comprehensive Inventory Synthesis

### 1. Complete List of Entities (10 Entities)
1. `User`
2. `Collection`
3. `Category`
4. `Product`
5. `Campaign`
6. `HomepageSection`
7. `Media`
8. `Setting`
9. `ActivityLog`
10. `Inquiry`

### 2. Complete List of Fields by Category
- **Scalar Database Columns:** 117
- **Virtual Prisma Relation Fields:** 4 (`Collection.products`, `Category.products`, `Product.collection`, `Product.categoryObj`)
- **Total Schema Field Entries:** 121

### 3. Primary Keys & Unique Constraints
- **Primary Keys (10):** All 10 entities utilize UUID surrogate primary keys named `id` with default generator `@default(uuid())`.
- **Unique Constraints (7):**
  1. `User.email` (`@unique`)
  2. `User.phone` (`@unique`)
  3. `Collection.slug` (`@unique`)
  4. `Category.slug` (`@unique`)
  5. `Product.slug` (`@unique`)
  6. `Campaign.slug` (`@unique`)
  7. `HomepageSection.sectionKey` (`@unique`)
  8. `Setting.sectionKey` (`@unique`)

### 4. Database-Enforced Foreign Keys (2 Enforced Relations)
1. `Product.collectionId` → references `Collection.id` (`onDelete: SetNull`)
2. `Product.categoryId` → references `Category.id` (`onDelete: SetNull`)

### 5. Application-Level Relationships (8 Soft Relations)
1. `Product.collectionSlug` → references `Collection.slug` (used for URL-based collection lookups)
2. `Product.category` → references `Category.name` (used for category tab filtering)
3. `Inquiry.userId` → references `User.id` (associated authenticated client account)
4. `Inquiry.productId` → references `Product.id` (associated bespoke style reference)
5. `Inquiry.productSlug` → references `Product.slug` (associated look slug for deep links)
6. `ActivityLog.adminUserId` → references `User.id` (audited administrative or client actor)
7. `ActivityLog.adminEmail` → references `User.email` (actor email logging)
8. `ActivityLog.entityId` → polymorphic soft reference to primary keys of modified entities (`Product`, `Collection`, `Category`, `Campaign`, `Media`, `User`, `Inquiry`, `Setting`)

### 6. JSON-Based References & Data Payloads (7 JSON Fields)
1. `Product.details`: Array of technical fabric, cut, and hardware specification bullets (`string[]`).
2. `Product.images`: Ordered array of asset image URLs / paths (`string[]`).
3. `Product.sizes`: Array of selectable size strings (`string[]`).
4. `Product.tags`: Style and editorial categorization tags (`string[]`).
5. `HomepageSection.content`: Key-value copy dictionary containing heading, subtitles, badge, button text, CTA links, image URLs, and referenced `collectionSlug`.
6. `Setting.data`: Configuration objects for brand metadata, WhatsApp template variables, social URLs, and SEO OpenGraph tags.
7. `Inquiry.userMeta`: Point-in-time snapshot of client's registered name, email, phone, role, and registration date.
8. `ActivityLog.metadata`: Additional context for system events (e.g., query params, client IP, route).

### 7. Indexes
- **Primary B-Tree Indexes:** Automatically created on `id` for all 10 tables.
- **Unique B-Tree Indexes:** Automatically created on `email`, `phone`, `slug`, and `sectionKey` across respective tables.
- **Foreign Key Indexes:** Created on `collectionId` and `categoryId` in `Product`.
- **Composite / Ordering Note:** Sorting fields `createdAt`, `displayOrder`, and `viewCount` currently rely on sequential scans or PK b-tree index lookups in development; explicit compound indexes are not declared in `schema.prisma`.

### 8. Enums & Status Literals
*Note: In `schema.prisma`, these are represented as `String` columns with application-enforced string enum values:*
1. `User.role`: `"ADMIN"` | `"CUSTOMER"`
2. `Collection.status`: `"ACTIVE"` | `"COMING_SOON"`
3. `Category.status`: `"Active"` | `"Archived"`
4. `Product.availability`: `"REQUESTABLE"` | `"PUBLISHED"` | `"PAUSED"` | `"COMING_SOON"` | `"DRAFT"`
5. `Product.priceDisplayMode`: `"STARTING_FROM"` | `"PRICE_RANGE"` | `"CUSTOM_QUOTE"`
6. `Campaign.status`: `"ACTIVE"` | `"SCHEDULED"` | `"ENDED"`
7. `Inquiry.status`: `"SUBMITTED"` | `"IN_REVIEW"` | `"COMPLETED"`
8. `Inquiry.requestType`: `"I have my garment"` | `"I already have the garment"` | `"Source base garment"` | `"WhatsApp Direct Request"`
9. `HomepageSection.sectionKey`: `"hero"` | `"featured_collection"` | `"brand_statement"` | `"featured_products"` | `"lookbook"` | `"about_story"`
10. `Setting.sectionKey`: `"general"` | `"whatsapp"` | `"social"` | `"seo"`

### 9. Admin Modules (11 Functional Modules)
1. Admin Authentication & Passkey Modal (`/admin/login`, `AdminPasskeyModal`)
2. Dashboard & Real-Time Presence (`/admin/dashboard`)
3. Registered Client Management (`/admin/users`)
4. Reference & Product Management (`/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`)
5. Collection Management (`/admin/collections`, `/admin/collections/new`, `/admin/collections/:id/edit`)
6. Category Management (`/admin/categories`)
7. Active Fest (Activist) Campaign Hub (`/admin/active-fest`)
8. Homepage Modular CMS (`/admin/homepage`)
9. Seasonal Campaigns Manager (`/admin/campaigns`)
10. Media Library Registry (`/admin/media`)
11. Global Storefront Settings (`/admin/settings/*`)

### 10. User-Facing Modules (6 Core Pages & Modals)
1. Homepage (`/` - `Home.jsx` with Hero, Carousel/Grid, Manifesto, Lookbook)
2. Collections Directory (`/collections` - `Collections.jsx`)
3. Collection Detail View (`/collection/:slug` - `CollectionDetail.jsx`)
4. Product / Reference Detail View (`/product/:slug` - `ProductDetail.jsx`)
5. Studio About Manifesto (`/about` - `About.jsx`)
6. Authentication & Client Profile (`/login`, `/profile`, `AuthModal.jsx`, `InquiryModal.jsx`)

### 11. API Endpoints Connected to Database Entities
- **User:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/users`, `DELETE /api/auth/users/:id`
- **Product:** `GET /api/products`, `GET /api/products/:slug`, `POST /api/products`, `PUT /api/products/:id`, `PATCH /api/products/:id/status`, `DELETE /api/products/:id`, `POST /api/analytics/product-view`
- **Collection:** `GET /api/collections`, `GET /api/collections/:slug`, `POST /api/collections`, `PUT /api/collections/:id`, `DELETE /api/collections/:id`
- **Category:** `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- **Campaign:** `GET /api/campaigns`, `GET /api/campaigns/active`, `POST /api/campaigns`, `PUT /api/campaigns/:id`, `DELETE /api/campaigns/:id`
- **HomepageSection:** `GET /api/homepage`, `PUT /api/homepage`
- **Media:** `GET /api/media`, `POST /api/media`, `DELETE /api/media/:id`
- **Setting:** `GET /api/settings`, `PUT /api/settings`
- **ActivityLog:** `GET /api/admin/activity/logs`, `GET /api/admin/activity/dashboard-stats`, `GET /api/admin/activity/live-analytics`, `GET /api/admin/activity/stream`, `POST /api/analytics/whatsapp-click`, `POST /api/analytics/inquiry-form`
- **Inquiry:** `POST /api/inquiries`, `GET /api/inquiries`, `GET /api/inquiries/my`, `DELETE /api/inquiries/:id`

### 12. Features That Do Not Currently Persist Data
1. **User Profile Image Upload:** There is no profile avatar upload endpoint or column in `User`. The UI renders initials or an icon.
2. **Client Address Book:** Shipping/billing address is not stored in the database.
3. **Live Visitor Presence Heartbeat Map:** The `activeVisitors` Map in [`server/controllers/activityController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/activityController.js#L8) is maintained purely in server memory and resets on server reboot.
4. **Image Cropping Adjustments:** The `ImageAdjusterModal` operates client-side via HTML5 Canvas; the final cropped image URL or data URI is saved into `Product.images`, but cropping geometry parameters (zoom, pan, rotation coordinates) are not stored in the database.
5. **Session ID:** `venm_session_id` is stored in client `sessionStorage` and transmitted in heartbeat packets, but is not persisted in a database session table.
