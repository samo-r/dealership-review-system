import React from "react";
import { Navigate } from "react-router-dom";

/** @deprecated Use /admin/users/create — kept for backward-compatible bookmarks. */
const CreateDealerAdmin = () => <Navigate to="/admin/users/create" replace />;

export default CreateDealerAdmin;
