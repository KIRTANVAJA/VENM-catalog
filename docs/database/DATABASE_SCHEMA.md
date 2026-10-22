# VENM Catalog — Complete Database Schema Reference

**Database System**: PostgreSQL (Render Cloud Instance)  
**ORM**: Prisma 6.4.x  
**Schema File**: `prisma/schema.prisma`  
**Total Verified Tables**: 10  
**Audit Status**: Verified against active codebase and database connection  

---

## Table of Contents
1. [`User`](#1-table-user)
2. [`Collection`](#2-table-collection)
3. [`Category`](#3-table-category)
4. [`Product`](#4-table-product)
5. [`Campaign`](#5-table-campaign)
6. [`HomepageSection`](#6-table-homepagesection)
7. [`Media`](#7-table-media)
8. [`Setting`](#8-table-setting)
9. [`ActivityLog`](#9-table-activitylog)
10. [`Inquiry`](#10-table-inquiry)

---

## 1. Table: `User`

### Purpose
Stores identity credentials, account roles, and contact channels for client shoppers, registered bespoke customers, and platform administrators.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Unique identifier for user account |
| `name` | `String` | **No** | — | — | Client's full name |
| `email` | `String` | **No** | — | **UK** | Normalized, lowercase unique email address |
| `phone` | `String` | **Yes** | `null` | **UK** | 10-digit primary phone number |
| `passwordHash` | `String` | **No** | — | — | Bcrypt salted hash (Salt rounds: 10) |
| `role` | `String` | **No** | `"CUSTOMER"` | — | Security authorization role: `"CUSTOMER"` or `"ADMIN"` |
| `createdAt` | `DateTime` | **No** | `now()` | — | Account creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Last modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `User_email_key` ON `email`
  - `User_phone_key` ON `phone`

### Relationships
- **Soft 1:N with `Inquiry`**: Referenced by `Inquiry.userId` (application-level soft join, no DB FK constraint).
- **Soft 1:N with `ActivityLog`**: Referenced by `ActivityLog.adminUserId` (application-level audit logging).

### Code & API Usage
- **Backend APIs**:
  - `POST /api/auth/register` (`authController.register`)
  - `POST /api/auth/login` (`authController.login`)
  - `POST /api/auth/google` (`authController.googleLogin`)
  - `GET /api/auth/me` (`authController.getMe`)
  - `GET /api/auth/users` (`authController.getUsers` — Admin user management)
  - `DELETE /api/auth/users/:id` (`authController.deleteUser`)
- **Frontend Components**:
  - `src/context/AuthContext.jsx` (Global authentication provider)
  - `src/components/AuthModal.jsx` (Customer popup login / register / Google OAuth)
  - `src/pages/Login.jsx` (Dedicated authentication page)
  - `src/admin/pages/AdminLogin.jsx` (Admin login credentials validator)
  - `src/admin/pages/AdminUsers.jsx` (Admin client accounts registry)
- **Status**: **Actively Used**

---

## 2. Table: `Collection`

### Purpose
Represents curated fashion edits and thematic seasonal collections (*Navratri Edit*, *Diwali Edit*, *Raw Denim*, *Y2K Kinetic*, *Contemporary Ethnic*).

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Unique collection identifier |
| `name` | `String` | **No** | — | — | Collection title (e.g., `"NAVRATRI EDIT"`) |
| `slug` | `String` | **No** | — | **UK** | URL slug (e.g., `"active-fest"`, `"navratri"`) |
| `tagline` | `String` | **Yes** | `null` | — | Subtitle or design theme concept |
| `description`| `String` | **Yes** | `null` | — | Editorial and curatorial description |
| `coverImage` | `String` | **No** | — | — | Path or URL to spotlight cover photo |
| `season` | `String` | **Yes** | `null` | — | Seasonal grouping (e.g., `"FESTIVE 2026"`) |
| `status` | `String` | **No** | `"ACTIVE"` | — | Release state: `"ACTIVE"` or `"COMING_SOON"` |
| `featured` | `Boolean` | **No** | `false` | — | Whether to highlight on the homepage |
| `displayOrder`| `Int` | **No** | `0` | — | Sequential position for UI lists |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `Collection_slug_key` ON `slug`

### Relationships
- **1:N with `Product`**: `Product.collectionId` references `Collection.id` with `ON DELETE SET NULL`. Virtual relation `products Product[]` on Collection model.

### Code & API Usage
- **Backend APIs**:
  - `GET /api/collections` (`collectionController.getCollections`)
  - `GET /api/collections/:slug` (`collectionController.getCollectionBySlug`)
  - `POST /api/collections` (`collectionController.createCollection`)
  - `PUT /api/collections/:id` (`collectionController.updateCollection`)
  - `DELETE /api/collections/:id` (`collectionController.deleteCollection`)
- **Frontend Components**:
  - `src/pages/Collections.jsx` (Public collections gallery)
  - `src/pages/CollectionDetail.jsx` (Collection details and lookbook products)
  - `src/admin/pages/AdminCollections.jsx` (Admin collection listing)
  - `src/admin/pages/AdminCollectionForm.jsx` (Admin collection creator/editor)
- **Status**: **Actively Used**

---

## 3. Table: `Category`

### Purpose
Defines high-level garment taxonomy groupings for filtering the reference catalog (*Outerwear*, *Tops*, *Bottoms*, *Ethnic*, *Accessories*).

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Unique category identifier |
| `name` | `String` | **No** | — | — | Display label (e.g. `"Outerwear"`) |
| `slug` | `String` | **No** | — | **UK** | URL slug (e.g. `"outerwear"`) |
| `description`| `String` | **Yes** | `null` | — | Scope and styling category description |
| `status` | `String` | **No** | `"Active"` | — | State: `"Active"` or `"Inactive"` |
| `displayOrder`| `Int` | **No** | `0` | — | Order sequence in navigation and filters |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `Category_slug_key` ON `slug`

### Relationships
- **1:N with `Product`**: `Product.categoryId` references `Category.id` with `ON DELETE SET NULL`. Virtual relation `products Product[]` on Category model.

### Code & API Usage
- **Backend APIs**:
  - `GET /api/categories` (`categoryController.getCategories`)
  - `POST /api/categories` (`categoryController.createCategory`)
  - `PUT /api/categories/:id` (`categoryController.updateCategory`)
  - `DELETE /api/categories/:id` (`categoryController.deleteCategory`)
- **Frontend Components**:
  - `src/admin/pages/AdminCategories.jsx` (Category manager in admin panel)
  - `src/admin/pages/AdminProductForm.jsx` (Category selector dropdown)
  - `src/pages/CollectionDetail.jsx` (Category filter pills bar)
- **Status**: **Actively Used**

---

## 4. Table: `Product`

### Purpose
The primary entity of the VENM platform. Represents bespoke fashion style references, silhouettes, and commissions that can be custom crafted, resized, sourced, or altered.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Unique reference ID (supports custom IDs like `vnm-001`) |
| `name` | `String` | **No** | — | — | Reference garment title |
| `slug` | `String` | **No** | — | **UK** | Unique URL routing identifier |
| `description` | `String` | **Yes** | `null` | — | Extended styling and craftsmanship notes |
| `details` | `String` (JSON) | **No** | `"[]"` | — | JSON array of spec bullet points |
| `collectionId` | `String` | **Yes** | `null` | **FK** | Foreign key referencing `Collection.id` (`ON DELETE SET NULL`) |
| `categoryId` | `String` | **Yes** | `null` | **FK** | Foreign key referencing `Category.id` (`ON DELETE SET NULL`) |
| `collectionSlug`| `String` | **Yes** | `null` | — | Denormalized collection slug for high-speed catalog querying |
| `collectionName`| `String` | **Yes** | `null` | — | Denormalized collection display title |
| `category` | `String` | **Yes** | `null` | — | Denormalized category name string |
| `images` | `String` (JSON) | **No** | `"[]"` | — | JSON array of image URLs/paths (Index 0 is main cover) |
| `sizes` | `String` (JSON) | **No** | `"[]"` | — | JSON array of sizing options (`["XS","S","M","L","XL","Custom"]`) |
| `availability` | `String` | **No** | `"REQUESTABLE"` | — | Status: `"REQUESTABLE"`, `"PUBLISHED"`, `"PAUSED"`, `"COMING_SOON"`, `"DRAFT"` |
| `estimatedPrice`| `String` | **Yes** | `"Estimated from ₹1,800"` | — | Human-formatted price label |
| `minPrice` | `String` | **Yes** | `null` | — | Minimum estimated price boundary (numeric string) |
| `maxPrice` | `String` | **Yes** | `null` | — | Maximum estimated price boundary (numeric string) |
| `priceDisplayMode`|`String` | **Yes** | `"STARTING_FROM"` | — | Mode: `"STARTING_FROM"`, `"PRICE_RANGE"`, `"CUSTOM_QUOTE"` |
| `customizationInfo`|`String`| **Yes** | `"Custom embroidery..."` | — | Customization options and protocol |
| `sizingInfo` | `String` | **Yes** | `"Custom sizing..."` | — | Measurement and tailoring approach |
| `sourceAttribution`|`String`| **Yes** | `"VENM Reference Design"`| — | Base garment sourcing attribution |
| `isFeatured` | `Boolean` | **No** | `false` | — | Homepage style references carousel flag |
| `isNavratriEdit`| `Boolean` | **No** | `false` | — | Active festival inclusion flag |
| `tags` | `String` (JSON) | **No** | `"[]"` | — | Searchable style & trend tags |
| `garmentCare` | `String` | **Yes** | `null` | — | Cleaning and preservation guidelines |
| `viewCount` | `Int` | **No** | `0` | — | Counter incremented on live catalog view events |
| `displayOrder` | `Int` | **No** | `0` | — | Sequence index for catalog sorting |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `Product_slug_key` ON `slug`
- **Foreign Keys**:
  - `Product_collectionId_fkey` ON `collectionId` → `Collection(id)`
  - `Product_categoryId_fkey` ON `categoryId` → `Category(id)`

### Relationships
- **N:1 with `Collection`**: Via `collectionId` (`ON DELETE SET NULL`).
- **N:1 with `Category`**: Via `categoryId` (`ON DELETE SET NULL`).
- **Soft 1:N with `Inquiry`**: Referenced by `Inquiry.productId` and `Inquiry.productSlug`.

### Code & API Usage
- **Backend APIs**:
  - `GET /api/products` (`productController.getProducts`)
  - `GET /api/products/:slug` (`productController.getProductBySlug`)
  - `POST /api/products` (`productController.createProduct`)
  - `PUT /api/products/:id` (`productController.updateProduct` — supports ID & slug fallback)
  - `DELETE /api/products/:id` (`productController.deleteProduct` — supports ID & slug fallback)
  - `PATCH /api/products/:id/status` (`productController.updateProductStatus`)
- **Frontend Components**:
  - `src/components/ProductCard.jsx` (Card presentation across all pages)
  - `src/pages/ProductDetail.jsx` (Detailed product view, specs, image adjuster, inquiry trigger)
  - `src/pages/CollectionDetail.jsx` (Collection product gallery)
  - `src/admin/pages/AdminProducts.jsx` (Admin reference catalog listing & filters)
  - `src/admin/pages/AdminProductForm.jsx` (Full CRUD product management studio)
  - `src/admin/pages/AdminActiveFest.jsx` (Festival product assignment manager)
- **Status**: **Actively Used**

---

## 5. Table: `Campaign`

### Purpose
Governs seasonal campaigns, marketing initiatives, and interactive UI visual enhancements for active festivals.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Campaign identifier |
| `name` | `String` | **No** | — | — | Campaign title |
| `slug` | `String` | **No** | — | **UK** | URL slug |
| `description` | `String` | **Yes** | `null` | — | Marketing narrative |
| `image` | `String` | **Yes** | `null` | — | Campaign banner image |
| `announcement` | `String` | **Yes** | `null` | — | Top banner announcement strip text |
| `startDate` | `String` | **Yes** | `null` | — | Start date string |
| `endDate` | `String` | **Yes** | `null` | — | End date string |
| `status` | `String` | **No** | `"ACTIVE"` | — | State: `"ACTIVE"`, `"SCHEDULED"`, `"ENDED"` |
| `theme` | `String` | **Yes** | `"Festive"` | — | Visual theme preset |
| `festivalLights`| `Boolean` | **No** | `true` | — | Ambient festival lights UI animation |
| `dandiya` | `Boolean` | **No** | `true` | — | Dandiya visual animation toggle |
| `chunri` | `Boolean` | **No** | `true` | — | Festive fabric overlay toggle |
| `bangles` | `Boolean` | **No** | `false` | — | Traditional bangles UI element toggle |
| `festivalGlow` | `Boolean` | **No** | `true` | — | Neon reactive glow filter toggle |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `Campaign_slug_key` ON `slug`

### Code & API Usage
- **Backend APIs**:
  - `GET /api/campaigns` (`campaignController.getCampaigns`)
  - `GET /api/campaigns/active` (`campaignController.getActiveCampaign`)
  - `POST /api/campaigns` (`campaignController.createCampaign`)
  - `PUT /api/campaigns/:id` (`campaignController.updateCampaign`)
  - `DELETE /api/campaigns/:id` (`campaignController.deleteCampaign`)
- **Frontend Components**:
  - `src/admin/pages/AdminCampaigns.jsx` (Admin campaign control center)
  - `src/components/Navbar.jsx` (Announcement bar ticker sync)
- **Status**: **Actively Used**

---

## 6. Table: `HomepageSection`

### Purpose
Modular Content Management System (CMS) table defining the layout, ordering, text copy, and asset links for sections on the storefront home page.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Section identifier |
| `sectionKey` | `String` | **No** | — | **UK** | Partition key: `hero`, `featured_collection`, `brand_statement`, `featured_products`, `lookbook`, `about_story` |
| `name` | `String` | **No** | — | — | Section human-readable title |
| `enabled` | `Boolean` | **No** | `true` | — | Toggle whether section renders on homepage |
| `displayOrder`| `Int` | **No** | `0` | — | Vertical display sequence |
| `content` | `String` (JSON) | **No** | `"{}"` | — | JSON string of modular content attributes (titles, subtitles, buttons) |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `HomepageSection_sectionKey_key` ON `sectionKey`

### Code & API Usage
- **Backend APIs**:
  - `GET /api/homepage` (`homepageController.getHomepageSections`)
  - `PUT /api/homepage` (`homepageController.updateHomepageSection`)
  - `POST /api/homepage/reset` (`homepageController.resetHomepageSections`)
- **Frontend Components**:
  - `src/pages/Home.jsx` (Dynamically renders CMS content)
  - `src/admin/pages/AdminHomepageCMS.jsx` (Full visual CMS editor)
- **Status**: **Actively Used**

---

## 7. Table: `Media`

### Purpose
Asset catalog tracking media files, photography, lookbook shoots, and banner images uploaded to the platform.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Asset identifier |
| `name` | `String` | **No** | — | — | Media file title |
| `url` | `String` | **No** | — | — | Static `/assets/...` path or CDN URL |
| `type` | `String` | **Yes** | `"image/webp"` | — | MIME content type |
| `size` | `String` | **Yes** | `null` | — | Formatted file size string |
| `category` | `String` | **Yes** | `"Products"` | — | Category grouping (`Products`, `Campaigns`, `Lookbook`) |
| `usedBy` | `String` | **Yes** | `"Catalog"` | — | Context of asset usage |
| `altText` | `String` | **Yes** | `null` | — | Accessibility & SEO descriptive text |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`

### Code & API Usage
- **Backend APIs**:
  - `GET /api/media` (`mediaController.getMedia`)
  - `POST /api/media` (`mediaController.createMedia`)
  - `DELETE /api/media/:id` (`mediaController.deleteMedia`)
- **Frontend Components**:
  - `src/admin/pages/AdminMediaLibrary.jsx` (Admin media studio)
- **Status**: **Actively Used**

---

## 8. Table: `Setting`

### Purpose
Provides a centralized, key-value JSON configuration store for platform-wide settings partitions: `general`, `whatsapp`, `social`, `seo`, and `active_fest`.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Setting partition identifier |
| `sectionKey` | `String` | **No** | — | **UK** | Configuration key: `general`, `whatsapp`, `social`, `seo`, `active_fest` |
| `data` | `String` (JSON) | **No** | `"{}"` | — | JSON serialized configuration object |
| `createdAt` | `DateTime` | **No** | `now()` | — | Record creation timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Record modification timestamp |

### Keys & Indexes
- **Primary Key**: `id`
- **Unique Indexes**:
  - `Setting_sectionKey_key` ON `sectionKey`

### Core JSON Data Payloads
- **`general`**: `{ brandName, tagline, contactEmail, contactPhone, location, footerText, siteStatus, logoUrl }`
- **`whatsapp`**: `{ number, rawNumber, enabled, buttonText, defaultTemplate }`
- **`social`**: `{ instagram, facebook, youtube }`
- **`seo`**: `{ siteTitle, metaDescription, defaultOgImage, keywords }`
- **`active_fest`**: `{ name, navLabel, slug, coverImage, galleryImages, assignedProductIds, announcement, status }`

### Code & API Usage
- **Backend APIs**:
  - `GET /api/settings` (`settingsController.getSettings`)
  - `PUT /api/settings` (`settingsController.updateSettings`)
- **Frontend Components**:
  - `src/admin/pages/AdminSettings.jsx` (General, WhatsApp, Social, SEO tabs)
  - `src/admin/pages/AdminActiveFest.jsx` (Active festival controller)
  - `src/data/settings.js` (Client-side settings hydration)
  - `src/components/Footer.jsx`, `src/components/Navbar.jsx`
- **Status**: **Actively Used**

---

## 9. Table: `ActivityLog`

### Purpose
Comprehensive immutable audit log recording administrative actions, catalog modifications, security events, and lead conversions.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Audit log identifier |
| `adminUserId` | `String` | **Yes** | `null` | — | Actor ID (User UUID, `'admin-1'`, `'system-public'`, `'visitor'`) |
| `adminEmail` | `String` | **Yes** | `null` | — | Email of actor at event time |
| `action` | `String` | **No** | — | — | Action key (`USER_LOGIN`, `PRODUCT_CREATED`, `SETTINGS_UPDATED`, etc.) |
| `entityType` | `String` | **No** | — | — | Target entity domain (`PRODUCT`, `COLLECTION`, `AUTH`, `INQUIRY`) |
| `entityId` | `String` | **Yes** | `null` | — | Polymorphic target record identifier |
| `entityName` | `String` | **Yes** | `null` | — | Name snapshot of target record |
| `description` | `String` | **Yes** | `null` | — | Human-readable audit narrative |
| `metadata` | `String` (JSON) | **Yes** | `"{}"` | — | Contextual event metadata |
| `createdAt` | `DateTime` | **No** | `now()` | — | Immutable event timestamp |

### Keys & Indexes
- **Primary Key**: `id`

### Code & API Usage
- **Backend Utilities & APIs**:
  - `server/utils/activityLogger.js` (`logActivity` helper)
  - `GET /api/admin/activity/logs` (`activityController.getActivityLogs`)
  - `GET /api/admin/activity/stream` (`activityController.streamActivitySSE` — Server-Sent Events)
  - `GET /api/admin/activity/dashboard-stats` (`activityController.getDashboardStats`)
  - `GET /api/admin/activity/live-analytics` (`activityController.getLiveUserAnalytics`)
- **Frontend Components**:
  - `src/admin/pages/AdminDashboard.jsx` (Real-time live audit ticker, charts, metrics)
- **Status**: **Actively Used**

---

## 10. Table: `Inquiry`

### Purpose
Captures custom bespoke commissions, styling inquiries, and WhatsApp lead requests from clients.

### Schema Definition
| Field | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | **No** | `uuid()` | **PK** | Inquiry record identifier |
| `userId` | `String` | **Yes** | `null` | — | Soft reference to `User.id` (null for unauthenticated guests) |
| `clientName` | `String` | **Yes** | `null` | — | Client's name |
| `clientContact` | `String` | **Yes** | `null` | — | Primary contact string (phone number or email) |
| `clientEmail` | `String` | **Yes** | `null` | — | Client's email address |
| `clientPhone` | `String` | **Yes** | `null` | — | Client's telephone / WhatsApp contact |
| `userMeta` | `String` (JSON) | **Yes** | `"{}"` | — | JSON snapshot of client profile at submission time |
| `productId` | `String` | **Yes** | `null` | — | Soft reference to requested `Product.id` |
| `productSlug` | `String` | **Yes** | `null` | — | Product URL slug snapshot |
| `productName` | `String` | **No** | — | — | Name of requested reference |
| `productImage` | `String` | **Yes** | `null` | — | Cover image URL snapshot |
| `productPrice` | `String` | **Yes** | `null` | — | Quoted price at time of request |
| `collectionName`| `String` | **Yes** | `null` | — | Associated collection title |
| `selectedSize` | `String` | **Yes** | `null` | — | Chosen sizing or custom measurement code |
| `requestType` | `String` | **Yes** | `"I have my garment"` | — | Commission mode (`"I have my garment"`, `"Source base garment"`, `"WhatsApp Direct Request"`) |
| `note` | `String` | **Yes** | `null` | — | Bespoke tailoring notes / customization requests |
| `status` | `String` | **No** | `"SUBMITTED"` | — | Inquiry workflow stage: `"SUBMITTED"`, `"CONTACTED"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"ARCHIVED"` |
| `createdAt` | `DateTime` | **No** | `now()` | — | Inquiry submission timestamp |
| `updatedAt` | `DateTime` | **No** | auto-updated | — | Last status update timestamp |

### Keys & Indexes
- **Primary Key**: `id`

### Code & API Usage
- **Backend APIs**:
  - `POST /api/inquiries` (`inquiryController.createInquiry`)
  - `GET /api/inquiries` (`inquiryController.getAllInquiries` — Admin enriched inquiry list)
  - `GET /api/inquiries/my` (`inquiryController.getMyInquiries` — Authenticated client's inquiry history)
  - `DELETE /api/inquiries/:id` (`inquiryController.deleteInquiry`)
- **Frontend Components**:
  - `src/components/InquiryModal.jsx` (Commission popup modal)
  - `src/pages/ProductDetail.jsx` (Inquiry triggers: "REQUEST A LOOK", WhatsApp click)
  - `src/pages/Profile.jsx` (Client bespoke order inquiry tracking)
  - `src/admin/pages/AdminDashboard.jsx` (Recent inquiries table and count metrics)
- **Status**: **Actively Used**
