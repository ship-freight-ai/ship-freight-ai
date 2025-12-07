import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRemoveTeamMember } from "@/hooks/useTeamManagement";
import { useState, useEffect } from "react";
import { Copy, Plus, Trash2, Users, Calendar, AlertTriangle, UserX } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  claimed_via_invite: string | null;
}

interface Invite {
  id: string;
  invite_token: string;
  seats_allocated: number;
  seats_claimed: number;
  status: string;
  expires_at: string;
  created_at: string;
}

export function TeamManagement() {
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const removeTeamMember = useRemoveTeamMember();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeInvites, setActiveInvites] = useState<Invite[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seatsToAllocate, setSeatsToAllocate] = useState(1);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadTeamData();
    
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [subscription]);

  // Realtime subscriptions for team updates
  useEffect(() => {
    if (!subscription?.is_owner || !subscription.subscribed) return;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!subData) return;

      // Subscribe to team_invites changes
      const invitesChannel = supabase
        .channel('team-invites-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_invites',
            filter: `subscription_id=eq.${subData.id}`
          },
          () => {
            console.log('Team invites changed, reloading...');
            loadTeamData();
          }
        )
        .subscribe();

      // Subscribe to profiles changes (team members)
      const profilesChannel = supabase
        .channel('team-members-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `subscription_id=eq.${subData.id}`
          },
          () => {
            console.log('Team members changed, reloading...');
            loadTeamData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(invitesChannel);
        supabase.removeChannel(profilesChannel);
      };
    };

    setupRealtime();
  }, [subscription]);

  const loadTeamData = async () => {
    if (!subscription?.is_owner || !subscription.subscribed) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get subscription_id from database
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!subData) return;

      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, created_at, claimed_via_invite')
        .eq('subscription_id', subData.id);

      if (!membersError && members) {
        setTeamMembers(members);
      }

      // Load active invites
      const { data: invites, error: invitesError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('subscription_id', subData.id)
        .eq('status', 'pending');

      if (!invitesError && invites) {
        setActiveInvites(invites);
      }

      // Load expired invites
      const { data: expired, error: expiredError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('subscription_id', subData.id)
        .eq('status', 'expired');

      if (!expiredError && expired) {
        setExpiredInvites(expired);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: { seats_to_allocate: seatsToAllocate },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Invite created!",
        description: "Share the link with your team members.",
      });

      // Copy to clipboard
      navigator.clipboard.writeText(data.invite_url);
      
      setDialogOpen(false);
      loadTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invite",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/app/claim-seat?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke('revoke-invite', {
        body: { invite_id: inviteId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Invite revoked",
        description: "The invite link has been disabled",
      });

      loadTeamData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invite",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    await removeTeamMember.mutateAsync(removingMember.user_id);
    setRemovingMember(null);
    loadTeamData();
  };

  if (!subscription?.is_owner) {
    return (
      <Alert>
        <AlertDescription>
          Only the subscription owner can manage team members and invites.
        </AlertDescription>
      </Alert>
    );
  }

  const availableSeats = (subscription.seats || 0) - (subscription.seats_used || 0);
  const usagePercentage = ((subscription.seats_used || 0) / (subscription.seats || 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Seat Usage Warnings */}
      {availableSeats === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>All Seats Occupied</AlertTitle>
          <AlertDescription>
            You're using all {subscription.seats} seats. Remove a team member or upgrade your plan to invite more users.
          </AlertDescription>
        </Alert>
      )}

      {availableSeats > 0 && usagePercentage >= 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low on Seats</AlertTitle>
          <AlertDescription>
            You're using {subscription.seats_used} of {subscription.seats} seats. Consider upgrading to add more team members.
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Overview</CardTitle>
          <CardDescription>Manage your team seats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Seats</div>
              <div className="text-2xl font-bold">{subscription.seats}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Seats Used</div>
              <div className="text-2xl font-bold">{subscription.seats_used}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Available</div>
              <div className={`text-2xl font-bold ${availableSeats === 0 ? 'text-destructive' : 'text-primary'}`}>
                {availableSeats}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${usagePercentage >= 90 ? '[&>div]:bg-destructive' : usagePercentage >= 80 ? '[&>div]:bg-yellow-500' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          <CardDescription>Active users on your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No team members yet</div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const isOwner = !member.claimed_via_invite;
                const isCurrentUser = member.user_id === currentUserId;
                
                return (
                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{member.full_name || 'Unnamed User'}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isOwner ? "default" : "secondary"}>
                        {isOwner ? "Owner" : "Member"}
                      </Badge>
                      {!isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovingMember(member)}
                          disabled={removeTeamMember.isPending}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Invites */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Invites ({activeInvites.length})</CardTitle>
              <CardDescription>Share these links with new team members</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableSeats === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Team Invite</DialogTitle>
                  <DialogDescription>
                    Generate a shareable link for new team members to claim seats.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="seats">Number of Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      min={1}
                      max={availableSeats}
                      value={seatsToAllocate}
                      onChange={(e) => setSeatsToAllocate(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Available seats: {availableSeats}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateInvite} disabled={creating}>
                    {creating ? "Creating..." : "Create Invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {activeInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active invites. Create one to invite team members.
            </div>
          ) : (
            <div className="space-y-3">
              {activeInvites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {invite.seats_claimed}/{invite.seats_allocated} seats claimed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invite.invite_token)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeInvite(invite.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Invites */}
      {expiredInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired Invites ({expiredInvites.length})</CardTitle>
            <CardDescription>These invites are no longer valid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredInvites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {invite.seats_claimed}/{invite.seats_allocated} seats claimed
                      </span>
                    </div>
                    <Badge variant="secondary">Expired</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Expired on {new Date(invite.expires_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removingMember?.full_name || removingMember?.email}</strong> from your team?
              <br /><br />
              They will lose access immediately and will need a new invite to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
