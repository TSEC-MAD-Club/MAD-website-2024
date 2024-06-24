"use client"
import { ModeToggle } from "@/components/modeToggle";
import Login from "../pages/Login"
import Image from "next/image";
import { UserContext } from "./layout";
import DevsDark from "../public/images/devs-dark.png"
import DevsLight from "../public/images/devs-light.png"
import { useEffect } from "react";
import React from "react";
import { useTheme } from "next-themes";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const { loggedIn, setLoggedIn, user, setUser } =
    React.useContext(UserContext);

  const theme = useTheme()
  console.log(theme.theme) //Login component mai directly theme = useTheme() se 'dark' string agaya , yaha pe theme.theme karna pada (object throw kia theme ne :/ -- nashe)


  return (

    <>
      <div className="w-[100%] h-[100%] flex flex-col">
          <div className="h-[10%] flex items-center justify-between">
            <div className="ml-5">
              <Image src={theme.theme =='dark' ? DevsDark : DevsLight} alt="logo" />
            </div>
            <div className=" mr-5">
              <ModeToggle />
            </div>
            <Sidebar /> {/* TESTING SIDEBAR*/}
          </div>
          <div className="h-[90%] flex items-center justify-center">
            <Login 
              loggedIn={loggedIn}
              setLoggedIn={setLoggedIn}
              setUser={setUser}
            />
          </div>
      </div>
    </>
  );
}
