import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllDisputes } from "@/hooks/useAdmin";
import { useResolveDispute } from "@/hooks/usePayments";
import { BackButton } from "@/components/app/BackButton";
import { AlertCircle, DollarSign, Package, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function DisputeResolution() {
  const { data: disputes, isLoading } = useAllDisputes();
  const resolveDispute = useResolveDispute();

  const handleResolve = async (loadId: string, releaseToCarrier: boolean) => {
    await resolveDispute.mutateAsync({ loadId, releaseToCarrier });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/app/admin/dashboard" />
        <h1 className="text-3xl font-bold mt-2">Dispute Resolution</h1>
        <p className="text-muted-foreground">Resolve payment disputes between shippers and carriers</p>
      </div>

      {disputes && disputes.length > 0 ? (
        <div className="grid gap-4">
          {disputes.map((payment: any) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle>Dispute #{payment.id.slice(0, 8)}</CardTitle>
                    <Badge variant="destructive">Disputed</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <DollarSign className="h-5 w-5" />
                    ${Number(payment.amount).toLocaleString()}
                  </div>
                </div>
                <CardDescription>
                  Created {format(new Date(payment.created_at), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Load Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>Load Information</span>
                    </div>
                    <p className="text-sm">
                      {payment.loads?.origin_city}, {payment.loads?.origin_state} →{" "}
                      {payment.loads?.destination_city}, {payment.loads?.destination_state}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Parties</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Shipper:</strong> {payment.loads?.shipper?.full_name || payment.loads?.shipper?.email}</p>
                      <p><strong>Carrier:</strong> {payment.loads?.carrier?.full_name || payment.loads?.carrier?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dispute Reason */}
                {payment.dispute_reason && (
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Dispute Reason:</p>
                    <p className="text-sm text-muted-foreground">{payment.dispute_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default">Release to Carrier</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Release payment to carrier?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will release ${Number(payment.amount).toLocaleString()} to the carrier. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleResolve(payment.load_id, true)}>
                          Release to Carrier
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Refund to Shipper</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Refund payment to shipper?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will refund ${Number(payment.amount).toLocaleString()} to the shipper. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleResolve(payment.load_id, false)}>
                          Refund to Shipper
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active disputes</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
