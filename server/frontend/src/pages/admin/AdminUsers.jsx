import { getApiUrl } from "../../utils/apiBridge";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const AdminUsers = () => {
  const { authHeaders, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(getApiUrl(`/djangoapp/admin/users`), {
          headers: { ...authHeaders() },
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        if (response.status === 200 && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setError(data.error?.message || "Unable to load users.");
        }
      } catch (fetchError) {
        console.error("Failed to load users:", fetchError);
        setError("Unable to load users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [authHeaders, logout]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading users...</div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Platform accounts grouped by role."
        actionLabel="Add New User"
        actionTo="/admin/users/create"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Username</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Assigned Dealer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm text-slate-700">{user.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.userName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.email || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{user.role}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {user.assignedDealerId ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
