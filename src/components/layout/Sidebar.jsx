import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  LogOut,
  Activity,
  Server,
  CreditCard,
  Bell,
  Shield,
  Database,
  LifeBuoy,
  ShieldCheck,
  Key,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

const Badge = ({ children, type = "NEW" }) => (
  <span
    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${
      type === "BETA" ? "bg-blue-100 text-blue-700" : "bg-blue-600 text-white"
    }`}
  >
    {children}
  </span>
);

const SidebarItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  if (item.subItems) {
    const isActive = item.subItems.some(
      (sub) => location.pathname === sub.path,
    );

    // Auto expand if active on mount
    useEffect(() => {
      if (isActive) setIsExpanded(true);
    }, [isActive]);

    return (
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center px-3 py-2 w-full rounded-lg text-sm transition-colors group ${
            isActive
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <item.icon
            className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
          />
          <span>{item.name}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-auto text-slate-400" />
          )}
        </button>
        {isExpanded && (
          <div className="flex flex-col gap-0.5 pl-9 pr-2 py-1">
            {item.subItems.map((sub) => (
              <NavLink
                key={sub.name}
                to={sub.path}
                className={({ isActive: subActive }) =>
                  `flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    subActive
                      ? "text-blue-600 font-medium bg-blue-50/50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`
                }
              >
                <span>{sub.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-lg text-sm transition-colors group ${
          isActive
            ? "bg-blue-50 text-blue-600 font-medium"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
          />
          <span>{item.name}</span>
          {item.badge && <Badge type={item.badge}>{item.badge}</Badge>}
        </>
      )}
    </NavLink>
  );
};

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { default: api } = await import("../../utils/api");
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { default: api } = await import("../../utils/api");
        const res = await api.get("/support/all-tickets");
        const openTickets = res.data.data.filter(
          (t) => t.status === "OPEN" || t.status === "PENDING",
        );
        setOpenTicketsCount(openTickets.length);
      } catch (err) {}
    };

    fetchCount();

    const socket = io("/");
    const adminUserStr = localStorage.getItem("user");
    if (adminUserStr) {
      try {
        const user = JSON.parse(adminUserStr);
        socket.emit("join_user_room", user._id);
      } catch (err) {}
    }

    socket.on("refresh_tickets", fetchCount);

    return () => {
      if (adminUserStr) {
        try {
          const user = JSON.parse(adminUserStr);
          socket.emit("leave_user_room", user._id);
        } catch (err) {}
      }
      socket.off("refresh_tickets");
      socket.close();
    };
  }, []);

  const navGroups = [
    {
      items: [{ name: "Overview", path: "/", icon: LayoutDashboard }],
    },
    {
      title: "Tenant Management",
      items: [
        { name: "Clients (Shops)", path: "/clients", icon: Users },
        { name: "Merchants (Users)", path: "/users", icon: Users },
        {
          name: "Packages",
          icon: Package,
          subItems: [
            { name: "Manage Subscriptions", path: "/packages" },
            { name: "Manage Add-ons", path: "/addons" },
          ],
        },
        {
          name: "Billing",
          icon: CreditCard,
          subItems: [
            { name: "Subscriptions", path: "/billing" },
            { name: "Add-on Requests", path: "/addon-requests" },
          ],
        },
        {
          name: "Support",
          path: "/support",
          icon: LifeBuoy,
          badge: openTicketsCount > 0 ? String(openTicketsCount) : undefined,
        },
      ],
    },
    {
      title: "System",
      items: [
        { name: "Notifications", path: "/notifications", icon: Bell },
        { name: "Database", path: "/database", icon: Database },
        { name: "System Health", path: "/health", icon: Activity },
        { name: "Security & IPs", path: "/security", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src="/MEasy.png"
              alt="MashEasy"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {import.meta.env.VITE_PLATFORM_NAME || "Platform"}
            </h1>
            <span className="text-xs font-medium text-slate-500">
              SuperAdmin
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className={idx > 0 ? "mt-6" : ""}>
            {group.title && (
              <div className="flex items-center px-3 mb-2">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
            )}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-white space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 w-full rounded-lg text-sm transition-colors group ${
              isActive
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
              />
              <span>Global Settings</span>
            </>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors group"
        >
          <LogOut className="w-4 h-4 mr-3 text-red-500 group-hover:text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
