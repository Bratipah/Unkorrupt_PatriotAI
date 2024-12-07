// src/components/Sidebar.jsx
import React from "react";
import {
  FaHome,
  FaCommentDots,
  FaClipboardList,
  FaCog,
  FaQuestionCircle,
} from "react-icons/fa";
import "./Sidebar.css"; // Make sure to create and style this file
// import ReportForm from "../routes/ReportForm";
import { NavLink } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { FaBalanceScale } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import { BiLogOut } from "react-icons/bi";
import { useLogout } from "../hooks/useLogout";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from "@chakra-ui/react";

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const logout = useLogout();
  return (
    <div className="sidebar">
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i> <FaHome style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="/coursePage"
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i>{" "}
        <FaCommentDots style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="/reportForm"
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i>{" "}
        <FaClipboardList style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="/reportsPage"
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i>{" "}
        <FaBalanceScale style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="/profilePage"
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i>{" "}
        <CgProfile style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) => (isActive ? "active" : undefined)}
      >
        <i className="sidebar-icon"></i>{" "}
        <RiAdminFill style={{ color: "#FFFFFF" }} />
      </NavLink>
      <NavLink
        to="#"
        onClick={onOpen}
      >
        <i className="sidebar-icon"></i>{" "}
        <BiLogOut style={{ color: "#FFFFFF" }} />
      </NavLink>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Logout
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to log out?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => {
                logout();
                onClose();
              }} ml={3}>
                Yes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </div>
  );
};

export default Sidebar;
