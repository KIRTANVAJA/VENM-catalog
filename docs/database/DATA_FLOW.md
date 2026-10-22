# VENM Data Flow Architecture

This document provides a comprehensive, end-to-end mapping of data movements across the VENM platform—from client-side user interactions and browser persistence layers, through the Express REST API and Prisma ORM, to the PostgreSQL database and real-time Server-Sent Events (SSE) telemetry.

---

## 1. Architectural Overview

VENM operates on a hybrid architecture combining a high-performance **PostgreSQL** relational database with an optimistic client-side **`localStorage` cache** and an asynchronous **Server-Sent Events (SSE)** telemetry stream.

```mermaid
flowchart TD
    subgraph Client ["Client Browser Tier"]
        UI["React UI (Vite SPA)"]
        LS[("localStorage Cache")]
        AuthCtx["AuthContext State"]
    end

    subgraph Server ["Node.js / Express Server Tier"]
        API["Express Router (/api/*)"]
        AuthMid["authMiddleware (JWT Verify)"]
        Controllers["Controllers & Loggers"]
        MemMap[("In-Memory Presence Map")]
        SSE["SSE Broadcaster (Set)"]
    end

    subgraph Persistence ["Database Tier (PostgreSQL)"]
        Prisma["Prisma ORM Client"]
        PG[("PostgreSQL DB (Render)")]
    end

    UI <-->|"Read / Write Tokens & Cached State"| LS
    UI -->|"HTTP REST Requests (Credentials: true)"| API
    API --> AuthMid --> Controllers
    Controllers -->|"Prisma Queries ($transaction, findMany, etc.)"| Prisma
    Prisma <-->|"SQL Connection Pool"| PG
    Controllers -->|"Register Heartbeat"| MemMap
    Controllers -->|"Broadcast Event"| SSE
    SSE -.->|"SSE Stream (data: JSON)"| UI
```

### Architectural Distinctions
1. **Database Relational Constraints**: Strictly enforced only for `Product.collectionId -> Collection.id` and `Product.categoryId -> Category.id`.
2. **Application-Level Soft Links**: Managed programmatically in Node.js controllers without database foreign key constraints (e.g., `Inquiry.userId -> User.id`, `Inquiry.productId -> Product.id`, `ActivityLog.adminUserId -> User.id`).
3. **Optimistic LocalStorage Hydration**: The frontend hydrates state instantly from `localStorage` (`venm_cached_*`, `venm_homepage_cms`, `venm_settings`) before revalidating with live API responses to eliminate layout shifts.
4. **Volatile In-Memory State**: Active visitor presence and live tab heartbeats are kept in server memory (`activeVisitors` Map) with a 45-second TTL, rather than generating heavy database writes.

---

## 2. Core Workflow Data Flows

```mermaid
graph TD
    A[Admin / Visitor Action] --> B{Action Type}
    B -->|Catalog Management| C[Product / Collection CRUD]
    B -->|Look Inquiry| D[Bespoke Look & WhatsApp Lead]
    B -->|Authentication| E[Register / Login / JWT]
    B -->|Content Management| F[Homepage CMS & Settings]
    B -->|Telemetry| G[Heartbeat & Live Analytics]

    C --> H[PostgreSQL: Product, Collection, Category]
    D --> I[PostgreSQL: Inquiry + ActivityLog]
    E --> J[PostgreSQL: User + Cookie/Token]
    F --> K[PostgreSQL: HomepageSection, Setting]
    G --> L[In-Memory Map + SSE Broadcast]
```

---

### Flow 1: Product Management Lifecycle (Admin CRUD to Storefront)

This flow traces how luxury fashion pieces are created, updated, and presented on the public catalog.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Manager
    participant UI as Admin Products UI
    participant API as Express API (/api/products)
    participant Auth as authMiddleware (adminOnly)
    participant PC as productController.js
    participant DB as Prisma / PostgreSQL
    participant AL as ActivityLogger
    participant Cache as Public Client (localStorage)

    Admin->>UI: Submit Product Form (Name, Slug, Prices, JSON Details/Images)
    UI->>API: POST /api/products (Authorization: Bearer <token>)
    API->>Auth: Verify JWT & verify role === 'ADMIN'
    Auth-->>API: Authorized (req.user)
    API->>PC: createProduct(req, res)
    PC->>PC: Validate mandatory fields & normalize JSON fields
    PC->>DB: prisma.product.create({ data: { ... } })
    DB-->>PC: Return created Product record
    PC->>AL: logActivity({ action: 'PRODUCT_CREATED', entityId: product.id })
    AL->>DB: prisma.activityLog.create({ ... })
    AL--)API: Trigger global.broadcastActivitySSE(activityLog)
    PC-->>UI: HTTP 201 Created { product }
    
    note over UI,Cache: Storefront Consumption
    actor Visitor as Catalog Visitor
    Visitor->>Cache: Visit /collections/:slug or /product/:slug
    Cache->>Cache: Read localStorage ('venm_cached_product_*')
    Cache-->>Visitor: Instant render from cache
    Cache->>API: GET /api/products/:slug
    API->>PC: getProductBySlug(req, res)
    PC->>DB: prisma.product.findUnique({ include: { collection: true, categoryRel: true } })
    DB-->>PC: Live Product Data
    PC-->>Cache: HTTP 200 { product }
    Cache->>Cache: Overwrite localStorage cache with fresh DB record
```

#### Step-by-Step Data Transformations
1. **Form Input Serialization**: Admin fills inputs. Images array, sizing charts, and product bullet points are serialized into JSON arrays/objects.
2. **Payload Submission**: Sent as JSON payload with Bearer JWT header to `POST /api/products`.
3. **Database Insertion**:
   - `collectionId` and `categoryId` link to parent entities with foreign key constraints.
   - Slug uniqueness is enforced by PostgreSQL unique index `Product_slug_key`.
   - Denormalized strings `collectionSlug`, `collectionName`, and `category` are written simultaneously for high-speed queries.
4. **Audit Log Generation**: `activityLogger.js` writes an audit trail to `ActivityLog` and executes `global.broadcastActivitySSE` to update admin analytics screens in real time.
5. **Storefront Cache Invalidation**: The storefront checks if local cache exists. Once the API returns updated data, it rewires React state and saves to `localStorage.setItem('venm_cached_product_' + slug, JSON.stringify(liveProduct))`.

---

### Flow 2: Bespoke Look Inquiry & WhatsApp Lead Capture

VENM functions as a high-end bespoke atelier platform where users "Request a Look" rather than checking out via a standard cart.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Client / Visitor
    participant Modal as InquiryModal.jsx
    participant LS as Client localStorage
    participant API as Express API (/api/inquiries)
    participant IC as inquiryController.js
    participant DB as Prisma / PostgreSQL
    participant AL as ActivityLogger
    participant AdminUI as Admin Inquiries Panel
    participant WA as WhatsApp Web Gateway

    Customer->>Modal: Open "Request This Look" on Product Page
    Customer->>Modal: Select Size, Garment Option, Input Phone/Email & Note
    
    alt User Submits Inquiry Form
        Modal->>API: POST /api/inquiries { productId, productName, clientContact, ... }
        API->>IC: createInquiry(req, res)
        IC->>DB: Find optional registered user (prisma.user.findUnique)
        IC->>DB: prisma.inquiry.create({ data: { ... status: 'SUBMITTED' } })
        DB-->>IC: Created Inquiry ID
        IC->>AL: logActivity({ action: 'INQUIRY_CREATED', entityType: 'INQUIRY' })
        AL->>DB: prisma.activityLog.create()
        AL--)AdminUI: SSE Broadcast -> Notification Badge Increments
        IC-->>Modal: HTTP 201 { inquiry }
        Modal->>LS: Append to 'venm_inquiries_{userId}'
        Modal-->>Customer: Display Success Confirmation & Reference Code
    else User Clicks "Inquire via WhatsApp"
        Modal->>API: POST /api/analytics/whatsapp-click { productName, collectionName }
        API->>AL: logActivity({ action: 'WHATSAPP_INQUIRY_CLICKED' })
        AL->>DB: prisma.activityLog.create()
        Modal->>WA: window.open("https://wa.me/91XXXXXXXXXX?text=...")
        WA-->>Customer: Redirect to WhatsApp chat with pre-filled look details
    end
```

#### Step-by-Step Data Transformations
1. **User Identity Resolution**: If the user is logged in, `userId`, `clientName`, and `clientContact` are automatically extracted from `AuthContext`. If anonymous, visitor input is accepted.
2. **Denormalized Snapshotting**: `productSlug`, `productName`, `productImage`, and `productPrice` are cloned directly into the `Inquiry` row so that future price updates or product deletions do not alter historical inquiries.
3. **Audit & SSE Trigger**: Node.js logs the event in `ActivityLog` and pushes the payload down active SSE pipes.
4. **Dual-Channel Fallback**: If the customer prefers direct instant messaging, clicking WhatsApp triggers an analytics beacon to `/api/analytics/whatsapp-click` while opening the WhatsApp API with URI-encoded look metadata.

---

### Flow 3: Client & Admin Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / Admin
    participant AuthUI as Login / Register UI
    participant API as Express API (/api/auth)
    participant AC as authController.js
    participant DB as Prisma / PostgreSQL
    participant JWT as jsonwebtoken Engine
    participant AL as ActivityLogger

    User->>AuthUI: Enter credentials (Email/Phone + Password)
    AuthUI->>API: POST /api/auth/login or /api/auth/register
    API->>AC: login(req, res) or register(req, res)
    
    alt Register
        AC->>DB: prisma.user.findFirst({ where: { OR: [email, phone] } })
        DB-->>AC: Null (User does not exist)
        AC->>AC: bcrypt.hash(password, 10)
        AC->>DB: prisma.user.create({ data: { name, email, phone, passwordHash, role } })
        DB-->>AC: Created User Record
    else Login
        AC->>DB: prisma.user.findFirst({ where: { OR: [email, phone] } })
        DB-->>AC: User Record
        AC->>AC: bcrypt.compare(password, user.passwordHash)
    end

    AC->>JWT: sign({ id, role, email }, JWT_SECRET, { expiresIn: '7d' })
    JWT-->>AC: Signed Token String
    AC->>AL: logActivity({ action: 'USER_LOGIN', adminUserId: user.id })
    AL->>DB: prisma.activityLog.create()
    
    AC-->>AuthUI: Set-Cookie: token=<jwt>; HttpOnly; Secure<br/>HTTP 200 { user, token }
    AuthUI->>AuthUI: localStorage.setItem('venm_user_token', token)<br/>localStorage.setItem('venm_user', JSON.stringify(user))
    AuthUI-->>User: Redirect to Storefront or Admin Dashboard
```

#### Google Authentication Support
In `Login.jsx`, VENM also supports Google Authentication. The client retrieves the email/name, passes it to the backend authentication pipeline, and caches `venm_last_google_email` in `localStorage` for rapid subsequent sessions.

---

### Flow 4: Homepage CMS & Dynamic Layout Engine

VENM allows administrators to reorder, enable, disable, and customize homepage content without code deployments.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Content Manager
    participant AdminCMS as AdminHomepageCMS.jsx
    participant API as Express API (/api/homepage)
    participant HC as homepageController.js
    participant DB as Prisma / PostgreSQL
    participant Storefront as Home.jsx (Public Visitor)

    Admin->>AdminCMS: Modify Hero Headline, Toggle Festive Banner, Reorder Sections
    AdminCMS->>API: PUT /api/homepage/sections { sections: [...] }
    API->>HC: updateHomepageSections(req, res)
    
    loop For each section in payload
        HC->>DB: prisma.homepageSection.upsert({ where: { sectionKey }, update: { content, enabled, displayOrder } })
    end
    DB-->>HC: Updated Records
    HC-->>AdminCMS: HTTP 200 { success: true }
    
    note over Storefront,DB: Public Rendering Flow
    Storefront->>Storefront: Check localStorage('venm_homepage_cms')
    Storefront-->>Admin: Show cached layout immediately
    Storefront->>API: GET /api/homepage/sections
    API->>HC: getHomepageSections(req, res)
    HC->>DB: prisma.homepageSection.findMany({ where: { enabled: true }, orderBy: { displayOrder: 'asc' } })
    DB-->>HC: Active Sections
    HC-->>Storefront: HTTP 200 { sections }
    Storefront->>Storefront: localStorage.setItem('venm_homepage_cms', JSON.stringify(map))
    Storefront-->>Admin: Re-render DOM with fresh content
```

---

### Flow 5: Active Festival & Seasonal Campaign Settings

VENM features a dynamic "Active Fest" curation engine (e.g., Navratri, Diwali) that associates specific products with festival showcases.

```mermaid
flowchart TD
    subgraph AdminAction ["Admin Portal (AdminActiveFest.jsx)"]
        SelectFest["Select Festival Theme (e.g., 'navratri')"]
        PickProducts["Pick Assigned Product IDs [prod-1, prod-2, ...]"]
        SaveSettings["Click 'Save Festival Configuration'"]
    end

    subgraph BackendProcess ["Backend Settings API"]
        PUTRoute["PUT /api/settings/active_fest"]
        SettingsCtrl["settingsController.js -> updateSection"]
        PrismaUpsert["prisma.setting.upsert({\n  where: { sectionKey: 'active_fest' },\n  update: { data: JSON.stringify({...}) }\n})"]
    end

    subgraph DatabaseLayer ["PostgreSQL"]
        SettingRow[("Setting Table\nsectionKey = 'active_fest'\ndata = '{ theme, assignedProductIds: [...] }'")]
    end

    subgraph VisitorStorefront ["Storefront (CollectionDetail.jsx / Home.jsx)"]
        FetchSettings["GET /api/settings/active_fest"]
        ParseIDs["Extract assignedProductIds Array"]
        FilterProds["Filter Products:\nproduct.isNavratriEdit || assignedProductIds.includes(product.id)"]
        RenderFest["Display Exclusive Festival Showcase"]
    end

    SelectFest --> PickProducts --> SaveSettings
    SaveSettings --> PUTRoute --> SettingsCtrl --> PrismaUpsert --> SettingRow
    SettingRow -.-> FetchSettings --> ParseIDs --> FilterProds --> RenderFest
```

---

### Flow 6: Real-time Visitor Telemetry & SSE Stream

VENM monitors live visitor presence and catalog interactions in real time using a lightweight heartbeat mechanism.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Catalog Visitor
    participant Tab as Browser Tab (App.jsx)
    participant API as Express Server (/api/analytics)
    participant ActCtrl as activityController.js
    participant Mem as in-memory activeVisitors Map
    participant DB as Prisma / PostgreSQL
    actor Admin as Admin Dashboard
    participant Stream as SSE Stream (/api/admin/activity/stream)

    Admin->>Stream: Open EventSource connection
    Stream->>ActCtrl: streamActivity() -> Add response to sseClients Set
    
    loop Every 20 Seconds
        Tab->>API: POST /api/analytics/heartbeat { sessionId, currentPath, viewingProductId }
        API->>ActCtrl: recordHeartbeat(req, res)
        ActCtrl->>Mem: activeVisitors.set(key, { path, lastSeen: Date.now() })
        ActCtrl->>Mem: Prune records where (Date.now() - lastSeen > 45000)
        ActCtrl-->>Tab: HTTP 200 { liveOnlineCount, onlineUsersCount }
    end

    alt Visitor Views Product Page
        Tab->>API: POST /api/analytics/product-view { productId, productName }
        API->>ActCtrl: recordProductView(req, res)
        ActCtrl->>DB: prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } })
        ActCtrl->>DB: prisma.activityLog.create({ action: 'PRODUCT_VIEW', ... })
        DB-->>ActCtrl: New ActivityLog
        ActCtrl--)Stream: broadcastActivitySSE(newLog)
        Stream-->>Admin: EventSource onmessage -> Prepend to live activity feed & update chart
    end
```

---

## 3. Frontend-to-Backend-to-Database Mapping Matrix

| Functional Module | Frontend Component | API Endpoint | HTTP Method | Controller Function | Prisma / DB Operation | Target Entities |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **User Registration** | `Register.jsx` | `/api/auth/register` | `POST` | `register` | `prisma.user.create` | `User`, `ActivityLog` |
| **User Login** | `Login.jsx` | `/api/auth/login` | `POST` | `login` | `prisma.user.findFirst` | `User`, `ActivityLog` |
| **Catalog Listing** | `Collections.jsx` | `/api/collections` | `GET` | `getCollections` | `prisma.collection.findMany` | `Collection` |
| **Collection Detail** | `CollectionDetail.jsx` | `/api/collections/:slug` | `GET` | `getCollectionBySlug` | `prisma.collection.findUnique` | `Collection`, `Product` |
| **Product Detail** | `ProductDetail.jsx` | `/api/products/:slug` | `GET` | `getProductBySlug` | `prisma.product.findUnique` | `Product`, `Collection`, `Category` |
| **Product CRUD** | `AdminProducts.jsx` | `/api/products` | `POST`/`PUT`/`DELETE` | `createProduct`, `updateProduct`, `deleteProduct` | `prisma.product.*` | `Product`, `ActivityLog` |
| **Inquiry Submission** | `InquiryModal.jsx` | `/api/inquiries` | `POST` | `createInquiry` | `prisma.inquiry.create` | `Inquiry`, `ActivityLog`, `User` |
| **Customer Inquiries** | `Profile.jsx` | `/api/inquiries/my` | `GET` | `getMyInquiries` | `prisma.inquiry.findMany` | `Inquiry` |
| **Admin Inquiries** | `AdminInquiries.jsx` | `/api/inquiries/all` | `GET` | `getAllInquiries` | `prisma.inquiry.findMany` + in-memory user join | `Inquiry`, `User` |
| **Homepage CMS** | `AdminHomepageCMS.jsx` | `/api/homepage/sections` | `PUT` | `updateHomepageSections` | `prisma.homepageSection.upsert` | `HomepageSection` |
| **Media Library** | `AdminMediaLibrary.jsx` | `/api/media` | `GET`/`POST`/`DELETE` | `getAllMedia`, `createMedia`, `deleteMedia` | `prisma.media.*` | `Media` |
| **Store Settings** | `AdminSettings.jsx` | `/api/settings/:key` | `PUT` | `updateSection` | `prisma.setting.upsert` | `Setting` |
| **Active Fest** | `AdminActiveFest.jsx` | `/api/settings/active_fest` | `PUT` | `updateSection` | `prisma.setting.upsert` | `Setting` |
| **Live Telemetry** | `App.jsx` | `/api/analytics/heartbeat` | `POST` | `recordHeartbeat` | In-memory `activeVisitors` Map | *None (Volatile)* |
| **Activity Feed** | `AdminDashboard.jsx` | `/api/admin/activity/stream` | `GET` (SSE) | `streamActivity` | `global.broadcastActivitySSE` | `ActivityLog` |
