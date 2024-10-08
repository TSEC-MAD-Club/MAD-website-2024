"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Globe, Loader } from "lucide-react";

// Define the type for your links
type Link = {
  id: string;
  purpose?: string;
  url: string;
};

const LinksList = () => {
  // Use the Link type for the state
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      const querySnapshot = await getDocs(collection(db, "QRLink"));
      const linksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Link[]; // Assert that this matches the Link type
      setLinks(linksData);
      setLoading(false); // Stop loading after data is fetched
    };
    fetchLinks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Useful Links</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {links.map((link) => (
          <div key={link.id}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">{link.purpose || "Unclassified"}</CardTitle>
                <CardDescription className="">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-words
                    flex items-center gap-2
                    "
                  >
                    <Globe className="w-5 h-5 text-blue-500" />
                    Watch video →
                  </a>
                </CardDescription>  
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinksList;
