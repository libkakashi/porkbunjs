import {PorkbunClient} from '../src';

// Initialize the client
const client = new PorkbunClient({
  apiKey: process.env.PORKBUN_API_KEY || 'your-api-key',
  secretKey: process.env.PORKBUN_SECRET_API_KEY || 'your-secret-api-key',
});

async function dnsManagementExamples() {
  const domain = 'example.com'; // Replace with your actual domain

  try {
    console.log('=== DNS Management Examples ===\n');

    // 1. Create various types of DNS records
    console.log('1. Creating DNS records...');

    // A record for www subdomain
    const aRecord = await client.createDNSRecord(domain, {
      name: 'www',
      type: 'A',
      content: '192.168.1.100',
      ttl: '300',
      notes: 'Web server A record',
    });
    console.log(`✓ Created A record with ID: ${aRecord.id}`);

    // AAAA record for IPv6
    const aaaaRecord = await client.createDNSRecord(domain, {
      name: 'www',
      type: 'AAAA',
      content: '2001:db8::1',
      ttl: '300',
      notes: 'Web server IPv6 record',
    });
    console.log(`✓ Created AAAA record with ID: ${aaaaRecord.id}`);

    // MX record for email
    const mxRecord = await client.createDNSRecord(domain, {
      type: 'MX',
      content: 'mail.example.com',
      prio: '10',
      ttl: '3600',
      notes: 'Primary mail server',
    });
    console.log(`✓ Created MX record with ID: ${mxRecord.id}`);

    // TXT record for SPF
    const spfRecord = await client.createDNSRecord(domain, {
      type: 'TXT',
      content: 'v=spf1 include:_spf.google.com ~all',
      ttl: '3600',
      notes: 'SPF record for email',
    });
    console.log(`✓ Created TXT record with ID: ${spfRecord.id}`);

    // CNAME record for subdomain
    const cnameRecord = await client.createDNSRecord(domain, {
      name: 'blog',
      type: 'CNAME',
      content: 'www.example.com',
      ttl: '1800',
      notes: 'Blog subdomain',
    });
    console.log(`✓ Created CNAME record with ID: ${cnameRecord.id}\n`);

    // 2. Retrieve all DNS records
    console.log('2. Retrieving all DNS records...');
    const allRecords = await client.getDNSRecords(domain);
    if (allRecords.records) {
      console.log(`✓ Found ${allRecords.records.length} total records:`);
      allRecords.records.forEach(record => {
        console.log(
          `  ${record.type} ${record.name} -> ${record.content} (TTL: ${record.ttl})`,
        );
      });
      console.log();
    }

    // 3. Retrieve specific record types
    console.log('3. Retrieving specific record types...');

    // Get all A records
    const aRecords = await client.getDNSRecordsByType(domain, 'A');
    if (aRecords.records) {
      console.log(`✓ Found ${aRecords.records.length} A record(s):`);
      aRecords.records.forEach(record => {
        console.log(`  ${record.name} -> ${record.content}`);
      });
    }

    // Get A records for www subdomain specifically
    const wwwARecords = await client.getDNSRecordsByType(domain, 'A', 'www');
    if (wwwARecords.records) {
      console.log(
        `✓ Found ${wwwARecords.records.length} A record(s) for www subdomain:`,
      );
      wwwARecords.records.forEach(record => {
        console.log(`  ${record.name} -> ${record.content}`);
      });
    }
    console.log();

    // 4. Edit DNS records
    console.log('4. Editing DNS records...');

    if (aRecord.id) {
      // Edit specific record by ID
      await client.editDNSRecord(domain, aRecord.id, {
        name: 'www',
        type: 'A',
        content: '192.168.1.101', // Updated IP
        ttl: '600',
        notes: 'Updated web server A record',
      });
      console.log(`✓ Updated A record ${aRecord.id} with new IP`);
    }

    // Edit all A records for www subdomain
    await client.editDNSRecordsByType(domain, 'A', 'www', {
      content: '192.168.1.102',
      ttl: '900',
    });
    console.log('✓ Updated all A records for www subdomain\n');

    // 5. Create records for common services
    console.log('5. Creating records for common services...');

    // DMARC record
    await client.createDNSRecord(domain, {
      name: '_dmarc',
      type: 'TXT',
      content: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
      ttl: '3600',
      notes: 'DMARC policy',
    });
    console.log('✓ Created DMARC record');

    // DKIM record (example)
    await client.createDNSRecord(domain, {
      name: 'default._domainkey',
      type: 'TXT',
      content: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...',
      ttl: '3600',
      notes: 'DKIM public key',
    });
    console.log('✓ Created DKIM record');

    // SRV record for service discovery
    await client.createDNSRecord(domain, {
      name: '_sip._tcp',
      type: 'SRV',
      content: '10 5 5060 sip.example.com',
      ttl: '3600',
      notes: 'SIP service record',
    });
    console.log('✓ Created SRV record');

    // CAA record for certificate authority authorization
    await client.createDNSRecord(domain, {
      type: 'CAA',
      content: '0 issue "letsencrypt.org"',
      ttl: '3600',
      notes: "Allow Let's Encrypt certificates",
    });
    console.log('✓ Created CAA record\n');

    // 6. Demonstrate wildcard and root domain records
    console.log('6. Creating wildcard and root domain records...');

    // Wildcard A record
    await client.createDNSRecord(domain, {
      name: '*',
      type: 'A',
      content: '192.168.1.200',
      ttl: '1800',
      notes: 'Wildcard catch-all',
    });
    console.log('✓ Created wildcard A record');

    // Root domain A record (empty name)
    await client.createDNSRecord(domain, {
      name: '', // Root domain
      type: 'A',
      content: '192.168.1.100',
      ttl: '3600',
      notes: 'Root domain A record',
    });
    console.log('✓ Created root domain A record\n');

    // 7. Clean up - delete some test records
    console.log('7. Cleaning up test records...');

    if (cnameRecord.id) {
      await client.deleteDNSRecord(domain, cnameRecord.id);
      console.log(`✓ Deleted CNAME record ${cnameRecord.id}`);
    }

    // Delete all AAAA records for www subdomain
    await client.deleteDNSRecordsByType(domain, 'AAAA', 'www');
    console.log('✓ Deleted all AAAA records for www subdomain');

    console.log('\n=== DNS management examples completed! ===');
  } catch (error) {
    console.error(
      '❌ Error in DNS management:',
      error instanceof Error ? error.message : error,
    );
  }
}

// Advanced DNS record examples
async function advancedDNSExamples() {
  const domain = 'example.com'; // Replace with your actual domain

  try {
    console.log('\n=== Advanced DNS Examples ===\n');

    // 1. Create multiple records for load balancing
    console.log('1. Setting up DNS-based load balancing...');
    const servers = ['192.168.1.10', '192.168.1.11', '192.168.1.12'];

    for (let i = 0; i < servers.length; i++) {
      await client.createDNSRecord(domain, {
        name: 'api',
        type: 'A',
        content: servers[i],
        ttl: '60', // Short TTL for load balancing
        notes: `API server ${i + 1}`,
      });
      console.log(`✓ Added API server ${i + 1}: ${servers[i]}`);
    }
    console.log();

    // 2. Geographic DNS setup
    console.log('2. Setting up geographic DNS...');
    const geoServers = [
      {region: 'us-east', ip: '192.168.1.20'},
      {region: 'us-west', ip: '192.168.1.21'},
      {region: 'eu', ip: '192.168.1.22'},
    ];

    for (const server of geoServers) {
      await client.createDNSRecord(domain, {
        name: server.region,
        type: 'A',
        content: server.ip,
        ttl: '300',
        notes: `Geographic server - ${server.region}`,
      });
      console.log(`✓ Added ${server.region} server: ${server.ip}`);
    }
    console.log();

    // 3. Email configuration setup
    console.log('3. Setting up complete email configuration...');

    // Multiple MX records with different priorities
    const mxServers = [
      {server: 'mail1.example.com', priority: '10'},
      {server: 'mail2.example.com', priority: '20'},
      {server: 'backup-mail.example.com', priority: '30'},
    ];

    for (const mx of mxServers) {
      await client.createDNSRecord(domain, {
        type: 'MX',
        content: mx.server,
        prio: mx.priority,
        ttl: '3600',
        notes: `Mail server priority ${mx.priority}`,
      });
      console.log(`✓ Added MX record: ${mx.server} (priority ${mx.priority})`);
    }

    // Mail server A records
    for (let i = 1; i <= 2; i++) {
      await client.createDNSRecord(domain, {
        name: `mail${i}`,
        type: 'A',
        content: `192.168.1.${30 + i}`,
        ttl: '3600',
        notes: `Mail server ${i} A record`,
      });
      console.log(`✓ Added mail${i} A record`);
    }
    console.log();

    // 4. Retrieve and display final DNS configuration
    console.log('4. Final DNS configuration:');
    const finalRecords = await client.getDNSRecords(domain);
    if (finalRecords.records) {
      const recordsByType: Record<string, typeof finalRecords.records> = {};

      finalRecords.records.forEach(record => {
        if (!recordsByType[record.type]) {
          recordsByType[record.type] = [];
        }
        recordsByType[record.type].push(record);
      });

      Object.entries(recordsByType).forEach(([type, records]) => {
        console.log(`\n${type} Records:`);
        records.forEach(record => {
          console.log(
            `  ${record.name || '@'} -> ${record.content} (TTL: ${record.ttl})`,
          );
          if (record.notes) {
            console.log(`    Note: ${record.notes}`);
          }
        });
      });
    }

    console.log('\n=== Advanced DNS examples completed! ===');
  } catch (error) {
    console.error(
      '❌ Error in advanced DNS examples:',
      error instanceof Error ? error.message : error,
    );
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  await dnsManagementExamples();
  await advancedDNSExamples();
}

export {dnsManagementExamples, advancedDNSExamples};
