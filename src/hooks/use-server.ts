import { useEffect, useState } from "react";
import config from "@/app.config";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export function useServerFetch<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fullUrl = `${config.NEXT_PUBLIC_BACKEND_URL}${url}`;
        const response = await fetch(fullUrl, options);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
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

  const execute = async (body?: TBody) => {
    setState({ data: null, loading: true, error: null });
    try {
      const fullUrl = `${config.NEXT_PUBLIC_BACKEND_URL}${url}`;
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || response.statusText);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      return { data, error: null };
    } catch (error) {
      const err = error as Error;
      setState({ data: null, loading: false, error: err });
      return { data: null, error: err };
    }
  };

  return { ...state, execute };
}
