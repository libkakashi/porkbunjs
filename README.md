# PorkbunJS

A comprehensive TypeScript library for the Porkbun API v3, providing easy access to domain management, DNS records, DNSSEC, and SSL certificate functionality.

## Features

- 🔒 **Full TypeScript support** with complete type definitions
- 🌐 **Complete API coverage** for Porkbun API v3
- ⚡ **Modern async/await** interface
- 🛡️ **Built-in error handling** with custom error types
- 🎯 **Rate limiting awareness** for domain availability checks
- 📝 **Comprehensive documentation** and examples

## Installation

```bash
npm install porkbunjs
```

## Quick Start

```typescript
import { PorkbunClient } from 'porkbunjs';

const client = new PorkbunClient({
  apiKey: 'YOUR_API_KEY',
  secretApiKey: 'YOUR_SECRET_API_KEY'
});

// Test the connection
const pingResult = await client.ping();
console.log('Your IP:', pingResult.yourIp);

// List your domains
const domains = await client.listDomains();
console.log('Your domains:', domains.domains);
```

## API Reference

### Authentication

Get your API keys from [porkbun.com/account/api](https://porkbun.com/account/api).

```typescript
const client = new PorkbunClient({
  apiKey: 'YOUR_API_KEY',
  secretApiKey: 'YOUR_SECRET_API_KEY',
  baseUrl: 'https://api.porkbun.com/api/json/v3', // optional
  timeout: 30000 // optional, in milliseconds
});
```

### General API Methods

#### Ping
Test API connectivity and get your IP address:

```typescript
const result = await client.ping();
console.log(result.yourIp); // Your public IP address
```

#### Get Domain Pricing
Get pricing for all supported TLDs (no authentication required):

```typescript
const pricing = await client.getPricing();
console.log(pricing.pricing?.com); // { registration: "9.68", renewal: "9.68", transfer: "9.68" }
```

### Domain Management

#### List Domains
Get all domains in your account:

```typescript
const domains = await client.listDomains({
  start: '0', // optional, for pagination
  includeLabels: true // optional, include label information
});
```

#### Name Server Management
Update and retrieve name servers:

```typescript
// Update name servers
await client.updateNameServers('example.com', [
  'ns1.example.com',
  'ns2.example.com'
]);

// Get current name servers
const ns = await client.getNameServers('example.com');
console.log(ns.ns); // Array of name servers
```

#### URL Forwarding
Manage URL forwarding for your domains:

```typescript
// Add URL forward
await client.addURLForward('example.com', {
  subdomain: 'www', // optional, leave empty for root domain
  location: 'https://mysite.com',
  type: 'permanent', // or 'temporary'
  includePath: true,
  wildcard: false
});

// Get URL forwards
const forwards = await client.getURLForwarding('example.com');

// Delete URL forward
await client.deleteURLForward('example.com', 'RECORD_ID');
```

#### Domain Availability
Check if a domain is available (rate limited):

```typescript
try {
  const result = await client.checkDomain('example.com');
  console.log('Available:', result.response?.avail === 'yes');
  console.log('Price:', result.response?.price);
} catch (error) {
  if (error instanceof PorkbunRateLimitError) {
    console.log('Rate limit hit:', error.limits);
  }
}
```

#### Glue Records
Manage glue records for your domains:

```typescript
// Create glue record
await client.createGlueRecord('example.com', 'ns1', [
  '192.168.1.1',
  '2001:db8::1'
]);

// Update glue record
await client.updateGlueRecord('example.com', 'ns1', ['192.168.1.2']);

// Get all glue records
const glue = await client.getGlueRecords('example.com');

// Delete glue record
await client.deleteGlueRecord('example.com', 'ns1');
```

### DNS Management

#### Create DNS Records
Create various types of DNS records:

```typescript
// A record
const result = await client.createDNSRecord('example.com', {
  name: 'www', // subdomain, leave empty for root
  type: 'A',
  content: '1.1.1.1',
  ttl: '300', // optional, defaults to 600
  notes: 'Web server' // optional
});
console.log('Record ID:', result.id);

// MX record
await client.createDNSRecord('example.com', {
  type: 'MX',
  content: 'mail.example.com',
  prio: '10' // priority for MX records
});

// TXT record
await client.createDNSRecord('example.com', {
  name: '_dmarc',
  type: 'TXT',
  content: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com'
});
```

#### Edit DNS Records
Edit existing DNS records:

```typescript
// Edit by record ID
await client.editDNSRecord('example.com', 'RECORD_ID', {
  type: 'A',
  content: '2.2.2.2',
  ttl: '600'
});

// Edit all records of specific type/subdomain
await client.editDNSRecordsByType('example.com', 'A', 'www', {
  content: '3.3.3.3'
});
```

#### Retrieve DNS Records
Get DNS records in various ways:

```typescript
// Get all records for domain
const allRecords = await client.getDNSRecords('example.com');

// Get specific record by ID
const record = await client.getDNSRecords('example.com', 'RECORD_ID');

// Get records by type and subdomain
const aRecords = await client.getDNSRecordsByType('example.com', 'A', 'www');
```

#### Delete DNS Records
Delete DNS records:

```typescript
// Delete by record ID
await client.deleteDNSRecord('example.com', 'RECORD_ID');

// Delete all records of specific type/subdomain
await client.deleteDNSRecordsByType('example.com', 'A', 'www');
```

### DNSSEC Management

#### Create DNSSEC Records
Add DNSSEC records to your domain:

```typescript
await client.createDNSSECRecord('example.com', {
  keyTag: '64087',
  alg: '13',
  digestType: '2',
  digest: '15E445BD08128BDC213E25F1C8227DF4CB35186CAC701C1C335B2C406D5530DC'
});
```

#### Get DNSSEC Records
Retrieve DNSSEC records:

```typescript
const dnssec = await client.getDNSSECRecords('example.com');
console.log(dnssec.records); // Object with DNSSEC records keyed by key tag
```

#### Delete DNSSEC Records
Remove DNSSEC records:

```typescript
await client.deleteDNSSECRecord('example.com', '64087');
```

### SSL Certificates

#### Get SSL Bundle
Retrieve SSL certificate bundle for a domain:

```typescript
const ssl = await client.getSSLBundle('example.com');
console.log(ssl.certificatechain); // Full certificate chain
console.log(ssl.privatekey); // Private key
console.log(ssl.publickey); // Public key
```

## Error Handling

The library provides specific error types for different scenarios:

```typescript
import { PorkbunAuthError, PorkbunRateLimitError } from 'porkbunjs';

try {
  await client.checkDomain('example.com');
} catch (error) {
  if (error instanceof PorkbunAuthError) {
    console.log('Authentication failed');
  } else if (error instanceof PorkbunRateLimitError) {
    console.log('Rate limit exceeded:', error.limits);
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Supported DNS Record Types

- `A` - IPv4 address
- `AAAA` - IPv6 address
- `CNAME` - Canonical name
- `MX` - Mail exchange
- `TXT` - Text record
- `NS` - Name server
- `SRV` - Service record
- `ALIAS` - Alias record
- `TLSA` - TLSA record
- `CAA` - Certificate Authority Authorization
- `HTTPS` - HTTPS record
- `SVCB` - Service binding

## Rate Limiting

The Porkbun API implements rate limiting, especially for domain availability checks. The library automatically detects rate limit errors and provides detailed information about your current limits.

```typescript
try {
  const result = await client.checkDomain('example.com');
} catch (error) {
  if (error instanceof PorkbunRateLimitError) {
    console.log('Limit details:', error.limits);
    // { TTL: "10", limit: "1", used: 1, naturalLanguage: "1 out of 1 checks within 10 seconds used." }
  }
}
```

## IPv4-Only API

If you need to force IPv4 connections, you can use the IPv4-only hostname:

```typescript
const client = new PorkbunClient({
  apiKey: 'YOUR_API_KEY',
  secretApiKey: 'YOUR_SECRET_API_KEY',
  baseUrl: 'https://api-ipv4.porkbun.com/api/json/v3'
});
```

## Requirements

- Node.js 16+ or modern browser environment
- TypeScript 5+ (for TypeScript projects)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- [Porkbun API Documentation](https://porkbun.com/api/json/v3/documentation)
- [Porkbun Support](https://porkbun.com/support)
- [Create API Keys](https://porkbun.com/account/api)
