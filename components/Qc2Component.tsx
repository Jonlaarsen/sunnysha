import React from "react";
import ExcelViewer from "./Qc2/ExcelDisplay";

const Qc2Component = () => {
  return (
    <div className="flex pl-2  text-zinc-600 border-2 border-zinc-700 py-10 text-sm flex-col p-4 rounded-xl gap-0 bg-gray-100">
      <div className="border h-20 items-center justify-evenly flex">
        <div className="border-r flex items-center justify-center h-full w-full">
          <h1 className="text-4xl font-semibold  text-center">受入检查经历</h1>
        </div>
        <div className="border-r flex items-center justify-center h-full w-full">
          <h1 className="text-4xl font-semibold  text-center">受入检查经历</h1>
        </div>
        <div className="flex flex-col items-center justify-center border-r h-full w-30">
          <div className="h-6 border-b w-full text-center">
            <p>blabla</p>
          </div>
          <div className="h-14 w-full text-center">
            <p>blabla</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center  h-full w-30">
          <div className="h-6 border-b w-full text-center">
            <p>blabla</p>
          </div>
          <div className="h-14 w-full text-center">
            <p>blabla</p>
          </div>
        </div>
      </div>
      <ExcelViewer />
    </div>
  );
};

export default Qc2Component;
