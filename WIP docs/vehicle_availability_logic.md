## Vehicle Availability Logic - Complete Breakdown

### 🔍 Primary Checks (in order)

| Step | Check                  | Error Message                           | Description                                            |
| ---- | ---------------------- | --------------------------------------- | ------------------------------------------------------ |
| 1    | Country Supported      | TOD unable to operate from this country | Country must be configured in tod_country              |
| 2    | City Not Excluded      | TOD unable to pick up from this city    | City must NOT be in tod_excluded_cities                |
| 3    | Operational City Match | (Silent - falls to next check)          | Pickup city matches an entry in tod_operational_cities |
| 4    | District Fallback      | (If city not found, checks district)    | If city not operational, checks if district is         |

---

### 🎯 The Two Pricing Paths

Once the operational city is found, there are two ways vehicles can be returned:

#### Path 1: Fixed Route Price (Trip 1 only)

**┌─────────────────────────────────────────────────────────────────┐**

**│  1. Check if a FIXED ROUTE exists in **`tod_one_way_trip_route`   │

**│     - From: operational_city_id                  **               │

**│     - To: destination city name OR place_id      **               │

**│                                                  **               │

**│  2. If route exists & distance <= configured **route distance:   │

**│     → Use fixed prices from **`tod_one_way_trip_price_mapping`    │

**│     → Returns vehicles with those fixed prices   **               │

**└─────────────────────────────────────────────────────────────────┘**

#### Path 2: Distance Band Pricing (fallback, or Trip 2+ always)

**┌─────────────────────────────────────────────────────────────────┐**

**│  1. Calculate distance from operational city **center to:         │

**│     - pickUpDistance = distance to pickup point  **               │

**│     - dropOffDistance = distance to dropoff **point               │

**│                                                  **               │

**│  2. Check `tod_operational_radius` table:        **               │

**│     WHERE operational_city_id = X                **               │

**│     AND radius >= pickUpDistance        ← PICKUP **must be within │

**│     AND distance >= dropOffDistance     ← **DROPOFF must be within│

**│                                                  **               │

**│  3. If within radius:                            **               │

**│     → Use distance band rates from               **               │

**│       `tod_operational_cities_distance_rate`     **               │

**│     → Calculate price using initial_fee + band_1 **+ band_2...    │

**└─────────────────────────────────────────────────────────────────┘**

---

### 📊 The tod_operational_radius Table Structure

| Column              | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| operational_city_id | Links to the operational city                  |
| radius              | Max distance (km) from city center for PICKUP  |
| distance            | Max distance (km) from city center for DROPOFF |

Example Query:

**SELECT** radius **FROM** tod_operational_radius

**WHERE** operational_city_id **=** **'abc123'**

**  **AND** radius **>=** **15**      **-- pickup is 15km from city center

**  **AND** distance **>=** **45**    **-- dropoff is 45km from city center



## Complete Answer: What Determines Vehicle Availability

Based on my investigation, here's the complete decision tree for whether vehicles will be found:

**┌─────────────────────────────────────────────────────────────────────────────┐**

**│                    VEHICLE AVAILABILITY DECISION **TREE                       │

**├─────────────────────────────────────────────────────────────────────────────┤**

**│                                                  **                           │

**│  Step 1: COUNTRY CHECK                           **                           │

**│  ├─ Is pickup country in `tod_country`? → NO → **"Unable to operate"         │

**│  └─ YES ↓                                        **                           │

**│                                                  **                           │

**│  Step 2: EXCLUDED CITY CHECK                     **                           │

**│  ├─ Is city in `tod_excluded_cities`? → YES → **"Unable to operate"          │

**│  └─ NO ↓                                         **                           │

**│                                                  **                           │

**│  Step 3: OPERATIONAL CITY MATCH                  **                           │

**│  ├─ Query: state_code + city_name + route_type **(1=Domestic, 2=Cross, 3=Intl)│

**│  ├─ Found in `tod_operational_cities`? → NO → **Try district fallback         │

**│  └─ YES ↓                                        **                           │

**│                                                  **                           │

**│  Step 4: ROUTE/PRICING CHECK (Trip 1 only)       **                           │

**│  ├─ Is there a FIXED ROUTE in **`tod_one_way_trip_routes`?                    │

**│  │   (matches: operational_city_id AND **(to_city_name OR to_place_id))       │

**│  ├─ YES → Check if route distance >= actual **distance                        │

**│  │   ├─ YES → Get prices from **`tod_one_way_trip_price_mapping`              │

**│  │   └─ NO → Fall through to distance band **pricing                          │

**│  └─ NO → Fall through to distance band pricing   **                           │

**│                                                  **                           │

**│  Step 5: DISTANCE BAND PRICING (fallback or Trip **2+)                        │

**│  ├─ Check `tod_operational_radius`:              **                           │

**│  │   WHERE radius >= pickUpDistance AND distance **>= dropOffDistance         │

**│  ├─ Within radius? → NO → "No supplier found in **this area"                  │

**│  └─ YES → Get rates from **`tod_operational_cities_distance_rate`             **│**

**│                                                  **                           │

**│  Step 6: FLEET CHECK                             **                           │

**│  ├─ Is there a fleet configured for the vehicle **type?                       │

**│  ├─ Does query return `fleet` column as NOT **NULL?                           │

**│  └─ NO → "Vehicles not found in this area"       **                           │

**│                                                  **                           │

**└─────────────────────────────────────────────────────────────────────────────┘**

### Key Tables Involved:

| Table                                | Purpose               | Must Have Data       |
| ------------------------------------ | --------------------- | -------------------- |
| tod_country                          | Supported countries   | ✓                   |
| tod_excluded_cities                  | Cities we don't serve | -                    |
| tod_operational_cities               | Active service cities | ✓                   |
| tod_operational_radius               | Pickup/dropoff limits | ✓                   |
| tod_one_way_trip_routes              | Fixed routes          | Optional             |
| tod_one_way_trip_price_mapping       | Fixed route prices    | ✓ (if route exists) |
| tod_operational_cities_distance_rate | Distance band pricing | ✓                   |
| tod_fleets_master                    | Vehicle fleet details | ✓                   |
| tod_vehicle_types                    | Vehicle categories    | ✓                   |

The Radius Logic Explained:
Delhi Operational Radius:├─ radius: 50km   → Pickup must be within 50km of Delhi center└─ distance: 800km → Dropoff can be up to 800km awayExample:├─ User selects pickup: "New Delhi Railway Station" (5km from center) ✓├─ User selects dropoff: "Agra" (232km from center) ✓└─ Both within limits → Proceed to pricing
