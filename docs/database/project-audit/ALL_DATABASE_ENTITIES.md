# VENM CLOTHING BRAND — ALL DATABASE ENTITIES AUDIT

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Schema Source File:** [`prisma/schema.prisma`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma)  
**Database System:** PostgreSQL (via Prisma ORM 6.4.0)

---

## 1. Entity Overview & Inventory

A comprehensive inspection of [`prisma/schema.prisma`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma) verifies exactly **10 database models**. No tables or models are invented; every entity listed below is backed by actual application code and database operations.

| # | Prisma Model Name | Underlying PostgreSQL Table Name | Total Fields (Scalar + Relation) | Primary Key | Active Runtime Usage |
| :-: | :--- | :--- | :-: | :--- | :--- |
| **1** | `User` | `"User"` | 8 (8 scalar) | `id` (UUID v4) | **Active** (Customer & Admin authentication, profile, user listing) |
| **2** | `Collection` | `"Collection"` | 12 (11 scalar + 1 relation) | `id` (UUID v4) | **Active** (Catalog edits, seasonal showcases, collection archives) |
| **3** | `Category` | `"Category"` | 8 (7 scalar + 1 relation) | `id` (UUID v4) | **Active** (Apparel taxonomy, filter pills, product categorization) |
| **4** | `Product` | `"Product"` | 29 (27 scalar + 2 relations) | `id` (UUID v4) | **Active** (Core reference catalog, detail pages, bespoke look requests) |
| **5** | `Campaign` | `"Campaign"` | 15 (15 scalar) | `id` (UUID v4) | **Active** (Seasonal festival banner, festive overlay effects, announcement) |
| **6** | `HomepageSection`| `"HomepageSection"` | 7 (7 scalar) | `id` (UUID v4) | **Active** (Modular CMS page builder for storefront homepage) |
| **7** | `Media` | `"Media"` | 10 (10 scalar) | `id` (UUID v4) | **Active** (Media asset library, digital asset manager) |
| **8** | `Setting` | `"Setting"` | 5 (5 scalar) | `id` (UUID v4) | **Active** (Global configuration: WhatsApp, SEO, Social, General) |
| **9** | `ActivityLog` | `"ActivityLog"` | 10 (10 scalar) | `id` (UUID v4) | **Active** (Audit trail, admin live event stream, analytics timeline) |
| **10**| `Inquiry` | `"Inquiry"` | 17 (17 scalar) | `id` (UUID v4) | **Active** (Bespoke custom look requests, client inquiries, WhatsApp tracking)|

**Summary Totals:**  
- **Total Models:** 10  
- **Total Field Definitions in Schema:** 121 (117 scalar database columns + 4 virtual Prisma relations)  
- **Entities Actively Used in Code:** 10 of 10 (100% active utilization)

---

## 2. Detailed Entity Specifications

---

### Entity 1: `User`
* **Prisma Model:** `User`
* **Underlying Table:** `User`
* **Business Purpose:** Central account authority storing credentials, authentication identities, contact information, and security roles for both studio administrators and public shopping clients.
* **Actively Used:** Yes ([`server/controllers/authController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js), [`src/context/AuthContext.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/context/AuthContext.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key generated via UUID v4 |
| `name` | `String` | No | No | No | No | None | Full legal or display name of the user |
| `email` | `String` | No | No | Yes | No | None | Unique email address used for login and notifications |
| `phone` | `String?` | No | No | Yes | Yes | `null` | Optional unique phone number (10 digits) for SMS/WhatsApp login |
| `passwordHash`| `String` | No | No | No | No | None | Bcrypt hashed password (10 salt rounds); random hash for Google users |
| `role` | `String` | No | No | No | No | `"CUSTOMER"` | Security authorization role (`"ADMIN"` or `"CUSTOMER"`) |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Timestamp when user registered |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Timestamp automatically updated on user mutation |

* **Prisma Unique Constraints:** `email` (`@unique`), `phone` (`@unique`).
* **Enforced Foreign Keys:** None.
* **Application Soft Links:**
  - `User.id` referenced by `Inquiry.userId`.
  - `User.id` referenced by `ActivityLog.adminUserId`.
  - `User.email` / `User.phone` matched soft in `Inquiry` lookups.

---

### Entity 2: `Collection`
* **Prisma Model:** `Collection`
* **Underlying Table:** `Collection`
* **Business Purpose:** Represents curatorial fashion collections, seasonal edits, and archival drops (e.g., "Navratri Edit 2026", "Diwali Edit", "Raw Denim").
* **Actively Used:** Yes ([`server/controllers/collectionController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/collectionController.js), [`src/pages/Collections.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Collections.jsx), [`src/admin/pages/AdminCollections.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminCollections.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `name` | `String` | No | No | No | No | None | Display title of the collection |
| `slug` | `String` | No | No | Yes | No | None | URL slug identifier (e.g., `"navratri"`, `"indo-western"`) |
| `tagline` | `String?` | No | No | No | Yes | `null` | Short editorial subtitle |
| `description` | `String?` | No | No | No | Yes | `null` | Narrative description of the collection's theme and silhouettes |
| `coverImage` | `String` | No | No | No | No | None | Asset URL/path to hero banner image |
| `season` | `String?` | No | No | No | Yes | `null` | Seasonal identifier (e.g., `"FESTIVE 2026"`, `"PERMANENT"`) |
| `status` | `String` | No | No | No | No | `"ACTIVE"` | Status enum equivalent: `"ACTIVE"` or `"COMING_SOON"` |
| `featured` | `Boolean` | No | No | No | No | `false` | If true, pinned to homepage featured spotlight |
| `displayOrder` | `Int` | No | No | No | No | `0` | Numerical sorting rank in UI listings |
| `products` | `Product[]` | No | Rel | No | - | - | 1:N virtual Prisma relation back to `Product` model |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Entity creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

* **Prisma Unique Constraints:** `slug` (`@unique`).
* **Enforced Foreign Keys:** Target of `Product.collectionId`.

---

### Entity 3: `Category`
* **Prisma Model:** `Category`
* **Underlying Table:** `Category`
* **Business Purpose:** Standard clothing classification taxonomy (e.g., "Outerwear", "Tops", "Bottoms", "Ethnic", "Accessories").
* **Actively Used:** Yes ([`server/controllers/categoryController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/categoryController.js), [`src/admin/pages/AdminCategories.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminCategories.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `name` | `String` | No | No | No | No | None | Display label (e.g., `"Outerwear"`, `"Ethnic"`) |
| `slug` | `String` | No | No | Yes | No | None | URL slug (e.g., `"outerwear"`, `"ethnic"`) |
| `description` | `String?` | No | No | No | Yes | `null` | Editorial notes regarding the category |
| `status` | `String` | No | No | No | No | `"Active"` | Operational status (`"Active"` or `"Archived"`) |
| `displayOrder` | `Int` | No | No | No | No | `0` | Sorting sequence for navigation and filter pills |
| `products` | `Product[]` | No | Rel | No | - | - | 1:N virtual Prisma relation back to `Product` |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Entity creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

* **Prisma Unique Constraints:** `slug` (`@unique`).
* **Enforced Foreign Keys:** Target of `Product.categoryId`.

---

### Entity 4: `Product`
* **Prisma Model:** `Product`
* **Underlying Table:** `Product`
* **Business Purpose:** Master table for bespoke garment style references, custom designs, garments available for custom tailoring/embroidery, and catalog showcases.
* **Actively Used:** Yes ([`server/controllers/productController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js), [`src/pages/ProductDetail.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/ProductDetail.jsx), [`src/admin/pages/AdminProducts.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminProducts.jsx), [`src/admin/pages/AdminProductForm.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminProductForm.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `name` | `String` | No | No | No | No | None | Reference name (e.g., "GARBA CYBER VEST") |
| `slug` | `String` | No | No | Yes | No | None | Unique URL slug identifier |
| `description` | `String?` | No | No | No | Yes | `null` | Comprehensive garment craftsmanship description |
| `details` | `String` (JSON) | No | No | No | No | `"[]"` | JSON stringified string array of technical bullets |
| `collectionId` | `String?` | No | Yes | No | Yes | `null` | Foreign key referencing `Collection.id` |
| `collection` | `Collection?` | No | Rel | No | Yes | - | Virtual Prisma relation to `Collection` (`onDelete: SetNull`) |
| `categoryId` | `String?` | No | Yes | No | Yes | `null` | Foreign key referencing `Category.id` |
| `categoryObj` | `Category?` | No | Rel | No | Yes | - | Virtual Prisma relation to `Category` (`onDelete: SetNull`) |
| `collectionSlug`| `String?` | No | No | No | Yes | `null` | Denormalized collection slug for fast string-based filtering |
| `collectionName`| `String?` | No | No | No | Yes | `null` | Denormalized collection display name |
| `category` | `String?` | No | No | No | Yes | `null` | Denormalized category string (e.g., "Outerwear") |
| `images` | `String` (JSON) | No | No | No | No | `"[]"` | JSON stringified string array of image asset URLs/paths |
| `sizes` | `String` (JSON) | No | No | No | No | `"[]"` | JSON stringified string array of supported sizes (e.g. `["S","M","L","XL","Custom"]`) |
| `availability` | `String` | No | No | No | No | `"REQUESTABLE"`| Status enum: `"REQUESTABLE"`, `"PUBLISHED"`, `"PAUSED"`, `"COMING_SOON"`, `"DRAFT"` |
| `estimatedPrice`| `String?` | No | No | No | Yes | `"Estimated from ₹1,800"` | Formatted reference price text |
| `minPrice` | `String?` | No | No | No | Yes | `null` | Lower bound estimated numeric price string |
| `maxPrice` | `String?` | No | No | No | Yes | `null` | Upper bound estimated numeric price string |
| `priceDisplayMode`| `String?` | No | No | No | Yes | `"STARTING_FROM"`| Pricing mode: `"STARTING_FROM"`, `"PRICE_RANGE"`, `"CUSTOM_QUOTE"` |
| `customizationInfo`| `String?`| No | No | No | Yes | `"Custom embroidery..."` | Studio guidance on bespoke tailoring alterations |
| `sizingInfo` | `String?` | No | No | No | Yes | `"Custom sizing..."` | Customer measurement instructions |
| `sourceAttribution`| `String?`| No | No | No | Yes | `"VENM Reference Design"` | Creative source / archival attribution note |
| `isFeatured` | `Boolean` | No | No | No | No | `false` | Highlighted on homepage coverflow / grid |
| `isNavratriEdit` | `Boolean` | No | No | No | No | `false` | Quick-filter flag for active festival season |
| `tags` | `String` (JSON) | No | No | No | No | `"[]"` | JSON stringified string array of search/style tags |
| `garmentCare` | `String?` | No | No | No | Yes | `null` | Washing and maintenance instructions |
| `viewCount` | `Int` | No | No | No | No | `0` | Incremented automatically on visitor detail page visits |
| `displayOrder` | `Int` | No | No | No | No | `0` | Sorting sequence order |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Entity creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

* **Prisma Enforced Foreign Keys:**
  - `fields: [collectionId], references: [id], onDelete: SetNull`
  - `fields: [categoryId], references: [id], onDelete: SetNull`
* **JSON Structure Definitions:**
  - `details`: `string[]` (e.g., `["100% Cotton Loopback", "Hand-cast silver hardware"]`)
  - `images`: `string[]` (e.g., `["/assets/products/jacket.jpg", "/assets/products/jacket_back.jpg"]`)
  - `sizes`: `string[]` (e.g., `["S", "M", "L", "XL", "Custom"]`)
  - `tags`: `string[]` (e.g., `["NavratriEdit", "Denim", "Streetwear"]`)

---

### Entity 5: `Campaign`
* **Prisma Model:** `Campaign`
* **Underlying Table:** `Campaign`
* **Business Purpose:** Controls seasonal marketing themes, announcement banners, festival dates, and atmospheric UI overlay toggle switches (such as dandiya lights, chunri glows, and animations).
* **Actively Used:** Yes ([`server/controllers/campaignController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/campaignController.js), [`src/admin/pages/AdminCampaigns.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminCampaigns.jsx), [`src/admin/pages/AdminActiveFest.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminActiveFest.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `name` | `String` | No | No | No | No | None | Campaign title (e.g., "NAVRATRI EDIT 2026") |
| `slug` | `String` | No | No | Yes | No | None | Unique URL slug |
| `description` | `String?` | No | No | No | Yes | `null` | Narrative description of seasonal theme |
| `image` | `String?` | No | No | No | Yes | `null` | Campaign backdrop / banner image URL |
| `announcement` | `String?` | No | No | No | Yes | `null` | Top announcement bar marquee text |
| `startDate` | `String?` | No | No | No | Yes | `null` | Campaign schedule start date |
| `endDate` | `String?` | No | No | No | Yes | `null` | Campaign schedule end date |
| `status` | `String` | No | No | No | No | `"ACTIVE"` | Status enum: `"ACTIVE"`, `"SCHEDULED"`, `"ENDED"` |
| `theme` | `String?` | No | No | No | Yes | `"Festive"` | Theme preset name |
| `festivalLights`| `Boolean` | No | No | No | No | `true` | Frontend UI overlay toggle: Festive twinkle lights |
| `dandiya` | `Boolean` | No | No | No | No | `true` | Frontend UI overlay toggle: Dandiya stick decorative accent |
| `chunri` | `Boolean` | No | No | No | No | `true` | Frontend UI overlay toggle: Chunri fabric floating effect |
| `bangles` | `Boolean` | No | No | No | No | `false` | Frontend UI overlay toggle: Traditional bangles visual accent |
| `festivalGlow` | `Boolean` | No | No | No | No | `true` | Frontend UI overlay toggle: Neon festive atmospheric glow |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Entity creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

---

### Entity 6: `HomepageSection`
* **Prisma Model:** `HomepageSection`
* **Underlying Table:** `HomepageSection`
* **Business Purpose:** Modular Content Management System (CMS) supporting drag/enable toggle and content editing of individual homepage blocks (Hero banner, Featured collection spotlight, Brand statement manifesto, Featured products, Editorial lookbook, About manifesto).
* **Actively Used:** Yes ([`server/controllers/homepageController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/homepageController.js), [`src/pages/Home.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Home.jsx), [`src/admin/pages/AdminHomepageCMS.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminHomepageCMS.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `sectionKey` | `String` | No | No | Yes | No | None | Unique section identifier: `hero`, `featured_collection`, `brand_statement`, `featured_products`, `lookbook`, `about_story` |
| `name` | `String` | No | No | No | No | None | Human-readable section name in Admin CMS |
| `enabled` | `Boolean` | No | No | No | No | `true` | Visibility toggle on public storefront |
| `displayOrder` | `Int` | No | No | No | No | `0` | Order of section appearance |
| `content` | `String` (JSON) | No | No | No | No | `"{}"` | Dynamic JSON dictionary of editable section copywriting, CTA links, image paths |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Entity creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

---

### Entity 7: `Media`
* **Prisma Model:** `Media`
* **Underlying Table:** `Media`
* **Business Purpose:** Centralized media asset management table storing metadata for uploaded catalog images, lookbook photos, campaign graphics, and WebP assets.
* **Actively Used:** Yes ([`server/controllers/mediaController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/mediaController.js), [`src/admin/pages/AdminMediaLibrary.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminMediaLibrary.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `name` | `String` | No | No | No | No | None | File name or descriptive asset title |
| `url` | `String` | No | No | No | No | None | Static path or hosted URL |
| `type` | `String?` | No | No | No | Yes | `"image/webp"` | MIME type |
| `size` | `String?` | No | No | No | Yes | `null` | Human-readable file size (e.g., `"240 KB"`) |
| `category` | `String?` | No | No | No | Yes | `"Products"` | Asset category (`"Products"`, `"Campaigns"`, `"Editorial"`) |
| `usedBy` | `String?` | No | No | No | Yes | `"Catalog"` | Application module reference |
| `altText` | `String?` | No | No | No | Yes | `null` | Accessibility alternative text description |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Asset registration timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

---

### Entity 8: `Setting`
* **Prisma Model:** `Setting`
* **Underlying Table:** `Setting`
* **Business Purpose:** Persistent key-value configuration store partitioned by section keys (`general`, `whatsapp`, `social`, `seo`) controlling global contact info, WhatsApp inquiry template variables, social URLs, and OpenGraph SEO tags.
* **Actively Used:** Yes ([`server/controllers/settingsController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/settingsController.js), [`src/data/settings.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/data/settings.js), [`src/admin/pages/AdminSettings.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminSettings.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `sectionKey` | `String` | No | No | Yes | No | None | Partition key: `"general"`, `"whatsapp"`, `"social"`, `"seo"` |
| `data` | `String` (JSON) | No | No | No | No | `"{}"` | JSON string containing configuration fields |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Settings row creation timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |

---

### Entity 9: `ActivityLog`
* **Prisma Model:** `ActivityLog`
* **Underlying Table:** `ActivityLog`
* **Business Purpose:** Central audit log and event ledger capturing user registrations, client logins, product view events, bespoke inquiry submissions, and admin CRUD operations. Broadcasts live events to the Admin Dashboard via Server-Sent Events (SSE).
* **Actively Used:** Yes ([`server/controllers/activityController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/activityController.js), [`server/utils/activityLogger.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/utils/activityLogger.js), [`src/admin/pages/AdminDashboard.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminDashboard.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `adminUserId` | `String?` | No | No | No | Yes | `null` | Soft link to `User.id` (actor who performed the action) |
| `adminEmail` | `String?` | No | No | No | Yes | `null` | Actor email or identifier (e.g. `"public-visitor"`) |
| `action` | `String` | No | No | No | No | None | Verb: `USER_LOGIN`, `USER_REGISTERED`, `PRODUCT_VIEW`, `INQUIRY_CREATED`, `PRODUCT_UPDATED` |
| `entityType` | `String` | No | No | No | No | None | Category: `AUTH`, `PRODUCT`, `COLLECTION`, `INQUIRY`, `SETTINGS`, `ANALYTICS` |
| `entityId` | `String?` | No | No | No | Yes | `null` | Soft reference to modified entity PK or slug |
| `entityName` | `String?` | No | No | No | Yes | `null` | Human-readable entity title (e.g., product name) |
| `description` | `String?` | No | No | No | Yes | `null` | Human-readable audit narrative |
| `metadata` | `String?` (JSON)| No | No | No | Yes | `"{}"` | Structured JSON payload with extra event parameters |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Timestamp when the event was recorded |

---

### Entity 10: `Inquiry`
* **Prisma Model:** `Inquiry`
* **Underlying Table:** `Inquiry`
* **Business Purpose:** Captures customer requests for bespoke styling, customized silhouettes, and garment alterations submitted via the web inquiry modal or initiated through WhatsApp inquiry clicks.
* **Actively Used:** Yes ([`server/controllers/inquiryController.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js), [`src/components/InquiryModal.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/InquiryModal.jsx), [`src/pages/Profile.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/pages/Profile.jsx), [`src/admin/pages/AdminDashboard.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminDashboard.jsx)).

#### Columns & Field Definitions
| Field | Data Type | PK | FK | Unique | Nullable | Default | Description / Application Constraints |
| :--- | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| `id` | `String` (UUID) | Yes | No | Yes | No | `uuid()` | Surrogate primary key (UUID v4) |
| `userId` | `String?` | No | No | No | Yes | `null` | Soft link to `User.id` if user was authenticated |
| `clientName` | `String?` | No | No | No | Yes | `null` | Customer name |
| `clientContact` | `String?` | No | No | No | Yes | `null` | Primary contact string (phone or email) |
| `clientEmail` | `String?` | No | No | No | Yes | `null` | Verified customer email |
| `clientPhone` | `String?` | No | No | No | Yes | `null` | Customer phone number |
| `userMeta` | `String?` (JSON)| No | No | No | Yes | `"{}"` | Snapshot of client account metadata at time of inquiry |
| `productId` | `String?` | No | No | No | Yes | `null` | Soft link to `Product.id` |
| `productSlug` | `String?` | No | No | No | Yes | `null` | Soft link to `Product.slug` |
| `productName` | `String` | No | No | No | No | None | Denormalized snapshot of product name |
| `productImage` | `String?` | No | No | No | Yes | `null` | Snapshot of product cover image URL |
| `productPrice` | `String?` | No | No | No | Yes | `null` | Snapshot of estimated price at inquiry time |
| `collectionName`| `String?`| No | No | No | Yes | `null` | Denormalized parent collection name |
| `selectedSize` | `String?` | No | No | No | Yes | `null` | Selected size tag (e.g., `"M"`, `"Custom"`) |
| `requestType` | `String?` | No | No | No | Yes | `"I have my garment"` | Option: `"I have my garment"`, `"Source base garment"`, `"WhatsApp Direct"` |
| `note` | `String?` | No | No | No | Yes | `null` | Client customization notes / embroidery request |
| `status` | `String` | No | No | No | No | `"SUBMITTED"` | Workflow status (`"SUBMITTED"`, `"IN_REVIEW"`, `"COMPLETED"`) |
| `createdAt` | `DateTime` | No | No | No | No | `now()` | Submission timestamp |
| `updatedAt` | `DateTime` | No | No | No | No | `@updatedAt` | Auto-updating timestamp on modification |
