import type { FieldValidation } from '@/data/letterTemplates';

// ============= Validation Format Type =============
// Local type that matches letterTemplates.ts ValidationFormat
type ValidationFormat = 
  | 'email' | 'phone' | 'date' | 'currency' 
  | 'pir' | 'pnr' | 'iata' | 'flightNumber' | 'bagTag' | 'worldTracer'
  | 'policyNumber' | 'claimNumber'
  | 'vin' | 'licensePlate'
  | 'accountLast4' | 'sortCode' | 'iban'
  | 'tenancyRef'
  | 'npiNumber' | 'rxNumber'
  | 'licenseNumber' | 'permitNumber';

// ============= Validation Result Type =============
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
}

// ============= Industry-Specific Validation Patterns =============

export const validationPatterns: Record<ValidationFormat, RegExp> = {
  // Common formats
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  currency: /^[£€$]?\s?[\d,]+\.?\d{0,2}$/,
  
  // Travel - Airlines & Airports
  pnr: /^[A-Z0-9]{6}$/i,                    // Booking reference (6 alphanumeric)
  iata: /^[A-Z]{3}$/i,                      // Airport code (3 letters)
  flightNumber: /^[A-Z]{2}\d{1,4}[A-Z]?$/i, // e.g., BA123, AA1234A
  pir: /^[A-Z]{5}\d{5}$/i,                  // Property Irregularity Report
  worldTracer: /^[A-Z]{3}\d{5}$/i,          // WorldTracer number
  bagTag: /^\d{10}$/,                       // 10-digit bag tag
  
  // Insurance
  policyNumber: /^[A-Z]{2,4}[-]?\d{6,12}$/i,
  claimNumber: /^(CLM[-]?)?\d{6,12}$/i,
  
  // Vehicle
  vin: /^[A-HJ-NPR-Z0-9]{17}$/i,            // 17 chars, excludes I, O, Q
  licensePlate: /^[A-Z0-9]{2,8}$/i,
  
  // Financial
  accountLast4: /^\d{4}$/,
  sortCode: /^\d{2}[-]?\d{2}[-]?\d{2}$/,
  iban: /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/i,
  
  // Housing
  tenancyRef: /^[A-Z0-9]{4,15}$/i,
  
  // Healthcare
  npiNumber: /^\d{10}$/,                    // Provider NPI
  rxNumber: /^(RX)?\d{6,12}$/i,             // Prescription number
  
  // Contractors
  licenseNumber: /^[A-Z]{2,4}[-]?\d{6,12}$/i,
  permitNumber: /^[A-Z0-9]{6,20}$/i,
};

// ============= Human-Readable Format Names =============

export const formatDisplayNames: Record<ValidationFormat, string> = {
  email: 'Email Address',
  phone: 'Phone Number',
  date: 'Date',
  currency: 'Currency Amount',
  pnr: 'Booking Reference (PNR)',
  iata: 'Airport Code (IATA)',
  flightNumber: 'Flight Number',
  pir: 'PIR Reference',
  worldTracer: 'WorldTracer Number',
  bagTag: 'Bag Tag Number',
  policyNumber: 'Policy Number',
  claimNumber: 'Claim Number',
  vin: 'Vehicle Identification Number (VIN)',
  licensePlate: 'License Plate',
  accountLast4: 'Last 4 Digits of Account',
  sortCode: 'Sort Code',
  iban: 'IBAN',
  tenancyRef: 'Tenancy Reference',
  npiNumber: 'NPI Number',
  rxNumber: 'Prescription Number',
  licenseNumber: 'Contractor License Number',
  permitNumber: 'Permit Number',
};

// ============= Format-Specific Error Messages =============

export const formatErrorMessages: Record<ValidationFormat, string> = {
  email: 'Please enter a valid email address (e.g., name@example.com)',
  phone: 'Please enter a valid phone number',
  date: 'Please enter a valid date',
  currency: 'Please enter a valid amount (e.g., €99.99 or £50)',
  pnr: 'Booking reference should be 6 letters/numbers (e.g., ABC123)',
  iata: 'Airport code should be 3 letters (e.g., LHR, JFK)',
  flightNumber: 'Flight number format: 2 letters + 1-4 digits (e.g., BA123)',
  pir: 'PIR format: 5 letters + 5 numbers (e.g., LHRBA12345)',
  worldTracer: 'WorldTracer format: 3 letters + 5 numbers (e.g., LHR12345)',
  bagTag: 'Bag tag should be 10 digits',
  policyNumber: 'Policy number format: 2-4 letters + 6-12 digits',
  claimNumber: 'Claim number format: CLM + 6-12 digits or just digits',
  vin: 'VIN must be exactly 17 characters (letters and numbers)',
  licensePlate: 'License plate should be 2-8 letters/numbers',
  accountLast4: 'Enter the last 4 digits of your account number',
  sortCode: 'Sort code format: XX-XX-XX (e.g., 12-34-56)',
  iban: 'IBAN format: Country code + check digits + account number',
  tenancyRef: 'Tenancy reference should be 4-15 characters',
  npiNumber: 'NPI should be exactly 10 digits',
  rxNumber: 'Prescription number format: RX + 6-12 digits or just digits',
  licenseNumber: 'License number format: 2-4 letters + 6-12 digits',
  permitNumber: 'Permit number should be 6-20 characters',
};

// ============= Format Examples =============

export const formatExamples: Record<ValidationFormat, string> = {
  email: 'john.smith@example.com',
  phone: '+44 20 1234 5678',
  date: '2024-01-15',
  currency: '€99.99',
  pnr: 'ABC123',
  iata: 'LHR',
  flightNumber: 'BA123',
  pir: 'LHRBA12345',
  worldTracer: 'LHR12345',
  bagTag: '1234567890',
  policyNumber: 'POL-123456789',
  claimNumber: 'CLM-123456',
  vin: '1HGBH41JXMN109186',
  licensePlate: 'AB12CDE',
  accountLast4: '1234',
  sortCode: '12-34-56',
  iban: 'GB82WEST12345698765432',
  tenancyRef: 'TEN123456',
  npiNumber: '1234567890',
  rxNumber: 'RX123456',
  licenseNumber: 'CON-123456',
  permitNumber: 'PER123456789',
};

// ============= Main Validation Function =============

export function validateField(
  value: string,
  validation: FieldValidation
): ValidationResult {
  // Empty value handling - let required check handle this
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  const trimmedValue = value.trim();

  // Check format-based validation
  if (validation.format) {
    const pattern = validationPatterns[validation.format];
    if (pattern && !pattern.test(trimmedValue)) {
      return {
        isValid: false,
        message: validation.patternMessage || formatErrorMessages[validation.format],
        suggestion: `Example: ${formatExamples[validation.format]}`,
      };
    }
  }

  // Check custom pattern
  if (validation.pattern) {
    const customPattern = new RegExp(validation.pattern);
    if (!customPattern.test(trimmedValue)) {
      return {
        isValid: false,
        message: validation.patternMessage || 'Please check the format',
      };
    }
  }

  // Check min length
  if (validation.minLength && trimmedValue.length < validation.minLength) {
    return {
      isValid: false,
      message: `Please enter at least ${validation.minLength} characters`,
    };
  }

  // Check max length
  if (validation.maxLength && trimmedValue.length > validation.maxLength) {
    return {
      isValid: false,
      message: `Please keep this under ${validation.maxLength} characters`,
    };
  }

  return { isValid: true };
}

// ============= Field Strength Scoring =============

export interface FieldStrength {
  score: number;        // 0-100
  level: 'weak' | 'moderate' | 'strong';
  feedback?: string;
}

export function assessFieldStrength(
  value: string,
  fieldType: string,
  isRequired: boolean,
  impactLevel?: 'critical' | 'important' | 'helpful'
): FieldStrength {
  if (!value || value.trim() === '') {
    if (isRequired) {
      return { score: 0, level: 'weak', feedback: 'This field is required' };
    }
    return { score: 50, level: 'moderate', feedback: 'Optional but could strengthen your case' };
  }

  const trimmedValue = value.trim();
  let score = 50; // Base score for having content

  // Length-based scoring for text fields
  if (fieldType === 'text') {
    if (trimmedValue.length >= 5) score += 20;
    if (trimmedValue.length >= 10) score += 10;
  }

  // Content quality for textareas
  if (fieldType === 'textarea') {
    const wordCount = trimmedValue.split(/\s+/).length;
    if (wordCount >= 10) score += 15;
    if (wordCount >= 25) score += 10;
    if (wordCount >= 50) score += 10;
    
    // Check for specificity markers
    if (/\d/.test(trimmedValue)) score += 5; // Contains numbers
    if (/[£€$]/.test(trimmedValue)) score += 5; // Contains currency
    if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(trimmedValue)) score += 5; // Contains dates
  }

  // Impact level modifier
  if (impactLevel === 'critical') {
    score = Math.min(100, score + 10);
  } else if (impactLevel === 'helpful' && score > 70) {
    score = Math.min(score, 85); // Cap helpful fields
  }

  // Determine level
  let level: 'weak' | 'moderate' | 'strong' = 'weak';
  let feedback: string | undefined;

  if (score >= 80) {
    level = 'strong';
    feedback = 'Excellent detail provided';
  } else if (score >= 50) {
    level = 'moderate';
    feedback = fieldType === 'textarea' 
      ? 'Consider adding more specific details (dates, amounts, names)'
      : 'Good';
  } else {
    level = 'weak';
    feedback = 'More detail would strengthen your case';
  }

  return { score: Math.min(100, score), level, feedback };
}

// ============= Overall Letter Strength =============

export interface LetterStrength {
  overallScore: number;
  level: 'weak' | 'moderate' | 'strong';
  completedFields: number;
  totalRequired: number;
  criticalMissing: string[];
  suggestions: string[];
}

export function assessLetterStrength(
  fieldValues: Record<string, string>,
  fields: Array<{ id: string; label: string; type: string; required: boolean; impactLevel?: 'critical' | 'important' | 'helpful' }>
): LetterStrength {
  let totalScore = 0;
  let weightedTotal = 0;
  let completedFields = 0;
  const criticalMissing: string[] = [];
  const suggestions: string[] = [];

  fields.forEach(field => {
    const value = fieldValues[field.id] || '';
    const hasValue = value.trim() !== '';
    
    // Weight based on impact level
    const weight = field.impactLevel === 'critical' ? 3 : field.impactLevel === 'important' ? 2 : 1;
    weightedTotal += weight * 100;

    if (hasValue) {
      completedFields++;
      const strength = assessFieldStrength(value, field.type, field.required, field.impactLevel);
      totalScore += strength.score * weight;
    } else {
      if (field.required) {
        if (field.impactLevel === 'critical') {
          criticalMissing.push(field.label);
        }
        suggestions.push(`Complete the "${field.label}" field`);
      }
    }
  });

  const overallScore = weightedTotal > 0 ? Math.round((totalScore / weightedTotal) * 100) : 0;
  const totalRequired = fields.filter(f => f.required).length;

  let level: 'weak' | 'moderate' | 'strong' = 'weak';
  if (overallScore >= 75 && criticalMissing.length === 0) {
    level = 'strong';
  } else if (overallScore >= 50) {
    level = 'moderate';
  }

  // Add contextual suggestions
  if (criticalMissing.length > 0) {
    suggestions.unshift(`Fill in critical fields: ${criticalMissing.slice(0, 2).join(', ')}`);
  }

  return {
    overallScore,
    level,
    completedFields,
    totalRequired,
    criticalMissing,
    suggestions: suggestions.slice(0, 3), // Top 3 suggestions
  };
}
