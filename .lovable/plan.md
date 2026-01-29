
# Travel Templates Expansion: 20 → 50+ Templates

## Current State
- **Existing templates**: ~20 (Flight delay, cancellation, lost/delayed/damaged baggage, denied boarding, downgrade, overbooking, package holiday, tour operator, train delay, cruise)
- **Target**: 50+ templates
- **Templates to add**: ~30+

---

## Implementation Approach

Organize templates into modular subcategory files for maintainability:

```
src/data/templates/travel/
├── flightTemplates.ts          (existing + new flight templates)
├── baggageTemplates.ts         (all baggage-related templates)
├── hotelTemplates.ts           (NEW - hotel/accommodation disputes)
├── cruiseTemplates.ts          (NEW - cruise-specific disputes)
├── carRentalTemplates.ts       (NEW - rental car disputes)
├── tourPackageTemplates.ts     (NEW - tours/packages/OTAs)
├── railBusTemplates.ts         (NEW - train/bus/coach disputes)
└── index.ts                    (barrel export)
```

---

## Phase 1: Flight Disputes (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 1 | `flight-schedule-change` | Flight Schedule Change Complaint | Original/new times, acceptability |
| 2 | `flight-missed-connection` | Missed Connection Compensation | Connecting flight details, rebooking |
| 3 | `airline-strike-disruption` | Airline Strike Disruption Claim | Strike type, alternative arrangements |
| 4 | `denied-boarding-volunteers` | Denied Boarding (Volunteered) Compensation | Volunteer benefits, fulfillment |
| 5 | `airline-refund-delay` | Airline Refund Delay Complaint | Refund request date, payment status |
| 6 | `airline-voucher-refund` | Airline Voucher to Cash Refund | Voucher details, cash conversion |

---

## Phase 2: Hotel & Accommodation (+10 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 7 | `hotel-booking-cancellation` | Hotel Booking Cancellation Refund | Cancellation date, policy terms |
| 8 | `hotel-overbooking` | Hotel Overbooking Compensation | Alternative accommodation, costs |
| 9 | `hotel-room-not-as-described` | Hotel Room Not As Described | Room type booked vs provided |
| 10 | `hotel-cleanliness-complaint` | Hotel Cleanliness/Hygiene Complaint | Issues found, photos, health concerns |
| 11 | `hotel-facilities-unavailable` | Hotel Facilities Unavailable | Advertised vs actual amenities |
| 12 | `hotel-hidden-fees` | Hotel Hidden Fees Dispute | Unexpected charges, resort fees |
| 13 | `hotel-noise-complaint` | Hotel Noise/Disturbance Complaint | Type of disturbance, room change |
| 14 | `hotel-safety-concern` | Hotel Safety/Security Issue | Safety issue details, incident report |
| 15 | `hotel-early-checkout-refund` | Hotel Early Checkout Refund | Reason for early departure, nights unused |
| 16 | `airbnb-vrbo-dispute` | Vacation Rental Dispute | Platform, host communication, issue |

---

## Phase 3: Cruise Disputes (+8 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 17 | `cruise-itinerary-change` | Cruise Itinerary Change Complaint | Original/revised ports, notice period |
| 18 | `cruise-cabin-downgrade` | Cruise Cabin Downgrade Compensation | Cabin type booked vs assigned |
| 19 | `cruise-missed-port` | Cruise Missed Port Compensation | Port missed, excursions lost |
| 20 | `cruise-onboard-service` | Cruise Onboard Service Complaint | Service issue, crew response |
| 21 | `cruise-medical-emergency` | Cruise Medical Emergency Claim | Medical services, shore evacuation |
| 22 | `cruise-excursion-dispute` | Shore Excursion Dispute | Excursion booked, issues encountered |
| 23 | `cruise-cancellation-refund` | Cruise Cancellation Refund | Cancellation date, deposit/payment |
| 24 | `cruise-illness-outbreak` | Cruise Illness/Outbreak Compensation | Illness type, quarantine, medical care |

---

## Phase 4: Car Rental Disputes (+8 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 25 | `car-rental-damage-dispute` | Car Rental Damage Dispute | Damage claimed, pre-rental inspection |
| 26 | `car-rental-overcharge` | Car Rental Overcharge Complaint | Quoted vs charged, breakdown |
| 27 | `car-rental-vehicle-swap` | Car Rental Vehicle Substitution | Vehicle class booked vs provided |
| 28 | `car-rental-breakdown` | Car Rental Breakdown Complaint | Breakdown details, roadside assistance |
| 29 | `car-rental-insurance-dispute` | Car Rental Insurance Dispute | Coverage claimed, denial reason |
| 30 | `car-rental-fuel-charge` | Car Rental Fuel Charge Dispute | Fuel policy, actual vs charged |
| 31 | `car-rental-deposit-refund` | Car Rental Deposit Not Refunded | Deposit amount, return date, delays |
| 32 | `car-rental-toll-fee-dispute` | Car Rental Toll Fee Dispute | Toll charges, admin fees, transponder |

---

## Phase 5: Tours & Package Holidays (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 33 | `tour-operator-misrepresentation` | Tour Misrepresentation Complaint | Advertised vs actual experience |
| 34 | `package-holiday-insolvency` | Package Holiday Company Insolvency | ATOL/ABTA protection, refund claim |
| 35 | `tour-guide-complaint` | Tour Guide/Service Complaint | Guide behavior, service quality |
| 36 | `activity-tour-cancellation` | Activity/Tour Cancellation Refund | Activity booked, cancellation reason |
| 37 | `ota-booking-error` | OTA Booking Error Complaint | Platform (Expedia, Booking.com), error type |
| 38 | `transfer-service-failure` | Airport/Hotel Transfer Failure | Transfer booked, no-show, alternative costs |

---

## Phase 6: Rail & Bus (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 39 | `train-delay-compensation` | Train Delay Compensation (UK) | Train operator, delay duration, Delay Repay |
| 40 | `eurostar-thalys-delay` | International Train Delay Claim | Eurostar/Thalys, EU rail rights |
| 41 | `train-cancellation` | Train Cancellation Refund | Cancellation notice, alternative travel |
| 42 | `train-overcrowding` | Train Overcrowding Complaint | Reservation vs standing, discomfort |
| 43 | `coach-bus-delay` | Coach/Bus Delay Compensation | EU bus regulation, delay length |
| 44 | `rail-pass-issue` | Rail Pass/Ticket Issue | Pass type, validity dispute |

---

## Phase 7: Additional Travel Disputes (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 45 | `travel-agent-complaint` | Travel Agent Complaint | Agent name, booking issue, misadvice |
| 46 | `travel-insurance-claim` | Travel Insurance Claim Dispute | Insurer, claim type, denial reason |
| 47 | `airline-loyalty-dispute` | Airline Miles/Points Dispute | Loyalty program, points issue |
| 48 | `airport-lounge-complaint` | Airport Lounge Access Denial | Lounge name, entry policy, refund |
| 49 | `visa-service-complaint` | Visa Processing Service Complaint | Service provider, application issue |
| 50 | `pet-travel-issue` | Pet Travel/Cargo Complaint | Pet details, transport issue |

---

## Universal Travel Core Fields

### Passenger Information
```text
- passengerName, passengerEmail, passengerPhone, passengerAddress
- passportNumber (optional), nationality
- additionalPassengers, passengerCount
```

### Booking Information
```text
- bookingReference, confirmationNumber
- bookingDate, bookingSource (direct, OTA, agent)
- paymentMethod, amountPaid, currency
```

### Provider Information
```text
- providerName, providerAddress, providerEmail, providerPhone
- providerType (airline, hotel, cruise line, car rental, tour operator)
```

### Dispute Information
```text
- issueDate, issueDescription
- previousContact, responseReceived
- compensationSought, refundAmount
```

---

## Regulatory Anchors by Jurisdiction

| Region | Flights | Rail | Hotels | Cruises | Package |
|--------|---------|------|--------|---------|---------|
| **UK** | CAA, UK261 | Delay Repay, CRA 2015 | CRA 2015 | CRA 2015 | PTR 2018 |
| **EU** | EU261/2004 | EU1371/2007 | Package Travel Directive | Athens Convention | PTD 2015 |
| **US** | DOT Rules | Amtrak Policy | State Consumer Law | Maritime Law | State Law |
| **INTL** | Montreal Convention | Carrier T&Cs | Consumer Standards | Athens Convention | IATA |

---

## File Structure

```
src/data/templates/travel/
├── flightTemplates.ts      # 12 templates (existing 6 + new 6)
├── baggageTemplates.ts     # 4 templates (existing)
├── hotelTemplates.ts       # 10 templates (NEW)
├── cruiseTemplates.ts      # 8 templates (NEW)
├── carRentalTemplates.ts   # 8 templates (NEW)
├── tourPackageTemplates.ts # 6 templates (NEW)
├── railBusTemplates.ts     # 6 templates (NEW)
└── index.ts                # Barrel export combining all
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/data/templates/travel/` | Create directory with subcategory files |
| `src/data/templates/travelTemplates.ts` | Refactor to import from subdirectory |
| `src/data/templateCategories.ts` | Update `templateCount` from 20 to 50 |
| `src/data/allTemplates.ts` | Import updated travel templates |

---

## Next Steps After Travel

Once Travel is complete (50+ templates), proceed with:
1. **Contractors & Home Improvement** (7 → 50, +43 templates)
   - Subcategories: General contractors, Plumbers, Electricians, Roofers, HVAC, Landscapers, Painters, etc.
