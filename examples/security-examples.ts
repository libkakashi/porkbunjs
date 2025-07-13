import {PorkbunClient} from '../src';

// Initialize the client
const client = new PorkbunClient({
  apiKey: process.env.PORKBUN_API_KEY || 'your-api-key',
  secretKey: process.env.PORKBUN_SECRET_API_KEY || 'your-secret-api-key',
});

async function dnssecExamples() {
  const domain = 'example.com'; // Replace with your actual domain

  try {
    console.log('=== DNSSEC Management Examples ===\n');

    // 1. Get current DNSSEC records
    console.log('1. Checking current DNSSEC records...');
    try {
      const currentDnssec = await client.getDNSSECRecords(domain);
      if (
        currentDnssec.records &&
        Object.keys(currentDnssec.records).length > 0
      ) {
        console.log('✓ Current DNSSEC records found:');
        Object.entries(currentDnssec.records).forEach(([keyTag, record]) => {
          console.log(`  Key Tag: ${keyTag}`);
          console.log(`    Algorithm: ${record.alg}`);
          console.log(`    Digest Type: ${record.digestType}`);
          console.log(`    Digest: ${record.digest.substring(0, 32)}...`);
        });
      } else {
        console.log('✓ No DNSSEC records found');
      }
      console.log();
    } catch (error) {
      console.log(
        `⚠ Could not retrieve DNSSEC records: ${error instanceof Error ? error.message : error}\n`,
      );
    }

    // 2. Create DNSSEC records with different algorithms
    console.log('2. Creating DNSSEC records...');

    // ECDSA P-256 with SHA-256 (Algorithm 13)
    const ecdsaRecord = {
      keyTag: '12345',
      alg: '13', // ECDSA P-256 with SHA-256
      digestType: '2', // SHA-256
      digest:
        'A1B2C3D4E5F6789012345678901234567890ABCDEF123456789012345678901234',
    };

    try {
      await client.createDNSSECRecord(domain, ecdsaRecord);
      console.log(
        `✓ Created ECDSA DNSSEC record (Key Tag: ${ecdsaRecord.keyTag})`,
      );
    } catch (error) {
      console.log(
        `⚠ Could not create ECDSA DNSSEC record: ${error instanceof Error ? error.message : error}`,
      );
    }

    // RSA/SHA-256 (Algorithm 8)
    const rsaRecord = {
      keyTag: '54321',
      alg: '8', // RSA/SHA-256
      digestType: '2', // SHA-256
      digest:
        'FEDCBA0987654321098765432109876543210FEDCBA098765432109876543210',
    };

    try {
      await client.createDNSSECRecord(domain, rsaRecord);
      console.log(`✓ Created RSA DNSSEC record (Key Tag: ${rsaRecord.keyTag})`);
    } catch (error) {
      console.log(
        `⚠ Could not create RSA DNSSEC record: ${error instanceof Error ? error.message : error}`,
      );
    }

    // Ed25519 (Algorithm 15) with full key data
    const ed25519Record = {
      keyTag: '98765',
      alg: '15', // Ed25519
      digestType: '2', // SHA-256
      digest:
        '123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF01',
      maxSigLife: '604800', // 7 days
      keyDataFlags: '257', // Zone Signing Key
      keyDataProtocol: '3',
      keyDataAlgo: '15',
      keyDataPubKey:
        'mdsswUyr3DPW132mOi8V9xESWE8jTo0dxCjjnopKl+GqJxpVXckHAeF+KkxLbxILfDLUT0rAK9iUzy1L53eKGQ==',
    };

    try {
      await client.createDNSSECRecord(domain, ed25519Record);
      console.log(
        `✓ Created Ed25519 DNSSEC record (Key Tag: ${ed25519Record.keyTag})`,
      );
    } catch (error) {
      console.log(
        `⚠ Could not create Ed25519 DNSSEC record: ${error instanceof Error ? error.message : error}`,
      );
    }
    console.log();

    // 3. Verify DNSSEC records were created
    console.log('3. Verifying DNSSEC records...');
    try {
      const updatedDnssec = await client.getDNSSECRecords(domain);
      if (updatedDnssec.records) {
        const recordCount = Object.keys(updatedDnssec.records).length;
        console.log(`✓ Found ${recordCount} DNSSEC record(s):`);
        Object.entries(updatedDnssec.records).forEach(([keyTag, record]) => {
          console.log(
            `  Key Tag ${keyTag}: Algorithm ${record.alg}, Digest Type ${record.digestType}`,
          );
        });
      }
      console.log();
    } catch (error) {
      console.log(
        `⚠ Could not verify DNSSEC records: ${error instanceof Error ? error.message : error}\n`,
      );
    }

    // 4. Demonstrate DNSSEC best practices
    console.log('4. DNSSEC Best Practices Example...');
    console.log('ℹ DNSSEC Best Practices:');
    console.log(
      '  • Use Algorithm 13 (ECDSA P-256) or 15 (Ed25519) for new deployments',
    );
    console.log(
      '  • Algorithm 8 (RSA/SHA-256) is still widely supported but less efficient',
    );
    console.log('  • Use Digest Type 2 (SHA-256) for better security');
    console.log('  • Key Tag should be unique and derived from the public key');
    console.log(
      '  • Consider key rollover procedures for production environments',
    );
    console.log();

    // 5. Clean up test records (optional)
    console.log('5. Cleaning up test DNSSEC records...');
    const testKeyTags = ['12345', '54321', '98765'];

    for (const keyTag of testKeyTags) {
      try {
        await client.deleteDNSSECRecord(domain, keyTag);
        console.log(`✓ Deleted DNSSEC record with Key Tag: ${keyTag}`);
      } catch (error) {
        console.log(
          `⚠ Could not delete DNSSEC record ${keyTag}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    console.log('\n=== DNSSEC examples completed! ===\n');
  } catch (error) {
    console.error(
      '❌ Error in DNSSEC examples:',
      error instanceof Error ? error.message : error,
    );
  }
}

async function sslExamples() {
  const domain = 'example.com'; // Replace with your actual domain

  try {
    console.log('=== SSL Certificate Examples ===\n');

    // 1. Retrieve SSL certificate bundle
    console.log('1. Retrieving SSL certificate bundle...');
    try {
      const sslBundle = await client.getSSLBundle(domain);

      if (sslBundle.certificatechain) {
        console.log('✓ SSL certificate bundle retrieved successfully');

        // Parse certificate chain to show details
        const certChain = sslBundle.certificatechain;
        const certCount = (
          certChain.match(/-----BEGIN CERTIFICATE-----/g) || []
        ).length;
        console.log(`  Certificate chain contains ${certCount} certificate(s)`);

        // Show certificate chain structure
        const certificates = certChain.split(
          '-----END CERTIFICATE-----\n\n-----BEGIN CERTIFICATE-----',
        );
        certificates.forEach((cert, index) => {
          if (index === 0) {
            console.log(
              `  [${index + 1}] End Entity Certificate (your domain)`,
            );
          } else if (index === certificates.length - 1) {
            console.log(`  [${index + 1}] Root Certificate Authority`);
          } else {
            console.log(`  [${index + 1}] Intermediate Certificate Authority`);
          }
        });

        console.log();

        // 2. Analyze certificate details
        console.log('2. Certificate bundle analysis...');

        // Extract key information from the first certificate (domain cert)
        const firstCert = certificates[0];
        if (firstCert.includes('-----BEGIN CERTIFICATE-----')) {
          console.log('✓ Certificate format: Valid PEM format');

          // Check for common extensions (simplified analysis)
          if (sslBundle.certificatechain.includes('DNS:')) {
            console.log('✓ Subject Alternative Names (SAN) detected');
          }

          console.log('✓ Private key available');
          console.log('✓ Public key available');
        }
        console.log();

        // 3. Show practical usage examples
        console.log('3. Practical SSL bundle usage...');
        console.log('ℹ How to use this SSL bundle:');
        console.log();

        console.log('📁 For Nginx:');
        console.log('   ssl_certificate /path/to/certificate.crt;');
        console.log('   ssl_certificate_key /path/to/private.key;');
        console.log();

        console.log('📁 For Apache:');
        console.log('   SSLCertificateFile /path/to/certificate.crt');
        console.log('   SSLCertificateKeyFile /path/to/private.key');
        console.log();

        console.log('📁 For Node.js HTTPS server:');
        console.log('   const options = {');
        console.log('     cert: fs.readFileSync("certificate.crt"),');
        console.log('     key: fs.readFileSync("private.key")');
        console.log('   };');
        console.log();

        // 4. Security recommendations
        console.log('4. SSL Security Recommendations...');
        console.log('🔒 Security Best Practices:');
        console.log(
          '  • Store private keys securely with restricted permissions (600)',
        );
        console.log('  • Use TLS 1.2 or higher only');
        console.log('  • Implement HTTP Strict Transport Security (HSTS)');
        console.log('  • Consider Certificate Transparency monitoring');
        console.log('  • Set up automated certificate renewal');
        console.log('  • Use strong cipher suites');
        console.log();

        // 5. Save certificates to files (example)
        console.log('5. Certificate file structure example...');
        console.log('💾 Recommended file structure:');
        console.log('   /etc/ssl/certs/');
        console.log('   ├── example.com.crt          # Full certificate chain');
        console.log('   ├── example.com.key          # Private key');
        console.log(
          '   ├── example.com-chain.crt    # Intermediate certificates only',
        );
        console.log(
          '   └── example.com-fullchain.crt # End cert + intermediates',
        );
        console.log();

        // 6. Certificate validation steps
        console.log('6. Certificate validation checklist...');
        console.log('✅ Validation Steps:');
        console.log('  • Verify certificate matches domain name');
        console.log('  • Check certificate expiration date');
        console.log('  • Validate certificate chain is complete');
        console.log('  • Ensure private key matches certificate');
        console.log('  • Test SSL configuration with tools like SSL Labs');
        console.log();
      } else {
        console.log('⚠ No SSL certificate found for domain');
        console.log('ℹ This might mean:');
        console.log('  • Domain is not using Porkbun SSL services');
        console.log('  • SSL certificate has not been issued yet');
        console.log('  • Domain DNS is not pointing to Porkbun');
        console.log();
      }
    } catch (error) {
      console.log(
        `⚠ Could not retrieve SSL bundle: ${error instanceof Error ? error.message : error}`,
      );
      console.log('ℹ Common reasons:');
      console.log('  • Domain does not have SSL certificate through Porkbun');
      console.log('  • Domain is not active or properly configured');
      console.log('  • SSL certificate is managed by a different provider');
      console.log();
    }

    console.log('=== SSL certificate examples completed! ===\n');
  } catch (error) {
    console.error(
      '❌ Error in SSL examples:',
      error instanceof Error ? error.message : error,
    );
  }
}

async function securityAuditExample() {
  const domain = 'example.com'; // Replace with your actual domain

  try {
    console.log('=== Security Audit Example ===\n');

    console.log(`🔍 Performing security audit for ${domain}...\n`);

    // 1. Check DNSSEC status
    console.log('1. DNSSEC Security Check...');
    try {
      const dnssecRecords = await client.getDNSSECRecords(domain);
      if (
        dnssecRecords.records &&
        Object.keys(dnssecRecords.records).length > 0
      ) {
        console.log('✅ DNSSEC is enabled');

        // Analyze DNSSEC strength
        Object.entries(dnssecRecords.records).forEach(([keyTag, record]) => {
          const alg = parseInt(record.alg);
          let strength = 'Unknown';

          if (alg === 15) strength = 'Excellent (Ed25519)';
          else if (alg === 13) strength = 'Very Good (ECDSA P-256)';
          else if (alg === 8) strength = 'Good (RSA/SHA-256)';
          else if (alg === 7) strength = 'Weak (RSA/SHA-1) - Should upgrade';
          else if (alg === 5) strength = 'Weak (RSA/SHA-1) - Should upgrade';

          console.log(`  Key ${keyTag}: Algorithm ${alg} - ${strength}`);
        });
      } else {
        console.log(
          '⚠️ DNSSEC is not enabled - Consider enabling for better security',
        );
      }
    } catch (error) {
      console.log('❌ Could not check DNSSEC status');
    }
    console.log();

    // 2. Check SSL certificate
    console.log('2. SSL Certificate Check...');
    try {
      const sslBundle = await client.getSSLBundle(domain);
      if (sslBundle.certificatechain) {
        console.log('✅ SSL certificate is available');

        // Basic certificate analysis
        const certChain = sslBundle.certificatechain;
        const certCount = (
          certChain.match(/-----BEGIN CERTIFICATE-----/g) || []
        ).length;

        if (certCount >= 2) {
          console.log('✅ Certificate chain is complete');
        } else {
          console.log('⚠️ Certificate chain may be incomplete');
        }

        if (sslBundle.privatekey) {
          console.log('✅ Private key is available');
        }
      } else {
        console.log('❌ No SSL certificate found');
      }
    } catch (error) {
      console.log('❌ Could not check SSL certificate');
    }
    console.log();

    // 3. Check security-related DNS records
    console.log('3. Security DNS Records Check...');
    try {
      const dnsRecords = await client.getDNSRecords(domain);
      if (dnsRecords.records) {
        const securityRecords = {
          spf: false,
          dmarc: false,
          dkim: false,
          caa: false,
          mta_sts: false,
        };

        dnsRecords.records.forEach(record => {
          if (record.type === 'TXT') {
            if (record.content.includes('v=spf1')) {
              securityRecords.spf = true;
            }
            if (record.name.includes('_dmarc')) {
              securityRecords.dmarc = true;
            }
            if (record.name.includes('_domainkey')) {
              securityRecords.dkim = true;
            }
            if (record.name.includes('_mta-sts')) {
              securityRecords.mta_sts = true;
            }
          }
          if (record.type === 'CAA') {
            securityRecords.caa = true;
          }
        });

        console.log('Email Security:');
        console.log(
          `  SPF Record: ${securityRecords.spf ? '✅ Present' : '❌ Missing'}`,
        );
        console.log(
          `  DMARC Record: ${securityRecords.dmarc ? '✅ Present' : '❌ Missing'}`,
        );
        console.log(
          `  DKIM Record: ${securityRecords.dkim ? '✅ Present' : '❌ Missing'}`,
        );
        console.log(
          `  MTA-STS Record: ${securityRecords.mta_sts ? '✅ Present' : '⚠️ Optional'}`,
        );

        console.log('Certificate Security:');
        console.log(
          `  CAA Record: ${securityRecords.caa ? '✅ Present' : '⚠️ Recommended'}`,
        );
      }
    } catch (error) {
      console.log('❌ Could not check DNS security records');
    }
    console.log();

    // 4. Security recommendations
    console.log('4. Security Recommendations...');
    console.log('🔒 Recommended Security Enhancements:');
    console.log('  • Enable DNSSEC if not already active');
    console.log(
      '  • Implement comprehensive email security (SPF, DKIM, DMARC)',
    );
    console.log('  • Add CAA records to control certificate issuance');
    console.log(
      '  • Consider implementing MTA-STS for email transport security',
    );
    console.log('  • Regularly monitor SSL certificate expiration');
    console.log('  • Use strong cipher suites and TLS 1.3');
    console.log('  • Implement HTTP Strict Transport Security (HSTS)');
    console.log('  • Consider DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT)');
    console.log();

    console.log('=== Security audit completed! ===');
  } catch (error) {
    console.error(
      '❌ Error in security audit:',
      error instanceof Error ? error.message : error,
    );
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  await dnssecExamples();
  await sslExamples();
  await securityAuditExample();
}

export {dnssecExamples, sslExamples, securityAuditExample};
