# API Users Refactoring: Separating API Users from Agents

**Date**: November 30, 2025  
**Status**: ✅ Implemented & Tested

---

## The Problem

### Two Separate Type Systems Were Causing Confusion

The codebase had two different "type" systems that were often conflated:

| Concept        | Table        | Column       | Purpose                         |
| -------------- | ------------ | ------------ | ------------------------------- |
| **Rule Type**  | `tod_groups` | `rule_type`  | Defines USER ROLE (permissions) |
| **Agent Type** | `tod_agents` | `agent_type` | Defines AGENT BUSINESS TYPE     |

### Rule Types (in `tod_groups`)

These determine what a user CAN DO in the system:

| rule_type | Role              | Description                   |
| --------- | ----------------- | ----------------------------- |
| 0         | Super Admin       | Full system access            |
| 1         | Admin             | Staff/backoffice              |
| 2         | Agent             | B2B travel agents             |
| 3         | Supplier          | Service providers             |
| 4         | Driver            | Drivers assigned by suppliers |
| 5         | Individual Driver | Independent drivers           |
| 6         | Customer          | B2C customers                 |
| 7         | API User          | API integration partners      |

### Agent Types (in `tod_agents`)

These describe what KIND OF BUSINESS an agent runs:

| agent_type | Business Type              |
| ---------- | -------------------------- |
| 1          | Travel Agent Admin         |
| 2          | Hotel Admin                |
| 3          | Airline Admin              |
| 4          | Tour Operator              |
| 5          | Corporate                  |
| 6          | Corporate Partner          |
| 7          | API User ← **PROBLEMATIC** |

### The Core Issue

**API Users were stored in `tod_agents` with `agent_type=7`**, but:

1. **They're NOT agents** - They're third-party integration partners (OTAs, corporate portals)
2. **`agent_type` was meant for business types (1-6)**, not roles
3. **The agent model had to exclude them**: `.whereNot('agent_type', 7)`
4. **Duplicate meaning**: `agent_type=7` AND `rule_type=7` both meant "API User"
5. **Wrong fields**: API users need API keys, rate limits, webhooks - not travel agent fields
6. **Complex authentication**: Passport strategy queried agent fields for non-agent entities

### Visual Representation

```
BEFORE (Problematic):
┌─────────────────────────────────────────────────────────────┐
│                       tod_agents                             │
├─────────────────────────────────────────────────────────────┤
│ agent_type=1: Travel Agent   (needs: credit, discounts)    │
│ agent_type=2: Hotel          (needs: hotel_type)            │
│ agent_type=3: Airline        (needs: iata_number)           │
│ agent_type=4: Tour Operator  (needs: routes, packages)      │
│ agent_type=5: Corporate      (needs: employee portal)       │
│ agent_type=6: Corporate Partner                              │
│ agent_type=7: API User       ← DOESN'T BELONG HERE!         │
│               (needs: api_key, rate_limits, webhooks)        │
└─────────────────────────────────────────────────────────────┘
```

---

## The Solution

### Separate API Users Into Their Own Table

Created a dedicated `tod_api_users` table with API-specific fields.

```
AFTER (Clean Separation):
┌─────────────────────────────────────────────────────────────┐
│                       tod_agents                             │
├─────────────────────────────────────────────────────────────┤
│ Travel Agents, Hotels, Airlines, Tour Operators, etc.       │
│ Business-focused fields: credit, discounts, addresses       │
│ References tod_agent_types lookup table                      │
└─────────────────────────────────────────────────────────────┘
                         ↕ Separate concerns
┌─────────────────────────────────────────────────────────────┐
│                      tod_api_users                           │
├─────────────────────────────────────────────────────────────┤
│ OTAs (MakeMyTrip, Goibibo), Corporate Portals, White-label  │
│ API-focused fields: api_key, rate_limits, webhooks, scopes  │
└─────────────────────────────────────────────────────────────┘
```

### Created Agent Types Lookup Table

No more magic numbers! Created `tod_agent_types` to document business types:

```sql
SELECT * FROM tod_agent_types;

 id |       name        |      code       |          description
----+-------------------+-----------------+--------------------------------
  1 | Travel Agent Admin| TRAVEL_AGENT    | Traditional travel agencies
  2 | Hotel Admin       | HOTEL           | Hotels offering ground transport
  3 | Airline Admin     | AIRLINE         | Airlines offering ground transfers
  4 | Tour Operator     | TOUR_OPERATOR   | Tour package companies
  5 | Corporate         | CORPORATE       | Corporations with travel needs
  6 | Corporate Partner | CORPORATE_PARTNER| Corporate partnership programs
```

---

## Files Changed

### New Files

| File                                           | Purpose                                |
| ---------------------------------------------- | -------------------------------------- |
| `migrations/20251130131540_tod_api_users.js`   | Creates `tod_api_users` table          |
| `migrations/20251130131541_tod_agent_types.js` | Creates `tod_agent_types` lookup table |
| `seeders/21.agent_types.js`                    | Seeds agent type definitions           |

### Modified Files

| File                          | Changes                                               |
| ----------------------------- | ----------------------------------------------------- |
| `model/apiuser.js`            | Completely rewritten to use `tod_api_users` table     |
| `config/passport.js`          | Updated `jwtApiUser` strategy to query new table      |
| `model/agent.js`              | Removed `.whereNot('agent_type', 7)` filter           |
| `routevalidations/apiuser.js` | Updated validations for new table structure           |
| `.env`                        | Added `TOD_API_USERS` and `TOD_AGENT_TYPES` variables |

---

## New `tod_api_users` Table Structure

The new table has API-specific fields that were never available before:

### API Configuration

- `api_key` - The actual API key/token
- `api_key_prefix` - First few chars for display (e.g., "tod_live_abc...")
- `api_key_expires_at` - Optional expiration date
- `rate_limit_per_minute` - Default: 60
- `rate_limit_per_day` - Default: 10,000

### Webhook Support

- `webhook_url` - URL to receive event notifications
- `webhook_secret` - Secret for signing webhook payloads
- `webhook_events` - Array of events to notify (e.g., `['booking.created', 'booking.cancelled']`)

### Security

- `ip_whitelist` - Array of allowed IPs
- `scopes` - Array of permissions (e.g., `['search', 'book', 'cancel']`)

### Billing

- `billing_type` - 'per_booking', 'monthly', or 'prepaid'
- `commission_percent` - Commission on bookings
- `markup_percent` - Markup on rates

### Environment

- `is_sandbox` - Test mode flag

### Usage Statistics

- `last_api_call_at` - Timestamp of last API call
- `total_api_calls` - Total API calls made

---

## Authentication Flow Changes

### Before

```javascript
// passport.js - jwtApiUser strategy
// Queried tod_agents table with all agent fields
let ifAgent = await knex("tod_agents")
  .select([...agentColumns]) // 40+ columns, most irrelevant
  .where("id", userData.agent_id)
  .first();
```

### After

```javascript
// passport.js - jwtApiUser strategy
// Queries dedicated tod_api_users table
let apiUser = await knex("tod_api_users")
  .select([...apiUserColumns]) // Only relevant API fields
  .where("user_id", user_id)
  .first();

// Also checks API key expiration
if (
  apiUser.api_key_expires_at &&
  new Date(apiUser.api_key_expires_at) < new Date()
) {
  return done({ message: "API key has expired" }, false);
}

// Tracks API usage
knex("tod_api_users")
  .where({ id: apiUser.api_user_id })
  .update({
    last_api_call_at: new Date(),
    total_api_calls: knex.raw("COALESCE(total_api_calls, 0) + 1"),
  });
```

---

## Benefits of This Refactoring

1. **Clean Separation of Concerns**
   - Agents are for B2B travel partners
   - API Users are for third-party integrations
2. **API-Specific Features**

   - Rate limiting
   - Webhook notifications
   - IP whitelisting
   - Scopes/permissions
   - Sandbox mode

3. **Better Query Performance**

   - No more `WHERE agent_type != 7` filters
   - Smaller, focused tables

4. **Proper Documentation**

   - Agent types are now in a lookup table
   - No more magic numbers in code

5. **Future Extensibility**
   - Easy to add more API features
   - Can add versioning, API keys rotation, etc.

---

## Migration Path for Existing API Users

Since there were **0 API users** in the system (`agent_type=7` count was 0), no data migration was needed.

If there were existing API users, migration script would:

1. Read from `tod_agents WHERE agent_type = 7`
2. Transform and insert into `tod_api_users`
3. Optionally delete from `tod_agents`

---

## Testing Checklist

- [x] Create new API user through admin portal
- [x] Verify API key is generated correctly
- [ ] Test API authentication with X-todAPI-Key header
- [ ] Verify rate limiting works
- [ ] Test API user update
- [ ] Test API user delete
- [x] Verify regular agents still work correctly
- [x] Test agent listing (should not include API users)
- [x] Grant API access to existing user (link mode)
- [x] Duplicate prevention works correctly

---

## Related Documentation

- `WIP/PROJECT_OVERVIEW.md` - Overall project structure
- `WIP/PROJECT_DETAILS.md` - Detailed role hierarchy explanation

---

## Enhanced Design: API Access as a Capability

### Implementation (Phase 2)

After the initial refactoring, we enhanced the design to treat **API access as a capability** that can be granted to ANY user, not just new users.

### Two Modes of Creating API Users

**Mode 1: Create New API User (Default)**

```json
POST /api/apiuser
{
  "link_existing_user": false,  // or omit this field
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@newcompany.com",
  "mobile_number": "9876543210",
  "country_code": "+91",
  "country_id": "91",
  "company_name": "New Integration Partner"
}
```

This:

- Creates new record in `tod_users`
- Creates new record in `tod_api_users`
- Assigns "API User" role (rule_type=7)
- Returns API key

**Mode 2: Grant API Access to Existing User**

```json
POST /api/apiuser
{
  "link_existing_user": true,
  "email": "existing.agent@company.com",  // Must match existing user
  "company_name": "Agent's API Integration"
}
```

Or by user ID:

```json
POST /api/apiuser
{
  "link_existing_user": true,
  "existing_user_id": "uuid-of-existing-user",
  "email": "user@company.com",
  "company_name": "Integration Name"
}
```

This:

- Finds existing user in `tod_users`
- Creates `tod_api_users` record linked to existing user
- ADDS "API User" role (doesn't remove existing roles)
- Returns API key

### Response Differences

**New User Response:**

```json
{
  "status": 1,
  "message": "API User created successfully",
  "result": {
    "id": "api-user-uuid",
    "refid": "APIA0001",
    "user_id": "new-user-uuid",
    "is_linked_user": false,
    "api_key": "tod_live_...",
    "api_key_prefix": "tod_live_..."
  }
}
```

**Linked User Response:**

```json
{
  "status": 1,
  "message": "API access granted to existing user successfully",
  "result": {
    "id": "api-user-uuid",
    "refid": "APIA0002",
    "user_id": "existing-user-uuid",
    "is_linked_user": true,
    "api_key": "tod_live_...",
    "api_key_prefix": "tod_live_..."
  }
}
```

### Key Benefits

1. **Flexibility**: Existing agents can now use API without creating duplicate accounts
2. **Clean Separation**: User identity separate from API capability
3. **Role Stacking**: User can be Agent + API User simultaneously
4. **Industry Standard**: Matches how Stripe, Twilio, etc. handle API access

### Validation Changes

- `first_name`, `last_name`, `mobile_number`, `country_code`, `country_id` are only required for NEW users
- `email` is always required (used to identify existing user or create new one)
- `company_name` is always required (for API user record)

### Files Modified for This Enhancement

- `routevalidations/apiuser.js`: Added `link_existing_user` and `existing_user_id` fields, made user fields optional when linking
- `model/apiuser.js`: Updated `addApiUser()` to handle both modes

---

## Implementation Details

### Key Bug Fixes During Implementation

#### 1. Joi Default Value Timing Issue

**Problem**: When using Joi's `.default(false)` on `link_existing_user`, the default value is only applied AFTER all validations complete. During external validation, accessing `helpers.prefs.context.body.link_existing_user` returned `undefined`.

**Solution**: Changed all occurrences from:

```javascript
const linkExisting = helpers.prefs.context.body.link_existing_user;
```

To:

```javascript
const linkExisting = helpers.prefs.context.body.link_existing_user === true;
```

This treats `undefined` as `false`, matching the intended default behavior.

#### 2. Missing File Schema

**Problem**: Route referenced `schemas.apiUserFileSchema` but it wasn't defined in the validation file, causing "Unknown validation error".

**Solution**: Added empty file schema:

```javascript
apiUserFileSchema: Joi.object().keys({
  logo: Joi.any().optional().external(async (value, helpers) => {
    // Optional logo upload handling
  }),
}),
```

#### 3. Foreign Key Constraint on agent_id

**Problem**: Original implementation tried to update `tod_users.agent_id` to point to the new API user ID, but `agent_id` has a foreign key constraint to `tod_agents`.

**Solution**: Removed the unnecessary `agent_id` update. The relationship is already established through `tod_api_users.user_id -> tod_users.id`. To check if a user has API access:

```sql
SELECT * FROM tod_api_users WHERE user_id = ?
```

### Validation Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /api/admin/apiUser                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              link_existing_user = true?                      │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          │ YES                                │ NO (default)
          ▼                                    ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ LINK MODE               │    │ CREATE MODE                  │
│ - Email MUST exist      │    │ - Email must NOT exist       │
│ - User must NOT have    │    │ - All user fields required   │
│   API access already    │    │   (name, mobile, etc.)       │
│ - User fields optional  │    │ - Creates new tod_users row  │
└─────────────────────────┘    └─────────────────────────────┘
          │                                    │
          └──────────────┬─────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Create tod_api_users record                     │
│              - Generate API key (tod_live_xxx)               │
│              - Set rate limits, scopes, etc.                 │
│              - Link to user_id                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Add API User role (rule_type=7)                 │
│              - Check if role already exists                  │
│              - Don't duplicate if linking existing user      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Return API key (only shown once!)               │
└─────────────────────────────────────────────────────────────┘
```

### Model Logic (addApiUser)

```javascript
// Determine mode
const linkExisting = req.body.link_existing_user === true;
const existingUser = req.existingUser || null; // Set by validation

let userId;
let isNewUser = false;

if (linkExisting && existingUser) {
  // Mode 1: Link existing user (found by email)
  userId = existingUser.id;
  isNewUser = false;
} else if (linkExisting && req.body.existing_user_id) {
  // Mode 1 (alt): Link existing user (by ID)
  userId = req.body.existing_user_id;
  isNewUser = false;
} else {
  // Mode 2: Create new user
  userId = uuid();
  isNewUser = true;
}

// Create user record only if new
if (isNewUser) {
  await trx(TOD_USERS).insert({ id: userId, ... });
}

// Always create API user record
await trx(TOD_API_USERS).insert({
  user_id: userId,
  api_key: generateApiKey(),
  ...
});

// Add API User role (if not already assigned)
const existingRole = await trx(TOD_USER_GROUP_MAPS)
  .where({ user_id: userId, group_id: apiUserGroup.id })
  .first();

if (!existingRole) {
  await trx(TOD_USER_GROUP_MAPS).insert({ user_id, group_id: apiUserGroup.id });
}
```

### API Key Format

```
Production: tod_live_<48 hex chars>
Sandbox:    tod_test_<48 hex chars>

Example: tod_live_fd3c6b80fca792c2b6eae13e99212abe458a4181bc098d34
Prefix:  tod_live_fd3...  (shown in UI for identification)
```

---

## Testing Results (November 30, 2025)

| Test Case                     | Payload                                            | Expected                   | Result  |
| ----------------------------- | -------------------------------------------------- | -------------------------- | ------- |
| Create new API user           | `{first_name, email, ...}`                         | Creates user + API access  | ✅ PASS |
| Link existing agent           | `{link_existing_user: true, email: "agent@..."}`   | Grants API access to agent | ✅ PASS |
| Duplicate email (create mode) | `{email: "existing@..."}`                          | Error with helpful message | ✅ PASS |
| Already has API access        | `{link_existing_user: true, email: "apiuser@..."}` | Error: already has access  | ✅ PASS |
| List API users                | GET /apiUser                                       | Shows all API users        | ✅ PASS |

### Test API Users Created

| RefID    | Name         | Email                     | Type            |
| -------- | ------------ | ------------------------- | --------------- |
| APIA0002 | Test APIUser | test.apiuser@example.com  | New user        |
| APIA0003 | Demo Agent   | demoagent@travelodesk.com | Linked existing |

---

## Future Enhancements

1. **API Key Rotation**: Allow regenerating API keys without losing access
2. **Multiple API Keys**: Support multiple keys per user (production/staging)
3. **Usage Dashboard**: Show API call statistics, rate limit usage
4. **Webhook Management**: UI for managing webhook subscriptions
5. **Scope Management**: Fine-grained permission control via scopes
6. **IP Whitelist UI**: Manage allowed IPs through admin portal
