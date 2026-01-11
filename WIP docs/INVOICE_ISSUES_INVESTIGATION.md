# Invoice Issues Investigation

## Overview

Investigation of issues found in the tax invoice generated for booking TODA0003 (Delhi to Agra, 12-11-2025).

---

## Issues Found

### 🔴 Issue #1: Extra City "Madurai" in Billing Address

**Problem**: The invoice shows:

```
Bill To
Demo Customer
7530088602
Delhi
Madurai        ← ❌ This should NOT be here
625001
```

**Expected**: Should only show the trip pickup location (Delhi), not customer's personal address.

**Root Cause**: The invoice template is pulling customer's personal address from the `tod_customers` table:

**Code Location**: `todbooking/model/payment.js` lines 868-873

```javascript
`${process.env.TOD_CUSTOMERS}.address1`,      // = "Delhi"
`${process.env.TOD_CUSTOMERS}.address2`,      // = NULL
`${process.env.TOD_CUSTOMERS}.location`,      // = NULL
`${process.env.TOD_CUSTOMERS}.country`,       // = NULL
`${process.env.TOD_CUSTOMERS}.state`,         // = NULL
`${process.env.TOD_CUSTOMERS}.city`,          // = "Madurai" ← The problem!
`${process.env.TOD_CUSTOMERS}.postal_code`,   // = "625001"
```

**Template Location**: `todbooking/pdfTemplate/otherTrip.html` lines 239-250

```html
<p>
  {{customer_mobile_number}}<br />
  {{address1}}<br />
  <!-- Delhi -->
  {{#if address2}} {{address2}}<br />
  {{/if}} {{#if location}} {{location}}<br />
  {{/if}} {{city}}<br />
  <!-- Madurai ← Problem! -->
  {{postal_code}}<br />
  <!-- 625001 -->
</p>
```

**Analysis**:

- "Demo Customer" is a test customer whose personal address is in Madurai (postal code 625001)
- The booking is from Delhi to Agra
- The invoice is mixing customer's personal billing address with trip details
- This creates confusion - it looks like the trip involves Madurai when it doesn't

**Design Question**:

- Should the invoice show the customer's billing address (Madurai) OR the trip pickup location (Delhi)?
- For car rental invoices, the "Bill To" address typically should be the customer's actual billing address
- But if that's different from the trip location, it creates confusion

**Possible Solutions**:

1. **Option A**: Show only customer's billing address (Madurai) - but then "Place of Supply" should clarify it's Delhi
2. **Option B**: Show only trip location (Delhi) - but then we lose customer's actual address
3. **Option C**: Show both clearly labeled:

   ```
   Bill To:
   Demo Customer
   Billing Address: Madurai, Tamil Nadu 625001

   Trip Details:
   From: Delhi, India
   To: Agra, Uttar Pradesh, India
   ```

---

### 🔴 Issue #2: Redundant Date in "Item & Description" Column

**Problem**: The table shows:

```
Item & Description
Date: 12-11-2025        ← ❌ Redundant! Invoice Date already shown at top
Pax Name: Demo Customer
```

**Invoice header already shows**:

```
Invoice Date: 12-11-2025  ← Already displayed
```

**Root Cause**: Template hardcodes the date in the item description.

**Code Location**: `todbooking/pdfTemplate/otherTrip.html` lines 302-307

```html
<td>
  {{this.pickUp}}
  <div>
    <!-- <p>Date: {{date}}</p> -->
    <p>Date: {{created_at}}</p>
    ← ❌ Redundant!
    <p>Pax Name - {{customer_name}}</p>
  </div>
</td>
```

**Analysis**:

- The invoice date is already prominently displayed in the header (Invoice Date: 12-11-2025)
- Showing it again in the item description is redundant
- This takes up valuable space that could be used for more useful information

**Possible Solutions**:

1. **Remove the date line entirely** - it's already in the header
2. **Replace with pickup date/time** - show when the trip actually happens (if different from invoice date)
3. **Show trip details** - pickup time, duration, distance, etc.

**Better Alternative for Item & Description**:

```
Item & Description
Trip: Delhi to Agra
Pickup: 13-11-2025 at 05:30 AM
Duration: 3 hours 53 mins
Distance: 232 km
Pax Name: Demo Customer
Passengers: 3
```

---

### 🔴 Issue #3: "Qty" Column Shows 9 (Confusing Value)

**Problem**: The "Qty" column shows **9**, but the booking has **3 passengers**.

**What is "9"?**

- Looking at the database: `object.list_order = 9`
- `list_order` is a field from `tod_vehicle_types` table
- It's used for **sorting vehicles in a display list**, NOT quantity!

**Code Location**: `todbooking/pdfTemplate/otherTrip.html` line 319

```html
<td>{{object.list_order}}</td>
← ❌ Wrong field!
```

**Database Check**:

```sql
SELECT id, vehicle_type, list_order FROM tod_vehicle_types LIMIT 5;

vehicle_type         | list_order
---------------------+-----------
People Carrier       |     1
Large People Carrier |     2
Minibus              |     3
Premium              |     4
Super Luxury         |     5
```

So `list_order = 9` just means this vehicle type is 9th in the display order.

**Booking Object** (TODA0003):

```json
{
  "list_order": 9,              ← This is the problem!
  "fleet": {
    "no_of_passengers": 3,      ← This is what should be shown!
    "vehicle_type_id_name": "People Carrier"
  }
}
```

**Analysis**:

- The invoice is showing a meaningless internal sorting number (9)
- Should show something meaningful to the customer:
  - Number of passengers: 3
  - Number of vehicles booked: 1
  - Or even just remove the column if not needed

**What Should "Qty" Show?**

- **Option A**: Number of passengers (`object.fleet.no_of_passengers` = 3)
- **Option B**: Number of vehicles (typically 1 for single bookings)
- **Option C**: Quantity of trips (typically 1, unless multi-trip booking)
- **Option D**: Remove the column entirely if not meaningful

**For this booking**:

- Passengers: 3
- Vehicles: 1
- Most logical: Show 1 (one trip/service) or 3 (passengers)

---

### 🟡 Issue #4: Subject Line Formatting

**Current**:

```
Subject:
Car Rental Reservation- Delhi, India - Agra, Uttar Pradesh, India
```

**Observations**:

- Extra space after "Reservation-"
- Inconsistent city format: "Delhi, India" vs "Agra, Uttar Pradesh, India"
- Delhi should also show state for consistency

**Code Location**: `todbooking/pdfTemplate/otherTrip.html` lines 259-267

```html
<h6>Subject:</h6>
<h6>
  Car Rental Reservation- {{pickup_location_place_name}} {{#if
  dropoff_location_place_name}}<span> - {{dropoff_location_place_name}}</span>
  {{/if}}
</h6>
```

**Database Values**:

- `pickup_location_place_name` = "Delhi, India"
- `dropoff_location_place_name` = "Agra, Uttar Pradesh, India"

**Minor Issue**: Inconsistent formatting between source and destination.

**Suggested Format**:

```
Subject:
Car Rental Reservation - Delhi, Delhi NCR, India to Agra, Uttar Pradesh, India
```

OR

```
Subject:
One Way Trip - Delhi to Agra (232 km)
```

---

### 🟢 Issue #5: Missing Pickup Date/Time in Invoice

**Problem**: The invoice doesn't show when the trip is scheduled!

**What's Missing**:

- Pickup Date: 13-11-2025
- Pickup Time: 05:30 AM
- Duration: 3 hours 53 mins

**Current Invoice Shows**:

- Invoice Date: 12-11-2025 (when booking was created)
- But NOT when the trip actually happens!

**This is Critical Information** that should be on the invoice:

- Customer needs to know when their trip is
- Driver needs to know pickup time
- Admin needs to verify scheduling

**Suggested Addition**:

```
Trip Details:
Date: 12-11-2025            ← Existing (Invoice/Booking Date)
Pickup Date: 13-11-2025     ← MISSING! Should be added
Pickup Time: 05:30 AM       ← MISSING! Should be added
Pax Name: Demo Customer
```

---

## Summary of Issues

| #   | Issue                                                | Severity  | Impact                                       |
| --- | ---------------------------------------------------- | --------- | -------------------------------------------- |
| 1   | Extra city "Madurai" in billing address              | 🔴 High   | Confusing - looks like trip involves Madurai |
| 2   | Redundant date in item description                   | 🟡 Medium | Wastes space, looks unprofessional           |
| 3   | Qty shows "9" (list_order instead of meaningful qty) | 🔴 High   | Meaningless number to customer               |
| 4   | Inconsistent city formatting in subject              | 🟢 Low    | Minor cosmetic issue                         |
| 5   | Missing pickup date/time                             | 🔴 High   | Critical trip info not shown                 |

---

## Recommended Changes

### 1. Fix Billing Address Issue

**Current Template** (`otherTrip.html` lines 239-250):

```html
<p>
  {{customer_mobile_number}}<br />
  {{address1}}<br />
  {{#if address2}} {{address2}}<br />
  {{/if}} {{#if location}} {{location}}<br />
  {{/if}} {{city}}<br />
  ← Remove this {{postal_code}}<br />
  ← Remove this
</p>
```

**Option A - Show Only Trip Location**:

```html
<p>
  {{customer_mobile_number}}<br />
  {{pickup_location_place_name}}<br />
</p>
```

**Option B - Show Full Billing Address (Better for invoices)**:

```html
<p>
  {{customer_mobile_number}}<br />
  {{#if address1}}{{address1}}, {{/if}} {{#if city}}{{city}}, {{/if}} {{#if
  state}}{{state}} {{/if}} {{#if postal_code}}{{postal_code}}{{/if}}<br />
  {{#if country}}{{country}}{{/if}}
</p>
```

**Option C - Show Both Clearly (Recommended)**:

```html
<p>
  {{customer_mobile_number}}<br />
  {{#if city}}
  <strong>Billing Address:</strong><br />
  {{#if address1}}{{address1}}, {{/if}} {{city}}, {{#if state}}{{state}}
  {{/if}}{{postal_code}}<br />
  {{/if}}
  <strong>Trip From:</strong> {{pickup_location_place_name}}
</p>
```

### 2. Fix Item & Description Column

**Remove redundant date, add meaningful trip details**:

```html
<td>
  <strong>{{object.trip_type}}</strong> - {{pickup_location_place_name}} to
  {{dropoff_location_place_name}}<br />
  <small>
    Pickup: {{pickup_date}} at {{pickup_time}}<br />
    Duration: {{object.duration}}, Distance: {{object.distance}}<br />
    Pax Name: {{customer_name}} ({{object.fleet.no_of_passengers}} passengers)
  </small>
  {{#if extras}}
  <div style="margin: 1.2rem 0">
    {{#each extras}}
    <p>{{this.label}}- {{../currency_symbol}}{{this.tod_amount}}</p>
    {{/each}}
  </div>
  {{/if}}
</td>
```

### 3. Fix Qty Column

**Replace list_order with meaningful quantity**:

```html
<!-- Option A: Number of vehicles (typically 1) -->
<td>1</td>

<!-- Option B: Number of passengers -->
<td>{{object.fleet.no_of_passengers}}</td>

<!-- Option C: Quantity of trips (for multi-trip) -->
<td>{{#if object.quantity}}{{object.quantity}}{{else}}1{{/if}}</td>
```

**Most Logical**: Show "1" (one service/trip booked) because:

- Qty in invoices typically means "how many units of this service"
- For a trip, it's 1 trip
- Passengers are already mentioned in description

### 4. Add Pickup Date/Time

**Update data preparation** in `todbooking/model/payment.js`:

```javascript
let data = {
  ...result,
  ...settingResult.rows[0],
  transactionDetails: transactionQueryResult,
  created_at: moment(result.created_at).format("DD-MM-YYYY"),
  pickup_date: moment(result.pickup_date).format("DD-MM-YYYY"),          // ADD THIS
  pickup_time: moment(result.pickup_date).format("hh:mm A"),             // ADD THIS
  // ... rest of the code
```

### 5. Improve Subject Line

**Add space and make consistent**:

```html
<h6>
  Car Rental Reservation - {{pickup_location_place_name}} {{#if
  dropoff_location_place_name}} to {{dropoff_location_place_name}} {{/if}}
</h6>
```

---

## Data Fields Available

From the database query results, we have access to:

### Customer Data

- `customer_name` - "Demo Customer"
- `customer_mobile_number` - "7530088602"
- `address1`, `address2`, `location` - Customer address fields
- `city` - "Madurai" (customer's city)
- `postal_code` - "625001"
- `country`, `state` - Customer location

### Booking Data

- `refid` - "TODA0003"
- `pickup_location_place_name` - "Delhi, India"
- `dropoff_location_place_name` - "Agra, Uttar Pradesh, India"
- `created_at` - Invoice/booking creation date
- `pickup_date` - When trip happens (MISSING from current invoice!)
- `total_amount`, `sub_total`, `tax_amount` - Pricing
- `currency_symbol` - "₹"

### Object Data (JSON field)

- `object.trip_type` - "One Way Trip"
- `object.distance` - "232 km"
- `object.duration` - "3 hours 53 mins"
- `object.fleet.vehicle_name` - "Maruti (Swift Dzire)"
- `object.fleet.vehicle_type_id_name` - "People Carrier"
- `object.fleet.no_of_passengers` - 3
- `object.fleet.no_of_bags` - 3
- `object.list_order` - 9 (WRONG field for Qty!)
- `object.tax_percentage` - 5
- `object.price_in_words` - "four thousand, seven hundred twenty-five"

---

## Testing Checklist

After making changes, test with:

1. **Regular Booking** (like TODA0003):

   - ✅ Billing address shows correctly
   - ✅ No redundant date in description
   - ✅ Qty shows meaningful value (1 or passenger count)
   - ✅ Pickup date/time clearly shown
   - ✅ Trip details are clear

2. **Multi-Trip Booking**:

   - ✅ Check if Qty should show number of trips
   - ✅ Verify all trips are listed

3. **Customer with Same Address as Trip**:

   - ✅ No confusion when billing address = trip location

4. **Customer with Different Address**:

   - ✅ Clear distinction between billing address and trip location

5. **Bookings with Extras**:
   - ✅ Extra charges display correctly
   - ✅ Don't interfere with trip details

---

## Files to Modify

1. **Template File**: `todbooking/pdfTemplate/otherTrip.html`

   - Fix billing address display (lines 239-250)
   - Fix item description (lines 302-307)
   - Fix Qty column (line 319)
   - Improve subject line (lines 259-267)

2. **Data Preparation**: `todbooking/model/payment.js`

   - Add pickup_date and pickup_time formatting (around line 1270)
   - Ensure all necessary fields are passed to template

3. **Multi-Trip Template**: `todbooking/pdfTemplate/multiOneWay.html`
   - Check if same issues exist
   - Apply same fixes

---

## Questions for Business Team

1. **Billing Address**: Should invoices show:

   - Customer's actual billing address (even if different from trip location)?
   - OR just the trip location?
   - OR both clearly separated?

2. **Qty Column**: What should this represent?

   - Number of vehicles (typically 1)?
   - Number of passengers?
   - Number of trips (for multi-trip)?
   - Or remove it entirely?

3. **Item Description**: What information is most important?

   - Current: Date (redundant) + Pax Name
   - Suggested: Pickup Date/Time + Duration + Distance + Pax Name

4. **Invoice Date vs Pickup Date**:
   - Should the main "Invoice Date" be booking creation date or trip date?
   - Or show both clearly labeled?

---

**Next Steps**:

1. Review findings with team
2. Get approval on recommended changes
3. Implement fixes
4. Test with various booking scenarios
5. Update multi-trip template similarly
