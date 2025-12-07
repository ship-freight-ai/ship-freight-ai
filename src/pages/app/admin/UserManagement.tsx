import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAllUsers, useAssignRole } from "@/hooks/useAdmin";
import { BackButton } from "@/components/app/BackButton";
import { Search, Shield, User, Mail } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export default function UserManagement() {
  const { data: users, isLoading } = useAllUsers();
  const assignRole = useAssignRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredUsers = users?.filter((user: any) => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    await assignRole.mutateAsync({
      userId: selectedUser.user_id,
      role: selectedRole,
    });

    toast({
      title: "Role assigned",
      description: `Successfully assigned ${selectedRole} role to ${selectedUser.full_name || selectedUser.email}`,
    });

    setDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton to="/app/admin/dashboard" />
          <h1 className="text-3xl font-bold mt-2">User Management</h1>
          <p className="text-muted-foreground">Manage users and assign roles</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Search and manage platform users</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Additional Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.full_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{user.company_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "shipper" ? "default" : "secondary"}>
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles?.map((role: string) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          setSelectedUser(null);
                          setSelectedRole("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            Assign Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Role</DialogTitle>
                            <DialogDescription>
                              Assign an additional role to {user.full_name || user.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleAssignRole}
                              disabled={!selectedRole || assignRole.isPending}
                            >
                              {assignRole.isPending ? "Assigning..." : "Assign Role"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
