# Multi One-Way Trip Vehicle Details Issues - Analysis Report

## Executive Summary

This document identifies the fundamental differences between how vehicle details are displayed and handled for **Multi One-Way trips** versus **other trip types** (One-Way, Round Trip, Local Trip, Airport Trip) in the admin panel modify booking form.

## Key Issues Identified

### 1. **Missing Case Handler in `getCarDetails()` Function**

**Location:** `todop/pages/booking/booking/_id.vue` - Line 5235-5259

**Problem:** The `getCarDetails()` function has a switch statement that handles trip types 1, 2, 3, and 5, but **completely omits case 4 (Multi One-Way)**.

```5086:5259:todop/pages/booking/booking/_id.vue
async getCarDetails(params = {}) {
  // ... setup code ...
  
  switch (context.booking.trip_type) {
    case 1: // Airport
      value = await context.ACTION_ADMIN_AIRPORT_PRE_BOOKING_DETAILS(inputData)
      break
    case 2: // Local Trip
      value = await context.ACTION_ADMIN_LOCAL_TRIP_PRE_BOOKING_DETAILS(inputData)
      break
    case 3: // One-Way
      value = await context.ACTION_ADMIN_ONEWAY_PRE_BOOKING_DETAILS(inputData)
      break
    case 5: // Round Trip
      value = await context.ACTION_ADMIN_ROUND_TRIP_PRE_BOOKING_DETAILS(inputData)
      break
    default:
      console.log('unknown trip type')
      return []  // ❌ Multi One-Way (case 4) falls here and returns early!
  }
}
```

**Impact:** 
- When clicking "Customize" checkbox for a Multi One-Way trip, `selectVehicle()` calls `getCarDetails()`, which immediately returns an empty array
- `carDetails` object never gets populated with the expanded vehicle details
- The expanded view (`carDetails && carDetails.id`) never shows because `carDetails.id` is never set

### 2. **Missing Store Action for Multi One-Way Car Details**

**Location:** `todop/store/Modules/booking/adminMultiOnewayTripBooking.js`

**Problem:** The store module for Multi One-Way trips does **NOT** have a `ACTION_ADMIN_MULTI_ONEWAY_PRE_BOOKING_DETAILS` action, unlike other trip types:

- ✅ `ACTION_ADMIN_ONEWAY_PRE_BOOKING_DETAILS` exists
- ✅ `ACTION_ADMIN_ROUND_TRIP_PRE_BOOKING_DETAILS` exists  
- ✅ `ACTION_ADMIN_LOCAL_TRIP_PRE_BOOKING_DETAILS` exists
- ✅ `ACTION_ADMIN_AIRPORT_PRE_BOOKING_DETAILS` exists
- ❌ `ACTION_ADMIN_MULTI_ONEWAY_PRE_BOOKING_DETAILS` **DOES NOT EXIST**

**Available actions in Multi One-Way store:**
- `ACTION_ADMIN_MULTI_ONEWAY_BOOKING_SUGGESTION` (for car list)
- `ACTION_ADMIN_MULTI_ONEWAY_BOOKING_TRIP_INDEX` (for trip legs)
- `ACTION_ADMIN_MULTI_ONEWAY_BOOKING_CREATE_OR_UPDATE` (for booking)
- `ACTION_SEND_MULTI_ONEWAY_TRIP_QUOTE` (for quotes)

### 3. **Missing Backend Endpoint**

**Location:** `todbooking/routes/admin/adminMultiOnewayTrip.js`

**Problem:** The admin routes for Multi One-Way trips do **NOT** have a `/carDetails` endpoint, unlike other trip types:

- ✅ `/admin/adminOnewayTrip/carDetails` exists
- ✅ `/admin/adminRoundTrip/carDetails` exists
- ✅ `/admin/adminLocalTrip/carDetails` exists
- ✅ `/admin/adminAirportTrip/carDetails` exists
- ❌ `/admin/adminMultiOnewayTrip/carDetails` **DOES NOT EXIST**

**Note:** There IS a backend model method `getMultiOnewayCarDetailsByID()` in `todbooking/model/multiOneway.js` (line 1755), but it's not exposed via a controller/route.

### 4. **Vehicle Pre-Selection Issue in `bindData()`**

**Location:** `todop/pages/booking/booking/_id.vue` - Line 7148-7391

**Problem:** When loading an existing Multi One-Way booking for editing:

1. `vehicleTypeId` IS correctly set from the booking data (line 7181)
2. `getCarList()` IS called (line 7308 and 7385)
3. `getCarDetails()` IS called (line 7391)
4. **BUT** `getCarDetails()` fails silently for Multi One-Way trips (returns early), so:
   - The selected vehicle never gets expanded into the detailed view
   - The checkbox state may be correct, but the expanded panel never appears

```7181:7391:todop/pages/booking/booking/_id.vue
// vehicleTypeId is set correctly
vehicleTypeId: value.result.vehicle_type_id,

// getCarList is called
await context.getCarList(context.booking.vehicleType)

// getCarDetails is called but fails for Multi One-Way
await context.getCarDetails()
```

### 5. **Frontend Rendering Logic is Similar**

**Location:** `todop/pages/booking/booking/_id.vue` - Lines 1739-3267 and 3270-3500

**Good News:** The frontend rendering code for vehicle lists is **similar** between trip types:

- **Expanded View:** Shown when `carDetails && carDetails.id` (line 1739)
- **List View:** Shown when `carDetails && !carDetails.id` (line 3270)
- **Customize Checkbox:** Same implementation for both views (lines 1810-1822 and 3336-3348)

**The problem is NOT in the rendering logic** - it's that `carDetails.id` never gets set for Multi One-Way trips because `getCarDetails()` doesn't handle them.

## Comparison: Other Trip Types vs Multi One-Way

### Other Trip Types (Working Correctly)

1. User clicks "Customize" checkbox
2. `selectVehicle()` is called → sets `vehicleTypeId`
3. `getCarDetails()` is called → makes API call to appropriate endpoint
4. API returns vehicle details with `id` property
5. `carDetails` object is populated
6. Frontend shows expanded view (`carDetails && carDetails.id`)

### Multi One-Way Trip (Broken)

1. User clicks "Customize" checkbox
2. `selectVehicle()` is called → sets `vehicleTypeId`
3. `getCarDetails()` is called → **falls through to default case**
4. Function returns `[]` immediately
5. `carDetails` object remains empty or unchanged
6. Frontend shows list view only (`carDetails && !carDetails.id`)

## Root Cause Summary

The fundamental issue is that **Multi One-Way trips are not integrated into the `getCarDetails()` workflow**:

1. ❌ No case handler in `getCarDetails()` switch statement
2. ❌ No store action for fetching car details
3. ❌ No backend route/controller endpoint
4. ✅ Backend model method exists but is unused
5. ✅ Frontend rendering code is compatible (just needs data)

## Recommended Fix Strategy

### Phase 1: Backend
1. Add `/carDetails` route in `todbooking/routes/admin/adminMultiOnewayTrip.js`
2. Add controller method in `todbooking/controller/adminMultiOnewayTrip.js`
3. Use existing `getMultiOnewayCarDetailsByID()` model method

### Phase 2: Frontend Store
1. Add `ACTION_ADMIN_MULTI_ONEWAY_PRE_BOOKING_DETAILS` action to store module
2. Map it in the component's `mapActions`

### Phase 3: Frontend Component
1. Add `case 4:` handler in `getCarDetails()` switch statement
2. Build appropriate query parameters for Multi One-Way trips (similar to how `getMultiOnewayCarList()` does it)
3. Call the new store action
4. Ensure response format matches what other trip types return (with `id` property)

### Phase 4: Testing
1. Test "Customize" checkbox functionality for Multi One-Way trips
2. Test pre-selection when editing existing Multi One-Way bookings
3. Verify expanded view shows all required details (pricing, amenities, etc.)

## Code References

- **Main Booking Component:** `todop/pages/booking/booking/_id.vue`
- **Store Module:** `todop/store/Modules/booking/adminMultiOnewayTripBooking.js`
- **Backend Routes:** `todbooking/routes/admin/adminMultiOnewayTrip.js`
- **Backend Controller:** `todbooking/controller/adminMultiOnewayTrip.js`
- **Backend Model:** `todbooking/model/multiOneway.js` (has `getMultiOnewayCarDetailsByID()` method)

## Additional Notes

- The `getMultiOnewayCarList()` function (line 6253) works correctly and fetches the vehicle list
- The issue is specifically with the **detailed view** that should appear when clicking "Customize"
- The vehicle list rendering (lines 3270-3500) works fine - vehicles are displayed correctly
- The problem is isolated to the expanded detail panel functionality

