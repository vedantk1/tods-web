## 📋 **Project Summary**

**TravelODesk** is a comprehensive **B2B2C cab booking platform** - think of it as a white-label taxi/cab booking system for businesses, travel agents, and end customers. It's a full-stack application with separate backend APIs and frontend applications.

---

## 🏗️ **Architecture Overview**

The project consists of **4 main applications**:

### 1. **todapi** - Main API Backend (Port 5050)

- **Purpose**: Core business logic, master data management, enquiries
- **Tech**: Node.js, Express, PostgreSQL, Knex.js
- **Handles**: Users, fleets, routes, suppliers, agents, drivers, settings, enquiries, CMS

### 2. **todbooking** - Booking API Backend (Port 5051)

- **Purpose**: Booking engine and payment processing
- **Tech**: Node.js, Express, PostgreSQL, Knex.js
- **Handles**: Real-time bookings, quotations, payments, PDF generation

### 3. **todweb** - Customer Website (Port 3060)

- **Purpose**: Public-facing booking website
- **Tech**: Nuxt.js 2, Vue.js 2, Bulma CSS
- **Features**: Trip search, booking, customer registration, payments

### 4. **todop** - Operations/Admin Panel (Port 3070)

- **Purpose**: Internal operations and admin management
- **Tech**: Nuxt.js 2, Vue.js 2, Bulma CSS, ApexCharts
- **Features**: Dashboard, user management, fleet management, booking management, reports

---

## 🎯 **Core Business Features**

### **Trip Types Supported:**

1. **Airport Transfers** - Airport to city/hotel pickups and drops
2. **One-Way Trips** - Point A to Point B
3. **Round Trips** - Return journeys
4. **Local Trips** - Hourly packages within a city
5. **Multi One-Way** - Multiple one-way legs in a single booking
6. **Chardham Enquiries** - Special pilgrimage tour packages

### **Pricing Engine:**

- Dynamic pricing based on distance, duration, vehicle type
- Route-based rates (fixed routes)
- Hourly rates for local trips
- Surge pricing (night charges, weekend rates)
- Amenities/add-ons (child seats, WiFi, etc.)
- Tax calculations
- Coupon/discount system
- Multi-currency support with auto-conversion

---

## 👥 **User Roles & Permissions**

### **Role Hierarchy:**

1. **Super Admin** - Full system access
2. **Admin** - Company administrators
3. **Suppliers** - Fleet operators who provide vehicles
4. **Agents** - Multiple types:
   - Travel Agents
   - Hotel Admins
   - Airline Admins
   - Tour Operators
   - Corporate Partners
5. **Drivers** - Can be independent or supplier-managed
6. **Customers** - End users booking rides
7. **API Users** - Third-party integrations

### **Permission System:**

- ACL (Access Control List) based permissions
- Groups with assigned rules
- Permission types: Add, Edit, View, Delete, List, Export, Status
- Menu-based access control
- Granular permissions for fleets, drivers, routes, rates

---

## 💾 **Database Structure**

**Database**: PostgreSQL with **80+ tables**

### **Key Tables:**

- `tod_users` - All system users
- `tod_customer_registration` - Customer details
- `tod_customer_booking` - Main bookings table
- `tod_suppliers` - Fleet providers
- `tod_agents` - Agent partners
- `tod_drivers` - Driver information
- `tod_fleets_master`, `tod_fleets` - Vehicle management
- `tod_vehicle_types` - Car types (sedan, SUV, etc.)
- `tod_operational_cities` - Serviceable cities
- `tod_one_way_trip_routes`, `tod_round_trip_routes`, etc. - Route management
- `tod_airport_amenities`, `tod_travel_amenities` - Extra services
- `tod_currencies` - Multi-currency support
- `tod_transaction_history` - Payment records
- `tod_wallet`, `tod_wallet_transaction` - Customer wallet
- `tod_settlement`, `tod_settlement_request` - Supplier payments
- `tod_enquiries`, `tod_others_enquiry`, `tod_chardham_enquiries` - Lead management
- `tod_coupons` - Discount codes
- `tod_campaigns` - Supplier marketing campaigns
- `tod_stop_sales` - Block dates/routes

---

## 🔐 **Authentication & Security**

### **Authentication:**

- **Passport.js** with multiple strategies:
  - `jwtAdmin` - Admin panel authentication
  - `jwtWeb` - Customer website authentication
  - `jwtApiUser` - Third-party API authentication
- JWT tokens stored in headers:
  - Admin: `Authorization: Bearer <token>`
  - API: `x-todapi-key: <token>`
- Token encryption using AES-256

### **Middleware:**

- `authenticateAdminJwt` - Admin verification
- `authenticateMiddleWareWebJwt` - Web auth (required login)
- `authenticateMiddleWareWebJwtGuest` - Web auth (optional login)
- `authenticateAPIUserJwt` - API user verification
- `isHavePermission` - Permission checks

---

## 💳 **Payment Integration**

### **Payment Gateways:**

1. **Razorpay** (Primary)
   - Payment links
   - Refunds
   - Webhooks for status updates
2. **PayPal** (International)
   - Order creation
   - Payment processing

### **Payment Flow:**

- Booking created → Payment link generated → Customer pays → Webhook confirms → Booking confirmed
- Supports wallet payments
- Credit transactions for agents
- Settlement requests for suppliers

---

## 📧 **Communication Systems**

### **Email:**

- Gmail API integration
- Nodemailer as fallback
- **Email Templates:**
  - Booking confirmation
  - Driver assignment details
  - Payment links
  - Cancellation notifications
  - Supplier booking notifications
  - Feedback requests
  - Welcome emails

### **SMS:**

- **Twilio** integration
- **BhashSMS** (Indian SMS gateway)
- Booking confirmations via SMS
- OTP verification

---

## 🔄 **Booking Workflow**

### **Enquiry to Booking Process:**

1. **Enquiry Creation** (Web/Agent/Phone/Email/Chat)
   - Status: New, Followup, Win, Lost, Fake, Duplicate, Closed
2. **Quote Generation** (if is_quote = 1)
3. **Customer Confirmation**
4. **Booking Creation**
   - Assignment Status: Unassigned/Assigned
   - Payment Status: Pending/Paid/Failed/Refunded
   - Status: Active/Cancelled/Completed
5. **Supplier/Driver Assignment**
6. **Payment Processing**
7. **Trip Completion**
8. **Settlement** (Supplier payout)

---

## 🌍 **Multi-tenant & Location Features**

### **Location Hierarchy:**

- Countries → Operational Cities → Routes
- Place API integration (Google Places-like)
- Airport database
- Distance/duration calculations
- Operational radius per city
- Excluded cities (service blacklist)

### **Supplier Operations:**

- Suppliers can operate in multiple cities
- City-specific amenities mapping
- Campaign management per location
- Custom rates per route/city
- Stop sales for specific dates/routes

---

## 🛠️ **Key Technical Components**

### **Backend (todapi & todbooking):**

**Common Modules:**

- helpers.js - Utility functions, middleware, JWT helpers
- `common/query.js` - Dynamic query builder
- payment.js - Razorpay integration
- `common/paypalGateway.js` - PayPal integration
- `common/emailTemplates.js` - Email HTML generators
- `common/smsGateWay.js` - SMS sending
- cron.js - Scheduled tasks
- `common/currencyConverstion.js` - Exchange rate updates

**Controllers:**

- Handle HTTP requests
- Call model methods
- Return standardized responses: `{status, message, result}`

**Models:**

- Database queries using Knex.js
- Business logic
- Return: `{success, message, data}`

**Route Validations:**

- Joi schemas for request validation
- File upload validations
- Query/body/params validation

**Migrations:**

- Database schema version control
- Run with: `npm run migrate`

**Seeders:**

- Initial data population
- Run with: `npm run seed`

---

## 📊 **Cron Jobs**

Located in cron.js:

1. **Currency Update** - Runs twice daily (midnight & noon)

   - Fetches latest exchange rates
   - Updates `tod_currencies` table

2. **Follow-up Reminders** - Runs daily at midnight
   - Sends notifications for enquiry follow-ups

---

## 🔧 **Environment Configuration**

Each application has environment-based configs:

**Environments (PRODUCTION_MODE values):**

- `loc` - Local development (127.0.0.1)
- `dev` - Development/Staging server (3.231.139.201)
- `live` - Production server (52.3.173.30)

**Key Environment Variables:**

- `PORT` - Server port
- `DB_HOST`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `JWT_SECRET` - Token encryption
- `PRODUCTION_MODE` - Environment selector
- `TOD_*` - Table names (allows multi-tenancy)

---

## 📱 **API Structure**

### **todapi Routes:**

```
/api/admin/* - Admin panel endpoints (requires jwtAdmin)
/api/web/* - Public/customer endpoints
/api/api-service/* - Third-party API (requires x-todapi-key)
```

### **todbooking Routes:**

```
/api/admin/* - Admin booking management
/api/web/* - Customer booking & payment
/api/api-service/* - Third-party booking API
```

---

## 🚀 **Getting Started (Quick Setup)**

### **Prerequisites:**

- Node.js v18.16.0
- PostgreSQL
- npm

### **Setup Steps:**

1. **Install dependencies:**

```bash
cd todapi && npm install
cd ../todbooking && npm install
cd ../todweb && npm install
cd ../todop && npm install
```

2. **Configure environment:**

- Create `.env` files in each directory
- Set database credentials
- Set JWT_SECRET
- Configure payment gateways

3. **Database setup:**

```bash
cd todapi
npm run migrate  # Run migrations
npm run seed     # Seed initial data
```

4. **Run applications:**

```bash
# Terminal 1 - Main API
cd todapi && npm run dev

# Terminal 2 - Booking API
cd todbooking && npm run dev

# Terminal 3 - Customer Website
cd todweb && npm run dev

# Terminal 4 - Admin Panel
cd todop && npm run dev
```

---

## 📝 **Code Conventions**

### **Response Format:**

```javascript
// Success
{status: 1, message: "Success", result: {...}}

// Error
{status: 0, message: "Error message", result: {}}
```

### **Database Queries:**

- Use Knex.js query builder
- Always use environment variables for table names
- Soft deletes with `deleted_at` timestamp

### **File Uploads:**

- Handled by `uploadMiddleware.js`
- Images stored in `/uploads/<folder>/`
- Thumbnails generated with Sharp

---

## 🔍 **Important Files to Review**

### **Configuration:**

- server.js - Main API entry point
- knexfile.js - Database configuration
- passport.js - Authentication strategies (2970 lines!)
- nuxt.config.js - Frontend config
- nuxt.config.js - Admin panel config

### **Core Business Logic:**

- booking.js - Booking model (4154 lines!)
- enquiry.js - Enquiry management
- `todbooking/controller/*` - Booking engines for each trip type

### **Common Utilities:**

- helpers.js - 1559 lines of utilities!
- payment.js - Payment processing

---

## 🎨 **Frontend Structure (Nuxt.js)**

### **Key Directories:**

- `pages/` - Route-based pages
- `components/` - Reusable Vue components
- `layouts/` - Page templates
- `store/` - Vuex state management
- `plugins/` - Vue plugins (axios, validation, etc.)
- `middleware/` - Route guards
- `assets/scss/` - Bulma customizations

### **State Management:**

- Vuex store modules
- Auth state (@nuxtjs/auth-next)
- Axios interceptors

---

## 💡 **Key Insights for You**

### **Areas to Watch:**

⚠️ Large model files (4000+ lines) - could be refactored
⚠️ Some hard-coded values - check environment configs
⚠️ Mixed authentication strategies - understand all flows
⚠️ Complex permission system - review ACL logic
⚠️ Multiple enquiry types - understand the workflow

### **Common Development Tasks:**

1. **Adding new features** - Follow MVC pattern in controllers/models
2. **New routes** - Add in routes folder with validation
3. **Database changes** - Create migration, never alter directly
4. **New permissions** - Add to `tod_master_permissions` seeder
5. **Email templates** - Modify in `common/emailTemplates.js`

---

## 📞 **System Integrations**

- **Google APIs** - Places, Maps
- **Razorpay** - Payments
- **PayPal** - International payments
- **Twilio** - SMS (international)
- **BhashSMS** - SMS (India)
- **Gmail API** - Email sending
- **Currency API** - Exchange rates (@everapi/freecurrencyapi-js)

---

## 📚 **Documentation Resources**

- Knex.js: https://knexjs.org
- Nuxt.js 2: https://nuxtjs.org/docs/2.x
- Passport.js: http://www.passportjs.org
- Bulma CSS: https://bulma.io

---
