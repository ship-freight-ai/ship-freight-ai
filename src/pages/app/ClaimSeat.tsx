import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, AlertCircle, CheckCircle2, Building2 } from "lucide-react";

interface InviteDetails {
  id: string;
  subscription_id: string;
  seats_allocated: number;
  seats_claimed: number;
  status: string;
  expires_at: string;
  subscriptions: {
    plan_type: string;
    profiles: {
      company_name: string;
    };
  };
}

export default function ClaimSeat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    checkAuthAndLoadInvite();
  }, [token]);

  const checkAuthAndLoadInvite = async () => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    // Load invite details
    const { data, error: inviteError } = await supabase
      .from('team_invites')
      .select(`
        *,
        subscriptions(
          plan_type,
          profiles(company_name)
        )
      `)
      .eq('invite_token', token)
      .single();

    if (inviteError || !data) {
      setError("Invalid or expired invite link");
    } else {
      setInviteDetails(data as any);
      
      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired");
      } else if (data.status !== 'pending') {
        setError(`This invite is ${data.status}`);
      } else if (data.seats_claimed >= data.seats_allocated) {
        setError("All seats for this invite have been claimed");
      }
    }

    setLoading(false);
  };

  const handleClaim = async () => {
    if (!token) return;

    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to claim your seat",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('claim-invite', {
        body: { invite_token: token },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setClaimed(true);
      toast({
        title: "Success!",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim seat",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleLogin = () => {
    navigate(`/site/auth?redirect=${encodeURIComponent(`/app/claim-seat?token=${token}`)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Seat Claimed Successfully!</h1>
            <p className="text-xl text-muted-foreground">
              You've joined the team. Welcome aboard!
            </p>
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate('/app/onboarding/check-status')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (error || !inviteDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Failed to load invite"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const availableSeats = inviteDetails.seats_allocated - inviteDetails.seats_claimed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">You've Been Invited!</h1>
          <p className="text-xl text-muted-foreground">
            Join the team and get started
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Details</CardTitle>
            <CardDescription>Review the invitation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Company</div>
                <div className="font-semibold">{inviteDetails.subscriptions.profiles.company_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Plan Type</div>
                <div className="font-semibold capitalize">{inviteDetails.subscriptions.plan_type}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Seats Available</div>
                <div className="font-semibold">{availableSeats} of {inviteDetails.seats_allocated}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Expires</div>
                <div className="font-semibold">{new Date(inviteDetails.expires_at).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isAuthenticated ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center mb-6 text-muted-foreground">
                You need to log in or create an account to claim this seat
              </p>
              <div className="grid gap-4">
                <Button size="lg" onClick={handleLogin}>
                  Sign Up / Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Button
                size="lg"
                className="w-full"
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? "Claiming Seat..." : "Claim Your Seat"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
