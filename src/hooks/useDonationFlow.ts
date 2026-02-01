"use client";

import { useState, useCallback, useEffect } from "react";
import { DONATION_STORAGE_KEY } from "@/lib/constants";
import type { DonationFlowState } from "@/lib/types";

const INITIAL_STATE: DonationFlowState = {
  amount: null,
  timeframe: null,
  recipient: null,
  paymentIntentId: null,
  clientSecret: null,
  wantsMotivation: null,
  antiCharity: null,
  coverFees: false,
};

function loadState(): DonationFlowState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = sessionStorage.getItem(DONATION_STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch {
    return INITIAL_STATE;
  }
}

function saveState(state: DonationFlowState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(state));
}

export function useDonationFlow() {
  const [state, setState] = useState<DonationFlowState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const update = useCallback(
    (partial: Partial<DonationFlowState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        saveState(next);
        return next;
      });
    },
    []
  );

  const setAmount = useCallback(
    (amount: number) => update({ amount }),
    [update]
  );

  const setTimeframe = useCallback(
    (timeframe: string) => update({ timeframe }),
    [update]
  );

  const setRecipient = useCallback(
    (recipient: string) => update({ recipient }),
    [update]
  );

  const setPaymentIntent = useCallback(
    (paymentIntentId: string, clientSecret: string) =>
      update({ paymentIntentId, clientSecret }),
    [update]
  );

  const setWantsMotivation = useCallback(
    (wantsMotivation: boolean) => update({ wantsMotivation }),
    [update]
  );

  const setAntiCharity = useCallback(
    (antiCharity: string) => update({ antiCharity }),
    [update]
  );

  const setCoverFees = useCallback(
    (coverFees: boolean) => update({ coverFees }),
    [update]
  );

  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DONATION_STORAGE_KEY);
    }
    setState(INITIAL_STATE);
  }, []);

  const isStepComplete = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return true;
        case 2:
          return state.amount !== null;
        case 3:
          return state.amount !== null && state.timeframe !== null;
        case 4:
          return (
            state.amount !== null &&
            state.timeframe !== null &&
            state.recipient !== null
          );
        case 5:
          return state.paymentIntentId !== null;
        case 6:
          return state.wantsMotivation === true;
        case 7:
          return state.paymentIntentId !== null;
        default:
          return false;
      }
    },
    [state]
  );

  return {
    state,
    hydrated,
    setAmount,
    setTimeframe,
    setRecipient,
    setPaymentIntent,
    setWantsMotivation,
    setAntiCharity,
    setCoverFees,
    reset,
    isStepComplete,
  };
}
