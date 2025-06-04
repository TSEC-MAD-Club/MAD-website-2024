// TABLE FOR APPROVE_REJECTED COMPONENT

"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showFilters?: boolean;
}

export default function DataTable<TData, TValue>({
  data,
  columns,
  showFilters = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
 
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      sorting,
      columnFilters,
    },
  });

  const possibleColumnIds = ["Event Name", "certificateNumber"];
  const eventColumn = table
  .getAllColumns()
  .find((col) => possibleColumnIds.includes(col.id)) || null;
  
  const possibleColumnIds2 = ["name", "Committee Name"];
  const eventColumn2 = table
  .getAllColumns()
  .find((col) => possibleColumnIds2.includes(col.id)) || null;
  
  return (
    <>
      {showFilters && ( // Conditionally render the filters
        <div className="flex items-center py-4">
          <Input
              placeholder={eventColumn?.id ?? "Search"}
              value={(eventColumn?.getFilterValue() as string) ?? ""}
              onChange={(event) => eventColumn?.setFilterValue(event.target.value)}
              className="max-w-sm"
          />
          <Input
            placeholder={eventColumn2?.id ?? "Filter Name"}
            value={(eventColumn2?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              eventColumn2?.setFilterValue(event.target.value)
            }
            className="max-w-sm ml-2"
          />
        </div>
      )}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader className="bg-muted hover:bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
