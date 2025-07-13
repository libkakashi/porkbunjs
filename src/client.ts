import type {
  PorkbunConfig,
  PingResponse,
  PricingResponse,
  ListDomainsOptions,
  ListDomainsResult,
  UpdateNameServersOptions,
  GetNameServersResult,
  AddURLForwardOptions,
  GetURLForwardingResult,
  DomainCheckResult,
  CreateGlueRecordOptions,
  UpdateGlueRecordOptions,
  GetGlueRecordsResult,
  CreateDNSRecordOptions,
  CreateDNSRecordResult,
  EditDNSRecordOptions,
  EditDNSRecordByTypeOptions,
  GetDNSRecordsResult,
  CreateDNSSECRecordOptions,
  GetDNSSECRecordsResult,
  GetSSLBundleResult,
  DNSRecordType,
  PorkbunAuth,
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
    const url = `${this.#baseUrl}/pricing/get`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return this.#convertApiResponse<PricingResponse>(result);
    } catch (error) {
      throw new Error(
        `Failed to get pricing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Domain management methods

  /**
   * Update the name servers for a domain
   */
  async updateNameServers(domain: string, options: UpdateNameServersOptions) {
    await this.#makeRequest<{}>(`/domain/updateNs/${domain}`, options);
  }

  /**
   * Get the authoritative name servers for a domain
   */
  getNameServers(domain: string) {
    return this.#makeRequest<GetNameServersResult>(`/domain/getNs/${domain}`);
  }

  /**
   * Get all domains in the account
   */
  listDomains(options: ListDomainsOptions = {}) {
    const data = {
      ...options,
      ...(options.includeLabels !== undefined && {
        includeLabels: options.includeLabels ? 'yes' : 'no',
      }),
    };
    return this.#makeRequest<ListDomainsResult>('/domain/listAll', data);
  }

  /**
   * Add URL forwarding for a domain
   */
  async addURLForward(domain: string, options: AddURLForwardOptions) {
    const data = {
      ...options,
      includePath: options.includePath ? 'yes' : 'no',
      wildcard: options.wildcard ? 'yes' : 'no',
    };
    await this.#makeRequest<{}>(`/domain/addUrlForward/${domain}`, data);
  }

  /**
   * Get URL forwarding records for a domain
   */
  getURLForwarding(domain: string) {
    return this.#makeRequest<GetURLForwardingResult>(
      `/domain/getUrlForwarding/${domain}`,
    );
  }

  /**
   * Delete a URL forward record
   */
  async deleteURLForward(domain: string, recordId: string) {
    await this.#makeRequest<{}>(
      `/domain/deleteUrlForward/${domain}/${recordId}`,
    );
  }

  /**
   * Check domain availability
   * Note: This endpoint is rate limited
   */
  checkDomain(domain: string) {
    return this.#makeRequest<DomainCheckResult>(
      `/domain/checkDomain/${domain}`,
    );
  }

  /**
   * Create a glue record for a domain
   */
  async createGlueRecord(
    domain: string,
    subdomain: string,
    options: CreateGlueRecordOptions,
  ) {
    await this.#makeRequest<{}>(
      `/domain/createGlue/${domain}/${subdomain}`,
      options,
    );
  }

  /**
   * Update a glue record for a domain
   */
  async updateGlueRecord(
    domain: string,
    subdomain: string,
    options: UpdateGlueRecordOptions,
  ) {
    await this.#makeRequest<{}>(
      `/domain/updateGlue/${domain}/${subdomain}`,
      options,
    );
  }

  /**
   * Delete a glue record for a domain
   */
  async deleteGlueRecord(domain: string, subdomain: string) {
    await this.#makeRequest<{}>(`/domain/deleteGlue/${domain}/${subdomain}`);
  }

  /**
   * Get all glue records for a domain
   */
  getGlueRecords(domain: string) {
    return this.#makeRequest<GetGlueRecordsResult>(`/domain/getGlue/${domain}`);
  }

  // DNS management methods

  /**
   * Create a DNS record
   */
  createDNSRecord(domain: string, options: CreateDNSRecordOptions) {
    return this.#makeRequest<CreateDNSRecordResult>(
      `/dns/create/${domain}`,
      options,
    );
  }

  /**
   * Edit a DNS record by domain and record ID
   */
  async editDNSRecord(
    domain: string,
    recordId: string,
    options: EditDNSRecordOptions,
  ) {
    await this.#makeRequest<{}>(`/dns/edit/${domain}/${recordId}`, options);
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
    await this.#makeRequest<{}>(
      subdomain
        ? `/dns/editByNameType/${domain}/${type}/${subdomain}`
        : `/dns/editByNameType/${domain}/${type}`,
      options,
    );
  }

  /**
   * Delete a DNS record by domain and record ID
   */
  async deleteDNSRecord(domain: string, recordId: string) {
    await this.#makeRequest<{}>(`/dns/delete/${domain}/${recordId}`);
  }

  /**
   * Delete DNS records by domain, subdomain, and type
   */
  async deleteDNSRecordsByType(
    domain: string,
    type: DNSRecordType,
    subdomain = '',
  ) {
    await this.#makeRequest<{}>(
      subdomain
        ? `/dns/deleteByNameType/${domain}/${type}/${subdomain}`
        : `/dns/deleteByNameType/${domain}/${type}`,
    );
  }

  /**
   * Get all DNS records for a domain or a specific record by ID
   */
  getDNSRecords(domain: string, recordId?: string) {
    return this.#makeRequest<GetDNSRecordsResult>(
      recordId
        ? `/dns/retrieve/${domain}/${recordId}`
        : `/dns/retrieve/${domain}`,
    );
  }

  /**
   * Get DNS records by domain, subdomain, and type
   */
  getDNSRecordsByType(domain: string, type: DNSRecordType, subdomain = '') {
    return this.#makeRequest<GetDNSRecordsResult>(
      subdomain
        ? `/dns/retrieveByNameType/${domain}/${type}/${subdomain}`
        : `/dns/retrieveByNameType/${domain}/${type}`,
    );
  }

  // DNSSEC methods

  /**
   * Create a DNSSEC record
   */
  async createDNSSECRecord(domain: string, options: CreateDNSSECRecordOptions) {
    await this.#makeRequest<{}>(`/dns/createDnssecRecord/${domain}`, options);
  }

  /**
   * Get DNSSEC records for a domain
   */
  getDNSSECRecords(domain: string) {
    return this.#makeRequest<GetDNSSECRecordsResult>(
      `/dns/getDnssecRecords/${domain}`,
    );
  }

  /**
   * Delete a DNSSEC record
   */
  async deleteDNSSECRecord(domain: string, keyTag: string) {
    await this.#makeRequest<{}>(`/dns/deleteDnssecRecord/${domain}/${keyTag}`);
  }

  // SSL methods

  /**
   * Get SSL certificate bundle for a domain
   */
  getSSLBundle(domain: string) {
    return this.#makeRequest<GetSSLBundleResult>(`/ssl/retrieve/${domain}`);
  }
}
