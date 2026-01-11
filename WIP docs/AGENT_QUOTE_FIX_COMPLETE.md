# Agent Quote Functionality Fix - Complete Documentation

## Date: December 1, 2025

---

## Original Client Feedback

> "Agent means -- sales cum customer support team members, they can check fare but they can't send quote with proper rates, proper details and complete correct information about the price they are going to quote. If we add 2 vehicles, no information goes to the passenger, email format is incomplete and incorrect.
>
> Editing while sending quote shall be allowed in the price"

---

## Problems Identified

### Problem 1: Multiple Vehicles (Quantity) Not Shown in Quote Email

- When agent selected 2+ vehicles, the quote email didn't show this information
- Customer received email with no indication of how many vehicles were quoted
- Pricing breakdown was unclear for multiple vehicles

### Problem 2: Incomplete Email Information

- Quote emails were missing passenger details
- No breakdown of extra charges (toll, parking, driver allowance, night charges)
- Per-vehicle fare not shown when quantity > 1

### Problem 3: No Price Editing Before Sending Quote

- Agents couldn't modify pricing in the quote before sending
- Had to accept system-calculated prices with no flexibility
- No way to adjust for special cases or negotiations

### Problem 4: Confusing UI/UX Issues

- "Send Quote" button didn't actually send quote - it just expanded the form
- "Book Now" button also just expanded the form
- Redundant "Submit" button at bottom was confusing
- "Select Fleet" label was misleading - it actually meant "Customize/Expand"

---

## Solution Implementation

### Repositories Changed

| Repository                   | Files Modified                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **todop** (Admin Panel)      | `pages/booking/booking/_id.vue`, `pages/booking/booking/multi-oneway/_id.vue`                                                                                              |
| **todbooking** (Booking API) | `common/emailTemplates.js`, `model/adminOnewayTrip.js`, `model/adminAirportTrip.js`, `model/adminLocalTrip.js`, `model/adminRoundTrip.js`, `model/adminMultiOnewayTrip.js` |

---

## Detailed Changes

### 1. Email Template Enhancement (`todbooking/common/emailTemplates.js`)

**Added support for:**

- Quantity display: `(X vehicles)` shown in trip type
- Vehicle type with quantity: `Standard x 3` instead of just `Standard`
- Passenger information section (name, email, phone)
- Per-vehicle fare breakdown when quantity > 1
- Extra charges breakdown (toll, parking, driver allowance, night charges)

**Code Added:**

```javascript
// Handle quantity (multiple vehicles) display
const quantity = parseInt(data.quantity) || 1;
const quantityText = quantity > 1 ? ` (${quantity} vehicles)` : "";

// Build vehicle info with quantity
const vehicleTypeWithQuantity =
  quantity > 1 ? `${data.vehicle_type} x ${quantity}` : data.vehicle_type;

// Build passenger information if available
let passengerInfo = "";
if (data.passenger_name || data.passenger_email || data.passenger_phone) {
  // ... generates HTML rows for passenger details
}

// Build detailed pricing breakdown for multiple vehicles
let pricingBreakdown = "";
if (quantity > 1 && data.per_vehicle_fare) {
  // ... generates HTML rows for per-vehicle fare and count
}

// Build extra charges breakdown if available
let extraChargesBreakdown = "";
// ... generates HTML rows for toll, parking, driver allowance, night charges
```

**New Template Variables:**
| Variable | Description |
|----------|-------------|
| `{{quantity}}` | Number of vehicles |
| `{{per_vehicle_fare}}` | Fare per single vehicle |
| `{{passenger_info}}` | HTML block with passenger details |
| `{{pricing_breakdown}}` | HTML block with multi-vehicle pricing |
| `{{extra_charges_breakdown}}` | HTML block with extra charges |
| `{{customer_name}}` | Customer's full name |
| `{{passenger_name}}` | Passenger's name (if different) |

---

### 2. Backend Model Updates

**Files Updated:**

- `model/adminOnewayTrip.js`
- `model/adminAirportTrip.js`
- `model/adminLocalTrip.js`
- `model/adminRoundTrip.js`
- `model/adminMultiOnewayTrip.js`

**Changes Made to Each:**
All `quotaDetailsEmailTemplate()` calls now pass additional data:

```javascript
let { emailBody, emailSubject } = await quotaDetailsEmailTemplate({
  ...req.query,
  trip_type: "OneWay Trip", // or Airport Transfer, Local Trip, etc.
  // ... existing fields ...

  // NEW: Additional fields for quantity and pricing breakdown
  quantity: quantity,
  per_vehicle_fare: perVehicleFare,
  customer_name: emailtoaddress.first_name
    ? `${emailtoaddress.first_name} ${emailtoaddress.last_name || ""}`.trim()
    : "",
  passenger_name: req.body.passenger_name || "",
  passenger_email: req.body.passenger_email || "",
  passenger_phone: req.body.passenger_phone || "",
  // Extra charges breakdown
  toll_charges: vehiclesDetails.toll_charges_text || "",
  parking_charges: vehiclesDetails.parking_charges_text || "",
  driver_allowance: vehiclesDetails.driver_allowance_text || "",
  night_charges: vehiclesDetails.night_charge_text || "",
});
```

---

### 3. Frontend Fixes (`todop/pages/booking/booking/_id.vue`)

#### A. Fixed Send Quote Button

**Before:** Clicking "Send Quote" just expanded the form (called `selectVehicle`)
**After:** Clicking "Send Quote" actually sends the quote (calls `sendQuote`)

```diff
- <b-button @click="selectVehicle(car, car.vehicle_type_id, 1)">Send Quote</b-button>
+ <b-button @click="sendQuote(car)">Send Quote</b-button>
```

#### B. Fixed Book Now Button

**Before:** Clicking "Book Now" just expanded the form
**After:** Clicking "Book Now" creates a booking (calls `validateBeforeSubmit`)

```diff
- <b-button @click="selectVehicle(car, car.vehicle_type_id)">Book Now</b-button>
+ <b-button @click="validateBeforeSubmit(car.vehicle_type_id)">Book Now</b-button>
```

#### C. Renamed "Select Fleet" to "Customize"

**Before:** Label said "Select Fleet" which was confusing
**After:** Label says "Customize" - clearer that it expands to show pricing details

```diff
- >Select Fleet</span>
+ >Customize</span>
```

#### D. Removed Redundant Submit Button

**Before:** There was a Submit button at the bottom that duplicated per-car buttons
**After:** Submit button hidden when cars are shown; only Cancel button remains

```diff
+ v-show="!carsList || !carsList.length"
  class="is-flex big-button..."
>
  <b-button @click="$router.go(-1)">Cancel</b-button>
- <b-button @click="validateBeforeSubmit(booking.vehicleTypeId)">Submit</b-button>
</div>
```

#### E. Fixed sendQuote Function to Work Without Customize

**Before:** `sendQuote` required `carDetails` to be populated (only available after clicking Customize)
**After:** `sendQuote` works with either expanded `carDetails` OR the car object from the list

```javascript
// Use carDetails if available (expanded view), otherwise use vehicle from list
const vehicleData =
  context.carDetails && context.carDetails.id ? context.carDetails : vehicle;
```

#### F. Added Price Editing Section in Quote Preview Modal

New UI section added to email template modal allowing agents to edit:

- Base Fare
- Tax Amount
- Total Amount
- Number of Vehicles (if quantity > 1)
- Extra KM Rate

With "Update Email with New Prices" button that replaces values in the email body.

**New Data Properties:**

```javascript
formProps: {
  subject: null,
  body: null,
  email: null,
  // NEW: Editable price fields for quote
  editableBaseFare: null,
  editableTaxAmount: null,
  editableTotalAmount: null,
  editableQuantity: null,
  editableExtraKmRate: null,
  originalBaseFare: null,
  originalTaxAmount: null,
  originalTotalAmount: null,
}
```

**New Method: `updateQuoteEmailWithPrices()`**

- Finds original price values in email HTML
- Replaces them with new values entered by agent
- Shows success toast notification

#### G. Price Fields Now Populated from API Response

**Before:** Tried to use `context.carDetails` which was empty when clicking directly
**After:** Uses `response.result.vehiclesDetails` from the API response

```javascript
// Initialize editable price fields from API response (vehiclesDetails)
const vehicleInfo = response.result.vehiclesDetails || vehicleData || {};
context.formProps.editableBaseFare =
  vehicleInfo.sub_total || vehicleInfo.price || null;
context.formProps.editableTaxAmount = vehicleInfo.tax_amount || null;
context.formProps.editableTotalAmount = vehicleInfo.total_amount || null;
```

#### H. TinyMCE Editor Height Fix

**Before:** Email body editor was vertically squeezed
**After:** Increased height with CSS overrides

```css
::v-deep .tox-tinymce {
  min-height: 1000px !important;
  height: 1000px !important;
}
::v-deep .tox-editor-container {
  min-height: 900px !important;
}
::v-deep .tox-edit-area {
  min-height: 800px !important;
}
::v-deep .tox-edit-area__iframe {
  min-height: 700px !important;
}
```

---

### 4. Multi One-Way Trip Fixes (`todop/pages/booking/booking/multi-oneway/_id.vue`)

Similar changes for multi-trip bookings:

- Added price editing section (Total Amount only for multi-trips)
- Added `updateMultiQuoteEmailWithPrices()` method
- Initialize editable amounts from API response

---

## User Flow After Fix

### Sending a Quote (New Flow)

1. Agent fills in trip details (pickup, drop, date, time, customer info)
2. Agent clicks **"Get Price"** → Car list appears with prices
3. Agent adjusts **Quantity** if multiple vehicles needed
4. **Option A - Quick Send:**

   - Agent clicks **"Send Quote"** on desired car
   - Quote preview modal opens with prices populated
   - Agent can optionally edit prices in "Edit Quote Pricing" section
   - Click **"Update Email with New Prices"** if changes made
   - Click **"Send"** to send email to customer

5. **Option B - Customize First:**
   - Agent clicks **"Customize"** checkbox to expand car details
   - Agent can modify Base fare, apply coupons, add services
   - Agent clicks **"Send Quote"** (in expanded view)
   - Quote preview modal opens
   - Continue as Option A

### What Customer Receives

For 2 vehicles booking, email now shows:

- Trip Type: `OneWay Trip (2 vehicles)`
- Vehicle Type: `Standard x 2`
- Per Vehicle Fare: `₹1516.00`
- Number of Vehicles: `2`
- Base Fare: `₹3032.00`
- GST 5%: `₹151.60`
- Total Amount: `₹3183.60`
- Passenger Name, Email, Phone (if provided)
- Extra charges breakdown (toll, parking, etc.)

---

## Testing Checklist

### Quote Email Content

- [ ] Single vehicle quote shows correct pricing
- [ ] Multiple vehicles (quantity > 1) shows vehicle count in email
- [ ] "Vehicle Type x N" format displays correctly
- [ ] Per-vehicle fare shown when quantity > 1
- [ ] Passenger information appears in email
- [ ] Extra charges breakdown appears if applicable

### UI/UX

- [ ] "Send Quote" button sends quote (not just expands)
- [ ] "Book Now" button creates booking (not just expands)
- [ ] "Customize" checkbox expands car details
- [ ] Submit button hidden when cars are showing
- [ ] Cancel button still works

### Price Editing

- [ ] Price editing section appears in quote preview modal
- [ ] Fields populated with correct values from API
- [ ] "Update Email with New Prices" updates email body
- [ ] Multiple edits work correctly
- [ ] Toast notification confirms update

### Email Editor

- [ ] TinyMCE editor is properly sized (not squeezed)
- [ ] Menubar is visible (File, Edit, View, etc.)
- [ ] Content scrollable within editor

### Trip Types

- [ ] Airport Transfer quotes work
- [ ] One-way Trip quotes work
- [ ] Local Trip quotes work
- [ ] Round Trip quotes work
- [ ] Multi One-Way Trip quotes work

---

## Files Summary

| File Path                                          | Type of Change                           |
| -------------------------------------------------- | ---------------------------------------- |
| `todop/pages/booking/booking/_id.vue`              | UI fixes, sendQuote logic, price editing |
| `todop/pages/booking/booking/multi-oneway/_id.vue` | Price editing for multi-trips            |
| `todbooking/common/emailTemplates.js`              | Email template with quantity support     |
| `todbooking/model/adminOnewayTrip.js`              | Pass additional data to email template   |
| `todbooking/model/adminAirportTrip.js`             | Pass additional data to email template   |
| `todbooking/model/adminLocalTrip.js`               | Pass additional data to email template   |
| `todbooking/model/adminRoundTrip.js`               | Pass additional data to email template   |
| `todbooking/model/adminMultiOnewayTrip.js`         | Pass additional data to email template   |

---

## Deployment Notes

1. Deploy `todbooking` first (backend changes)
2. Then deploy `todop` (frontend changes)
3. No database migrations required
4. No environment variable changes required

---

## Related Documentation

- `WIP/HOW_CAR_BOOKING_WORKS.md` - Overall booking system documentation
- `WIP/PROJECT_OVERVIEW.md` - Project architecture

---

_Document created: December 1, 2025_
_Author: AI Assistant (GitHub Copilot)_
