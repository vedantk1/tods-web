# 🚀 TravelODesk - Complete Setup Guide

**Date Created:** November 6, 2025  
**Environment:** Local Development (LOC)

---

## 📋 Prerequisites Check

### ✅ Installed

- ✅ Node.js: **v24.4.1** (Project requires v18.16.0, but v24 should work)
- ✅ npm: **11.4.2**

### ❌ Need to Install

- ❌ PostgreSQL - **Not installed**

---

## 🔧 Step 1: Install PostgreSQL

### Option A: Using Homebrew (Recommended)

```bash
# Install PostgreSQL 14
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Add to PATH (add to ~/.zshrc for permanent)
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
psql --version
```

### Option B: Using Postgres.app

1. Download from: https://postgresapp.com/
2. Drag to Applications
3. Open Postgres.app
4. Click "Initialize" to create a new server

---

## 🗄️ Step 2: Setup Database

### Create Database & User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Inside psql:
CREATE DATABASE travelodesk;

# Set password for postgres user
ALTER USER postgres WITH PASSWORD 'todpostgres123';

# Verify database created
\l

# Connect to the database
\c travelodesk

# Exit psql
\q
```

---

## 📦 Step 3: Install Dependencies

### Project Structure

```
travelodesk/
├── todapi/       → Main API (Port 5050)
├── todbooking/   → Booking API (Port 5051)
├── todweb/       → Customer Website (Port 3060)
└── todop/        → Admin Panel (Port 3070)
```

### Install All Packages

```bash
# Navigate to project root
cd /Users/vedan/Projects/travelodesk

# Install todapi dependencies
cd todapi
npm install

# Install todbooking dependencies
cd ../todbooking
npm install

# Install todweb dependencies
cd ../todweb
npm install

# Install todop dependencies
cd ../todop
npm install
```

**Note:** Each `npm install` will take 2-5 minutes depending on your internet speed.

---

## 🔐 Step 4: Configure Environment Variables

### TODAPI Configuration

The `.env` file is already configured at:
`/Users/vedan/Projects/travelodesk/todapi/.env`

**Key Settings:**

```properties
# Database (already configured)
PORT = 5050
DB_HOST = localhost
DB_USER = postgres
DB_PASSWORD = todpostgres123
DB_DATABASE = travelodesk

# JWT Secrets (already configured)
JWT_SECRET = djnfklnkrdfre

# Payment Gateways (Test Mode)
RAZORPAY_DEV_KEY_ID = rzp_test_BOI1NG0Q7QDdKY
PAYPAL_MODE = sandbox
```

### TODBOOKING Configuration

Already configured at:
`/Users/vedan/Projects/travelodesk/todbooking/.env`

```properties
PORT = 5051
# Same database as todapi
DB_DATABASE = travelodesk
```

### TODWEB & TODOP Configuration

Need to check if `.env` files exist or need to be created.

---

## 🏗️ Step 5: Database Migrations

### What are Migrations?

Migrations create the database schema (all 80+ tables).

### Run TODAPI Migrations

```bash
cd /Users/vedan/Projects/travelodesk/todapi

# Run all migrations
npm run migrate

# You should see output like:
# Batch 1 run: 25 migrations
# ✅ tod_users
# ✅ tod_customer_registration
# ✅ tod_suppliers
# ... etc
```

**If migration fails:**

```bash
# Check database connection
npm run migrate

# If error about database not existing:
createdb travelodesk

# If error about password:
# Make sure postgres user password is 'todpostgres123'
psql postgres
ALTER USER postgres WITH PASSWORD 'todpostgres123';
```

### Run TODBOOKING Migrations

```bash
cd /Users/vedan/Projects/travelodesk/todbooking

# Run migrations
npm run migrate
```

---

## 🌱 Step 6: Seed Database

### What is Seeding?

Seeds populate initial data like:

- Admin users
- Permissions
- Master settings
- Default currencies
- Vehicle types

### Run TODAPI Seeds

```bash
cd /Users/vedan/Projects/travelodesk/todapi

# Seed the database
npm run seed

# You should see:
# Seeding tod_master_permissions
# Seeding tod_groups
# Seeding tod_users
# ... etc
```

**Default Admin Credentials (check seeders for actual values):**

- Email: `admin@travelodesk.com` (or similar)
- Password: `admin123` (or similar)

---

## 🚀 Step 7: Start All Servers

### You'll need 4 terminal windows/tabs

### Terminal 1: TODAPI (Main API)

```bash
cd /Users/vedan/Projects/travelodesk/todapi
npm run dev

# You should see:
# Server running on port 5050
# Database connected
# ✓ Ready!
```

**Test it:**

```bash
# In another terminal:
curl http://localhost:5050/api/health
```

### Terminal 2: TODBOOKING (Booking API)

```bash
cd /Users/vedan/Projects/travelodesk/todbooking
npm run dev

# You should see:
# Server running on port 5051
```

**Test it:**

```bash
curl http://localhost:5051/api/health
```

### Terminal 3: TODWEB (Customer Website)

```bash
cd /Users/vedan/Projects/travelodesk/todweb
npm run dev

# You should see:
# ℹ Listening on: http://localhost:3060/
# ✓ Ready in X seconds
```

**Access it:**
Open browser: http://localhost:3060

### Terminal 4: TODOP (Admin Panel)

```bash
cd /Users/vedan/Projects/travelodesk/todop
npm run dev

# You should see:
# ℹ Listening on: http://localhost:3070/
```

**Access it:**
Open browser: http://localhost:3070

---

## 🔍 Step 8: Verify Everything Works

### 1. Check APIs are Running

```bash
# Check todapi
curl http://localhost:5050/api/health

# Check todbooking
curl http://localhost:5051/api/health
```

### 2. Check Frontend Apps

- **Customer Website:** http://localhost:3060
- **Admin Panel:** http://localhost:3070

### 3. Check Database

```bash
psql -U postgres -d travelodesk

# Inside psql:
\dt    # List all tables (should see 80+ tables)
SELECT COUNT(*) FROM tod_users;  # Should have at least 1 admin user
\q
```

---

## 📝 Environment Modes

The project supports 3 PRODUCTION_MODE values:

### LOC (Local) - What You're Using Now

```bash
# Default when running npm run dev
PRODUCTION_MODE=loc npm run dev
```

**Characteristics:**

- Database: localhost
- Payment: Test mode (Razorpay test keys)
- Emails: Disabled or logged to console
- SMS: Disabled

### DEV (Development/Staging Server)

```bash
PRODUCTION_MODE=dev npm start
```

**Used on:** Staging server (`3.231.139.201`)

### LIVE (Production)

```bash
PRODUCTION_MODE=live npm start
```

**Used on:** Production server (`52.3.173.30`)

---

## 🖥️ Server Deployment

### Staging Server

| Property            | Value                 |
| ------------------- | --------------------- |
| **IP Address**      | `3.231.139.201`       |
| **SSH Key**         | `~/.ssh/todstage.pem` |
| **SSH User**        | `ubuntu`              |
| **PRODUCTION_MODE** | `dev`                 |
| **Code Location**   | `/var/www/`           |

**URLs:**

- API: `https://todsapi.travelodesk.com`
- Website: `https://todsweb.travelodesk.com`
- Admin: `https://todsops.travelodesk.com`
- Booking API: `https://todsbook.travelodesk.com`

**SSH Access:**

```bash
ssh -i ~/.ssh/todstage.pem ubuntu@3.231.139.201
```

**Deploy to Staging:**

```bash
# 1. Push dev to stg branch
git push origin dev:stg

# 2. SSH to staging server
ssh -i ~/.ssh/todstage.pem ubuntu@3.231.139.201

# 3. Pull latest code for all apps
cd /var/www/todapi
git pull origin stg

cd /var/www/todbooking
git pull origin stg

cd /var/www/todweb
git pull origin stg

cd /var/www/todop
git pull origin stg

# 4. Install dependencies (if package.json changed)
cd /var/www/todapi
npm install

cd /var/www/todbooking
npm install

cd /var/www/todweb
npm install

cd /var/www/todop
npm install

# 5. Run migrations if needed
cd /var/www/todapi
source ~/.nvm/nvm.sh
npx knex migrate:latest

cd /var/www/todbooking
npx knex migrate:latest

# 6. Rebuild frontend apps
cd /var/www/todweb
npm run build

cd /var/www/todop
npm run build

# 7. Restart all PM2 processes
pm2 restart all

# 8. Verify deployment
pm2 status
pm2 logs --lines 50
```

````

### Live/Production Server

| Property            | Value                 |
| ------------------- | --------------------- |
| **IP Address**      | `52.3.173.30`         |
| **SSH Key**         | `~/.ssh/todstage.pem` |
| **SSH User**        | `ubuntu`              |
| **PRODUCTION_MODE** | `live`                |
| **Code Location**   | `/var/www/`           |

**URLs:**

- API: `https://api.travelodesk.com`
- Website: `https://travelodesk.com`
- Admin: `https://ops.travelodesk.com`
- Booking API: `https://bapi.travelodesk.com`

**SSH Access:**

```bash
ssh -i ~/.ssh/todstage.pem ubuntu@52.3.173.30
````

### PM2 Process Manager

Both servers use PM2 with 4 processes:

| Process           | Port | Description      |
| ----------------- | ---- | ---------------- |
| `tod-api`         | 5050 | Main API         |
| `tod-booking-api` | 5051 | Booking API      |
| `TOD Web`         | 3060 | Customer Website |
| `TOD admin`       | 3070 | Admin Panel      |

**Common PM2 Commands:**

```bash
pm2 status           # Check status
pm2 restart all      # Restart all
pm2 logs             # View logs
pm2 logs tod-api     # View specific logs
```

### Branch Strategy

| Branch | Environment | Server          |
| ------ | ----------- | --------------- |
| `main` | Production  | `52.3.173.30`   |
| `stg`  | Staging     | `3.231.139.201` |
| `dev`  | Development | Local           |

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error

**Error:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql@14

# Or restart
brew services restart postgresql@14
```

### Migration Failed

**Error:**

```
Error: relation "tod_users" already exists
```

**Solution:**

```bash
# Rollback all migrations
npm run unmigrate

# Run again
npm run migrate
```

### Port Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::5050
```

**Solution:**

```bash
# Find process using port 5050
lsof -ti:5050

# Kill the process
kill -9 $(lsof -ti:5050)

# Or use a different port in .env
PORT=5055
```

### Node Version Warning

**Warning:**

```
Node.js version mismatch. Expected v18.16.0, got v24.4.1
```

**Solution:**

```bash
# Install nvm (Node Version Manager)
brew install nvm

# Install Node v18.16.0
nvm install 18.16.0

# Use it for this project
nvm use 18.16.0

# Set as default
nvm alias default 18.16.0
```

### npm install Fails

**Error:**

```
npm ERR! code ERESOLVE
```

**Solution:**

```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Or force
npm install --force
```

---

## 📚 Next Steps

### 1. Explore Admin Panel

1. Open http://localhost:3070
2. Login with seeded admin credentials
3. Explore:
   - Dashboard
   - Users
   - Suppliers
   - Fleets
   - Routes
   - Bookings

### 2. Explore Customer Website

1. Open http://localhost:3060
2. Try:
   - Register as customer
   - Search for routes
   - View vehicle types
   - Create enquiry

### 3. Test API Endpoints

```bash
# Get all vehicle types (public)
curl http://localhost:5050/api/web/vehicles/types

# Login as admin (get JWT token)
curl -X POST http://localhost:5050/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@travelodesk.com",
    "password": "admin123"
  }'

# Use token for authenticated requests
curl http://localhost:5050/api/admin/users/list \
  -H "Authorization: Bearer <token_here>"
```

### 4. Understand the Code

Read the documentation:

- `/WIP/PROJECT_OVERVIEW.md` - High-level architecture
- `/WIP/PROJECT_DETAILS.md` - Deep dive into features

---

## 🛠️ Common Development Commands

### TODAPI / TODBOOKING

```bash
# Development (auto-restart on changes)
npm run dev

# Production mode
npm start

# Database migrations
npm run migrate          # Run all pending migrations
npm run migrate-single   # Run one migration
npm run unmigrate        # Rollback all migrations

# Database seeds
npm run seed             # Run all seeds
npm run seed-single      # Run specific seed
```

### TODWEB / TODOP

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production build
npm run start

# Generate static site
npm run generate
```

---

## 📊 Database Schema

After migrations, you'll have:

**Core Tables:**

- `tod_users` - All system users
- `tod_customer_registration` - Customers
- `tod_customer_booking` - Bookings
- `tod_suppliers` - Fleet providers
- `tod_agents` - Agents/partners
- `tod_drivers` - Drivers

**Master Data:**

- `tod_fleets_master` - Vehicle master
- `tod_vehicle_types` - Car types
- `tod_operational_cities` - Service areas
- `tod_currencies` - Multi-currency

**Pricing:**

- `tod_one_way_trip_routes` - One-way routes & rates
- `tod_round_trip_routes` - Round trip rates
- `tod_local_trip_routes` - Hourly packages
- `tod_airport_one_way_routes` - Airport transfers

**Transactions:**

- `tod_transaction_history` - Payments
- `tod_wallet` - Customer wallets
- `tod_settlement` - Supplier payouts

View all tables:

```bash
psql -U postgres -d travelodesk -c "\dt"
```

---

## 🔐 Security Notes

### For Local Development:

- ✅ Test payment keys are safe to use
- ✅ Weak JWT secrets are fine locally
- ✅ Simple database passwords OK

### NEVER in Production:

- ❌ Don't use test payment keys in live mode
- ❌ Don't commit `.env` files to Git
- ❌ Don't use weak passwords
- ❌ Don't expose API keys

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs** - Look at terminal output for errors
2. **Check database** - Verify tables exist and have data
3. **Check ports** - Make sure no conflicts (5050, 5051, 3060, 3070)
4. **Read docs** - Check `/WIP/PROJECT_OVERVIEW.md` and `/WIP/PROJECT_DETAILS.md`

---

## ✅ Setup Checklist

- [ ] PostgreSQL installed
- [ ] Database `travelodesk` created
- [ ] todapi dependencies installed
- [ ] todbooking dependencies installed
- [ ] todweb dependencies installed
- [ ] todop dependencies installed
- [ ] todapi migrations run
- [ ] todbooking migrations run
- [ ] todapi seeds run
- [ ] todapi running on port 5050
- [ ] todbooking running on port 5051
- [ ] todweb running on port 3060
- [ ] todop running on port 3070
- [ ] Can access admin panel at http://localhost:3070
- [ ] Can access customer site at http://localhost:3060

---

**Happy Coding! 🎉**
