import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

/**
 * Paginated read-only fetch. Calls the API on mount and whenever
 * page / limit / filters change. Changing limit resets to page 1.
 * Callers should reset page to 1 when they change a filter.
 */
export default function usePagedFetch(url, filters = {}, initialLimit = 10) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(url, { params: { ...JSON.parse(filtersKey), page, limit } });
        if (cancelled) return;
        setRows(res.data?.data || []);
        setMeta(res.data?.meta || null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.response?.data?.message || "Failed to load data");
        setRows([]);
        setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, filtersKey, page, limit]);

  const setLimit = useCallback((n) => {
    setLimitState(n);
    setPage(1);
  }, []);

  return { rows, meta, loading, error, page, setPage, limit, setLimit };
}
