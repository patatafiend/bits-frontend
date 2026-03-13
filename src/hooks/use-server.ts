import { useEffect, useRef, useState } from "react";
import { serverFetch } from "@/lib/utils";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export function useServerFetch<T>(
  url: string,
  options?: RequestInit & {
    fetchImmediately?: boolean;
    initialParams?: string;
    initialQuery?: Record<string, unknown>;
  },
) {
  const baseOptions = options || { fetchImmediately: true };
  if (baseOptions.fetchImmediately === undefined) {
    baseOptions.fetchImmediately = true;
  }

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: baseOptions.fetchImmediately ? true : false,
    error: null,
  });

  type RefetchOptions = {
    query?: Record<string, unknown>;
    params?: string;
    headers?: HeadersInit;
    options?: RequestInit;
  };

  function buildRoute(base: string, params?: string) {
    if (!params) return base;
    if (params.startsWith("/")) return base.replace(/\/$/, "") + params;
    return `${base.replace(/\/$/, "")}/${params}`;
  }

  function buildQueryString(query?: Record<string, unknown>) {
    if (!query || Object.keys(query).length === 0) return "";
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            params.append(key, String(item));
          }
        });
        return;
      }

      params.append(key, String(value));
    });
    const queryStr = params.toString();
    return queryStr ? `?${queryStr}` : "";
  }

  async function doFetch(input: RefetchOptions = {}) {
    const {
      query,
      params,
      headers: customHeaders,
      options: extraOptions,
    } = input;
    const finalRoute = buildRoute(url, params);
    const queryString = buildQueryString(query);

    const mergedOptions: RequestInit = {
      ...baseOptions,
      ...extraOptions,
      headers: {
        "Content-Type": "application/json",
        ...(baseOptions?.headers || {}),
        ...(extraOptions?.headers || {}),
        ...(customHeaders || {}),
      },
    };

    const result = await serverFetch.service.public<T>(
      finalRoute + queryString,
      mergedOptions,
      (loading) => setState((prev) => ({ ...prev, loading })),
    );

    if (result.error) {
      setState({
        data: null,
        loading: false,
        error: new Error(result.error.detail),
      });
    } else {
      setState({ data: result.data, loading: false, error: null });
    }
  }

  function refetch(input: RefetchOptions = {}) {
    return doFetch(input);
  }

  const didInitialFetchRef = useRef(false);
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;
    if (!baseOptions.fetchImmediately) return;

    refetch({
      query: baseOptions.initialQuery,
      params: baseOptions.initialParams,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { ...state, refetch };
}

type ActionState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export function useServerAction<T, TBody = unknown>(
  url: string,
  options?: Omit<RequestInit, "body">,
) {
  const [state, setState] = useState<ActionState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  type ExecuteOptions = {
    body?: TBody;
    query?: Record<string, unknown>;
    params?: string;
    headers?: HeadersInit;
  };

  function buildRoute(base: string, params?: string) {
    if (!params) return base;
    if (params.startsWith("/")) return base.replace(/\/$/, "") + params;
    return `${base.replace(/\/$/, "")}/${params}`;
  }

  function buildQueryString(query?: Record<string, unknown>) {
    if (!query || Object.keys(query).length === 0) return "";
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            params.append(key, String(item));
          }
        });
        return;
      }

      params.append(key, String(value));
    });
    const queryStr = params.toString();
    return queryStr ? `?${queryStr}` : "";
  }

  const execute = async (input: ExecuteOptions = {}) => {
    const { body, query, params, headers: customHeaders } = input;
    const finalRoute = buildRoute(url, params);
    const queryString = buildQueryString(query);
    const finalUrl = finalRoute + queryString;

    const result = await serverFetch.service.public<T>(
      finalUrl,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
          ...(customHeaders || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      (loading) => setState((prev) => ({ ...prev, loading })),
    );

    if (result.error) {
      const err = new Error(result.error.detail);
      setState({ data: null, loading: false, error: err });
      return { data: null, error: err };
    }

    setState({ data: result.data, loading: false, error: null });
    return { data: result.data, error: null };
  };

  return { ...state, execute };
}
