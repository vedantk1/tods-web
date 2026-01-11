# Booking Status Analysis

## Overview

This document explains the booking status system in TravelODesk, clarifying the confusion around "Payment Status" vs "Status" columns and the behavior when payments are cancelled.

---

## Database Schema

The `tod_customer_booking` table has **5 different status fields**:

- `payment_status` - Whether payment has been received (0=Unpaid, 1=Paid)
- `status` - Booking lifecycle state (0=Pending, 1=Completed, 2=Cancelled, 3=Cancel Requested)
- `booking_status` - Purpose unclear (requires further investigation)
- `assignment_status` - Driver/vehicle assignment state (default: 1)
- `settlement_status` - Payment settlement to supplier (default: 1)

---

## The Two Main Status Fields Explained

### 1. Payment Status (`payment_status`)

**Purpose**: Tracks whether the customer has paid for the booking

**Values**:

- `0` - Unpaid (payment pending or failed)
- `1` - Paid (payment confirmed)

**When it's set**:

- Set to `1` when:
  - Customer pays via wallet
  - Customer pays via credit points
  - Razorpay confirms payment success
- Remains `0` when:
  - Payment is pending
  - Payment failed
  - Payment was cancelled

**Code Location**:

- `todbooking/model/adminOnewayTrip.js` lines 5350-5550
- Updated after booking creation based on payment method

---

### 2. Status (`status`)

**Purpose**: Tracks the operational/fulfillment state of the trip

**Values**:

- `0` - Pending (trip is upcoming or in progress)
- `1` - Completed (trip has been finished)
- `2` - Cancelled (trip was cancelled)
- `3` - Cancel Requested (customer requested cancellation, pending approval)

**When it's set**:

- Default: `0` when booking is created
- Should update to `1` when trip is completed (driver confirms, admin marks complete, etc.)
- Updates to `2` or `3` when booking is cancelled

**Code Location**:

- Initial value set in `todbooking/model/adminOnewayTrip.js` line 5150
- Display logic in `todweb/pages/customer-info/index.vue` lines 977-994

---

## Why "Status" Shows "Pending" for Paid Bookings

### This is CORRECT and EXPECTED behavior!

**Explanation**:

- **Payment Status** = Financial state (has money been received?)
- **Status** = Trip fulfillment state (has trip happened yet?)

**Example Scenarios**:

| Payment Status | Status    | Meaning                         |
| -------------- | --------- | ------------------------------- |
| Paid           | Pending   | Customer paid, trip is upcoming |
| Paid           | Completed | Customer paid, trip finished    |
| Unpaid         | Pending   | No payment, trip scheduled      |
| Unpaid         | Cancelled | No payment, trip cancelled      |

**Timeline Example**:

1. Customer books trip → `payment_status=1` (Paid), `status=0` (Pending)
2. Customer takes trip next week → Still `status=0` (Pending)
3. Trip happens and driver completes → `status=1` (Completed)

---

## Critical Issue: Bookings Created Before Payment

### Current Behavior

**The Problem**: Bookings are created EVEN when payment is cancelled

**Flow Analysis** (from `todbooking/model/adminOnewayTrip.js`):

```
1. Lines 5100-5200: Booking record is CREATED in database
   - Reference ID generated (TODA0001, TODA0002, etc.)
   - Default values: status=0 (Pending), payment_status=0 (Unpaid)

2. Lines 5350-5550: Payment processing happens AFTER
   - If wallet/credit: payment_status updated to 1
   - If Razorpay: Transaction created with status="pending"
   - Payment gateway URL generated
   - Customer redirected to Razorpay

3. Customer cancels payment on Razorpay
   - Booking ALREADY EXISTS in database
   - Booking appears in customer's list
   - payment_status remains 0 (Unpaid)
   - status remains 0 (Pending)
```

### Why This Might Be Intentional

**Possible Business Reasons**:

1. **Tracking** - Monitor abandoned bookings and conversion rates
2. **Retry Capability** - Customer can complete payment later
3. **Follow-up** - Admin can contact customer about incomplete booking
4. **Data Integrity** - Don't lose booking data if payment gateway has issues
5. **Audit Trail** - Complete record of all booking attempts

### Why This Is Problematic

**User Experience Issues**:

1. **Confusion** - Customers see "bookings" they never completed
2. **Clutter** - Unpaid bookings pollute the booking list
3. **Unclear Status** - Not obvious which bookings are "real"
4. **No Action** - Customer doesn't know they can retry payment
5. **Support Burden** - More support tickets asking "why do I have this booking?"

---

## Common Industry Approaches

### Option 1: Draft/Temporary Status

- Create booking with special "DRAFT" or "TEMPORARY" status
- Hide from main booking list
- Show in separate "Pending Payment" section
- Auto-delete after 24-48 hours if unpaid

### Option 2: Payment-First

- Don't create booking until payment confirmed
- Show loading/waiting state during payment
- Only create booking record after Razorpay callback confirms payment
- **Pros**: Clean booking list, no confusion
- **Cons**: Lose tracking of abandoned bookings

### Option 3: Auto-Cancel Unpaid

- Create booking as currently done
- Run cron job to auto-cancel unpaid bookings after X hours
- Mark them as `status=2` (Cancelled)
- Show message: "This booking was cancelled due to incomplete payment"

### Option 4: Separate Unpaid Tab

- Keep current flow
- Add separate "Unpaid Bookings" or "Pending Payment" tab
- Main "My Bookings" only shows paid bookings
- Allow retry payment from unpaid tab

---

## Recommendations

### Immediate Short-Term Fix

**Filter the booking list to hide unpaid bookings**:

In `todweb/pages/customer-info/index.vue`:

```javascript
// Option A: Filter out unpaid bookings
computed: {
  displayedBookings() {
    return this.bookings.filter(b => b.payment_status === 1);
  }
}

// Option B: Add filter tabs
data() {
  return {
    activeTab: 'paid', // 'paid' | 'unpaid' | 'all'
  }
},
computed: {
  displayedBookings() {
    if (this.activeTab === 'paid') {
      return this.bookings.filter(b => b.payment_status === 1);
    } else if (this.activeTab === 'unpaid') {
      return this.bookings.filter(b => b.payment_status === 0);
    }
    return this.bookings; // 'all'
  }
}
```

### Medium-Term Solution

**Add auto-cancel for unpaid bookings**:

Create cron job in `todbooking/common/cron.js`:

```javascript
// Run every hour
cron.schedule("0 * * * *", async () => {
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  await knex("tod_customer_booking")
    .where("payment_status", 0)
    .where("status", 0)
    .where("created_at", "<", cutoffTime)
    .update({
      status: 2, // Cancelled
      cancelled_by: "SYSTEM",
      cancelled_reason: "Auto-cancelled due to incomplete payment",
    });
});
```

### Long-Term Improvement

**Restructure booking flow**:

1. Create "booking intent" or "cart" table
2. Only create actual booking after payment confirmation
3. Use Razorpay webhooks to confirm payment
4. Move booking creation to payment success callback
5. Show "Processing..." state during payment

---

## Testing Scenarios

To verify current behavior:

1. **Test Paid Booking**:

   - Book trip, complete payment
   - Expected: `payment_status=1`, `status=0` (Pending)
   - After trip: `status` should update to `1` (Completed)

2. **Test Cancelled Payment**:

   - Book trip, cancel on Razorpay
   - Expected: Booking exists with `payment_status=0`, `status=0`
   - Should it appear in booking list? (Business decision needed)

3. **Test Failed Payment**:

   - Book trip, payment fails
   - Expected: Same as cancelled
   - What happens to booking?

4. **Test Wallet Payment**:
   - Book trip, pay with wallet
   - Expected: `payment_status=1` immediately
   - No Razorpay redirect needed

---

## Questions for Business/Product Team

1. **Should unpaid bookings appear in the customer's booking list?**

   - If yes: Add visual distinction (badge, color, message)
   - If no: Filter them out or move to separate section

2. **Should customers be able to retry payment for unpaid bookings?**

   - If yes: Add "Complete Payment" button
   - If no: Auto-cancel after X hours

3. **How long should unpaid bookings remain in the system?**

   - 24 hours? 48 hours? Forever?
   - Should they be auto-cancelled or soft-deleted?

4. **What happens when a trip is completed?**

   - Who updates `status` from Pending to Completed?
   - Is it automatic or manual?
   - Is this working correctly?

5. **Do you want analytics on abandoned bookings?**
   - If yes: Keep current behavior but improve UX
   - If no: Consider payment-first approach

---

## Code References

### Key Files

1. **Booking Creation Logic**:

   - `todbooking/model/adminOnewayTrip.js` (lines 4037-5550)
   - Booking INSERT at line ~5150
   - Payment processing at lines 5350-5550

2. **Frontend Display**:

   - `todweb/pages/customer-info/index.vue`
   - Status mapping: lines 977-994
   - Booking table: lines 230-270

3. **Database Schema**:
   - Table: `tod_customer_booking`
   - 5 status fields: payment_status, status, booking_status, assignment_status, settlement_status

### Status Code Mappings

```javascript
// Status field
0 = Pending (trip upcoming/in progress)
1 = Completed (trip finished)
2 = Cancelled (trip cancelled)
3 = Cancel Requested (pending cancellation approval)

// Payment Status field
0 = Unpaid (no payment received)
1 = Paid (payment confirmed)
```

---

## Next Steps

**Decision Required**:
Before implementing any fix, the business/product team needs to decide:

- Is the current behavior intentional or a bug?
- What should happen to unpaid bookings?
- Should they be visible to customers?

**Recommended Action**:

1. Discuss with stakeholders about desired behavior
2. Choose one of the approaches above
3. Implement chosen solution
4. Add proper user messaging/feedback
5. Consider adding analytics to track abandoned bookings

---

**Document Created**: January 2025
**Last Updated**: January 2025
**Related Issues**: Booking created on payment cancellation, Status vs Payment Status confusion
