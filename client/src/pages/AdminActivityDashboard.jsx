import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  ActivitySquare,
  ShieldCheck,
  UsersRound,
  FileBadge2,
  MessagesSquare,
  RefreshCw,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

function AdminActivityDashboard() {

  const [summary, setSummary] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 10;

  const fetchDashboard = async () => {
    try {

      const [summaryRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/api/admin/activity-summary`, {
          withCredentials: true,
        }),

        axios.get(`${API}/api/admin/user-activities`, {
          withCredentials: true,
        }),
      ]);

      setSummary(summaryRes.data);
      setActivities(activitiesRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchDashboard();

    const interval = setInterval(fetchDashboard, 10000);

    return () => clearInterval(interval);

  }, []);

  // PAGINATION LOGIC FOR USERS
  const usersTotalPages = Math.ceil(
    activities.length / usersPerPage
  );

  const paginatedActivities = activities.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const cards = [
    {
      title: "Total Users",
      value: summary.totalUsers || 0,
      icon: UsersRound,
      color:
        "from-blue-600 to-cyan-500 shadow-blue-100 dark:shadow-none",
    },

    {
      title: "Policies",
      value: summary.totalPolicies || 0,
      icon: FileBadge2,
      color:
        "from-violet-600 to-indigo-500 shadow-violet-100 dark:shadow-none",
    },

    {
      title: "Active Today",
      value: summary.activeToday || 0,
      icon: ActivitySquare,
      color:
        "from-emerald-500 to-green-600 shadow-emerald-100 dark:shadow-none",
    },

    {
      title: "SMS Sent",
      value: summary.totalSMS || 0,
      icon: MessagesSquare,
      color:
        "from-orange-500 to-amber-500 shadow-orange-100 dark:shadow-none",
    },
  ];

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">

          <RefreshCw className="animate-spin" size={24} />

          <span className="text-lg font-semibold">
            Loading dashboard...
          </span>

        </div>

      </div>
    );
  }

  return (

    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 transition-colors duration-300">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

        <div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Admin Monitoring
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Monitor users, sessions, activities and policy performance.
          </p>

        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">

          <ShieldCheck className="text-emerald-500" size={18} />

          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Secure Admin Environment
          </span>

        </div>

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        {cards.map((card, index) => {

          const Icon = card.icon;

          return (

            <div
              key={index}
              className="group relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300"
            >

              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl`}
              />

              <div className="relative z-10 flex items-center justify-between">

                <div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {card.title}
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {card.value}
                  </h2>

                </div>

                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                >

                  <Icon className="text-white" size={20} />

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* MAIN TABLE */}

      <div className="bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              User Activities
            </h2>

            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Real-time monitoring of all users.
            </p>

          </div>

          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium shadow-sm"
          >

            <RefreshCw size={16} />
            Refresh

          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-slate-50 dark:bg-slate-900/50">

              <tr className="text-slate-500 dark:text-slate-400 text-sm">

                <th className="px-5 py-3 text-left font-semibold">
                  User
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Policies
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Renewals
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Followups
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  SMS
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Last Login
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Last Logout
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedActivities.map((user) => {

                const online =
                  user.last_login &&
                  (
                    !user.last_logout ||
                    new Date(user.last_login) >
                    new Date(user.last_logout)
                  );

                return (

                  <tr
                    key={user.id}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-200"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="relative shrink-0">

                          {user.profile_picture ? (

                            <img
                              src={`${API}${user.profile_picture}`}
                              alt=""
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                            />

                          ) : (

                            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">

                              <UserCircle2
                                className="text-slate-400 dark:text-slate-500"
                                size={24}
                              />

                            </div>
                          )}

                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${
                              online
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {user.name}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {user.policies_added}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {user.renewals}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {user.followups}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {user.sms_sent}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString()
                        : "Never"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {user.last_logout
                        ? new Date(user.last_logout).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          online
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >

                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            online
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {online ? "Online" : "Offline"}

                      </span>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

        {/* PAGINATION FOR USERS */}
        {activities.length > usersPerPage && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              {(currentPage - 1) * usersPerPage + 1}{" "}
              -{" "}
              {Math.min(
                currentPage * usersPerPage,
                activities.length
              )}{" "}
              of {activities.length} users
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => prev - 1)
                }
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="px-4 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {currentPage}
              </div>

              <button
                disabled={currentPage === usersTotalPages}
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default AdminActivityDashboard;