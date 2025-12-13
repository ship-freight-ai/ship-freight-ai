/**
 * Carrier Onboarding Store (Simplified)
 * 
 * 2-step flow:
 * 1. Lookup (MC/DOT) → Validation
 * 2. Bank Connection (Stripe)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarrierOKProfile, ValidationResult } from '@/lib/api/carrier-ok';

export type OnboardingStep = 'lookup' | 'bank_connection' | 'completed' | 'rejected';

interface OnboardingState {
    // Current progress
    currentStep: OnboardingStep;
    identifier: string | null; // MC or DOT number entered
    identifierType: 'mc' | 'dot' | null;

    // CarrierOK data
    carrierProfile: CarrierOKProfile | null;
    validationResult: ValidationResult | null;
    isLoading: boolean;
    error: string | null;

    // Bank connection
    bankConnected: boolean;
    instantPayoutsEligible: boolean;

    // Timestamps
    lookupCompletedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;

    // Actions
    setIdentifier: (identifier: string, type: 'mc' | 'dot') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setCarrierData: (profile: CarrierOKProfile, validation: ValidationResult) => void;
    setBankConnected: (connected: boolean, instantEligible?: boolean) => void;
    setStep: (step: OnboardingStep) => void;
    completeOnboarding: () => void;
    reset: () => void;
}

const initialState = {
    currentStep: 'lookup' as OnboardingStep,
    identifier: null,
    identifierType: null,
    carrierProfile: null,
    validationResult: null,
    isLoading: false,
    error: null,
    bankConnected: false,
    instantPayoutsEligible: false,
    lookupCompletedAt: null,
    startedAt: null,
    completedAt: null,
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setIdentifier: (identifier, type) => set({
                identifier,
                identifierType: type,
                startedAt: get().startedAt || new Date().toISOString(),
                error: null,
            }),

            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error, isLoading: false }),

            setCarrierData: (profile, validation) => set({
                carrierProfile: profile,
                validationResult: validation,
                lookupCompletedAt: new Date().toISOString(),
                currentStep: validation.passed ? 'bank_connection' : 'rejected',
                isLoading: false,
                error: null,
            }),

            setBankConnected: (connected, instantEligible = false) => set({
                bankConnected: connected,
                instantPayoutsEligible: instantEligible,
            }),

            setStep: (step) => set({ currentStep: step }),

            completeOnboarding: () => set({
                currentStep: 'completed',
                completedAt: new Date().toISOString(),
            }),

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'carrier-onboarding-v2',
            partialize: (state) => ({
                identifier: state.identifier,
                identifierType: state.identifierType,
                currentStep: state.currentStep,
                startedAt: state.startedAt,
                carrierProfile: state.carrierProfile,
            }),
        }
    )
);

// Selectors
export const useIsValidated = () =>
    useOnboardingStore((state) => state.validationResult?.passed ?? false);

export const useOnboardingProgress = () =>
    useOnboardingStore((state) => {
        switch (state.currentStep) {
            case 'lookup': return { step: 1, total: 2, percentage: 0 };
            case 'bank_connection': return { step: 2, total: 2, percentage: 50 };
            case 'completed': return { step: 2, total: 2, percentage: 100 };
            case 'rejected': return { step: 1, total: 2, percentage: 0 };
        }
    });

export const useCanComplete = () =>
    useOnboardingStore((state) =>
        state.validationResult?.passed && state.bankConnected
    );
