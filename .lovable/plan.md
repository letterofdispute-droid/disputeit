

# Travel Templates Expansion - Regulator-Aware Field System

## Overview

Based on your detailed specification, I'll expand the travel templates from the current 12 to 20+ templates with enhanced regulatory compliance and real-case fields. The current templates already have a strong foundation with granular fields (IATA codes, PNR, PIR references), but I'll enhance them and add new high-demand templates.

---

## Current State Analysis

**Existing Travel Templates (12 total):**
1. Flight Delay Compensation - 37 fields (excellent)
2. Flight Cancellation Compensation - 26 fields (good)
3. Lost Baggage Claim - 26 fields (good)
4. Damaged Baggage Claim - 27 fields (good)
5. Denied Boarding Compensation - 31 fields (good)
6. Hotel Complaint - 26 fields (good)
7. Hotel Refund Request - 18 fields (needs enhancement)
8. Car Rental Complaint - 24 fields (needs enhancement)
9. Cruise Complaint - 26 fields (good)
10. Train Delay Compensation - 18 fields (UK-focused)
11. Travel Agency Complaint - 27 fields (good)
12. Package Holiday Complaint - 27 fields (good)

---

## Implementation Plan

### Phase 1: New High-Demand Templates (8 templates)

| Template | Priority | Field Count | Key Features |
|----------|----------|-------------|--------------|
| Delayed Baggage Claim | High | ~25 | PIR, delay duration, essential purchases |
| OTA Refund Dispute | High | ~22 | OTA vs supplier responsibility |
| Travel Chargeback Request | High | ~20 | Card issuer, reason codes, evidence |
| Missed Connection Compensation | High | ~28 | Connection flight details, re-routing |
| Bus/Coach Delay Complaint | Medium | ~18 | PRE Regulation fields |
| Ferry Delay/Cancellation | Medium | ~20 | Maritime passenger rights |
| Airport Lounge Complaint | Medium | ~15 | Lounge access, service issues |
| Travel Insurance Claim Rejection | High | ~22 | Policy details, rejection reasons |

### Phase 2: Enhanced Fields for Existing Templates

**Enhancements to add:**

1. **Extraordinary Circumstances** - Add yes/no field with follow-up
2. **Meals/Care Provided** - Standardize across airline templates
3. **Document Checklist** - Add attachment guidance fields
4. **Eligibility Indicators** - Delay duration, distance (for auto-calculation potential)

---

## Technical Implementation

### New Template Structure

Each template follows the Core + Extension architecture:

```text
Template Schema
├── Core Fields (16-20)
│   ├── Traveler Identity
│   │   ├── fullLegalName
│   │   ├── passengerAddress (textarea)
│   │   ├── passengerEmail
│   │   ├── passengerPhone
│   │   ├── countryOfResidence
│   │   └── passengerRole (select)
│   ├── Booking Details
│   │   ├── bookingReference
│   │   ├── bookingDate
│   │   ├── travelDate
│   │   ├── serviceProviderName
│   │   ├── bookingChannel (select)
│   │   ├── paymentMethod (select)
│   │   ├── transactionId
│   │   └── totalAmountPaid
│   └── Dispute Metadata
│       ├── dateIssueOccurred
│       ├── dateComplaintSubmitted
│       ├── resolutionRequested (select)
│       └── preferredResponseMethod
├── Extension Fields (6-15)
│   └── Category-specific fields
└── Jurisdiction Blocks
    ├── UK261 (retained EU 261/2004)
    ├── EU261 (Regulation 261/2004)
    ├── US DOT Rules
    └── Montreal Convention (baggage)
```

---

## New Templates - Detailed Specifications

### 1. Delayed Baggage Claim (High Priority)

**Fields (25):**
- Core flight fields (airline, flight number, dates, airports)
- PIR reference number
- PIR filing date and location
- Baggage tag number(s)
- Baggage type (checked/cabin)
- Delay duration (hours/days)
- Date baggage returned (if applicable)
- Essential purchases itemized list
- Receipt availability (select)
- Total essential expenses claim

**Regulatory:** Montreal Convention 21-day delay liability text

---

### 2. OTA Refund Dispute (High Priority)

**Fields (22):**
- OTA name (select: Booking.com, Expedia, Kayak, etc.)
- Supplier name (actual service provider)
- OTA booking reference
- Supplier booking reference (if different)
- Responsibility disputed (OTA vs Supplier)
- Policy version shown at booking
- Screenshot availability
- Original booking terms
- Changes made by provider
- Refund already offered
- Refund amount sought

**Key Feature:** Fields to establish OTA vs supplier responsibility

---

### 3. Travel Chargeback Request (High Priority)

**Fields (20):**
- Card issuer name (select: Visa, Mastercard, Amex)
- Card type (credit/debit)
- Last 4 digits of card
- Transaction date
- Transaction amount
- Merchant name
- Merchant category
- Chargeback reason (select with common codes)
- Date first disputed with merchant
- Merchant response received
- Previous resolution attempts documented
- Evidence available (checklist)

**Regulatory:** Aligned with Visa/Mastercard/Amex reason codes

---

### 4. Missed Connection Compensation (High Priority)

**Fields (28):**
- First flight details (number, airline, route)
- Connection airport
- Minimum connection time (advertised)
- Actual arrival time at connection
- Second flight details
- Reason for missing connection
- Single booking or separate tickets
- Re-routing provided
- Alternative flight details
- Final arrival delay
- Accommodation/meals provided
- Expenses incurred

**Key Feature:** Single vs separate booking (affects liability)

---

### 5. Bus/Coach Delay Complaint (Medium)

**Fields (18):**
- Bus/coach operator
- Route/service number
- Departure and arrival points
- Scheduled vs actual times
- Delay duration
- Ticket type and cost
- Ticket reference
- Reason given
- Assistance provided
- Compensation sought

**Regulatory:** PRE Regulation (EU bus/coach rights)

---

### 6. Ferry Delay/Cancellation (Medium)

**Fields (20):**
- Ferry operator
- Route
- Vessel name
- Sailing date
- Scheduled departure/arrival
- Actual departure/arrival
- Delay duration
- Cancellation notice timing
- Re-routing offered
- Vehicle included (yes/no + registration)
- Cabin booked (yes/no + type)
- Ticket cost
- Accommodation/meals provided

**Regulatory:** EU Maritime Passenger Rights Regulation 1177/2010

---

### 7. Airport Lounge Complaint (Medium)

**Fields (15):**
- Lounge name
- Lounge operator
- Airport
- Access date and time
- Access method (Priority Pass, airline card, paid entry)
- Access reference/booking
- Issues encountered (multi-select)
- Expected service level
- Actual service received
- Staff response
- Compensation sought

---

### 8. Travel Insurance Claim Rejection Appeal (High)

**Fields (22):**
- Insurance provider
- Policy number
- Policyholder name
- Trip dates
- Destination
- Claim type (medical, cancellation, baggage, etc.)
- Claim reference number
- Claim amount
- Date claim submitted
- Date claim rejected
- Rejection reasons given
- Why rejection is disputed
- Supporting evidence list
- Appeal amount sought

**Key Feature:** Structured rejection reasons for strong appeals

---

## Jurisdiction-Specific Regulatory Blocks

I'll embed locked legal language blocks for each template:

```text
UK261 Block:
"Under UK Regulation 261/2004 (as retained), passengers departing 
from a UK airport or arriving in the UK on a UK/EU carrier are 
entitled to compensation for delays over 3 hours..."

EU261 Block:
"Under Regulation (EC) No 261/2004, passengers departing from an 
EU airport or arriving in the EU on an EU carrier are entitled to 
fixed compensation amounts..."

Montreal Convention Block:
"Under the Montreal Convention 1999, airlines are liable for 
baggage delays up to 1,288 SDR (approximately £1,400) unless 
caused by the passenger's own negligence..."

US DOT Block:
"Under US Department of Transportation regulations, airlines 
operating flights to/from the United States must provide 
compensation for involuntary denied boarding..."
```

---

## Files to Create/Modify

### Files to Modify:
1. **`src/data/templates/travelTemplates.ts`** - Add 8 new templates
2. **`src/data/templateCategories.ts`** - Update template count (12 → 20)

### Existing Enhancements:
- Add `extraordinaryCircumstances` field to airline templates
- Add `careProvided` standardized select to all airline templates
- Add attachment checklist guidance fields

---

## Field Count Summary

| Template Category | Current | After Enhancement |
|-------------------|---------|-------------------|
| Airline Disputes | 5 templates | 6 templates (+missed connection) |
| Baggage Disputes | 2 templates | 3 templates (+delayed baggage) |
| Accommodation | 2 templates | 2 templates (enhanced fields) |
| Ground Transport | 2 templates | 4 templates (+bus, ferry) |
| Travel Agencies/OTAs | 2 templates | 3 templates (+OTA dispute) |
| Payment/Insurance | 0 templates | 2 templates (new) |
| **Total** | **12 templates** | **20 templates** |

---

## Security & Data Handling

**Fields I Will NOT Add (per your specification):**
- Full passport number (only ID type + last 4 digits optional)
- Full card number or CVV
- Copies of government IDs
- Immigration or visa status
- Any fields requesting legal admissions

---

## Implementation Order

1. Create 8 new templates in `travelTemplates.ts`
2. Update template count in `templateCategories.ts`
3. Enhance existing templates with standardized care/extraordinary circumstances fields
4. Verify all templates follow the Core + Extension pattern
5. Test field validation and placeholder rendering

