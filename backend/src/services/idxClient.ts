/**
 * IDX Client — SimplyRETS adapter
 * Test credentials:  key=simplyrets  secret=simplyrets
 * Docs: https://docs.simplyrets.com
 */

import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

/* ── Actual SimplyRETS response shape ── */
export interface SimplyRETSProperty {
  mlsId: number;                    // integer
  listingId?: string;
  listDate?: string;
  modified?: string;                // modification timestamp (top-level)
  listPrice: number;
  originalListPrice?: number;
  remarks?: string;
  status?: string | null;           // top-level status (often null)

  /* Address is TOP-LEVEL, not inside property */
  address: {
    full?: string;
    streetNumber?: number | string;
    streetName?: string;
    city: string;
    state: string;
    country?: string;
    postalCode?: string;
    unit?: string;
  };

  property: {
    type: string;                   // 'RES', 'Residential', 'Condominium' …
    subType?: string | null;
    subTypeText?: string | null;
    style?: string;
    area?: number;                  // sq ft
    lotSize?: string | number | null;
    lotSizeArea?: number | null;
    acres?: number | null;
    yearBuilt?: number;
    bedrooms: number;
    bathsFull?: number;
    bathsHalf?: number;
    bathrooms?: number | null;      // often null — use bathsFull/bathsHalf
    parking?: { spaces?: number; description?: string; leased?: boolean | null };
    garageSpaces?: number;
    interiorFeatures?: string;
    exteriorFeatures?: string;
    pool?: string;
    roof?: string;
    heating?: string;
    cooling?: string;
    subdivision?: string;
  };

  geo?: {
    lat: number;
    lng: number;
    county?: string;
    marketArea?: string;
  };

  mls?: {
    status?: string;               // actual status lives here: 'Active', 'Pending', 'Closed'
    daysOnMarket?: number;
    area?: string;
    areaMinor?: string;
  };

  photos?: string[];

  agent?: {
    firstName?: string;
    lastName?: string;
    id?: string;
    contact?: { email?: string; office?: string; cell?: string };
  };

  office?: {
    name?: string;
    contact?: { email?: string; office?: string };
  };

  association?: { fee?: number; name?: string };
  tax?: { annualAmount?: number; taxYear?: string };
  sales?: { closeDate?: string; closePrice?: number };
}

export interface IDXQueryParams {
  status?: string[];
  type?: string[];
  cities?: string[];
  minprice?: number;
  maxprice?: number;
  minbeds?: number;
  limit?: number;
  offset?: number;
  sort?: 'listdate' | 'priceAsc' | 'priceDesc';
  modifiedAfter?: string;   // maps to minlistdate on SimplyRETS
}

class IDXClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.idx.apiUrl,
      auth: { username: config.idx.apiKey, password: config.idx.apiSecret },
      timeout: 30_000,
      headers: { Accept: 'application/json' },
    });

    this.http.interceptors.response.use(
      (r) => r,
      (err) => {
        logger.error(`[IDX] Request failed: ${err.message}`, {
          url: err.config?.url,
          status: err.response?.status,
          data: err.response?.data,
        });
        return Promise.reject(err);
      }
    );
  }

  async fetchProperties(params: IDXQueryParams = {}): Promise<SimplyRETSProperty[]> {
    const query: Record<string, unknown> = {
      limit: params.limit ?? config.idx.batchSize,
      offset: params.offset ?? 0,
      sort: params.sort ?? 'listdate',
    };

    if (params.status?.length)    query.status = params.status.join(',');
    if (params.type?.length)      query.type   = params.type.join(',');
    if (params.cities?.length)    query.cities = params.cities.join(',');
    if (params.minprice)          query.minprice = params.minprice;
    if (params.maxprice)          query.maxprice = params.maxprice;
    if (params.minbeds)           query.minbeds  = params.minbeds;
    if (params.modifiedAfter)     query.minlistdate = params.modifiedAfter;

    const res = await this.http.get<SimplyRETSProperty[]>('/properties', { params: query });
    return res.data;
  }

  async fetchAll(params: Omit<IDXQueryParams, 'offset'> = {}): Promise<SimplyRETSProperty[]> {
    const all: SimplyRETSProperty[] = [];
    let offset = 0;
    const pageSize = config.idx.batchSize;

    logger.info('[IDX] Starting bulk fetch…');

    while (true) {
      const page = await this.fetchProperties({ ...params, limit: pageSize, offset });
      if (!page.length) break;

      all.push(...page);
      logger.info(`[IDX] Fetched ${all.length} listings so far…`);

      if (page.length < pageSize) break;
      offset += pageSize;

      // Be polite to the test API — 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    }

    logger.info(`[IDX] Bulk fetch complete. Total: ${all.length}`);
    return all;
  }
}

export const idxClient = new IDXClient();
