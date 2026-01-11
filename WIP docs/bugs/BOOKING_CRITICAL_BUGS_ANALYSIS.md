# Critical Booking System Bugs - Complete Analysis

**Date:** December 9, 2025  
**Analyst:** Senior Systems Architect  
**Severity:** CRITICAL - Data Integrity Issues

---

## Executive Summary

After deep investigation of booking `TODA0036` (Delhi Railway Station → Agra Airport), I've identified **5 interconnected bugs** causing multiple issues:

1. **Place names being overwritten** with formatted addresses
2. **Airport detection not happening** on the booking flow  
3. **Trip type always stored as 3** (One Way) regardless of airport involvement
4. **Admin modify fails** because it uses One Way API for airport destinations
5. **Unified Search not being used** - frontend bypasses the smart detection

---

## Bug #1: Place Name Gets Overwritten (CONFIRMED)

### Evidence from Database
```sql
-- Booking TODA0036
pickup_location_place_name = 'J467+9X8, Kirby Place, Delhi Cantonment, New Delhi, Delhi 110010, India'
-- Should be: 'Delhi Railway Station' (what user selected)
```

### Root Cause
**File:** `todbooking/model/placeAPI.js` lines 146-148, 264-268

```javascript
// Line 146-148: Name gets set to formatted_address
if (more_details.data.result.formatted_address) {
  more_details.data.result.name = more_details.data.result.formatted_address;
}

// Line 264-268: Original displayName gets overwritten
details = {
  radius,
  ...details,                    // Has: displayName = "Delhi Railway Station"
  ...more_details.data.result,   // OVERWRITES with: name = formatted_address
};
```

### Impact
- User sees wrong location name in booking confirmation
- Admin panel shows wrong pickup/dropoff names
- Invoices/emails show wrong information

### Fix Required
Store the original `displayName` from Google Places API v2 as a separate field and use it for display while keeping `formatted_address` for backend processing.

---

## Bug #2: Airport Type Detection Not Happening (CONFIRMED)

### Evidence from Database
```sql
-- Agra Airport place_id in tod_airports
SELECT place_id FROM tod_airports WHERE airport_code = 'AGR';
-- Result: ChIJb98Sa_p2dDkRAgI8cr1jk0o

-- Booking dropoff_location_place_id
SELECT dropoff_location_place_id FROM tod_customer_booking WHERE refid = 'TODA0036';
-- Result: ChIJb98Sa_p2dDkRAgI8cr1jk0o

-- THEY MATCH! But booking type is still 3 (One Way), not 1 (Airport)
SELECT type, trip_type FROM tod_customer_booking WHERE refid = 'TODA0036';
-- Result: type=3, trip_type=3
```

### Root Cause
**File:** `todweb/components/Home/Trip.vue` lines 1743-1746

```javascript
// The unified search ALWAYS sends type=3 for non-round trips
if (context.isRoundTrip) {
  query.type = 5; // Round trip
} else {
  // One-way or airport transfer
  query.type = 3; // <-- ALWAYS 3! Backend will detect airport... BUT IT DOESN'T!
}
```

The frontend passes `type=3` in query params, and CarList page uses this to determine which API to call:

**File:** `todweb/pages/CarList/index.vue` lines 3679-3697

```javascript
fetch() {
  switch (context.type) {
    case 1: // Airport
      context.submitAirportTransfer();  // Calls /api/web/airport/carList
      break;
    case 3: // Oneway
      context.submitOnewayTransfer();   // Calls /api/web/oneway/carList
      break;
    // ...
  }
}
```

Since `type=3`, it ALWAYS calls the One Way API, which:
1. Doesn't check if destination is an airport
2. Stores booking with `type=3`

### Impact
- All airport trips booked via unified search are stored as One Way
- Wrong pricing engine may be used
- Admin modify fails for these bookings

---

## Bug #3: Unified Search Not Actually Being Used

### Root Cause
The `submitUnifiedSearch()` in Trip.vue:
1. Detects airport (`isAirportPickup`, `isAirportDropoff`) 
2. Passes these flags to CarList page
3. But CarList page IGNORES these flags and only looks at `type`

**File:** `todweb/pages/CarList/index.vue` - The `isAirportPickup`/`isAirportDropoff` query params are received but never used to modify the API call logic.

### What Should Happen
```javascript
// In CarList.vue fetch():
if (context.$route.query.isAirportPickup === 'true' || 
    context.$route.query.isAirportDropoff === 'true') {
  context.type = 1; // Force airport type
}
```

---

## Bug #4: Admin Modify Uses Wrong API

### Root Cause
**File:** `todop/pages/booking/booking/_id.vue`

When modifying a booking:
1. `bindData()` loads booking details
2. Sees `booking.trip_type = 3` (One Way - incorrectly stored)
3. Calls `getCarList()` which uses One Way API
4. One Way API fails validation because dropoff is an airport location

The One Way validation in `todbooking/routevalidations/adminOnewayTrip.js` expects:
- Valid operational city for both pickup AND dropoff
- City/district name matching

But for "Civil Air Terminal Kheria, Uttar Pradesh":
- The city extracted might be "Kheria" or empty
- No operational city named "Kheria" exists
- Validation fails → No vehicles returned

### Impact
Admin cannot modify bookings that have airport destinations but were incorrectly stored as One Way.

---

## Bug #5: X-Goog-FieldMask Missing Types (Potential)

### Location
**File:** `todbooking/model/placeAPI.js` line 118

```javascript
"X-Goog-FieldMask": "id,displayName,location"
// Missing: types
```

The `types` field is not requested from Google Places API. However, the secondary API call (`/maps/api/place/details/json`) DOES return types in `more_details.data.result.types`.

### Impact
While `types` IS available from the secondary call, it's not being used effectively in the unified search flow. The `checkIfAirport()` function in `unifiedSearch.js` only checks the `tod_airports` table by `place_id`, which SHOULD work... but the unified API isn't being called.

---

## Data Flow Diagram: How Bookings Are Created

```
USER FLOW (Current - BROKEN):
──────────────────────────────────────────────────────────────────────────────
1. User opens Trip.vue (Home page)
2. Selects "Delhi Railway Station" (pickup) - autocomplete from unified search
3. Selects "Agra Airport" (dropoff) - autocomplete from unified search
   - unifiedDropoffIsAirport = true (detected correctly!)
4. Clicks "Find Best Deals"
   - submitUnifiedSearch() called
   - Sets query.type = 3 (ALWAYS, regardless of airport detection)
   - Sets query.isAirportDropoff = 'true'
   
5. Redirected to CarList page with query params
   - type=3
   - isAirportDropoff=true (IGNORED!)

6. CarList.vue fetch() reads type=3
   - switch(3) → submitOnewayTransfer()
   - Calls ACTION_ONEWAY_BOOKING_SUGGESTION
   - API: /api/web/oneway/carList

7. One Way API validation in routevalidations/oneway.js
   - Does NOT check if dropoff is airport
   - Processes as regular One Way

8. User selects vehicle, proceeds to payment
   - Calls /api/web/oneway/bookingConfirmation
   - Booking stored with type=3, trip_type=3

RESULT:
- Booking created with WRONG type
- pickup_location_place_name = formatted_address (not displayName)
- Admin cannot modify because One Way API fails for airport destination
```

---

## Recommended Fix Strategy

### Phase 1: Critical - Fix Frontend Type Detection (1-2 days)

**File:** `todweb/components/Home/Trip.vue`

```javascript
// In submitUnifiedSearch():
if (context.isRoundTrip) {
  query.type = 5;
} else if (context.unifiedPickupIsAirport || context.unifiedDropoffIsAirport) {
  query.type = 1;  // Airport Transfer
} else {
  query.type = 3;  // One Way
}
```

**File:** `todweb/pages/CarList/index.vue`

```javascript
// In created() or fetch():
// Override type based on airport flags
if (context.$route.query.isAirportPickup === 'true' || 
    context.$route.query.isAirportDropoff === 'true') {
  context.type = 1;
}
```

### Phase 2: Fix Place Name Storage (1 day)

**File:** `todbooking/model/placeAPI.js`

```javascript
// Store both displayName and formatted_address
details = {
  radius,
  ...details,
  display_name: details.displayName?.text || details.displayName,  // Preserve original
  formatted_address: more_details.data.result.formatted_address,
  ...more_details.data.result,
  // Don't let name be overwritten - use display_name for UI
  name: details.displayName?.text || details.displayName || more_details.data.result.name,
};
```

### Phase 3: Admin Panel Robustness (1-2 days)

**File:** `todop/pages/booking/booking/_id.vue`

In `getCarList()` or `bindData()`, detect the actual location type:
1. Check if pickup_location_place_id or dropoff_location_place_id is in `tod_airports`
2. If yes, use Airport API for car list
3. Alternatively, make all admin APIs more flexible to handle any location type

### Phase 4: Migration Script (Optional)

Create a script to fix existing bookings:
1. Check if dropoff_location_place_id is in tod_airports
2. Update type and trip_type to 1 for those bookings
3. Re-fetch and update pickup_location_place_name with displayName

---

## Testing Checklist

After fixes:

- [ ] Book Delhi → Agra Airport → Should store as type=1
- [ ] Book Delhi → Agra (city) → Should store as type=3  
- [ ] Book IGI Airport → India Gate → Should store as type=1
- [ ] Admin modify airport booking → Should work
- [ ] Pickup/dropoff names should show user-selected name, not Plus Code

---

## Implementation Status

### ✅ COMPLETED (December 9, 2025)

#### Fix 1: Trip.vue - Proper Type Detection
**File:** `todweb/components/Home/Trip.vue`

```javascript
// BEFORE (Always type=3):
} else {
  query.type = 3; // Backend will detect airport...
}

// AFTER (Proper detection):
} else if (context.unifiedPickupIsAirport || context.unifiedDropoffIsAirport) {
  query.type = 1;  // Airport Transfer
} else {
  query.type = 3;  // Regular One-way
}
```

#### Fix 2: CarList.vue - Respect Airport Flags
**File:** `todweb/pages/CarList/index.vue`

Added in `created()`:
```javascript
// Override type to Airport (1) if airport flags are set from unified search
if (context.$route.query.isAirportPickup === 'true' ||
    context.$route.query.isAirportDropoff === 'true') {
  if (context.type !== 5) {  // Round trip takes precedence
    context.type = 1;
    context.typeLocal = 1;
  }
}

// Set airport flags for API calls
if (context.$route.query.isAirportPickup === 'true') {
  context.airportPickupIsAirport = true;
}
if (context.$route.query.isAirportDropoff === 'true') {
  context.airportDropOffIsAirport = true;
}
```

#### Fix 3: placeAPI.js - Preserve DisplayName
**File:** `todbooking/model/placeAPI.js`

```javascript
// BEFORE: name would be overwritten with formatted_address
details = {
  ...more_details.data.result,  // name = "J467+9X8, Kirby Place..."
};

// AFTER: displayName preserved
const originalDisplayName = details.displayName?.text || details.displayName;
details = {
  ...more_details.data.result,
  name: originalDisplayName || more_details.data.result.name,  // "Delhi Railway Station"
  formatted_address: more_details.data.result.formatted_address,
  types: details.types || more_details.data.result.types,  // Enable airport detection
};
```

Also added `types` to X-Goog-FieldMask for airport detection.

#### Fix 4: Admin Booking Page - Fallback Logic
**File:** `todop/pages/booking/booking/_id.vue`

Added fallback in `getCarList()`:
```javascript
case 3:
  value = await context.ACTION_ADMIN_ONEWAY_BOOKING_SUGGESTION(inputData)
  // FALLBACK: If One Way fails, try Airport API
  if (!value.status && value.error?.code === 424) {
    value = await context.ACTION_ADMIN_AIRPORT_BOOKING_SUGGESTION(inputData)
    if (value.status) {
      context.booking.trip_type = 1  // Fix the type for submission
    }
  }
  break
```

---

## Files Modified

| File | Change |
|------|--------|
| `todweb/components/Home/Trip.vue` | Fixed type detection in submitUnifiedSearch() |
| `todweb/pages/CarList/index.vue` | Added airport flag detection and type override |
| `todbooking/model/placeAPI.js` | Preserved displayName, added types to FieldMask |
| `todop/pages/booking/booking/_id.vue` | Added Airport API fallback for mistyped bookings |

#### Fix 5: Multi One Way Vehicle List - Proper Implementation
**Files:** 
- `todop/pages/booking/booking/_id.vue`
- `todop/store/Modules/booking/adminMultiOnewayTripBooking.js`

Multi One Way trips needed proper vehicle list implementation just like the web frontend.

**Changes:**

1. **Added Vuex action** `ACTION_ADMIN_MULTI_ONEWAY_BOOKING_SUGGESTION`:
```javascript
// Uses the web route since it has the carList endpoint
async ACTION_ADMIN_MULTI_ONEWAY_BOOKING_SUGGESTION(vuexContext, inputData) {
  const response = await this.$axios.$get(
    baseUrl.BOOKING_BASE_URL + '/web/multi_oneway/carList',
    inputData.inputDatas
  )
  return Promise.resolve(JSON.parse(JSON.stringify(response)))
}
```

2. **Updated `getCarList()` case 4** to properly fetch vehicles:
```javascript
case 4:
  // Build the multi-oneway query parameters from trip legs
  let multiOnewayQuery = {}
  for (let i = 0; i < context.multiOnewayTrips.length; i++) {
    const trip = context.multiOnewayTrips[i]
    if (trip.status === 2) continue // Skip cancelled trips
    multiOnewayQuery[`pickUp${i}`] = trip.pickupPlaceID
    multiOnewayQuery[`dropOff${i}`] = trip.dropoffPlaceID
    multiOnewayQuery[`pickUpDate${i}`] = context.$moment(...).format('YYYY-MM-DD HH:mm')
    multiOnewayQuery[`passengers${i}`] = trip.passengers || 1
  }
  value = await context.ACTION_ADMIN_MULTI_ONEWAY_BOOKING_SUGGESTION(...)
  break
```

3. **Fixed load order in `bindData()`** - call `getCarList()` AFTER loading Multi One Way trips

4. **Added "Get Price" button** for Multi One Way trips with `getMultiOnewayCarList()` method

5. **Added currency selector** in Multi One Way summary section

---

## Questions for Product Team

1. Should we run a migration to fix existing incorrectly-typed bookings?
2. For bookings where both pickup AND dropoff are airports (rare), which API should be used?
3. Should we add a visual indicator in admin when a booking involves an airport?
4. Multi One Way trips show "-" for Amount per leg - should we add a "Calculate Prices" button to re-fetch pricing for modified legs?

