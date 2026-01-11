# Multi One-Way Feature - Implementation Plan

> **Living Document** - Last Updated: December 8, 2025 (UTC)
> 
> Track progress, findings, and implementation details for the Multi One-Way feature.

---

## Table of Contents

1. [Current Status Summary](#1-current-status-summary)
2. [Feature Requirements](#2-feature-requirements)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Plan](#4-implementation-plan)
5. [Rate Calculation Logic](#5-rate-calculation-logic)
6. [Edge Cases & Solutions](#6-edge-cases--solutions)
7. [Database Changes](#7-database-changes)
8. [API Changes](#8-api-changes)
9. [Frontend Changes](#9-frontend-changes)
10. [Admin Panel Changes](#10-admin-panel-changes)
11. [Downstream Changes](#11-downstream-changes)
12. [Testing Plan](#12-testing-plan)
13. [Progress Tracker](#13-progress-tracker)

---

## 1. Current Status Summary

### What's Already Implemented ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend Model** | ✅ Complete | `todbooking/model/multiOneway.js` (~5000 lines) |
| **Backend Controller** | ✅ Complete | `todbooking/controller/multiOneway.js` |
| **Backend Routes** | ✅ Complete | `todbooking/routes/web/multiOneway.js` |
| **Backend Validation** | ✅ Complete | `todbooking/routevalidations/multiOneway.js` |
| **Database Migration** | ✅ Complete | `tod_multioneway_booking` table exists |
| **Frontend Store** | ✅ Complete | `todweb/store/Modules/multiOneway.js` |
| **Admin Panel View** | ✅ Complete | `todop/pages/booking/booking/multi-oneway/_id.vue` |

### What's Disabled/Missing ❌

| Component | Status | Notes |
|-----------|--------|-------|
| **Trip.vue Radio Buttons** | ✅ Implemented | Replaced checkbox with 3 radio buttons |
| **Multi One Way Form** | ✅ Implemented | Dynamic trip rows (2-7), source auto-fill |
| **CarList Type=4 Access** | ✅ Accessible | Entry point now available via Multi One Way form |
| **Marketing Page** | ⚠️ Needs Update | `/multi-one-way/` tab index needs adjustment |
| **Max 7 Trips Limit** | ✅ Frontend | Backend validation pending |

---

## 2. Feature Requirements

### 2.1 Core Business Requirements

1. **Trip Limit**: Maximum 7 one-way legs per booking
2. **Minimum**: At least 2 legs required
3. **Booking Structure**: Master booking with sub-booking IDs for each leg
4. **Vehicle Consistency**: Same vehicle type across all legs
5. **Cancelation**: Individual legs can be deleted, refund handled manually by ops

### 2.2 UI Requirements (Based on cheapOair Reference)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MULTI ONE-WAY BOOKING FORM                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trip 1                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Source       │  │ Destination  │  │ Date       │  │ Time       │       │
│  │ BOM Mumbai   │→ │ DEL New Delhi│  │ Apr 23 2025│  │ 10:00 AM   │       │
│  └──────────────┘  └──────────────┘  └────────────┘  └────────────┘       │
│                                                                             │
│  Trip 2                                                                [🗑]│
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ DEL New Delhi│→ │ MAA Chennai  │  │ Apr 25 2025│  │ 05:13 PM   │       │
│  └──────────────┘  └──────────────┘  └────────────┘  └────────────┘       │
│  ↑ Auto-filled from Trip 1 destination (editable)                          │
│                                                                             │
│  Trip 3                                                                [🗑]│
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ MAA Chennai  │→ │ HYD Hyderabad│  │ Apr 31 2025│  │ 03:11 PM   │       │
│  └──────────────┘  └──────────────┘  └────────────┘  └────────────┘       │
│                                                                             │
│                        [+ Add Another Trip] (up to 7)                       │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │  No. of Passengers: [-] 1 [+]       [ 🔍 Find Best Deals ]            ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Validation Rules

| Rule | Description |
|------|-------------|
| **Source Auto-fill** | Trip N+1 source = Trip N destination (editable by user) |
| **Date Validation** | Trip N+1 date ≥ Trip N date |
| **Time Validation** | If same day, Trip N+1 time > Trip N arrival time |
| **Minimum Trips** | ≥ 2 trips required |
| **Maximum Trips** | ≤ 7 trips allowed |

### 2.4 Client Notes (Verbatim)

> - Multi one-way will have one master booking number, and which shall have sub booking ID for each sub booking
> - Sub booking ID is like any other One-Way trip
> - Customer can request Ops team to remove any sub trip; we will have provision to delete any route and ops team shall share the refund manually
> - If customer want to add another route, it will be done as another one-way trip and ops center to handle it as another one-way trip

---

## 3. Architecture Overview

### 3.1 System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Trip.vue    │───▶│  CarList     │───▶│ CustomerInfo │───▶│  Payment  │ │
│  │  Multi-form  │    │  Type=4      │    │   Form       │    │  Gateway  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
├─────────────────────────────────────────────────────────────────────────────┤
│                              API CALLS                                      │
│                                                                             │
│  /multi_oneway/     /multi_oneway/      /multi_oneway/     /multi_oneway/  │
│     search            carList            carDetails        bookingConfirm   │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
├─────────────────────────────────────────────────────────────────────────────┤
│                              DATABASE                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   tod_customer_booking (Master)                      │   │
│  │  id: UUID-MASTER, type: 4, main_booking_id: NULL                    │   │
│  │  total_amount: ₹45,000 (sum of all legs)                            │   │
│  │  object: { trips: [...], vehicle: {...}, pricing: {...} }           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Leg 1 (Sub)  │    │ Leg 2 (Sub)  │    │ Leg 3 (Sub)  │                  │
│  │ BOM → DEL    │    │ DEL → MAA    │    │ MAA → HYD    │                  │
│  │ ₹15,000      │    │ ₹12,000      │    │ ₹18,000      │                  │
│  │ tod_multi... │    │ tod_multi... │    │ tod_multi... │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Comparison with Other Trip Types

| Aspect | One Way | Round Trip | Multi One Way |
|--------|---------|------------|---------------|
| **Legs** | 1 | 2 (same route, reverse) | 2-7 (different routes) |
| **Pricing** | Single calculation | Per-day basis | Per-leg calculation |
| **Vehicle Selection** | Any available | Any available | Intersection of all legs |
| **Operational City** | Single check | Single check | Per-leg check |
| **Database** | `tod_customer_booking` only | `tod_customer_booking` only | Master + `tod_multioneway_booking` |
| **Sub-bookings** | No | No | Yes (per leg) |

---

## 4. Implementation Plan

### Phase 1: Frontend - Unified Search Enhancement ✅ COMPLETED

**Objective**: Replace round trip checkbox with radio buttons (One Way / Round Trip / Multi One Way)

#### 4.1.1 Trip.vue Changes

**File**: `todweb/components/Home/Trip.vue`

```vue
<!-- BEFORE (checkbox) -->
<b-checkbox v-model="isRoundTrip" type="is-primary">
  I need a round trip (return journey)
</b-checkbox>

<!-- AFTER (radio buttons) -->
<div class="trip-mode-selector mb-4">
  <b-field>
    <b-radio-button v-model="tripMode" native-value="oneway" type="is-primary is-light is-outlined">
      <span>One Way</span>
    </b-radio-button>
    <b-radio-button v-model="tripMode" native-value="roundtrip" type="is-primary is-light is-outlined">
      <span>Round Trip</span>
    </b-radio-button>
    <b-radio-button v-model="tripMode" native-value="multioneway" type="is-primary is-light is-outlined">
      <span>Multi One Way</span>
    </b-radio-button>
  </b-field>
</div>
```

**Data Changes**:
```javascript
data() {
  return {
    // BEFORE
    isRoundTrip: false,
    
    // AFTER
    tripMode: 'oneway', // 'oneway' | 'roundtrip' | 'multioneway'
    
    // Multi One Way specific
    multiOnewayTrips: [
      { pickup: null, dropOff: null, pickupPlaceID: null, dropOffPlaceID: null, 
        pickupDate: null, pickupTime: null, pickupSearchResult: [], dropOffSearchResult: [] },
      { pickup: null, dropOff: null, pickupPlaceID: null, dropOffPlaceID: null, 
        pickupDate: null, pickupTime: null, pickupSearchResult: [], dropOffSearchResult: [] }
    ]
  }
}
```

#### 4.1.2 Dynamic Form Rendering

```vue
<template>
  <!-- ONE WAY / AIRPORT MODE -->
  <template v-if="tripMode === 'oneway'">
    <!-- Existing one-way form fields -->
  </template>
  
  <!-- ROUND TRIP MODE -->
  <template v-else-if="tripMode === 'roundtrip'">
    <!-- Existing one-way fields + return date/time -->
  </template>
  
  <!-- MULTI ONE WAY MODE -->
  <template v-else-if="tripMode === 'multioneway'">
    <div v-for="(trip, index) in multiOnewayTrips" :key="index" class="multi-trip-row">
      <div class="trip-header">
        <span class="trip-number">Trip {{ index + 1 }}</span>
        <button v-if="index >= 2" @click="removeTrip(index)" class="delete-trip">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      
      <!-- Source -->
      <b-autocomplete
        v-model="trip.pickup"
        :data="trip.pickupSearchResult"
        :disabled="index > 0 && !allowEditSource"
        @typing="searchLocation($event, index, 'pickup')"
        @select="selectLocation($event, index, 'pickup')"
        placeholder="Source City"
      />
      
      <!-- Destination -->
      <b-autocomplete
        v-model="trip.dropOff"
        :data="trip.dropOffSearchResult"
        @typing="searchLocation($event, index, 'dropoff')"
        @select="selectLocation($event, index, 'dropoff')"
        placeholder="Destination City"
      />
      
      <!-- Date -->
      <b-datepicker
        v-model="trip.pickupDate"
        :min-date="getMinDateForTrip(index)"
        placeholder="Travel Date"
      />
      
      <!-- Time -->
      <b-timepicker
        v-model="trip.pickupTime"
        :min-time="getMinTimeForTrip(index)"
        placeholder="Pickup Time"
      />
    </div>
    
    <!-- Add Trip Button -->
    <button 
      v-if="multiOnewayTrips.length < 7" 
      @click="addTrip" 
      class="add-trip-btn"
    >
      <i class="fa-solid fa-plus"></i> Add Another Trip
    </button>
    
    <!-- Passengers + Submit -->
    <div class="submit-row">
      <b-numberinput v-model="passengers" min="1" />
      <button @click="submitMultiOneway" class="submit-btn">
        Find Best Deals
      </button>
    </div>
  </template>
</template>
```

### Phase 2: Backend Validation Enhancement 🟡 IN PROGRESS

**Objective**: Add max 7 trips validation, enhance date/time validation

#### 4.2.1 Route Validation Updates

**File**: `todbooking/routevalidations/multiOneway.js`

```javascript
// ADD: Max 7 trips validation
getCarsSchema: Joi.object({
  multiOneway: Joi.array()
    .min(2)
    .max(7)  // NEW: Maximum 7 trips
    .items(/* existing item schema */)
    .required(),
  // ...
})

// ADD: Time validation between consecutive trips
.external(async (value, helpers) => {
  const trips = helpers.prefs.context.query.multiOneway;
  
  for (let i = 1; i < trips.length; i++) {
    const prevTrip = trips[i - 1];
    const currTrip = trips[i];
    
    // Get estimated arrival time of previous trip
    const prevDistance = await PlaceAPI.getDistance(
      prevTrip.pickUp_object.location.latitude,
      prevTrip.pickUp_object.location.longitude,
      [{
        latitude: prevTrip.dropOff_object.location.latitude,
        longitude: prevTrip.dropOff_object.location.longitude
      }]
    );
    
    const prevArrival = moment(prevTrip.pickUpDate_moment)
      .add(prevDistance.data.duration.value, 'seconds');
    
    // Validate current trip starts after previous arrival
    if (currTrip.pickUpDate_moment.isBefore(prevArrival)) {
      return helpers.error('any.invalid', {
        message: `Trip ${i + 1} pickup time must be after Trip ${i} estimated arrival (${prevArrival.format('MMM D, h:mm A')})`
      });
    }
  }
})
```

### Phase 3: Car List Display Strategy 🔴

**Objective**: Handle scenarios where legs have different vehicle availability

#### 4.3.1 Vehicle Intersection Logic (Existing - Verify)

The current backend already implements intersection:

```javascript
// In multiOneway.js model
for (let i = 0; i < req.query.multiOneway.length; i++) {
  // ...
  if (i > 0) {
    const fleetIds = _.map(mainVehicleList, "vehicle_type_id");
    fleetQuery.whereIn(
      `${process.env.TOD_FLEETS_MASTER}.vehicle_type_id`,
      fleetIds
    );
  }
  // ...
}
```

**Result**: Only vehicles available in ALL legs are shown.

#### 4.3.2 Car List Display (Frontend)

**File**: `todweb/pages/CarList/index.vue`

The existing code for type=4 already shows:
- All trip legs with source → destination
- Estimated duration per leg
- Aggregated price

**Enhancement needed**:
```vue
<!-- Show per-leg breakdown in car card -->
<div v-if="type === 4" class="multi-trip-summary">
  <div v-for="(leg, idx) in car.trip" :key="idx" class="leg-row">
    <span class="leg-number">{{ idx + 1 }}</span>
    <span class="leg-route">{{ leg.pickUp }} → {{ leg.dropOff }}</span>
    <span class="leg-distance">{{ leg.distance }}</span>
    <span class="leg-duration">{{ leg.duration }}</span>
  </div>
  <div class="total-row">
    <strong>Total: {{ car.total_amount_text }}</strong>
  </div>
</div>
```

---

## 5. Rate Calculation Logic

### 5.1 Multi One Way Pricing Algorithm

```
INPUT: Array of trips [T1, T2, T3, ... Tn] where n ≤ 7

FOR each trip Ti:
  1. VALIDATE operational city coverage for Ti.source
     - If NOT covered: Return error "Service unavailable from {city}"
     
  2. CALCULATE leg price using ONE WAY logic:
     - routePrice = Check tod_one_way_trip_routes for fixed route
     - distancePrice = Calculate from tod_operational_cities_distance_rate
     - legPrice = MIN(routePrice, distancePrice) excluding zeros
     
  3. APPLY modifiers:
     - surcharge (if booking < 2 hrs before pickup)
     - nightCharge (if pickup in night hours)
     - campaign discount/markup (if active)
     
  4. STORE: { legPrice, nightCharge, trip details }

AGGREGATE:
  totalPrice = SUM(all legPrices)
  totalNightCharge = SUM(all nightCharges)
  taxAmount = (totalPrice + totalNightCharge) × taxPercentage
  grandTotal = totalPrice + totalNightCharge + taxAmount

VEHICLE FILTER:
  - Start with all vehicles from Leg 1
  - For each subsequent leg, INTERSECT available vehicles
  - Result: Only vehicles available for ALL legs

OUTPUT: {
  vehicles: [array of vehicles with aggregated pricing],
  trips: [array of leg details],
  total_amount, tax_amount, night_charge
}
```

### 5.2 What Happens When a City Isn't Covered?

**Scenario**: Delhi → Agra → Pushkar → Jaisalmer

| Leg | Source | Destination | Operational City? | Result |
|-----|--------|-------------|-------------------|--------|
| 1 | Delhi | Agra | ✅ Delhi covers both | Price calculated |
| 2 | Agra | Pushkar | ✅ Agra/Jaipur covers | Price calculated |
| 3 | Pushkar | Jaisalmer | ❌ No operational city | **ERROR** |

**Current Behavior**: Returns 424 error with message "TOD unable to operate from this city"

**Decision**: This is correct behavior. Multi One Way requires all legs to be serviceable.

### 5.3 Comparison with Round Trip Pricing

| Aspect | Round Trip | Multi One Way |
|--------|------------|---------------|
| **Base Calculation** | Per-day rate × days | Per-leg one-way rate |
| **Amenities** | price × totalDays | price × 1 (from first leg city) |
| **Driver Charges** | daily rate × days | Included in per-KM rate |
| **Min Billable KM** | min_km × days | Per-leg distance |
| **Night Charge** | Pickup time only | Per-leg (each leg's pickup) |

---

## 6. Edge Cases & Solutions

### 6.1 Operational Coverage Gaps

**Problem**: What if Trip 2's source city has no operational city coverage?

**Solution**: Already handled - validation fails with clear error message.

**Example**:
```
Trip 1: Delhi → Jaipur ✅
Trip 2: Jaipur → Timbuktu ❌ (No coverage)

Error: "Trip 2, TOD unable to operate from this city Timbuktu"
```

### 6.2 No Common Vehicles

**Problem**: What if no single vehicle type is available across all legs?

**Current Behavior**: Returns empty vehicle list.

**Proposed Enhancement**:
```javascript
if (mainVehicleList.length === 0) {
  return {
    success: false,
    code: 424,
    message: "No vehicle type available across all trip legs. Try splitting into separate bookings.",
    data: {}
  };
}
```

### 6.3 Same Day Multiple Legs

**Problem**: User books Delhi → Agra (5 hrs) + Agra → Jaipur (4 hrs) both starting at 10 AM

**Solution**: Time validation ensures Trip 2 time > Trip 1 estimated arrival

```
Trip 1: Delhi → Agra, Pickup 10:00 AM
        Estimated arrival: 3:00 PM
        
Trip 2: Agra → Jaipur
        Minimum allowed time: 3:00 PM
        User selects 2:00 PM → ERROR
        User selects 5:00 PM → ✅ OK
```

### 6.4 Leg Cancellation

**Scenario**: Customer wants to cancel Trip 2 of a 4-trip booking

**Solution** (Per client requirements):
1. Admin marks Trip 2 as cancelled in `tod_multioneway_booking`
2. Refund calculated manually by ops team
3. Master booking remains active with reduced total
4. Assignment status updated accordingly

### 6.5 Adding New Leg After Booking

**Scenario**: Customer wants to add Trip 5 to existing 4-trip booking

**Solution** (Per client requirements):
- Create new ONE WAY booking separately
- Link via notes/agent remarks
- Handle as independent booking operationally

---

## 7. Database Changes

### 7.1 Existing Schema (No Changes Needed)

**`tod_customer_booking`** (Master):
- `type = 4` for Multi One Way
- `main_booking_id = NULL` (this is the master)
- `object` contains aggregated trip data

**`tod_multioneway_booking`** (Legs):
- `customer_booking_id` → FK to master
- One row per leg
- Contains leg-specific pricing in `object`

### 7.2 Potential Enhancement (Future)

```sql
-- Add cancellation tracking per leg
ALTER TABLE tod_multioneway_booking 
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD COLUMN cancelled_by UUID REFERENCES tod_users(id),
ADD COLUMN refund_amount DECIMAL(10,3) NULL,
ADD COLUMN refund_status INTEGER DEFAULT 0; -- 0=N/A, 1=Pending, 2=Processed
```

---

## 8. API Changes

### 8.1 Existing APIs (No Changes Needed)

| Endpoint | Status |
|----------|--------|
| `GET /api/web/multi_oneway/search` | ✅ Working |
| `GET /api/web/multi_oneway/carList` | ✅ Working |
| `GET /api/web/multi_oneway/carDetails` | ✅ Working |
| `GET /api/web/multi_oneway/bookingConfirmation` | ✅ Working |

### 8.2 Validation Enhancement

**File**: `todbooking/routevalidations/multiOneway.js`

```javascript
// Change from:
multiOneway: Joi.array().min(2).items(...)

// To:
multiOneway: Joi.array().min(2).max(7).items(...)
```

### 8.3 Enhanced Response (CarList)

Add per-leg pricing breakdown:

```javascript
// In multiOneway.js model, enhance response:
{
  vehicles: [{
    vehicle_type_id: "...",
    vehicle_type_name: "Sedan",
    // Existing fields...
    
    // NEW: Per-leg breakdown
    leg_pricing: [
      { leg: 1, route: "Delhi → Agra", price: 5000, night_charge: 0 },
      { leg: 2, route: "Agra → Jaipur", price: 4500, night_charge: 300 },
      { leg: 3, route: "Jaipur → Pushkar", price: 3000, night_charge: 0 }
    ],
    
    total_price: 12500,
    total_night_charge: 300,
    tax_amount: 640,
    total_amount: 13440
  }]
}
```

---

## 9. Frontend Changes

### 9.1 Files to Modify

| File | Changes |
|------|---------|
| `todweb/components/Home/Trip.vue` | Add radio buttons, Multi One Way form |
| `todweb/pages/CarList/index.vue` | Enhance type=4 display |
| `todweb/pages/multi-one-way/index.vue` | Fix defaultTab, update marketing page |
| `todweb/pages/customer-info/index.vue` | Handle Multi One Way passenger details |
| `todweb/pages/payment/index.vue` | Show leg breakdown on payment page |

### 9.2 Trip.vue Implementation Details

```javascript
// New data properties
data() {
  return {
    tripMode: 'oneway', // 'oneway' | 'roundtrip' | 'multioneway'
    multiOnewayTrips: this.initializeMultiTrips(),
  }
},

methods: {
  initializeMultiTrips() {
    return [
      this.createEmptyTrip(),
      this.createEmptyTrip()
    ];
  },
  
  createEmptyTrip() {
    return {
      pickup: null,
      dropOff: null,
      pickupPlaceID: null,
      dropOffPlaceID: null,
      pickupDate: null,
      pickupTime: null,
      pickupSearchResult: [],
      dropOffSearchResult: [],
      isSourceEditable: true
    };
  },
  
  addTrip() {
    if (this.multiOnewayTrips.length >= 7) return;
    
    const lastTrip = this.multiOnewayTrips[this.multiOnewayTrips.length - 1];
    const newTrip = this.createEmptyTrip();
    
    // Auto-fill source from previous destination
    newTrip.pickup = lastTrip.dropOff;
    newTrip.pickupPlaceID = lastTrip.dropOffPlaceID;
    newTrip.isSourceEditable = true; // But user can edit
    
    this.multiOnewayTrips.push(newTrip);
  },
  
  removeTrip(index) {
    if (this.multiOnewayTrips.length <= 2) return;
    this.multiOnewayTrips.splice(index, 1);
  },
  
  getMinDateForTrip(index) {
    if (index === 0) return new Date();
    const prevTrip = this.multiOnewayTrips[index - 1];
    return prevTrip.pickupDate || new Date();
  },
  
  submitMultiOneway() {
    // Build query string with all trips
    const query = { type: 4 };
    this.multiOnewayTrips.forEach((trip, i) => {
      query[`pickup${i}`] = trip.pickup;
      query[`dropoff${i}`] = trip.dropOff;
      query[`pickupID${i}`] = trip.pickupPlaceID;
      query[`dropoffID${i}`] = trip.dropOffPlaceID;
      query[`date${i}`] = moment(trip.pickupDate).format('YYYY-MM-DD');
      query[`time${i}`] = moment(trip.pickupTime).format('HH:mm');
    });
    query.passengers = this.passengers;
    
    this.$router.push({ path: '/carList', query });
  }
}
```

### 9.3 CarList Type=4 Display Enhancement

```vue
<!-- Enhanced leg display in car card -->
<div v-if="type === 4" class="multi-oneway-legs">
  <h4>Trip Itinerary</h4>
  <div v-for="(leg, idx) in car.trip" :key="idx" class="leg-card">
    <div class="leg-header">
      <span class="leg-badge">Leg {{ idx + 1 }}</span>
      <span class="leg-date">{{ formatDate(leg.pickupDate) }}</span>
    </div>
    <div class="leg-route">
      <div class="leg-city">
        <strong>{{ leg.pickUp }}</strong>
        <small>{{ leg.pickUpDistrict }}</small>
      </div>
      <div class="leg-arrow">
        <i class="fa-solid fa-arrow-right"></i>
        <small>{{ leg.distance }} • {{ leg.duration }}</small>
      </div>
      <div class="leg-city">
        <strong>{{ leg.dropOff }}</strong>
        <small>{{ leg.dropOffDistrict }}</small>
      </div>
    </div>
  </div>
</div>
```

---

## 10. Admin Panel Changes

### 10.1 Existing Pages (Already Implemented)

| Page | Path | Status |
|------|------|--------|
| Multi One Way Booking View | `todop/pages/booking/booking/multi-oneway/_id.vue` | ✅ Exists |
| Booking List (Type Filter) | `todop/pages/booking/booking/index.vue` | ✅ Has type=4 filter |

### 10.2 Enhancement: Leg Cancellation UI

**Add to**: `todop/pages/booking/booking/multi-oneway/_id.vue`

```vue
<!-- Per-leg actions -->
<div v-for="(leg, idx) in booking.legs" :key="leg.id" class="leg-admin-card">
  <div class="leg-info">
    <span>Leg {{ idx + 1 }}: {{ leg.pickup }} → {{ leg.dropoff }}</span>
    <span>₹{{ leg.price }}</span>
  </div>
  <div class="leg-actions">
    <b-tag :type="leg.cancelled_at ? 'is-danger' : 'is-success'">
      {{ leg.cancelled_at ? 'Cancelled' : 'Active' }}
    </b-tag>
    <b-button 
      v-if="!leg.cancelled_at"
      size="is-small"
      type="is-danger"
      @click="cancelLeg(leg.id)"
    >
      Cancel Leg
    </b-button>
  </div>
</div>
```

---

## 11. Downstream Changes

### 11.1 Email Templates

**File**: `todapi/common/emailTemplates.js`

The existing `bookingConfirmationEmailTemplate` should already handle type=4 (verify).

**Enhancement**: Add leg-wise breakdown in email:

```html
<!-- Multi One Way specific section -->
{{#if isMultiOneway}}
<h3>Trip Itinerary</h3>
<table>
  {{#each legs}}
  <tr>
    <td>Leg {{@index + 1}}</td>
    <td>{{pickup}} → {{dropoff}}</td>
    <td>{{date}}</td>
    <td>{{distance}}</td>
  </tr>
  {{/each}}
</table>
{{/if}}
```

### 11.2 SMS Notifications

**File**: `todbooking/common/smsGateWay.js`

Verify Multi One Way booking confirmation SMS includes relevant details.

### 11.3 Assignment Flow

Multi One Way bookings should:
1. Be assigned to ONE supplier for all legs
2. Show all legs in assignment view
3. Allow assignment status update per master booking

---

## 12. Testing Plan

### 12.1 Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Submit with 1 trip | ❌ Validation error: min 2 trips |
| Submit with 8 trips | ❌ Validation error: max 7 trips |
| Trip 2 date < Trip 1 date | ❌ Validation error |
| Trip 2 time < Trip 1 arrival (same day) | ❌ Validation error |
| No operational city for leg | ❌ 424 error with city name |
| No common vehicle across legs | ❌ Empty result / 424 error |
| All valid | ✅ Vehicle list with prices |

### 12.2 Integration Tests

| Flow | Steps |
|------|-------|
| Happy Path | 3 trips → CarList → Select car → Customer info → Payment → Confirmation |
| Edit Source | Add Trip 2, edit auto-filled source → Should work |
| Remove Trip | Add Trip 3, remove Trip 2 → Should re-index |
| Admin View | View booking → See all legs → Cancel one leg |

### 12.3 E2E Tests

```
Scenario: Book Delhi → Agra → Jaipur
  Given user is on homepage
  When user selects "Multi One Way" mode
  And adds Trip 1: Delhi → Agra, Jan 15, 10:00 AM
  And adds Trip 2: Agra → Jaipur, Jan 15, 5:00 PM
  And clicks "Find Best Deals"
  Then user sees car list with 2 legs displayed
  And prices are sum of both legs
```

---

## 13. Progress Tracker

### Phase 1: Frontend Radio Buttons ✅ COMPLETED (Dec 8, 2025)
- [x] Replace checkbox with radio buttons in Trip.vue
- [x] Update `isRoundTrip` logic to use `tripMode` computed property
- [x] Test One Way mode works as before ✅
- [x] Test Round Trip mode works as before ✅
- [x] Test Multi One Way mode switches correctly ✅

**Implementation Details:**
- Added `tripMode` data property: `'oneway' | 'roundtrip' | 'multioneway'`
- Added computed properties: `isRoundTrip`, `isMultiOneway`, `isOneway`
- Added `tripModeTitle` and `tripModeDescription` for dynamic UI text
- Radio buttons styled with icons: arrow-right, repeat, route

### Phase 2: Multi One Way Form ✅ COMPLETED (Dec 8, 2025)
- [x] Implement dynamic trip rows (starts with 2, expandable to 7)
- [x] Implement add/remove trip logic with max 7 limit
- [x] Implement source auto-fill from previous destination
- [x] Add `isSourceEditable` for editing auto-filled sources
- [x] Implement date/time validation (frontend min-date/min-time)
- [x] Implement max 7 trips limit (frontend) with toast notification
- [x] Trip badge styling with trip numbers

**Implementation Details:**
- Multi One Way form integrated into One Way tab (not a separate tab)
- Each trip row shows: Source, Destination, Date, Time
- Passengers field only on Trip 1 (applies to all legs)
- Delete button visible on Trip 3+ only
- "Add Trip N" button shows trip number being added
- Maximum 7 trips enforced with user-friendly message

### Phase 3: Backend Validation ✅ COMPLETED (Dec 8, 2025)
- [x] Add max 7 trips validation in `routevalidations/multiOneway.js`
- [x] Both `getCarsSchema` and booking schema updated with `.max(7)`
- [ ] Enhanced arrival time validation (future: requires architecture change)

**Implementation Details:**
- Added `.max(7)` to both Joi array schemas
- Frontend already handles date ordering via `getMultiOnewayMinDate` and `getMultiOnewayMinPickupTime`
- Complex arrival time validation (trip N+1 >= trip N + duration) deferred - requires Google Maps duration data

### Phase 4: CarList Integration ✅ COMPLETED (Dec 8, 2025)
- [x] Verify type=4 handling works
- [x] Replace hardcoded trip display with dynamic rendering
- [x] Add `getLocationShortName` helper method
- [ ] Test vehicle intersection logic (requires live testing)

**Implementation Details:**
- Replaced hardcoded trip display section with dynamic v-for loop
- Trip display now uses `multiOneway` array data
- Shows pickup time, location, date, duration, dropoff info, and trip number badge
- Uses settings for 12/24 hour time format

### Phase 5: Payment & Booking ✅ VERIFIED (Dec 8, 2025)
- [x] customer-info page handles type=4 via `getTripType()` method
- [x] payment page has extensive type=4 handling (9+ switch cases)
- [x] Multi-oneway data structure properly populated from URL params
- [ ] Verify booking confirmation email (requires live testing)

**Verification Details:**
- `customer-info/index.vue`: Returns "Multi One Way Trip" for tripType=4
- `payment/index.vue`: Has multi-oneway handling in multiple methods
- Both pages reuse the `multiOneway` array data structure

### Phase 6: Admin Panel ✅ VERIFIED (Dec 8, 2025)
- [x] Admin can view multi-oneway bookings via `todop/pages/booking/booking/multi-oneway/_id.vue`
- [x] Individual trip legs displayed in table format
- [x] Status management via dropdown (pending/confirmed/cancelled)
- [x] Cancellation handled via booking status change + manual refund (per client)

**Verification Details:**
- Dedicated admin page exists for multi-oneway bookings (5000+ lines)
- Shows: Reference ID, Payment Status, Pickup Date, Vehicle, Locations, Status, Assignment, Amount
- Status options include 'cancelled' (value: 2) and 'Cancel Requested'
- Per client: "ops team shall share the refund manually" - no automated refund logic needed
- Future Enhancement: Add per-leg delete button if granular control needed

### Phase 7: Testing & QA ✅ VERIFIED (Dec 8, 2025)

#### Frontend UI Testing ✅
- [x] Radio buttons: One Way, Round Trip, Multi One Way working
- [x] Dynamic title/description changes when selecting "Multi One Way"
- [x] Trip badge showing trip numbers
- [x] "Add Trip 3" button visible and positioned correctly
- [x] Trip 2 has edit button for source field (auto-fill from Trip 1 destination)
- [x] "Find Best Deals" submit button functional

#### Backend API Testing ✅ (21/21 tests passed)
**Search Endpoint:**
- [x] Search returns places correctly (delhi, agra, jaipur)
- [x] Empty/invalid searches handled gracefully

**CarList Validation:**
- [x] Minimum 2 trips enforced
- [x] Maximum 7 trips enforced
- [x] Past date rejected ("Book only for future dates")
- [x] Invalid place ID rejected ("Place not found")
- [x] 0 passengers rejected ("must be >= 1")

**Response Structure:**
- [x] Vehicle pricing (price, tax, total_amount)
- [x] Trip details (pickUp, dropOff, distance, duration)
- [x] Fleet info (passengers, bags, amenities)

**Performance:**
- [x] Search avg: 0.07s
- [x] CarList avg: 0.42s

**See:** [BACKEND_TEST_RESULTS.md](./BACKEND_TEST_RESULTS.md) for detailed test report

#### Remaining
- [ ] Full E2E booking flow (requires valid route data)
- [ ] UAT with client

---

## Appendix

### A. Reference Screenshots

- cheapOair Multi-City UI (attached in conversation)
- Current TravelODesk One Way UI (attached in conversation)
- Current TravelODesk Round Trip UI (attached in conversation)

### B. Related Documents

- [TRIP_TYPES_REFERENCE.md](./TRIP_TYPES_REFERENCE.md) - Comprehensive trip types documentation
- [RATE_LOGIC.md](../RATE_LOGIC.md) - Rate calculation issues and solutions

### C. Key Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 7, 2025 | Max 7 trips | Client requirement |
| Dec 7, 2025 | Radio buttons over tabs | Better UX, unified search pattern |
| Dec 7, 2025 | Keep backend as-is | Already well implemented |
| Dec 7, 2025 | Manual refund for leg cancellation | Per client requirement |

---

*Document maintained as part of Multi One Way feature development.*
