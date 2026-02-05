"use client";

import { useDeactivateUser, useFetchUser } from "@/hooks/use-user";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, User as UserIcon, CircleX } from "lucide-react";
import Loader from "@/components/ui/loader";
import { User } from "@/lib/types";
import { formatDate, formatFullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DrawerDialog } from "@/components/drawer-dialog";
//import { useUserAuditLogs } from "@/hooks/use-activity-service";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

export default function UserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data: userData, refetch: refetchUser } = useFetchUser(userId);
  const {
    execute: deactivateUser,
    loading: userLoading,
    error,
  } = useDeactivateUser();
  //   const signins = userData?.data?.signins || [];
  //   const devices = userData?.data?.devices || [];

  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error.message,
      });
    }
  }, [error]);

  return (
    <div>
      <Loader loading={userLoading}>
        {userData && <UserProfile className="w-full" user={userData} />}
        {/* <div className="w-full flex flex-col xl:flex-row gap-6 mt-6">
          <UserSignin className="w-full" signins={signins} />
          {userId && <UserActivity userId={userId} className="w-full" />}
        </div>
        <UserDevices className="w-full mt-6" devices={devices} /> */}
        {userData && (
          <DangerZone
            user={userData as User}
            onDeactivate={async (isBlocked) => {
              await deactivateUser({
                params: `${userData.id}/${isBlocked ? "activate" : "deactivate"}`,
              });
              refetchUser();
            }}
            loading={userLoading}
          />
        )}
      </Loader>
    </div>
  );
}

function UserProfile({ user, className }: { user: User; className?: string }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user?.profile_url}
                alt={`${user?.first_name} ${user?.last_name}`}
              />
              <AvatarFallback className="text-lg">
                {getInitials(user?.first_name, user?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl flex items-center space-x-4">
                <div>{formatFullName(user)}</div>
                <Link href={`${user.id}/edit`}>
                  <Button variant="link" size="sm">
                    Edit
                  </Button>
                </Link>
              </CardTitle>

              <p className="text-muted-foreground">@{user?.username}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">{user?.role}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.phone_number || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground">#{user?.id}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user?.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DangerZone({
  user,
  onDeactivate,
  loading,
}: {
  user: User;
  loading: boolean;
  onDeactivate?: (isBlocked: boolean) => Promise<void>;
}) {
  const handleDeactivateUser = async () => {
    await onDeactivate?.(user.is_blocked);
  };

  return (
    <Card className="mt-6 border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
          <CircleX className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-medium text-destructive">Deactivate User</h3>
              {!user.is_blocked ? (
                <p className="text-sm text-muted-foreground">
                  This will disable the users account. They will not be
                  able to sign in or access any resources until the account is
                  reactivated. This action can be reversed.
                </p>
              ) : (
                <p>
                  This will reactivate the users account, allowing them to
                  sign in and access resources again.
                </p>
              )}
            </div>
            <DrawerDialog
              title={user.is_blocked ? "Reactivate User" : "Deactivate User"}
              description={
                user.is_blocked
                  ? "This will reactivate the users account, allowing them to sign in and access resources again."
                  : "This will disable the users account. They will not be able to sign in or access any resources until the account is reactivated. This action can be reversed."
              }
              renderTrigger={
                <Button size="sm" variant="destructive">
                  {user.is_blocked ? "Reactivate User" : "Deactivate User"}
                </Button>
              }
            >
              {(closeDialog) => (
                <div className="flex justify-end">
                  <Button
                    loading={loading}
                    onClick={async () => {
                      await handleDeactivateUser();
                      closeDialog?.();
                    }}
                    variant="destructive"
                  >
                    {user.is_blocked ? "Reactivate User" : "Deactivate User"}
                  </Button>
                </div>
              )}
            </DrawerDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// function UserSignin({
//   signins,
//   className,
// }: {
//   signins: UserSignins[];
//   className?: string;
// }) {
//   return (
//     <Card className={`${className}`}>
//       <CardHeader>
//         <CardTitle className="text-lg">User Sign-ins</CardTitle>
//       </CardHeader>
//       <CardContent className="max-h-96 overflow-auto">
//         {signins.map((signin, i) => (
//           <Card className="bg-default mt-2" key={i}>
//             <CardContent className="px-4">
//               <div className="flex justify-between items-start">
//                 <div className="space-y-2">
//                   <div className="flex items-center space-x-2">
//                     <span className="font-medium">{signin.device_type}</span>
//                     <Badge variant="outline">{signin.os_name}</Badge>
//                     <Badge variant={signin.success ? "success" : "destructive"}>
//                       {signin.message}
//                       {signin.success ? (
//                         <Check className="h-4 w-4" />
//                       ) : (
//                         <CircleX className="h-4 w-4" />
//                       )}
//                     </Badge>
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     {signin.browser_name} {signin.browser_version}
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     IP: {signin.ip_address}
//                   </div>
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   {formatDate(signin.created_at)}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </CardContent>
//     </Card>
//   );
// }

// function UserActivity({
//   className,
//   userId,
// }: {
//   className?: string;
//   userId: string;
// }) {
//   const { data: res, loading, error, refetch } = useUserAuditLogs(userId);
//   const activityLogs = res?.data || [];
//   const [range, setRange] = useState<{ from: Date; to: Date }>();
//   const actionBadgeColor = {
//     CREATE: "success",
//     UPDATE: "warning",
//     DELETE: "destructive",
//   };

//   return (
//     <Card className={`${className}`}>
//       <CardHeader>
//         <CardTitle className="text-lg flex items-center justify-between">
//           <p className="flex items-center">
//             User Activity
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() =>
//                 refetch({
//                   params: `/${userId}`,
//                   body: {
//                     start_date: range?.from || new Date(),
//                     end_date: range?.to || new Date(),
//                     page: 1,
//                     limit: 100,
//                   },
//                 })
//               }
//             >
//               <RefreshCw />
//             </Button>
//           </p>
//           <DateRangePicker
//             onUpdate={({ range }) => {
//               setRange({ from: range.from, to: range.to || new Date() });
//               refetch({
//                 params: `/${userId}`,
//                 body: {
//                   start_date: range.from,
//                   end_date: range.to,
//                   page: 1,
//                   limit: 100,
//                 },
//               });
//             }}
//           />
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="max-h-96 overflow-auto">
//         <Loader loading={loading} error={error?.detail}>
//           {activityLogs.map((log, i) => (
//             <Card className="bg-default mt-2" key={i}>
//               <CardContent className="px-4">
//                 <div className="flex justify-between items-start">
//                   <div className="space-y-2">
//                     <div className="flex items-center space-x-2">
//                       <span className="font-medium">{log.log_type}</span>
//                       <Badge
//                         variant={actionBadgeColor[log.action] || "outline"}
//                       >
//                         {log.action}
//                       </Badge>
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       <span>{log.device_type} </span>
//                       <Badge variant="outline">{log.os_name}</Badge>
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       {log.browser_name} {log.browser_version}
//                     </div>
//                     <div className="text-sm text-muted-foreground">
//                       IP: {log.ip_address}
//                     </div>
//                     <div>{log.data && <DataModal data={log.data} />}</div>
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     {formatDate(log.created_at)}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </Loader>
//       </CardContent>
//     </Card>
//   );
// }

// function DataModal({ data }: { data: Record<string, any> }) {
//   return (
//     <DrawerDialog
//       className="max-w-2xl max-h-96"
//       title="Data"
//       description="View the data returned from the API"
//       renderTrigger={
//         <Button size="sm" variant="outline">
//           View Data
//         </Button>
//       }
//     >
//       <ScrollArea className="max-h-72 w-full rounded-md border">
//         <pre className="p-4 text-sm leading-snug whitespace-pre-wrap break-words">
//           {JSON.stringify(data, null, 2)}
//         </pre>
//       </ScrollArea>
//     </DrawerDialog>
//   );
// }

// function UserDevices({
//   devices,
//   className,
// }: {
//   devices: UserDevice[];
//   className?: string;
// }) {
//   return (
//     <Card className={`space-y-4 ${className}`}>
//       <CardHeader>
//         <CardTitle className="text-lg font-medium">Signed-in Devices</CardTitle>
//       </CardHeader>
//       <CardContent className="max-h-96 overflow-auto">
//         {devices.map((device) => (
//           <Card className="bg-default mt-2" key={device.id}>
//             <CardContent className="px-4">
//               <div className="flex justify-between items-start">
//                 <div className="space-y-2">
//                   <div className="flex items-center space-x-2">
//                     <span className="font-medium">{device.browser_name}</span>
//                     <Badge variant="outline">{device.device_type}</Badge>
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     {device.os_name} {device.os_version}
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     IP: {device.ip_address}
//                   </div>
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   {formatDate(device.created_at)}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </CardContent>
//     </Card>
//   );
// }
