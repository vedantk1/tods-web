# Trip Types Reference Documentation

> **Living Document** - Last Updated: December 7, 2025
> 
> This document provides a comprehensive reference for all trip types supported by TravelODesk, including their rate calculation logic, database structures, and API flows.

---

## Table of Contents

1. [Trip Types Overview](#1-trip-types-overview)
2. [Type 1: Airport Transfer](#2-type-1-airport-transfer)
3. [Type 2: Local Trip](#3-type-2-local-trip)
4. [Type 3: One Way](#4-type-3-one-way)
5. [Type 4: Multi One Way](#5-type-4-multi-one-way)
6. [Type 5: Round Trip](#6-type-5-round-trip)
7. [Rate Calculation Engine](#7-rate-calculation-engine)
8. [Database Schema](#8-database-schema)
9. [Unified Search Architecture](#9-unified-search-architecture)

---

## 1. Trip Types Overview

### Type Constants

| Type ID | Name | Description | Status |
|---------|------|-------------|--------|
| 1 | Airport Transfer | City ↔ Airport pickups/drops | ✅ Active (uses city pricing via Issue #5) |
| 2 | Local Trip | Hourly packages within a city (e.g., 8hr/80km) | ✅ Active |
| 3 | One Way | Point A → Point B intercity transfer | ✅ Active |
| 4 | Multi One Way | Multiple one-way legs in single booking | 🟡 Backend ready, Frontend disabled |
| 5 | Round Trip | Return journey A → B → A | ✅ Active |

### Frontend Tab Structure (Current)

```
┌───────────────────────────────────────────────────────────────┐
│                    Trip Search Form                            │
├───────────────┬───────────────────────────────────────────────┤
│   One Way     │  [ ] I need a round trip (return journey)     │
│   Tab (0)     │  ↳ Shows return date/time fields when checked │
├───────────────┼───────────────────────────────────────────────┤
│  Local Trip   │  Hourly package selection                     │
│   Tab (1)     │  City + Package + Date/Time                   │
└───────────────┴───────────────────────────────────────────────┘

Note: Airport Transfer tab was removed (Issue #5) - unified into One Way
Note: Multi One Way tab is commented out - needs implementation
```

---

## 2. Type 1: Airport Transfer

### Overview
Airport pickups/drops where either origin or destination is an airport.

### Current Behavior (Post Issue #5)
- **No separate airport pricing** - uses city operational rates
- Auto-detected when Google Places returns airport type
- Processed through One Way pricing engine

### Rate Calculation
```
Price = City Distance Rate (tod_operational_cities_distance_rate)
      OR City Route Price (tod_one_way_trip_routes)
      
Final = MIN(City Route Price, City Distance Price) excluding zeros
```

### Files
| Component | File |
|-----------|------|
| Backend Model | `todbooking/model/airport.js` |
| Backend Controller | `todbooking/controller/airport.js` |
| Routes | `todbooking/routes/web/airport.js` |
| Validation | `todbooking/routevalidations/airport.js` |

### API Endpoints
```
GET  /api/web/airport/search
GET  /api/web/airport/carList
GET  /api/web/airport/carDetails
GET  /api/web/airport/bookingConfirmation
```

---

## 3. Type 2: Local Trip

### Overview
Hourly packages within a city (e.g., 4hr/40km, 8hr/80km, 12hr/120km).

### Rate Calculation
```
Base Package Price = tod_local_trip_rates.base_price
Extra Hour Rate   = tod_local_trip_rates.extra_hrs_price
Extra KM Rate     = tod_local_trip_rates.extra_kms_price

Final Price = Base Price + (Surcharge if applicable) + Night Charge + Tax
```

### Package Structure
| Field | Description |
|-------|-------------|
| `package_name` | e.g., "8 Hours / 80 KM" |
| `base_price` | Base rate for the package |
| `extra_hrs_price` | Rate per extra hour |
| `extra_kms_price` | Rate per extra kilometer |
| `max_hours` | Package hour limit |
| `max_kms` | Package km limit |

### Files
| Component | File |
|-----------|------|
| Backend Model | `todbooking/model/localTrip.js` |
| Backend Controller | `todbooking/controller/localTrip.js` |
| Routes | `todbooking/routes/web/localTrip.js` |
| Validation | `todbooking/routevalidations/localTrip.js` |

### API Endpoints
```
GET  /api/web/local_trip/package   # Returns available packages
GET  /api/web/local_trip/search
GET  /api/web/local_trip/carList
GET  /api/web/local_trip/carDetails
GET  /api/web/local_trip/bookingConfirmation
```

---

## 4. Type 3: One Way

### Overview
Point-to-point intercity transfer from City A to City B.

### Rate Calculation Logic

```
Step 1: Identify Operational City
        ├── Try city name match → tod_operational_cities
        ├── Try district name match
        └── Try radius-based fallback (Issue #3)

Step 2: Calculate Route Price (if configured)
        └── tod_one_way_trip_routes → tod_one_way_trip_price_mapping
            ├── If distance <= route distance: Use fixed price
            └── If distance > route distance: Add band_3_fee for extra KMs

Step 3: Calculate Distance Band Price
        └── tod_operational_cities_distance_rate
            ├── initial_fee (base)
            ├── band_1_fee (0-X km)
            ├── band_2_fee (X-Y km)
            └── band_3_fee (Y+ km)

Step 4: Select Minimum Price
        └── helpers.findMinExcludingZero([routePrice, distancePrice])

Step 5: Add Charges
        ├── Surcharge (if booking < 2 hours before pickup)
        ├── Night Charge (if pickup in night hours)
        └── Campaign discount/markup (if active)

Step 6: Calculate Tax
        └── GST @ tod_tax.percentage
```

### Price Type Indicators
| trip_price_type | Meaning |
|-----------------|---------|
| 1 | Fixed Route Price (tod_one_way_trip_routes) |
| 2 | Distance Band Price (tod_operational_cities_distance_rate) |

### Files
| Component | File |
|-----------|------|
| Backend Model | `todbooking/model/oneway.js` (~4800 lines) |
| Backend Controller | `todbooking/controller/oneway.js` |
| Routes | `todbooking/routes/web/oneway.js` |
| Validation | `todbooking/routevalidations/oneway.js` |
| Frontend Store | `todweb/store/Modules/oneway.js` |

### API Endpoints
```
GET  /api/web/oneway/search
GET  /api/web/oneway/carList
GET  /api/web/oneway/carDetails
GET  /api/web/oneway/bookingConfirmation
```

---

## 5. Type 4: Multi One Way

### Overview
Multiple one-way trip legs in a single booking (e.g., Delhi → Agra → Jaipur → Pushkar).

### Business Rules
1. **Minimum legs**: 2 trips
2. **Maximum legs**: 7 trips (to be implemented)
3. **Vehicle continuity**: Same vehicle type across all legs
4. **Pricing**: Each leg priced independently, aggregated
5. **Booking structure**: Master booking + sub-bookings

### Current Rate Calculation (Backend)

```
For each leg i (0 to N-1):
  
  Step 1: Validate Operational City Coverage
          ├── Check pickup city is operational
          └── Check if excluded cities list

  Step 2: Calculate Leg Price (Same as One Way)
          └── MIN(routePrice[i], distancePrice[i])
          
  Step 3: Apply Leg-Specific Charges
          ├── Surcharge (if applicable)
          ├── Night Charge (based on pickup time)
          └── Campaign (if applicable)

Aggregate:
  Total Price = SUM(all leg prices)
  Total Night Charge = SUM(all night charges)
  Total Tax = Total Price × tax_percentage
  
Vehicle Filtering:
  - First leg: Get all available vehicles
  - Subsequent legs: Filter to vehicles available in PREVIOUS legs
  - Result: Intersection of all available vehicles
```

### Database Structure

**Master Booking**: `tod_customer_booking` (type = 4)
```sql
id: UUID (master booking ID)
type: 4
main_booking_id: NULL (this IS the main booking)
total_amount: Aggregated total
object: JSON with all trip details
```

**Sub-Bookings**: `tod_multioneway_booking`
```sql
id: UUID
customer_booking_id: FK → tod_customer_booking.id
pickup_location_place_id, pickup_location_place_name, pickup_date
dropoff_location_place_id, dropoff_location_place_name
distance, duration
object: JSON with leg-specific pricing
```

### Files
| Component | File |
|-----------|------|
| Backend Model | `todbooking/model/multiOneway.js` (~5000 lines) |
| Backend Controller | `todbooking/controller/multiOneway.js` |
| Routes | `todbooking/routes/web/multiOneway.js` |
| Validation | `todbooking/routevalidations/multiOneway.js` |
| Frontend Store | `todweb/store/Modules/multiOneway.js` |
| Admin Model | `todbooking/model/adminMultiOnewayTrip.js` |
| DB Migration | `todapi/migrations/20240508165305_tod_multioneway_booking.js` |

### API Endpoints
```
GET  /api/web/multi_oneway/search
GET  /api/web/multi_oneway/carList
GET  /api/web/multi_oneway/carDetails
GET  /api/web/multi_oneway/bookingConfirmation
```

---

## 6. Type 5: Round Trip

### Overview
Return journey: A → B → A with specified return date/time.

### Rate Calculation

```
Step 1: Calculate Per-Day Rate
        └── tod_round_trip_rates OR tod_operational_cities_distance_rate
        
Step 2: Multiply by Trip Duration
        └── totalDays = (Return Date - Pickup Date) + 1
        
Step 3: Per-Day Components
        ├── Driver Charges: daily_rate × totalDays
        ├── Minimum Billable KM: min_km × totalDays
        └── Paid Amenities: price × totalDays

Step 4: Add Charges
        ├── Night Charge (for pickup time)
        └── Surcharge (if applicable)

Step 5: Calculate Tax
        └── GST @ tod_tax.percentage
```

### Response Fields (Issue #11)
| Field | Description |
|-------|-------------|
| `driver_charges_total` | Driver allowance × days |
| `minimum_billable_km_total` | Min KM × days |
| `toll_charges` | "Extra on Actuals" |
| `parking_charges` | "Extra on Actuals" |
| `state_tax_charges` | "Extra on Actuals" |

### Return Time Validation (Issue #10)
```
Earliest Valid Return = Pickup Time + Estimated Travel Duration
Return Time MUST be > Earliest Valid Return

Example:
  Delhi → Jaipur (~5 hours)
  Pickup: 10:00 AM
  Earliest Return: ~3:00 PM
  Return 12:00 PM → ❌ REJECTED
  Return 9:00 PM → ✅ ACCEPTED
```

### Files
| Component | File |
|-----------|------|
| Backend Model | `todbooking/model/roundTrip.js` |
| Backend Controller | `todbooking/controller/roundTrip.js` |
| Routes | `todbooking/routes/web/roundTrip.js` |
| Validation | `todbooking/routevalidations/roundTrip.js` |
| Frontend Store | `todweb/store/Modules/roundTrip.js` |

### API Endpoints
```
GET  /api/web/round_trip/search
GET  /api/web/round_trip/carList
GET  /api/web/round_trip/carDetails
GET  /api/web/round_trip/bookingConfirmation
```

---

## 7. Rate Calculation Engine

### Common Components

#### Operational City Discovery
```javascript
// Priority Order:
1. City Name Match (tod_operational_cities.city_name)
2. District Name Match
3. Radius-Based Fallback (haversine distance)
```

#### Price Selection Helper
```javascript
// helpers.findMinExcludingZero([price1, price2, ...])
// Returns the minimum non-zero value from the array
```

#### Surcharge Logic
```javascript
if (bookingTime - pickupTime <= 2 hours) {
  if (increased_by === 1) {
    surcharge = amount;  // Fixed amount
  } else {
    surcharge = price × (percentage / 100);  // Percentage
  }
}
```

#### Night Charge Logic
```javascript
// Night hours defined in tod_surcharge (start_time, end_time)
if (pickupTime BETWEEN nightStart AND nightEnd) {
  if (increased_at === 1) {
    nightCharge = night_amount;  // Fixed
  } else {
    nightCharge = price × (night_percentage / 100);  // Percentage
  }
}
```

#### Campaign Discount/Markup
```javascript
// Active campaign in tod_campaigns
if (campaign.type === 1) {
  price = price + (price × campaign.percentage / 100);  // Markup
} else {
  price = price - (price × campaign.percentage / 100);  // Discount
}
```

### Tax Calculation
```javascript
tax_amount = (price + nightCharge) × (tod_tax.percentage / 100);
total_amount = price + nightCharge + tax_amount;
```

---

## 8. Database Schema

### Core Tables

#### `tod_customer_booking` (Main Booking Table)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `refid` | String | Human-readable booking reference |
| `type` | Integer | Trip type (1-5) |
| `main_booking_id` | UUID (FK, self-ref) | For sub-bookings in Multi One Way |
| `pickup_*` | Various | Pickup location details |
| `dropoff_*` | Various | Dropoff location details |
| `total_amount` | Decimal | Final amount |
| `status` | Integer | 0=Pending, 1=Completed, 2=Cancelled, 3=Cancel Request, 4=Draft |
| `assignment_status` | Integer | Supplier assignment status |
| `trip_price_type` | Integer | Which pricing was used |
| `object` | JSONB | Full trip details |

#### `tod_multioneway_booking` (Multi One Way Legs)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `customer_booking_id` | UUID (FK) | → tod_customer_booking |
| `pickup_*` | Various | Leg pickup details |
| `dropoff_*` | Various | Leg dropoff details |
| `distance`, `duration` | String | Leg distance/time |
| `object` | JSONB | Leg pricing details |

### Pricing Tables

#### `tod_operational_cities`
- Defines service areas
- Contains surcharge, night charge configurations
- Links to route types (Domestic, Cross-border, International)

#### `tod_operational_cities_distance_rate`
- Band-based pricing per vehicle type per city
- `initial_fee`, `band_1_fee`, `band_2_fee`, `band_3_fee`

#### `tod_one_way_trip_routes` + `tod_one_way_trip_price_mapping`
- Fixed route pricing (e.g., Delhi → Agra = ₹X)
- Per vehicle type pricing

#### `tod_round_trip_rates`
- Round trip specific rates per city

#### `tod_local_trip_rates`
- Package-based pricing (hours/km combinations)

---

## 9. Unified Search Architecture

### Current Flow (Issue #1 Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Trip.vue)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  One Way Tab                                              │  │
│  │  ├── Pickup Location (autocomplete - places + airports)  │  │
│  │  ├── Dropoff Location (autocomplete)                     │  │
│  │  ├── Date, Time, Passengers                              │  │
│  │  └── [✓] I need a round trip (checkbox)                  │  │
│  │       ├── Shows: Return Date, Return Time (when checked) │  │
│  │       └── Validates: Return > Arrival time               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│               submitUnifiedSearch()                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Query Params:                                             │  │
│  │   pickup, dropoff, pickupID, dropoffID                   │  │
│  │   date, time, passengers                                 │  │
│  │   isRoundTrip: true/false                                │  │
│  │   return_date, return_time (if round trip)               │  │
│  │   isAirportPickup, isAirportDropoff (auto-detected)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CarList Page (type detection)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ if (isRoundTrip === 'true') → type = 5                   │  │
│  │ else if (isAirportPickup || isAirportDropoff) → type = 1 │  │
│  │ else → type = 3                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│     Calls appropriate API based on type                         │
│     ├── Type 1: /api/web/airport/carList                       │
│     ├── Type 3: /api/web/oneway/carList                        │
│     └── Type 5: /api/web/round_trip/carList                    │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Enhancement (Multi One Way Integration)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Trip.vue)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  One Way Tab                                              │  │
│  │  ├── Pickup / Dropoff / Date / Time / Passengers         │  │
│  │  │                                                        │  │
│  │  │  Trip Mode (Radio Buttons):                           │  │
│  │  │  ○ One Way (default)                                  │  │
│  │  │  ○ Round Trip                                         │  │
│  │  │  ○ Multi One Way                                      │  │
│  │  │                                                        │  │
│  │  │  [Dynamic Form based on selection]                    │  │
│  │  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix

### Trip Type Decision Matrix

| Scenario | Type | Detection Method |
|----------|------|------------------|
| Airport → City | 1 | Google Places types[].includes('airport') |
| City → Airport | 1 | Google Places types[].includes('airport') |
| City → City (no round trip) | 3 | Default |
| City → City (round trip checked) | 5 | isRoundTrip = true |
| City → City → City... | 4 | Multi One Way mode selected |
| City hourly rental | 2 | Local Trip tab selected |

### Error Codes

| Code | Meaning |
|------|---------|
| 422 | Validation error |
| 424 | Operational city not found / Service unavailable in area |
| 500 | Server error |

---

*Document maintained by the TravelODesk development team.*

