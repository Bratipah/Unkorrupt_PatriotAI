// src/components/Sidebar.jsx
import React from "react";
import { FaHome, FaCommentDots, FaClipboardList, FaCog,FaQuestionCircle } from "react-icons/fa";
import "./Sidebar.css"; // Make sure to create and style this file
// import ReportForm from "../routes/ReportForm";
import { NavLink } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaBalanceScale } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";

const Sidebar = () => {
  return (
    <div className="sidebar"> 
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <FaHome style={{ color: "#FFFFFF" }}  />
      </NavLink>
      <NavLink to="/coursePage" className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <FaCommentDots style={{ color: "#FFFFFF" }}/>
      </NavLink>
      <NavLink to="/reportForm" className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <FaClipboardList style={{ color: "#FFFFFF" }}/>
      </NavLink>      
      <NavLink to="/reportsPage" className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <FaBalanceScale style={{ color: "#FFFFFF" }}/>
      </NavLink>
      <NavLink to="/profilePage" className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <CgProfile style={{ color: "#FFFFFF" }}/>
      </NavLink>
      <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : undefined}>
        <i className="sidebar-icon"></i> <RiAdminFill  style={{ color: "#FFFFFF" }}/>
      </NavLink>

    </div>
  );
};

export default Sidebar;
