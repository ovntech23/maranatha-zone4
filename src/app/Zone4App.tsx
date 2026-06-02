"use client";

import React, { useState, useEffect } from "react";
import {
  addMember,
  toggleMemberStatus,
  deleteMember,
  createMeeting as actionCreateMeeting,
  updateAttendance,
  addOffering,
  addPledge,
  addExpense,
  setOpeningBalance,
  logoutUser,
  addSundaySchoolChild,
  toggleSundaySchoolChildStatus,
  deleteSundaySchoolChild,
  updateMember,
  updateSundaySchoolChild,
  updateOffering,
  deleteOffering,
  updatePledge,
  deletePledge,
  updateExpense,
  deleteExpense,
  addPledgeEvent,
  deletePledgeEvent,
  addActivityNote,
  updateActivityNote,
  deleteActivityNote,
} from "@/app/actions";


const fmt = (n: number | string) => `K ${Number(n).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: any) => {
  if (!d) return "—";
  try {
    let dateObj: Date;
    if (typeof d === "string") {
      if (d.includes("T")) {
        dateObj = new Date(d);
      } else {
        dateObj = new Date(d + "T00:00:00");
      }
    } else {
      dateObj = new Date(d);
    }
    if (isNaN(dateObj.getTime())) {
      return "—";
    }
    return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch (err) {
    return "—";
  }
};

// ─── UI Base Components ──────────────────────────────────────────────────

interface BadgeProps {
  label: string | number;
  variant?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, variant }) => (
  <span className={`badge ${variant ? `badge--${variant}` : ""}`}>{label}</span>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = "", style }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

interface StatProps {
  label: string;
  value: string | number;
  variant?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, variant }) => (
  <Card className="stat">
    <div className={`stat__value ${variant ? `stat__value--${variant}` : ""}`}>{value}</div>
    <div className="stat__label">{label}</div>
  </Card>
);

interface BtnProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: string;
  size?: string;
  className?: string;
  active?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const Btn: React.FC<BtnProps> = ({ children, onClick, variant = "primary", size = "md", className = "", active, style, disabled }) => (
  <button 
    onClick={onClick} 
    className={`btn btn--${variant} btn--${size} ${active ? `btn--tab--active` : ""} ${className}`}
    style={{ ...style, ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
    disabled={disabled}
  >
    {children}
  </button>
);

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="modal__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal__content">
      <div className="modal__header">
        <h3 className="modal__title">{title}</h3>
        <button onClick={onClose} className="modal__close">&times;</button>
      </div>
      <div className="modal__body">{children}</div>
    </div>
  </div>
);

function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage === 0 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return { currentPage, setCurrentPage, totalPages, paginatedItems };
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <Btn variant="ghost" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Btn>
      <span className="pagination__info">Page {currentPage} of {totalPages}</span>
      <Btn variant="ghost" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Btn>
    </div>
  );
};

interface DashboardProps {
  members: any[];
  meetings: any[];
  attendance: any[];
  offerings: any[];
  pledges: any[];
  expenses: any[];
  openingBalances: any[];
  sundaySchoolChildren: any[];
}

// ─── Dashboard Page ──────────────────────────────────────────────────────
function Dashboard({ members, meetings, attendance, offerings, pledges, expenses, openingBalances, sundaySchoolChildren }: DashboardProps) {
  const activeMembers = members.filter(m => m.status === "Active");
  const getOpeningBalance = (c: string) => openingBalances.find(o => o.cell === c)?.amount || 0;
  const totalOpening = getOpeningBalance("A") + getOpeningBalance("B") + getOpeningBalance("Zone");

  const totalCurrentOffering = offerings.reduce((s, o) => s + o.amount, 0);
  const totalOffering = totalOpening + totalCurrentOffering;
  const totalPledgePaid = pledges.reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalOffering + totalPledgePaid - totalExpenses;

  const avgAtt = (cell) => {
    const cm = meetings.filter(m => m.cell === cell);
    if (!cm.length) return 0;
    const total = cm.reduce((s, m) => s + attendance.filter(a => a.meetingId === m.id && a.status === "Present").length, 0);
    return Math.round(total / cm.length);
  };

  const recentMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const dashboardEventPledges = Object.values(
    pledges.reduce((acc, p) => {
      const event = p.eventName || "General Pledges";
      if (!acc[event]) {
        acc[event] = { name: event, pledged: 0, paid: 0 };
      }
      acc[event].pledged += p.pledgeAmount;
      acc[event].paid += p.paidAmount;
      return acc;
    }, {} as Record<string, { name: string; pledged: number; paid: number }>)
  ) as any[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="dashboard__title">Zone 4 Dashboard</h2>
        <div className="dashboard__subtitle">Maranatha Bible Church · Deacon overview</div>
      </div>

      <div className="dashboard__stats">
        <Stat label="Active members" value={activeMembers.length} />
        <Stat label="Cell A" value={activeMembers.filter(m => m.cell === "A").length} variant="purple" />
        <Stat label="Cell B" value={activeMembers.filter(m => m.cell === "B").length} variant="green" />
        <Stat label="Meetings held" value={meetings.length} variant="gold" />
      </div>

      <div className="dashboard__stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Stat label="Active children" value={sundaySchoolChildren.filter(c => c.status === "Active").length} variant="gold" />
        <Stat label="Children Cell A" value={sundaySchoolChildren.filter(c => c.cell === "A" && c.status === "Active").length} variant="purple" />
        <Stat label="Children Cell B" value={sundaySchoolChildren.filter(c => c.cell === "B" && c.status === "Active").length} variant="green" />
      </div>

      <div className="dashboard__stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Stat label="Total offerings" value={fmt(totalOffering)} variant="green" />
        <Stat label="Pledge receipts" value={fmt(totalPledgePaid)} variant="gold" />
        <Stat label="Expenses" value={fmt(totalExpenses)} variant="coral" />
        <Stat label="Net balance" value={fmt(balance)} variant={balance >= 0 ? "green" : "coral"} />
      </div>

      <div className="dashboard__cards">
        <Card className="dashboard__card--attendance">
          <div className="dashboard__section-title">Avg attendance / meeting</div>
          {["A", "B"].map(c => {
            const total = activeMembers.filter(m => m.cell === c).length;
            const avg = avgAtt(c);
            const pct = total ? Math.round((avg / total) * 100) : 0;
            return (
              <div key={c} style={{ marginBottom: 14 }}>
                <div className="flex justify-between" style={{ marginBottom: 6 }}>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Cell {c}</span>
                  <span className="text-sm font-bold" style={{ color: c === "A" ? "var(--purple)" : "var(--green)" }}>{avg} / {total}</span>
                </div>
                <div className="progress">
                  <div className={`progress__bar progress__bar--${c === "A" ? "purple" : "green"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card className="dashboard__card--meetings">
          <div className="dashboard__section-title">Recent meetings</div>
          {recentMeetings.map(m => {
            const off = offerings.find(o => o.meetingId === m.id);
            const present = attendance.filter(a => a.meetingId === m.id && a.status === "Present").length;
            const isZone = m.cell === "Zone";
            const total = isZone
              ? members.filter(mb => mb.status === "Active").length
              : members.filter(mb => mb.cell === m.cell && mb.status === "Active").length;
            
            return (
              <div key={m.id} className="dashboard__meeting-item">
                <div>
                  <Badge label={isZone ? "Zone Meeting" : `Cell ${m.cell}`} variant={isZone ? "accent" : (m.cell === "A" ? "purple" : "green")} />
                  <span className="dashboard__meeting-meta">{fmtDate(m.date)} · {m.type}</span>
                </div>
                <div className="dashboard__meeting-badges">
                  <Badge label={`${present}/${total}`} />
                  {off && <Badge label={fmt(off.amount)} variant="gold" />}
                </div>
              </div>
            );
          })}
        </Card>

        <Card style={{ flex: "1 1 250px" }}>
          <div className="dashboard__section-title">Event Pledge Receipts</div>
          {dashboardEventPledges.length === 0 && (
            <div className="text-sm finance__empty" style={{ padding: "1rem" }}>
              No event pledges recorded yet.
            </div>
          )}
          {dashboardEventPledges.map(ep => {
            const pct = ep.pledged ? Math.min(Math.round((ep.paid / ep.pledged) * 100), 100) : 0;
            return (
              <div key={ep.name} style={{ marginBottom: 14 }}>
                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{ep.name}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                    {fmt(ep.paid)} / {fmt(ep.pledged)}
                  </span>
                </div>
                <div className="progress" style={{ marginBottom: 2 }}>
                  <div className="progress__bar" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                </div>
                <div className="text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                  {pct}% Fulfilled
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

interface MembersProps {
  members: any[];
  setMembers: React.Dispatch<React.SetStateAction<any[]>>;
}

// ─── Members Page ────────────────────────────────────────────────────────
function Members({ members, setMembers }: MembersProps) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [form, setForm] = useState({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const q = search.toLowerCase().trim();
  const filtered = members.filter(m => {
    if (filter !== "All" && m.cell !== filter) return false;
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (roleFilter !== "All" && m.role !== roleFilter) return false;
    if (genderFilter !== "All" && m.gender !== genderFilter) return false;
    if (q && !(m.name?.toLowerCase().includes(q) || m.phone?.toLowerCase().includes(q))) return false;
    return true;
  });
  const hasFilters = filter !== "All" || statusFilter !== "All" || roleFilter !== "All" || genderFilter !== "All" || search !== "";
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filtered, 20);
  const clearFilters = () => { setFilter("All"); setStatusFilter("All"); setRoleFilter("All"); setGenderFilter("All"); setSearch(""); setCurrentPage(1); };
  const roleVariant = { Member: "", Elder: "gold", Deacon: "green", "Zone Deacon": "green", Treasurer: "gold", Secretary: "purple", "Youth Leader": "accent", "Cell Leader": "green", "Women's Chairlady": "purple", "Zone Pastor": "accent" };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editingMemberId) {
      const updated = await updateMember(editingMemberId, form);
      setMembers(p => p.map(x => x.id === editingMemberId ? updated : x));
      setEditingMemberId(null);
    } else {
      const created = await addMember(form);
      setMembers(p => [...p, created]);
    }
    setForm({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" });
    setShowModal(false);
  };

  return (
    <div>
      <div className="members__header">
        <h2 className="members__title">Members</h2>
        <Btn size="sm" onClick={() => setShowModal(true)}>+ Add member</Btn>
      </div>

      <div className="search-toolbar">
        <div className="search-toolbar__input-wrap">
          <span className="search-toolbar__icon">🔍</span>
          <input className="search-toolbar__input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." />
        </div>
        <select className="search-toolbar__filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All Cells</option>
          <option value="A">Cell A</option>
          <option value="B">Cell B</option>
        </select>
        <select className="search-toolbar__filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select className="search-toolbar__filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          {["Member", "Elder", "Deacon", "Zone Deacon", "Treasurer", "Secretary", "Youth Leader", "Cell Leader", "Women's Chairlady", "Zone Pastor"].map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="search-toolbar__filter" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {hasFilters && <button className="search-toolbar__clear" onClick={clearFilters}>✕ Clear</button>}
        <span className="search-toolbar__results">{filtered.length} of {members.length}</span>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Cell</th><th>Role</th><th>Phone</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {paginatedItems.map(m => (
                <tr key={m.id}>
                  <td><span className="font-bold">{m.name}</span></td>
                  <td><Badge label={`Cell ${m.cell}`} variant={m.cell === "A" ? "purple" : "green"} /></td>
                  <td><Badge label={m.role} variant={roleVariant[m.role]} /></td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.phone || "—"}</span></td>
                  <td><Badge label={m.status} variant={m.status === "Active" ? "green" : "muted"} /></td>
                  <td className="text-right">
                    <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                      <Btn 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setForm({ name: m.name, cell: m.cell, role: m.role, phone: m.phone || "", status: m.status, gender: m.gender || "Female" });
                          setEditingMemberId(m.id);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </Btn>
                      <Btn 
                        variant="ghost" 
                        size="sm" 
                        onClick={async () => {
                          const updated = await toggleMemberStatus(m.id, m.status);
                          setMembers(p => p.map(x => x.id === m.id ? updated : x));
                        }}
                      >
                        {m.status === "Active" ? "Deactivate" : "Activate"}
                      </Btn>
                      <Btn 
                        variant="danger" 
                        size="sm" 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete ${m.name}? This will permanently remove their records, including attendance and pledges.`)) {
                            await deleteMember(m.id);
                            setMembers(p => p.filter(x => x.id !== m.id));
                          }
                        }}
                      >
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {showModal && (
        <Modal title={editingMemberId ? "Edit member" : "Add new member"} onClose={() => { setShowModal(false); setEditingMemberId(null); setForm({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" }); }}>
          <div>
            <div className="field-label">Full name</div>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grace Mwansa" />
          </div>
          <div>
            <div className="field-label">Phone number</div>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 097-000-0000" />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Cell</div>
              <select className="select" value={form.cell} onChange={e => setForm({ ...form, cell: e.target.value })}>
                <option value="A">Zone 4 Cell A</option>
                <option value="B">Zone 4 Cell B</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Gender</div>
              <select className="select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>
          <div>
            <div className="field-label">Role</div>
            <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option>Member</option>
              <option>Elder</option>
              <option>Deacon</option>
              <option>Zone Deacon</option>
              <option>Treasurer</option>
              <option>Secretary</option>
              <option>Youth Leader</option>
              <option>Cell Leader</option>
              <option>Women's Chairlady</option>
              <option>Zone Pastor</option>
            </select>
          </div>
          {editingMemberId && (
            <div>
              <div className="field-label">Status</div>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex gap-2" style={{ marginTop: 4 }}>
            <Btn style={{ flex: 1 }} onClick={save}>{editingMemberId ? "Update member" : "Save member"}</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingMemberId(null); setForm({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" }); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sunday School Page ──────────────────────────────────────────────────
interface SundaySchoolProps {
  sundaySchoolChildren: any[];
  setSundaySchoolChildren: React.Dispatch<React.SetStateAction<any[]>>;
}

function SundaySchool({ sundaySchoolChildren, setSundaySchoolChildren }: SundaySchoolProps) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [form, setForm] = useState({
    name: "",
    cell: "A",
    gender: "Female",
    age: "",
    parentName: "",
    parentPhone: "",
    status: "Active",
  });
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const q = search.toLowerCase().trim();
  const filtered = sundaySchoolChildren.filter(c => {
    if (filter !== "All" && c.cell !== filter) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    if (genderFilter !== "All" && c.gender !== genderFilter) return false;
    if (q && !(c.name?.toLowerCase().includes(q) || c.parentName?.toLowerCase().includes(q))) return false;
    return true;
  });
  const hasFilters = filter !== "All" || statusFilter !== "All" || genderFilter !== "All" || search !== "";
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filtered, 20);
  const clearFilters = () => { setFilter("All"); setStatusFilter("All"); setGenderFilter("All"); setSearch(""); setCurrentPage(1); };

  const save = async () => {
    if (!form.name.trim()) return;
    const childAge = form.age ? parseInt(form.age) : null;
    if (editingChildId) {
      const updated = await updateSundaySchoolChild(editingChildId, {
        ...form,
        age: childAge !== null ? childAge : undefined,
      });
      setSundaySchoolChildren(p => p.map(x => x.id === editingChildId ? updated : x));
      setEditingChildId(null);
    } else {
      const created = await addSundaySchoolChild({
        ...form,
        age: childAge !== null ? childAge : undefined,
      });
      setSundaySchoolChildren(p => [...p, created]);
    }
    setForm({
      name: "",
      cell: "A",
      gender: "Female",
      age: "",
      parentName: "",
      parentPhone: "",
      status: "Active",
    });
    setShowModal(false);
  };

  return (
    <div>
      <div className="members__header">
        <h2 className="members__title">Sunday School Children</h2>
        <Btn size="sm" onClick={() => setShowModal(true)}>+ Add child</Btn>
      </div>

      <div className="search-toolbar">
        <div className="search-toolbar__input-wrap">
          <span className="search-toolbar__icon">🔍</span>
          <input className="search-toolbar__input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by child or parent name..." />
        </div>
        <select className="search-toolbar__filter" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All Cells</option>
          <option value="A">Cell A</option>
          <option value="B">Cell B</option>
        </select>
        <select className="search-toolbar__filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select className="search-toolbar__filter" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {hasFilters && <button className="search-toolbar__clear" onClick={clearFilters}>✕ Clear</button>}
        <span className="search-toolbar__results">{filtered.length} of {sundaySchoolChildren.length}</span>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Cell</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Parent/Guardian</th>
                <th>Contact</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6" style={{ color: "var(--text-secondary)", padding: "2rem" }}>
                    No Sunday School children found in this selection.
                  </td>
                </tr>
              )}
              {paginatedItems.map(c => (
                <tr key={c.id}>
                  <td><span className="font-bold">{c.name}</span></td>
                  <td><Badge label={`Cell ${c.cell}`} variant={c.cell === "A" ? "purple" : "green"} /></td>
                  <td><Badge label={c.gender} variant={c.gender === "Female" ? "purple" : ""} /></td>
                  <td><span className="mono font-bold">{c.age || "—"}</span></td>
                  <td>{c.parentName || "—"}</td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.parentPhone || "—"}</span></td>
                  <td><Badge label={c.status} variant={c.status === "Active" ? "green" : "muted"} /></td>
                  <td className="text-right">
                    <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm({ name: c.name, cell: c.cell, gender: c.gender, age: c.age ? String(c.age) : "", parentName: c.parentName || "", parentPhone: c.parentPhone || "", status: c.status });
                          setEditingChildId(c.id);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </Btn>
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const updated = await toggleSundaySchoolChildStatus(c.id, c.status);
                          setSundaySchoolChildren(p => p.map(x => x.id === c.id ? updated : x));
                        }}
                      >
                        {c.status === "Active" ? "Deactivate" : "Activate"}
                      </Btn>
                      <Btn
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete ${c.name}? This will permanently remove their record.`)) {
                            await deleteSundaySchoolChild(c.id);
                            setSundaySchoolChildren(p => p.filter(x => x.id !== c.id));
                          }
                        }}
                      >
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {showModal && (
        <Modal title={editingChildId ? "Edit child" : "Add new child"} onClose={() => { setShowModal(false); setEditingChildId(null); setForm({ name: "", cell: "A", gender: "Female", age: "", parentName: "", parentPhone: "", status: "Active" }); }}>
          <div>
            <div className="field-label">Full name</div>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chipo Banda" />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Cell</div>
              <select className="select" value={form.cell} onChange={e => setForm({ ...form, cell: e.target.value })}>
                <option value="A">Zone 4 Cell A</option>
                <option value="B">Zone 4 Cell B</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Gender</div>
              <select className="select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Age</div>
              <input className="input" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="e.g. 8" min="0" max="18" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Parent/Guardian Name</div>
              <input className="input" value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Joseph Banda" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Parent/Guardian Phone</div>
              <input className="input" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} placeholder="e.g. 097-000-0000" />
            </div>
          </div>
          {editingChildId && (
            <div>
              <div className="field-label">Status</div>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <Btn style={{ flex: 1 }} onClick={save}>{editingChildId ? "Update child" : "Save child"}</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingChildId(null); setForm({ name: "", cell: "A", gender: "Female", age: "", parentName: "", parentPhone: "", status: "Active" }); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Attendance Page ─────────────────────────────────────────────────────
interface AttendanceProps {
  members: any[];
  meetings: any[];
  setMeetings: React.Dispatch<React.SetStateAction<any[]>>;
  attendance: any[];
  setAttendance: React.Dispatch<React.SetStateAction<any[]>>;
}

const Attendance: React.FC<AttendanceProps> = ({ members, meetings, setMeetings, attendance, setAttendance }) => {
  const [activeMeeting, setActiveMeeting] = useState<string | null>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [cellFilter, setCellFilter] = useState("A");
  const [form, setForm] = useState({ cell: "A", date: new Date().toISOString().slice(0, 10), type: "Weekly", notes: "" });
  const [visitorName, setVisitorName] = useState("");
  const [visitors, setVisitors] = useState<Record<string, string[]>>({});

  const filteredMeetings = meetings
    .filter(m => cellFilter === "Zone" ? m.cell === "Zone" : m.cell === cellFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const createMeeting = async () => {
    const cellMembers = form.type === "Ladies' Meeting"
      ? members.filter(m => m.status === "Active" && m.gender === "Female")
      : (form.cell === "Zone"
        ? members.filter(m => m.status === "Active")
        : members.filter(m => m.cell === form.cell && m.status === "Active"));

    const created = await actionCreateMeeting(form, cellMembers.map(m => m.id));
    
    // Format meeting date correctly for standard JS UI string comparison
    const dateStr = created.date instanceof Date
      ? created.date.toISOString().slice(0, 10)
      : typeof (created.date as any) === "string" ? (created.date as any).slice(0, 10) : "";

    const formattedMeeting = {
      ...created,
      date: dateStr,
    };
    
    setMeetings(p => [...p, formattedMeeting]);

    const initialAtts = cellMembers.map(m => ({
      meetingId: created.id,
      memberId: m.id,
      status: "Present",
    }));
    setAttendance(p => [...p, ...initialAtts]);
    
    setActiveMeeting(created.id);
    setShowNewMeeting(false);
  };

  const getAtt = (meetingId: string, memberId: string) => attendance.find(a => a.meetingId === meetingId && a.memberId === memberId)?.status || "Absent";

  const cycleStatus = async (meetingId: string, memberId: string) => {
    const cycle: Record<string, string> = { Present: "Absent", Absent: "Excused", Excused: "Present" };
    const current = getAtt(meetingId, memberId);
    const nextStatus = cycle[current];

    const updated = await updateAttendance(meetingId, memberId, nextStatus);

    setAttendance(p => {
      const ex = p.find(a => a.meetingId === meetingId && a.memberId === memberId);
      if (ex) return p.map(a => a.meetingId === meetingId && a.memberId === memberId ? updated : a);
      return [...p, updated];
    });
  };

  const meeting = activeMeeting ? meetings.find(m => m.id === activeMeeting) : null;
  const isZone = meeting?.cell === "Zone";

  const mMembers = meeting 
    ? (meeting.type === "Ladies' Meeting" 
        ? members.filter(m => m.gender === "Female" && m.status === "Active")
        : (isZone ? members.filter(m => m.status === "Active") : members.filter(m => m.cell === meeting.cell && m.status === "Active")))
    : [];

  const mMembersA = mMembers.filter(m => m.cell === "A");
  const mMembersB = mMembers.filter(m => m.cell === "B");
  const meetingMembers = mMembers;

  const stats = meeting ? {
    present: attendance.filter(a => a.meetingId === meeting.id && a.status === "Present").length,
    absent: attendance.filter(a => a.meetingId === meeting.id && a.status === "Absent").length,
    excused: attendance.filter(a => a.meetingId === meeting.id && a.status === "Excused").length,
  } : { present: 0, absent: 0, excused: 0 };

  const meetingVisitors = activeMeeting ? (visitors[activeMeeting] || []) : [];

  const MemberRow = ({ m }: { m: any }) => {
    const st = meeting ? getAtt(meeting.id, m.id) : "Absent";
    const stClass = st === "Absent" ? "attendance-row__status--absent" : st === "Excused" ? "attendance-row__status--excused" : "";
    return (
      <div className="attendance-row">
        <div className="flex items-center">
          <span className="attendance-row__name">{m.name}</span>
          <span className="attendance-row__role">{m.role}</span>
          {isZone && <Badge label={`Cell ${m.cell}`} variant={m.cell === "A" ? "purple" : "green"} />}
        </div>
        <button onClick={() => meeting && cycleStatus(meeting.id, m.id)} className={`attendance-row__status ${stClass}`}>
          {st}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="attendance__header">
        <h2 className="attendance__title">Attendance</h2>
        <div className="flex gap-2">
          {["A", "B", "Zone"].map(c => (
            <Btn key={c} variant={cellFilter === c ? "primary" : "ghost"} size="sm" onClick={() => { setCellFilter(c); setActiveMeeting(null); }}>
              {c === "Zone" ? "Zone Meetings" : `Cell ${c}`}
            </Btn>
          ))}
          <Btn size="sm" onClick={() => setShowNewMeeting(true)}>+ New meeting</Btn>
        </div>
      </div>

      <div className="attendance__layout">
        <Card className="attendance__sidebar">
          <div className="attendance__sidebar-title">
            {cellFilter === "Zone" ? "Zone meetings" : `Cell ${cellFilter} meetings`}
          </div>
          {filteredMeetings.length === 0 && <div className="text-sm finance__empty">No meetings yet</div>}
          {filteredMeetings.map(m => (
            <div 
              key={m.id} 
              onClick={() => setActiveMeeting(m.id)} 
              className={`attendance__meeting-item ${activeMeeting === m.id ? "attendance__meeting-item--active" : ""}`}
            >
              <div className="attendance__meeting-date">{fmtDate(m.date)}</div>
              <div className="attendance__meeting-type">{m.type}</div>
            </div>
          ))}
        </Card>

        <div className="attendance__register">
          {meeting ? (
            <Card>
              <div className="attendance__register-header">
                <div>
                  <div className="flex items-center">
                    <span className="attendance__register-title">
                      {isZone ? "Zone 4 Combined Meeting" : `Cell ${meeting.cell}`} · {fmtDate(meeting.date)}
                    </span>
                    {isZone && <span className="attendance__zone-badge">Both cells</span>}
                  </div>
                  <div className="attendance__register-subtitle">Tap status to cycle: Present → Absent → Excused</div>
                </div>
                <div className="attendance__stats">
                  <Badge label={`${stats.present} present`} variant="green" />
                  <Badge label={`${stats.absent} absent`} variant="coral" />
                  <Badge label={`${stats.excused} excused`} variant="gold" />
                </div>
              </div>

              {isZone ? (
                <div className="flex flex-col gap-4">
                  {[{ label: "Cell A", members: mMembersA, variant: "a" }, { label: "Cell B", members: mMembersB, variant: "b" }].map(group => (
                    <div key={group.label}>
                      <div className={`attendance__group-title attendance__group-title--${group.variant}`}>
                        {group.label}
                      </div>
                      <div className="flex flex-col">
                        {group.members.map(m => <MemberRow key={m.id} m={m} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col">
                  {meetingMembers.map(m => <MemberRow key={m.id} m={m} />)}
                </div>
              )}

              <div className="attendance__visitors">
                <div className="attendance__visitors-title">Visitors</div>
                <div className="attendance__visitor-input">
                  <input 
                    className="input" 
                    value={visitorName} 
                    onChange={e => setVisitorName(e.target.value)} 
                    placeholder="Visitor name, press Enter" 
                    onKeyDown={e => {
                      if (e.key === "Enter" && visitorName.trim()) {
                        setVisitors(v => ({ ...v, [activeMeeting!]: [...(v[activeMeeting!] || []), visitorName.trim()] }));
                        setVisitorName("");
                      }
                    }}
                  />
                  <Btn size="sm" onClick={() => {
                    if (visitorName.trim()) {
                      setVisitors(v => ({ ...v, [activeMeeting!]: [...(v[activeMeeting!] || []), visitorName.trim()] }));
                      setVisitorName("");
                    }
                  }}>Add</Btn>
                </div>
                <ul className="attendance__visitor-list">
                  {meetingVisitors.map((v, i) => <li key={i} className="attendance__visitor-item">· {v}</li>)}
                </ul>
                {meetingVisitors.length === 0 && <div className="attendance__visitor-empty">No visitors recorded</div>}
              </div>
            </Card>
          ) : (
            <Card className="attendance__empty-state">
              <div>
                <div className="attendance__empty-icon">📋</div>
                <div className="text-sm">Select a meeting to take register</div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showNewMeeting && (
        <Modal title="New meeting" onClose={() => setShowNewMeeting(false)}>
          <div>
            <div className="field-label">Meeting scope</div>
            <select className="select" value={form.cell} onChange={e => setForm({ ...form, cell: e.target.value, type: e.target.value === "Zone" ? "Zone Meeting" : "Weekly" })}>
              <option value="A">Cell A only</option>
              <option value="B">Cell B only</option>
              <option value="Zone">Zone Meeting (both cells combined)</option>
            </select>
          </div>
          <div>
            <div className="field-label">Date</div>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <div className="field-label">Meeting type</div>
            <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {form.cell === "Zone"
                ? ["Zone Meeting", "Zone Prayer", "Zone Special Event", "Zone Planning"].map(t => <option key={t}>{t}</option>)
                : ["Weekly", "Special", "Prayer", "Planning", "Ladies' Meeting"].map(t => <option key={t}>{t}</option>)
              }
            </select>
          </div>
          <div>
            <div className="field-label">Notes (optional)</div>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {form.cell === "Zone" && (
            <div className="info-box">
              All active members from Cell A and Cell B will be included in this register.
            </div>
          )}
          <div className="flex gap-2">
            <Btn style={{ flex: 1 }} onClick={createMeeting}>Create & open register</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowNewMeeting(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface FinanceProps {
  members: any[];
  meetings: any[];
  offerings: any[];
  setOfferings: React.Dispatch<React.SetStateAction<any[]>>;
  pledges: any[];
  setPledges: React.Dispatch<React.SetStateAction<any[]>>;
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  openingBalances: any[];
  setOpeningBalances: React.Dispatch<React.SetStateAction<any[]>>;
  pledgeEvents: any[];
  setPledgeEvents: React.Dispatch<React.SetStateAction<any[]>>;
}

// ─── Finance Page ────────────────────────────────────────────────────────
const Finance: React.FC<FinanceProps> = ({ members, meetings, offerings, setOfferings, pledges, setPledges, expenses, setExpenses, openingBalances, setOpeningBalances, pledgeEvents, setPledgeEvents }) => {
  const [tab, setTab] = useState("offerings");

  const [showModal, setShowModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

  const [offForm, setOffForm] = useState({ meetingId: "", amount: "", collector: "", notes: "" });
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [editingPledgeId, setEditingPledgeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [pledgeForm, setPledgeForm] = useState({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0", jointNames: "" });
  const [expForm, setExpForm] = useState({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" });
  const [openingForm, setOpeningForm] = useState({ cell: "A", amount: "" });
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ name: "", description: "" });

  // ─── Search & Filter state ────────
  const [offSearch, setOffSearch] = useState("");
  const [offCellFilter, setOffCellFilter] = useState("All");
  const [pledgeSearch, setPledgeSearch] = useState("");
  const [pledgeCellFilter, setPledgeCellFilter] = useState("All");
  const [pledgeEventFilter, setPledgeEventFilter] = useState("All");
  const [pledgeStatusFilter, setPledgeStatusFilter] = useState("All");
  const [expSearch, setExpSearch] = useState("");
  const [expCellFilter, setExpCellFilter] = useState("All");
  const [expCategoryFilter, setExpCategoryFilter] = useState("All");
  const [expDateFrom, setExpDateFrom] = useState("");
  const [expDateTo, setExpDateTo] = useState("");

  const getOpeningBalance = (c: string) => openingBalances.find(o => o.cell === c)?.amount || 0;
  const totalOpening = getOpeningBalance("A") + getOpeningBalance("B") + getOpeningBalance("Zone");

  const totalCurrentOffering = offerings.reduce((s, o) => s + o.amount, 0);
  const totalOffering = totalOpening + totalCurrentOffering;
  const totalPledgePaid = pledges.reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalOffering + totalPledgePaid - totalExpenses;

  const financeEventPledges = (Object.values(
    pledges.reduce((acc, p) => {
      const event = p.eventName || "General Pledges";
      if (!acc[event]) {
        acc[event] = { name: event, pledged: 0, paid: 0, participantIds: new Set<string>() };
      }
      acc[event].pledged += p.pledgeAmount;
      acc[event].paid += p.paidAmount;
      acc[event].participantIds.add(p.memberId);
      return acc;
    }, {} as Record<string, { name: string; pledged: number; paid: number; participantIds: Set<string> }>)
  ) as any[]).map(x => ({
    name: x.name,
    pledged: x.pledged,
    paid: x.paid,
    participants: x.participantIds.size
  }));

  const getMtgLabel = id => { const m = meetings.find(x => x.id == id); return m ? `Cell ${m.cell} · ${fmtDate(m.date)}` : "—"; };
  const getMtgCell = id => meetings.find(x => x.id == id)?.cell || "";
  const getMemberName = id => members.find(m => m.id == id)?.name || "—";

  // ─── Filtered data ────────
  const oq = offSearch.toLowerCase().trim();
  const filteredOfferings = offerings.filter(o => {
    if (offCellFilter !== "All" && getMtgCell(o.meetingId) !== offCellFilter) return false;
    if (oq && !(o.collector?.toLowerCase().includes(oq) || o.notes?.toLowerCase().includes(oq))) return false;
    return true;
  });
  const offHasFilters = offCellFilter !== "All" || offSearch !== "";
  const { currentPage: offPage, setCurrentPage: setOffPage, totalPages: offTotalPages, paginatedItems: paginatedOfferings } = usePagination(filteredOfferings, 20);
  const clearOffFilters = () => { setOffCellFilter("All"); setOffSearch(""); setOffPage(1); };

  const pq = pledgeSearch.toLowerCase().trim();
  const filteredPledges = pledges.filter(p => {
    if (pledgeCellFilter !== "All" && p.cell !== pledgeCellFilter) return false;
    if (pledgeEventFilter !== "All" && p.eventName !== pledgeEventFilter) return false;
    if (pledgeStatusFilter !== "All") {
      const pct = p.pledgeAmount ? Math.round((p.paidAmount / p.pledgeAmount) * 100) : 0;
      if (pledgeStatusFilter === "Fulfilled" && pct < 100) return false;
      if (pledgeStatusFilter === "Pending" && pct >= 100) return false;
    }
    if (pq && !(getMemberName(p.memberId).toLowerCase().includes(pq) || p.eventName?.toLowerCase().includes(pq) || p.jointNames?.toLowerCase().includes(pq))) return false;
    return true;
  });
  const pledgeHasFilters = pledgeCellFilter !== "All" || pledgeEventFilter !== "All" || pledgeStatusFilter !== "All" || pledgeSearch !== "";
  const { currentPage: pledgePage, setCurrentPage: setPledgePage, totalPages: pledgeTotalPages, paginatedItems: paginatedPledges } = usePagination(filteredPledges, 20);
  const clearPledgeFilters = () => { setPledgeCellFilter("All"); setPledgeEventFilter("All"); setPledgeStatusFilter("All"); setPledgeSearch(""); setPledgePage(1); };
  const uniqueEvents = [...new Set(pledges.map(p => p.eventName).filter(Boolean))];

  const eq = expSearch.toLowerCase().trim();
  const filteredExpenses = expenses.filter(e => {
    if (expCellFilter !== "All" && e.cell !== expCellFilter) return false;
    if (expCategoryFilter !== "All" && e.category !== expCategoryFilter) return false;
    if (expDateFrom && e.date < expDateFrom) return false;
    if (expDateTo && e.date > expDateTo) return false;
    if (eq && !(e.description?.toLowerCase().includes(eq) || e.approvedBy?.toLowerCase().includes(eq))) return false;
    return true;
  });
  const expHasFilters = expCellFilter !== "All" || expCategoryFilter !== "All" || expDateFrom !== "" || expDateTo !== "" || expSearch !== "";
  const { currentPage: expPage, setCurrentPage: setExpPage, totalPages: expTotalPages, paginatedItems: paginatedExpenses } = usePagination(filteredExpenses, 20);
  const clearExpFilters = () => { setExpCellFilter("All"); setExpCategoryFilter("All"); setExpDateFrom(""); setExpDateTo(""); setExpSearch(""); setExpPage(1); };

  const saveOffering = async () => {
    if (!offForm.meetingId || !offForm.amount) return;
    const amount = parseFloat(offForm.amount);
    if (editingOfferingId) {
      const updated = await updateOffering(editingOfferingId, { ...offForm, amount });
      setOfferings(p => p.map(x => x.id === editingOfferingId ? updated : x));
      setEditingOfferingId(null);
    } else {
      const created = await addOffering({ ...offForm, amount });
      setOfferings(p => [...p, created]);
    }
    setOffForm({ meetingId: "", amount: "", collector: "", notes: "" });
    setShowModal(false);
  };

  const savePledge = async () => {
    if (!pledgeForm.eventName || !pledgeForm.memberId || !pledgeForm.pledgeAmount) return;
    const pledgeAmount = parseFloat(pledgeForm.pledgeAmount);
    const paidAmount = parseFloat(pledgeForm.paidAmount || "0");
    if (editingPledgeId) {
      const updated = await updatePledge(editingPledgeId, { ...pledgeForm, pledgeAmount, paidAmount });
      setPledges(p => p.map(x => x.id === editingPledgeId ? updated : x));
      setEditingPledgeId(null);
    } else {
      const created = await addPledge({ ...pledgeForm, pledgeAmount, paidAmount });
      setPledges(p => [...p, created]);
    }
    setPledgeForm({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0", jointNames: "" });
    setShowModal(false);
  };

  const saveExpense = async () => {
    if (!expForm.description || !expForm.amount) return;
    const amount = parseFloat(expForm.amount);
    if (editingExpenseId) {
      const updated = await updateExpense(editingExpenseId, { ...expForm, amount });
      const formatted = {
        ...updated,
        date: updated.date instanceof Date ? updated.date.toISOString().slice(0, 10) : updated.date,
      };
      setExpenses(p => p.map(x => x.id === editingExpenseId ? formatted : x));
      setEditingExpenseId(null);
    } else {
      const created = await addExpense({ ...expForm, amount });
      const formattedExpense = {
        ...created,
        date: created.date instanceof Date ? created.date.toISOString().slice(0, 10) : created.date,
      };
      setExpenses(p => [...p, formattedExpense]);
    }
    setExpForm({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" });
    setShowModal(false);
  };

  const saveOpeningBalance = async () => {
    if (!openingForm.amount) return;
    const amount = parseFloat(openingForm.amount);
    const createdOrUpdated = await setOpeningBalance(openingForm.cell, amount);
    setOpeningBalances(p => {
      const ex = p.find(o => o.cell === openingForm.cell);
      if (ex) return p.map(o => o.cell === openingForm.cell ? createdOrUpdated : o);
      return [...p, createdOrUpdated];
    });
    setOpeningForm({ cell: "A", amount: "" });
    setShowOpeningModal(false);
  };

  const savePledgeEvent = async () => {
    if (!eventForm.name.trim()) return;
    const created = await addPledgeEvent(eventForm);
    setPledgeEvents(prev => [...prev, created]);
    setEventForm({ name: "", description: "" });
  };

  const handleDeletePledgeEvent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the event "${name}"? Existing pledges towards this event will remain, but you won't be able to select it for new pledges.`)) {
      await deletePledgeEvent(id);
      setPledgeEvents(prev => prev.filter(x => x.id !== id));
    }
  };

  return (
    <div>
      <div className="finance__header">
        <h2 className="finance__title">Finances</h2>
        <div className="flex gap-2">
          {tab === "pledges" && (
            <Btn size="sm" variant="ghost" onClick={() => setShowEventModal(true)}>
              ⚙ Manage Pledge Events
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => setShowOpeningModal(true)}>
            ⚙ Set opening offerings
          </Btn>
          <Btn size="sm" onClick={() => setShowModal(true)}>
            + Record {tab === "offerings" ? "offering" : tab === "pledges" ? "pledge" : "expense"}
          </Btn>
        </div>
      </div>

      <div className="finance__stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Stat label="Total offerings" value={fmt(totalOffering)} variant="green" />
        <Stat label="  of which: current" value={fmt(totalCurrentOffering)} variant="purple" />
        <Stat label="Pledge receipts" value={fmt(totalPledgePaid)} variant="gold" />
        <Stat label="Expenses" value={fmt(totalExpenses)} variant="coral" />
        <Stat label="Balance" value={fmt(balance)} variant={balance >= 0 ? "green" : "coral"} />
      </div>

      <div className="finance__tabs">
        {[["offerings", "Offerings"], ["pledges", "Pledges"], ["expenses", "Expenses"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`finance__tab ${tab === k ? "finance__tab--active" : ""}`}>{l}</button>
        ))}
      </div>

      {tab === "offerings" && (
        <>
        <div className="search-toolbar">
          <div className="search-toolbar__input-wrap">
            <span className="search-toolbar__icon">🔍</span>
            <input className="search-toolbar__input" value={offSearch} onChange={e => setOffSearch(e.target.value)} placeholder="Search by collector or notes..." />
          </div>
          <select className="search-toolbar__filter" value={offCellFilter} onChange={e => setOffCellFilter(e.target.value)}>
            <option value="All">All Cells</option>
            <option value="A">Cell A</option>
            <option value="B">Cell B</option>
            <option value="Zone">Zone</option>
          </select>
          {offHasFilters && <button className="search-toolbar__clear" onClick={clearOffFilters}>✕ Clear</button>}
          <span className="search-toolbar__results">{filteredOfferings.length} of {offerings.length}</span>
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Meeting / Source</th><th>Amount (ZMW)</th><th>Collector</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {/* Opening / Past Offering rows */}
                {(["A", "B", "Zone"] as const).map(cell => {
                  const amt = getOpeningBalance(cell);
                  if (!amt) return null;
                  if (offCellFilter !== "All" && offCellFilter !== cell) return null;
                  return (
                    <tr key={`opening-${cell}`} style={{ background: "var(--bg-secondary)", opacity: 0.85 }}>
                      <td>
                        <Badge label={cell === "Zone" ? "Zone" : `Cell ${cell}`} variant={cell === "Zone" ? "accent" : cell === "A" ? "purple" : "green"} />
                        <span className="text-xs" style={{ marginLeft: 8, color: "var(--text-secondary)" }}>Opening / Past Offerings</span>
                      </td>
                      <td className="mono finance__amount--positive">{fmt(amt)}</td>
                      <td><span className="text-xs" style={{ color: "var(--text-secondary)" }}>Historical</span></td>
                      <td className="finance__note">Carried forward</td>
                      <td className="text-right">
                        <Btn variant="ghost" size="sm" onClick={() => setShowOpeningModal(true)}>Edit</Btn>
                      </td>
                    </tr>
                  );
                })}
                {paginatedOfferings.map(o => (
                  <tr key={o.id}>
                    <td>{getMtgLabel(o.meetingId)}</td>
                    <td className="mono finance__amount--positive">{fmt(o.amount)}</td>
                    <td>{o.collector}</td>
                    <td className="finance__note">{o.notes || "—"}</td>
                    <td className="text-right">
                      <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                        <Btn variant="ghost" size="sm" onClick={() => { setOffForm({ meetingId: o.meetingId, amount: String(o.amount), collector: o.collector, notes: o.notes || "" }); setEditingOfferingId(o.id); setShowModal(true); }}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={async () => { if (confirm("Are you sure you want to delete this offering?")) { await deleteOffering(o.id); setOfferings(p => p.filter(x => x.id !== o.id)); } }}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={offPage} totalPages={offTotalPages} onPageChange={setOffPage} />
        </Card>
        </>
      )}

      {tab === "pledges" && (
        <>
        <div className="search-toolbar">
          <div className="search-toolbar__input-wrap">
            <span className="search-toolbar__icon">🔍</span>
            <input className="search-toolbar__input" value={pledgeSearch} onChange={e => setPledgeSearch(e.target.value)} placeholder="Search by member, event, or joint names..." />
          </div>
          <select className="search-toolbar__filter" value={pledgeCellFilter} onChange={e => setPledgeCellFilter(e.target.value)}>
            <option value="All">All Cells</option>
            <option value="A">Cell A</option>
            <option value="B">Cell B</option>
            <option value="Zone">Zone</option>
          </select>
          <select className="search-toolbar__filter" value={pledgeEventFilter} onChange={e => setPledgeEventFilter(e.target.value)}>
            <option value="All">All Events</option>
            {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
          <select className="search-toolbar__filter" value={pledgeStatusFilter} onChange={e => setPledgeStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Pending">Pending</option>
          </select>
          {pledgeHasFilters && <button className="search-toolbar__clear" onClick={clearPledgeFilters}>✕ Clear</button>}
          <span className="search-toolbar__results">{filteredPledges.length} of {pledges.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Pledge Summary by Event */}
          <div>
            <div className="dashboard__section-title" style={{ marginBottom: 10 }}>Pledge Summaries by Event</div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event Category</th>
                      <th>Participants</th>
                      <th>Total Pledged</th>
                      <th>Pledge Receipts (Paid)</th>
                      <th>Fulfillment Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeEventPledges.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 finance__empty" style={{ padding: "2rem" }}>
                          No event pledges recorded yet.
                        </td>
                      </tr>
                    )}
                    {financeEventPledges.map(ep => {
                      const pct = ep.pledged ? Math.min(Math.round((ep.paid / ep.pledged) * 100), 100) : 0;
                      return (
                        <tr key={ep.name}>
                          <td><span className="font-bold">{ep.name}</span></td>
                          <td><Badge label={`${ep.participants} active`} variant="accent" /></td>
                          <td className="mono">{fmt(ep.pledged)}</td>
                          <td className="mono finance__amount--positive">{fmt(ep.paid)}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="progress" style={{ flex: 1, minWidth: 80 }}>
                                <div className="progress__bar" style={{ width: `${pct}%`, background: "var(--gold)" }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Individual Member Pledges — filtered */}
          <div>
            <div className="dashboard__section-title" style={{ marginBottom: 10 }}>Individual Pledges by Member</div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Event</th><th>Member</th><th>Cell</th><th>Pledged</th><th>Paid</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {paginatedPledges.map(p => {
                      const pct = p.pledgeAmount ? Math.round((p.paidAmount / p.pledgeAmount) * 100) : 0;
                      return (
                        <tr key={p.id}>
                          <td><span className="font-bold">{p.eventName}</span></td>
                          <td>
                            {p.jointNames ? (
                              <div>
                                <span className="font-bold">{p.jointNames}</span>
                                <span className="text-xs block" style={{ color: "var(--text-secondary)" }}>via {getMemberName(p.memberId)}</span>
                              </div>
                            ) : getMemberName(p.memberId)}
                          </td>
                          <td><Badge label={`Cell ${p.cell}`} variant={p.cell === "A" ? "purple" : "green"} /></td>
                          <td className="mono">{fmt(p.pledgeAmount)}</td>
                          <td className="mono finance__amount--positive">{fmt(p.paidAmount)}</td>
                          <td><Badge label={pct >= 100 ? "Fulfilled" : `${pct}%`} variant={pct >= 100 ? "green" : "gold"} /></td>
                          <td className="text-right">
                            <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                              <Btn variant="ghost" size="sm" onClick={() => { setPledgeForm({ eventName: p.eventName, cell: p.cell, memberId: p.memberId, pledgeAmount: String(p.pledgeAmount), paidAmount: String(p.paidAmount), jointNames: p.jointNames || "" }); setEditingPledgeId(p.id); setShowModal(true); }}>Edit</Btn>
                              <Btn variant="danger" size="sm" onClick={async () => { if (confirm("Are you sure you want to delete this pledge?")) { await deletePledge(p.id); setPledges(prev => prev.filter(x => x.id !== p.id)); } }}>Delete</Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={pledgePage} totalPages={pledgeTotalPages} onPageChange={setPledgePage} />
            </Card>
          </div>
        </div>
        </>
      )}

      {tab === "expenses" && (
        <>
        <div className="search-toolbar">
          <div className="search-toolbar__input-wrap">
            <span className="search-toolbar__icon">🔍</span>
            <input className="search-toolbar__input" value={expSearch} onChange={e => setExpSearch(e.target.value)} placeholder="Search by description or approved by..." />
          </div>
          <select className="search-toolbar__filter" value={expCellFilter} onChange={e => setExpCellFilter(e.target.value)}>
            <option value="All">All Cells</option>
            <option value="A">Cell A</option>
            <option value="B">Cell B</option>
            <option value="Zone">Zone</option>
          </select>
          <select className="search-toolbar__filter" value={expCategoryFilter} onChange={e => setExpCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {["Hospitality", "Materials", "Transport", "Utilities", "Other"].map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="search-toolbar__date-wrap">
            <span className="search-toolbar__date-label">From</span>
            <input type="date" className="search-toolbar__date" value={expDateFrom} onChange={e => setExpDateFrom(e.target.value)} />
          </div>
          <div className="search-toolbar__date-wrap">
            <span className="search-toolbar__date-label">To</span>
            <input type="date" className="search-toolbar__date" value={expDateTo} onChange={e => setExpDateTo(e.target.value)} />
          </div>
          {expHasFilters && <button className="search-toolbar__clear" onClick={clearExpFilters}>✕ Clear</button>}
          <span className="search-toolbar__results">{filteredExpenses.length} of {expenses.length}</span>
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Cell</th><th>Category</th><th>Description</th><th>Amount</th><th>Approved by</th><th></th></tr></thead>
              <tbody>
                {paginatedExpenses.map(e => (
                  <tr key={e.id}>
                    <td><span className="finance__note text-sm">{fmtDate(e.date)}</span></td>
                    <td><Badge label={e.cell === "Zone" ? "Zone" : `Cell ${e.cell}`} variant={e.cell === "Zone" ? "accent" : (e.cell === "A" ? "purple" : "green")} /></td>
                    <td><Badge label={e.category} variant="accent" /></td>
                    <td>{e.description}</td>
                    <td className="mono finance__amount--negative">{fmt(e.amount)}</td>
                    <td><span className="finance__note text-sm">{e.approvedBy}</span></td>
                    <td className="text-right">
                      <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                        <Btn variant="ghost" size="sm" onClick={() => { setExpForm({ cell: e.cell, date: e.date, category: e.category, description: e.description, amount: String(e.amount), approvedBy: e.approvedBy }); setEditingExpenseId(e.id); setShowModal(true); }}>Edit</Btn>
                        <Btn variant="danger" size="sm" onClick={async () => { if (confirm("Are you sure you want to delete this expense?")) { await deleteExpense(e.id); setExpenses(prev => prev.filter(x => x.id !== e.id)); } }}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={expPage} totalPages={expTotalPages} onPageChange={setExpPage} />
        </Card>
        </>
      )}

      {showModal && (
        <Modal 
          title={editingOfferingId || editingPledgeId || editingExpenseId ? (editingOfferingId ? "Edit offering" : editingPledgeId ? "Edit pledge" : "Edit expense") : `Record ${tab.slice(0, -1)}`} 
          onClose={() => { 
            setShowModal(false); 
            setEditingOfferingId(null); 
            setEditingPledgeId(null); 
            setEditingExpenseId(null); 
            setOffForm({ meetingId: "", amount: "", collector: "", notes: "" }); 
            setPledgeForm({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0", jointNames: "" }); 
            setExpForm({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" }); 
          }}
        >
          {tab === "offerings" && (
            <>
              <div>
                <div className="field-label">Meeting</div>
                <select className="select" value={offForm.meetingId} onChange={e => setOffForm({ ...offForm, meetingId: e.target.value })}>
                  <option value="">— Select meeting —</option>
                  {[...meetings].sort((a, b) => b.date.localeCompare(a.date)).map(m => (
                    <option key={m.id} value={m.id}>Cell {m.cell} · {fmtDate(m.date)}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="field-label">Amount (ZMW)</div>
                <input className="input" type="number" min="0" value={offForm.amount} onChange={e => setOffForm({ ...offForm, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <div className="field-label">Collector name</div>
                <input className="input" value={offForm.collector} onChange={e => setOffForm({ ...offForm, collector: e.target.value })} />
              </div>
              <div>
                <div className="field-label">Notes (optional)</div>
                <input className="input" value={offForm.notes} onChange={e => setOffForm({ ...offForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Btn style={{ flex: 1 }} onClick={saveOffering}>{editingOfferingId ? "Update offering" : "Save offering"}</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingOfferingId(null); setOffForm({ meetingId: "", amount: "", collector: "", notes: "" }); }}>Cancel</Btn>
              </div>
            </>
          )}
          {tab === "pledges" && (
            <>
              <div>
                <div className="field-label">Event name</div>
                <input 
                  list="pledge-event-options"
                  className="input" 
                  value={pledgeForm.eventName} 
                  onChange={e => setPledgeForm({ ...pledgeForm, eventName: e.target.value })}
                  placeholder="Select or type event name..."
                />
                <datalist id="pledge-event-options">
                  {pledgeEvents.map(pe => (
                    <option key={pe.id} value={pe.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <div className="field-label">Cell</div>
                <select 
                  className="select" 
                  value={pledgeForm.cell} 
                  onChange={e => setPledgeForm({ ...pledgeForm, cell: e.target.value, memberId: "" })}
                >
                  <option value="A">Cell A</option>
                  <option value="B">Cell B</option>
                  <option value="Zone">Zone (Combined)</option>
                </select>
              </div>
              <div>
                <div className="field-label">Member</div>
                <select 
                  className="select" 
                  value={pledgeForm.memberId} 
                  onChange={e => setPledgeForm({ ...pledgeForm, memberId: e.target.value })}
                >
                  <option value="">— Select member —</option>
                  {members
                    .filter(m => (pledgeForm.cell === "Zone" ? true : m.cell === pledgeForm.cell) && m.status === "Active")
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <div className="field-label">Joint/Group Names (Optional)</div>
                <input 
                  className="input" 
                  value={pledgeForm.jointNames} 
                  onChange={e => setPledgeForm({ ...pledgeForm, jointNames: e.target.value })} 
                  placeholder="e.g. Mr. & Mrs. Banda, or Ruth & Grace" 
                />
              </div>
              <div>
                <div className="field-label">Pledge amount (ZMW)</div>
                <input className="input" type="number" min="0" value={pledgeForm.pledgeAmount} onChange={e => setPledgeForm({ ...pledgeForm, pledgeAmount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <div className="field-label">Amount already paid (ZMW)</div>
                <input className="input" type="number" min="0" value={pledgeForm.paidAmount} onChange={e => setPledgeForm({ ...pledgeForm, paidAmount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="flex gap-2">
                <Btn style={{ flex: 1 }} onClick={savePledge}>{editingPledgeId ? "Update pledge" : "Save pledge"}</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingPledgeId(null); setPledgeForm({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0", jointNames: "" }); }}>Cancel</Btn>
              </div>
            </>
          )}
          {tab === "expenses" && (
            <>
              <div>
                <div className="field-label">Cell</div>
                <select className="select" value={expForm.cell} onChange={e => setExpForm({ ...expForm, cell: e.target.value })}>
                  <option value="A">Cell A</option>
                  <option value="B">Cell B</option>
                  <option value="Zone">Zone (Combined)</option>
                </select>
              </div>
              <div>
                <div className="field-label">Date</div>
                <input className="input" type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
              </div>
              <div>
                <div className="field-label">Category</div>
                <select className="select" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                  {["Hospitality", "Materials", "Transport", "Utilities", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="field-label">Description</div>
                <input className="input" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="What was the expense for?" />
              </div>
              <div>
                <div className="field-label">Amount (ZMW)</div>
                <input className="input" type="number" min="0" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="flex gap-2">
                <Btn style={{ flex: 1 }} onClick={saveExpense}>{editingExpenseId ? "Update expense" : "Save expense"}</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingExpenseId(null); setExpForm({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" }); }}>Cancel</Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {showOpeningModal && (
        <Modal title="Set Opening Offerings" onClose={() => setShowOpeningModal(false)}>
          <div>
            <div className="field-label">Cell / Fund Scope</div>
            <select className="select" value={openingForm.cell} onChange={e => setOpeningForm({ ...openingForm, cell: e.target.value })}>
              <option value="A">Cell A</option>
              <option value="B">Cell B</option>
              <option value="Zone">Zone Fund (Combined)</option>
            </select>
          </div>
          <div>
            <div className="field-label">Opening Offerings Amount (ZMW)</div>
            <input 
              className="input" 
              type="number" 
              min="0" 
              value={openingForm.amount} 
              onChange={e => setOpeningForm({ ...openingForm, amount: e.target.value })} 
              placeholder="e.g. 5000" 
            />
          </div>
          <div className="info-box" style={{ marginTop: 12 }}>
            These are past/historical offerings recorded before this system was in use. They are added to the current offerings total automatically.
            <br /><br />
            <strong>Current opening amounts:</strong><br />
            Cell A: {fmt(getOpeningBalance("A"))}<br />
            Cell B: {fmt(getOpeningBalance("B"))}<br />
            Zone: {fmt(getOpeningBalance("Zone"))}<br />
            <strong>Total: {fmt(totalOpening)}</strong>
          </div>
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <Btn style={{ flex: 1 }} onClick={saveOpeningBalance}>Save</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowOpeningModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {showEventModal && (
        <Modal title="Manage Pledge Events" onClose={() => setShowEventModal(false)}>
          <div className="flex flex-col gap-4">
            <Card style={{ padding: "16px", background: "var(--bg-secondary)" }}>
              <div className="font-bold text-sm" style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Add New Pledge Event</div>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="field-label" style={{ fontSize: "12px", marginBottom: "4px" }}>Event Name</div>
                  <input 
                    className="input" 
                    value={eventForm.name} 
                    onChange={e => setEventForm({ ...eventForm, name: e.target.value })} 
                    placeholder="e.g. Building Expansion Fund" 
                  />
                </div>
                <div>
                  <div className="field-label" style={{ fontSize: "12px", marginBottom: "4px" }}>Description (optional)</div>
                  <input 
                    className="input" 
                    value={eventForm.description} 
                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
                    placeholder="e.g. Funding the new classroom wings" 
                  />
                </div>
                <Btn onClick={savePledgeEvent} size="sm">Create Event</Btn>
              </div>
            </Card>

            <div>
              <div className="font-bold text-sm" style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Existing Pledge Events</div>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "6px" }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Description</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pledgeEvents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4" style={{ color: "var(--text-secondary)" }}>
                          No custom events configured.
                        </td>
                      </tr>
                    ) : (
                      pledgeEvents.map(pe => (
                        <tr key={pe.id}>
                          <td><span className="font-bold">{pe.name}</span></td>
                          <td><span className="text-xs" style={{ color: "var(--text-secondary)" }}>{pe.description || "—"}</span></td>
                          <td className="text-right">
                            <Btn 
                              variant="danger" 
                              size="xs" 
                              onClick={() => handleDeletePledgeEvent(pe.id, pe.name)}
                            >
                              Delete
                            </Btn>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2" style={{ marginTop: "8px" }}>
              <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowEventModal(false)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Activities & Notes Page ─────────────────────────────────────────────
interface ActivitiesProps {
  activityNotes: any[];
  setActivityNotes: React.Dispatch<React.SetStateAction<any[]>>;
}

const ACTIVITY_CATEGORIES = [
  "Visitation",
  "Outreach",
  "Cell Prayer Meeting",
  "Planning Session",
  "Special Event",
  "General Notes",
];

const ACTIVITY_CELL_OPTIONS = ["A", "B", "Zone", "General"];

const categoryVariant: Record<string, string> = {
  "Visitation": "green",
  "Outreach": "accent",
  "Cell Prayer Meeting": "purple",
  "Planning Session": "gold",
  "Special Event": "coral",
  "General Notes": "muted",
};

const Activities: React.FC<ActivitiesProps> = ({ activityNotes, setActivityNotes }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cellFilter, setCellFilter] = useState("All");
  const [form, setForm] = useState({
    title: "",
    category: "General Notes",
    cell: "General",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    recordedBy: "",
  });

  const q = search.toLowerCase().trim();
  const filtered = activityNotes.filter((n) => {
    if (categoryFilter !== "All" && n.category !== categoryFilter) return false;
    if (cellFilter !== "All" && n.cell !== cellFilter) return false;
    if (q && !(n.title?.toLowerCase().includes(q) || n.notes?.toLowerCase().includes(q) || n.recordedBy?.toLowerCase().includes(q))) return false;
    return true;
  });
  const hasFilters = categoryFilter !== "All" || cellFilter !== "All" || search !== "";
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filtered, 15);
  const clearFilters = () => { setCategoryFilter("All"); setCellFilter("All"); setSearch(""); setCurrentPage(1); };

  const resetForm = () => setForm({ title: "", category: "General Notes", cell: "General", date: new Date().toISOString().slice(0, 10), notes: "", recordedBy: "" });

  const openAdd = () => { resetForm(); setEditingId(null); setShowModal(true); };
  const openEdit = (n: any) => {
    setForm({ title: n.title, category: n.category, cell: n.cell, date: n.date, notes: n.notes, recordedBy: n.recordedBy || "" });
    setEditingId(n.id);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.notes.trim()) return;
    if (editingId) {
      const updated = await updateActivityNote(editingId, form);
      const formatted = { ...updated, date: updated.date instanceof Date ? updated.date.toISOString().slice(0, 10) : updated.date };
      setActivityNotes(p => p.map(x => x.id === editingId ? formatted : x));
      setEditingId(null);
    } else {
      const created = await addActivityNote(form);
      const formatted = { ...created, date: created.date instanceof Date ? created.date.toISOString().slice(0, 10) : created.date };
      setActivityNotes(p => [formatted, ...p]);
    }
    resetForm();
    setShowModal(false);
  };

  const remove = async (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      await deleteActivityNote(id);
      setActivityNotes(p => p.filter(x => x.id !== id));
    }
  };

  // Stats
  const totalA = activityNotes.filter(n => n.cell === "A").length;
  const totalB = activityNotes.filter(n => n.cell === "B").length;
  const totalZone = activityNotes.filter(n => n.cell === "Zone").length;
  const totalGeneral = activityNotes.filter(n => n.cell === "General").length;

  return (
    <div>
      <div className="members__header">
        <div>
          <h2 className="members__title">Activities &amp; Notes</h2>
          <div className="dashboard__subtitle">Log cell visitations, outreach, prayer sessions, and other activities</div>
        </div>
        <Btn size="sm" onClick={openAdd}>+ Record Activity</Btn>
      </div>

      {/* Stats */}
      <div className="dashboard__stats" style={{ marginBottom: 20 }}>
        <Stat label="Total recorded" value={activityNotes.length} />
        <Stat label="Cell A" value={totalA} variant="purple" />
        <Stat label="Cell B" value={totalB} variant="green" />
        <Stat label="Zone" value={totalZone} variant="gold" />
        <Stat label="General" value={totalGeneral} />
      </div>

      {/* Filters */}
      <div className="search-toolbar">
        <div className="search-toolbar__input-wrap">
          <span className="search-toolbar__icon">🔍</span>
          <input className="search-toolbar__input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, notes or recorder..." />
        </div>
        <select className="search-toolbar__filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {ACTIVITY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="search-toolbar__filter" value={cellFilter} onChange={e => setCellFilter(e.target.value)}>
          <option value="All">All Cells</option>
          <option value="A">Cell A</option>
          <option value="B">Cell B</option>
          <option value="Zone">Zone</option>
          <option value="General">General</option>
        </select>
        {hasFilters && <button className="search-toolbar__clear" onClick={clearFilters}>✕ Clear</button>}
        <span className="search-toolbar__results">{filtered.length} of {activityNotes.length}</span>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Cell</th>
                <th>Notes</th>
                <th>Recorded By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: "2rem", color: "var(--text-secondary)" }}>
                    No activities recorded yet. Click <strong>+ Record Activity</strong> to get started.
                  </td>
                </tr>
              )}
              {paginatedItems.map(n => (
                <tr key={n.id}>
                  <td><span className="finance__note text-sm">{fmtDate(n.date)}</span></td>
                  <td><span className="font-bold">{n.title}</span></td>
                  <td><Badge label={n.category} variant={categoryVariant[n.category] || ""} /></td>
                  <td>
                    {n.cell === "General"
                      ? <Badge label="General" />
                      : n.cell === "Zone"
                        ? <Badge label="Zone" variant="gold" />
                        : <Badge label={`Cell ${n.cell}`} variant={n.cell === "A" ? "purple" : "green"} />}
                  </td>
                  <td style={{ maxWidth: 280, whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {n.notes.length > 120 ? n.notes.slice(0, 120) + "…" : n.notes}
                  </td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{n.recordedBy || "—"}</span></td>
                  <td className="text-right">
                    <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(n)}>Edit</Btn>
                      <Btn variant="danger" size="sm" onClick={() => remove(n.id, n.title)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editingId ? "Edit Activity / Note" : "Record Activity / Note"}
          onClose={() => { setShowModal(false); setEditingId(null); resetForm(); }}
        >
          <div>
            <div className="field-label">Title</div>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Visitation to Mwansa household" />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Category</div>
              <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {ACTIVITY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Cell / Scope</div>
              <select className="select" value={form.cell} onChange={e => setForm({ ...form, cell: e.target.value })}>
                <option value="A">Cell A</option>
                <option value="B">Cell B</option>
                <option value="Zone">Zone (Combined)</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="field-label">Date</div>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-label">Recorded / Led By (optional)</div>
              <input className="input" value={form.recordedBy} onChange={e => setForm({ ...form, recordedBy: e.target.value })} placeholder="e.g. Deacon Banda" />
            </div>
          </div>
          <div>
            <div className="field-label">Notes / Details</div>
            <textarea
              className="input"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Describe what happened, who was involved, outcomes, prayer points, follow-up actions..."
              rows={5}
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="flex gap-2" style={{ marginTop: 4 }}>
            <Btn style={{ flex: 1 }} onClick={save}>{editingId ? "Update" : "Save Activity"}</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Reports Page ────────────────────────────────────────────────────────
interface ReportsProps {
  members: any[];
  meetings: any[];
  attendance: any[];
  offerings: any[];
  pledges: any[];
  expenses: any[];
  openingBalances: any[];
  sundaySchoolChildren: any[];
  pledgeEvents: any[];
  activityNotes: any[];
  userSession?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

const Reports: React.FC<ReportsProps> = ({
  members,
  meetings,
  attendance,
  offerings,
  pledges,
  expenses,
  openingBalances,
  sundaySchoolChildren,
  pledgeEvents,
  activityNotes,
  userSession,
}) => {
  const [cellFilter, setCellFilter] = useState("All");
  const [reportType, setReportType] = useState("Full");

  const filteredMembers = members.filter(m => cellFilter === "All" ? true : m.cell === cellFilter);
  const activeMembers = filteredMembers.filter(m => m.status === "Active");

  const filteredChildren = sundaySchoolChildren.filter(c => cellFilter === "All" ? true : c.cell === cellFilter);
  const activeChildren = filteredChildren.filter(c => c.status === "Active");

  const getOpeningBalance = (c: string) => openingBalances.find(o => o.cell === c)?.amount || 0;
  const openingSum = cellFilter === "All"
    ? (getOpeningBalance("A") + getOpeningBalance("B") + getOpeningBalance("Zone"))
    : getOpeningBalance(cellFilter);

  const filteredMeetings = meetings.filter(m => cellFilter === "All" ? true : m.cell === cellFilter);

  const getMtgCell = id => meetings.find(x => x.id == id)?.cell || "";
  const filteredOfferings = offerings.filter(o => {
    if (cellFilter === "All") return true;
    return getMtgCell(o.meetingId) === cellFilter;
  });
  const currentOfferingSum = filteredOfferings.reduce((sum, o) => sum + o.amount, 0);
  const totalOffering = openingSum + currentOfferingSum;

  const filteredPledges = pledges.filter(p => cellFilter === "All" ? true : p.cell === cellFilter);
  const totalPledged = filteredPledges.reduce((sum, p) => sum + p.pledgeAmount, 0);
  const totalPaidPledge = filteredPledges.reduce((sum, p) => sum + p.paidAmount, 0);

  const filteredExpenses = expenses.filter(e => cellFilter === "All" ? true : e.cell === cellFilter);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalOffering + totalPaidPledge - totalExpenses;

  const avgAtt = (cellVal: string) => {
    const cm = meetings.filter(m => m.cell === cellVal);
    if (!cm.length) return 0;
    const total = cm.reduce((s, m) => s + attendance.filter(a => a.meetingId === m.id && a.status === "Present").length, 0);
    return Math.round(total / cm.length);
  };

  const getAvgAttendanceForReport = () => {
    if (cellFilter === "All") {
      if (!meetings.length) return 0;
      const totalPresent = meetings.reduce((s, m) => s + attendance.filter(a => a.meetingId === m.id && a.status === "Present").length, 0);
      return Math.round(totalPresent / meetings.length);
    } else {
      return avgAtt(cellFilter);
    }
  };

  const pledgeEventStats = Object.values(
    filteredPledges.reduce((acc, p) => {
      const event = p.eventName || "General Pledges";
      if (!acc[event]) {
        acc[event] = { name: event, pledged: 0, paid: 0 };
      }
      acc[event].pledged += p.pledgeAmount;
      acc[event].paid += p.paidAmount;
      return acc;
    }, {} as Record<string, { name: string; pledged: number; paid: number }>)
  );

  const handlePrint = () => {
    window.print();
  };

  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="reports-page animate-fade-in">
      <div className="reports-page__header flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: "20px" }}>
        <div>
          <h2 className="members__title">Reports & Statements</h2>
          <div className="dashboard__subtitle">Configure, preview, and export official reports to PDF</div>
        </div>
        <Btn onClick={handlePrint} size="md" className="btn-print-action">
          🖨️ Print Full Report (PDF)
        </Btn>
      </div>

      <Card style={{ marginBottom: "20px" }} className="no-print">
        <div className="flex gap-4 flex-wrap items-center">
          <div style={{ flex: "1 1 200px" }}>
            <div className="field-label">Filter by Cell scope</div>
            <select className="select" value={cellFilter} onChange={e => setCellFilter(e.target.value)}>
              <option value="All">All Cells (Cell A, Cell B & Zone)</option>
              <option value="A">Cell A only</option>
              <option value="B">Cell B only</option>
            </select>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <div className="field-label">Report Focus</div>
            <select className="select" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="Full">Full Executive Report (Comprehensive)</option>
              <option value="Financial">Financial Statement only</option>
              <option value="Membership">Membership & Attendance Registry</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="report-print-container">
        <div className="report-sheet">
          <div className="report-header-section">
            <div className="report-church-logo">
              <span className="report-church-logo__text">MBC</span>
            </div>
            <div className="report-header-titles">
              <h1 className="report-main-title">MARANATHA BIBLE CHURCH</h1>
              <h2 className="report-sub-title">ZONE 4 · CELL MANAGEMENT SYSTEM</h2>
              <div className="report-divider"></div>
              <h3 className="report-doc-title">
                {reportType === "Full" && (cellFilter === "All" ? "EXECUTIVE ZONE REPORT" : "EXECUTIVE CELL REPORT")}
                {reportType === "Financial" && "FINANCIAL AUDIT STATEMENT"}
                {reportType === "Membership" && "MEMBERSHIP & ATTENDANCE RECORD"}
              </h3>
            </div>
          </div>

          <div className="report-meta-grid">
            <div>
              <span className="report-meta-label">Scope:</span>
              <span className="report-meta-val">
                {cellFilter === "All" ? "Zone 4 (Cell A, Cell B & Zone Fund)" : `Zone 4 - Cell ${cellFilter}`}
              </span>
            </div>
            <div>
              <span className="report-meta-label">Generated:</span>
              <span className="report-meta-val">{reportDate}</span>
            </div>
            <div>
              <span className="report-meta-label">Prepared By:</span>
              <span className="report-meta-val">{userSession ? `${userSession.name} (${userSession.role})` : "System Administrator"}</span>
            </div>
            <div>
              <span className="report-meta-label">Status:</span>
              <span className="report-meta-val report-status-active">OFFICIAL</span>
            </div>
          </div>

          {(reportType === "Full" || reportType === "Financial" || reportType === "Membership") && (
            <div className="report-section">
              <h4 className="report-section-title">1. Executive Summary & KPIs</h4>
              <div className="report-stats-grid">
                <div className="report-stat-card">
                  <span className="report-stat-label">Active Members</span>
                  <span className="report-stat-val font-bold">{activeMembers.length}</span>
                </div>
                <div className="report-stat-card">
                  <span className="report-stat-label">Sunday School</span>
                  <span className="report-stat-val font-bold">{activeChildren.length} Children</span>
                </div>
                <div className="report-stat-card">
                  <span className="report-stat-label">Meetings Held</span>
                  <span className="report-stat-val font-bold">{filteredMeetings.length}</span>
                </div>
                <div className="report-stat-card">
                  <span className="report-stat-label">Avg Attendance</span>
                  <span className="report-stat-val font-bold">{getAvgAttendanceForReport()} members</span>
                </div>
              </div>

              <div className="report-stats-grid" style={{ marginTop: "12px" }}>
                <div className="report-stat-card bg-green-light">
                  <span className="report-stat-label text-green-dark">Total Offerings (Inc. Opening)</span>
                  <span className="report-stat-val font-bold text-green-dark">{fmt(totalOffering)}</span>
                </div>
                <div className="report-stat-card bg-gold-light">
                  <span className="report-stat-label text-gold-dark">Pledges Collected</span>
                  <span className="report-stat-val font-bold text-gold-dark">{fmt(totalPaidPledge)}</span>
                </div>
                <div className="report-stat-card bg-coral-light">
                  <span className="report-stat-label text-coral-dark">Total Expenses</span>
                  <span className="report-stat-val font-bold text-coral-dark">{fmt(totalExpenses)}</span>
                </div>
                <div className="report-stat-card bg-blue-light">
                  <span className="report-stat-label text-blue-dark">Net Cash Position</span>
                  <span className="report-stat-val font-bold text-blue-dark">{fmt(netBalance)}</span>
                </div>
              </div>
            </div>
          )}

          {(reportType === "Full" || reportType === "Financial") && (
            <div className="report-section page-break">
              <h4 className="report-section-title">2. Financial Ledger & Revenue Analysis</h4>
              
              <h5 className="report-subsection-title">2.1 Fund Balances Summary</h5>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Fund Scope / Category</th>
                    <th className="text-right">Opening Carryover</th>
                    <th className="text-right">Current Offerings</th>
                    <th className="text-right">Pledges Paid</th>
                    <th className="text-right">Total Expenses</th>
                    <th className="text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cellFilter === "All" ? (
                    <>
                      <tr>
                        <td><span className="font-bold">Cell A Fund</span></td>
                        <td className="text-right">{fmt(getOpeningBalance("A"))}</td>
                        <td className="text-right">{fmt(offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "A").reduce((s,o)=>s+o.amount, 0))}</td>
                        <td className="text-right">{fmt(pledges.filter(p => p.cell === "A").reduce((s,p)=>s+p.paidAmount, 0))}</td>
                        <td className="text-right">{fmt(expenses.filter(e => e.cell === "A").reduce((s,e)=>s+e.amount, 0))}</td>
                        <td className="text-right font-bold">
                          {fmt(
                            getOpeningBalance("A") + 
                            offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "A").reduce((s,o)=>s+o.amount, 0) +
                            pledges.filter(p => p.cell === "A").reduce((s,p)=>s+p.paidAmount, 0) -
                            expenses.filter(e => e.cell === "A").reduce((s,e)=>s+e.amount, 0)
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><span className="font-bold">Cell B Fund</span></td>
                        <td className="text-right">{fmt(getOpeningBalance("B"))}</td>
                        <td className="text-right">{fmt(offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "B").reduce((s,o)=>s+o.amount, 0))}</td>
                        <td className="text-right">{fmt(pledges.filter(p => p.cell === "B").reduce((s,p)=>s+p.paidAmount, 0))}</td>
                        <td className="text-right">{fmt(expenses.filter(e => e.cell === "B").reduce((s,e)=>s+e.amount, 0))}</td>
                        <td className="text-right font-bold">
                          {fmt(
                            getOpeningBalance("B") + 
                            offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "B").reduce((s,o)=>s+o.amount, 0) +
                            pledges.filter(p => p.cell === "B").reduce((s,p)=>s+p.paidAmount, 0) -
                            expenses.filter(e => e.cell === "B").reduce((s,e)=>s+e.amount, 0)
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><span className="font-bold">Zone Combined Fund</span></td>
                        <td className="text-right">{fmt(getOpeningBalance("Zone"))}</td>
                        <td className="text-right">{fmt(offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "Zone").reduce((s,o)=>s+o.amount, 0))}</td>
                        <td className="text-right">{fmt(pledges.filter(p => p.cell === "Zone").reduce((s,p)=>s+p.paidAmount, 0))}</td>
                        <td className="text-right">{fmt(expenses.filter(e => e.cell === "Zone").reduce((s,e)=>s+e.amount, 0))}</td>
                        <td className="text-right font-bold">
                          {fmt(
                            getOpeningBalance("Zone") + 
                            offerings.filter(o => meetings.find(m => m.id === o.meetingId)?.cell === "Zone").reduce((s,o)=>s+o.amount, 0) +
                            pledges.filter(p => p.cell === "Zone").reduce((s,p)=>s+p.paidAmount, 0) -
                            expenses.filter(e => e.cell === "Zone").reduce((s,e)=>s+e.amount, 0)
                          )}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td><span className="font-bold">Cell {cellFilter} Fund</span></td>
                      <td className="text-right">{fmt(getOpeningBalance(cellFilter))}</td>
                      <td className="text-right">{fmt(currentOfferingSum)}</td>
                      <td className="text-right">{fmt(totalPaidPledge)}</td>
                      <td className="text-right">{fmt(totalExpenses)}</td>
                      <td className="text-right font-bold">{fmt(netBalance)}</td>
                    </tr>
                  )}
                  <tr className="report-table-total-row">
                    <td>Total Cash Balance</td>
                    <td className="text-right">{fmt(openingSum)}</td>
                    <td className="text-right">{fmt(currentOfferingSum)}</td>
                    <td className="text-right">{fmt(totalPaidPledge)}</td>
                    <td className="text-right">{fmt(totalExpenses)}</td>
                    <td className="text-right font-bold">{fmt(netBalance)}</td>
                  </tr>
                </tbody>
              </table>

              <h5 className="report-subsection-title" style={{ marginTop: "16px" }}>2.2 Event Pledges Breakdown</h5>
              {pledgeEventStats.length === 0 ? (
                <div className="report-empty-message">No event pledges recorded.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Event Fund Name</th>
                      <th className="text-right">Total Pledged</th>
                      <th className="text-right">Collected (Paid)</th>
                      <th className="text-right">Outstanding (Unpaid)</th>
                      <th className="text-right">Fulfillment Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pledgeEventStats.map((ep: any) => {
                      const outstanding = ep.pledged - ep.paid;
                      const pct = ep.pledged ? Math.min(Math.round((ep.paid / ep.pledged) * 100), 100) : 0;
                      return (
                        <tr key={ep.name}>
                          <td><span className="font-bold">{ep.name}</span></td>
                          <td className="text-right">{fmt(ep.pledged)}</td>
                          <td className="text-right">{fmt(ep.paid)}</td>
                          <td className="text-right font-bold text-coral-dark">{fmt(outstanding)}</td>
                          <td className="text-right font-bold">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <h5 className="report-subsection-title" style={{ marginTop: "16px" }}>2.3 Expense Ledger</h5>
              {filteredExpenses.length === 0 ? (
                <div className="report-empty-message">No expenses recorded for this cell scope.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Cell Scope</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Approved By</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(e => (
                      <tr key={e.id}>
                        <td>{fmtDate(e.date)}</td>
                        <td>{e.cell === "Zone" ? "Zone" : `Cell ${e.cell}`}</td>
                        <td>{e.category}</td>
                        <td>{e.description}</td>
                        <td>{e.approvedBy}</td>
                        <td className="text-right font-bold text-coral-dark">-{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    <tr className="report-table-total-row">
                      <td colSpan={5}>Total Operational Expenses</td>
                      <td className="text-right font-bold text-coral-dark">-{fmt(totalExpenses)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {(reportType === "Full" || reportType === "Membership") && (
            <div className="report-section page-break">
              <h4 className="report-section-title">3. Attendance & Meeting Log</h4>
              <p className="report-paragraph" style={{ marginBottom: "12px" }}>
                The following meetings were held by Cell groups within the selected scope. Attendance values are tracked against active registered members.
              </p>

              {filteredMeetings.length === 0 ? (
                <div className="report-empty-message">No meetings recorded for this selection.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Cell Group</th>
                      <th>Meeting Type</th>
                      <th className="text-center">Present / Total</th>
                      <th className="text-center">Attendance Rate</th>
                      <th className="text-right">Offerings Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredMeetings]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map(m => {
                        const present = attendance.filter(a => a.meetingId === m.id && a.status === "Present").length;
                        const isZone = m.cell === "Zone";
                        const total = isZone
                          ? members.filter(mb => mb.status === "Active").length
                          : members.filter(mb => mb.cell === m.cell && mb.status === "Active").length;
                        
                        const pct = total ? Math.round((present / total) * 100) : 0;
                        const off = offerings.find(o => o.meetingId === m.id);

                        return (
                          <tr key={m.id}>
                            <td>{fmtDate(m.date)}</td>
                            <td>{isZone ? "Zone Meeting" : `Cell ${m.cell}`}</td>
                            <td>{m.type}</td>
                            <td className="text-center font-bold">{present} / {total}</td>
                            <td className="text-center">{pct}%</td>
                            <td className="text-right font-bold">{off ? fmt(off.amount) : "—"}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              )}
            </div>
          )}

          {(reportType === "Full" || reportType === "Membership") && (
            <div className="report-section page-break">
              <h4 className="report-section-title">4. Congregational Directories</h4>
              
              <h5 className="report-subsection-title">4.1 Active Member Directory ({activeMembers.length} registered)</h5>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Cell</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center">No active members found.</td></tr>
                  ) : (
                    [...activeMembers]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(m => (
                        <tr key={m.id}>
                          <td><span className="font-bold">{m.name}</span></td>
                          <td>Cell {m.cell}</td>
                          <td>{m.role}</td>
                          <td>{m.phone || "—"}</td>
                          <td>{m.gender || "—"}</td>
                          <td>Active</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>

              <h5 className="report-subsection-title" style={{ marginTop: "20px" }}>4.2 Active Sunday School Registry ({activeChildren.length} children)</h5>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Child's Name</th>
                    <th>Cell</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Parent / Guardian</th>
                    <th>Guardian Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {activeChildren.length === 0 ? (
                    <tr><td colSpan={6} className="text-center">No active Sunday School children found.</td></tr>
                  ) : (
                    [...activeChildren]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(c => (
                        <tr key={c.id}>
                          <td><span className="font-bold">{c.name}</span></td>
                          <td>Cell {c.cell}</td>
                          <td>{c.gender}</td>
                          <td className="text-center">{c.age || "—"}</td>
                          <td>{c.parentName || "—"}</td>
                          <td>{c.parentPhone || "—"}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Activities & Notes Summary in Report */}
          {reportType === "Full" && (
            <div className="report-section page-break">
              <h4 className="report-section-title">5. Activities &amp; Notes Log</h4>
              <p className="report-paragraph" style={{ marginBottom: "12px" }}>
                The following activities, visitations, outreach efforts, and administrative notes were recorded during this period.
              </p>
              {activityNotes.length === 0 ? (
                <div className="report-empty-message">No activities recorded.</div>
              ) : (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Cell</th>
                      <th>Recorded By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...activityNotes]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .filter(n => cellFilter === "All" ? true : (n.cell === cellFilter || n.cell === "General"))
                      .map(n => (
                        <tr key={n.id}>
                          <td>{fmtDate(n.date)}</td>
                          <td><span className="font-bold">{n.title}</span></td>
                          <td>{n.category}</td>
                          <td>{n.cell === "General" ? "General" : n.cell === "Zone" ? "Zone" : `Cell ${n.cell}`}</td>
                          <td>{n.recordedBy || "—"}</td>
                          <td style={{ fontSize: "0.8em", color: "#444" }}>{n.notes}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="report-footer">
            <div className="report-divider" style={{ marginTop: "40px" }}></div>
            <div className="flex justify-between items-center text-xs" style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
              <span>Maranatha Bible Church · Zone 4 Cell Administration Report</span>
              <span>Generated via Cell Management System</span>
            </div>
            
            <div className="report-signatures-container">
              <div className="report-signature-block">
                <div className="report-signature-line"></div>
                <span className="report-signature-title">
                  Prepared By: {cellFilter === "All" ? "Zone Deacon" : "Cell Deacon"}
                </span>
              </div>
              <div className="report-signature-block">
                <div className="report-signature-line"></div>
                <span className="report-signature-title">Reviewed By: Zone Elder</span>
              </div>
              <div className="report-signature-block">
                <div className="report-signature-line"></div>
                <span className="report-signature-title">Approved By: Zone Pastor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Zone4AppProps {
  initialMembers: any[];
  initialMeetings: any[];
  initialAttendance: any[];
  initialOfferings: any[];
  initialPledges: any[];
  initialExpenses: any[];
  initialOpeningBalances: any[];
  initialSundaySchoolChildren: any[];
  initialPledgeEvents: any[];
  initialActivityNotes: any[];
  userSession?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

// ─── Root Component ──────────────────────────────────────────────────────
export default function Zone4App({
  initialMembers,
  initialMeetings,
  initialAttendance,
  initialOfferings,
  initialPledges,
  initialExpenses,
  initialOpeningBalances,
  initialSundaySchoolChildren,
  initialPledgeEvents,
  initialActivityNotes,
  userSession,
}: Zone4AppProps) {
  const [page, setPage] = useState("dashboard");
  const [members, setMembers] = useState(initialMembers);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [offerings, setOfferings] = useState(initialOfferings);
  const [pledges, setPledges] = useState(initialPledges);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [openingBalances, setOpeningBalances] = useState(initialOpeningBalances);
  const [sundaySchoolChildren, setSundaySchoolChildren] = useState(initialSundaySchoolChildren);
  const [pledgeEvents, setPledgeEvents] = useState(initialPledgeEvents);
  const [activityNotes, setActivityNotes] = useState(initialActivityNotes);

  const props = {
    members,
    setMembers,
    meetings,
    setMeetings,
    attendance,
    setAttendance,
    offerings,
    setOfferings,
    pledges,
    setPledges,
    expenses,
    setExpenses,
    openingBalances,
    setOpeningBalances,
    sundaySchoolChildren,
    setSundaySchoolChildren,
    pledgeEvents,
    setPledgeEvents,
    activityNotes,
    setActivityNotes,
  };


  const nav = [
    { key: "dashboard", label: "Dashboard" },
    { key: "members", label: "Members" },
    { key: "sunday-school", label: "Sunday School" },
    { key: "attendance", label: "Attendance" },
    { key: "finance", label: "Finance" },
    { key: "activities", label: "Activities & Notes" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header">
        <div>
          <div className="app-title">Maranatha Bible Church</div>
          <div className="app-subtitle">Zone 4 · Cell Management System</div>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2">
            <Badge label="Cell A" variant="purple" />
            <Badge label="Cell B" variant="green" />
          </div>
          
          {userSession && (
            <div className="flex items-center gap-3" style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1rem" }}>
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold">{userSession.name}</span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{userSession.role}</span>
              </div>
              <Btn 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  await logoutUser();
                  window.location.href = "/login";
                }}
              >
                Logout
              </Btn>
            </div>
          )}
        </div>
      </header>

      {/* Nav */}
      <nav className="app-nav">
        {nav.map(n => (
          <button 
            key={n.key} 
            onClick={() => setPage(n.key)} 
            className={`app-nav__item ${page === n.key ? "app-nav__item--active" : ""}`}
          >
            {n.label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <main className="page-container">
        {page === "dashboard" && <Dashboard {...props} />}
        {page === "members" && <Members {...props} />}
        {page === "sunday-school" && <SundaySchool {...props} />}
        {page === "attendance" && <Attendance {...props} />}
        {page === "finance" && <Finance {...props} />}
        {page === "activities" && <Activities activityNotes={activityNotes} setActivityNotes={setActivityNotes} />}
        {page === "reports" && <Reports {...props} userSession={userSession} />}
      </main>
    </div>
  );
}
