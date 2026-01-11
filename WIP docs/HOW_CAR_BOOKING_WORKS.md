# 🚗 How Car/Vehicle Booking System Works

**Created:** November 12, 2025  
**Purpose:** Deep dive into the vehicle booking logic, pricing, and route system

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [The Car Selection Process](#the-car-selection-process)
4. [Why 424 Error Happens](#why-424-error-happens)
5. [Working Routes to Test](#working-routes-to-test)
6. [Business Logic Flow](#business-logic-flow)

---

## Overview

TravelODesk doesn't have a "fleet of cars" in the traditional sense. Instead, it's a **PRICING & ROUTING ENGINE** that:

1. **Pre-configures routes** (e.g., Delhi → Agra)
2. **Sets prices per vehicle type** for each route
3. **Matches user searches** to configured routes
4. **Returns available vehicle options** with calculated prices

**Key Insight:** Cars aren't "assigned" to locations. **Routes and prices are pre-configured by admins**. If a route isn't configured, NO cars will be shown.

---

## Database Architecture

### Core Tables

#### 1. **Vehicle Types** (`tod_vehicle_types`)

The **categories** of vehicles (not actual cars):

- Sedan
- SUV
- Luxury
- Mini Van
- etc.

**Example:**

```sql
id: "abc-123"
vehicle_type: "Sedan"
description: "Comfortable 4-seater"
vehicle_type_image: "sedan.png"
```

#### 2. **Fleet Master** (`tod_fleets_master`)

**Template vehicles** (not real cars, just specs):

- Honda City (Sedan)
- Toyota Innova (SUV)
- Mercedes E-Class (Luxury)

**Example:**

```sql
id: "def-456"
company_name: "Honda"
vehicle_name: "City"
vehicle_type_id: "abc-123" (links to Sedan)
no_of_passengers: 4
no_of_bags: 2
fuel: "petrol"
cover_image: "honda_city.jpg"
```

**Important:** These are **reference models**, not actual vehicle inventory.

#### 3. **Actual Fleets** (`tod_fleets`)

Real physical vehicles owned by **suppliers**:

```sql
id: "ghi-789"
supplier: "supplier-xyz-id"
vehicle_name: "def-456" (links to Honda City master)
registration_number: "DL-01-AB-1234"
status: 3 (Active)
```

This is the **actual car** that would be assigned to a booking.

### Route & Pricing Tables

#### 4. **Operational Cities** (`tod_operational_cities`)

Cities where service is available:

- Delhi
- Mumbai
- Bengaluru
- Agra
- Jaipur
- etc.

**Important Fields:**

- `city_name`: "Delhi"
- `city_data`: Contains Google Maps location data (lat/lng)
- `zone`: 1-North, 2-East, 3-South, 4-West, 5-Central

#### 5. **One Way Trip Routes** (`tod_one_way_trip_routes`)

Pre-configured routes:

```sql
id: "route-123"
from_route_name: "Delhi"
to_route_name: "Agra"
from_place_id: "ChIJ..." (Google Place ID)
to_place_id: "ChIJ..."
distance: 233000 (in meters = 233 km)
duration: "3 hours 45 mins"
operational_city_id: "delhi-city-id"
vice_verse_id: "route-124" (Agra → Delhi)
```

#### 6. **One Way Trip Price Mapping** (`tod_one_way_trip_price_mapping`)

**Prices per vehicle type per route:**

```sql
id: "price-001"
one_way_trip_rate_id: "route-123" (Delhi → Agra)
vehicle_type_id: "sedan-id"
price: 4500.00
```

**This means:**

- Delhi → Agra in a **Sedan** costs **₹4,500**

Similar tables exist for:

- **Airport Transfer** (`tod_airports_to_cities`, `tod_airports_to_cities_price_mapping`)
- **Local Trip** (`tod_local_trip_routes`, `tod_local_trip_rates`)
- **Round Trip** (`tod_round_trip_routes`, `tod_round_trip_rates`)

---

## The Car Selection Process

### Step-by-Step: What Happens When You Search

#### 1. **User Enters Trip Details**

```
Pickup: Delhi, India
Dropoff: Agra, India
Date: 2025-11-15
Time: 10:00 AM
Passengers: 4
```

#### 2. **System Calls Booking Suggestion API**

```javascript
// todweb calls:
ACTION_ONEWAY_BOOKING_SUGGESTION({
  pickUp: "ChIJL_P_CXMEDTkRw0ZdG-0GVvw", // Delhi Google Place ID
  dropOff: "ChIJy6OUkf9jdDkRaBC8FmlBgns", // Agra Google Place ID
  pickUpDate: "2025-11-15 10:00",
  currency: "IN",
  seats: 4 (optional filter)
})
```

#### 3. **Backend Logic Flow** (`todbooking/model/adminOnewayTrip.js`)

**Step 3.1:** Find Operational City

```javascript
// Determines which operational city the pickup is in/near
let operational_city = req.query.pickUp_operational_city_object;
// e.g., Delhi
```

**Step 3.2:** Calculate Distance

```javascript
// Uses Google Maps Distance Matrix API
let distanceResult = await PlaceAPI.getDistance(
  pickup_lat,
  pickup_lng,
  dropoff_lat,
  dropoff_lng
);
// Returns: 233 km, 3h 45m
```

**Step 3.3:** Check if Route is Allowed

```javascript
// Checks operational_radius table
// Is pickup within allowed radius from operational city?
// Is dropoff within allowed distance?

let ifAdminAllowInThisArea = await knex("tod_operational_radius")
  .where("operational_city_id", operational_city.id)
  .where("radius", ">=", pickUpDistance)
  .where("distance", ">=", dropOffDistance)
  .first();

if (!ifAdminAllowInThisArea) {
  // ⛔ RETURN 424 ERROR - Route not configured!
}
```

**Step 3.4:** Look for Pre-Configured Route

```javascript
// Search for exact route match
let routeQuery = knex("tod_one_way_trip_routes")
  .where("from_place_id", pickupPlaceID)
  .where("to_place_id", dropoffPlaceID)
  // OR search by city names
  .where("from_route_name", "ILIKE", "%Delhi%")
  .where("to_route_name", "ILIKE", "%Agra%");

let configuredRoute = await routeQuery.first();
```

**Step 3.5A:** If Route Found (FIXED PRICE)

```javascript
// Get prices for each vehicle type
let vehiclePrices = await knex('tod_one_way_trip_price_mapping')
  .where('one_way_trip_rate_id', configuredRoute.id)
  .join('tod_vehicle_types', ...)

// Returns:
[
  { vehicle_type: "Sedan", price: 4500 },
  { vehicle_type: "SUV", price: 6500 },
  { vehicle_type: "Luxury", price: 12000 }
]
```

**Step 3.5B:** If Route NOT Found (DYNAMIC PRICING - Band Calculation)

```javascript
// Falls back to distance-based pricing
let distanceRate = await knex("tod_operational_cities_distance_rate")
  .where("operational_city_id", operational_city.id)
  .where("vehicle_type_id", vehicle.id)
  .first();

// Calculate price:
// price = (distance_in_km * per_km_rate) + base_fare + other_charges
```

**Step 3.6:** Add Amenities (Free & Paid)

```javascript
// Free amenities (included in price)
free_amenities: [
  { name: "Water Bottle", price: 0 },
  { name: "Newspaper", price: 0 },
];

// Paid amenities (add-ons)
paid_amenities: [
  { name: "Child Seat", price: 500 },
  { name: "GPS Navigator", price: 300 },
];
```

**Step 3.7:** Calculate Final Price

```javascript
base_price = 4500
tax (18%) = 810
night_charge (if pickup after 11 PM) = 200
total_amount = 4500 + 810 + 200 = 5510
```

**Step 3.8:** Return Vehicle List

```javascript
// API returns:
{
  status: 1,
  result: [
    {
      vehicle_type_id: "sedan-id",
      vehicle_type_name: "Sedan",
      fleet: {
        vehicle_name: "Honda City",
        no_of_passengers: 4,
        no_of_bags: 2,
        cover_image: "http://.../honda.jpg"
      },
      price: 4500,
      tax_amount: 810,
      total_amount: 5510,
      distance: "233 km",
      duration: "3h 45m",
      free_amenities: [...],
      paid_amenities: [...]
    },
    // ... more vehicle types
  ]
}
```

---

## Why 424 Error Happens

**HTTP 424 = "Failed Dependency"**

The system returns 424 in these scenarios:

### 1. **No Operational City Found**

```javascript
// User searches from a city not in tod_operational_cities
// e.g., Pickup: "Shimla, India"
// If Shimla is not configured → 424 error
```

### 2. **Pickup Too Far from Operational City**

```javascript
// Pickup is 200km from Delhi
// But operational_radius max is 100km
// → 424 error
```

### 3. **Dropoff Outside Service Area**

```javascript
// Dropoff is 500km away
// But operational_radius max distance is 300km
// → 424 error
```

### 4. **No Vehicles Found**

```javascript
// No vehicle types configured
// OR all vehicles filtered out by seats/bags requirements
if (!vehicleTypeResult || !vehicleTypeResult.length) {
  return {
    success: false,
    code: 424,
    message: "No vehicles found",
  };
}
```

### 5. **Missing Price Data**

```javascript
// Route exists but no prices configured
// → 424 error
```

When 424 occurs, the frontend (`util.js` line 74-117) automatically redirects to `/enquiry-form`.

---

## Working Routes to Test

Based on the seeder data, here are **GUARANTEED WORKING routes**:

### ✅ One Way Trips from Delhi

1. **Delhi → Agra**

   - Distance: ~233 km
   - Duration: ~3h 45m
   - Pickup: "Delhi, India"
   - Dropoff: "Agra, India"

2. **Delhi → Jaipur**

   - Distance: ~280 km
   - Duration: ~5h
   - Pickup: "Delhi, India"
   - Dropoff: "Jaipur, India"

3. **Delhi → Haridwar**

   - Distance: ~220 km
   - Duration: ~5h 30m
   - Pickup: "Delhi, India"
   - Dropoff: "Haridwar, India"

4. **Delhi → Dehradun**

   - Distance: ~250 km
   - Duration: ~6h
   - Pickup: "Delhi, India"
   - Dropoff: "Dehradun, India"

5. **Delhi → Rishikesh**

   - Pickup: "Delhi, India"
   - Dropoff: "Rishikesh, India"

6. **Delhi → Mathura**

   - Pickup: "Delhi, India"
   - Dropoff: "Mathura, India"

7. **Delhi → Vrindavan**
   - Pickup: "Delhi, India"
   - Dropoff: "Vrindavan, India"

### ✅ Airport Transfers

**Test any of these airport combinations:**

- Delhi Airport (DEL) ↔ Delhi city locations
- Mumbai Airport (BOM) ↔ Mumbai city locations
- Bengaluru Airport (BLR) ↔ Bengaluru city locations
- Chennai Airport (MAA) ↔ Chennai city locations

**Example:**

- Pickup: "Indira Gandhi International Airport, Delhi"
- Dropoff: "Connaught Place, New Delhi"

### ✅ Local Trips

**Cities with local trip packages:**

- Delhi (8hr/80km package, 12hr/120km package)
- Agra (8hr/80km package)
- Jaipur (8hr/80km package)

**How to test:**

- Pickup: "Delhi, India"
- Duration: Select "8 hrs / 80 kms"
- Date/Time: Any future date

---

## Business Logic Flow

### Intended Workflow

```
1. USER SEARCHES FOR TRIP
   ↓
2. SYSTEM CHECKS:
   ├─ Is pickup in operational city?
   ├─ Is pickup within allowed radius?
   ├─ Is dropoff within allowed distance?
   └─ Are there configured routes or rates?
   ↓
3A. IF ALL CHECKS PASS:
    ├─ Fetch configured route prices (if exact match)
    ├─ OR calculate dynamic price (distance × rate)
    ├─ Apply taxes, surcharges
    ├─ Add amenities
    └─ Return vehicle list with prices
    ↓
4A. USER SEES CAR OPTIONS
    ├─ Selects vehicle type
    ├─ Adds optional amenities
    └─ Proceeds to payment
    ↓
5A. BOOKING CONFIRMED
    └─ Supplier/Driver assigned later

3B. IF ANY CHECK FAILS:
    └─ Return 424 error
    ↓
4B. FRONTEND CATCHES 424:
    └─ Redirects to /enquiry-form
    ↓
5B. ENQUIRY CREATED:
    └─ Team manually follows up
```

### Why This Design?

**Advantages:**

- ✅ Pre-configured routes ensure consistent pricing
- ✅ Quality control over service areas
- ✅ Prevents orders from unsupported locations
- ✅ Dynamic pricing for routes without fixed rates

**Disadvantages:**

- ❌ Limited to pre-configured routes
- ❌ Requires manual admin work to add routes
- ❌ Poor UX when route not found (silent redirect)
- ❌ Users don't know which routes are supported

---

## How to Add New Routes

**As an Admin:**

1. **Add Operational City** (if not exists)

   - Go to Admin Panel → Operational Cities
   - Add city with Google Maps data

2. **Configure Operational Radius**

   - Set max pickup radius from city center
   - Set max dropoff distance

3. **Add Route** (One Way example)

   - Go to Admin Panel → One Way Routes
   - Select From City: Delhi
   - Select To City: New destination
   - Set From/To place names
   - Save route

4. **Add Pricing**

   - For the new route
   - Set price for each vehicle type:
     - Sedan: ₹X
     - SUV: ₹Y
     - Luxury: ₹Z

5. **Test**
   - Go to customer website
   - Search for the new route
   - Verify cars appear

---

## Summary

### What "Cars" Actually Are

1. **Vehicle Types** = Categories (Sedan, SUV, etc.)
2. **Fleet Master** = Reference models (Honda City, Innova)
3. **Actual Fleets** = Real cars owned by suppliers
4. **Routes** = Pre-configured pickup → dropoff pairs
5. **Prices** = Fixed or calculated rates per vehicle type

### Why Cars Show/Don't Show

**Cars WILL show if:**

- ✅ Route is pre-configured
- ✅ OR pickup/dropoff within operational radius
- ✅ AND price data exists
- ✅ AND at least one vehicle type available

**Cars WON'T show (424 error) if:**

- ❌ Pickup city not in operational cities
- ❌ Pickup too far from operational city
- ❌ Dropoff outside service area
- ❌ No vehicle types configured
- ❌ No pricing data available

### To See Cars Successfully

**Use known working routes:**

- Delhi → Agra
- Delhi → Jaipur
- Delhi → Haridwar
- Delhi Airport → Connaught Place
- Bangalore Local (8hrs/80km)

These are **guaranteed to have routes, prices, and vehicles configured**!

---

**Last Updated:** November 12, 2025
