export interface Address {
  line1: string
  line2: string
  town: string
  county: string
  postcode: string
}

export interface Psc {
  name: string
  dob_month: string // form holds strings; coerced to number on submit
  dob_year: string
}

export interface UploadedFileRef {
  ticket: string
  filename: string
}

export interface ApplicationFormState {
  // Step 1
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number: string
  vat_number: string
  awrs_urn: string
  years_trading: string
  website: string
  psc: Psc[]
  // Step 2
  trading_address: Address
  registered_address_same: boolean
  registered_address: Address
  premises_licence_number: string
  licensing_authority: string
  dps_name: string
  personal_licence_number: string
  premises_licence_file: UploadedFileRef | null
  // Step 3
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  director_id_file: UploadedFileRef | null
  // Step 4
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard: string
  notes: string
  declaration: boolean
  marketing_opt_in: boolean
  // Honeypot
  website_url: string
}

export const EMPTY_ADDRESS: Address = {
  line1: '', line2: '', town: '', county: '', postcode: '',
}

export const INITIAL_STATE: ApplicationFormState = {
  trading_name: '',
  legal_entity_name: '',
  legal_structure: '',
  business_type: '',
  companies_house_number: '',
  vat_number: '',
  awrs_urn: '',
  years_trading: '',
  website: '',
  psc: [],
  trading_address: { ...EMPTY_ADDRESS },
  registered_address_same: true,
  registered_address: { ...EMPTY_ADDRESS },
  premises_licence_number: '',
  licensing_authority: '',
  dps_name: '',
  personal_licence_number: '',
  premises_licence_file: null,
  contact_name: '',
  contact_role: '',
  contact_email: '',
  contact_phone: '',
  director_name: '',
  director_id_file: null,
  expected_initial_volume: '',
  expected_monthly_volume: '',
  payment_terms_pref: '',
  how_heard: '',
  notes: '',
  declaration: false,
  marketing_opt_in: false,
  website_url: '',
}

export const LEGAL_STRUCTURES = ['Sole Trader', 'Partnership', 'Ltd', 'LLP', 'PLC', 'CIC', 'Charity', 'Other']
export const BUSINESS_TYPES = ['Pub/Bar', 'Restaurant', 'Hotel', 'Club', 'Off-licence', 'Wholesaler', 'Distributor', 'Other']
export const VOLUMES = ['<12 bottles', '12–36', '36–72', '72–144', '144+']
export const PAYMENT_TERMS = ['Pro-forma', '14 days', '30 days']

export const STRUCTURES_REQUIRING_CH = new Set(['Ltd', 'LLP', 'PLC', 'CIC', 'Charity'])
export const TYPES_REQUIRING_AWRS = new Set(['Wholesaler', 'Distributor'])
export const TYPES_REQUIRING_LICENCE = new Set(['Pub/Bar', 'Restaurant', 'Hotel', 'Club', 'Off-licence'])
