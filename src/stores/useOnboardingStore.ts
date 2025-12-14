/**
 * Carrier Onboarding Store (Enhanced 4-Step Flow)
 * 
 * Flow:
 * 1. Email Verification (business email required)
 * 2. MC/DOT Lookup → Validation
 * 3. Document Upload (COI, W-9)
 * 4. Bank Connection (Stripe)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarrierOKProfile, ValidationResult } from '@/lib/api/carrier-ok';

export type OnboardingStep =
    | 'email_verification'
    | 'lookup'
    | 'documents'
    | 'bank_connection'
    | 'completed'
    | 'rejected';

// Common free email domains to reject
const FREE_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'gmx.com', 'live.com', 'msn.com', 'me.com', 'inbox.com'
];

export const isBusinessEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return !FREE_EMAIL_DOMAINS.includes(domain);
};

interface DocumentUpload {
    type: 'coi' | 'w9';
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
}

interface OnboardingState {
    // Current progress
    currentStep: OnboardingStep;

    // Email verification
    email: string | null;
    emailVerified: boolean;

    // MC/DOT data
    identifier: string | null;
    identifierType: 'mc' | 'dot' | null;
    carrierProfile: CarrierOKProfile | null;
    validationResult: ValidationResult | null;

    // Documents
    documents: DocumentUpload[];

    // Loading/Error
    isLoading: boolean;
    error: string | null;

    // Bank connection
    bankConnected: boolean;
    instantPayoutsEligible: boolean;

    // Timestamps
    startedAt: string | null;
    emailVerifiedAt: string | null;
    lookupCompletedAt: string | null;
    documentsUploadedAt: string | null;
    completedAt: string | null;

    // Actions
    setEmail: (email: string) => void;
    verifyEmail: (email: string) => { valid: boolean; error?: string };
    setIdentifier: (identifier: string, type: 'mc' | 'dot') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setCarrierData: (profile: CarrierOKProfile, validation: ValidationResult) => void;
    addDocument: (doc: DocumentUpload) => void;
    removeDocument: (type: 'coi' | 'w9') => void;
    completeDocuments: () => void;
    setBankConnected: (connected: boolean, instantEligible?: boolean) => void;
    setStep: (step: OnboardingStep) => void;
    completeOnboarding: () => void;
    reset: () => void;
}

const initialState = {
    currentStep: 'email_verification' as OnboardingStep,
    email: null,
    emailVerified: false,
    identifier: null,
    identifierType: null,
    carrierProfile: null,
    validationResult: null,
    documents: [],
    isLoading: false,
    error: null,
    bankConnected: false,
    instantPayoutsEligible: false,
    startedAt: null,
    emailVerifiedAt: null,
    lookupCompletedAt: null,
    documentsUploadedAt: null,
    completedAt: null,
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setEmail: (email) => set({
                email,
                startedAt: get().startedAt || new Date().toISOString(),
            }),

            verifyEmail: (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return { valid: false, error: 'Please enter a valid email address' };
                }
                if (!isBusinessEmail(email)) {
                    return { valid: false, error: 'Please use a business email address (not personal email like Gmail, Yahoo, etc.)' };
                }
                set({
                    email,
                    emailVerified: true,
                    emailVerifiedAt: new Date().toISOString(),
                    currentStep: 'lookup',
                    error: null,
                });
                return { valid: true };
            },

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
                currentStep: validation.passed ? 'documents' : 'rejected',
                isLoading: false,
                error: null,
            }),

            addDocument: (doc) => set((state) => ({
                documents: [
                    ...state.documents.filter(d => d.type !== doc.type),
                    doc
                ],
            })),

            removeDocument: (type) => set((state) => ({
                documents: state.documents.filter(d => d.type !== type),
            })),

            completeDocuments: () => {
                const state = get();
                const hasCOI = state.documents.some(d => d.type === 'coi');
                const hasW9 = state.documents.some(d => d.type === 'w9');

                if (hasCOI && hasW9) {
                    set({
                        documentsUploadedAt: new Date().toISOString(),
                        currentStep: 'bank_connection',
                    });
                }
            },

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
            name: 'carrier-onboarding-v3',
            partialize: (state) => ({
                email: state.email,
                emailVerified: state.emailVerified,
                identifier: state.identifier,
                identifierType: state.identifierType,
                currentStep: state.currentStep,
                startedAt: state.startedAt,
                carrierProfile: state.carrierProfile,
                documents: state.documents,
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
            case 'email_verification': return { step: 1, total: 4, percentage: 0 };
            case 'lookup': return { step: 2, total: 4, percentage: 25 };
            case 'documents': return { step: 3, total: 4, percentage: 50 };
            case 'bank_connection': return { step: 4, total: 4, percentage: 75 };
            case 'completed': return { step: 4, total: 4, percentage: 100 };
            case 'rejected': return { step: 2, total: 4, percentage: 25 };
        }
    });

export const useDocumentsComplete = () =>
    useOnboardingStore((state) => {
        const hasCOI = state.documents.some(d => d.type === 'coi');
        const hasW9 = state.documents.some(d => d.type === 'w9');
        return hasCOI && hasW9;
    });

export const useCanComplete = () =>
    useOnboardingStore((state) =>
        state.emailVerified &&
        state.validationResult?.passed &&
        state.documents.length >= 2 &&
        state.bankConnected
    );
