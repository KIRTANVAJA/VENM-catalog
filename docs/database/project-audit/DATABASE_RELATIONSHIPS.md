# VENM CLOTHING BRAND — DATABASE RELATIONSHIPS AUDIT

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Source Code Evidence:** [`prisma/schema.prisma`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma), Backend Controllers ([`server/controllers/`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/)), Frontend Services ([`src/services/api.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/services/api.js)).

---

## 1. Actor Model Verification: Admin vs. User

> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL FINDING:**  
> **There is NO separate `Admin` database entity in this project.**  
> Administrators and public customers share the single, unified `User` table.
>
> **Source Evidence:**
> - Schema definition: [`prisma/schema.prisma` lines 13–22](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma#L13-L22) contains `model User { ... role String @default("CUSTOMER") }`.
> - Authentication logic: [`server/controllers/authController.js` line 71](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L71) inspects `user.role === 'ADMIN'`.
> - Admin Middleware: [`server/middleware/authMiddleware.js` line 15](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/middleware/authMiddleware.js#L15) checks `where: { role: 'ADMIN' }`.
> - Admin Seeding: [`server/seed.js` line 17](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/seed.js#L17) seeds `Studio Admin` directly into `prisma.user` with `role: 'ADMIN'`.
>
> In the Entity Relationship Diagram (ERD), `User` must be modeled as a single entity with an internal discriminator attribute (`role: "ADMIN" | "CUSTOMER"`).

---

## 2. Complete Relationship Analysis Matrix

| # | Source Entity | Source Field | Target Entity | Target Field | Cardinality | Enforced by Database FK? | Managed via App Logic? | Represented inside JSON? | Source Code Evidence |
| :-: | :--- | :--- | :--- | :--- | :-: | :-: | :-: | :-: | :--- |
| **1** | `Product` | `collectionId` | `Collection` | `id` | **N : 1** | **YES** (`onDelete: SetNull`) | Yes | No | [`prisma/schema.prisma` L58-59](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma#L58-L59) |
| **2** | `Product` | `categoryId` | `Category` | `id` | **N : 1** | **YES** (`onDelete: SetNull`) | Yes | No | [`prisma/schema.prisma` L60-61](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma#L60-L61) |
| **3** | `Product` | `collectionSlug` | `Collection` | `slug` | **N : 1** | **NO** | **YES** | No | [`server/controllers/collectionController.js` L37](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/collectionController.js#L37), [`server/controllers/productController.js` L19](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L19) |
| **4** | `Product` | `category` | `Category` | `name` | **N : 1** | **NO** | **YES** | No | [`server/controllers/productController.js` L24](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L24) |
| **5** | `Inquiry` | `userId` | `User` | `id` | **N : 1** | **NO** | **YES** | No | [`server/controllers/inquiryController.js` L28-34, L134-140](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L28-L34), [`server/controllers/authController.js` L307-313](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L307-L313) |
| **6** | `Inquiry` | `productId` | `Product` | `id` | **N : 1** | **NO** | **YES** | No | [`server/controllers/inquiryController.js` L60](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L60), [`src/components/InquiryModal.jsx` L51](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/components/InquiryModal.jsx#L51) |
| **7** | `Inquiry` | `productSlug` | `Product` | `slug` | **N : 1** | **NO** | **YES** | No | [`server/controllers/inquiryController.js` L61](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L61) |
| **8** | `Inquiry` | `clientEmail` / `clientPhone` | `User` | `email` / `phone` | **N : 1** | **NO** | **YES** | No | [`server/controllers/inquiryController.js` L98-112](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L98-L112), [`server/controllers/authController.js` L310-312](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L310-L312) |
| **9** | `ActivityLog` | `adminUserId` | `User` | `id` | **N : 1** | **NO** | **YES** | No | [`server/utils/activityLogger.js` L6-19](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/utils/activityLogger.js#L6-L19), [`server/controllers/authController.js` L69, L145](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L69) |
| **10**| `ActivityLog` | `adminEmail` | `User` | `email` | **N : 1** | **NO** | **YES** | No | [`server/utils/activityLogger.js` L8, L20](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/utils/activityLogger.js#L8) |
| **11**| `ActivityLog` | `entityId` | Multiple Entities (`Product`, `Collection`, `Category`, `Campaign`, `Media`, `User`, `Inquiry`, `Setting`) | `id` / `sectionKey` | **Polymorphic (N : 1)** | **NO** | **YES** | No | [`server/utils/activityLogger.js` L23](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/utils/activityLogger.js#L23), [`server/controllers/productController.js` L168](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L168) |
| **12**| `HomepageSection`| `content.collectionSlug` | `Collection` | `slug` | **N : 1** | **NO** | **YES** | **YES** (`content` JSON) | [`server/controllers/homepageController.js` L28](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/homepageController.js#L28) |
| **13**| `HomepageSection`| `content.heroImage` / `coverImage` | `Media` | `url` | **N : 1** | **NO** | **YES** | **YES** (`content` JSON) | [`server/controllers/homepageController.js` L15, L86](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/homepageController.js#L15) |
| **14**| `Setting` | `data.active_fest.slug` | `Collection` / `Campaign` | `slug` | **1 : 1** | **NO** | **YES** | **YES** (`data` JSON) | [`server/controllers/settingsController.js` L89-98](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/settingsController.js#L89-L98), [`src/admin/pages/AdminActiveFest.jsx` L64](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminActiveFest.jsx#L64) |
| **15**| `Campaign` | `isNavratriEdit` association | `Product` | `isNavratriEdit` | **1 : N** | **NO** | **YES** | No | [`server/controllers/productController.js` L15](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/productController.js#L15), [`src/admin/pages/AdminActiveFest.jsx` L58](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminActiveFest.jsx#L58) |

---

## 3. Deep-Dive Relationship Verification

---

### Relationship 1 & 2: Database-Enforced Foreign Keys (`Product` → `Collection`, `Product` → `Category`)
In [`prisma/schema.prisma`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma#L58-L61):
```prisma
model Product {
  ...
  collectionId  String?
  collection    Collection? @relation(fields: [collectionId], references: [id], onDelete: SetNull)
  categoryId    String?
  categoryObj   Category?   @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  ...
}
```
* **Cardinality:** Many Products to One Collection (`Collection` 1 ──< N `Product`), Many Products to One Category (`Category` 1 ──< N `Product`).
* **Referential Integrity Action:** `onDelete: SetNull`. If a collection or category is deleted, child products remain preserved in the catalog with foreign key fields set to `null`.
* **Database Constraints:** PostgreSQL creates foreign key constraints linking `Product(collectionId)` to `Collection(id)` and `Product(categoryId)` to `Category(id)`.

---

### Relationship 3 & 4: Denormalized Natural Keys (`Product` ↔ `Collection.slug`, `Product` ↔ `Category.name`)
Alongside the surrogate UUID foreign keys, the `Product` table stores denormalized string columns:
- `collectionSlug String?`
- `collectionName String?`
- `category String?`
* **Why this exists:** The frontend routes and customer filters interact via human-readable URL slugs (`/collection/navratri`) rather than UUID strings. In [`server/controllers/collectionController.js` line 36](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/collectionController.js#L36), `getCollectionBySlug` retrieves all associated garments using:
  ```javascript
  const products = await prisma.product.findMany({
    where: { collectionSlug: collection.slug }
  });
  ```
* **Cardinality:** 1 : N (One Collection has Many Products; One Category has Many Products).
* **Enforcement:** Application-level logic.

---

### Relationship 5, 6 & 7: Customer Inquiries (`Inquiry` → `User`, `Inquiry` → `Product`)
In [`prisma/schema.prisma` lines 150–170](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/prisma/schema.prisma#L150-L170):
```prisma
model Inquiry {
  id             String   @id @default(uuid())
  userId         String?
  ...
  productId      String?
  productSlug    String?
  productName    String
  ...
}
```
* **Why no DB-level FK constraint?**
  1. **Guest Inquiries:** Visitors can submit bespoke garment inquiries without creating a customer account. If `userId` were an enforced non-nullable foreign key, unauthenticated guest requests would fail.
  2. **Product Price Snapshots:** Bespoke fashion quotes change over time. The `Inquiry` table deliberately denormalizes and snapshots `productName`, `productPrice`, `productImage`, and `collectionName` so historical inquiry records remain intact even if the reference product is later edited or deleted.
* **Application Enforcement Evidence:**
  - In [`server/controllers/inquiryController.js` lines 134–140](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/inquiryController.js#L134-L140), `getAllInquiries` extracts unique `userIds` and fetches user entities using `prisma.user.findMany({ where: { id: { in: userIds } } })` to enrich the admin dashboard.
  - In [`server/controllers/authController.js` lines 307–319](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/authController.js#L307-L319), `getAllUsers` performs a subquery counting inquiries matching each user:
    ```javascript
    const inquiriesCount = await prisma.inquiry.count({
      where: {
        OR: [
          { userId: u.id },
          ...(u.email ? [{ clientEmail: u.email }] : []),
          ...(u.phone ? [{ clientPhone: u.phone }] : [])
        ]
      }
    });
    ```

---

### Relationship 8 & 9: Audit Trail (`ActivityLog` → `User`)
* **Source:** `ActivityLog.adminUserId`, `ActivityLog.adminEmail`
* **Target:** `User.id`, `User.email`
* **Cardinality:** One User has Many ActivityLogs (`User` 1 ──< N `ActivityLog`).
* **Enforcement:** Application logic in [`server/utils/activityLogger.js`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/utils/activityLogger.js).
* **Guest Handling:** When public visitors trigger actions (e.g., viewing a look or clicking WhatsApp), `adminUserId` is set to `"visitor"` or `"system-public"`, and `adminEmail` is set to the visitor's contact string or `"public-visitor"`.

---

### Relationship 10: Polymorphic Audit Reference (`ActivityLog` → Any Entity)
* `ActivityLog.entityId` + `ActivityLog.entityType` functions as a polymorphic soft foreign key.
* Supported entity targets:
  - `entityType: "PRODUCT"` → `entityId` corresponds to `Product.id`
  - `entityType: "COLLECTION"` → `entityId` corresponds to `Collection.id`
  - `entityType: "CATEGORY"` → `entityId` corresponds to `Category.id`
  - `entityType: "CAMPAIGN"` → `entityId` corresponds to `Campaign.id`
  - `entityType: "MEDIA"` → `entityId` corresponds to `Media.id`
  - `entityType: "AUTH"` → `entityId` corresponds to `User.id`
  - `entityType: "INQUIRY"` → `entityId` corresponds to `Inquiry.id`
  - `entityType: "HOMEPAGE"` → `entityId` corresponds to `HomepageSection.sectionKey`
  - `entityType: "SETTINGS"` → `entityId` corresponds to `Setting.sectionKey`

---

### Relationship 11 & 12: JSON-Embedded Relationships
* **HomepageSection → Collection:**
  The `HomepageSection` row with `sectionKey = "featured_collection"` embeds `collectionSlug: "navratri"` inside its `content` JSON column ([`server/controllers/homepageController.js` line 28](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/server/controllers/homepageController.js#L28)). The storefront uses this slug to fetch the collection.
* **Setting → Active Festival (Collection & Campaign):**
  The `Setting` row with `sectionKey = "general"` embeds `active_fest` inside its `data` JSON column ([`src/admin/pages/AdminActiveFest.jsx`](file:///d:/ceative/5PROJECTS/VENM1/VENM1/VENM1/src/admin/pages/AdminActiveFest.jsx)). This coordinates festival hero banners, campaign toggles, and collection links across the entire website.

---

## 4. Missing or Incomplete Database Relationships & Recommendations

1. **Missing Enforced FK on `Inquiry.userId`:**
   - *Current State:* `userId String?` has no foreign key constraint.
   - *Architectural Recommendation:* Maintain nullable `userId` for guest checkout, but add an enforced foreign key with `onDelete: SetNull` so deleting a user clears the reference without corrupting the historical inquiry record.
2. **Missing Enforced FK on `Inquiry.productId`:**
   - *Current State:* `productId String?` has no foreign key constraint.
   - *Architectural Recommendation:* Add an enforced foreign key with `onDelete: SetNull`.
3. **Dual-Key Redundancy on `Product` (`collectionId` vs `collectionSlug`):**
   - *Current State:* `Product` contains both an enforced FK `collectionId` and an application string `collectionSlug`. In practice, the controllers write both, but mostly query by `collectionSlug`.
   - *Recommendation:* Normalize all queries through the foreign key relation, or introduce an automated trigger/middleware hook guaranteeing consistency between `collectionId` and `collectionSlug`.
