"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/providers/UserProvider";
import { db } from "@/config/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import UnderMaintenancePage from "@/components/UnderMaintenancePage";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const docRef = doc(db, "Maintainance", "Web Maintenance");
        const docSnap = await getDoc(docRef);
        setIsUnderMaintenance(docSnap.exists() ? docSnap.data().underMaintenance : false);
      } catch (error) {
        console.error("Error fetching maintenance status:", error);
        setIsUnderMaintenance(false);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  // While loading, return minimal HTML to avoid hydration mismatch
  if (isUnderMaintenance === null) {
    return (
      <html lang="en">
        <head>
          <title>Loading...</title>
        </head>
        <body className={`${inter.className} w-full h-screen overflow-auto`}>
          {/* Optional: Add a loading spinner here */}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Developers Club of TSEC | TSEC Devs Club</title>
        <meta name="description" content="Creators of the official TSEC App. Learn more about what we build, how we empower students, and download the TSEC app." />
        <link rel="icon" href="/devBlackLogo.ico" sizes="any" />
        <link rel="canonical" href="https://tsecdevsclub.com/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Developers Club of TSEC",
              "alternateName": "TSEC Devs Club",
              "url": "https://tsecdevsclub.com",
              "logo": "https://tsecdevsclub.com/devBlackLogo.ico",
              "sameAs": [
                "https://github.com/TSEC-MAD-Club",
                "https://www.instagram.com/devsclubtsec/",
                "https://www.linkedin.com/in/developer-s-club-tsec/",
                "https://www.linkedin.com/company/devs-club-tsec/"
              ],
              "description": "Creators of the TSEC App for students of Thadomal Shahani Engineering College."
            }),
          }}
        />
      </head>
      <body className={`${inter.className} w-full h-screen overflow-auto`}>
        <UserProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {isUnderMaintenance ? <UnderMaintenancePage /> : children}
            <Toaster />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}