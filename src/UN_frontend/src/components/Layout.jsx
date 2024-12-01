// src/components/Layout.jsx
import React from "react";
import Sidebar from "./SideBar";
import "./Layout.css"; 

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
