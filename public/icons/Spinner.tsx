import React from "react";
import Image from "next/image";

const Spinner: React.FC = () => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      {/* Use the next/image component to reference the GIF */}
      <Image
        src="/assets/images/loader.gif"
        alt="Loading..."
        width={100}
        height={100}
        className="spinner"
      />
    </div>
  );
};

export default Spinner;
