:

---

## 📋 Project Technology Overview

### Tech Stack

| Application | Port | Technology                             | Purpose                                            |
| ----------- | ---- | -------------------------------------- | -------------------------------------------------- |
| todapi      | 5050 | Node.js, Express, PostgreSQL, Knex.js  | Core API - master data, users, settings, enquiries |
| todbooking  | 5051 | Node.js, Express, PostgreSQL, Knex.js  | Booking engine - pricing, payments, confirmations  |
| todweb      | 3060 | Nuxt.js 2, Vue.js 2, Bulma CSS         | Customer-facing website                            |
| todop       | 3070 | Nuxt.js 2, Vue.js 2, Bulma, ApexCharts | Admin/Operations panel                             |

### Key Dependencies

Backend:* knex - SQL query builder

* passport + passport-jwt - Authentication
* razorpay + paypal-rest-sdk - Payment gateways
* googleapis - Gmail API for emails
* twilio - International SMS

Frontend:* nuxt + @nuxtjs/auth-next - SSR & authentication

* nuxt-buefy - UI components
* vee-validate - Form validation
* vuex - State management

---

## 🚗 Trip Types & Flows

### 1. Airport Transfer (Type 1)

Purpose: Airport ↔ City pickups/drops

Frontend Flow:* ~~Separate "Airport Transfer" tab~~ → Now merged into One Way (Issue #5)

* Uses unified search that auto-detects airports

Backend Flow:

**todweb → /api/web/airport/carList → **todbooking/controller/airport.js

**       → model/airport.js → Uses CITY pricing (not **airport-specific)

Key Change: Airport transfers now use city pricing (tod_operational_cities_distance_rate) instead of separate airport tables. This simplifies configuration.

---

### 2. One Way (Type 3)

Purpose: Point A → Point B (intercity transfer)

Frontend Flow:

**Home/Trip.vue (One Way tab) → CarList page → **Customer Info → Payment

Backend Flow:

**/api/web/oneway/search → Returns places via Google **Places API

**/api/web/oneway/carList → Returns vehicles with **pricing

**/api/web/oneway/carDetails → Vehicle details + **amenities

**/api/web/oneway/bookingConfirmation → Creates **booking

Pricing Logic:1. Check for Fixed Route Price (tod_one_way_trip_routes)

1. Calculate Distance Band Price (tod_operational_cities_distance_rate)
2. Use minimum of the two (via helpers.findMinExcludingZero())

Store Module: todweb/store/Modules/oneway.js

---

### 3. Round Trip (Type 5)

Purpose: Return journeys (A → B → A)

Frontend Flow:

**Home/Trip.vue (Round Trip checkbox or tab) → **Select dates → CarList → Payment

Backend Flow:

**/api/web/round_trip/search**

**/api/web/round_trip/carList**

**/api/web/round_trip/carDetails**

**/api/web/round_trip/bookingConfirmation**

Special Features:* Return time validation: Must be after outbound journey completes

* Per-day amenities: Paid amenities multiply by trip duration
* Fields include: driver_charges_total, minimum_billable_km_total

---

### 4. Local Trip (Type 2)

Purpose: Hourly packages within a city (e.g., 8hr/80km)

Frontend Flow:

**Home/Trip.vue (Local Trip tab) → Select Package → **CarList → Payment

Backend Flow:

**/api/web/local_trip/package → Returns available **packages

**/api/web/local_trip/search**

**/api/web/local_trip/carList**

**/api/web/local_trip/carDetails**

**/api/web/local_trip/bookingConfirmation**

Package Structure:* Base rate (e.g., ₹1800 for 8hr/80km)

* extra_hrs_price - Extra hour rate
* extra_kms_price - Extra km rate

---

### 5. Multi One Way (Type 4)

Purpose: Multiple one-way legs in a single booking

Frontend Flow:

**Home/Trip.vue (Multi-Oneway - currently disabled) **→ Add multiple legs → CarList

Backend Flow:

**/api/web/multi_oneway/search**

**/api/web/multi_oneway/carList**

**/api/web/multi_oneway/carDetails**

**/api/web/multi_oneway/bookingConfirmation**

Key Logic:* Iterates through each leg (req.query.multiOneway[])

* Calculates prices for each leg separately
* Aggregates total with taxes

---

## 🔄 Unified Search Experience (Recent Implementation)

A Unified Search was implemented to auto-detect trip types:

| User Action                       | System Behavior                         |
| --------------------------------- | --------------------------------------- |
| Selects airport in pickup/dropoff | unifiedPickupIsAirport flag set         |
| Checks "Round Trip" checkbox      | Return date/time fields appear          |
| Submits                           | Backend detects trip type automatically |

Trip Type Detection:* Round trip checkbox → Type 5

* Airport in pickup OR dropoff → Type 1 (uses city pricing)
* Otherwise → Type 3 (One-Way)

---

## 💰 Pricing Engine Flow

**1. Determine operational city (by name OR radius f**allback)

**2. Get route price from fixed routes (if configure**d)

**3. Get distance band price from operational city r**ates

**4. Select minimum price (excluding zeros)**

**5. Add amenities (free + paid)**

**6. Apply surcharges (night, weekend)**

**7. Calculate tax (GST)**

**8. Apply coupon discount (if any)**

**9. Return final price**

Key Tables:* tod_operational_cities - Service areas

* tod_operational_cities_distance_rate - Band pricing per vehicle
* tod_one_way_trip_routes - Fixed route prices
* tod_round_trip_routes - Round trip routes
* tod_local_trip_rates - Hourly packages

---

## 📊 Booking Flow (Overall)

**┌─────────────────┐    ┌─────────────────┐    **┌─────────────────┐

**│   User Search   │───▶│   Car List      │───▶│  **Car Details    │

**│  (Trip Form)    │    │  (Pricing API)  │    │  **(Select Car)   │

**└─────────────────┘    └─────────────────┘    **└─────────────────┘

**                                                   **   │

**                                                   **   ▼

**┌─────────────────┐    ┌─────────────────┐    **┌─────────────────┐

**│    Booking      │◀───│    Payment      │◀───│  **Customer Info  │

**│   Confirmed     │    │  (Razorpay/PP)  │    │   **(Form Fill)   │

**└─────────────────┘    └─────────────────┘    **└─────────────────┘

**         │**

**         ▼**

**┌─────────────────┐    ┌─────────────────┐**

**│    Assignment   │───▶│   Trip Complete │**

**│(Supplier/Driver)│    │   & Settlement  │**

**└─────────────────┘    └─────────────────┘**

---

## 🗂️ Key File Locations

Backend Controllers:* todbooking/controller/oneway.js

* todbooking/controller/roundTrip.js
* todbooking/controller/localTrip.js
* todbooking/controller/airport.js
* todbooking/controller/multiOneway.js

Backend Models (Business Logic):* todbooking/model/oneway.js (~4800 lines)

* todbooking/model/roundTrip.js
* todbooking/model/localTrip.js
* todbooking/model/airport.js
* todbooking/model/multiOneway.js

Frontend Vuex Stores:* todweb/store/Modules/oneway.js

* todweb/store/Modules/roundTrip.js
* todweb/store/Modules/localTrip.js
* todweb/store/Modules/airport.js
* todweb/store/Modules/multiOneway.js

Frontend Pages:* todweb/components/Home/Trip.vue - Search form

* todweb/pages/CarList/index.vue - Vehicle listing
* todweb/pages/customer-info/index.vue - Customer details
* todweb/pages/payment/index.vue - Payment page
