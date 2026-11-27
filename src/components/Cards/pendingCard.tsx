import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { EyeIcon } from "lucide-react";
// import testimg from "../../public/images/OnlineTraining.png";
import { dateFormat } from "@/constants/dateFormat";
import { Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCcw } from 'lucide-react';
import Image from "next/image";

const currentUserYear = (gradyear: string) => {
  // const gradYearList = useGradYear();
  // console.log(gradYearList);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const gradYear = parseInt(gradyear);

  if (
    (currentMonth >= 6 && gradYear == currentYear + 4) ||
    (currentMonth <= 5 && gradYear == currentYear + 3)
  ) {
    return "FE";
  } else if (
    (currentMonth >= 6 && gradYear == currentYear + 3) ||
    (currentMonth <= 5 && gradYear == currentYear + 2)
  ) {
    return "SE";
  } else if (
    (currentMonth >= 6 && gradYear == currentYear + 2) ||
    (currentMonth <= 5 && gradYear == currentYear + 1)
  ) {
    return "TE";
  } else if (
    (currentMonth >= 6 && gradYear == currentYear + 1) ||
    (currentMonth <= 5 && gradYear == currentYear)
  ) {
    return "BE";
  }
};

const calAge = (dobString: any) => {
  const [day, month, year] = dobString.split("/").map(Number);
  const dob = new Date(year, month - 1, day);
  const today = new Date();
  let ageYears = today.getFullYear() - dob.getFullYear();
  let ageMonths = today.getMonth() - dob.getMonth();
  if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < dob.getDate())) {
    ageYears--;
    ageMonths += 12;
  }
  if (today.getDate() < dob.getDate()) {
    ageMonths--;
    if (ageMonths < 0) {
      ageMonths += 12;
    }
  }
  return { years: ageYears, months: ageMonths };
};

const isButtonDisabled = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();

  // Disable button from Friday 2 PM to Monday 8 AM
  if (day === 5 && hour >= 14) {
    // Friday after 2 PM
    return true;
  }
  if (day === 6 || (day === 0 && hour < 8)) {
    // Saturday or Sunday before 8 AM
    return true;
  }
  if (day === 1 && hour < 8) {
    // Monday before 8 AM
    return true;
  }
  return false;
};

function InputWithLabel({ label, input }: { label: any; input: any }) {
  return (
    <div className="flex flex-col h-[100%]">
      <div className=" h-[35%] text-[0.94rem] xl:text-sm font-[550] pt-1">
        {label}
      </div>
      <div className=" h-[65%] overflow-auto">
        <div
          className={`border-[0.5px] xl:text-sm flex items-center h-[80%] leading-none   text-start py-[2%] px-[4%]   w-[90%] rounded-lg text-[0.9rem]S`}
        >
          {input}
        </div>
      </div>
    </div>
  );
}

//ignore
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
}

// Sir ke demand ke according Zoom ka feature with image in the modal !!
const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // New state for rotation

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0); // Reset rotation when modal is closed
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const resetZoomAndRotation = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotateClockwise = () => {
    setRotation((prev) => prev + 90); // Rotate 90 degrees clockwise
  };

  const handleRotateCounterClockwise = () => {
    setRotation((prev) => prev - 90); // Rotate 90 degrees counterclockwise
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;

      if (imageRef.current) {
        const image = imageRef.current;
        const modalBounds = image.parentElement?.getBoundingClientRect();
        const imageBounds = image.getBoundingClientRect();

        const maxX = (modalBounds?.width || 0) / 2;
        const maxY = (modalBounds?.height || 0) / 2;
        const minX = -((imageBounds.width * zoomLevel) - maxX);
        const minY = -((imageBounds.height * zoomLevel) - maxY);

        setPosition({
          x: Math.max(Math.min(newX, maxX), minX),
          y: Math.max(Math.min(newY, maxY), minY),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>
            Zoom and pan the image using your mouse. Scroll to zoom in and out.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex justify-center items-center overflow-hidden py-4"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <Image
            unoptimized
            ref={imageRef}
            src={imageSrc}
            alt="Previous Pass"
            width={600}
            height={400}
            loading="eager"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            priority
            sizes="(max-width: 600px) 100vw, 33vw"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
              cursor: dragging ? "grabbing" : "grab",
              objectFit: 'contain',
            }}
            className="max-w-full max-h-96 rounded-lg transition-transform duration-300"
            onMouseDown={handleMouseDown}
          />
        </div>
        <div className="flex space-x-2 mt-4 justify-center">
          <Button variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="mr-1 w-4 h-4" /> Zoom In
          </Button>
          <Button variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="mr-1 w-4 h-4" /> Zoom Out
          </Button>
          <Button variant="outline" onClick={handleRotateCounterClockwise}>
            <RotateCcw className="mr-1 w-4 h-4" /> Rotate Left
          </Button>
          <Button variant="outline" onClick={handleRotateClockwise}>
            <RotateCw className="mr-1 w-4 h-4" /> Rotate Right
          </Button>
          <Button variant="outline" onClick={resetZoomAndRotation}>
            <RefreshCcw className="mr-1 w-4 h-4" /> Reset
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (certificateNumber: string) => void;
  action: string;
  data: {
    firstName: string;
    middleName: string;
    lastName: string;
    from: string;
    duration: string;
    reason: string;
    setReason: React.Dispatch<React.SetStateAction<string>>;
  };
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  action,
  data,
}) => {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const validateAndSubmit = () => {
    if (action === "Approve" && certificateNumber.trim() === "") {
      setError("Please enter certificate number");
    } else {
      setError("");
      onSubmit(certificateNumber)
      setShowConfirmation(false)
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div
        className={`p-8 rounded-lg shadow-xl w-full max-w-md ${action === "Approve"
            ? "bg-green-100"
            : action === "Reject"
              ? "bg-red-100"
              : "bg-white"
          }`}
      >

        {!showConfirmation ? (

          <>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              {action} Concession Request
            </h2>
            <div className="mb-4 text-gray-700">
              <p>
                <strong>Name:</strong> {data.lastName} {data.firstName} {data.middleName}
              </p>
            </div>
            <div className="mb-4 text-gray-700">
              <p>
                <strong>From:</strong> {data.from}
              </p>
            </div>
            <div className="mb-4 text-gray-700">
              <p>
                <strong>Duration:</strong> {data.duration}
              </p>
            </div>
            {action === "Approve" && (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  <strong>Certificate Number:</strong>
                </label>
                <input
                  type="text"
                  placeholder="Enter Certificate Number..."
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="text-red-500 mt-2 text-sm">{error}</p>
                )}
              </div>
            )}
            {action === "Reject" && (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  <strong>Reason:</strong>
                </label>
                <input
                  type="text"
                  placeholder="Enter Reason..."
                  value={data.reason}
                  onChange={(e) => data.setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                className={`w-1/3 py-2 px-4 rounded-lg text-white ${action === "Approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
                onClick={() => {
                  if (action === "Approve") {
                    setShowConfirmation(true);
                  } else {
                    validateAndSubmit();
                  }
                }}
              >
                {action}
              </button>
              <button
                className="w-1/3 py-2 px-4 rounded-lg text-white bg-gray-600 hover:bg-gray-700"
                onClick={() => {
                  setError("");
                  onClose();
                }}
              >
                Go Back
              </button>
            </div>

          </>

        ) : (

          action === "Approve" && (

            <div className="text-center">
              <p className="text-lg text-gray-700 mb-6">
                Confirm Certificate number for <strong>{data.lastName} {data.firstName} {data.middleName}</strong> as{" "}
                <strong>{certificateNumber}</strong>?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  className="w-1/3 py-2 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700"
                  onClick={validateAndSubmit}
                >
                  Confirm
                </button>
                <button
                  className="w-1/3 py-2 px-4 rounded-lg text-white bg-gray-600 hover:bg-gray-700"
                  onClick={() => setShowConfirmation(false)}
                >
                  Go Back
                </button>
              </div>
            </div>

          )

        )}

      </div>
    </div>
  );
};

// PendingCard component
interface PendingCardProps {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  from: string;
  to: string;
  travelLane: string;
  travelClass: string;
  duration: string;
  lastPassIssued: string;
  branch: string;
  gradyear: string;
  address: string;
  dob: string;
  ageYears: number;
  ageMonths: number;
  phoneNum: number;
  statusMessage: string;
  idCardURL: string;
  idCardURL2: string;
  previousPassURL: string;
  onCardUpdate: (id: string) => void;
}

const PendingCard: React.FC<PendingCardProps> = ({
  id,
  firstName,
  middleName,
  lastName,
  gender,
  from,
  to,
  travelClass,
  travelLane,
  duration,
  branch,
  gradyear,
  address,
  dob,
  phoneNum,
  idCardURL,
  idCardURL2,
  previousPassURL,
  onCardUpdate,
  lastPassIssued,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"Approve" | "Reject">(
    "Approve"
  );
  const [reason, setReason] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // State for image modal
  const [imageSrc, setImageSrc] = useState(""); // State for image source
  const [loading, setLoading] = useState(false);

  const handleApprove = () => {
    setModalAction("Approve");
    setIsModalOpen(true);
  };

  const handleReject = () => {
    setModalAction("Reject");
    setIsModalOpen(true);
  };

  const handleSubmit = async (certificateNumber: string) => {
    setIsModalOpen(false);

    let statMessage = reason || "Your Form has been Rejected";
    const currentDate = new Date();

    const updatedConcessionDetailsFields = {
      certificateNumber: certificateNumber,
      status: modalAction === "Approve" ? "serviced" : "rejected",
      lastPassIssued: modalAction === "Approve" ? currentDate : null,
      statusMessage:
        modalAction === "Approve" ? "Your Form has been Approved" : statMessage,
    };

    let passCollected = null;

    if (modalAction == "Approve") {
      passCollected = {
        date: null,
        collected: "0",
      };
    }

    const updatedConcessionRequestFields = {
      status: modalAction === "Approve" ? "serviced" : "rejected",
      passNum: certificateNumber,
      statusMessage: updatedConcessionDetailsFields.statusMessage,
      notificationTime: currentDate,
      passCollected: passCollected,
    };

    try {
      setLoading(true);
      const docRef = doc(db, "ConcessionDetails", id);
      await updateDoc(docRef, updatedConcessionDetailsFields);

      const concessionRequestRef = doc(db, "ConcessionRequest", id);
      await updateDoc(concessionRequestRef, updatedConcessionRequestFields);

      // For Stats UPDATE PASS
      const concessionHistoryRef = doc(db, "ConcessionHistory", "DailyStats");
      const concessionHistorySnap = await getDoc(concessionHistoryRef);
      const currentDate = dateFormat(new Date());

      if (concessionHistorySnap.exists()) {
        const historyData = concessionHistorySnap.data();
        let statsArray = historyData.stats || [];
        const dateIndex = statsArray.findIndex(
          (entry: any) => entry.date === currentDate
        );

        if (dateIndex >= 0) {
          if (modalAction === "Approve") {
            // Initialize Approved if it doesn't exist
            if (typeof statsArray[dateIndex].approvedPass !== "number") {
              statsArray[dateIndex].approvedPass = 0;
            }
            statsArray[dateIndex].approvedPass += 1;
          } else if (modalAction === "Reject") {
            // Initialize Rejected if it doesn't exist
            if (typeof statsArray[dateIndex].rejectedPass !== "number") {
              statsArray[dateIndex].rejectedPass = 0;
            }
            statsArray[dateIndex].rejectedPass += 1;
          }
        } else {
          if (modalAction === "Approve") {
            // Initialize Approved if it doesn't exist
            statsArray.push({
              date: currentDate,
              approvedPass: 1,
            });
          } else if (modalAction === "Reject") {
            // Initialize Rejected if it doesn't exist
            statsArray.push({
              date: currentDate,
              rejectedPass: 1,
            });
          }
        }

        await updateDoc(concessionHistoryRef, { stats: statsArray });
      } else {
        if (modalAction === "Approve") {
          await setDoc(concessionHistoryRef, {
            stats: [
              {
                date: currentDate,
                approvedPass: 1,
              },
            ],
          });
        } else if (modalAction === "Reject") {
          await setDoc(concessionHistoryRef, {
            stats: [
              {
                date: currentDate,
                rejectedPass: 1,
              },
            ],
          });
        }
      }

      // Update parent component state to remove this card from the list
      onCardUpdate(id);
      // console.log("Document successfully updated");
    } catch (error) {
      console.error("Error updating concession request: ", error);
    }
    setLoading(false);
  };

  const formatDOB = (dob: string | Date) => {
    const date = new Date(dob);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    const formattedDOB = `${day}/${month}/${year}`
    const age = calAge(formattedDOB)
    return `${day}/${month}/${year} AGE: ${age.years}Y ${age.months}M`;
  };

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-10 h-10 animate-spin" />
        </div>
      )}

      <div className="p-[0.8%] flex rounded-xl border-[2px] border-[#bfc3c7] w-[95vw] h-[90vh] temp-> ml-[20px] my-[20px]">
        <div className="w-[70%] h-full flex flex-col">
          <div className=" flex h-[20%]">
            <div className="h-full w-1/2 ">
              <InputWithLabel
                label={`Name`}
                input={`${lastName.toUpperCase()} ${firstName.toUpperCase()} ${middleName.toUpperCase()}`}
              />
            </div>
            <div className="h-full w-1/2 flex ">
              <div className="h-full w-1/2 ">
                {/* <p>Age: </p> */}
                <InputWithLabel label={`DOB`} input={formatDOB(dob)} />
              </div>
              <div className="h-full w-1/2">
                <InputWithLabel label={`Gender`} input={gender.toUpperCase()} />
              </div>
            </div>
          </div>
          <div className=" flex h-[20%]">
            <div className="h-full w-1/2 flex ">
              <div className="h-full w-1/2 ">
                <InputWithLabel label={`From`} input={from.toUpperCase()} />
              </div>
              <div className="h-full w-1/2">
                <InputWithLabel label={`To`} input={to.toUpperCase()} />
              </div>
            </div>
            <div className="h-full w-1/2 flex ">
              <div className="h-full w-1/2 ">
                <InputWithLabel label={`Class`} input={travelClass.toUpperCase()} />
              </div>
              <div className="h-full w-1/2">
                <InputWithLabel label={`Duration`} input={duration.toUpperCase()} />
              </div>
            </div>
          </div>
          <div className=" flex h-[20%]">
            <div className="h-full w-1/2 flex ">
              <div className="h-full w-1/2 ">
                <InputWithLabel label={`Branch`} input={branch.toUpperCase()} />
              </div>
              <div className="h-full w-1/2">
                <InputWithLabel
                  label={`Graduation Year`}
                  input={currentUserYear(gradyear)}
                />
              </div>
            </div>
            <div className="h-full w-1/2 flex ">
              <div className="h-full w-1/2 ">
                <InputWithLabel label={`Phone Number`} input={phoneNum} />
              </div>
              <div className="h-full w-1/2">
                <InputWithLabel label={`Travel Lane`} input={travelLane.toUpperCase()} />
              </div>
            </div>
          </div>
          <div className="h-[40%] flex">
            <div className="h-full w-1/2">
              <InputWithLabel label={`Address`} input={address.toUpperCase()} />
            </div>
            <div className="h-full w-1/2 flex flex-col">
              <div className="w-full h-1/2 flex items-center justify-center mt-4">
                <span>
                  <strong>Previous pass issue date: {lastPassIssued}</strong>
                </span>
              </div>
              <div className="w-full h-1/2 flex items-end justify-center">
                <button
                  // disabled={isButtonDisabled()}
                  className="disabled:opacity-85 disabled:cursor-not-allowed disabled:hover:bg-green-500 bg-green-500 w-4/5 h-12 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-all duration-200"
                  onClick={handleApprove}
                >
                  Approve
                </button>
              </div>
              <div className="w-full h-1/2 flex items-center justify-center">
                <button
                  // disabled={isButtonDisabled()}
                  className="disabled:opacity-85 disabled:cursor-not-allowed  disabled:hover:bg-red-500 bg-red-500 w-4/5 h-12 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-all duration-200"
                  onClick={handleReject}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[30%] h-full flex flex-col overflow-auto">
          <div className="m-2 h-[33.333%] relative">
            <Image
              unoptimized
              className="rounded-lg"
              src={idCardURL}
              alt="ID Card Front"
              width={600}
              height={400}
              style={{ objectFit: 'contain' }}
              placeholder="blur"
              loading="lazy"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              sizes="(max-width: 600px) 100vw, 33vw"
              onClick={() => {
                setImageSrc(idCardURL);
                setIsImageModalOpen(true);
              }}
            />
          </div>
          <div className="m-2 h-[33.333%] relative">
            <Image
              unoptimized
              className="rounded-lg"
              src={idCardURL2}
              alt="ID Card Back"
              width={600}
              height={400}
              style={{ objectFit: 'contain' }}
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              sizes="(max-width: 600px) 100vw, 33vw"
              loading="lazy"
              onClick={() => {
                setImageSrc(idCardURL2);
                setIsImageModalOpen(true);
              }}
                        />
          </div>
          <div className="m-2 h-[33.333%] relative">
            <Image
              unoptimized
              className="rounded-lg"
              src={previousPassURL}
              alt="Previous Pass"
              width={600}
              height={400}
              style={{ objectFit: 'contain' }}
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              sizes="(max-width: 600px) 100vw, 33vw"
              loading="lazy"
              onClick={() => {
                setImageSrc(previousPassURL);
                setIsImageModalOpen(true);
              }}            
            />
          </div>
        </div>

      </div>

      {/* Approve/Reject modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        action={modalAction}
        data={{
          firstName,
          middleName,
          lastName,
          from,
          duration,
          reason,
          setReason,
        }}
      />

      {/* Image modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageSrc={imageSrc}
      />
    </>
  );
};

export default PendingCard;