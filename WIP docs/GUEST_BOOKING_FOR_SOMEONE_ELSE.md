# Guest User "Booking for Someone Else" Feature

## Overview

Extended the "booking for someone else" feature to guest users, providing a consistent experience across all user types. Now both guest and logged-in users can book trips for family members, friends, or colleagues.

## Implementation Date

January 2025

## Changes Made

### 1. Frontend: Payment Form UX Restructure (`todweb/pages/payment/index.vue`)

#### For Guest Users:

- **Customer Information Section (Always Visible)**
  - First Name, Last Name, Email, Phone Number
  - Purpose: Account creation for the person making the booking
  - Header: "Your Information"
- **Toggle Option**
  - "I'm booking for someone else" checkbox
  - Placed after customer information
  - Shows helper text explaining dual email notifications
- **Passenger Information Section (Conditional)**
  - Shows when toggle is enabled
  - First Name, Last Name, Email, Phone Number
  - Purpose: Trip passenger details
  - Header: "Passenger Information"
  - Uses `passenger` validation scope

#### For Logged-In Users:

- Unchanged from previous implementation
- Toggle at top
- Only passenger form shows (customer data from session)

#### Unified Passenger Form:

- Removed duplicate code
- Single passenger form section works for both user types
- All fields use `passenger.*` validation scope
- Consistent phone number component (`updatePassengerPhoneNumber`)

### 2. Validation Logic Updates

#### Guest User Flow:

```javascript
1. Validate customer.* fields (first name, last name, email, phone)
2. If valid and isBookingForSomeoneElse:
   - Validate passenger.* fields (first name, last name, email, phone)
   - If passenger valid → signup()
3. Else (booking for self):
   - signup() directly
4. After signup, validateBeforeSumbit() called again (now logged in)
5. Proceed to payment
```

#### Logged-In User Flow (Unchanged):

```javascript
1. If isBookingForSomeoneElse:
   - Validate passenger.* fields
   - If valid → proceed to payment
2. Else (booking for self):
   - Proceed directly to payment
```

### 3. Data Flow

#### Guest Booking for Self:

- Customer info → Account creation → Booking (customer is passenger)
- `is_booking_for_self: true`
- No passenger fields saved
- Email sent to customer only

#### Guest Booking for Someone Else:

- Customer info → Account creation → Booking with passenger details
- `is_booking_for_self: false`
- Passenger fields saved to database
- Emails sent to both customer and passenger

#### Logged-In Booking for Self:

- No forms shown
- Booking (customer is passenger)
- `is_booking_for_self: true`
- Email sent to customer only

#### Logged-In Booking for Someone Else:

- Passenger form shown
- Booking with passenger details
- `is_booking_for_self: false`
- Emails sent to both customer and passenger

## Technical Details

### Form Fields Structure:

```javascript
// Customer data (for account creation - guest only)
customer: {
  first_name: '',
  last_name: '',
  email: '',
  mobile_number: { nationalNumber, countryCode, countryCallingCode, isValid }
}

// Passenger data (for trip details - when booking for someone else)
passenger: {
  first_name: '',
  last_name: '',
  email: '',
  mobile_number: { nationalNumber, countryCode, countryCallingCode, isValid }
}

// Toggle state
isBookingForSomeoneElse: false
```

### Validation Scopes:

- `customer.*` - For guest user account creation fields
- `passenger.*` - For passenger trip details fields

### Phone Number Components:

- `mobile_number` (v-model) → `updatePhoneNumber()` → `customer.mobile_number`
- `passenger_mobile_number` (v-model) → `updatePassengerPhoneNumber()` → `passenger.mobile_number`

## User Experience Flow

### Guest User Journey (Booking for Someone Else):

1. Lands on payment page
2. Sees "Your Information" section
3. Fills in their details (for account creation)
4. Checks "I'm booking for someone else"
5. Sees "Passenger Information" section appear
6. Fills in passenger details
7. Proceeds to payment
8. System creates account for guest
9. System saves booking with passenger info
10. Both guest and passenger receive confirmation emails

### Guest User Journey (Booking for Self):

1. Lands on payment page
2. Sees "Your Information" section
3. Fills in their details
4. Leaves "I'm booking for someone else" unchecked
5. Proceeds to payment
6. System creates account
7. System saves booking (customer is passenger)
8. Guest receives confirmation email

## Benefits

1. **Consistency**: All users have same capabilities regardless of login status
2. **Clear Separation**: Customer account info vs passenger trip info
3. **Better UX**: No need to create account before booking for someone else
4. **Transparency**: Helper text explains dual email notifications
5. **Code Quality**: Unified passenger form reduces duplication

## Backend Compatibility

All backend systems already support this feature:

- ✅ Database has passenger columns
- ✅ All trip type models save passenger data
- ✅ All validation schemas accept passenger parameters
- ✅ Email templates send to both customer and passenger
- ✅ Booking details pages display passenger info conditionally

## Testing Scenarios

### Test Case 1: Guest Booking for Self

- Fill customer form only
- Don't check toggle
- Verify account created
- Verify `is_booking_for_self = true`
- Verify single email sent
- Verify no passenger data in database

### Test Case 2: Guest Booking for Someone Else

- Fill customer form
- Check toggle
- Fill passenger form
- Verify account created with customer email
- Verify `is_booking_for_self = false`
- Verify passenger data saved
- Verify two emails sent (customer + passenger)
- Verify passenger details display on booking page

### Test Case 3: Logged-In Booking for Self

- No forms shown
- Proceed directly
- Verify `is_booking_for_self = true`
- Verify single email sent

### Test Case 4: Logged-In Booking for Someone Else

- Check toggle
- Fill passenger form
- Verify `is_booking_for_self = false`
- Verify passenger data saved
- Verify two emails sent
- Verify passenger details display

### Test Case 5: Validation Errors

- Test missing required fields (customer + passenger)
- Test invalid email formats
- Test invalid phone numbers
- Verify appropriate error messages

## Related Files Modified

### Frontend:

- `todweb/pages/payment/index.vue` - Payment form restructure and validation logic

### Backend (Already Complete):

- `todapi/migrations/20251114171930_add_passenger_fields_to_booking.js`
- `todapi/model/booking.js`
- `todapi/common/emailTemplates.js`
- `todbooking/common/emailTemplates.js`
- `todbooking/model/*.js` (all 5 trip types)
- `todbooking/routevalidations/*.js` (all 5 trip types)

### Display Pages (Already Complete):

- `todweb/pages/bookingDetails/_id.vue`
- `todop/pages/booking/booking/_id.vue`
- `todop/pages/booking/booking/view/_id.vue`

## Notes

- The signup function already preserves the payment option and re-calls validation after account creation
- All booking API calls already check `isBookingForSomeoneElse` and include passenger data
- Email logic already personalizes content for passenger when `is_booking_for_self === false`
- Display pages already conditionally show passenger section with proper data checks
