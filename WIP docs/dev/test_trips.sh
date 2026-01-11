#!/bin/bash

# TravelODesk Trip API Test Script
# Tests all 4 trip types with various pickup/dropoff combinations

BASE_URL="http://localhost:5051/api/web"
PICKUP_DATE="2025-11-28%2010:00"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get API key for place lookups
API_KEY=$(grep MAP_API_KEY /Users/vedan/Projects/travelodesk/todbooking/.env | cut -d'=' -f2 | tr -d ' ')

# Function to get place_id from Google
get_place_id() {
    local search="$1"
    local encoded=$(echo "$search" | sed 's/ /%20/g')
    curl -s "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encoded}&inputtype=textquery&fields=place_id,name&key=${API_KEY}" | jq -r '.candidates[0].place_id // empty'
}

# Function to test an endpoint
test_endpoint() {
    local trip_type="$1"
    local endpoint="$2"
    local pickup="$3"
    local dropoff="$4"
    local pickup_name="$5"
    local dropoff_name="$6"
    local extra_params="$7"
    
    echo -e "\n${YELLOW}Testing: ${pickup_name} → ${dropoff_name}${NC}"
    
    local url="${BASE_URL}/${endpoint}?pickUp=${pickup}&dropOff=${dropoff}&pickUpDate=${PICKUP_DATE}${extra_params}"
    local response=$(curl -s -X GET "$url" 2>&1)
    
    local status=$(echo "$response" | jq -r '.status // -1')
    local message=$(echo "$response" | jq -r '.message // "Error"')
    local car_count=$(echo "$response" | jq -r '.result | length // 0')
    
    if [ "$status" == "1" ] && [ "$car_count" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $car_count vehicles found"
        local first_price=$(echo "$response" | jq -r '.result[0].total_amount_text // "N/A"')
        echo "   First vehicle price: $first_price"
        return 0
    elif [ "$status" == "1" ] && [ "$car_count" == "0" ]; then
        echo -e "${RED}⚠️  NO VEHICLES${NC} - API success but 0 cars returned"
        return 1
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $status, Message: $message"
        # Show error details
        local error=$(echo "$response" | jq -r '.error[0].message // empty')
        if [ -n "$error" ]; then
            echo "   Error: $error"
        fi
        return 2
    fi
}

# Known place_ids (pre-fetched for speed)
declare -A PLACES=(
    # Delhi locations
    ["IGI_Airport"]="ChIJiS0q_IUbDTkRne1DLBh2874"
    ["India_Gate"]="ChIJC03rqdriDDkRXT6SJRGXFwc"
    ["Old_Delhi_Railway"]="ChIJwSB8tw_9DDkR7hEXIffLm78"
    ["Connaught_Place"]="ChIJuxhUZQD9DDkRuXrT3SAxptY"
    ["Taj_Mahal_Delhi"]="ChIJj36fnUPmDDkRwz2k6hRtfr0"  # Taj Palace Hotel
    ["Noida_Sector_18"]="ChIJdztnLqTmDDkRJJuP9WNIaWc"
    ["Gurgaon_Cyber_City"]="ChIJB9--0_LlDDkRq4--6fZQ8TI"
    
    # Goa locations  
    ["Dabolim_Airport"]="ChIJTfgMjPrHvzsRV3U0LSIp1Lc"
    ["Mopa_Airport"]="ChIJu8f0v06NvzsR9t72TNCgghs"
    ["Panaji"]="ChIJ2cxhM6nAvzsRYb7lJAsSmN0"
    ["Calangute_Beach"]="ChIJvxSZThDCvzsRlY5nYSB1iEE"
    
    # Mumbai locations
    ["Mumbai_Airport"]="ChIJdeT0mN3H5zsRFwbvlPgqYuk"
    ["Gateway_India"]="ChIJgTkMxO3O5zsRAZGSvy2cS9w"
    ["Bandra"]="ChIJ7_d7n7y85zsRo0TA_Hs5dq8"
    
    # Bangalore locations
    ["Bangalore_Airport"]="ChIJy0sKqjFRrjsRYUpjlULLn-Q"
    ["MG_Road_Bangalore"]="ChIJpzXHkKAWrjsRtLhaGOwvWCM"
    
    # Jaipur locations
    ["Jaipur_Airport"]="ChIJwwRmgqbRljkR_pGzZA3KWtI"
    ["Hawa_Mahal"]="ChIJkWn_dU5pljkRyShIxzX-RIE"
    
    # Inter-city destinations
    ["Agra"]="ChIJv8a-SlEICTkRfIRnPMGLlsU"
    ["Mathura"]="ChIJ8Y28GI0HCTURL-bL0UYQ8mw"
)

echo "========================================"
echo "  TravelODesk Trip API Test Suite"
echo "========================================"
echo "Base URL: $BASE_URL"
echo "Pickup Date: 2025-11-28 10:00"
echo ""

# Track results
PASS=0
FAIL=0
NO_VEHICLES=0

# ========================================
# 1. AIRPORT TRANSFER TESTS
# ========================================
echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   1. AIRPORT TRANSFER TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Test 1.1: IGI Airport → India Gate
test_endpoint "Airport" "airport/carList" "${PLACES[IGI_Airport]}" "${PLACES[India_Gate]}" "IGI Airport" "India Gate" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.2: IGI Airport → Old Delhi Railway Station
test_endpoint "Airport" "airport/carList" "${PLACES[IGI_Airport]}" "${PLACES[Old_Delhi_Railway]}" "IGI Airport" "Old Delhi Railway Station" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.3: IGI Airport → Connaught Place
test_endpoint "Airport" "airport/carList" "${PLACES[IGI_Airport]}" "${PLACES[Connaught_Place]}" "IGI Airport" "Connaught Place" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.4: India Gate → IGI Airport (reverse)
test_endpoint "Airport" "airport/carList" "${PLACES[India_Gate]}" "${PLACES[IGI_Airport]}" "India Gate" "IGI Airport" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.5: Goa Dabolim Airport → Panaji
test_endpoint "Airport" "airport/carList" "${PLACES[Dabolim_Airport]}" "${PLACES[Panaji]}" "Dabolim Airport (Goa)" "Panaji" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.6: Goa Mopa Airport → Calangute Beach
test_endpoint "Airport" "airport/carList" "${PLACES[Mopa_Airport]}" "${PLACES[Calangute_Beach]}" "Mopa Airport (Goa)" "Calangute Beach" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.7: Mumbai Airport → Gateway of India
test_endpoint "Airport" "airport/carList" "${PLACES[Mumbai_Airport]}" "${PLACES[Gateway_India]}" "Mumbai Airport" "Gateway of India" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 1.8: Bangalore Airport → MG Road
test_endpoint "Airport" "airport/carList" "${PLACES[Bangalore_Airport]}" "${PLACES[MG_Road_Bangalore]}" "Bangalore Airport" "MG Road" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# ========================================
# 2. ONE WAY TRIP TESTS
# ========================================
echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   2. ONE WAY TRIP TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Test 2.1: Delhi (Connaught Place) → Agra
test_endpoint "OneWay" "oneway/carList" "${PLACES[Connaught_Place]}" "${PLACES[Agra]}" "Connaught Place (Delhi)" "Agra" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.2: IGI Airport → Agra
test_endpoint "OneWay" "oneway/carList" "${PLACES[IGI_Airport]}" "${PLACES[Agra]}" "IGI Airport" "Agra" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.3: Delhi → Mathura
test_endpoint "OneWay" "oneway/carList" "${PLACES[India_Gate]}" "${PLACES[Mathura]}" "India Gate (Delhi)" "Mathura" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.4: Delhi → Jaipur
test_endpoint "OneWay" "oneway/carList" "${PLACES[Connaught_Place]}" "${PLACES[Hawa_Mahal]}" "Connaught Place (Delhi)" "Hawa Mahal (Jaipur)" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.5: Delhi → Noida
test_endpoint "OneWay" "oneway/carList" "${PLACES[Connaught_Place]}" "${PLACES[Noida_Sector_18]}" "Connaught Place" "Noida Sector 18" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.6: Delhi → Gurgaon
test_endpoint "OneWay" "oneway/carList" "${PLACES[India_Gate]}" "${PLACES[Gurgaon_Cyber_City]}" "India Gate" "Gurgaon Cyber City" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.7: Mumbai Gateway → Bandra
test_endpoint "OneWay" "oneway/carList" "${PLACES[Gateway_India]}" "${PLACES[Bandra]}" "Gateway of India" "Bandra" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 2.8: Jaipur Airport → Hawa Mahal
test_endpoint "OneWay" "oneway/carList" "${PLACES[Jaipur_Airport]}" "${PLACES[Hawa_Mahal]}" "Jaipur Airport" "Hawa Mahal" ""
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# ========================================
# 3. LOCAL TRIP TESTS (single location)
# ========================================
echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   3. LOCAL TRIP TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Local trips only need pickUp, not dropOff
test_local() {
    local pickup="$1"
    local pickup_name="$2"
    
    echo -e "\n${YELLOW}Testing Local Trip: ${pickup_name}${NC}"
    
    local url="${BASE_URL}/local_trip/carList?pickUp=${pickup}&pickUpDate=${PICKUP_DATE}"
    local response=$(curl -s -X GET "$url" 2>&1)
    
    local status=$(echo "$response" | jq -r '.status // -1')
    local message=$(echo "$response" | jq -r '.message // "Error"')
    local car_count=$(echo "$response" | jq -r '.result | length // 0')
    
    if [ "$status" == "1" ] && [ "$car_count" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $car_count vehicles found"
        return 0
    elif [ "$status" == "1" ] && [ "$car_count" == "0" ]; then
        echo -e "${RED}⚠️  NO VEHICLES${NC} - API success but 0 cars returned"
        return 1
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $status, Message: $message"
        local error=$(echo "$response" | jq -r '.error[0].message // empty')
        if [ -n "$error" ]; then
            echo "   Error: $error"
        fi
        return 2
    fi
}

# Test 3.1-3.8: Local trips in various cities
test_local "${PLACES[India_Gate]}" "India Gate (Delhi)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[Connaught_Place]}" "Connaught Place (Delhi)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[IGI_Airport]}" "IGI Airport (Delhi)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[Panaji]}" "Panaji (Goa)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[Gateway_India]}" "Gateway of India (Mumbai)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[MG_Road_Bangalore]}" "MG Road (Bangalore)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[Hawa_Mahal]}" "Hawa Mahal (Jaipur)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

test_local "${PLACES[Agra]}" "Agra"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# ========================================
# 4. ROUND TRIP TESTS
# ========================================
echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   4. ROUND TRIP TESTS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Round trips need return date
RETURN_DATE="2025-11-30%2018:00"

test_roundtrip() {
    local pickup="$1"
    local dropoff="$2"
    local pickup_name="$3"
    local dropoff_name="$4"
    
    echo -e "\n${YELLOW}Testing: ${pickup_name} ↔ ${dropoff_name}${NC}"
    
    local url="${BASE_URL}/round_trip/carList?pickUp=${pickup}&dropOff=${dropoff}&pickUpDate=${PICKUP_DATE}&returnDate=${RETURN_DATE}"
    local response=$(curl -s -X GET "$url" 2>&1)
    
    local status=$(echo "$response" | jq -r '.status // -1')
    local message=$(echo "$response" | jq -r '.message // "Error"')
    local car_count=$(echo "$response" | jq -r '.result | length // 0')
    
    if [ "$status" == "1" ] && [ "$car_count" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $car_count vehicles found"
        local first_price=$(echo "$response" | jq -r '.result[0].total_amount_text // "N/A"')
        echo "   First vehicle price: $first_price"
        return 0
    elif [ "$status" == "1" ] && [ "$car_count" == "0" ]; then
        echo -e "${RED}⚠️  NO VEHICLES${NC} - API success but 0 cars returned"
        return 1
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $status, Message: $message"
        local error=$(echo "$response" | jq -r '.error[0].message // empty')
        if [ -n "$error" ]; then
            echo "   Error: $error"
        fi
        return 2
    fi
}

# Test 4.1: Delhi ↔ Agra Round Trip
test_roundtrip "${PLACES[Connaught_Place]}" "${PLACES[Agra]}" "Connaught Place (Delhi)" "Agra"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.2: IGI Airport ↔ Agra Round Trip
test_roundtrip "${PLACES[IGI_Airport]}" "${PLACES[Agra]}" "IGI Airport" "Agra"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.3: Delhi ↔ Jaipur Round Trip
test_roundtrip "${PLACES[India_Gate]}" "${PLACES[Hawa_Mahal]}" "India Gate (Delhi)" "Hawa Mahal (Jaipur)"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.4: Delhi ↔ Mathura Round Trip
test_roundtrip "${PLACES[Connaught_Place]}" "${PLACES[Mathura]}" "Connaught Place" "Mathura"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.5: Mumbai ↔ Bandra Round Trip (within city)
test_roundtrip "${PLACES[Gateway_India]}" "${PLACES[Bandra]}" "Gateway of India" "Bandra"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.6: Goa Dabolim ↔ Panaji Round Trip
test_roundtrip "${PLACES[Dabolim_Airport]}" "${PLACES[Panaji]}" "Dabolim Airport" "Panaji"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.7: Jaipur Airport ↔ Hawa Mahal Round Trip
test_roundtrip "${PLACES[Jaipur_Airport]}" "${PLACES[Hawa_Mahal]}" "Jaipur Airport" "Hawa Mahal"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# Test 4.8: Bangalore Airport ↔ MG Road Round Trip
test_roundtrip "${PLACES[Bangalore_Airport]}" "${PLACES[MG_Road_Bangalore]}" "Bangalore Airport" "MG Road"
result=$?; [ $result -eq 0 ] && ((PASS++)) || ([ $result -eq 1 ] && ((NO_VEHICLES++)) || ((FAIL++)))

# ========================================
# SUMMARY
# ========================================
echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   TEST SUMMARY${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL + NO_VEHICLES))
echo -e "${GREEN}✅ Passed:      $PASS${NC}"
echo -e "${RED}❌ Failed:      $FAIL${NC}"
echo -e "${YELLOW}⚠️  No Vehicles: $NO_VEHICLES${NC}"
echo "─────────────────────────────"
echo "   Total:       $TOTAL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Some tests failed! Check the errors above.${NC}"
    exit 1
elif [ $NO_VEHICLES -gt 0 ]; then
    echo -e "${YELLOW}Some routes have no vehicles configured.${NC}"
    echo "This might be expected if rates aren't set up for those cities."
    exit 0
else
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
fi
