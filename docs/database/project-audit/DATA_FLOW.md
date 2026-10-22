# VENM CLOTHING BRAND — END-TO-END DATA FLOW TRACING

**Audit Date:** October 2026  
**Auditor:** Senior Database Architect & Software Systems Analyst  
**Architecture Paradigm:** Decoupled Client-Server (React 19 SPA ↔ Express REST ↔ Prisma 6 ↔ PostgreSQL)

---

## 1. Complete Feature Data Flow Pipelines

---

### Pipeline 1: User Registration
```
[ User Browser ]
  │ User enters name, email/phone, password in AuthModal.jsx or /login
  ▼
[ HTTP Request ]
  │ POST /api/auth/register (JSON Payload)
  ▼
[ Middleware Layer ]
  │ express.json(), cookieParser()
  ▼
[ Controller ]
  │ authController.register()
  │ Validates input & verifies cleanPhone / cleanEmail
  │ Runs bcrypt.hash(password, 10)
  ▼
[ Database Layer ]
  │ prisma.user.findFirst({ where: { OR: [email, phone] } }) -> Duplicate check
  │ prisma.user.create({ data: { name, email, phone, passwordHash, role: "CUSTOMER" } })
  │ prisma.activityLog.create({ data: { action: "USER_REGISTERED", ... } })
  ▼
[ Token Generation ]
  │ generateToken(newUser) -> Signs JWT with JWT_SECRET
  │ res.cookie('venm_admin_token', token, { httpOnly: true, maxAge: 7 days })
  ▼
[ Client State Response ]
  │ HTTP 201 Created -> { message, token, user }
  │ Frontend stores user in localStorage('venm_user') & updates AuthContext
```

---

### Pipeline 2: User & Admin Authentication (Login & Passkey Modal)
```
[ User / Studio Admin ]
  │ Standard Login: Form submission on /login
  │ Studio Fast-Track: Press Ctrl+Shift+A -> Enter PIN 1310 in AdminPasskeyModal.jsx
  ▼
[ HTTP Request ]
  │ POST /api/auth/login (identifier: email/phone, password)
  ▼
[ Controller ]
  │ authController.login()
  │ Matches identifier against email, phone, or name in User table
  │ bcrypt.compare(password, user.passwordHash)
  ▼
[ Database Layer ]
  │ prisma.user.findFirst({ where: { OR: [email, phone, name] } })
  │ prisma.activityLog.create({ action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'USER_LOGIN' })
  │ global.broadcastActivitySSE(entry) -> Broadcasts to live SSE stream
  ▼
[ Response & Client State ]
  │ Sets HTTP-only cookie venm_admin_token
  │ HTTP 200 OK -> { message, token, user: { id, name, email, phone, role } }
  │ Admin redirect to /admin/dashboard; Customer redirect to /
```

---

### Pipeline 3: Product Creation, Editing & Publishing
```
[ Studio Admin Form ]
  │ AdminProductForm.jsx (fills specifications, price mode, uploads/crops images)
  ▼
[ HTTP Request ]
  │ POST /api/products (Create) or PUT /api/products/:id (Update)
  │ Headers: Authorization: Bearer <token> & Cookie: venm_admin_token
  ▼
[ Middleware ]
  │ protectAdmin() (authMiddleware.js)
  │ Verifies JWT token, loads user from database, confirms user.role === 'ADMIN'
  ▼
[ Controller ]
  │ productController.createProduct() / updateProduct()
  │ Serializes JSON fields: details, images, sizes, tags
  │ Auto-generates unique slug if not provided
  ▼
[ Database Layer ]
  │ prisma.product.create() / prisma.product.update()
  │ prisma.activityLog.create({ action: 'PRODUCT_CREATED' / 'PRODUCT_UPDATED', ... })
  │ global.broadcastActivitySSE(entry)
  ▼
[ Frontend Reaction ]
  │ HTTP 201/200 -> Returns updated product object with JSON strings parsed to arrays
  │ React state updates, shows success toast, redirects to /admin/products
```

---

### Pipeline 4: Product Detail Browsing & View Count Increment
```
[ Customer Browser ]
  │ Visits /product/:slug (ProductDetail.jsx)
  ▼
[ HTTP Request 1 (Detail Load) ]
  │ GET /api/products/:slug
  ▼
[ Controller & Database ]
  │ productController.getProductBySlug()
  │ prisma.product.findFirst({ where: { OR: [{ slug }, { id }] } })
  ▼
[ HTTP Request 2 (Analytics Increment) ]
  │ POST /api/analytics/product-view ({ productId, productSlug, productName, user })
  ▼
[ Controller & Database ]
  │ activityController.recordProductView()
  │ prisma.product.updateMany({ where: { id/slug }, data: { viewCount: { increment: 1 } } })
  │ prisma.activityLog.create({ action: 'PRODUCT_VIEW', entityId: id, entityName: name })
  ▼
[ Response ]
  │ HTTP 200 OK -> Product details render with specs, sizes, and priceDisplayMode
```

---

### Pipeline 5: Customer Bespoke Inquiry Submission (Web Modal)
```
[ Customer Modal ]
  │ User clicks "REQUEST THIS LOOK" on product card or detail page
  │ Fills requestType ("I have my garment" vs "Source base"), custom fit notes
  ▼
[ HTTP Request ]
  │ POST /api/inquiries (InquiryModal.jsx)
  ▼
[ Controller ]
  │ inquiryController.createInquiry()
  │ Detects authenticated userId from session or request body
  │ Queries registered user profile if authenticated
  ▼
[ Database Layer ]
  │ prisma.inquiry.create({
  │   data: {
  │     userId, clientName, clientContact, clientEmail, clientPhone, userMeta,
  │     productId, productSlug, productName, productImage, productPrice,
  │     collectionName, selectedSize, requestType, note, status: 'SUBMITTED'
  │   }
  │ })
  │ prisma.activityLog.create({ action: 'INQUIRY_CREATED', entityName: productName })
  │ global.broadcastActivitySSE(entry)
  ▼
[ Response & Local Storage ]
  │ HTTP 201 Created -> { message, inquiry }
  │ Client stores snapshot in localStorage(`venm_inquiries_${userId}`)
  │ Dispatches 'venm-inquiries-updated' event for instant UI reactivity
```

---

### Pipeline 6: WhatsApp Direct Inquiry Click
```
[ Customer Click ]
  │ Clicks "REPLY ON WHATSAPP" or "REQUEST ON WHATSAPP"
  ▼
[ Background Telemetry HTTP Request ]
  │ POST /api/analytics/whatsapp-click ({ productName, collectionName })
  ▼
[ Express Server ]
  │ app.js -> logActivity({ action: 'WHATSAPP_INQUIRY_CLICKED', entityName: productName })
  │ prisma.activityLog.create()
  ▼
[ WhatsApp Client Launch ]
  │ formatWhatsAppUrl() compiles template:
  │ https://wa.me/917434096095?text=Hi%20VENM!%20...%20Reference:%20{product_name}
  │ Browser opens WhatsApp Web / Mobile app directly with pre-composed inquiry
```

---

### Pipeline 7: Real-Time Admin SSE Stream & Dashboard
```
[ Admin Dashboard Browser ]
  │ Visits /admin/dashboard
  ▼
[ HTTP / EventStream Request ]
  │ GET /api/admin/activity/stream
  ▼
[ Express Stream Controller ]
  │ activityController.streamActivity()
  │ Registers client response in sseClients Set
  │ Sends initial { type: 'CONNECTED' } packet
  ▼
[ Background Event Trigger ]
  │ Any controller executes logActivity() (e.g., user login, product view, inquiry)
  │ global.broadcastActivitySSE(activityEntry) writes JSON payload to all SSE clients
  ▼
[ Frontend Live Reaction ]
  │ EventSource.onmessage parses payload
  │ Updates live presence counter, adds row to audit feed, updates SVG chart in real time
```

---

### Pipeline 8: Active Festival Campaign Coordination
```
[ Studio Admin in AdminActiveFest.jsx ]
  │ Updates title, cover photo, gallery images, and assigns product IDs
  ▼
[ Multi-Entity Synchronization ]
  │ 1. PUT /api/campaigns/:id -> Updates Campaign record
  │ 2. PUT /api/collections/:id -> Updates Collection banner and tagline
  │ 3. PUT /api/settings -> Updates Setting.data.active_fest
  │ 4. PUT /api/homepage -> Updates Hero section content
  │ 5. PUT /api/products/:id -> Toggles isNavratriEdit flag for assigned garments
  ▼
[ Database Commits ]
  │ prisma.campaign.update()
  │ prisma.collection.update()
  │ prisma.setting.upsert()
  │ prisma.homepageSection.upsert()
  │ prisma.product.update()
  ▼
[ Storefront Update ]
  │ Public storefront fetches live settings and homepage sections
  │ Navigation bar marquee updates dynamically across all client sessions
```

---

## 2. Browser Storage vs. Database Persistence Analysis

| Feature | Primary Persistence Layer | Secondary / Cache Storage | Rationale & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **User Identity & Token** | Database (`User` table) | `localStorage` (`venm_user`, `venm_admin_token`) & HTTP Cookie | Enables instant UI rendering upon page load without waiting for initial `/auth/me` network request. |
| **Catalog Products** | Database (`Product` table) | `localStorage` (`venm_cached_featured_prods`, `venm_cached_product_{slug}`) | Offline resilience; displays catalog immediately while fresh data revalidates in the background. |
| **Collections Directory**| Database (`Collection` table) | `localStorage` (`venm_cached_collections`) | Instant page transition; background sync. |
| **Bespoke Inquiries** | Database (`Inquiry` table) | `localStorage` (`venm_inquiries_{userId}`) | Guarantees instant reactivity in Profile page even on slow mobile networks. |
| **Website Settings & SEO**| Database (`Setting` table) | `localStorage` (`venm_settings`) | Avoids layout shift and flashes of unstyled content (FOUC). |
| **Visitor Presence** | In-Memory (`activeVisitors` Map) | `sessionStorage` (`venm_session_id`) | Heartbeat presence is ephemeral by design; does not require disk I/O overhead. |
| **Image Ratio Adjustments**| Database (`Product.images`) | Browser HTML5 Canvas | The canvas renders the crop client-side and uploads the finalized image URL to the database. |
