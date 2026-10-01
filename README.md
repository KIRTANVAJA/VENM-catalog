# VENM Full-Stack eCommerce System

This project transforms the static VENM frontend into a fully functional, production-ready full-stack eCommerce application.

## 🚀 Features Added

1. **Node.js/Express Backend:** Complete REST API with JWT authentication.
2. **MySQL Database:** Fully schema'd database with 8 tables, seeded with the existing VENM catalog.
3. **Admin Dashboard:** Secret admin panel (`/venm-secret-admin`) featuring:
   * Real-time sales analytics and stock-market-style active graph (Socket.io + Chart.js).
   * Product CRUD (Create, Read, Update, Delete).
   * Order management (change status, broadcast location).
   * Real-time customer support messages inbox.
4. **Razorpay Integration:** Full payment gateway integration in `checkout-live.html`, with HMAC signature validation.
5. **Live Tracking:** Google Maps API integration allowing users to track their delivery agent in real time, with the admin bridging location updates.
6. **Order Cancellation:** Feature-rich cancellation flow with reasons recorded in the DB.

---

## 📂 Project Structure

```text
/venm-project
├── /assets             # Shared assets (images, logos)
├── /css                # Frontend CSS files
├── /js                 # Frontend JS files
├── /admin              # Admin Panel HTML, /css, and /js
├── /server             # Backend - Express.js API + Socket.io Server
├── /database           # SQL files for schema setup and seeding
├── index.html          # Homepage
└── *.html              # Other main site pages (shop, men, women, etc.)
```

---

## 🛠️ Setup Instructions

### 1. Database Setup (MySQL)
1. Ensure MySQL is installed and running (e.g., using XAMPP, WAMP, or standalone MySQL).
2. Open your terminal/command prompt and connect to MySQL:
   ```bash
   mysql -u root -p
   ```
3. Run the schema script to create the tables:
   ```bash
   source database/schema.sql
   ```
4. Run the seed script to populate products and the admin account:
   ```bash
   source database/seed.sql
   ```
   > **Note:** The updated admin credentials are:
   > **Email:** `kirtanvaja992@gmail.com`
   > **Password:** `Kgv131026`

### 2. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Setup Environmental Variables:
   Rename `.env.example` to `.env` (or create a new `.env` file) and fill in your details:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=venm_db
   JWT_SECRET=your_super_secret_jwt_key
   
   # Razorpay credentials (get from Razorpay Dashboard -> Settings -> API Keys)
   RAZORPAY_KEY_ID=rzp_test_yourkey
   RAZORPAY_KEY_SECRET=yoursecret
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *(For development with auto-restart, you can run `npm run dev` if Nodemon is installed globally)*.

### 3. Frontend & Admin Usage
* To test the application locally, you can use **VS Code Live Server**.
* Serve the root VENM directory at `http://localhost:3000` (or similar).
* Browse the store dynamically by starting at `index.html`.
* You can access the **live checkout** directly at `checkout-live.html`.
* **Important:** Open the Secret Admin Panel at `http://localhost:3000/admin/dashboard.html` (or other admin pages) and log in with the admin credentials mentioned above.

## Google Maps
The Delivery tracking UI integrates with Google Maps (`track-order.html`). If you experience "Development Purposes Only" watermarks or errors, you must replace `YOUR_API_KEY_HERE` with a valid Google Cloud Platform Maps JavaScript API key inside the script dynamically generated in `js/track-order.js`.
