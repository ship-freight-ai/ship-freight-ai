
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useConfirmPayment } from "@/hooks/usePayments";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentFormProps {
    clientSecret: string;
    paymentIntentId: string;
    loadId: string;
    amount: number;
    bidId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

function PaymentForm({ clientSecret, paymentIntentId, loadId, amount, bidId, onSuccess }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const confirmPayment = useConfirmPayment();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            // 1. Confirm card details with Stripe
            const { error: stripeError } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            // 2. Call backend to finalize booking (atomic operation)
            await confirmPayment.mutateAsync({
                paymentIntentId,
                loadId,
                bidId, // Pass bidId so backend knows which bid to accept
            });

            onSuccess();
        } catch (error: any) {
            console.error("Payment failed:", error);
            setErrorMessage(error.message || "Payment processing failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Amount to Escrow</span>
                    <span className="font-bold text-lg">${amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3 h-3 text-green-600" />
                    <span>Funds are held securely until delivery is confirmed</span>
                </div>
            </div>

            <PaymentElement />

            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            <Button
                type="submit"
                disabled={!stripe || !elements || isProcessing}
                className="w-full"
                size="lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Secure Payment...
                    </>
                ) : (
                    <>
                        <Lock className="w-4 h-4 mr-2" />
                        Hold Funds & Book Carrier
                    </>
                )}
            </Button>

            <div className="flex justify-center">
                <img
                    src="https://images.stripeassets.com/fzn2n1nzq96p/2rGd9P1L7CT0eT8uE1Gk4/1dbf80727045952d9b626786c55d0f65/stripe-badge-grey.svg"
                    alt="Powered by Stripe"
                    className="h-6 opacity-75"
                />
            </div>
        </form>
    );
}

interface LoadPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientSecret?: string;
    paymentIntentId?: string;
    loadId: string;
    bidId: string;
    amount: number;
    onSuccess: () => void;
}

export function LoadPaymentModal({
    isOpen,
    onClose,
    clientSecret,
    paymentIntentId,
    loadId,
    bidId,
    amount,
    onSuccess,
}: LoadPaymentModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Secure Escrow Payment</DialogTitle>
                    <DialogDescription>
                        Hold the agreed amount in escrow. Funds are only released to the carrier after successful delivery.
                    </DialogDescription>
                </DialogHeader>

                {clientSecret && paymentIntentId ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                            clientSecret={clientSecret}
                            paymentIntentId={paymentIntentId}
                            loadId={loadId}
                            amount={amount}
                            bidId={bidId}
                            onSuccess={onSuccess}
                            onCancel={onClose}
                        />
                    </Elements>
                ) : (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
