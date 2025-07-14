import type {
  PorkbunConfig,
  PingResponse,
  PricingResponse,
  ListDomainsOptions,
  UpdateNameServersOptions,
  AddURLForwardOptions,
  CreateGlueRecordOptions,
  UpdateGlueRecordOptions,
  CreateDNSRecordOptions,
  EditDNSRecordOptions,
  EditDNSRecordByTypeOptions,
  CreateDNSSECRecordOptions,
  DNSRecordType,
  PorkbunAuth,
  URLForward,
  Domain,
  DomainPricing,
  DomainAvailabilityCheck,
  DomainCheckLimits,
  GlueRecordHost,
  DNSRecord,
  DNSSECRecord,
  SSLBundle,
} from './types';

import {PorkbunAuthError, PorkbunRateLimitError} from './errors';

export class PorkbunClient {
  readonly #apiKey: string;
  readonly #secretKey: string;
  readonly #baseUrl: string;
  readonly #timeout: number;

  constructor(config: PorkbunConfig) {
    this.#apiKey = config.apiKey;
    this.#secretKey = config.secretKey;
    this.#baseUrl = config.baseUrl || 'https://api.porkbun.com/api/json/v3';
    this.#timeout = config.timeout || 30000;
  }

  #getAuth(): PorkbunAuth {
    return {apikey: this.#apiKey, secretapikey: this.#secretKey};
  }

  #convertApiResponse<T>(response: unknown): T {
    if (response === null || response === undefined) {
      return response as T;
    }

    // Handle arrays
    if (Array.isArray(response)) {
      return response.map(item => this.#convertApiResponse(item)) as T;
    }

    // Handle objects
    if (typeof response === 'object') {
      const converted = {...(response as Record<string, unknown>)};

      // Convert 'yes'/'no' strings to booleans
      Object.keys(converted).forEach(key => {
        if (converted[key] === 'yes') {
          converted[key] = true;
        } else if (converted[key] === 'no') {
          converted[key] = false;
        } else if (
          typeof converted[key] === 'object' &&
          converted[key] !== null
        ) {
          converted[key] = this.#convertApiResponse(converted[key]);
        }
      });
      return converted as T;
    }
    return response as T;
  }

  async #makeRequest<T>(
    endpoint: string,
    data: Record<string, unknown> | object = {},
  ): Promise<T> {
    const url = `${this.#baseUrl}${endpoint}`;
    const body = {...this.#getAuth(), ...data};

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new PorkbunAuthError(
            'Authentication failed or additional authentication required',
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | (T & {status?: 'SUCCESS'})
        | {status: 'ERROR'; message: string};

      if (result.status === 'ERROR') {
        if (
          result.message?.includes('rate limit') ||
          result.message?.includes('limit')
        ) {
          throw new PorkbunRateLimitError(result.message);
        }
        throw new Error(result.message || 'Unknown API error');
      }
      delete result.status;
      return this.#convertApiResponse<T>(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        if (
          error instanceof PorkbunAuthError ||
          error instanceof PorkbunRateLimitError
        ) {
          throw error;
        }
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error('Unknown error occurred');
    }
  }

  // General API methods

  /**
   * Test communication with the API and get your IP address
   */
  async ping(): Promise<PingResponse> {
    return this.#makeRequest<PingResponse>('/ping');
  }

  /**
   * Get domain pricing information for all supported TLDs
   * This endpoint does not require authentication
   */
  async getPricing(): Promise<PricingResponse> {
    const endpoint = '/pricing/get';

    const {pricing} = await this.#makeRequest<{
      pricing: Record<string, DomainPricing>;
    }>(endpoint);
    return pricing;
  }

  // Domain management methods

  /**
   * Update the name servers for a domain
   */
  async updateNameServers(domain: string, options: UpdateNameServersOptions) {
    const endpoint = `/domain/updateNs/${domain}`;
    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Get the authoritative name servers for a domain
   */
  async getNameServers(domain: string) {
    const endpoint = `/domain/getNs/${domain}`;
    const {ns} = await this.#makeRequest<{ns: string[]}>(endpoint);
    return ns;
  }

  /**
   * Get all domains in the account
   */
  async listDomains(options: ListDomainsOptions = {}) {
    const endpoint = '/domain/listAll';
    const data = {
      ...options,
      ...(options.includeLabels !== undefined && {
        includeLabels: options.includeLabels ? 'yes' : 'no',
      }),
    };
    const {domains} = await this.#makeRequest<{domains: Domain[]}>(
      endpoint,
      data,
    );
    return domains;
  }

  /**
   * Add URL forwarding for a domain
   */
  async addURLForward(domain: string, options: AddURLForwardOptions) {
    const endpoint = `/domain/addUrlForward/${domain}`;
    const data = {
      ...options,
      includePath: options.includePath ? 'yes' : 'no',
      wildcard: options.wildcard ? 'yes' : 'no',
    };
    await this.#makeRequest<{}>(endpoint, data);
  }

  /**
   * Get URL forwarding records for a domain
   */
  async getURLForwarding(domain: string) {
    const endpoint = `/domain/getUrlForwarding/${domain}`;

    const {forwards} = await this.#makeRequest<{forwards: URLForward[]}>(
      endpoint,
    );
    return forwards;
  }

  /**
   * Delete a URL forward record
   */
  async deleteURLForward(domain: string, recordId: string) {
    const endpoint = `/domain/deleteUrlForward/${domain}/${recordId}`;
    await this.#makeRequest<{}>(endpoint);
  }

  /**
   * Check domain availability
   * Note: This endpoint is rate limited
   */
  async checkDomain(domain: string) {
    const endpoint = `/domain/checkDomain/${domain}`;

    const {response, limits} = await this.#makeRequest<{
      response: DomainAvailabilityCheck;
      limits: DomainCheckLimits;
    }>(endpoint);
    return {response, limits};
  }

  /**
   * Create a glue record for a domain
   */
  async createGlueRecord(
    domain: string,
    subdomain: string,
    options: CreateGlueRecordOptions,
  ) {
    const endpoint = `/domain/createGlue/${domain}/${subdomain}`;
    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Update a glue record for a domain
   */
  async updateGlueRecord(
    domain: string,
    subdomain: string,
    options: UpdateGlueRecordOptions,
  ) {
    const endpoint = `/domain/updateGlue/${domain}/${subdomain}`;
    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Delete a glue record for a domain
   */
  async deleteGlueRecord(domain: string, subdomain: string) {
    const endpoint = `/domain/deleteGlue/${domain}/${subdomain}`;
    await this.#makeRequest<{}>(endpoint);
  }

  /**
   * Get all glue records for a domain
   */
  async getGlueRecords(domain: string) {
    const endpoint = `/domain/getGlue/${domain}`;

    const {hosts} = await this.#makeRequest<{
      hosts: [string, GlueRecordHost][];
    }>(endpoint);
    return hosts;
  }

  // DNS management methods

  /**
   * Create a DNS record
   */
  async createDNSRecord(domain: string, options: CreateDNSRecordOptions) {
    const endpoint = `/dns/create/${domain}`;
    const {id} = await this.#makeRequest<{id: string}>(endpoint, options);
    return id;
  }

  /**
   * Edit a DNS record by domain and record ID
   */
  async editDNSRecord(
    domain: string,
    recordId: string,
    options: EditDNSRecordOptions,
  ) {
    const endpoint = `/dns/edit/${domain}/${recordId}`;
    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Edit DNS records by domain, subdomain, and type
   */
  async editDNSRecordsByType(
    domain: string,
    type: DNSRecordType,
    subdomain = '',
    options: EditDNSRecordByTypeOptions,
  ) {
    const endpoint = subdomain
      ? `/dns/editByNameType/${domain}/${type}/${subdomain}`
      : `/dns/editByNameType/${domain}/${type}`;

    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Delete a DNS record by domain and record ID
   */
  async deleteDNSRecord(domain: string, recordId: string) {
    const endpoint = `/dns/delete/${domain}/${recordId}`;
    await this.#makeRequest<{}>(endpoint);
  }

  /**
   * Delete DNS records by domain, subdomain, and type
   */
  async deleteDNSRecordsByType(
    domain: string,
    type: DNSRecordType,
    subdomain = '',
  ) {
    const endpoint = subdomain
      ? `/dns/deleteByNameType/${domain}/${type}/${subdomain}`
      : `/dns/deleteByNameType/${domain}/${type}`;

    await this.#makeRequest<{}>(endpoint);
  }

  /**
   * Get all DNS records for a domain or a specific record by ID
   */
  async getDNSRecords(domain: string, recordId?: string) {
    const endpoint = recordId
      ? `/dns/retrieve/${domain}/${recordId}`
      : `/dns/retrieve/${domain}`;

    const {records} = await this.#makeRequest<{records: DNSRecord[]}>(endpoint);
    return records;
  }

  /**
   * Get DNS records by domain, subdomain, and type
   */
  async getDNSRecordsByType(
    domain: string,
    type: DNSRecordType,
    subdomain = '',
  ) {
    const endpoint = subdomain
      ? `/dns/retrieveByNameType/${domain}/${type}/${subdomain}`
      : `/dns/retrieveByNameType/${domain}/${type}`;

    const {records} = await this.#makeRequest<{records: DNSRecord[]}>(endpoint);
    return records;
  }

  // DNSSEC methods

  /**
   * Create a DNSSEC record
   */
  async createDNSSECRecord(domain: string, options: CreateDNSSECRecordOptions) {
    const endpoint = `/dns/createDnssecRecord/${domain}`;
    await this.#makeRequest<{}>(endpoint, options);
  }

  /**
   * Get DNSSEC records for a domain
   */
  async getDNSSECRecords(domain: string) {
    const endpoint = `/dns/getDnssecRecords/${domain}`;

    const {records} = await this.#makeRequest<{records: DNSSECRecord[]}>(
      endpoint,
    );
    return records;
  }

  /**
   * Delete a DNSSEC record
   */
  async deleteDNSSECRecord(domain: string, keyTag: string) {
    const endpoint = `/dns/deleteDnssecRecord/${domain}/${keyTag}`;
    await this.#makeRequest<{}>(endpoint);
  }

  // SSL methods

  /**
   * Get SSL certificate bundle for a domain
   */
  getSSLBundle(domain: string) {
    const endpoint = `/ssl/retrieve/${domain}`;
    return this.#makeRequest<SSLBundle>(endpoint);
  }
}
