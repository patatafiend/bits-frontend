"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { useFetchUsers } from "@/hooks/use-user";
import { Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ManageUsers() {
  const { data: usersData, error, loading, refetch } = useFetchUsers();

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <Card className="w-full flex">
        <CardHeader className="flex justify-between items-center gap-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Manage Users
              <RefreshCcw onClick={() => refetch()} size={16} />
            </h1>
          </div>
          <div>
            <Link href="manage-users/create">
              <Button size="sm" className="ml-auto">
                <Plus />
                Create User
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 w-full max-h-[80vh] overflow-y-auto">
          <Loader loading={loading} error={error?.message}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Middle Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData &&
                  usersData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap">
                        <Avatar>
                          <AvatarImage
                            className="w-8 h-8"
                            src={user.profile_url || ""}
                            alt="User Avatar"
                          />
                          <AvatarFallback>
                            {user.username && (
                              <span>
                                {user.username.charAt(0).toLocaleUpperCase() +
                                  user.username.charAt(1).toLocaleUpperCase()}
                              </span>
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.username}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.first_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.middle_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.last_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.phone_number}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.email}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.role}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`manage-users/${user.id}`}>
                          <Button variant="link" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`manage-users/${user.id}/edit`}>
                          <Button variant="link" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Loader>
        </CardContent>
      </Card>
    </div>
  );
}
