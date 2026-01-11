Below is the Markdown version of `Consolidated details.pdf`, converted without intentionally omitting or redacting any content.

````markdown
# Travelodesk Comprehensive Project Documentation

This document consolidates **all information** from the three source documents:

- `Travelodesk – details.docx`
- `TOD_API.docx`
- `TOD support document.docx`

No information has been removed or redacted – even sensitive credentials and configuration details have been kept intact. The material is grouped into logical sections for clarity, but every bullet, link and note from the original documents is included verbatim or paraphrased for readability. Use this as the single source of truth when developing or maintaining the Travelodesk platform.

---

## 1. TOD API

The TOD API is built with **Node.js**, **Express.js** and **Knex.js**. The following subsections summarise the technologies and dependencies used, including detailed descriptions of many third-party packages.

### 1.1 Technologies

- **Node.js** (version unspecified) – JavaScript runtime environment.
- **Express.js** (version `4.18.2`) – web application framework for Node.js.
- **Knex.js** (version `2.4.2`) – SQL query builder supporting PostgreSQL, CockroachDB, MSSQL, MySQL, MariaDB, SQLite3, Better-SQLite3, Oracle and Amazon Redshift.

### 1.2 Requirements

The following npm packages are required by the API. Versions from the original `package.json` are listed for completeness:

- `@everapi/freecurrencyapi-js` `^1.0.1`
- `@google-cloud/local-auth` `^2.1.0`
- `airport-info` `^1.0.4`
- `axios` `^1.6.7`
- `body-parser` `^1.20.1`
- `cookie-parser` `^1.4.6`
- `cors` `^2.8.5`
- `country-list-json` `^1.1.0`
- `country-state-city` `^3.2.1`
- `dotenv` `^16.0.3`
- `exceljs` `^4.4.0`
- `express` `^4.18.2`
- `express-async-handler` `^1.2.0`
- `express-promise-router` `^4.1.1`
- `express-validator` `^6.15.0`
- `googleapis` `^105.0.0`
- `haversine-distance` `^1.2.3`
- `joi` `^17.7.0`
- `jsonwebtoken` `^9.0.0`
- `knex` `^2.4.2`
- `language-list` `0.0.3`
- `lodash` `^4.17.21`
- `moment` `^2.29.4`
- `moment-timezone` `^0.5.45`
- `multer` `^1.4.5-lts.1`
- `node-cron` `^3.0.3`
- `nodemailer` `^6.9.8`
- `passport` `^0.6.0`
- `passport-jwt` `^4.0.1`
- `passport-local` `^1.0.0`
- `pdf-creator-node` `^2.3.5`
- `pg` `^8.9.0`
- `q` `^1.5.1`
- `razorpay` `^2.9.4`
- `sharp` `^0.27.2`
- `signale` `^1.4.0`
- `twilio` `^5.2.2`
- `util` `^0.12.5`
- `uuidv4` `^6.2.13`

**Dev dependencies**

- `nodemon` `^2.0.20`

### 1.3 Package descriptions

The API uses a large number of external modules. The descriptions below preserve the original wording as much as possible:

- **Pg (PostgreSQL)** – a popular Node.js library for interacting with PostgreSQL databases.

- **airport-info** – fetches information about airports worldwide. It allows:

  - lookup of airports by **IATA** code (3-letter code),
  - lookup of airports by **ICAO** code (4-letter code),
  - search by city,
  - find nearest airports by coordinates,
  - access to comprehensive airport data.

- **Axios** – a powerful promise-based HTTP library for making network requests in Node.js and browsers. It supports multiple HTTP request methods: `GET`, `POST`, `PUT`, `DELETE`.

- **body-parser** – crucial middleware in Node.js used for processing incoming HTTP request bodies, transforming raw request data into a structured JavaScript object that can be easily accessed in web applications. It:

  - parses incoming request bodies from various content types,
  - converts request data into JavaScript objects,
  - makes parsed data available via `req.body`,
  - supports multiple data formats including JSON, URL-encoded form data, raw text and multi-part data.

- **cors** – CORS (Cross-Origin Resource Sharing) is a security mechanism that controls how web pages in one domain can request and interact with resources from another domain in web applications.

- **country-list-json** – a comprehensive collection of country data that can be easily integrated into Node.js applications for various purposes like form validation, dropdown menus and geographical information processing.

- **country-state-city** – a comprehensive Node.js library for managing geographical data, providing detailed information about countries, states and cities worldwide.

- **dotenv** – Node.js module that allows you to load environment variables from a `.env` file into your application, providing a secure and flexible way to manage configuration settings.

- **ExcelJS** – JavaScript library for reading, manipulating and writing Excel spreadsheets (`.xlsx` format) in Node.js applications.

- **Lodash** – JavaScript utility library that provides helper functions for common programming tasks. It simplifies working with arrays, objects, strings and other data types through a consistent API.

- **Moment** – JavaScript library designed to simplify the manipulation and formatting of dates and times. It provides a comprehensive set of features that allow you to parse, validate, manipulate and display dates in a user-friendly manner.

- **moment-timezone** – an extension of the Moment.js library that allows you to parse, manipulate and display dates and times in any time zone. It is particularly useful for applications that require accurate handling of dates across different geographical locations, especially when considering daylight-saving time changes.

- **haversine-distance** – used to calculate the great-circle distance between two points on a sphere (like Earth) given their latitudes and longitudes.

- **Joi** – powerful JavaScript schema-validation library for Node.js that allows developers to create robust data-validation rules for various data types and structures.

- **UUID / uuidv4** – 128-bit unique identifiers that can be generated to create virtually guaranteed unique strings across different systems and applications. They are particularly useful for:
  - hiding sequential database IDs,
  - creating unique identifiers in distributed systems,
  - preventing ID collisions.

---

## 2. Travelodesk details

This section compiles all of the content from `Travelodesk – details.docx`, including communications, login credentials, domain details, payment gateway information, design references and trip logic. Entries are kept in the order they originally appeared.

### 2.1 Initial communications and domain

- **Primary contact:** `skumar@travelodesk.com`

- **Design reference request**

  > Please share reference sites for the design of the website.

  Skumar provided the following Google Sheets link:

  - <https://docs.google.com/spreadsheets/d/1NNyBVH4mYZ1gRa9Sscm4SgnpsRyIXIUjM2GeWX1Ifhg/edit?usp=sharing>

  Access was requested and granted.

- **Domain configuration**

  Travelodesk will host only:

  - `www.travelodesk.com`

  Both `www.travelodesk.in` and `www.travelodesk.co.in` are to be forwarded to the `.com` domain. Skumar confirmed this arrangement.

- **Project email**

  A new email address has been created:

  - `tdp@zasya.online`

  Use this email to send any communication for this project. `skumar@travelodesk.com` is associated, and **Varaprasad**, **Lakshmi** and **Ramesh** will receive email sent there.

- **Cloudflare access**

  - URL: <https://dash.cloudflare.com/login>
  - Email: `support@travelodesk.com`
  - Password: `Mickey123@`

### 2.2 Items requested by Skumar

Skumar requested the following details:

1. Travel o desk – Ops Center login credentials
2. API from booking.com – login credentials to explore current fleet-management and booking-management system
3. Current AWS details for DB access
4. Google Map API details
5. SMTP gateway to test email services
6. SMS gateway
7. WhatsApp API
8. PayPal payment gateway details
9. Razorpay payment gateway details
10. Logo and colour patterns to start the UI/UX design

Each of these items is addressed below.

#### 2.2.1 Ops Center credentials

- Link: <https://ops.travelodesk.com/logout>
  - ID: `skumar@travelodesk.in`
  - Password: `tisha123@`

There is also an alternate login:

- Link: <https://ops.travelodesk.com/logout>
  - ID: `tisha@travelodesk.in`
  - Password: `November`

#### 2.2.2 Booking.com API credentials

Travelodesk needs to access Booking.com’s portal for fleet management and booking management.

- Link: <https://portal.taxi.booking.com/>
  - Email: `support@travelodesk.com`
  - Password: `Plasterofparis123@`

#### 2.2.3 AWS credentials for database access

Use the AWS sign-in URL to access the EC2 console:

- <https://signin.aws.amazon.com/signin?redirect_uri=https%3A%2F%2Fus-east-1.console.aws.amazon.com%2Fec2%2Fhome%3Fregion%3Dus-east-1%26state%3DhashArgs%2523Home%253A%26isauthcode%3Dtrue&client_id=arn%3Aaws%3Aiam%3A%3A015428540659%3Auser%2Fec2&forceMobileApp=0&code_challenge=U67XvipY_7N87V_mdxaRk_VvRDwDAWVXkV7FyBGqses&code_challenge_method=SHA-256>

**Root User credentials**

- Email: `skumar@travelodesk.com`
- Password: `Kursi123@`

#### 2.2.4 Google Map API

The Google Map API details were not yet shared at the time of this document; they will be provided later.

#### 2.2.5 SMTP gateway (Gmail OAuth)

To test email services, use the following Gmail account and OAuth credentials:

- Email: `support@travelodesk.com`
- Password: `Cadbury123@`

**OAuth details**

- Client ID:  
  `67876969560-ba9ccjfe5s334jsvel557rm5ci0bsned.apps.googleusercontent.com`

- Client Secret ID:  
  `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`

- Auth code:  
  `4/0AfJohXlArwwk8qj3INnB1LJqiT8kjjVfc5nb0B3Ljufm6PCLobeX2q8CQMu3BJSy0USuHQ`

- Refresh token:  
  `1//04TfuNo71dpFYCgYIARAAGAQSNwF-L9IraFS_Ff-sXubxg9C1A5iwbhcNu9cYVj433_QlAdEGUE16NQKuDoTHl1jLKPx62ScgyEE`

- Access token:  
  `ya29.a0AfB_byDKpgdKW-U6RFoAXHa8ogk-6e5kyJvttoWj3IMyinsMSGwE5bfEnmAaar53j7zm8gcVPROxtuz8XyoGEV_Rb-RhAbOG5AG0xShlvVDoCRoEHH2xeZ-eKXEqyoF28NABISB4h8d6zY_NN7Gy5PerHnTUGDaLPt6MaCgYKAfoSARESFQHGX2MilO5t2kN7u4jXBMGyBwXCcg0171`

#### 2.2.6 SMS gateway

Travelodesk currently does **not** have an SMS gateway; one will need to be purchased.

#### 2.2.7 WhatsApp API

No WhatsApp API is currently available; this must be procured separately.

#### 2.2.8 PayPal payment gateway

The PayPal integration uses the following credentials:

- Client ID:  
  `AR7ryMIGifhnUENlYrEDOb3Bx-Ef_UvH_ieIUyXTthQHO-1bbG9PVOGGPRy-0tdRgoaBOMuAkgXXUlvg`

- Secret:  
  `EJU8m2Shi5GCAGpfc_2kMQjIWH2_NlsaG_Dg2uOuSP8a-ldq_CpcB4OP2HKCmKLxlB9TK9iNd2e8z_qs`

- Email ID: `accounts@travelodesk.in`

#### 2.2.9 Razorpay payment gateway

- Live Key ID: `rzp_live_2haGa0v8YQVKmd`
- Secret:  
  `EJU8m2Shi5GCAGpfc_2kMQjIWH2_NlsaG_Dg2uOuSP8a-ldq_CpcB4OP2HKCmKLxlB9TK9iNd2e8z_qs`
- Email: `accounts@travelodesk.in`
- Password: `Mouse123@`

#### 2.2.10 Logo and colour patterns

There is currently **no approved logo or colour palette**. The team needs to create a new logo.

A link to the Hertz website was provided as a design reference:

- <https://www.sixt.com/>

Use this site to inspire graphic and web-design ideas.

### 2.3 Feed from Sushil Kumar

The following images were provided to illustrate dashboard layouts and user interfaces. These images originate from the `Travelodesk – details` document and are reproduced here as received.

**Dashboard Look**

- Image 1: Car-listing dashboard UI (card grid) used as a design reference.
- Image 2: Trip-performance and vehicle-health analytics dashboard UI.

_(See original document / design assets for exact visuals.)_

### 2.4 Cancellation Policy

If a booking is cancelled **24 hours prior** to the scheduled pick-up time there is **no cancellation fee**. The customer receives a **100% refund**, excluding any bank or payment gateway charges.

If the booking is cancelled **within 24 hours** of the pick-up time or **during the journey**, there is a **100% cancellation fee**.

### 2.5 Adding vehicles and drivers

To add vehicles and drivers through partner portals use the following links and credentials:

- **Transfeero partner portal**

  - URL: <https://partner.transfeero.com/index.php?red=>
  - Login ID: `support@travelodesk.com`
  - Password: `Transfeero123@`

- **Booking.com (airport transfers, adding cities)**

  - URL: <https://portal.taxi.booking.com/>
  - Email: `support@travelodesk.com`
  - Password: `Plasterofparis123@`

- **Mozio provider portal**

  - URL: <https://providers.mozio.com/login>
  - Email: `support@travelodesk.com`
  - Password: `Notebook123@`

- **12Go Asia operator portal**
  - URL: <https://op.12go.asia/>
  - Email: `skumar@travelodesk.com`
  - Password: `ghjcnjq`

### 2.6 Home page design references

Several banner mock-ups and website links were shared to help the designers understand the expected look and feel for the Travelodesk home page.

**Banner 1**

- Taxi landing page design (hero image with large “GO TAXI” text and phone mockup).

**Banner 2**

- Taxi service homepage with large hero image and call-to-action.

**Banner 3**

- Additional taxi homepage design (trip performance / booking focus).

**Banner 4**

- “Taxiar” design – modern hero banner with large photograph and call-to-action.

**Banner 5**

- Taxi website template emphasising call-us phone number and 24-hour service.

**Additional design inspiration**

- Lyft – <https://www.lyft.com/>
- DiDi Global – <https://www.didiglobal.com/>
- Transfeero – <https://www.transfeero.com/en/>
- Gett – <https://www.gett.com/uk/>
- Taxi2Airport – <https://www.taxi2airport.com/en/>
- Ola Cabs – <https://www.olacabs.com/>
- InDrive – <https://indrive.com/en/home/>
- Lonely Planet India – <https://www.lonelyplanet.com/india>
- Airports Taxi Transfers – <https://airportstaxitransfers.com/>

More design references were provided via Pinterest:

- <https://www.pinterest.com/pin/345229127685901485/>
- <https://www.pinterest.com/pin/1050535050555040771/>
- <https://www.pinterest.com/pin/698972804682392406/>
- <https://www.pinterest.com/pin/web-templates--93238654777955188/>
- <https://www.pinterest.com/pin/805862927086976185/>

The **Contact Us / Enquiry** page should be based on the design idea at:

- <https://www.pinterest.com/pin/345229127685901610/>

At the top of the footer, **dynamic rates for popular routes** should be displayed. An illustration showing dynamic route tiles was provided in the original document.

### 2.7 Trip logic

This section reproduces the trip-booking logic that will drive the Travelodesk booking engine.

#### 2.7.1 Airport Transfer

The airport transfer logic calculates fares based on predefined routes. If a requested route is unavailable, the airport transfer logic helps passengers find applicable rates anyway (e.g., using airport-to-city pricing in place of missing point-to-point routes).

Illustration in the original: diagram showing airport transfer trip-flow.

#### 2.7.2 One-way transfer

For **one-way transfers**, Travelodesk will configure routes and their prices.

The fare matrix consists of:

> From City → To City → Vehicle Type → Trip Type (One Way) → Price (All Inclusive)

If a one-way route is not available and a passenger searches for that route, the **Airport Transfer** logic (above) will be used to compute the fare.

#### 2.7.3 Multi-city one-way transfer

Passengers can select multiple one-way trips (from one city to another) and add them together. They can then:

- check the **total amount** for all selected one-way trips and book collectively;
- modify a particular one-way trip;
- remove one of the trips during the process.

Diagram in the original shows multiple city hops accumulating into one itinerary.

#### 2.7.4 Local trip – Business visit

For business visits within a city, the following durations and distance slabs apply (prices are configured per city):

- 4 hours / 40 km
- 5 hours / 50 km
- 8 hours / 80 km
- 10 hours / 100 km
- 12 hours / 120 km

Example given:

- `8 hours / 80 km`
  - Base price: **1500**
  - Extras: charged per km and per hour
  - Tolls & parking fee: **as per actuals**

#### 2.7.5 Local trip – Sightseeing

When booking a sightseeing trip, passengers must supply the following information:

1. Name of city
2. Duration
3. Date of travel
4. Pick-up time
5. Location

A **“Submit Your Enquiry”** form will collect these details.

### 2.8 Vehicle and driver pages

Sample pages for vehicles and drivers can be used for inspiration or integration:

- Vehicle page:  
  <https://www.travelodesk.com/india-taxi/vehicles/vehicles-to-choose>

- Alternate vehicle reference:  
  <https://www.hertz.com/rentacar/vehicleguide/index.jsp?targetPage=vehicleGuideHomeView.jsp&countryCode=IN&category=Car/Sedan>

- Driver page:  
  <https://www.travelodesk.com/safe-driversprofessional-drivers>

- Driver’s form:  
  <https://docs.google.com/document/d/1ftDcVScjzqQYyEeIO0mxWYknT0IbVh9t6QhJBfw9B8Q/edit?usp=sharing>

---

## 3. TOD Support Document

This section mirrors the **TOD support document**, covering live and staging server details, monitoring instructions and example command outputs. Images from the document are referenced to illustrate server states and logs.

### 3.1 Servers and credentials

**Live server URLs**

- OPS Center – `ops.travelodesk.com`
- Web – `travelodesk.com`

**Staging server URLs**

- Admin – `Todsops.travelodesk.com`
- Web – `Todsweb.travelodesk.com`

**Admin credentials**

- User name: `todsa@travelodesk.com`
- Password: `<Qwer@123>`

**API testing endpoints**

- Booking URL: <https://todsbook.travelodesk.com/api> – `BOOKING_URL`
- API URL: <https://todsapi.travelodesk.com/api> – `API_URL`

**API Collection**

- Postman collection link (TravelODesk API):  
  <https://zasyaonline.sharepoint.com/:u:/s/TOD/ET8i6RbtTJhBjHPSInHmHh4BclN5gkk5-kcxE6Gn5l2k8g?e=a7ChQB>

**Server monitoring document**

- Additional monitoring notes:  
  <https://zasyaonline.sharepoint.com/:w:/s/TOD/EZ-ZmxXDWqpJtuCp_yPcPMcB4Uy38YtSUjSB_UfiGJlf5w?e=MmJMhF>

### 3.2 Monitoring and maintenance procedures

The support document outlines a series of checks to keep the servers healthy. All commands below should be run on the appropriate EC2 instance (live or staging) after logging in via SSH.

#### 3.2.1 Check application processes (PM2)

- **Command**

  ```bash
  pm2 status
  ```
````

- **What to check**

  - Ensure all processes are **online**.
  - Check **uptime**, **memory** and **CPU** usage.

- **Logs**

  ```bash
  pm2 log <id>
  # or
  pm2 logs
  ```

  Review application logs for errors or issues. Focus on `-error.log` for critical problems.

- **If a process is failing**

  ```bash
  pm2 restart <id>
  ```

  Then check for runtime errors in the logs or configuration issues.

#### 3.2.2 Verify web server health (NGINX)

- **Command**

  ```bash
  sudo service nginx status
  # or
  sudo systemctl status nginx
  ```

- **What to check**

  - The status should be **active (running)**.
  - Look for recent reload or failure messages in the logs.

- **Logs**

  - `/var/log/nginx/error.log`
  - `/var/log/nginx/access.log`

  Check for errors like `404`, `500`, or connection timeouts.

- **Reload configuration**

  ```bash
  sudo nginx -t       # test config
  sudo service nginx reload
  ```

#### 3.2.3 Database health (PostgreSQL)

- **Command**

  ```bash
  sudo service postgresql status
  # or
  sudo systemctl status postgresql
  ```

- **What to check**

  - The status should be **active (running)**.

- **Logs**

  - `/var/log/postgresql/postgresql.log`

  Review for errors like connection issues, slow queries, or disk-space warnings.

- **Test connection**

  - Use `psql` or a GUI client to ensure queries run as expected.

#### 3.2.4 Resource usage (memory, CPU, disk, swap)

- **Memory**

  ```bash
  free -mh
  ```

  Ensure you have sufficient **free** memory and that swap is not heavily used.

- **CPU**

  ```bash
  top
  # or
  htop
  ```

  Check for processes consuming high CPU.

- **Disk**

  ```bash
  df -h
  ```

  Ensure at least **20–30% free disk space** on critical partitions (`/` or `/var`).

- **Heavy processes**

  ```bash
  ps aux --sort=-%mem | head
  ps aux --sort=-%cpu | head
  ```

#### 3.2.5 Application logs

- **Location**

  - `/var/www/<application>` (common path), or
  - PM2 logs (via `pm2 logs`)

- **What to look for**

  - Syntax errors
  - Missing environment variables
  - Unhandled exceptions

#### 3.2.6 Restart services (if necessary)

- **NGINX**

  ```bash
  sudo service nginx restart
  ```

- **PostgreSQL**

  ```bash
  sudo service postgresql restart
  ```

- **Application (PM2)**

  ```bash
  pm2 restart all
  ```

### 3.3 Accessing the servers via AWS

To perform maintenance or monitoring you must log into AWS and then SSH into the appropriate EC2 instance.

1. Navigate to [https://aws.amazon.com/](https://aws.amazon.com/) and choose **My Account → AWS management console**.

2. Log in with your AWS credentials.

3. In the console home, go to **EC2 → Instance State → Running**. Two instances are listed – one staging and one live.

4. Select an instance and copy its **public IPv4 address**.

5. Use the corresponding `.pem` key file (for example, `todstage.pem`) and SSH into the server:

   ```bash
   ssh -i todstage.pem ubuntu@<public-ip>
   ```

6. Once logged in, check **PM2 status** and **NGINX status** as described earlier.

7. Configuration files are stored under:

   ```bash
   /etc/nginx/sites-available
   ```

   These files define:

   - listen ports,
   - server names,
   - reverse proxy settings for the API and web front-ends.

   Reverse proxies are monitored by PM2.

8. Ensure PostgreSQL is active:

   ```bash
   sudo service postgresql status
   ```

### 3.4 Server monitoring images

The original support document includes several screenshots illustrating typical outputs during monitoring, such as:

- Directory listings and `.pem` key files used for SSH.
- `pm2 status` showing processes like:

  - `TOD Web`
  - `TOD admin`
  - `tod-api`
  - `tod-booking-api`

- `sudo service nginx status` output showing Nginx active (running).
- Nginx site configuration files, e.g.:

  - `api.travelodesk.com` proxying to a Node.js instance,
  - `book.travelodesk.com` proxying to another Node.js port,
  - `ops.travelodesk.com` and `travelodesk.com/www.travelodesk.com` with proxy rules.

- `sudo service postgresql status` showing PostgreSQL active.
- `free -mh` and `df -h` outputs showing memory and disk usage.
- `pm2 log 2` and `pm2 log 3` outputs showing:

  - API error traces (`ERR_HTTP_HEADERS_SENT`, etc.),
  - Example URL hits, static asset paths, language and currency API responses.

These screenshots provide real-world examples of the commands and outputs referenced above, making it easier to verify expected behaviour during maintenance tasks.

---

## 4. Closing notes

This consolidated documentation contains **every piece of information** from the three provided documents. Credentials, API keys, environment variables, UI/UX references, payment-gateway details and server-monitoring procedures are all recorded without omission.

As this document is intended to be the **definitive reference for Travelodesk developers**, handle it with care and store it securely. Keep in mind that some information, such as API keys and passwords, may need to be rotated or updated periodically.

```

```
