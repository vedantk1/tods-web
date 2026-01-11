# 🔍 Deep Dive

---

## 💰 **1. PRICING ENGINE - Detailed Breakdown**

The pricing engine is quite sophisticated. Let me break it down:

### **Core Pricing Components:**

```javascript
// Example from booking model
finalPrice = basePrice + taxes + amenities - discounts + surcharges;
```

### **A. Route-Based Pricing (Most Common)**

For **One-Way** and **Round Trips**, pricing is pre-configured in database tables:

**Tables:**

- `tod_one_way_trip_routes` - Fixed routes with rates
- `tod_round_trip_routes` - Return journey rates
- `tod_multi_one_way_trip_routes` - Multi-leg routes

**Example Structure:**

```javascript
{
  from_city: "Mumbai",
  to_city: "Pune",
  vehicle_type_id: 3, // SUV
  base_rate: 2500,
  per_km_rate: 15,
  distance_km: 150,
  duration_minutes: 180,
  night_charges: 300,  // 10 PM - 6 AM
  weekend_charges: 200, // Sat/Sun
  toll_charges: 450,
  parking_charges: 100,
  driver_allowance: 400,
  is_active: 1
}
```

### **B. Local/Hourly Pricing**

**Table:** `tod_local_trip_routes`

```javascript
{
  city: "Bangalore",
  vehicle_type_id: 2, // Sedan
  package_type: "8 hrs / 80 km",
  base_rate: 1800,
  extra_km_rate: 12,
  extra_hour_rate: 150,
  min_hours: 8,
  min_km: 80
}
```

**Calculation Logic:**

```javascript
if (actual_km > package_km) {
  extraKmCharges = (actual_km - package_km) * extra_km_rate;
}
if (actual_hours > package_hours) {
  extraHourCharges = (actual_hours - package_hours) * extra_hour_rate;
}
finalPrice = base_rate + extraKmCharges + extraHourCharges;
```

### **C. Airport Transfer Pricing**

**Table:** `tod_airport_one_way_routes`

```javascript
{
  airport_id: 5, // Mumbai Airport
  location: "Andheri East",
  vehicle_type_id: 1, // Hatchback
  base_rate: 800,
  waiting_charges_per_hour: 100,
  meet_greet_charges: 200, // Driver meets at terminal
  luggage_charges: 50 // Per extra bag
}
```

### **D. Dynamic Add-ons (Amenities)**

**Tables:**

- `tod_airport_amenities` - Airport-specific add-ons
- `tod_travel_amenities` - General trip add-ons

**Examples:**

```javascript
amenities = [
  { name: "Child Seat", price: 300, type: "one_time" },
  { name: "WiFi Device", price: 200, type: "one_time" },
  { name: "Extra Luggage", price: 50, type: "per_item" },
  { name: "Meet & Greet", price: 200, type: "one_time" },
  { name: "Toll Pass", price: 500, type: "one_time" },
];
```

### **E. Surcharges & Multipliers**

```javascript
// Night charges (10 PM - 6 AM)
if (tripTime >= 22 || tripTime <= 6) {
  surcharge += route.night_charges || basePrice * 0.15;
}

// Weekend charges
if (isWeekend(tripDate)) {
  surcharge += route.weekend_charges || basePrice * 0.1;
}

// Peak season multiplier
if (isPeakSeason(tripDate)) {
  multiplier = 1.2; // 20% increase
}
```

### **F. Tax Calculation**

**Tables:**

- `tod_tax_master` - Tax rules per country/state
- `tod_airports` - Airport tax info

```javascript
// GST calculation (India example)
if (country === "India") {
  cgst = basePrice * 0.025; // 2.5%
  sgst = basePrice * 0.025; // 2.5%
  totalTax = cgst + sgst; // 5% total
}

// Airport tax
if (isAirportTrip) {
  airportTax = airport.airport_tax || 100;
}

grandTotal = basePrice + totalTax + airportTax;
```

### **G. Discount System**

**Table:** `tod_coupons`

```javascript
coupon = {
  code: "FIRST50",
  discount_type: "percentage", // or "fixed"
  discount_value: 50, // 50% or ₹50
  min_booking_amount: 1000,
  max_discount: 500,
  valid_from: "2025-01-01",
  valid_to: "2025-12-31",
  usage_limit: 100,
  user_type: "new", // new/existing/all
};

if (coupon.discount_type === "percentage") {
  discount = Math.min(
    (basePrice * coupon.discount_value) / 100,
    coupon.max_discount
  );
}
```

### **H. Multi-Currency Pricing**

**Table:** `tod_currencies`

```javascript
// Customer sees price in their currency
customerCurrency = "USD";
baseCurrency = "INR";
rate = getExchangeRate("INR", "USD"); // 0.012

priceINR = 5000;
priceUSD = priceINR * rate; // $60

// Stored in DB as INR, displayed as USD
```

### **I. Supplier-Specific Rates**

Suppliers can set custom rates:

```javascript
// Check if supplier has custom rate for this route
supplierRate = getSupplierRate(supplier_id, route_id);

if (supplierRate) {
  finalPrice = supplierRate.custom_price;
} else {
  finalPrice = route.base_rate; // Use default
}
```

### **J. Complete Pricing Flow:**

```javascript
// Pseudo-code for pricing calculation
function calculateTripPrice(tripData) {
  // 1. Get base rate
  let baseRate = getRouteRate(tripData);

  // 2. Add distance-based charges
  if (tripData.actual_km > tripData.included_km) {
    baseRate += (tripData.actual_km - tripData.included_km) * perKmRate;
  }

  // 3. Add time-based charges
  if (tripData.actual_hours > tripData.included_hours) {
    baseRate += (tripData.actual_hours - tripData.included_hours) * perHourRate;
  }

  // 4. Add amenities
  let amenitiesTotal = tripData.amenities.reduce((sum, a) => sum + a.price, 0);

  // 5. Apply surcharges
  let surcharges = calculateSurcharges(tripData);

  // 6. Calculate subtotal
  let subtotal = baseRate + amenitiesTotal + surcharges;

  // 7. Apply discount
  let discount = applyCoupon(tripData.coupon, subtotal);

  // 8. Calculate tax
  let tax = calculateTax(subtotal - discount);

  // 9. Final total
  let grandTotal = subtotal - discount + tax;

  return {
    baseRate,
    amenities: amenitiesTotal,
    surcharges,
    subtotal,
    discount,
    tax,
    grandTotal,
  };
}
```

---

## 👥 **2. ROLE HIERARCHY - Drivers, Agents, API Users**

### **How Drivers Work:**

Drivers are the **actual people driving the vehicles**. Here's how they fit in:

**Two Types of Drivers:**

#### **A. Supplier-Attached Drivers**

```javascript
// Driver belongs to a supplier
driver = {
  driver_id: 101,
  supplier_id: 25, // Works for "XYZ Cabs"
  name: "Rajesh Kumar",
  license_number: "DL1234567",
  phone: "+919876543210",
  vehicle_assigned: "MH01AB1234",
  status: "active",
  rating: 4.8,
};
```

**Flow:**

1. Customer books a cab
2. System assigns booking to Supplier
3. Supplier assigns their driver
4. Driver receives trip details via SMS/app
5. Driver completes the trip
6. Supplier gets payment, pays driver

#### **B. Independent Drivers**

```javascript
// Driver owns their vehicle
driver = {
  driver_id: 102,
  supplier_id: null, // No supplier
  owns_vehicle: true,
  vehicle_registration: "MH02XY9876",
  name: "Amit Singh",
  is_verified: true,
};
```

**Flow:**

1. Customer books
2. System directly assigns to independent driver
3. Driver gets paid directly (minus platform commission)

**Driver Database Tables:**

- `tod_drivers` - Driver master data
- `tod_driver_documents` - License, insurance, photos
- `tod_driver_availability` - Schedule/availability
- `tod_driver_settlements` - Payment tracking

**Driver Assignment Logic (from booking model):**

```javascript
// Auto-assign driver based on:
- Availability
- Location proximity
- Vehicle type match
- Rating
- Previous trips with customer
```

---

### **What Are Agents?**

Agents are **business partners** who bring customers to the platform. Think of them as resellers/distributors.

**Agent Types:**

#### **1. Travel Agents**

```javascript
agent = {
  type: "travel_agent",
  company: "Wanderlust Travels",
  commission_rate: 15, // 15% on every booking
  credit_limit: 100000, // Can book on credit
  payment_terms: "net_30", // Pay within 30 days
};
```

**Use Case:**

- Travel agency books cabs for their tour packages
- Gets bulk discount/commission
- Can book now, pay later

#### **2. Hotel Admins**

```javascript
agent = {
  type: "hotel_admin",
  hotel_name: "Taj Palace",
  commission_rate: 10,
  service_type: "airport_transfer", // Mainly airport pickups
};
```

**Use Case:**

- Hotel concierge books airport transfers for guests
- Commission on each booking
- White-label experience (customer thinks hotel arranged it)

#### **3. Corporate Partners**

```javascript
agent = {
  type: "corporate",
  company: "TCS - Mumbai Office",
  monthly_quota: 500, // 500 trips/month
  discounted_rate: true,
  billing_cycle: "monthly",
};
```

**Use Case:**

- Company employees book cabs
- Centralized billing to company
- Corporate rates

#### **4. Tour Operators**

```javascript
agent = {
  type: "tour_operator",
  specialization: "pilgrimage_tours",
  markup_allowed: 20, // Can add 20% markup for their customers
};
```

**Credit Transactions for Agents:**

```javascript
// Agent Credit System
agent_wallet = {
  agent_id: 50,
  credit_limit: 50000, // Can book up to ₹50k on credit
  current_balance: -25000, // Owes ₹25k
  available_credit: 25000 // Can still book ₹25k more
}

// Booking on credit
when agent books:
  if (booking_amount <= agent.available_credit) {
    createBooking();
    agent.current_balance -= booking_amount;

    // Create credit transaction
    transaction = {
      type: "debit",
      amount: booking_amount,
      description: "Booking #12345",
      due_date: today + 30 days
    }
  }

// Agent payment
when agent pays:
  agent.current_balance += payment_amount;
  transaction = {
    type: "credit",
    amount: payment_amount,
    payment_method: "bank_transfer"
  }
```

**Agent Commission:**

```javascript
// Booking total: ₹5000
agentCommission = 5000 * 0.15; // ₹750 (15%)
supplierPayout = 5000 - 750; // ₹4250

// Agent earns ₹750 per booking
```

---

### **API Users - Third-Party Integrations**

API Users are **external systems** that integrate with TravelODesk.

**Examples:**

#### **1. OTA Integration (Online Travel Agency)**

```javascript
apiUser = {
  company: "MakeMyTrip",
  api_key: "mmt_prod_abc123...",
  permissions: ["search", "book", "cancel"],
  rate_type: "b2b", // Special B2B rates
  callback_url: "https://makemytrip.com/webhook/tod",
};
```

**Use Case:**

- MakeMyTrip shows TravelODesk cabs on their website
- Customer books on MMT → API call to TravelODesk → Booking created
- MMT gets commission

#### **2. Corporate API**

```javascript
apiUser = {
  company: "Infosys Employee Portal",
  api_key: "infosys_xyz789...",
  auto_approve: true, // No manual approval needed
  billing: "monthly_invoice",
};
```

**Use Case:**

- Infosys employees book through company portal
- Portal uses API to create bookings
- Monthly consolidated billing

#### **3. Hotel PMS Integration**

```javascript
apiUser = {
  company: "Opera PMS - Marriott",
  api_key: "marriott_pms_...",
  features: ["airport_transfers", "local_trips"],
  auto_driver_assignment: true,
};
```

**Authentication:**

```javascript
// API request
headers: {
  "x-todapi-key": "encrypted_api_key_here",
  "Content-Type": "application/json"
}

// Validation
if (!validateAPIKey(req.headers['x-todapi-key'])) {
  return res.status(401).json({ error: "Invalid API key" });
}
```

---

## 💳 **3. Settlement Requests for Suppliers**

**Settlement** = Paying suppliers for completed trips

### **How It Works:**

```javascript
// Example scenario:
Supplier "ABC Cabs" completed 50 trips last month
Total bookings value: ₹250,000
Platform commission (20%): ₹50,000
Supplier payout: ₹200,000

// Settlement Request
settlementRequest = {
  supplier_id: 10,
  request_date: "2025-11-01",
  period_from: "2025-10-01",
  period_to: "2025-10-31",
  total_bookings: 50,
  gross_amount: 250000,
  commission: 50000,
  deductions: 5000, // Penalties/refunds
  net_payable: 195000,
  status: "pending" // pending → approved → paid
}
```

**Settlement Flow:**

1. **Supplier Creates Request**

```javascript
// Supplier dashboard
GET /api/admin/settlement/pending-amount
// Shows: ₹195,000 pending

POST /api/admin/settlement/request
{
  amount: 195000,
  bank_details: {...}
}
```

2. **Admin Reviews**

```javascript
// Admin verifies all trips completed
// Checks for customer complaints
// Approves settlement

PUT /api/admin/settlement/:id/approve
{
  approved_amount: 195000,
  payment_method: "bank_transfer",
  payment_date: "2025-11-05"
}
```

3. **Payment Processing**

```javascript
// Admin marks as paid
PUT /api/admin/settlement/:id/paid
{
  transaction_id: "PAY123456",
  paid_date: "2025-11-05"
}

// Supplier balance updated
supplier.pending_settlement = 0;
supplier.total_settled += 195000;
```

**Deductions:**

```javascript
deductions = {
  cancellation_penalties: 2000,
  customer_refunds: 1500,
  platform_fees: 1000,
  tax_deducted: 500,
};
```

**Settlement Table Schema:**

```javascript
tod_settlement = {
  settlement_id,
  supplier_id,
  request_date,
  period_start,
  period_end,
  total_trips,
  gross_amount,
  commission_amount,
  deduction_amount,
  net_payable,
  status, // pending, approved, paid, rejected
  payment_method,
  payment_date,
  transaction_id,
  remarks,
};
```

---

## 📧 **4. COMMUNICATION SYSTEMS - Deep Dive**

### **A. Email System**

**Two Email Methods:**

#### **Method 1: Gmail API (Primary)**

```javascript
// Uses OAuth2 for authentication
const { google } = require("googleapis");
const gmail = google.gmail("v1");

async function sendViaGmailAPI(to, subject, html) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const message = createMessage(to, subject, html);

  await gmail.users.messages.send({
    userId: "me",
    resource: { raw: message },
  });
}
```

**Why Gmail API?**

- Higher sending limits (2000/day vs 500/day with SMTP)
- Better deliverability
- OAuth2 security
- No password in code

#### **Method 2: Nodemailer (Fallback)**

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

await transporter.sendMail({
  from: '"TravelODesk" <noreply@travelodesk.com>',
  to: customer.email,
  subject: "Booking Confirmation",
  html: emailTemplate,
});
```

### **Email Templates (from emailTemplates.js):**

#### **1. Booking Confirmation**

```javascript
function bookingConfirmationEmail(booking) {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Booking Confirmed!</h2>
        <p>Dear ${booking.customer_name},</p>
        <p>Your booking #${booking.booking_id} is confirmed.</p>
        
        <table>
          <tr><td>Pickup:</td><td>${booking.pickup_location}</td></tr>
          <tr><td>Drop:</td><td>${booking.drop_location}</td></tr>
          <tr><td>Date:</td><td>${booking.pickup_date}</td></tr>
          <tr><td>Time:</td><td>${booking.pickup_time}</td></tr>
          <tr><td>Vehicle:</td><td>${booking.vehicle_type}</td></tr>
          <tr><td>Amount:</td><td>₹${booking.total_amount}</td></tr>
        </table>
        
        <a href="${process.env.WEB_URL}/booking/${booking.id}">
          View Booking Details
        </a>
      </body>
    </html>
  `;
}
```

#### **2. Driver Assignment Email**

```javascript
function driverAssignedEmail(booking) {
  return `
    <h2>Driver Assigned</h2>
    <p>Your driver details:</p>
    <ul>
      <li>Name: ${booking.driver_name}</li>
      <li>Phone: ${booking.driver_phone}</li>
      <li>Vehicle: ${booking.vehicle_number}</li>
      <li>Vehicle Type: ${booking.vehicle_model}</li>
    </ul>
    <p>Driver will contact you 30 minutes before pickup.</p>
  `;
}
```

#### **3. Payment Link Email**

```javascript
function paymentLinkEmail(booking) {
  return `
    <h2>Complete Your Payment</h2>
    <p>Total Amount: ₹${booking.total_amount}</p>
    <a href="${booking.payment_link}" style="button">
      Pay Now
    </a>
    <p>Link expires in 24 hours.</p>
  `;
}
```

#### **4. Cancellation Email**

```javascript
function cancellationEmail(booking) {
  return `
    <h2>Booking Cancelled</h2>
    <p>Booking #${booking.booking_id} has been cancelled.</p>
    
    ${
      booking.refund_amount > 0
        ? `
      <p>Refund Amount: ₹${booking.refund_amount}</p>
      <p>Refund will be processed in 5-7 business days.</p>
    `
        : `
      <p>No refund applicable as per cancellation policy.</p>
    `
    }
  `;
}
```

#### **5. Supplier Notification Email**

```javascript
function newBookingSupplierEmail(booking) {
  return `
    <h2>New Booking Assigned</h2>
    <p>Booking ID: ${booking.booking_id}</p>
    <p>Please assign a driver.</p>
    
    <table>
      <tr><td>Customer:</td><td>${booking.customer_name}</td></tr>
      <tr><td>Pickup:</td><td>${booking.pickup_location}</td></tr>
      <tr><td>Date:</td><td>${booking.pickup_date} ${booking.pickup_time}</td></tr>
      <tr><td>Your Payout:</td><td>₹${booking.supplier_payout}</td></tr>
    </table>
    
    <a href="${process.env.ADMIN_URL}/bookings/${booking.id}">
      Assign Driver
    </a>
  `;
}
```

### **Email Triggers:**

```javascript
// After successful booking
await sendEmail({
  to: customer.email,
  template: "bookingConfirmation",
  data: booking,
});

await sendEmail({
  to: supplier.email,
  template: "newBookingSupplier",
  data: booking,
});

// After driver assignment
await sendEmail({
  to: customer.email,
  template: "driverAssigned",
  data: booking,
});

// Before trip (reminder)
// Cron job runs daily
const upcomingTrips = getTripsStartingIn24Hours();
upcomingTrips.forEach((trip) => {
  sendEmail({
    to: trip.customer_email,
    template: "tripReminder",
    data: trip,
  });
});
```

---

### **B. SMS System**

**Two SMS Gateways:**

#### **1. Twilio (International)**

```javascript
const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, message) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  });
}
```

#### **2. BhashSMS (India - Cheaper)**

```javascript
const axios = require("axios");

async function sendBhashSMS(mobile, message) {
  const url = "https://bhashsms.com/api/sendmsg.php";

  await axios.get(url, {
    params: {
      user: process.env.BHASH_USER,
      pass: process.env.BHASH_PASSWORD,
      sender: "TODSK", // Sender ID
      phone: mobile,
      text: message,
      priority: "ndnd", // Non-DND
      stype: "normal",
    },
  });
}
```

**SMS Templates:**

```javascript
// Booking confirmation
sms = `Dear ${customer.name}, your booking #${booking_id} is confirmed for ${date} at ${time}. Pickup: ${location}. Amount: Rs.${amount}. -TravelODesk`;

// OTP
sms = `Your TravelODesk verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`;

// Driver assigned
sms = `Driver assigned! ${driver_name}, ${vehicle_number}, Ph: ${driver_phone}. Track: ${tracking_link}`;

// Trip starting soon
sms = `Reminder: Your trip starts in 2 hours. Pickup at ${time} from ${location}. Driver: ${driver_phone}`;

// Payment pending
sms = `Payment pending for booking #${booking_id}. Pay now: ${payment_link}`;
```

**SMS Flow:**

```javascript
async function sendBookingConfirmationSMS(booking) {
  const message = formatSMS("bookingConfirmation", booking);

  // Detect country code
  if (booking.customer_phone.startsWith("+91")) {
    // India - use BhashSMS
    await sendBhashSMS(booking.customer_phone, message);
  } else {
    // International - use Twilio
    await sendSMS(booking.customer_phone, message);
  }

  // Log SMS
  await db("tod_sms_log").insert({
    booking_id: booking.id,
    phone: booking.customer_phone,
    message,
    gateway: "bhashsms",
    status: "sent",
    sent_at: new Date(),
  });
}
```

---

### **C. Push Notifications (Future?)**

I don't see push notification implementation yet, but the structure suggests it might be planned:

```javascript
// Placeholder for future implementation
async function sendPushNotification(userId, notification) {
  // Firebase Cloud Messaging
  // OneSignal
  // Or custom WebSocket
}
```

---

### **D. In-App Notifications**

```javascript
// Table: tod_notifications
notification = {
  user_id,
  type: "booking_confirmed", // booking, payment, driver, promotion
  title: "Booking Confirmed",
  message: "Your booking #12345 is confirmed",
  data: { booking_id: 12345 }, // Additional data
  read: false,
  created_at: new Date(),
};

// User sees notification bell icon
// Clicking marks as read
```

---

## 📋 **5. BOOKING WORKFLOW - Quote Generation & Assignment**

### **What is `is_quote = 1`?**

`is_quote` is a **boolean flag** (1 = true, 0 = false) that determines if this is just a **quotation** or an actual **confirmed booking**.

**Two Modes:**

#### **Mode 1: Direct Booking (`is_quote = 0`)**

```javascript
// Customer books immediately
booking = {
  booking_id: "TOD12345",
  is_quote: 0, // Not a quote, confirmed booking
  status: "active",
  payment_status: "pending"
}

// Flow:
Customer fills form → Sees price → Clicks "Book Now" →
Payment → Confirmed booking
```

#### **Mode 2: Quotation First (`is_quote = 1`)**

```javascript
// Customer requests quote
quote = {
  quote_id: "QT5678",
  is_quote: 1, // Just a quote
  status: "quoted",
  valid_until: "2025-11-10", // Quote expires in 4 days
  converted_to_booking: false
}

// Flow:
Customer fills form → Clicks "Get Quote" →
Admin reviews → Sends custom quote →
Customer accepts → Converts to booking (is_quote = 0)
```

**Use Cases for Quotes:**

1. **Complex Trips:**

```javascript
// Multi-day Chardham tour
quote = {
  trip_type: "chardham",
  duration: "10 days",
  locations: ["Gangotri", "Yamunotri", "Kedarnath", "Badrinath"],
  is_quote: 1, // Too complex for instant pricing

  // Admin manually calculates:
  vehicle_cost: 50000,
  driver_cost: 10000,
  accommodation: 30000,
  total: 90000,
};
```

2. **Corporate Bulk Booking:**

```javascript
quote = {
  customer_type: "corporate",
  monthly_requirement: "50 airport transfers",
  is_quote: 1,

  // Sales team negotiates rates
  regular_rate: 1000 * 50, // ₹50,000
  quoted_rate: 900 * 50, // ₹45,000 (10% discount)
};
```

3. **Custom Requirements:**

```javascript
quote = {
  special_requests: "Need wheelchair accessible vehicle with medical equipment",
  is_quote: 1,

  // Admin sources special vehicle, quotes custom price
};
```

**Quote to Booking Conversion:**

```javascript
// When customer accepts quote
async function convertQuoteToBooking(quoteId) {
  const quote = await db("tod_enquiries").where({ id: quoteId }).first();

  // Create actual booking
  const booking = await db("tod_customer_booking").insert({
    ...quote,
    is_quote: 0, // Now it's a real booking!
    booking_id: generateBookingID(),
    status: "active",
    quote_id: quoteId, // Link back to original quote
  });

  // Update quote
  await db("tod_enquiries").where({ id: quoteId }).update({
    converted_to_booking: true,
    booking_id: booking.id,
  });

  return booking;
}
```

---

### **Assignment - How It Works**

**Assignment** = Allocating a supplier/driver to a booking

**Assignment States:**

```javascript
booking = {
  assignment_status: "unassigned", // No supplier/driver yet
  // OR
  assignment_status: "assigned", // Supplier/driver allocated
};
```

**Assignment Flow:**

#### **Step 1: Booking Created (Unassigned)**

```javascript
// Customer completes payment
booking = {
  booking_id: "TOD12345",
  status: "active",
  assignment_status: "unassigned",
  supplier_id: null,
  driver_id: null,
  assigned_at: null,
};
```

#### **Step 2: Admin/System Assigns Supplier**

**Manual Assignment (Admin Panel):**

```javascript
// Admin logs into todop panel
// Goes to Bookings > Unassigned
// Clicks "Assign Supplier"

PUT /api/admin/booking/:id/assign-supplier
{
  supplier_id: 10
}

// Updates booking
booking.supplier_id = 10;
booking.assignment_status = "supplier_assigned"; // Intermediate state
booking.assigned_at = new Date();

// Sends email/SMS to supplier
sendEmail(supplier.email, 'newBookingAssigned', booking);
```

**Auto-Assignment (Smart Algorithm):**

```javascript
async function autoAssignSupplier(bookingId) {
  const booking = await getBooking(bookingId);

  // Find suitable suppliers
  const suppliers = await db("tod_suppliers")
    .where({
      operational_city: booking.pickup_city,
      is_active: 1,
      has_vehicle_type: booking.vehicle_type_id,
    })
    .where("available_vehicles", ">", 0);

  // Score each supplier
  const scored = suppliers.map((supplier) => ({
    supplier,
    score: calculateScore(supplier, booking),
  }));

  // Pick best match
  const best = scored.sort((a, b) => b.score - a.score)[0];

  // Assign
  await assignSupplier(bookingId, best.supplier.id);
}

function calculateScore(supplier, booking) {
  let score = 100;

  // Rating bonus
  score += supplier.rating * 10;

  // Proximity bonus
  const distance = getDistance(supplier.location, booking.pickup_location);
  score -= distance * 2;

  // Completion rate bonus
  score += supplier.completion_rate;

  // Penalty for low acceptance rate
  if (supplier.acceptance_rate < 80) {
    score -= 20;
  }

  return score;
}
```

#### **Step 3: Supplier Assigns Driver**

```javascript
// Supplier logs in
// Sees new booking notification
// Goes to "My Bookings" > Assign Driver

PUT /api/admin/booking/:id/assign-driver
{
  driver_id: 50,
  vehicle_registration: "MH01AB1234"
}

// Updates booking
booking.driver_id = 50;
booking.vehicle_assigned = "MH01AB1234";
booking.assignment_status = "assigned"; // Fully assigned!

// Sends notifications
sendSMS(customer.phone, driverAssignedSMS);
sendEmail(customer.email, driverAssignedEmail);
sendSMS(driver.phone, newTripAssignedSMS);
```

**Assignment Table:**

```javascript
tod_booking_assignment = {
  booking_id,
  supplier_id,
  driver_id,
  vehicle_id,
  assigned_by: "admin", // or "auto" or "supplier"
  assigned_at,
  acceptance_status: "pending", // pending, accepted, rejected
  accepted_at,
  rejection_reason,
};
```

**Driver Acceptance:**

```javascript
// Driver gets SMS: "New trip assigned. Accept?"
// Driver calls IVR or clicks link

PUT /api/driver/booking/:id/accept
{
  driver_id: 50,
  estimated_arrival: "10 minutes"
}

// Booking status changes
booking.driver_acceptance = "accepted";
booking.driver_eta = "10 minutes";

// Customer notified
sendSMS(customer.phone, "Driver accepted. ETA: 10 min");
```

**Rejection & Reassignment:**

```javascript
// If driver/supplier rejects
PUT /api/driver/booking/:id/reject
{
  reason: "Vehicle breakdown"
}

// Auto-reassign to next best supplier
await autoReassign(bookingId);
```

---

## 🏢 **6. MULTI-TENANT Explained**

**Multi-tenant** means **one application serves multiple businesses/brands**.

### **How TravelODesk Uses Multi-Tenancy:**

#### **Scenario 1: White-Label for Different Companies**

```javascript
// Company A: "Mumbai Cabs"
tenant_A = {
  tenant_id: "mumbai_cabs",
  domain: "mumbaicabs.com",
  branding: {
    logo: "mumbai_logo.png",
    primary_color: "#FF5733",
    company_name: "Mumbai Cabs",
  },
  database_prefix: "mc_", // mc_customer_booking
  email: "booking@mumbaicabs.com",
};

// Company B: "Delhi Taxi Service"
tenant_B = {
  tenant_id: "delhi_taxi",
  domain: "delhitaxi.in",
  branding: {
    logo: "delhi_logo.png",
    primary_color: "#3498DB",
    company_name: "Delhi Taxi Service",
  },
  database_prefix: "dt_", // dt_customer_booking
  email: "bookings@delhitaxi.in",
};
```

**Same Code, Different Brands:**

```javascript
// Customer visits mumbaicabs.com
→ Sees Mumbai Cabs branding
→ Books a ride
→ Data stored with prefix "mc_"

// Customer visits delhitaxi.in
→ Sees Delhi Taxi branding
→ Books a ride
→ Data stored with prefix "dt_"
```

#### **How It's Implemented (Table Name Prefixes):**

```javascript
// In knexfile.js and helpers.js
const TABLE_PREFIX = process.env.TOD_PREFIX || "tod_";

// All queries use environment variable
const tableName = `${TABLE_PREFIX}customer_booking`;

// Example:
// Local dev: tod_customer_booking
// Client A:   mc_customer_booking
// Client B:   dt_customer_booking
```

**Why Environment Variables for Table Names?**

```javascript
// .env for Mumbai Cabs
TOD_PREFIX = mc_;
DB_DATABASE = mumbaicabs_db;

// .env for Delhi Taxi
TOD_PREFIX = dt_;
DB_DATABASE = delhitaxi_db;

// Same codebase, different databases!
```

**Benefits:**

- ✅ One codebase for multiple clients
- ✅ Data isolation between tenants
- ✅ Easy to add new clients (just change env vars)
- ✅ Each client gets their own branded experience

---

## 🗺️ **7. PLACE API & LOCATION FEATURES**

### **What is "Place API like Google Places"?**

The project has its **own place database** - similar to Google Places API but simpler.

**Table: `tod_place`**

```javascript
place = {
  place_id: 1001,
  place_name: "Chhatrapati Shivaji Terminus",
  place_type: "railway_station", // airport, landmark, hotel, etc.
  address: "DN Road, Fort, Mumbai",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  latitude: 18.9398,
  longitude: 72.8355,
  is_popular: true, // Featured locations
  is_airport: false,
  is_railway_station: true,
};
```

**How It Works:**

#### **Search Autocomplete:**

```javascript
// Customer types "Chat..."
GET /api/web/places/search?q=Chat

// Returns:
[
  {
    id: 1001,
    name: "Chhatrapati Shivaji Terminus",
    type: "Railway Station",
    city: "Mumbai"
  },
  {
    id: 1002,
    name: "Chatrapati Sambhaji Nagar Airport",
    type: "Airport",
    city: "Aurangabad"
  }
]
```

#### **Popular Locations:**

```javascript
// Homepage: "Popular Pickup Points"
GET /api/web/places/popular?city=Mumbai

// Returns top 10 popular locations in Mumbai
```

#### **Why Not Use Google Places?**

1. **Cost:** Google charges per API call
2. **Control:** Own database = custom data
3. **Speed:** Local queries faster
4. **Offline:** Works without internet dependency
5. **Custom Fields:** Can add `is_popular`, `amenities_available`, etc.

---

### **Airport Database**

**Table: `tod_airports`**

```javascript
airport = {
  airport_id: 5,
  airport_name: "Chhatrapati Shivaji Maharaj International Airport",
  airport_code: "BOM", // IATA code
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  latitude: 19.0896,
  longitude: 72.8656,

  // Business data
  terminals: ["T1", "T2"],
  operational: true,
  airport_tax: 100,
  parking_charges: 50,

  // For route pricing
  city_distance_km: 25, // Distance to city center
  base_fare_to_city: 800,
};
```

**What Does Airport Database Do?**

1. **Airport Transfer Pricing:**

```javascript
// Customer books: BOM Airport → Andheri
const airport = getAirport("BOM");
const route = getAirportRoute(airport.id, "Andheri");

price = route.base_fare + airport.airport_tax;
```

2. **Terminal Selection:**

```javascript
// Booking form
"Which terminal? [T1] [T2]";

// Driver knows exact pickup point
driver_instructions = `Pickup: ${airport.name}, Terminal ${booking.terminal}`;
```

3. **Flight Integration (Future):**

```javascript
// Track flight status
flight = {
  flight_number: "AI860",
  airport_code: "BOM",
  arrival_time: "10:30 AM",
  status: "Delayed", // Adjust driver pickup time
  gate: "12A",
};
```

---

### **Distance/Duration Calculation**

**Two Methods:**

#### **Method 1: Pre-calculated Routes (Fast)**

```javascript
// Table: tod_one_way_trip_routes
route = {
  from_city: "Mumbai",
  from_location: "BOM Airport",
  to_city: "Pune",
  to_location: "Pune Station",

  distance_km: 150, // Pre-calculated!
  duration_minutes: 180, // Pre-calculated!

  // Admin measured this route once, stored forever
};

// When customer books this route:
// Just fetch from database, no API call needed
const route = await db("tod_one_way_trip_routes")
  .where({ from_location_id, to_location_id })
  .first();

price = route.base_rate + route.distance_km * perKmRate;
```

#### **Method 2: Dynamic Calculation (For New Routes)**

```javascript
// If route not in database, calculate on-the-fly
async function calculateDistance(fromLat, fromLng, toLat, toLng) {
  // Haversine formula (straight-line distance)
  const R = 6371; // Earth radius in km
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Add 20% for actual road distance (straight line != road)
  const roadDistance = distance * 1.2;

  // Estimate duration (assume 60 km/h average)
  const duration = (roadDistance / 60) * 60; // in minutes

  return { distance: roadDistance, duration };
}
```

**Or Use Google Maps Distance Matrix API:**

```javascript
async function getRouteFromGoogle(origin, destination) {
  const url = "https://maps.googleapis.com/maps/api/distancematrix/json";

  const response = await axios.get(url, {
    params: {
      origins: `${origin.lat},${origin.lng}`,
      destinations: `${destination.lat},${destination.lng}`,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  const result = response.data.rows[0].elements[0];

  return {
    distance_km: result.distance.value / 1000,
    duration_minutes: result.duration.value / 60,
  };
}
```

**Hybrid Approach (Smart):**

```javascript
async function getRoute(from, to) {
  // 1. Check if route exists in database
  let route = await db("tod_one_way_trip_routes")
    .where({ from_location_id: from.id, to_location_id: to.id })
    .first();

  if (route) {
    return route; // Use cached data
  }

  // 2. Not in DB? Calculate dynamically
  const calculated = await getRouteFromGoogle(from, to);

  // 3. Save for future use
  await db("tod_one_way_trip_routes").insert({
    from_location_id: from.id,
    to_location_id: to.id,
    distance_km: calculated.distance_km,
    duration_minutes: calculated.duration_minutes,
    created_at: new Date(),
  });

  return calculated;
}
```

---

## 🏙️ **8. SUPPLIER MULTI-CITY OPERATIONS**

### **How Suppliers Operate in Multiple Cities:**

**Table: `tod_suppliers`**

```javascript
supplier = {
  supplier_id: 10,
  company_name: "XYZ Cabs Pvt Ltd",
  headquarters: "Mumbai",

  // Multi-city operations
  operational_cities: [1, 5, 8, 12], // City IDs: Mumbai, Delhi, Bangalore, Pune

  // Or stored as JSON
  city_operations: [
    {
      city_id: 1,
      city_name: "Mumbai",
      fleet_count: 50,
      office_address: "Andheri West",
      manager_name: "Rajesh",
      manager_phone: "+919876543210",
      is_active: true,
    },
    {
      city_id: 5,
      city_name: "Delhi",
      fleet_count: 30,
      office_address: "Connaught Place",
      manager_name: "Amit",
      manager_phone: "+919123456780",
      is_active: true,
    },
  ],
};
```

**Supplier-City Mapping Table:**

```javascript
// Table: tod_supplier_cities
{
  supplier_id: 10,
  city_id: 1, // Mumbai
  fleet_count: 50,
  office_location: "Andheri West",
  is_active: true,
  commission_rate: 20 // City-specific commission
}
```

**How It Works in Booking Flow:**

```javascript
// Customer books: Mumbai Airport → Pune
booking = {
  pickup_city_id: 1, // Mumbai
  drop_city_id: 12, // Pune
};

// Find suppliers operating in Mumbai
const availableSuppliers = await db("tod_supplier_cities")
  .where({
    city_id: 1, // Mumbai
    is_active: true,
  })
  .join("tod_suppliers", "tod_suppliers.id", "tod_supplier_cities.supplier_id")
  .where("tod_suppliers.has_available_vehicles", true);

// Assign to best supplier
```

---

### **City-Specific Amenities**

**Why City-Specific?**

Different cities have different requirements:

```javascript
// Mumbai - Coastal city, monsoon issues
mumbai_amenities = [
  { name: "Child Seat", price: 300 },
  { name: "WiFi", price: 200 },
  { name: "Umbrella", price: 50 }, // Monsoon special
  { name: "Raincoat", price: 30 },
  { name: "Mobile Charger", price: 50 },
];

// Delhi - Extreme temperatures
delhi_amenities = [
  { name: "Child Seat", price: 300 },
  { name: "WiFi", price: 200 },
  { name: "Air Purifier", price: 500 }, // Pollution
  { name: "Neck Pillow", price: 100 },
  { name: "Cooler Box", price: 150 }, // Summer heat
];

// Goa - Tourist destination
goa_amenities = [
  { name: "Child Seat", price: 300 },
  { name: "WiFi", price: 200 },
  { name: "Beach Umbrella", price: 100 },
  { name: "Cooler Box", price: 150 },
  { name: "Tourist Guide", price: 1000 }, // Local guide
];
```

**Implementation:**

**Table: `tod_city_amenities`**

```javascript
{
  city_id: 1, // Mumbai
  amenity_id: 10,
  amenity_name: "Umbrella",
  price: 50,
  is_active: true,
  seasonal: true, // Only during monsoon
  season_start: "06-01", // June 1
  season_end: "09-30"    // Sept 30
}
```

**Booking Flow:**

```javascript
// Customer selects Mumbai → Pune trip
GET /api/web/amenities?city_id=1

// Response:
[
  { id: 1, name: "Child Seat", price: 300 },
  { id: 2, name: "WiFi", price: 200 },
  { id: 10, name: "Umbrella", price: 50 } // Mumbai-specific!
]

// Customer selects amenities
booking.amenities = [
  { amenity_id: 1, quantity: 1, price: 300 },
  { amenity_id: 10, quantity: 2, price: 100 } // 2 umbrellas
]

total_amenities = 400;
```

---

## 📂 **9. WHY DUPLICATE FILES? (payment.js, common folder, etc.)**

Great observation! Here's why:

### **The Architecture:**

```
todapi (Port 5050)      todbooking (Port 5051)
     |                           |
     |                           |
  [Master Data]            [Booking Engine]
  [User Management]        [Payment Processing]
  [Settings]               [Quote Generation]
```

**Reason for Duplication:**

#### **1. Microservices Architecture**

Each service is **independent**:

```javascript
// todapi can run alone
// todbooking can run alone
// They don't share code at runtime

// If payment.js was shared via npm package:
- More complex deployment
- Version conflicts
- One change affects both services

// Duplicating is simpler:
- Each service is self-contained
- Deploy independently
- No version conflicts
```

#### **2. Different Payment Flows**

```javascript
// todapi/common/payment.js
// Handles:
- Wallet top-ups
- Refunds for cancelled bookings
- Supplier settlements
- Agent credit payments

// todbooking/common/payment.js
// Handles:
- New booking payments
- Payment link generation
- Real-time payment verification
- Booking confirmation after payment
```

**They look similar but have subtle differences:**

```javascript
// todapi/common/payment.js
async function processRefund(bookingId, amount) {
  // Complex refund logic
  // Check cancellation policy
  // Calculate refund amount
  // Process to Razorpay
  // Update wallet if needed
}

// todbooking/common/payment.js
async function createPaymentLink(booking) {
  // Generate payment link
  // Send to customer
  // Set expiry
  // Listen for webhook
}
```

#### **3. Common Folder Explanation**

**Common folder** = Shared utilities within that service

```
todapi/
  common/
    helpers.js        → Auth, JWT, validations for todapi
    payment.js        → Payment utils for todapi routes
    emailTemplates.js → Email generation for todapi
    query.js          → Dynamic query builder
    cron.js           → Scheduled jobs

todbooking/
  common/
    helpers.js        → Auth, JWT for todbooking
    payment.js        → Payment utils for booking routes
    emailTemplates.js → Booking-specific emails
```

**Why not one shared common folder?**

```javascript
// If shared:
project/
  common/          ← Both services import from here
    payment.js
  todapi/
  todbooking/

// Problems:
1. Tight coupling - changes affect both
2. Deployment complexity - both must deploy together
3. Import path issues
4. Breaking changes in one service breaks other
```

**Current approach:**

```javascript
// Each service is independent
// Can deploy todapi without touching todbooking
// Can update payment.js in one without affecting other

// Example:
// todapi adds refund feature
// todbooking unaffected

// todbooking adds cryptocurrency
// todapi unaffected
```

#### **4. When Would You Share Code?**

**Option A: NPM Package (Enterprise)**

```bash
# Create shared package
packages/
  tod-common/
    package.json
    payment.js
    helpers.js

# Install in both
cd todapi && npm install @tod/common
cd todbooking && npm install @tod/common
```

**Option B: Monorepo (Modern)**

```bash
# Use lerna or nx
tod-monorepo/
  packages/
    common/
    todapi/
    todbooking/
```

**Current approach is simpler for small teams!**

---

## 🎮 **10. CONTROLLERS, ROUTES, MODELS - MVC Pattern**

### **How MVC is Organized:**

```
API Request Flow:
Browser/App → Route → Controller → Model → Database
              ↓         ↓           ↓
           Validate  Business    Query
                     Logic
```

### **Example: Creating a Booking**

#### **Step 1: Route (`routes/admin/booking.js`)**

```javascript
const express = require("express");
const router = express.Router();
const bookingController = require("../../controller/admin/booking");
const { authenticateAdminJwt } = require("../../common/helpers");
const { validateBooking } = require("../../validation/booking");

// Define route
router.post(
  "/create",
  authenticateAdminJwt, // Middleware 1: Check if user logged in
  validateBooking, // Middleware 2: Validate request data
  bookingController.create // Controller: Handle request
);

module.exports = router;
```

**Route's Job:**

- ✅ Define URL pattern (`/api/admin/booking/create`)
- ✅ Apply middleware (auth, validation)
- ✅ Connect to controller function

---

#### **Step 2: Validation (`validation/booking.js`)**

```javascript
const Joi = require("joi");

const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    customer_id: Joi.number().required(),
    pickup_location: Joi.string().required(),
    drop_location: Joi.string().required(),
    pickup_date: Joi.date().required(),
    pickup_time: Joi.string().required(),
    vehicle_type_id: Joi.number().required(),
    passenger_count: Joi.number().min(1).max(8),
    amenities: Joi.array().items(Joi.number()),
    // ... more fields
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: 0,
      message: error.details[0].message,
    });
  }

  next(); // Validation passed, proceed to controller
};
```

**Validation's Job:**

- ✅ Check required fields
- ✅ Validate data types
- ✅ Return error if invalid
- ✅ Call `next()` if valid

---

#### **Step 3: Controller (`controller/admin/booking.js`)**

```javascript
const bookingModel = require("../../model/booking");
const paymentHelper = require("../../common/payment");
const emailHelper = require("../../common/emailTemplates");

class BookingController {
  async create(req, res) {
    try {
      // 1. Extract data
      const bookingData = req.body;
      const adminId = req.user.id; // From JWT token

      // 2. Business logic
      // Calculate price
      const pricing = await calculatePrice(bookingData);

      // Check supplier availability
      const supplier = await findAvailableSupplier(bookingData);
      if (!supplier) {
        return res.status(400).json({
          status: 0,
          message: "No suppliers available for this route",
        });
      }

      // 3. Call model to save
      const result = await bookingModel.createBooking({
        ...bookingData,
        ...pricing,
        supplier_id: supplier.id,
        created_by: adminId,
      });

      if (!result.success) {
        return res.status(500).json({
          status: 0,
          message: result.message,
        });
      }

      // 4. Post-creation tasks
      const booking = result.data;

      // Generate payment link
      if (booking.payment_status === "pending") {
        const paymentLink = await paymentHelper.createPaymentLink(booking);
        await bookingModel.updatePaymentLink(booking.id, paymentLink);
      }

      // Send emails
      await emailHelper.sendBookingConfirmation(booking);
      await emailHelper.sendSupplierNotification(booking, supplier);

      // 5. Return response
      return res.status(200).json({
        status: 1,
        message: "Booking created successfully",
        result: {
          booking_id: booking.booking_id,
          payment_link: booking.payment_link,
          amount: booking.total_amount,
        },
      });
    } catch (error) {
      console.error("Booking creation error:", error);
      return res.status(500).json({
        status: 0,
        message: "Failed to create booking",
        error: error.message,
      });
    }
  }

  async getBookingDetails(req, res) {
    // ... another controller method
  }

  async cancelBooking(req, res) {
    // ... another controller method
  }
}

module.exports = new BookingController();
```

**Controller's Job:**

- ✅ Handle HTTP request
- ✅ Business logic (pricing, availability checks)
- ✅ Call model methods
- ✅ Handle errors
- ✅ Send HTTP response
- ✅ Orchestrate multiple operations

---

#### **Step 4: Model (`model/booking.js`)**

```javascript
const knex = require("../config/database");
const TABLE_NAME = process.env.TOD_PREFIX + "customer_booking";

class BookingModel {
  async createBooking(data) {
    try {
      // Database transaction
      const booking = await knex.transaction(async (trx) => {
        // 1. Insert booking
        const [bookingId] = await trx(TABLE_NAME)
          .insert({
            booking_id: this.generateBookingID(),
            customer_id: data.customer_id,
            pickup_location: data.pickup_location,
            drop_location: data.drop_location,
            pickup_date: data.pickup_date,
            pickup_time: data.pickup_time,
            vehicle_type_id: data.vehicle_type_id,
            supplier_id: data.supplier_id,
            base_amount: data.base_amount,
            tax_amount: data.tax_amount,
            total_amount: data.total_amount,
            status: "active",
            payment_status: "pending",
            assignment_status: "unassigned",
            created_by: data.created_by,
            created_at: new Date(),
          })
          .returning("id");

        // 2. Insert amenities (if any)
        if (data.amenities && data.amenities.length > 0) {
          const amenityRecords = data.amenities.map((amenity) => ({
            booking_id: bookingId,
            amenity_id: amenity.id,
            quantity: amenity.quantity,
            price: amenity.price,
          }));

          await trx("tod_booking_amenities").insert(amenityRecords);
        }

        // 3. Update supplier availability
        await trx("tod_suppliers")
          .where({ id: data.supplier_id })
          .decrement("available_vehicles", 1);

        // 4. Return complete booking
        return await trx(TABLE_NAME).where({ id: bookingId }).first();
      });

      return {
        success: true,
        message: "Booking created",
        data: booking,
      };
    } catch (error) {
      console.error("Model error:", error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async getBookingById(id) {
    try {
      const booking = await knex(TABLE_NAME)
        .where({ id })
        .whereNull("deleted_at") // Soft delete check
        .first();

      if (!booking) {
        return { success: false, message: "Booking not found" };
      }

      // Join related data
      booking.customer = await this.getCustomer(booking.customer_id);
      booking.supplier = await this.getSupplier(booking.supplier_id);
      booking.driver = await this.getDriver(booking.driver_id);
      booking.amenities = await this.getBookingAmenities(booking.id);

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  generateBookingID() {
    // TOD20251106001
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    return `TOD${year}${month}${day}${random}`;
  }

  // ... more methods
}

module.exports = new BookingModel();
```

**Model's Job:**

- ✅ Database queries (INSERT, SELECT, UPDATE, DELETE)
- ✅ Data transformations
- ✅ Transactions
- ✅ Return data to controller
- ✅ **No business logic!** (that's controller's job)

---

### **Separation of Concerns:**

```javascript
// ❌ BAD: Controller doing database queries
async create(req, res) {
  const booking = await knex('tod_customer_booking').insert(...);
  // Controller should NOT touch database directly!
}

// ✅ GOOD: Controller calls model
async create(req, res) {
  const result = await bookingModel.createBooking(data);
  // Controller delegates database work to model
}

// ❌ BAD: Model doing business logic
async createBooking(data) {
  if (user.isVIP) { discount = 20; }  // Business logic in model!
  return await knex('bookings').insert(data);
}

// ✅ GOOD: Model only handles data
async createBooking(data) {
  // Just database operations, no business decisions
  return await knex('bookings').insert(data);
}
```

---

## 📝 Summary

This document covers the deep technical aspects of TravelODesk:

1. **Pricing Engine** - Complex multi-factor pricing with routes, taxes, discounts, surcharges
2. **Role Hierarchy** - Drivers, Agents (Travel/Hotel/Corporate/Tour), API Users
3. **Settlement System** - Supplier payout workflow
4. **Communication** - Email (Gmail API/Nodemailer), SMS (Twilio/BhashSMS)
5. **Booking Workflow** - Quote generation, assignment, MVC architecture

For setup instructions, see `SETUP_GUIDE.md`.
For architecture overview, see `PROJECT_OVERVIEW.md`.
