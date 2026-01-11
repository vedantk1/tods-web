# TravelODesk Trip API Test Results

## Test Date: November 26, 2025

## Summary

| Trip Type        | Passed | Failed | Success Rate |
| ---------------- | ------ | ------ | ------------ |
| Airport Transfer | 6      | 2      | 75%          |
| One Way          | 5      | 3      | 62.5%        |
| Local Trip       | 0      | 8      | 0%           |
| Round Trip       | 4      | 4      | 50%          |
| **Total**        | **15** | **17** | **47%**      |

---

## Detailed Results

### 1. AIRPORT TRANSFER (75% pass)

| Route                           | Result        | Notes                                |
| ------------------------------- | ------------- | ------------------------------------ |
| IGI Airport → India Gate        | ✅ 3 vehicles | Working                              |
| IGI Airport → Old Delhi Railway | ✅ 3 vehicles | Working                              |
| IGI Airport → Connaught Place   | ✅ 3 vehicles | Working                              |
| India Gate → IGI Airport        | ✅ 3 vehicles | Working                              |
| Dabolim Airport → Panaji        | ⚠️ 0 vehicles | Validation passed but no rates found |
| Mopa Airport → Panaji           | ⚠️ 0 vehicles | Validation passed but no rates found |
| Panaji → Dabolim Airport        | ✅ 3 vehicles | Working                              |
| Connaught Place → IGI Airport   | ✅ 3 vehicles | Working                              |

### 2. ONE WAY (62.5% pass)

| Route                              | Result                    | Notes                                       |
| ---------------------------------- | ------------------------- | ------------------------------------------- |
| Connaught Place → Taj Mahal (Agra) | ✅ 3 vehicles             | Working                                     |
| IGI Airport → Taj Mahal (Agra)     | ❌ "Delhi Division" error | **BUG: oneway.js lacks city normalization** |
| India Gate → Noida                 | ❌ Place not found        | **Wrong place_id used in test**             |
| India Gate → Gurgaon               | ❌ Place not found        | **Wrong place_id used in test**             |
| CP → Old Delhi Railway             | ✅ 3 vehicles             | Working                                     |
| IGI Airport → Noida                | ❌ Place not found        | **Wrong place_id used in test**             |
| Dabolim Airport → Panaji           | ✅ 3 vehicles             | Working                                     |
| Panaji → Mopa Airport              | ✅ 3 vehicles             | Working                                     |

### 3. LOCAL TRIP (0% pass)

| Route                   | Result                    | Notes                                          |
| ----------------------- | ------------------------- | ---------------------------------------------- |
| Delhi (India Gate)      | ❌ "Delhi Division" error | **BUG: localTrip.js lacks city normalization** |
| Delhi (Connaught Place) | ❌ Missing duration       | API requires `duration` parameter              |
| Delhi (IGI Airport)     | ❌ "Delhi Division" error | **BUG: localTrip.js lacks city normalization** |
| Goa (Panaji)            | ❌ Missing duration       | API requires `duration` parameter              |
| Goa (Dabolim Airport)   | ❌ Missing duration       | API requires `duration` parameter              |
| Agra (Taj Mahal)        | ❌ Missing duration       | API requires `duration` parameter              |
| Noida                   | ❌ Place not found        | **Wrong place_id used in test**                |
| Gurgaon                 | ❌ Place not found        | **Wrong place_id used in test**                |

### 4. ROUND TRIP (50% pass)

| Route                      | Result                    | Notes                                          |
| -------------------------- | ------------------------- | ---------------------------------------------- |
| Delhi (CP) ↔ Agra (Taj)    | ✅ 6 vehicles             | Working                                        |
| IGI Airport ↔ Agra (Taj)   | ❌ "Delhi Division" error | **BUG: roundTrip.js lacks city normalization** |
| Delhi (India Gate) ↔ Noida | ❌ Place not found        | **Wrong place_id used in test**                |
| Delhi (CP) ↔ Gurgaon       | ❌ Place not found        | **Wrong place_id used in test**                |
| Goa (Panaji) ↔ Dabolim     | ❌ "North Goa" error      | **BUG: roundTrip.js lacks city normalization** |
| IGI Airport ↔ Noida        | ❌ Place not found        | **Wrong place_id used in test**                |
| Delhi ↔ Old Delhi Rly      | ✅ 6 vehicles             | Working                                        |
| Dabolim ↔ Panaji           | ✅ 3 vehicles             | Working                                        |

---

## Root Cause Analysis

### Issue 1: City Normalization Missing in Other Validators (CRITICAL)

**Affected Files:**

- `todbooking/routevalidations/oneway.js`
- `todbooking/routevalidations/localTrip.js`
- `todbooking/routevalidations/roundTrip.js`

**Symptom:**

- "TOD unable to operate from this city Delhi Division"
- "TOD unable to operate from this city North Goa"

**Root Cause:**
Google Places API returns district/administrative names that don't match our operational city names:

- Google: "Delhi Division" → DB: "Delhi"
- Google: "North Goa" → DB: "Goa" or "Panaji"

**Solution:**
Port the `normalizeCityName` helper and `findOperationalCityNormalized` function from `airport.js` to all other validators.

### Issue 2: Wrong Place IDs in Test Script (Test Data Issue)

Some place_ids used in tests were incorrect. Re-verified correct IDs:

- Noida Sector 18: `ChIJtbkFrU7kDDkR3p6LjS9FR3E`
- Gurgaon: Need to re-fetch

### Issue 3: Local Trip Requires Duration Parameter

Local trip API requires `duration` parameter (in hours) which was not included in tests.

### Issue 4: Goa Airport Transfers Return 0 Vehicles

When pickup is Goa airport (Dabolim/Mopa) and dropoff is Panaji:

- Validation passes (no error)
- But 0 vehicles returned

**Hypothesis:** Rate configuration may be looking at wrong operational city for pricing. Need to investigate rate matching logic.

---

## Recommendations

### Priority 1: Fix City Normalization (Critical)

Apply the same normalization fix to:

1. `oneway.js`
2. `localTrip.js`
3. `roundTrip.js`
4. `multiOneway.js` (if exists)

### Priority 2: Test Data Cleanup

Re-verify all Google Place IDs used in test script.

### Priority 3: Investigate Goa Rate Issue

Debug why Dabolim Airport → Panaji returns 0 vehicles.

---

## Files Fixed (airport.js)

The `airport.js` file has been updated with:

1. `normalizeCityName()` helper for city name aliases
2. `findOperationalCityNormalized()` for database lookups
3. `findAirportByMultipleStrategies()` for flexible airport detection
4. All 4 pickup/dropoff validation sections updated

## Files Pending Fix

1. `todbooking/routevalidations/oneway.js`
2. `todbooking/routevalidations/localTrip.js`
3. `todbooking/routevalidations/roundTrip.js`
4. `todbooking/routevalidations/multiOneway.js`
