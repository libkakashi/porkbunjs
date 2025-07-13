// Base API types
export interface PorkbunAuth {
  secretapikey: string;
  apikey: string;
}

// Ping endpoint
export interface PingResponse {
  yourIp?: string;
}

// Domain pricing
export interface DomainPricing {
  registration: string;
  renewal: string;
  transfer: string;
}

export interface PricingResponse {
  pricing?: Record<string, DomainPricing>;
}

// Domain types
export interface DomainLabel {
  id: string;
  title: string;
  color: string;
}

export interface Domain {
  domain: string;
  status: string;
  tld: string;
  createDate: string;
  expireDate: string;
  securityLock: string;
  whoisPrivacy: string;
  autoRenew: number;
  notLocal: number;
  labels?: DomainLabel[];
}

export interface ListDomainsOptions {
  start?: string;
  includeLabels?: boolean;
}

export interface ListDomainsResult {
  domains?: Domain[];
}

// Name servers
export interface UpdateNameServersOptions {
  ns: string[];
}

export interface GetNameServersResult {
  ns?: string[];
}

// URL forwarding
export interface URLForward {
  id: string;
  subdomain: string;
  location: string;
  type: 'temporary' | 'permanent';
  includePath: boolean;
  wildcard: boolean;
}

export interface AddURLForwardOptions {
  subdomain?: string;
  location: string;
  type: 'temporary' | 'permanent';
  includePath: boolean;
  wildcard: boolean;
}

export interface GetURLForwardingResult {
  forwards?: URLForward[];
}

// Domain availability
export interface DomainAvailabilityCheck {
  avail: boolean;
  type: string;
  price: string;
  firstYearPromo?: boolean;
  regularPrice: string;
  premium: boolean;
  additional?: {
    renewal: {
      type: string;
      price: string;
      regularPrice: string;
    };
    transfer: {
      type: string;
      price: string;
      regularPrice: string;
    };
  };
}

export interface DomainCheckLimits {
  TTL: string;
  limit: string;
  used: number;
  naturalLanguage: string;
}

export interface DomainCheckResult {
  response?: DomainAvailabilityCheck;
  limits?: DomainCheckLimits;
}

// Glue records
export interface CreateGlueRecordOptions {
  ips: string[];
}

export interface UpdateGlueRecordOptions {
  ips: string[];
}

export interface GlueRecordHost {
  v6?: string[];
  v4?: string[];
}

export interface GetGlueRecordsResult {
  hosts?: [string, GlueRecordHost][];
}

// DNS records
export type DNSRecordType =
  | 'A'
  | 'MX'
  | 'CNAME'
  | 'ALIAS'
  | 'TXT'
  | 'NS'
  | 'AAAA'
  | 'SRV'
  | 'TLSA'
  | 'CAA'
  | 'HTTPS'
  | 'SVCB';

export interface DNSRecord {
  id: string;
  name: string;
  type: DNSRecordType;
  content: string;
  ttl: string;
  prio: string;
  notes: string;
}

export interface CreateDNSRecordOptions {
  name?: string;
  type: DNSRecordType;
  content: string;
  ttl?: string;
  prio?: string;
  notes?: string;
}

export interface CreateDNSRecordResult {
  id?: string;
}

export interface EditDNSRecordOptions {
  name?: string;
  type: DNSRecordType;
  content: string;
  ttl?: string;
  prio?: string;
  notes?: string | null;
}

export interface EditDNSRecordByTypeOptions {
  content: string;
  ttl?: string;
  prio?: string;
  notes?: string | null;
}

export interface GetDNSRecordsResult {
  records?: DNSRecord[];
}

// DNSSEC records
export interface CreateDNSSECRecordOptions {
  keyTag: string;
  alg: string;
  digestType: string;
  digest: string;
  maxSigLife?: string;
  keyDataFlags?: string;
  keyDataProtocol?: string;
  keyDataAlgo?: string;
  keyDataPubKey?: string;
}

export interface DNSSECRecord {
  keyTag: string;
  alg: string;
  digestType: string;
  digest: string;
}

export interface GetDNSSECRecordsResult {
  records?: Record<string, DNSSECRecord>;
}

// SSL certificates
export interface SSLBundle {
  certificatechain: string;
  privatekey: string;
  publickey: string;
}

export type GetSSLBundleResult = Partial<SSLBundle>;

// API client configuration
export interface PorkbunConfig {
  apiKey: string;
  secretApiKey: string;
  baseUrl?: string;
  timeout?: number;
}
