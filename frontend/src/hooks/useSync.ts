/**
 * useSync — WebSocket listener for real-time listing updates + sync status
 *
 * Uses native browser WebSocket (socket.io client would need to be installed;
 * this hook falls back gracefully when the WS server is unavailable in QA).
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';

export interface SyncStatus {
  provider: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'never_run';
  lastSuccessAt?: string;
  lastSyncTimestamp?: string;
  totalSynced: number;
  totalUpserted: number;
  totalErrors: number;
  durationMs?: number;
  nextRunAt?: string;
  lastError?: string;
}

export interface ListingUpdateEvent {
  type: 'new' | 'updated' | 'sold' | 'price_reduced';
  property: { _id: string; title: string; price: number; status: string; address: { city: string } };
}

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)
  ?? 'http://localhost:5001';

export function useSync() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<ListingUpdateEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket | null = null;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');

        socket = io(WS_URL, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        const s = socket;

        s.on('connect', () => {
          setConnected(true);
          // Subscribe to sync status events
          s.emit('subscribe:sync');
        });

        s.on('disconnect', () => setConnected(false));

        // Sync lifecycle events
        s.on('sync:started',   (d: Partial<SyncStatus>) => setSyncStatus((p) => ({ ...p!, ...d, status: 'running' })));
        s.on('sync:completed', (d: Partial<SyncStatus>) => {
          setSyncStatus((p) => ({ ...p!, ...d, status: 'success' }));
          // Invalidate React Query cache so UI refreshes
          queryClient.invalidateQueries({ queryKey: ['public-properties'] });
          queryClient.invalidateQueries({ queryKey: ['market-stats'] });
        });
        s.on('sync:error', (d: { error: string }) =>
          setSyncStatus((p) => ({ ...p!, status: 'error', lastError: d.error }))
        );
        s.on('sync:progress', (d: { synced: number; total: number }) =>
          setSyncStatus((p) => p ? { ...p, totalSynced: d.synced } : p)
        );

        // Real-time listing change events
        s.on('listing:update', (event: ListingUpdateEvent) => {
          setLastUpdate(event);
          queryClient.invalidateQueries({ queryKey: ['public-properties'] });
          queryClient.invalidateQueries({ queryKey: ['property', event.property._id] });
        });

      } catch {
        // socket.io-client not installed — WS features silently disabled in QA
        console.info('[Sync] socket.io-client not available — real-time updates disabled');
      }
    };

    connect();

    return () => {
      socket?.disconnect?.();
      setConnected(false);
    };
  }, [queryClient]);

  return { syncStatus, lastUpdate, connected };
}

/* ── REST fallback: poll sync status every 30s ── */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await window.fetch('/api/sync/status');
        const json = await res.json();
        if (json.success) setStatus(json.data);
      } catch { /* backend offline in pure-frontend dev mode */ }
    };

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
