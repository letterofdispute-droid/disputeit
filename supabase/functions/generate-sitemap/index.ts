import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://disputeletters.com';
const FUNCTION_URL = 'https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap';

// Category definitions with their IDs
const categories = [
  { id: 'refunds', name: 'Refunds & Purchases' },
  { id: 'housing', name: 'Landlord & Housing' },
  { id: 'travel', name: 'Travel & Transportation' },
  { id: 'damaged-goods', name: 'Damaged & Defective Goods' },
  { id: 'utilities', name: 'Utilities & Telecommunications' },
  { id: 'financial', name: 'Financial Services' },
  { id: 'insurance', name: 'Insurance Claims' },
  { id: 'vehicle', name: 'Vehicle & Auto' },
  { id: 'healthcare', name: 'Healthcare & Medical Billing' },
  { id: 'employment', name: 'Employment & Workplace' },
  { id: 'ecommerce', name: 'E-commerce & Online Services' },
  { id: 'hoa', name: 'Neighbor & HOA Disputes' },
  { id: 'contractors', name: 'Contractors & Home Improvement' },
];

// Subcategory mappings per category
const subcategoryMappings: Record<string, { name: string; slug: string }[]> = {
  'contractors': [
    { name: 'General Contractor', slug: 'general' },
    { name: 'Plumbing', slug: 'plumbing' },
    { name: 'Electrical', slug: 'electrical' },
    { name: 'Roofing', slug: 'roofing' },
    { name: 'HVAC', slug: 'hvac' },
    { name: 'Landscaping', slug: 'landscaping' },
    { name: 'Flooring & Painting', slug: 'flooring-painting' },
    { name: 'Kitchen & Bath', slug: 'kitchen-bath' },
    { name: 'Windows & Doors', slug: 'windows-doors' },
    { name: 'Specialty Services', slug: 'specialty' },
  ],
  'healthcare': [
    { name: 'Insurance Claims', slug: 'insurance-claims' },
    { name: 'Medical Billing', slug: 'billing' },
    { name: 'Debt Collection', slug: 'debt-collection' },
    { name: 'Provider Complaints', slug: 'provider' },
    { name: 'Pharmacy Issues', slug: 'pharmacy' },
    { name: 'Privacy & Records', slug: 'privacy-records' },
  ],
  'insurance': [
    { name: 'Auto Insurance', slug: 'auto' },
    { name: 'Home Insurance', slug: 'home' },
    { name: 'Health Insurance', slug: 'health' },
    { name: 'Life Insurance', slug: 'life' },
    { name: 'Travel Insurance', slug: 'travel' },
    { name: 'Pet Insurance', slug: 'pet' },
    { name: 'Business Insurance', slug: 'business' },
  ],
  'housing': [
    { name: 'Repair & Maintenance', slug: 'repairs' },
    { name: 'Deposits & Move-Out', slug: 'deposits' },
    { name: 'Tenancy Disputes', slug: 'tenancy' },
    { name: 'Neighbor Issues', slug: 'neighbor' },
    { name: 'Letting Agents', slug: 'letting-agents' },
    { name: 'Safety & Compliance', slug: 'safety' },
  ],
  'travel': [
    { name: 'Flights', slug: 'flights' },
    { name: 'Hotels', slug: 'hotels' },
    { name: 'Cruises', slug: 'cruises' },
    { name: 'Car Rentals', slug: 'car-rentals' },
    { name: 'Tours & Packages', slug: 'tours' },
    { name: 'Rail & Bus', slug: 'rail-bus' },
  ],
  'employment': [
    { name: 'Wages & Pay', slug: 'wages' },
    { name: 'Termination', slug: 'termination' },
    { name: 'Discrimination', slug: 'discrimination' },
    { name: 'Benefits', slug: 'benefits' },
    { name: 'Workplace Conditions', slug: 'workplace' },
  ],
  'utilities': [
    { name: 'Energy', slug: 'energy' },
    { name: 'Water', slug: 'water' },
    { name: 'Internet', slug: 'internet' },
    { name: 'Phone & Mobile', slug: 'phone' },
    { name: 'TV & Cable', slug: 'tv-cable' },
  ],
  'financial': [
    { name: 'Banking', slug: 'banking' },
    { name: 'Credit Cards', slug: 'credit-cards' },
    { name: 'Loans', slug: 'loans' },
    { name: 'Credit Reports', slug: 'credit-reports' },
    { name: 'Debt Collection', slug: 'debt-collection' },
    { name: 'Investments', slug: 'investments' },
    { name: 'Fraud & Scams', slug: 'fraud' },
  ],
  'refunds': [
    { name: 'Refunds', slug: 'refunds' },
    { name: 'Warranty', slug: 'warranty' },
    { name: 'Subscriptions', slug: 'subscriptions' },
    { name: 'Delivery Issues', slug: 'delivery' },
    { name: 'Service Complaints', slug: 'service' },
  ],
  'damaged-goods': [
    { name: 'Delivery Damage', slug: 'delivery-damage' },
    { name: 'Defective Products', slug: 'defective' },
    { name: 'Misrepresentation', slug: 'misrepresentation' },
    { name: 'Warranty & Repair', slug: 'warranty-repair' },
  ],
  'vehicle': [
    { name: 'Dealer Disputes', slug: 'dealer' },
    { name: 'Repair & Service', slug: 'repair' },
    { name: 'Warranty & Lemon Law', slug: 'warranty-lemon' },
    { name: 'Finance & Lease', slug: 'finance' },
    { name: 'Parking & Traffic', slug: 'parking' },
  ],
  'ecommerce': [
    { name: 'Refunds & Returns', slug: 'refunds' },
    { name: 'Delivery Issues', slug: 'delivery' },
    { name: 'Marketplace Disputes', slug: 'marketplace' },
    { name: 'Subscriptions', slug: 'subscriptions' },
    { name: 'Privacy & Data', slug: 'privacy' },
  ],
  'hoa': [
    { name: 'Fees & Assessments', slug: 'fees' },
    { name: 'Violations & Fines', slug: 'violations' },
    { name: 'Maintenance', slug: 'maintenance' },
    { name: 'Neighbor Disputes', slug: 'neighbor' },
    { name: 'Governance', slug: 'governance' },
  ],
};

// All templates with their hierarchical URL structure
// This is a comprehensive list of all 400+ templates
const allTemplates = [
  // Refunds & Purchases
  { slug: 'refund-request-faulty-product', category: 'refunds', subcategory: 'refunds' },
  { slug: 'refund-request-service-not-provided', category: 'refunds', subcategory: 'service' },
  { slug: 'refund-request-wrong-item', category: 'refunds', subcategory: 'refunds' },
  { slug: 'refund-request-overcharge', category: 'refunds', subcategory: 'refunds' },
  { slug: 'refund-request-event-cancelled', category: 'refunds', subcategory: 'refunds' },
  { slug: 'refund-request-membership-cancellation', category: 'refunds', subcategory: 'subscriptions' },
  { slug: 'refund-request-training-course', category: 'refunds', subcategory: 'service' },
  { slug: 'subscription-cancellation-unauthorized', category: 'refunds', subcategory: 'subscriptions' },
  { slug: 'subscription-refund-free-trial', category: 'refunds', subcategory: 'subscriptions' },
  { slug: 'subscription-cancellation-price-increase', category: 'refunds', subcategory: 'subscriptions' },
  { slug: 'warranty-claim-electronics', category: 'refunds', subcategory: 'warranty' },
  { slug: 'warranty-claim-appliance', category: 'refunds', subcategory: 'warranty' },
  { slug: 'warranty-claim-furniture', category: 'refunds', subcategory: 'warranty' },
  { slug: 'billing-dispute-duplicate-charge', category: 'refunds', subcategory: 'refunds' },
  { slug: 'billing-dispute-unauthorized-charge', category: 'refunds', subcategory: 'refunds' },
  { slug: 'billing-dispute-incorrect-amount', category: 'refunds', subcategory: 'refunds' },
  { slug: 'gift-card-refund', category: 'refunds', subcategory: 'refunds' },
  { slug: 'layaway-cancellation', category: 'refunds', subcategory: 'refunds' },
  { slug: 'price-match-request', category: 'refunds', subcategory: 'refunds' },
  { slug: 'restocking-fee-dispute', category: 'refunds', subcategory: 'refunds' },
  { slug: 'late-delivery-compensation', category: 'refunds', subcategory: 'delivery' },
  { slug: 'missing-delivery-claim', category: 'refunds', subcategory: 'delivery' },
  { slug: 'delivery-damage-claim', category: 'refunds', subcategory: 'delivery' },
  { slug: 'installation-service-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'cleaning-service-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'photography-service-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'catering-service-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'personal-trainer-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'tutoring-service-complaint', category: 'refunds', subcategory: 'service' },
  { slug: 'digital-purchase-refund', category: 'refunds', subcategory: 'refunds' },
  { slug: 'in-app-purchase-refund', category: 'refunds', subcategory: 'refunds' },
  { slug: 'software-license-refund', category: 'refunds', subcategory: 'refunds' },
  { slug: 'online-course-refund', category: 'refunds', subcategory: 'service' },
  { slug: 'ebook-refund', category: 'refunds', subcategory: 'refunds' },
  { slug: 'special-order-cancellation', category: 'refunds', subcategory: 'refunds' },
  { slug: 'custom-product-dispute', category: 'refunds', subcategory: 'refunds' },
  { slug: 'preorder-cancellation', category: 'refunds', subcategory: 'refunds' },
  { slug: 'auction-dispute', category: 'refunds', subcategory: 'refunds' },
  { slug: 'consignment-dispute', category: 'refunds', subcategory: 'refunds' },
  
  // Housing
  { slug: 'landlord-repair-request', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-mold-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-heating-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-pest-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-plumbing-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-electrical-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-appliance-repair', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-structural-repair', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-roof-leak-complaint', category: 'housing', subcategory: 'repairs' },
  { slug: 'landlord-window-repair', category: 'housing', subcategory: 'repairs' },
  { slug: 'security-deposit-demand', category: 'housing', subcategory: 'deposits' },
  { slug: 'security-deposit-dispute', category: 'housing', subcategory: 'deposits' },
  { slug: 'security-deposit-itemization', category: 'housing', subcategory: 'deposits' },
  { slug: 'move-out-inspection-request', category: 'housing', subcategory: 'deposits' },
  { slug: 'deposit-deduction-dispute', category: 'housing', subcategory: 'deposits' },
  { slug: 'rent-increase-dispute', category: 'housing', subcategory: 'tenancy' },
  { slug: 'lease-violation-response', category: 'housing', subcategory: 'tenancy' },
  { slug: 'eviction-notice-response', category: 'housing', subcategory: 'tenancy' },
  { slug: 'lease-termination-request', category: 'housing', subcategory: 'tenancy' },
  { slug: 'subletting-permission-request', category: 'housing', subcategory: 'tenancy' },
  { slug: 'neighbor-noise-complaint', category: 'housing', subcategory: 'neighbor' },
  { slug: 'neighbor-nuisance-complaint', category: 'housing', subcategory: 'neighbor' },
  { slug: 'neighbor-boundary-dispute', category: 'housing', subcategory: 'neighbor' },
  { slug: 'letting-agent-complaint', category: 'housing', subcategory: 'letting-agents' },
  { slug: 'property-manager-complaint', category: 'housing', subcategory: 'letting-agents' },
  { slug: 'estate-agent-complaint', category: 'housing', subcategory: 'letting-agents' },
  { slug: 'gas-safety-complaint', category: 'housing', subcategory: 'safety' },
  { slug: 'fire-safety-complaint', category: 'housing', subcategory: 'safety' },
  { slug: 'electrical-safety-complaint', category: 'housing', subcategory: 'safety' },
  { slug: 'habitability-complaint', category: 'housing', subcategory: 'safety' },
  
  // Travel
  { slug: 'flight-delay-compensation', category: 'travel', subcategory: 'flights' },
  { slug: 'flight-cancellation-refund', category: 'travel', subcategory: 'flights' },
  { slug: 'lost-baggage-claim', category: 'travel', subcategory: 'flights' },
  { slug: 'damaged-baggage-claim', category: 'travel', subcategory: 'flights' },
  { slug: 'delayed-baggage-claim', category: 'travel', subcategory: 'flights' },
  { slug: 'overbooking-compensation', category: 'travel', subcategory: 'flights' },
  { slug: 'eu261-compensation-claim', category: 'travel', subcategory: 'flights' },
  { slug: 'airline-service-complaint', category: 'travel', subcategory: 'flights' },
  { slug: 'hotel-refund-request', category: 'travel', subcategory: 'hotels' },
  { slug: 'hotel-service-complaint', category: 'travel', subcategory: 'hotels' },
  { slug: 'hotel-overbooking-complaint', category: 'travel', subcategory: 'hotels' },
  { slug: 'hotel-room-dispute', category: 'travel', subcategory: 'hotels' },
  { slug: 'cruise-refund-request', category: 'travel', subcategory: 'cruises' },
  { slug: 'cruise-service-complaint', category: 'travel', subcategory: 'cruises' },
  { slug: 'car-rental-dispute', category: 'travel', subcategory: 'car-rentals' },
  { slug: 'car-rental-damage-dispute', category: 'travel', subcategory: 'car-rentals' },
  { slug: 'car-rental-overcharge', category: 'travel', subcategory: 'car-rentals' },
  { slug: 'tour-refund-request', category: 'travel', subcategory: 'tours' },
  { slug: 'travel-agent-complaint', category: 'travel', subcategory: 'tours' },
  { slug: 'package-holiday-complaint', category: 'travel', subcategory: 'tours' },
  { slug: 'train-delay-compensation', category: 'travel', subcategory: 'rail-bus' },
  { slug: 'train-refund-request', category: 'travel', subcategory: 'rail-bus' },
  
  // Damaged Goods
  { slug: 'damaged-delivery-claim', category: 'damaged-goods', subcategory: 'delivery-damage' },
  { slug: 'shipping-damage-claim', category: 'damaged-goods', subcategory: 'delivery-damage' },
  { slug: 'carrier-damage-claim', category: 'damaged-goods', subcategory: 'delivery-damage' },
  { slug: 'transit-damage-claim', category: 'damaged-goods', subcategory: 'delivery-damage' },
  { slug: 'defective-product-complaint', category: 'damaged-goods', subcategory: 'defective' },
  { slug: 'faulty-electronics-complaint', category: 'damaged-goods', subcategory: 'defective' },
  { slug: 'malfunctioning-appliance', category: 'damaged-goods', subcategory: 'defective' },
  { slug: 'product-safety-complaint', category: 'damaged-goods', subcategory: 'defective' },
  { slug: 'product-recall-claim', category: 'damaged-goods', subcategory: 'defective' },
  { slug: 'misrepresented-product-complaint', category: 'damaged-goods', subcategory: 'misrepresentation' },
  { slug: 'false-advertising-complaint', category: 'damaged-goods', subcategory: 'misrepresentation' },
  { slug: 'counterfeit-product-complaint', category: 'damaged-goods', subcategory: 'misrepresentation' },
  { slug: 'wrong-specifications-complaint', category: 'damaged-goods', subcategory: 'misrepresentation' },
  { slug: 'warranty-repair-request', category: 'damaged-goods', subcategory: 'warranty-repair' },
  { slug: 'warranty-replacement-request', category: 'damaged-goods', subcategory: 'warranty-repair' },
  { slug: 'extended-warranty-claim', category: 'damaged-goods', subcategory: 'warranty-repair' },
  { slug: 'repair-quality-complaint', category: 'damaged-goods', subcategory: 'warranty-repair' },
  
  // Utilities & Telecom
  { slug: 'energy-billing-dispute', category: 'utilities', subcategory: 'energy' },
  { slug: 'gas-billing-dispute', category: 'utilities', subcategory: 'energy' },
  { slug: 'electric-billing-dispute', category: 'utilities', subcategory: 'energy' },
  { slug: 'smart-meter-dispute', category: 'utilities', subcategory: 'energy' },
  { slug: 'estimated-billing-complaint', category: 'utilities', subcategory: 'energy' },
  { slug: 'energy-supplier-switch-issue', category: 'utilities', subcategory: 'energy' },
  { slug: 'water-billing-dispute', category: 'utilities', subcategory: 'water' },
  { slug: 'sewage-billing-dispute', category: 'utilities', subcategory: 'water' },
  { slug: 'water-quality-complaint', category: 'utilities', subcategory: 'water' },
  { slug: 'internet-service-complaint', category: 'utilities', subcategory: 'internet' },
  { slug: 'broadband-speed-complaint', category: 'utilities', subcategory: 'internet' },
  { slug: 'internet-outage-compensation', category: 'utilities', subcategory: 'internet' },
  { slug: 'isp-contract-dispute', category: 'utilities', subcategory: 'internet' },
  { slug: 'mobile-billing-dispute', category: 'utilities', subcategory: 'phone' },
  { slug: 'phone-service-complaint', category: 'utilities', subcategory: 'phone' },
  { slug: 'roaming-charges-dispute', category: 'utilities', subcategory: 'phone' },
  { slug: 'phone-contract-dispute', category: 'utilities', subcategory: 'phone' },
  { slug: 'early-termination-fee-dispute', category: 'utilities', subcategory: 'phone' },
  { slug: 'cable-billing-dispute', category: 'utilities', subcategory: 'tv-cable' },
  { slug: 'cable-service-complaint', category: 'utilities', subcategory: 'tv-cable' },
  { slug: 'streaming-service-refund', category: 'utilities', subcategory: 'tv-cable' },
  
  // Financial Services
  { slug: 'bank-fee-dispute', category: 'financial', subcategory: 'banking' },
  { slug: 'overdraft-fee-dispute', category: 'financial', subcategory: 'banking' },
  { slug: 'atm-dispute', category: 'financial', subcategory: 'banking' },
  { slug: 'bank-account-closure-dispute', category: 'financial', subcategory: 'banking' },
  { slug: 'wire-transfer-dispute', category: 'financial', subcategory: 'banking' },
  { slug: 'credit-card-dispute', category: 'financial', subcategory: 'credit-cards' },
  { slug: 'credit-card-fee-dispute', category: 'financial', subcategory: 'credit-cards' },
  { slug: 'credit-card-fraud-dispute', category: 'financial', subcategory: 'credit-cards' },
  { slug: 'credit-limit-dispute', category: 'financial', subcategory: 'credit-cards' },
  { slug: 'apr-dispute', category: 'financial', subcategory: 'credit-cards' },
  { slug: 'loan-dispute', category: 'financial', subcategory: 'loans' },
  { slug: 'mortgage-dispute', category: 'financial', subcategory: 'loans' },
  { slug: 'loan-interest-dispute', category: 'financial', subcategory: 'loans' },
  { slug: 'loan-modification-request', category: 'financial', subcategory: 'loans' },
  { slug: 'credit-report-dispute', category: 'financial', subcategory: 'credit-reports' },
  { slug: 'credit-bureau-dispute', category: 'financial', subcategory: 'credit-reports' },
  { slug: 'credit-score-dispute', category: 'financial', subcategory: 'credit-reports' },
  { slug: 'identity-theft-dispute', category: 'financial', subcategory: 'credit-reports' },
  { slug: 'debt-collection-dispute', category: 'financial', subcategory: 'debt-collection' },
  { slug: 'debt-validation-request', category: 'financial', subcategory: 'debt-collection' },
  { slug: 'cease-contact-request', category: 'financial', subcategory: 'debt-collection' },
  { slug: 'debt-harassment-complaint', category: 'financial', subcategory: 'debt-collection' },
  { slug: 'investment-complaint', category: 'financial', subcategory: 'investments' },
  { slug: 'broker-complaint', category: 'financial', subcategory: 'investments' },
  { slug: 'financial-advisor-complaint', category: 'financial', subcategory: 'investments' },
  { slug: 'scam-report', category: 'financial', subcategory: 'fraud' },
  { slug: 'fraud-complaint', category: 'financial', subcategory: 'fraud' },
  { slug: 'unauthorized-transaction-dispute', category: 'financial', subcategory: 'fraud' },
  
  // Insurance
  { slug: 'auto-insurance-claim-denial', category: 'insurance', subcategory: 'auto' },
  { slug: 'car-accident-claim-dispute', category: 'insurance', subcategory: 'auto' },
  { slug: 'auto-insurance-rate-dispute', category: 'insurance', subcategory: 'auto' },
  { slug: 'collision-claim-dispute', category: 'insurance', subcategory: 'auto' },
  { slug: 'comprehensive-claim-dispute', category: 'insurance', subcategory: 'auto' },
  { slug: 'home-insurance-claim-denial', category: 'insurance', subcategory: 'home' },
  { slug: 'property-damage-claim', category: 'insurance', subcategory: 'home' },
  { slug: 'storm-damage-claim', category: 'insurance', subcategory: 'home' },
  { slug: 'fire-damage-claim', category: 'insurance', subcategory: 'home' },
  { slug: 'water-damage-claim', category: 'insurance', subcategory: 'home' },
  { slug: 'theft-claim', category: 'insurance', subcategory: 'home' },
  { slug: 'health-insurance-claim-denial', category: 'insurance', subcategory: 'health' },
  { slug: 'medical-claim-appeal', category: 'insurance', subcategory: 'health' },
  { slug: 'pre-existing-condition-dispute', category: 'insurance', subcategory: 'health' },
  { slug: 'out-of-network-dispute', category: 'insurance', subcategory: 'health' },
  { slug: 'prior-authorization-appeal', category: 'insurance', subcategory: 'health' },
  { slug: 'life-insurance-claim-denial', category: 'insurance', subcategory: 'life' },
  { slug: 'death-benefit-dispute', category: 'insurance', subcategory: 'life' },
  { slug: 'beneficiary-dispute', category: 'insurance', subcategory: 'life' },
  { slug: 'travel-insurance-claim', category: 'insurance', subcategory: 'travel' },
  { slug: 'trip-cancellation-claim', category: 'insurance', subcategory: 'travel' },
  { slug: 'flight-insurance-claim', category: 'insurance', subcategory: 'travel' },
  { slug: 'pet-insurance-claim', category: 'insurance', subcategory: 'pet' },
  { slug: 'veterinary-claim-dispute', category: 'insurance', subcategory: 'pet' },
  { slug: 'business-insurance-claim', category: 'insurance', subcategory: 'business' },
  { slug: 'liability-claim-dispute', category: 'insurance', subcategory: 'business' },
  
  // Vehicle
  { slug: 'dealer-complaint', category: 'vehicle', subcategory: 'dealer' },
  { slug: 'dealership-dispute', category: 'vehicle', subcategory: 'dealer' },
  { slug: 'car-sales-complaint', category: 'vehicle', subcategory: 'dealer' },
  { slug: 'misrepresented-vehicle', category: 'vehicle', subcategory: 'dealer' },
  { slug: 'undisclosed-damage-complaint', category: 'vehicle', subcategory: 'dealer' },
  { slug: 'mechanic-complaint', category: 'vehicle', subcategory: 'repair' },
  { slug: 'garage-repair-dispute', category: 'vehicle', subcategory: 'repair' },
  { slug: 'auto-repair-overcharge', category: 'vehicle', subcategory: 'repair' },
  { slug: 'unnecessary-repairs-complaint', category: 'vehicle', subcategory: 'repair' },
  { slug: 'repair-quality-dispute', category: 'vehicle', subcategory: 'repair' },
  { slug: 'vehicle-warranty-claim', category: 'vehicle', subcategory: 'warranty-lemon' },
  { slug: 'lemon-law-claim', category: 'vehicle', subcategory: 'warranty-lemon' },
  { slug: 'manufacturer-defect-complaint', category: 'vehicle', subcategory: 'warranty-lemon' },
  { slug: 'recall-repair-complaint', category: 'vehicle', subcategory: 'warranty-lemon' },
  { slug: 'auto-loan-dispute', category: 'vehicle', subcategory: 'finance' },
  { slug: 'car-lease-dispute', category: 'vehicle', subcategory: 'finance' },
  { slug: 'lease-end-dispute', category: 'vehicle', subcategory: 'finance' },
  { slug: 'excess-wear-dispute', category: 'vehicle', subcategory: 'finance' },
  { slug: 'parking-ticket-dispute', category: 'vehicle', subcategory: 'parking' },
  { slug: 'towing-dispute', category: 'vehicle', subcategory: 'parking' },
  { slug: 'traffic-ticket-dispute', category: 'vehicle', subcategory: 'parking' },
  
  // Healthcare
  { slug: 'medical-billing-dispute', category: 'healthcare', subcategory: 'billing' },
  { slug: 'hospital-overcharge-dispute', category: 'healthcare', subcategory: 'billing' },
  { slug: 'itemized-bill-request', category: 'healthcare', subcategory: 'billing' },
  { slug: 'coding-error-dispute', category: 'healthcare', subcategory: 'billing' },
  { slug: 'balance-billing-dispute', category: 'healthcare', subcategory: 'billing' },
  { slug: 'insurance-claim-denial-appeal', category: 'healthcare', subcategory: 'insurance-claims' },
  { slug: 'prior-authorization-dispute', category: 'healthcare', subcategory: 'insurance-claims' },
  { slug: 'coverage-denial-appeal', category: 'healthcare', subcategory: 'insurance-claims' },
  { slug: 'medical-debt-dispute', category: 'healthcare', subcategory: 'debt-collection' },
  { slug: 'medical-debt-validation', category: 'healthcare', subcategory: 'debt-collection' },
  { slug: 'medical-debt-hardship', category: 'healthcare', subcategory: 'debt-collection' },
  { slug: 'doctor-complaint', category: 'healthcare', subcategory: 'provider' },
  { slug: 'hospital-complaint', category: 'healthcare', subcategory: 'provider' },
  { slug: 'medical-staff-complaint', category: 'healthcare', subcategory: 'provider' },
  { slug: 'pharmacy-error-complaint', category: 'healthcare', subcategory: 'pharmacy' },
  { slug: 'prescription-dispute', category: 'healthcare', subcategory: 'pharmacy' },
  { slug: 'medication-pricing-complaint', category: 'healthcare', subcategory: 'pharmacy' },
  { slug: 'hipaa-violation-complaint', category: 'healthcare', subcategory: 'privacy-records' },
  { slug: 'medical-records-request', category: 'healthcare', subcategory: 'privacy-records' },
  { slug: 'privacy-breach-complaint', category: 'healthcare', subcategory: 'privacy-records' },
  
  // Employment
  { slug: 'unpaid-wages-complaint', category: 'employment', subcategory: 'wages' },
  { slug: 'overtime-dispute', category: 'employment', subcategory: 'wages' },
  { slug: 'commission-dispute', category: 'employment', subcategory: 'wages' },
  { slug: 'bonus-dispute', category: 'employment', subcategory: 'wages' },
  { slug: 'paycheck-error-dispute', category: 'employment', subcategory: 'wages' },
  { slug: 'wrongful-termination-complaint', category: 'employment', subcategory: 'termination' },
  { slug: 'severance-dispute', category: 'employment', subcategory: 'termination' },
  { slug: 'final-paycheck-dispute', category: 'employment', subcategory: 'termination' },
  { slug: 'unemployment-appeal', category: 'employment', subcategory: 'termination' },
  { slug: 'discrimination-complaint', category: 'employment', subcategory: 'discrimination' },
  { slug: 'harassment-complaint', category: 'employment', subcategory: 'discrimination' },
  { slug: 'retaliation-complaint', category: 'employment', subcategory: 'discrimination' },
  { slug: 'hostile-work-environment', category: 'employment', subcategory: 'discrimination' },
  { slug: 'whistleblower-complaint', category: 'employment', subcategory: 'discrimination' },
  { slug: 'health-insurance-dispute', category: 'employment', subcategory: 'benefits' },
  { slug: '401k-dispute', category: 'employment', subcategory: 'benefits' },
  { slug: 'pto-dispute', category: 'employment', subcategory: 'benefits' },
  { slug: 'fmla-dispute', category: 'employment', subcategory: 'benefits' },
  { slug: 'workplace-safety-complaint', category: 'employment', subcategory: 'workplace' },
  { slug: 'osha-complaint', category: 'employment', subcategory: 'workplace' },
  { slug: 'ergonomic-complaint', category: 'employment', subcategory: 'workplace' },
  { slug: 'working-conditions-complaint', category: 'employment', subcategory: 'workplace' },
  
  // E-commerce
  { slug: 'online-purchase-refund', category: 'ecommerce', subcategory: 'refunds' },
  { slug: 'chargeback-request', category: 'ecommerce', subcategory: 'refunds' },
  { slug: 'return-policy-dispute', category: 'ecommerce', subcategory: 'refunds' },
  { slug: 'late-delivery-complaint', category: 'ecommerce', subcategory: 'delivery' },
  { slug: 'missing-package-claim', category: 'ecommerce', subcategory: 'delivery' },
  { slug: 'wrong-item-received', category: 'ecommerce', subcategory: 'delivery' },
  { slug: 'amazon-seller-dispute', category: 'ecommerce', subcategory: 'marketplace' },
  { slug: 'ebay-seller-dispute', category: 'ecommerce', subcategory: 'marketplace' },
  { slug: 'marketplace-seller-complaint', category: 'ecommerce', subcategory: 'marketplace' },
  { slug: 'third-party-seller-dispute', category: 'ecommerce', subcategory: 'marketplace' },
  { slug: 'subscription-cancellation', category: 'ecommerce', subcategory: 'subscriptions' },
  { slug: 'recurring-charge-dispute', category: 'ecommerce', subcategory: 'subscriptions' },
  { slug: 'free-trial-billing-dispute', category: 'ecommerce', subcategory: 'subscriptions' },
  { slug: 'gdpr-data-request', category: 'ecommerce', subcategory: 'privacy' },
  { slug: 'ccpa-data-request', category: 'ecommerce', subcategory: 'privacy' },
  { slug: 'account-deletion-request', category: 'ecommerce', subcategory: 'privacy' },
  { slug: 'data-breach-complaint', category: 'ecommerce', subcategory: 'privacy' },
  
  // HOA
  { slug: 'hoa-fee-dispute', category: 'hoa', subcategory: 'fees' },
  { slug: 'special-assessment-dispute', category: 'hoa', subcategory: 'fees' },
  { slug: 'dues-increase-dispute', category: 'hoa', subcategory: 'fees' },
  { slug: 'late-fee-dispute', category: 'hoa', subcategory: 'fees' },
  { slug: 'hoa-violation-dispute', category: 'hoa', subcategory: 'violations' },
  { slug: 'fine-dispute', category: 'hoa', subcategory: 'violations' },
  { slug: 'architectural-request-denial', category: 'hoa', subcategory: 'violations' },
  { slug: 'rule-enforcement-complaint', category: 'hoa', subcategory: 'violations' },
  { slug: 'common-area-maintenance', category: 'hoa', subcategory: 'maintenance' },
  { slug: 'amenity-access-dispute', category: 'hoa', subcategory: 'maintenance' },
  { slug: 'repair-request-hoa', category: 'hoa', subcategory: 'maintenance' },
  { slug: 'hoa-neighbor-complaint', category: 'hoa', subcategory: 'neighbor' },
  { slug: 'parking-dispute-hoa', category: 'hoa', subcategory: 'neighbor' },
  { slug: 'noise-complaint-hoa', category: 'hoa', subcategory: 'neighbor' },
  { slug: 'board-meeting-complaint', category: 'hoa', subcategory: 'governance' },
  { slug: 'election-dispute', category: 'hoa', subcategory: 'governance' },
  { slug: 'records-request-hoa', category: 'hoa', subcategory: 'governance' },
  { slug: 'board-decision-appeal', category: 'hoa', subcategory: 'governance' },
  
  // Contractors
  { slug: 'general-contractor-complaint', category: 'contractors', subcategory: 'general' },
  { slug: 'project-delay-complaint', category: 'contractors', subcategory: 'general' },
  { slug: 'cost-overrun-dispute', category: 'contractors', subcategory: 'general' },
  { slug: 'abandoned-project-complaint', category: 'contractors', subcategory: 'general' },
  { slug: 'unfinished-work-complaint', category: 'contractors', subcategory: 'general' },
  { slug: 'permit-violation-complaint', category: 'contractors', subcategory: 'general' },
  { slug: 'lien-dispute', category: 'contractors', subcategory: 'general' },
  { slug: 'contract-dispute-contractor', category: 'contractors', subcategory: 'general' },
  { slug: 'plumber-complaint', category: 'contractors', subcategory: 'plumbing' },
  { slug: 'plumbing-work-dispute', category: 'contractors', subcategory: 'plumbing' },
  { slug: 'pipe-repair-dispute', category: 'contractors', subcategory: 'plumbing' },
  { slug: 'water-heater-installation-dispute', category: 'contractors', subcategory: 'plumbing' },
  { slug: 'drain-repair-dispute', category: 'contractors', subcategory: 'plumbing' },
  { slug: 'electrician-complaint', category: 'contractors', subcategory: 'electrical' },
  { slug: 'electrical-work-dispute', category: 'contractors', subcategory: 'electrical' },
  { slug: 'wiring-dispute', category: 'contractors', subcategory: 'electrical' },
  { slug: 'panel-upgrade-dispute', category: 'contractors', subcategory: 'electrical' },
  { slug: 'roofer-complaint', category: 'contractors', subcategory: 'roofing' },
  { slug: 'roofing-work-dispute', category: 'contractors', subcategory: 'roofing' },
  { slug: 'roof-leak-repair-dispute', category: 'contractors', subcategory: 'roofing' },
  { slug: 'gutter-installation-dispute', category: 'contractors', subcategory: 'roofing' },
  { slug: 'hvac-complaint', category: 'contractors', subcategory: 'hvac' },
  { slug: 'hvac-installation-dispute', category: 'contractors', subcategory: 'hvac' },
  { slug: 'ac-repair-dispute', category: 'contractors', subcategory: 'hvac' },
  { slug: 'heating-installation-dispute', category: 'contractors', subcategory: 'hvac' },
  { slug: 'landscaper-complaint', category: 'contractors', subcategory: 'landscaping' },
  { slug: 'landscaping-work-dispute', category: 'contractors', subcategory: 'landscaping' },
  { slug: 'lawn-care-dispute', category: 'contractors', subcategory: 'landscaping' },
  { slug: 'irrigation-dispute', category: 'contractors', subcategory: 'landscaping' },
  { slug: 'tree-service-dispute', category: 'contractors', subcategory: 'landscaping' },
  { slug: 'flooring-complaint', category: 'contractors', subcategory: 'flooring-painting' },
  { slug: 'painting-complaint', category: 'contractors', subcategory: 'flooring-painting' },
  { slug: 'tile-installation-dispute', category: 'contractors', subcategory: 'flooring-painting' },
  { slug: 'hardwood-floor-dispute', category: 'contractors', subcategory: 'flooring-painting' },
  { slug: 'kitchen-remodel-complaint', category: 'contractors', subcategory: 'kitchen-bath' },
  { slug: 'bathroom-remodel-complaint', category: 'contractors', subcategory: 'kitchen-bath' },
  { slug: 'cabinet-installation-dispute', category: 'contractors', subcategory: 'kitchen-bath' },
  { slug: 'countertop-installation-dispute', category: 'contractors', subcategory: 'kitchen-bath' },
  { slug: 'window-installation-dispute', category: 'contractors', subcategory: 'windows-doors' },
  { slug: 'door-installation-dispute', category: 'contractors', subcategory: 'windows-doors' },
  { slug: 'siding-dispute', category: 'contractors', subcategory: 'windows-doors' },
  { slug: 'pool-contractor-complaint', category: 'contractors', subcategory: 'specialty' },
  { slug: 'fence-installation-dispute', category: 'contractors', subcategory: 'specialty' },
  { slug: 'concrete-work-dispute', category: 'contractors', subcategory: 'specialty' },
  { slug: 'foundation-repair-dispute', category: 'contractors', subcategory: 'specialty' },
  { slug: 'solar-installation-dispute', category: 'contractors', subcategory: 'specialty' },
  { slug: 'pest-control-dispute', category: 'contractors', subcategory: 'specialty' },
  { slug: 'mold-remediation-dispute', category: 'contractors', subcategory: 'specialty' },
];

// Blog categories
const blogCategories = [
  { slug: 'consumer-rights', name: 'Consumer Rights' },
  { slug: 'landlord-tenant', name: 'Landlord & Tenant' },
  { slug: 'travel-disputes', name: 'Travel Disputes' },
  { slug: 'financial-tips', name: 'Financial Tips' },
  { slug: 'legal-guides', name: 'Legal Guides' },
];

interface BlogPost {
  slug: string;
  category_slug: string;
  updated_at: string;
  published_at: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'index';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];
    let xml = '';

    switch (sitemapType) {
      case 'index':
        xml = generateSitemapIndex(today);
        break;
      
      case 'static':
        xml = generateStaticSitemap(today);
        break;
      
      case 'categories':
        xml = generateCategoriesSitemap(today);
        break;
      
      case 'templates':
        xml = generateTemplatesSitemap(today);
        break;
      
      case 'blog':
        // Fetch published blog posts from database
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('slug, category_slug, updated_at, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching blog posts:', error);
          xml = generateBlogSitemap([], today);
        } else {
          xml = generateBlogSitemap(posts || [], today);
        }
        break;
      
      default:
        xml = generateSitemapIndex(today);
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
});

function generateSitemapIndex(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${FUNCTION_URL}?type=static</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=categories</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=templates</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${FUNCTION_URL}?type=blog</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateStaticSitemap(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/templates</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/articles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/how-it-works</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/faq</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/disclaimer</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/guides</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
}

function generateCategoriesSitemap(today: string): string {
  // Category URLs
  const categoryUrls = categories.map(cat => `  <url>
    <loc>${SITE_URL}/templates/${cat.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  // Subcategory URLs
  const subcategoryUrls: string[] = [];
  for (const [categoryId, subcategories] of Object.entries(subcategoryMappings)) {
    for (const sub of subcategories) {
      subcategoryUrls.push(`  <url>
    <loc>${SITE_URL}/templates/${categoryId}/${sub.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Guide category URLs
  const guideUrls = categories.map(cat => `  <url>
    <loc>${SITE_URL}/guides/${cat.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  // Blog category URLs
  const blogCategoryUrls = blogCategories.map(cat => `  <url>
    <loc>${SITE_URL}/articles/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${subcategoryUrls.join('\n')}
${guideUrls}
${blogCategoryUrls}
</urlset>`;
}

function generateTemplatesSitemap(today: string): string {
  const templateUrls = allTemplates.map(template => `  <url>
    <loc>${SITE_URL}/templates/${template.category}/${template.subcategory}/${template.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${templateUrls}
</urlset>`;
}

function generateBlogSitemap(posts: BlogPost[], today: string): string {
  const urls = posts.map(post => {
    const lastmod = post.updated_at?.split('T')[0] || post.published_at?.split('T')[0] || today;
    return `  <url>
    <loc>${SITE_URL}/articles/${post.category_slug}/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
