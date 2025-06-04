"use client";
import { db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import React from 'react';
import { useUser } from '@/providers/UserProvider';
import DataTable from './datatable';
import Modal from './Modal'; // Import the new Modal component
import { ColumnDef } from "@tanstack/react-table";

interface Event {
  id: string;
  "Event Name": string;
  "Committee Name": string;
  "Event Date": string;
  "Event Time": string;
  "Event Location": string;
  "Event description": string;
  "Event registration url": string;
  "Image url": string;
  Status: string;
}

const CommitteeHistory: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  console.log(user);
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "TempEvents");
        const snapshot = await getDocs(eventsRef);
        const Events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
const nonPendingEvents = Events.filter((e: Event) => {
 
  const committeeName = e["Committee Name"]?.toString().toLowerCase().trim();
  const userName = user?.name?.toString().toLowerCase().trim();
  return committeeName === userName;
});        setEvents(nonPendingEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: "Event Name",
      header: "Event Name",
    },
    {
      accessorKey: "Committee Name",
      header: "Committee Name",
    },
    {
      accessorKey: "Event Date",
      header: "Date",
    },
    {
      accessorKey: "Event Time",
      header: "Time",
    },
    {
      accessorKey: "Event Location",
      header: "Location",
    },
    {
      accessorKey: "Status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`capitalize ${row.original.Status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.Status}
        </span>
      ),
    },
    {
      accessorKey: "Image url",
      header: "Image",
      cell: ({ row }) => (
        <button 
          onClick={() => openModal(row.original["Image url"])}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Image
        </button>
      ),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <DataTable columns={columns} data={events} />
      <Modal isOpen={isModalOpen} onClose={closeModal} imageUrl={selectedImage} />
    </>
  );
};

export default CommitteeHistory;