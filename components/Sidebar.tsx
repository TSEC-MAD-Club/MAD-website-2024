import React, { useContext, useEffect, useState, useCallback } from "react";
import Switch from "react-switch";
import sidebarLinks from "../constants/sidebarLinks";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from "next/link";
import Spinner from "@/public/icons/Spinner";
import SunIcon from "@/public/icons/SunIcon";
import MoonIcon from "@/public/icons/MoonIcon";
import { UserContext } from "@/app/layout";
import { useTheme } from "next-themes";
import { userTypes } from "@/constants/types/userTypes";


function Sidebar({ user } : { user : any }) {
  user = {
    type: userTypes.RAILWAY,
    email: "anish@gmail.com",
    name: "Anish", 
  } // DEFINE USER FOR TESTING
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State to manage loading spinner
  const { theme, setTheme } = useTheme();
  const { loggedIn, setLoggedIn } = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = new Date();
  const day = today.getDate();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const getOrdinalIndicator = useCallback((day : number) => {
    if (day >= 11 && day <= 13) {
      return "th";
    }

    const lastDigit = day % 10;

    switch (lastDigit) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }, []);

  const formattedDate = today
    .toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace(/\b(\d{1,2})(th|nd|rd|st)\b/, "$1" + getOrdinalIndicator(day));

  useEffect(() => {
    setIsOpen(window.innerWidth > 600);

    const handleResize = () => {
      setIsOpen(window.innerWidth > 600);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setIsLoading(false); // Set loading to false initially

    const handleRouteChange = () => {
      setIsLoading(true);
    };

    handleRouteChange();

    setIsLoading(false);
  }, [pathname, searchParams]);

  const userHasAccess = (featureTypes : any) => {
    return featureTypes.length === 0 || featureTypes.includes(user.type);
  };

  return (
    <div className="relative z-10">
      <div className={`fixed top-0 left-0 h-full ${isOpen ? "w-[17vw]" : "w-0"} transition-width duration-300`}>
        <div className="absolute top-8 left-8 cursor-pointer" onClick={toggleMenu}>
          <div className="w-5 h-[2px] bg-black mb-1"></div>
          <div className="w-5 h-[2px] bg-black mb-1"></div>
          <div className="w-5 h-[2px] bg-black mb-1"></div>
        </div>
        {isOpen && (
          <div className="flex flex-col items-center h-full w-[17vw] border border-gray-500 rounded-2xl mt-16 ml-8 pb-8 bg-gray-500">
            <div className="w-full mt-4 ml-8">
              <img className="w-12 h-12" src={theme === "dark" ? "/assets/images/devs-dark.png" : "/assets/images/devs-light.png"} alt="Logo" />
            </div>
            <div className="flex justify-center mt-4 w-full">
              <img className="w-12 h-12 rounded-full mt-6" src="assets/images/DP.png" alt="User" />
            </div>
            <div className="flex flex-col items-center mt-4 font-sans">
              <h5 className="text-sm font-normal mb-1">{user.name}</h5>
              <h5 className="text-xs font-light mb-2">{user.email}</h5>
              <hr className="border-gray-200 w-4/5" />
            </div>
            <div className="flex flex-col mt-4 w-4/5">
              {sidebarLinks.map((data, id) =>
                userHasAccess(data.type) ? (
                  <Link key={id} href={data.mainLink}>
                    <div className="flex items-center text-gray-200 hover:bg-gray-300 rounded px-2 py-3 cursor-pointer">
                      <img src={theme === "light" ? data.lightIconLink : data.darkIconLink} alt="" className="w-4 h-4 mr-5" />
                      {data.mainTitle}
                    </div>
                  </Link>
                ) : null
              )}
            </div>
            <div className="flex flex-col items-start justify-center mt-12 gap-4">
              <Switch
                checked={theme === "dark"}
                onChange={toggleTheme}
                uncheckedHandleIcon={<SunIcon width={16} height={16} style={{ marginTop: "-6px", marginLeft: "2px" }} />}
                checkedHandleIcon={<MoonIcon width={16} height={16} style={{ marginTop: "-6px", marginLeft: "2px" }} />}
                onColor={"#2a66ff"}
                offColor={"#C9C9C9"}
                uncheckedIcon={false}
                checkedIcon={false}
                height={24}
                width={48}
                handleDiameter={20}
              />
              <p>{formattedDate}{getOrdinalIndicator(day)}</p>
              <button
                onClick={() => {
                  if (localStorage.getItem("user")) {
                    localStorage.removeItem("user");
                  }
                  setLoggedIn(false);
                  router.push("/");
                }}
                className="border-none bg-none text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      {isLoading && <Spinner />} {/* Render spinner when loading */}
    </div>
  );
}

export default Sidebar;
