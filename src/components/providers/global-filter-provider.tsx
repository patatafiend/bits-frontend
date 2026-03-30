"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type GlobalFilterContextType = {
  selectedClientId: number | null;
  selectedBusinessUnitId: number | null;
  setSelectedClientId: (id: number | null) => void;
  setSelectedBusinessUnitId: (id: number | null) => void;
  clearGlobalFilters: () => void;
  hydrated: boolean;
};

const CLIENT_KEY = "global.selectedClientId";
const BUSINESS_UNIT_KEY = "global.selectedBusinessUnitId";

const GlobalFilterContext = createContext<GlobalFilterContextType>({
  selectedClientId: null,
  selectedBusinessUnitId: null,
  setSelectedClientId: () => {},
  setSelectedBusinessUnitId: () => {},
  clearGlobalFilters: () => {},
  hydrated: false,
});

function parseStoredNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const isBrowser = typeof window !== "undefined";
  const [selectedClientId, setSelectedClientId] = useState<number | null>(() =>
    isBrowser ? parseStoredNumber(window.localStorage.getItem(CLIENT_KEY)) : null,
  );
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<
    number | null
  >(() =>
    isBrowser
      ? parseStoredNumber(window.localStorage.getItem(BUSINESS_UNIT_KEY))
      : null,
  );
  const hydrated = isBrowser;

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    if (selectedClientId == null) {
      localStorage.removeItem(CLIENT_KEY);
    } else {
      localStorage.setItem(CLIENT_KEY, String(selectedClientId));
    }
  }, [selectedClientId, isBrowser]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    if (selectedBusinessUnitId == null) {
      localStorage.removeItem(BUSINESS_UNIT_KEY);
    } else {
      localStorage.setItem(BUSINESS_UNIT_KEY, String(selectedBusinessUnitId));
    }
  }, [selectedBusinessUnitId, isBrowser]);

  const value = useMemo(
    () => ({
      selectedClientId,
      selectedBusinessUnitId,
      setSelectedClientId,
      setSelectedBusinessUnitId,
      clearGlobalFilters: () => {
        setSelectedClientId(null);
        setSelectedBusinessUnitId(null);
      },
      hydrated,
    }),
    [selectedClientId, selectedBusinessUnitId, hydrated],
  );

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  return useContext(GlobalFilterContext);
}
