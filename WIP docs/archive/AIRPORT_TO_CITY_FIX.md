# Airport to Operational City Resolution Fix

## Problem Statement

Client reported: "Delhi, New Delhi, Delhi Airport, Indira Gandhi Airport shall have same rates instead we have to add the rates for all these locations differently because our system considers these 4 different locations. Same problem with Goa, Mopa Airport, Dabolim Airport."

## Root Cause Analysis

**TWO issues were discovered:**

### Issue 1: Wrong place_ids in Database

When airports were manually added to the database, we used **CITY place_ids instead of AIRPORT place_ids**:

- We stored `ChIJLbZ-NFv9DDkRQJY4FbcFcgM` (Delhi city)
- But Google Places returns `ChIJiS0q_IUbDTkRne1DLBh2874` for "Indira Gandhi International Airport"

The seeder uses `getGeoLocation()` which correctly gets airport place_ids, but manual inserts used wrong IDs.

### Issue 2: Validation Code Ignored FK

In `todbooking/routevalidations/airport.js`, when an airport was found by its Google `place_id`, the code was:

1. ✅ Correctly identifying the airport from `tod_airports` table
2. ❌ Then **ignoring** the `operational_city_id` foreign key
3. ❌ Instead doing **string matching** on `city_name` (e.g., "New Delhi" ≠ "Delhi")

## Solution

### Fix 1: Database place_ids Updated

Updated airports with correct Google place_ids:

| Airport                              | Old place_id                              | New place_id                |
| ------------------------------------ | ----------------------------------------- | --------------------------- |
| Indira Gandhi International Airport  | ChIJLbZ-NFv9DDkRQJY4FbcFcgM (Delhi city!) | ChIJiS0q_IUbDTkRne1DLBh2874 |
| Goa Dabolim International Airport    | (wrong)                                   | ChIJTfgMjPrHvzsRV3U0LSIp1Lc |
| Manohar International Airport (Mopa) | (wrong)                                   | ChIJu8f0v06NvzsR9t72TNCgghs |

### Fix 2: Validation Code Updated

Modified `todbooking/routevalidations/airport.js` to use the `operational_city_id` FK directly when an airport is found:

```javascript
// FIX: If airport found, use operational_city_id FK directly instead of string matching
if (
  helpers.prefs.context.query.pickUp_is_airport &&
  helpers.prefs.context.query.pickUp_object.operational_city_id
) {
  // Use FK directly - fetches operational city by ID
  ifOperationalCity = await knex(process.env.TOD_OPERATIONAL_CITIES)
    .where("id", helpers.prefs.context.query.pickUp_object.operational_city_id)
    .first();
} else {
  // Fallback: string matching for non-airport places
  // (original logic preserved)
}
```

## Files Modified

1. **`todbooking/routevalidations/airport.js`**
   - 4 validation sections fixed (2x pickUp, 2x dropOff)
   - Each section now checks if `operational_city_id` exists and uses it directly

## Database Changes

Added airports with correct `operational_city_id` mappings:

| Airport                              | Code | operational_city_id | Operational City |
| ------------------------------------ | ---- | ------------------- | ---------------- |
| Indira Gandhi International Airport  | DEL  | a60d8411-...        | Delhi            |
| Goa International Airport (Dabolim)  | GOI  | 47f0ea50-...        | Goa              |
| Manohar International Airport (Mopa) | GOX  | 47f0ea50-...        | Goa              |
| Madurai International Airport        | IXM  | e6ce67fe-...        | Madurai          |

## How It Works Now

1. Customer searches "Indira Gandhi Airport"
2. Google Places API returns place_id `ChIJiS0q_IUbDTkRne1DLBh2874`
3. System looks up airport by this place_id in `tod_airports`
4. **NOW FIXED**: Uses `operational_city_id` FK to get operational city directly (Delhi)
5. Rates from Delhi's distance rate table are used
6. No need to configure separate rates for airport!

## Critical: Correct place_ids

The seeder (`todapi/seeders/08.tod_airport_list.js`) uses `getGeoLocation()` which correctly fetches airport place_ids from Google. **DO NOT manually insert airports with city place_ids!**

To get the correct place_id for any airport:

```javascript
const result = await mapModel.getGeoLocation({ address: "Airport Name" }, 2);
console.log(result.data.place_id); // Use THIS, not the city's place_id
```

## Admin Panel Setup

To add a new airport:

1. Go to **Route Management → Airports**
2. Add new airport with Google place_id
3. **Important**: Set the `operational_city_id` to the correct operational city
4. Rates will automatically inherit from that operational city

## Pending Work

- `adminAirportTrip.js` has similar patterns (lower priority, admin-only)
- Consider adding more airports via seeder or admin UI
- Test with production data

## Testing Checklist

- [ ] Search "Indira Gandhi Airport" → should show Delhi rates
- [ ] Search "Dabolim Airport" → should show Goa rates
- [ ] Search "Mopa Airport" → should show Goa rates
- [ ] Search "Delhi" → should show Delhi rates (unchanged)
- [ ] Round trip Delhi Airport ↔ Agra → should work correctly
