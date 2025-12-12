/**
 * Carrier Onboarding Store
 * 
 * Zustand store managing the multi-step onboarding flow with:
 * - CarrierOK lookup results
 * - Velvet Rope validation state
 * - Identity verification progress
 * - Bank connection status
 * - Enhanced fraud scoring
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarrierProfile, VelvetRopeResult } from '@/lib/api/carrier-ok';

export type OnboardingStep = 'mc_lookup' | 'identity' | 'financials' | 'review' | 'completed' | 'rejected';
export type IdentityMethod = 'email_otp' | 'insurance_agent' | null;
export type BankMethod = 'stripe_connect' | 'manual_upload' | null;

interface FraudIndicators {
    recentContactChange: boolean;
    suspiciousEmail: boolean;  // gmail, yahoo for business
    missingDBA: boolean;
    lowTruckRatio: boolean;    // trucks claimed vs FMCSA reported
}

interface OnboardingState {
    // Current progress
    currentStep: OnboardingStep;
    mcNumber: string | null;

    // CarrierOK data
    carrierProfile: CarrierProfile | null;
    velvetRopeResult: VelvetRopeResult | null;
    lookupError: string | null;
    isLookingUp: boolean;

    // Fraud detection
    fraudIndicators: FraudIndicators;
    fraudScore: number; // 0-100 (higher = more suspicious)

    // Identity verification
    identityMethod: IdentityMethod;
    emailOtpSent: boolean;
    emailVerified: boolean;
    insuranceAgentRequested: boolean;

    // Bank connection
    bankMethod: BankMethod;
    bankConnected: boolean;
    instantPayoutsEligible: boolean;

    // Manual upload documents
    uploadedDocuments: {
        w9: boolean;
        voidedCheck: boolean;
        coi: boolean;
        authorityLetter: boolean;
    };

    // Timestamps for analytics
    startedAt: string | null;
    completedAt: string | null;

    // Actions
    setStep: (step: OnboardingStep) => void;
    setMCNumber: (mc: string) => void;
    setLookupState: (loading: boolean, error?: string) => void;
    setCarrierData: (profile: CarrierProfile, result: VelvetRopeResult) => void;
    setIdentityMethod: (method: IdentityMethod) => void;
    setEmailOtpSent: (sent: boolean) => void;
    setEmailVerified: (verified: boolean) => void;
    setInsuranceAgentRequested: (requested: boolean) => void;
    setBankMethod: (method: BankMethod) => void;
    setBankConnected: (connected: boolean, instantEligible?: boolean) => void;
    setDocumentUploaded: (doc: keyof OnboardingState['uploadedDocuments'], uploaded: boolean) => void;
    calculateFraudScore: () => void;
    reset: () => void;
}

const initialState = {
    currentStep: 'mc_lookup' as OnboardingStep,
    mcNumber: null,
    carrierProfile: null,
    velvetRopeResult: null,
    lookupError: null,
    isLookingUp: false,
    fraudIndicators: {
        recentContactChange: false,
        suspiciousEmail: false,
        missingDBA: false,
        lowTruckRatio: false,
    },
    fraudScore: 0,
    identityMethod: null,
    emailOtpSent: false,
    emailVerified: false,
    insuranceAgentRequested: false,
    bankMethod: null,
    bankConnected: false,
    instantPayoutsEligible: false,
    uploadedDocuments: {
        w9: false,
        voidedCheck: false,
        coi: false,
        authorityLetter: false,
    },
    startedAt: null,
    completedAt: null,
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setStep: (step) => set({ currentStep: step }),

            setMCNumber: (mc) => set({
                mcNumber: mc,
                startedAt: get().startedAt || new Date().toISOString(),
            }),

            setLookupState: (loading, error) => set({
                isLookingUp: loading,
                lookupError: error || null
            }),

            setCarrierData: (profile, result) => {
                // Calculate fraud indicators
                const fraudIndicators: FraudIndicators = {
                    recentContactChange: profile.recent_contact_changes,
                    suspiciousEmail: /gmail|yahoo|hotmail|outlook/i.test(profile.contact_email),
                    missingDBA: !profile.dba_name,
                    lowTruckRatio: profile.reported_truck_count < 3,
                };

                set({
                    carrierProfile: profile,
                    velvetRopeResult: result,
                    fraudIndicators,
                    currentStep: result.passed ? 'identity' : 'rejected',
                });

                // Calculate fraud score after setting data
                get().calculateFraudScore();
            },

            setIdentityMethod: (method) => set({ identityMethod: method }),

            setEmailOtpSent: (sent) => set({ emailOtpSent: sent }),

            setEmailVerified: (verified) => set({
                emailVerified: verified,
                currentStep: verified ? 'financials' : get().currentStep,
            }),

            setInsuranceAgentRequested: (requested) => set({ insuranceAgentRequested: requested }),

            setBankMethod: (method) => set({ bankMethod: method }),

            setBankConnected: (connected, instantEligible = false) => set({
                bankConnected: connected,
                instantPayoutsEligible: instantEligible,
                currentStep: connected ? 'review' : get().currentStep,
            }),

            setDocumentUploaded: (doc, uploaded) => set((state) => ({
                uploadedDocuments: {
                    ...state.uploadedDocuments,
                    [doc]: uploaded,
                },
            })),

            calculateFraudScore: () => {
                const { fraudIndicators, carrierProfile, velvetRopeResult } = get();
                let score = 0;

                // +30 for recent contact changes (high risk)
                if (fraudIndicators.recentContactChange) score += 30;

                // +15 for free email provider
                if (fraudIndicators.suspiciousEmail) score += 15;

                // +10 for missing DBA (slight concern)
                if (fraudIndicators.missingDBA) score += 10;

                // +20 for very small fleet
                if (fraudIndicators.lowTruckRatio) score += 20;

                // +25 if any Velvet Rope gate failed
                if (velvetRopeResult && !velvetRopeResult.passed) score += 25;

                // Cap at 100
                set({ fraudScore: Math.min(score, 100) });
            },

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'carrier-onboarding-store',
            partialize: (state) => ({
                mcNumber: state.mcNumber,
                carrierProfile: state.carrierProfile,
                currentStep: state.currentStep,
                startedAt: state.startedAt,
            }),
        }
    )
);

// Selectors for common derived state
export const useIsEligibleCarrier = () =>
    useOnboardingStore((state) => state.velvetRopeResult?.passed ?? false);

export const useOnboardingProgress = () =>
    useOnboardingStore((state) => {
        const steps: OnboardingStep[] = ['mc_lookup', 'identity', 'financials', 'review', 'completed'];
        const currentIndex = steps.indexOf(state.currentStep);
        return {
            current: currentIndex + 1,
            total: steps.length,
            percentage: Math.round(((currentIndex + 1) / steps.length) * 100),
        };
    });

export const useCanProceedToFinancials = () =>
    useOnboardingStore((state) =>
        state.emailVerified || state.insuranceAgentRequested
    );

export const useCanSubmitOnboarding = () =>
    useOnboardingStore((state) => {
        const hasIdentity = state.emailVerified || state.insuranceAgentRequested;
        const hasBank = state.bankConnected ||
            (state.uploadedDocuments.w9 && state.uploadedDocuments.voidedCheck);
        return hasIdentity && hasBank;
    });
