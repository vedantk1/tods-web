# City Name Normalization & Operational Radius Fix

**Date:** November 27, 2025  
**Issue:** Client complaint - "Delhi, New Delhi, Delhi Airport, Indira Gandhi Airport shall have same rates"

## Executive Summary

When users search for car bookings from locations like "India Gate, New Delhi" or "Indira Gandhi International Airport", the system was failing to find vehicles or showing incorrect pricing. There were **TWO root causes**:

### Root Cause 1: City Name String Mismatch

- Google returns: "New Delhi", "Delhi Division", "North Goa"
- Database has: "Delhi", "Goa"
- Result: **No match** → "No vehicles found" or "City not operational"

### Root Cause 2: Operational Radius Too Small for Airports

- Goa's operational city center is at coordinates (15.299, 74.124)
- Dabolim Airport is **46km** from center, Mopa Airport is **76km** from center
- Goa's original radius was **30km** → Airports were outside the radius!
- Result: **Airport to city bookings failed** even though city to airport worked

### After Fix

- All Delhi variations (New Delhi, Delhi, Delhi Division) → **Delhi**
- All Goa variations (North Goa, South Goa, Panaji) → **Goa**
- Goa's operational radius increased from 30km to **85km** to cover all airports
- Airport state codes fixed: "Delhi" → "DL", "Goa" → "GA"
- Result: ✅ **All airport transfers working in both directions**

---

## Investigation Findings

### 1. How the System Works

```
User selects location → Google Place ID → Google Places API → City/State extraction → DB lookup → Pricing
```

The validation code in `routevalidations/*.js` files:

1. Takes the Google Place ID from user
2. Calls Google Places API to get location details (city, state, etc.)
3. Queries our `tod_operational_cities` table to find matching city
4. If no match found → rejects the request

### 2. Root Cause: City Name Mismatches

| Google Returns | Database Has | Result      |
| -------------- | ------------ | ----------- |
| New Delhi      | Delhi        | ❌ No match |
| Delhi Division | Delhi        | ❌ No match |
| North Goa      | Goa          | ❌ No match |
| South Goa      | Goa          | ❌ No match |

The original code used **exact string matching**:

```javascript
// OLD CODE - Exact match fails
.where('city_name', helpers.prefs.context.query.pickUp_object.city)
```

### 3. Additional Issue: Airport State Codes

The `tod_airports` table had **full state names** instead of **state codes**:

- `state: "Delhi"` instead of `state: "DL"`
- `state: "Goa"` instead of `state: "GA"`

But Google Places API returns short codes (DL, GA), causing airport matching to fail.

---

## Solution Implemented

### 1. City Normalization Helper Module

**File:** `todbooking/common/cityNormalization.js`

```javascript
// City aliases - Google name → Database name
const CITY_ALIASES = {
  "new delhi": "delhi",
  "north delhi": "delhi",
  "south delhi": "delhi",
  "east delhi": "delhi",
  "west delhi": "delhi",
  "central delhi": "delhi",
  "delhi division": "delhi",
  "north goa": "goa",
  "south goa": "goa",
  // ... more aliases
};

function normalizeCityName(cityName) {
  if (!cityName) return "";
  const lowered = cityName.toLowerCase().trim();
  return CITY_ALIASES[lowered] || lowered;
}
```

### 2. Updated Validation Files

Updated all 4 trip type validators with normalized matching:

| File           | Trip Type        | Sections Updated                                            |
| -------------- | ---------------- | ----------------------------------------------------------- |
| `airport.js`   | Airport Transfer | getCarsSchema, bookingDetailsSchema                         |
| `oneway.js`    | One Way          | getCarsSchema, bookingDetailsSchema (domestic + crossbound) |
| `localTrip.js` | Local Trip       | packageSchema, getCarsSchema, bookingDetailsSchema          |
| `roundTrip.js` | Round Trip       | getCarsSchema, bookingDetailsSchema                         |

**Pattern Applied:**

```javascript
// OLD - Exact match
.where('city_name', helpers.prefs.context.query.pickUp_object.city)

// NEW - Normalized case-insensitive match
.whereRaw('LOWER(city_name) = ?', [normalizeCityName(helpers.prefs.context.query.pickUp_object.city)])
```

### 3. Fixed Airport State Codes

Updated `tod_airports` table to use state codes:

```sql
UPDATE tod_airports SET state = 'DL' WHERE state = 'Delhi';
UPDATE tod_airports SET state = 'GA' WHERE state = 'Goa';
```

### 4. Fixed Goa Operational Radius

The Goa operational city center is located in the interior of Goa. Both airports are far from this center:

- Dabolim Airport (GOI): **46km** from center
- Mopa Airport (GOX): **76km** from center

Original radius was 30km, meaning airports were outside the service area!

```sql
-- Original value: radius = 30
UPDATE tod_operational_radius
SET radius = 85
WHERE operational_city_id = '47f0ea50-548a-43c3-a585-7cfcb9894568'; -- Goa
```

This fix ensures that airport transfers in Goa work in **both directions**:

- ✅ Panaji → Dabolim/Mopa Airport
- ✅ Dabolim/Mopa Airport → Panaji

---

## Test Results

### Final Test Suite Results (32 tests)

```
=== 1. AIRPORT TRANSFER ===
✓ IGI Airport → India Gate               3 vehicles
✓ IGI Airport → Old Delhi Railway        3 vehicles
✓ IGI Airport → Connaught Place          3 vehicles
✓ India Gate → IGI Airport               3 vehicles
✓ Dabolim Airport → Panaji               3 vehicles
✓ Mopa Airport → Panaji                  3 vehicles
✓ Panaji → Dabolim Airport               3 vehicles
✓ Connaught Place → IGI Airport          3 vehicles

=== 2. ONE WAY ===
✓ Connaught Place → Taj Mahal (Agra)     3 vehicles
✓ IGI Airport → Taj Mahal (Agra)         3 vehicles
✓ India Gate → Noida                     3 vehicles
✓ India Gate → Gurgaon                   3 vehicles
✓ CP → Old Delhi Railway                 3 vehicles
✓ IGI Airport → Noida                    3 vehicles
✓ Dabolim Airport → Panaji               3 vehicles
✓ Panaji → Mopa Airport                  3 vehicles

=== 3. LOCAL TRIP ===
✗ Delhi (India Gate) 4hr                 Vehicles not found (rate config)
✓ Delhi (Connaught Place) 8hr            3 vehicles
✗ Delhi (IGI Airport) 4hr                Vehicles not found (rate config)
...

=== 4. ROUND TRIP ===
✓ Delhi (CP) ↔ Agra (Taj)                6 vehicles
✓ IGI Airport ↔ Agra (Taj)               6 vehicles
✓ Delhi (India Gate) ↔ Noida             6 vehicles
✓ Delhi (CP) ↔ Gurgaon                   6 vehicles
✓ Goa (Panaji) ↔ Dabolim                 3 vehicles
✓ IGI Airport ↔ Noida                    6 vehicles
✓ Delhi ↔ Old Delhi Rly                  6 vehicles
✓ Dabolim ↔ Panaji                       3 vehicles
```

### Summary

| Trip Type        | Pass Rate      | Notes                     |
| ---------------- | -------------- | ------------------------- |
| Airport Transfer | **8/8 (100%)** | All routes working ✅     |
| One Way          | **8/8 (100%)** | All routes working ✅     |
| Local Trip       | 1/8 (12%)      | Rate configuration needed |
| Round Trip       | **8/8 (100%)** | All routes working ✅     |

**The city normalization and operational radius fixes are working correctly.**

Remaining Local Trip failures are due to:

1. **Missing rate configurations** for some cities/packages
2. **Location-specific duration packages** not configured

---

## Files Modified

### Code Changes

1. **`todbooking/common/cityNormalization.js`** (NEW)

   - City alias mapping
   - `normalizeCityName()` function
   - `findOperationalCityNormalized()` helper
   - `extractIATACode()` for airport matching

2. **`todbooking/routevalidations/airport.js`**

   - Added city normalization imports
   - Updated `findAirportByMultipleStrategies()` for robust airport matching
   - Updated getCarsSchema pickUp/dropOff validation
   - Updated bookingDetailsSchema pickUp/dropOff validation

3. **`todbooking/routevalidations/oneway.js`**

   - Added city normalization imports and helper
   - Updated getCarsSchema for domestic/international and crossbound
   - Updated bookingDetailsSchema for both trip types

4. **`todbooking/routevalidations/localTrip.js`**

   - Added city normalization imports and helper
   - Updated packageSchema, getCarsSchema, bookingDetailsSchema

5. **`todbooking/routevalidations/roundTrip.js`**
   - Added city normalization imports and helper
   - Updated getCarsSchema and bookingDetailsSchema

### Database Changes

```sql
-- Fixed airport state codes (from full names to short codes)
UPDATE tod_airports SET state = 'DL' WHERE state = 'Delhi';
UPDATE tod_airports SET state = 'GA' WHERE state = 'Goa';

-- Fixed Goa operational radius (airports were outside original 30km radius)
UPDATE tod_operational_radius
SET radius = 85
WHERE operational_city_id = '47f0ea50-548a-43c3-a585-7cfcb9894568'; -- Goa
```

---

## How to Add More City Aliases

If you discover more city name mismatches, add them to:

**File:** `todbooking/common/cityNormalization.js`

```javascript
const CITY_ALIASES = {
  // Add new aliases here:
  "google returned name": "database city name",

  // Examples:
  bengaluru: "bangalore",
  "mumbai suburban": "mumbai",
};
```

---

## Remaining Tasks

### Data Configuration Needed

1. **Local Trip Rates**: Add local trip rates for:
   - Delhi (4hr package for all areas)
   - Goa (Panaji, Dabolim areas)
   - Agra, Noida, Gurgaon

### Code Audit (Optional)

Check for any other places using raw city_name matching:

```bash
grep -r "where.*city_name" todbooking/routevalidations/
grep -r "where.*city_name" todbooking/model/
```

---

## Key Lessons Learned

### 1. Operational Radius Must Cover All Service Points

When adding new airports to an operational city, always verify:

- Distance from airport to operational city center
- Ensure `tod_operational_radius.radius` is >= max airport distance
- For Goa: Center is inland, airports are on the coast (46-76km away!)

### 2. Multiple Operational Cities Can Cause Issues

Goa has 16 operational cities (Panaji, Madgaon, Dabolim, Mopa, etc.) but both airports link to the main "Goa" city. This caused directional issues where:

- Panaji → Airport worked (uses Panaji's rates)
- Airport → Panaji failed (tried to use Goa's rates, but Panaji is a different op city)

**Solution:** Either consolidate operational cities OR increase the main city's radius to cover the entire service area.

### 3. Test Both Directions for Airport Transfers

Always test:

- City → Airport
- Airport → City

Different code paths handle each direction, and one may fail while the other works.

---

## Technical Details

### Google Place ID Expiration

Google Place IDs can expire. If tests start failing with "Pick Up Place not found", get fresh Place IDs:

```bash
# Use this Node.js script to search for fresh Place IDs
node -e "
require('dotenv').config();
const axios = require('axios');
axios.post('https://places.googleapis.com/v1/places:autocomplete', {
  input: 'Indira Gandhi International Airport',
  includedRegionCodes: ['IN'],
}, { headers: { 'X-Goog-Api-Key': process.env.MAP_API_KEY }})
.then(r => console.log(r.data.suggestions[0].placePrediction.placeId));
"
```

### Test Script Location

The comprehensive test script is at: `todbooking/scripts/test_trips.sh`

Run it with:

```bash
cd /Users/vedan/Projects/travelodesk/todbooking
bash scripts/test_trips.sh
```

Run with:

```bash
/tmp/test_trips.sh
```

---

## Conclusion

The city name normalization fix successfully resolves the core issue where "Delhi, New Delhi, Delhi Airport" were not treated as the same location. The system now properly normalizes city names before database lookups, ensuring consistent results regardless of how Google returns the city name.

**Key Learnings:**

1. Always use case-insensitive matching for city names
2. Maintain an alias map for known Google vs DB mismatches
3. Use state codes (DL, GA) instead of full names for consistency
4. Test with actual Google Place IDs, not hardcoded values
