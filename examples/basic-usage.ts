import {PorkbunClient, PorkbunAuthError, PorkbunRateLimitError} from '../src';

// Initialize the client
const client = new PorkbunClient({
  apiKey: process.env.PORKBUN_API_KEY || 'your-api-key',
  secretKey: process.env.PORKBUN_SECRET_API_KEY || 'your-secret-api-key',
});

async function basicExamples() {
  try {
    console.log('=== Porkbun API Basic Usage Examples ===\n');

    // 1. Test API connection
    console.log('1. Testing API connection...');
    const pingResult = await client.ping();
    console.log(`✓ Connected! Your IP: ${pingResult.yourIp}\n`);

    // 2. Get domain pricing (no auth required)
    console.log('2. Getting domain pricing...');
    const pricing = await client.getPricing();
    if (pricing.pricing) {
      console.log(`✓ .com registration: $${pricing.pricing.com?.registration}`);
      console.log(
        `✓ .org registration: $${pricing.pricing.org?.registration}\n`,
      );
    }

    // 3. List domains in account
    console.log('3. Listing domains in account...');
    const domains = await client.listDomains({includeLabels: true});
    if (domains.domains && domains.domains.length > 0) {
      console.log(`✓ Found ${domains.domains.length} domain(s):`);
      domains.domains.forEach(domain => {
        console.log(`  - ${domain.domain} (${domain.status})`);
      });
      console.log();
    } else {
      console.log('✓ No domains found in account\n');
    }

    // Note: The following examples require you to have a domain in your account
    const exampleDomain = 'example.com'; // Replace with your actual domain

    // 4. Get name servers
    console.log(`4. Getting name servers for ${exampleDomain}...`);
    try {
      const nameServers = await client.getNameServers(exampleDomain);
      if (nameServers.ns) {
        console.log('✓ Current name servers:');
        nameServers.ns.forEach(ns => console.log(`  - ${ns}`));
        console.log();
      }
    } catch (error) {
      console.log(
        `⚠ Skipping name servers (domain may not exist): ${error instanceof Error ? error.message : error}\n`,
      );
    }

    // 5. Get DNS records
    console.log(`5. Getting DNS records for ${exampleDomain}...`);
    try {
      const dnsRecords = await client.getDNSRecords(exampleDomain);
      if (dnsRecords.records && dnsRecords.records.length > 0) {
        console.log(`✓ Found ${dnsRecords.records.length} DNS record(s):`);
        dnsRecords.records.slice(0, 5).forEach(record => {
          console.log(`  - ${record.name} (${record.type}): ${record.content}`);
        });
        if (dnsRecords.records.length > 5) {
          console.log(`  ... and ${dnsRecords.records.length - 5} more`);
        }
        console.log();
      }
    } catch (error) {
      console.log(
        `⚠ Skipping DNS records (domain may not exist): ${error instanceof Error ? error.message : error}\n`,
      );
    }

    // 6. Check domain availability (rate limited)
    console.log('6. Checking domain availability...');
    try {
      const availability = await client.checkDomain(
        'this-domain-probably-does-not-exist-12345.com',
      );
      if (availability.response) {
        console.log(
          `✓ Domain available: ${availability.response.avail ? 'Yes' : 'No'}`,
        );
        if (availability.response.avail) {
          console.log(`  Registration price: $${availability.response.price}`);
        }
        if (availability.limits) {
          console.log(
            `  Rate limit status: ${availability.limits.naturalLanguage}`,
          );
        }
        console.log();
      }
    } catch (error) {
      if (error instanceof PorkbunRateLimitError) {
        console.log(`⚠ Rate limit hit: ${error.message}`);
        if (error.limits) {
          console.log(`  ${error.limits.naturalLanguage}\n`);
        }
      } else {
        console.log(
          `⚠ Error checking domain: ${error instanceof Error ? error.message : error}\n`,
        );
      }
    }

    console.log('=== Basic examples completed! ===');
  } catch (error) {
    if (error instanceof PorkbunAuthError) {
      console.error('❌ Authentication failed. Please check your API keys.');
    } else {
      console.error(
        '❌ Error:',
        error instanceof Error ? error.message : error,
      );
    }
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  void basicExamples();
}

export {basicExamples};
