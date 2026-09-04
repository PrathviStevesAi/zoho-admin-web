"use client";

import { clientFetchCustomersAction } from "@/lib/client-actions";
import { useState, useEffect } from "react";
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Building,
  Users,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/table/pagination";
import { CustomerRegistrationForm } from "./_components/customer-registration-form";

export default function CustomerDirectoryPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "register">("list");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadCustomers(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadCustomers = async (page: number = 1) => {
    setIsLoading(true);
    const res = await clientFetchCustomersAction({
      page,
      search: searchQuery
    });
    if (res.success) {
      setCustomers(res.data);
      setPagination(res.pagination);
      setCurrentPage(page);
    } else {
      toast.error(res.error || "Failed to load customers");
    }
    setIsLoading(false);
  };

  return (
    <div className="p-0 sm:p-4 md:p-6 max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-700 text-[13px] mb-1">
          <Link href="/dashboard" className="hover:text-[#0064cb] transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700">Users Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 font-medium">Customers</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 hover:text-[#0064cb] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Customers Directory</h1>
        </div>
      </div>

      <div className="w-full">
        {view === "register" ? (
          <CustomerRegistrationForm onBack={() => { setView("list"); loadCustomers(1); }} />
        ) : (
          <div>
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white min-h-[600px] flex flex-col !gap-0 !py-0">
              <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users className="w-5 h-5 text-[#0064cb]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Customers List</CardTitle>
                    <p className="text-xs text-slate-800 font-medium mt-0.5">
                      {pagination?.total || customers.length} Registered Customers
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    <Input
                      placeholder="Search company or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 pl-9 pr-4 bg-slate-50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-xs font-medium text-slate-800"
                    />
                  </div>
                  <Button
                    onClick={() => setView("register")}
                    className="h-10 bg-[#0064cb] hover:bg-[#0052ae] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 px-4 whitespace-nowrap cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add New Customer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Action</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Company Name</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Full Name</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                      <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider">Service Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent border-slate-50">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-8 h-8 rounded-full bg-slate-100" />
                              <Skeleton className="h-4 w-24 bg-slate-100" />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36 bg-slate-100" /></TableCell>
                          <TableCell className="py-4 px-4"><Skeleton className="h-4 w-48 bg-slate-100" /></TableCell>
                        </TableRow>
                      ))
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-12 h-12 text-slate-200" />
                            <p className="text-sm font-medium text-slate-700">No customers found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id || customer.customer_id || Math.random()} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                          <TableCell className="px-6 py-4">
                            <Link href={`/users-directory/customers/${customer.id || customer.customer_id}${customer.customer_id ? `?customer_id=${customer.customer_id}` : ''}`}>
                              <Button variant="outline" size="sm" className="h-8 px-3 rounded-full text-xs font-semibold text-[#0064cb] border-[#0064cb]/20 hover:bg-[#0064cb]/5 hover:text-[#0052ae]">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                <Building className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-slate-700">
                                {customer.company_name || "---"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">
                              {customer.first_name || "---"} {customer.last_name || ""}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium">{customer.email}</span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs text-slate-800 font-medium block truncate max-w-[200px]" title={customer.service_address ? `${customer.service_address.street}, ${customer.service_address.city}, ${customer.service_address.state} ${customer.service_address.zip}` : "---"}>
                              {customer.service_address ? `${customer.service_address.street}, ${customer.service_address.city}, ${customer.service_address.state} ${customer.service_address.zip}` : "---"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {pagination && (
                <Pagination
                  page={currentPage}
                  totalPages={pagination.total_pages}
                  totalItems={pagination.total}
                  limit={pagination.limit}
                  onPageChange={loadCustomers}
                  isPending={isLoading}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
