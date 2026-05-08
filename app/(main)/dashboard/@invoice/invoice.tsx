// "use client";

// import { useEffect, useState, useTransition, useRef, useCallback } from "react";
// import { InvoiceData, Pagination } from "@/types/dashboard.types";
// import { fetchInvoicesAction } from "@/actions/dashboard.actions";
// import { toast } from "sonner";
// import { Loader2, Search } from "lucide-react";

// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { DataTable } from "@/components/table/data-table";
// import { invoiceTableColumns } from "@/features/invoice/invoice.table";
// import { GenericRowSkeleton } from "@/components/skeletons/generic-row-skeleton";
// import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";
// import useDebounceValue from "@/hooks/use-debounce";

// export default function Invoice({
//   initialData,
//   pagination,
// }: {
//   initialData: InvoiceData[];
//   pagination: Pagination;
// }) {
//   const [invoices, setInvoices] = useState(initialData);
//   const [searchInvoices, setSearchInvoices] = useState<InvoiceData[]>([]);
//   const [page, setPage] = useState(pagination.page);
//   const [hasMore, setHasMore] = useState(
//     pagination.page < pagination.total_pages
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isPending, startTransition] = useTransition();
//   const debouncedValue = useDebounceValue(searchTerm, 500);
//   const loadMoreRef = useRef<HTMLDivElement | null>(null);
//   const loadingRef = useRef(false);
//   const isSearching = !!debouncedValue;

//   const loadMoreInvoices = useCallback(async () => {
//     if (isPending || !hasMore || isSearching || loadingRef.current) return;

//     const nextPage = page + 1;
//     loadingRef.current = true;

//     startTransition(async () => {
//       const res = await fetchInvoicesAction(nextPage, debouncedValue);

//       if (!res.success) {
//         toast.error(res.error);
//         loadingRef.current = false;
//         return;
//       }

//       if (res?.data && res.pagination) {
//         setInvoices((prev) => [...prev, ...res.data]);
//         setPage(nextPage);
//         setHasMore(nextPage < res.pagination.total_pages);
//       }

//       loadingRef.current = false;
//     });
//   }, [isPending, hasMore, isSearching, page, debouncedValue]);

//   useEffect(() => {
//     if (!debouncedValue) {
//       setSearchInvoices([]);
//       return;
//     }

//     //function to search invoices by debounced value
//     startTransition(async () => {
//       const res = await fetchInvoicesAction(1, debouncedValue);

//       if (!res.success) {
//         toast.error(res.error);
//         return;
//       }

//       if (res?.data) {
//         setSearchInvoices(res.data);
//       }
//     });
//   }, [debouncedValue]);

//   useEffect(() => {
//     const target = loadMoreRef.current;
//     if (!target) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         const firstEntry = entries[0];

//         if (firstEntry.isIntersecting) {
//           loadMoreInvoices();
//         }
//       },
//       {
//         root: null,
//         rootMargin: "100px",
//         threshold: 0,
//       }
//     );

//     observer.observe(target);

//     return () => observer.disconnect();
//   }, [loadMoreInvoices]);

//   const displayedInvoices = isSearching ? searchInvoices : invoices;

//   return (
//     <Card className="w-full h-[510px] border-border rounded-sm overflow-hidden bg-card shadow-sm flex flex-col">

//       {/* HEADER */}
//       <CardHeader className="flex flex-row items-center justify-between px-7 py-1 space-y-0">
//         <CardTitle className="text-[19px] font-bold text-foreground">
//           New Invoices
//         </CardTitle>

//         <div className="relative w-full max-w-[200px]">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//           <Input
//             type="search"
//             placeholder="Search invoices..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-9 h-10"
//           />
//         </div>
//       </CardHeader>

//       {/* CONTENT */}
//       <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
//         {isPending && isSearching ? (
//           Array.from({ length: 5 }).map((_, i) => (
//             <GenericRowSkeleton
//               key={i}
//               columns={invoiceSkeletonColumns}
//             />
//           ))
//         ) : (
//           <>
//             <DataTable
//               columns={invoiceTableColumns}
//               data={displayedInvoices}
//               emptyMessage="No invoices found."
//             />

//             {/* THIS IS THE TRIGGER ELEMENT */}
//             {!isSearching && hasMore && (
//               <div
//                 ref={loadMoreRef}
//                 className="py-6 flex items-center justify-center w-full"
//               >
//                 <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
//                   <Loader2 className="h-5 w-5 animate-spin text-primary" />
//                   <span className="text-sm font-medium">Fetching more records...</span>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </CardContent>
//     </Card>
//   );
// }


"use client";

import { InvoiceData, Pagination } from "@/types/dashboard.types";
import { fetchInvoicesAction } from "@/actions/dashboard.actions";
import { Loader2, Search } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/table/data-table";
import { invoiceTableColumns } from "@/features/invoice/invoice.table";
import { invoiceSkeletonColumns } from "@/features/invoice/invoice.skeleton";
import { useInfiniteSearch } from "@/hooks/use-infinite-data";
import { GenericRowSkeleton } from "@/components/skeletons/generic-row-skeleton";

export default function Invoice({ initialData, pagination }: { initialData: InvoiceData[]; pagination: Pagination }) {
  const {
    displayedData,
    searchTerm,
    setSearchTerm,
    isPending,
    hasMore,
    isSearching,
    loadMoreRef
  } = useInfiniteSearch<InvoiceData>(initialData, pagination, fetchInvoicesAction);

  return (
    <Card className="w-full h-[510px] border-border rounded-sm bg-card shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-7 py-1">
        <CardTitle className="text-[19px] font-bold">New Invoices</CardTitle>
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
        {isPending && isSearching ? (
          Array.from({ length: 5 }).map((_, i) => (
            <GenericRowSkeleton
              key={i}
              columns={invoiceSkeletonColumns}
            />
          ))
        ) : (
          <>
            <DataTable columns={invoiceTableColumns} data={displayedData} emptyMessage="No invoices found." />
            {!isSearching && hasMore && (
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
