import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Guards
import RequireAuth from "./components/guards/RequireAuth";
import RequireRole from "./components/guards/RequireRole";
import RoleRedirect from "./components/guards/RoleRedirect";

// Public pages
import Home from "./pages/Home";
import Reviews from "./pages/Reviews";
import LoginPanel from "./components/Login/Login";
import Register from "./components/Register/Register";
import Dealers from "./components/Dealers/Dealers";
import Dealer from "./components/Dealers/Dealer";
import PostReview from "./components/Dealers/PostReview";
import MyReviews from "./pages/customer/MyReviews";

// Dealer Admin pages
import DealerOverview from "./pages/dealer/DealerOverview";
import DealerReviews from "./pages/dealer/DealerReviews";
import DealerProfile from "./pages/dealer/DealerProfile";
import DealerInventory from "./pages/dealer/DealerInventory";
import CreateDealerAdmin from "./pages/admin/CreateDealerAdmin";
import CreateDealership from "./pages/admin/CreateDealership";
import CreateUser from "./pages/admin/CreateUser";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminDealerships from "./pages/admin/AdminDealerships";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInventory from "./pages/admin/AdminInventory";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public routes (no auth required) ─────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="home" element={<Home />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="login" element={<LoginPanel />} />
          <Route path="register" element={<Register />} />
          <Route path="dealers" element={<Dealers />} />
          <Route path="dealer/:id" element={<Dealer />} />
          <Route
            path="customer/my-reviews"
            element={
              <RequireAuth>
                <RequireRole allowed={["CUSTOMER"]}>
                  <MyReviews />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Post review: requires login as CUSTOMER or ADMIN */}
          <Route
            path="postreview/:id"
            element={
              <RequireAuth>
                <RequireRole allowed={["CUSTOMER", "ADMIN"]}>
                  <PostReview />
                </RequireRole>
              </RequireAuth>
            }
          />
        </Route>

        {/* Dealer Admin dashboard */}
        <Route
          element={
            <RequireAuth>
              <RequireRole allowed={["DEALER_ADMIN"]}>
                <DashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/dealer/dashboard" element={<DealerOverview />} />
          <Route path="/dealer/reviews" element={<DealerReviews />} />
          <Route path="/dealer/profile" element={<DealerProfile />} />
          <Route path="/dealer/inventory" element={<DealerInventory />} />
        </Route>

        {/* System Admin dashboard */}
        <Route
          element={
            <RequireAuth>
              <RequireRole allowed={["ADMIN"]}>
                <DashboardLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route path="/admin/dashboard" element={<AdminOverview />} />
          <Route
            path="/admin/create-dealer-admin"
            element={<CreateDealerAdmin />}
          />
          <Route path="/admin/dealerships/create" element={<CreateDealership />} />
          <Route path="/admin/dealerships" element={<AdminDealerships />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

