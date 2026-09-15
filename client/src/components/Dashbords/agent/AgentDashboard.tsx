import { useCallback, useEffect, useState } from "react";
import BASE_URL from "../../../api/api";
import { Users, Link2, Unlink, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react";

type Professional = {
  id: number;
  fullName: string;
  email: string;
  companyName?: string;
  serviceType?: string;
  city?: string;
  phone?: string;
  serviceCount: number;
  linkedAt?: string;
};

type UserRow = {
  id: number;
  fullName?: string;
  role: string;
  membership?: string;
  token?: string;
};

type PurchaseRow = {
  id?: number;
  buyerName?: string;
  buyerEmail?: string;
  item?: { title?: string };
  purchaseDate?: string;
  amount?: number;
  status?: string;
};

const authHeaders = (): HeadersInit => {
  const raw = localStorage.getItem("user");
  const token = localStorage.getItem("token") || (raw ? (JSON.parse(raw) as UserRow).token : null);
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
};

const AgentDashboard = () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? (JSON.parse(rawUser) as UserRow) : null;

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [linked, setLinked] = useState<Professional[]>([]);
  const [loadingDir, setLoadingDir] = useState(true);
  const [loadingLinked, setLoadingLinked] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [bookingsByProvider, setBookingsByProvider] = useState<Record<number, PurchaseRow[]>>({});
  const [loadingBookings, setLoadingBookings] = useState<Record<number, boolean>>({});
  const [openBookingsId, setOpenBookingsId] = useState<number | null>(null);

  const isElite = user?.role === "elite_agent";
  const tierLabel = isElite ? "Elite / Super Agent" : "Standard Agent";

  const loadProfessionals = useCallback(async () => {
    setLoadingDir(true);
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/agents/professionals`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to load directory");
      setProfessionals(Array.isArray(data) ? data : []);
    } catch (e) {
      setProfessionals([]);
      setMsg(e instanceof Error ? e.message : "Could not load professionals");
    } finally {
      setLoadingDir(false);
    }
  }, []);

  const loadLinked = useCallback(async () => {
    setLoadingLinked(true);
    try {
      const res = await fetch(`${BASE_URL}/agents/linked-professionals`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to load linked list");
      setLinked(Array.isArray(data) ? data : []);
    } catch {
      setLinked([]);
    } finally {
      setLoadingLinked(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "standard_agent" || user?.role === "elite_agent") {
      loadProfessionals();
      loadLinked();
    }
  }, [user?.role, loadProfessionals, loadLinked]);

  const linkProvider = async (providerId: number) => {
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/agents/link-provider`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.msg || "Could not link professional");
        return;
      }
      setMsg(data.linked ? "Professional linked — you can view their bookings below." : (data.msg as string));
      loadLinked();
    } catch {
      setMsg("Network error while linking");
    }
  };

  const unlinkProvider = async (providerId: number) => {
    setMsg(null);
    try {
      const res = await fetch(`${BASE_URL}/agents/link-provider/${providerId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.msg || "Could not unlink");
        return;
      }
      setBookingsByProvider((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
      if (openBookingsId === providerId) setOpenBookingsId(null);
      loadLinked();
    } catch {
      setMsg("Network error while unlinking");
    }
  };

  const toggleBookings = async (providerId: number) => {
    if (openBookingsId === providerId) {
      setOpenBookingsId(null);
      return;
    }
    setOpenBookingsId(providerId);
    if (bookingsByProvider[providerId]) return;

    setLoadingBookings((s) => ({ ...s, [providerId]: true }));
    try {
      const res = await fetch(`${BASE_URL}/purchase/provider/${providerId}/purchases`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(typeof data.msg === "string" ? data.msg : "Could not load bookings");
        setBookingsByProvider((prev) => ({ ...prev, [providerId]: [] }));
        return;
      }
      setBookingsByProvider((prev) => ({
        ...prev,
        [providerId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      setBookingsByProvider((prev) => ({ ...prev, [providerId]: [] }));
      setMsg("Could not load bookings");
    } finally {
      setLoadingBookings((s) => ({ ...s, [providerId]: false }));
    }
  };

  if (!user || (user.role !== "standard_agent" && user.role !== "elite_agent")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#e6f2ef] to-[#f5f5f5] px-4">
        <p className="text-red-600 text-lg mb-4">Access denied. Sign in as an agent.</p>
        <a href="/login" className="text-[#0f285b] underline font-medium">
          Go to login
        </a>
      </div>
    );
  }

  const linkedIds = new Set(linked.map((l) => l.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-white to-[#faf8f3]">
      <header className="border-b border-[#0f285b]/10 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0f285b] text-[#be9b49]">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f285b]">Agent dashboard</h1>
              <p className="text-sm text-gray-600">
                {user.fullName || "Agent"} ·{" "}
                <span className="font-semibold text-[#be9b49]">{tierLabel}</span>
                {user.membership ? ` · ${user.membership}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/services"
              className="px-4 py-2 text-sm font-medium text-[#0f285b] border border-[#0f285b]/20 rounded-lg hover:bg-[#0f285b]/5"
            >
              Browse services
            </a>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="px-4 py-2 text-sm font-medium bg-[#0f285b] text-[#be9b49] rounded-lg hover:opacity-90"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {msg && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">{msg}</div>
        )}

        <p className="text-gray-600 text-sm max-w-3xl">
          Link professionals you work with to see who booked their services. Standard agents can track up to 35 linked
          professionals; Elite agents have a much higher limit for larger networks.
        </p>

        <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Users className="w-5 h-5 text-[#0f285b]" />
            <h2 className="text-lg font-semibold text-[#0f285b]">Professionals offering services</h2>
          </div>
          <div className="overflow-x-auto">
            {loadingDir ? (
              <p className="p-6 text-gray-500">Loading directory…</p>
            ) : professionals.length === 0 ? (
              <p className="p-6 text-gray-500">No active service providers found yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">Name / company</th>
                    <th className="px-6 py-3 font-medium">Service focus</th>
                    <th className="px-6 py-3 font-medium">City</th>
                    <th className="px-6 py-3 font-medium">Services</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                      <td className="px-6 py-3">
                        <div className="font-medium text-[#0f285b]">{p.companyName || p.fullName}</div>
                        <div className="text-xs text-gray-500">{p.email}</div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{p.serviceType || "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{p.city || "—"}</td>
                      <td className="px-6 py-3">{p.serviceCount}</td>
                      <td className="px-6 py-3">
                        {linkedIds.has(p.id) ? (
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">Linked</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => linkProvider(p.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f285b] bg-[#be9b49]/30 hover:bg-[#be9b49]/50 px-3 py-1.5 rounded-lg"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Link to track bookings
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Users className="w-5 h-5 text-[#0f285b]" />
            <h2 className="text-lg font-semibold text-[#0f285b]">Professionals you track</h2>
          </div>
          <div className="overflow-x-auto">
            {loadingLinked ? (
              <p className="p-6 text-gray-500">Loading…</p>
            ) : linked.length === 0 ? (
              <p className="p-6 text-gray-500">
                Link professionals from the directory above to see their bookings here.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">Professional</th>
                    <th className="px-6 py-3 font-medium">Bookings</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {linked.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 align-top">
                      <td className="px-6 py-3">
                        <div className="font-medium text-[#0f285b]">{p.companyName || p.fullName}</div>
                        <div className="text-xs text-gray-500">{p.email}</div>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => toggleBookings(p.id)}
                          className="inline-flex items-center gap-1 text-[#0f285b] font-medium hover:underline"
                        >
                          {openBookingsId === p.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {openBookingsId === p.id ? "Hide" : "Show"} who booked them
                        </button>
                        {openBookingsId === p.id && (
                          <div className="mt-3 border border-gray-100 rounded-lg p-3 bg-gray-50/80">
                            {loadingBookings[p.id] ? (
                              <p className="text-gray-500 text-xs">Loading bookings…</p>
                            ) : (bookingsByProvider[p.id] || []).length === 0 ? (
                              <p className="text-gray-500 text-xs">No purchases recorded yet for this professional.</p>
                            ) : (
                              <ul className="space-y-2 max-h-64 overflow-y-auto">
                                {(bookingsByProvider[p.id] || []).map((b, i) => (
                                  <li
                                    key={b.id ?? i}
                                    className="text-xs border-b border-gray-200/80 pb-2 last:border-0"
                                  >
                                    <span className="font-semibold text-[#0f285b]">{b.buyerName || "Buyer"}</span>
                                    {b.buyerEmail ? (
                                      <span className="text-gray-600"> · {b.buyerEmail}</span>
                                    ) : null}
                                    <div className="text-gray-600 mt-0.5">
                                      {b.item?.title || "Service"} ·{" "}
                                      {b.purchaseDate
                                        ? new Date(b.purchaseDate).toLocaleString()
                                        : "—"}
                                      {typeof b.amount === "number" ? <span> · {b.amount}</span> : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => unlinkProvider(p.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          Unlink
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AgentDashboard;
