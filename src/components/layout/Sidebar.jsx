import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import api from "../../utils/api";
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
  MessageSquare,
  Truck,
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
          {item.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto mr-1.5 bg-blue-600 text-white">
              {item.badge}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className={`w-4 h-4 text-slate-400 ${!item.badge ? 'ml-auto' : ''}`} />
          ) : (
            <ChevronRight className={`w-4 h-4 text-slate-400 ${!item.badge ? 'ml-auto' : ''}`} />
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
                {sub.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto bg-blue-600 text-white">
                    {sub.badge}
                  </span>
                )}
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
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);
  const [pendingAddonRequestsCount, setPendingAddonRequestsCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [ticketsRes, subsRes, addonsRes] = await Promise.allSettled([
          api.get("/support/all-tickets"),
          api.get("/subscriptions/get-all-subscriptions?status=pending"),
          api.get("/subscriptions/addons/requests?status=pending"),
        ]);

        if (ticketsRes.status === "fulfilled" && ticketsRes.value.data?.data) {
          const openTickets = ticketsRes.value.data.data.filter(
            (t) => t.status === "OPEN" || t.status === "PENDING"
          );
          setOpenTicketsCount(openTickets.length);
        }

        if (subsRes.status === "fulfilled" && subsRes.value.data) {
          const metaTotal = subsRes.value.data.meta?.total;
          const dataLength = subsRes.value.data.data?.length;
          const count = typeof metaTotal === "number" ? metaTotal : (dataLength || 0);
          setPendingSubscriptionsCount(count);
        }

        if (addonsRes.status === "fulfilled" && addonsRes.value.data) {
          const resObj = addonsRes.value.data.data || addonsRes.value.data;
          const statsPending = resObj?.stats?.totalPending;
          const metaTotal = resObj?.meta?.total;
          const dataArr = Array.isArray(resObj?.data) ? resObj.data : (Array.isArray(resObj) ? resObj : []);
          const count =
            typeof statsPending === "number"
              ? statsPending
              : typeof metaTotal === "number"
              ? metaTotal
              : dataArr.length;
          setPendingAddonRequestsCount(count);
        }
      } catch (err) {}
    };

    fetchCounts();

    const handleNewNotification = (notification) => {
      if (!notification) return;
      const type = notification.type;
      if (type === "ADDON_REQUESTED") {
        setPendingAddonRequestsCount((prev) => prev + 1);
      } else if (type === "ADDON_APPROVED" || type === "ADDON_REJECTED") {
        setPendingAddonRequestsCount((prev) => Math.max(0, prev - 1));
      } else if (type === "SUBSCRIPTION_REQUESTED" || type === "PACKAGE_REQUESTED") {
        setPendingSubscriptionsCount((prev) => prev + 1);
      } else if (type === "SUBSCRIPTION_APPROVED" || type === "SUBSCRIPTION_REJECTED") {
        setPendingSubscriptionsCount((prev) => Math.max(0, prev - 1));
      } else if (type === "TICKET_CREATED") {
        setOpenTicketsCount((prev) => prev + 1);
      } else {
        fetchCounts();
      }
    };

    const handleNewTicket = () => {
      setOpenTicketsCount((prev) => prev + 1);
    };

    const handleNewSubscription = () => {
      setPendingSubscriptionsCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("new_ticket", handleNewTicket);
    socket.on("new_subscription", handleNewSubscription);
    socket.on("refresh_tickets", fetchCounts);
    socket.on("refresh_subscriptions", fetchCounts);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("new_ticket", handleNewTicket);
      socket.off("new_subscription", handleNewSubscription);
      socket.off("refresh_tickets", fetchCounts);
      socket.off("refresh_subscriptions", fetchCounts);
    };
  }, [socket]);

  const totalPendingBilling = pendingSubscriptionsCount + pendingAddonRequestsCount;

  const formatBadge = (count) => {
    if (!count || count <= 0) return undefined;
    return count > 99 ? "99+" : String(count);
  };

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
          badge: formatBadge(totalPendingBilling),
          subItems: [
            {
              name: "Subscriptions",
              path: "/billing",
              badge: formatBadge(pendingSubscriptionsCount),
            },
            {
              name: "Add-on Requests",
              path: "/addon-requests",
              badge: formatBadge(pendingAddonRequestsCount),
            },
          ],
        },
        {
          name: "Support",
          path: "/support",
          icon: LifeBuoy,
          badge: formatBadge(openTicketsCount),
        },
        {
          name: "Contact Inquiries",
          path: "/contact-inquiries",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Courier",
      items: [
        { name: "Sync Center", path: "/courier-sync", icon: Truck },
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
      <div className="h-16 flex flex-col justify-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img
            src="/masheco-logo.png"
            alt="MASH ECO"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-2xl font-righteous text-slate-800 tracking-tight leading-none">
            MASH ECO
          </h1>
        </div>
        <div className="pl-10 -mt-0.5">
          <span className="text-[9px] font-bold text-blue-400 tracking-[0.25em] uppercase leading-none">
            SUPER ADMIN
          </span>
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
