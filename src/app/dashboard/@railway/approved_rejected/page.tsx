"use client";

import React, { useEffect, useState } from "react";
import DataTable from "@/components/datatable";
import { ColumnDef } from "@tanstack/react-table";
import { db } from "@/config/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { any } from "zod";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const dateFormat = (input: string | { seconds: number } | null | undefined): string => {
  if (!input) return "N/A";

  let date: Date;

  // Handle Firestore-style timestamp
  if (typeof input === "object" && input.seconds) {
    date = new Date(input.seconds * 1000);
  }
  // Handle string ISO format
  else if (typeof input === "string") {
    // Try to parse the ISO string safely
    const cleaned = input.replace(/\.(\d{3})\d+/, '.$1'); // Trim microseconds if too long
    date = new Date(cleaned);
  } else {
    return "N/A";
  }

  // Final validation
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
};


const Approved_Rejected = () => {
  interface Data {
    certificateNumber: string;
    name: string;
    gender: string;
    dob: string;
    from: string;
    to: string;
    class: string;
    mode: string;
    dateOfIssue: string;
    address: string;
    status: string;
  }

  interface RawHistoryItem {
    passNum: string;
    firstName?: string;
    gender?: string;
    dob?: { seconds: number };
    from?: string;
    to?: string;
    class?: string;
    duration?: string;
    lastPassIssued?: { seconds: number };
    address?: string;
    status?: string;
  }

  const columns: ColumnDef<Data, any>[] = [
    {
      accessorKey: "certificateNumber",
      header: "Certificate Number",
      cell: ({ row }) => {
        let cellData = row.getValue("certificateNumber") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        let cellData = row.getValue("name") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        let cellData = row.getValue("gender") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "dob",
      header: "Date of Birth",
      cell: ({ row }) => {
        let cellData = row.getValue("dob") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "from",
      header: "From",
      cell: ({ row }) => {
        let cellData = row.getValue("from") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => {
        let cellData = row.getValue("to") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => {
        let cellData = row.getValue("class") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "mode",
      header: "Mode",
      cell: ({ row }) => {
        let cellData = row.getValue("mode") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "dateOfIssue",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date of Issue
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const cellData = row.getValue("dateOfIssue") as string;
        return (
          <div className="flex h-[6vh] text-center items-center justify-center">
            {cellData}
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const parseDate = (dateStr: string) => {
          const [day, month, year] = dateStr.split("/").map(Number);
          return new Date(year, month - 1, day).getTime(); // JS months are 0-indexed
        };
    
        const dateA = parseDate(rowA.original.dateOfIssue);
        const dateB = parseDate(rowB.original.dateOfIssue);
    
        return dateA - dateB;
      },
    },
    {
      accessorKey: "address",
      header: () => <div className="w-[200px] text-center">Address</div>,
      cell: ({ row }) => {
        let cellData = row.getValue("address") as string;
        return (
          <div className="w-[200px] flex h-[6vh] text-center items-center justify-center ">
            {cellData}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const concessionHistoryRef = collection(db, "ConcessionHistory");

  //       const querySnapshot = await getDocs(concessionHistoryRef);

  //       const userMap = new Map<string, {
  //         certificateNumber: string;
  //         name: string;
  //         gender: string;
  //         dob: string;
  //         from: string;
  //         to: string;
  //         class: string;
  //         mode: string;
  //         dateOfIssue: string;
  //         address: string;
  //         status: string;
  //         index: number;
  //       }>();

  //       querySnapshot.docs.forEach((doc) => {
  //         const history = doc.data().history;

  //         history.forEach((item: any, index: number) => {
  //           if (item.status === "serviced" || item.status === "cancelled") {
  //             const existingItem = userMap.get(item.passNum);

  //             if (!existingItem || existingItem.index < index) {
  //               userMap.set(item.passNum, {
  //                 certificateNumber: item.passNum || "N/A",
  //                 name: item.firstName || "N/A",
  //                 gender: item.gender || "N/A",
  //                 dob: item.dob?.seconds
  //                   ? dateFormat(item.dob.seconds)
  //                   : "N/A",
  //                 from: item.from || "N/A",
  //                 to: item.to || "N/A",
  //                 class: item.class || "N/A",
  //                 mode: item.duration || "N/A",
  //                 dateOfIssue: item.lastPassIssued?.seconds
  //                   ? dateFormat(item.lastPassIssued.seconds)
  //                   : "N/A",
  //                 address: item.address || "N/A",
  //                 status: item.status || "N/A",
  //                 index: index
  //               });
  //             }
  //           }
  //         });
  //       });

  //       const parseDate = (dateStr: string): Date => {
  //         const [day, month, year] = dateStr.split("/auth").map(Number);
  //         return new Date(year, month - 1, day);
  //       };

  //       const sortedUserArray = Array.from(userMap.values()).sort((a, b) => {
  //         const dateA =
  //           a.dateOfIssue !== "N/A" ? parseDate(a.dateOfIssue).getTime() : 0;
  //         const dateB =
  //           b.dateOfIssue !== "N/A" ? parseDate(b.dateOfIssue).getTime() : 0;
  //         return dateA - dateB;
  //       });

  //       const userList = sortedUserArray.map(({ index, ...rest }) => rest);

  //       setData(userList);
  //     } catch (err) {
  //       console.error("Error fetching data: ", err);
  //     } finally {
  //       setLoading(false);
  //     }

  //   };

  //   fetchUserData();
  // }, []);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const concessionHistoryDoc = doc(db, "ConcessionHistory", "History");
  //       const docSnapshot = await getDoc(concessionHistoryDoc);

  //       if (docSnapshot.exists()) {
  //         const history = docSnapshot.data().history || [];

  //         const userMap = new Map();

  //         history.forEach((item: any, index: number) => {
  //           if (item.status === "serviced" || item.status === "cancelled") {
  //             const existingItem = userMap.get(item.passNum);

  //             if (!existingItem || existingItem.index < index) {
  //               userMap.set(item.passNum, {
  //                 certificateNumber: item.passNum || "N/A",
  //                 name: item.firstName || "N/A",
  //                 gender: item.gender || "N/A",
  //                 dob: item.dob?.seconds ? dateFormat(item.dob.seconds) : "N/A",
  //                 from: item.from || "N/A",
  //                 to: item.to || "N/A",
  //                 class: item.class || "N/A",
  //                 mode: item.duration || "N/A",
  //                 dateOfIssue: item.lastPassIssued?.seconds || 0,
  //                 address: item.address || "N/A",
  //                 status: item.status || "N/A",
  //                 index: index,
  //               });
  //             }
  //           }
  //         });

  //         const sortedUserArray = Array.from(userMap.values()).sort((a, b) => {
  //           return b.dateOfIssue - a.dateOfIssue;
  //         });

  //         const userList = sortedUserArray.map(({ index, ...rest }) => rest);
  //         setData(userList);
  //       } else {
  //         console.error("Document does not exist");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching data: ", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storage = getStorage();
        const fileRef = ref(storage, "RailwayConcession/concessionHistory.json");
        const url = await getDownloadURL(fileRef);
        const response = await fetch(url);
        const history: RawHistoryItem[] = await response.json();

        const userMap = new Map<string, Data & { index: number }>();

        history.forEach((item, index) => {
          if (item.status === "serviced" || item.status === "cancelled") {
            const existing = userMap.get(item.passNum);

            if (!existing || existing.index < index) {
              userMap.set(item.passNum, {
                certificateNumber: item.passNum || "N/A",
                name: item.firstName || "N/A",
                gender: item.gender || "N/A",
                dob: dateFormat(item.dob) || "N/A",
                from: item.from || "N/A",
                to: item.to || "N/A",
                class: item.class || "N/A",
                mode: item.duration || "N/A",
                dateOfIssue: dateFormat(item.lastPassIssued) || "N/A",
                address: item.address || "N/A",
                status: item.status || "N/A",
                index,
              });
            }
          }
        });

        const sortedArray = Array.from(userMap.values())
          .sort((a, b) => new Date(b.dateOfIssue).getTime() - new Date(a.dateOfIssue).getTime())
          .map(({ index, ...rest }) => rest); // Strip `index`

        setData(sortedArray);
      } catch (err) {
        console.error("Error fetching data: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }
  //test123
  return (
    <div>
      <div className="w-[99vw] h-[99vh] flex flex-col">
        <div className="h-[100%] flex items-center justify-center">
          <div className="overflow-auto m-2 w-[100%] h-[100%]">
            <DataTable data={data} columns={columns} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approved_Rejected;
