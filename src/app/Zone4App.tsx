"use client";

import React, { useState } from "react";
import {
  addMember,
  toggleMemberStatus,
  createMeeting as actionCreateMeeting,
  updateAttendance,
  addOffering,
  addPledge,
  addExpense,
  setOpeningBalance,
} from "@/app/actions";

const fmt = (n: number | string) => `K ${Number(n).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
}

const Btn: React.FC<BtnProps> = ({ children, onClick, variant = "primary", size = "md", className = "", active, style }) => (
  <button 
    onClick={onClick} 
    className={`btn btn--${variant} btn--${size} ${active ? `btn--tab--active` : ""} ${className}`}
    style={style}
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


interface DashboardProps {
  members: any[];
  meetings: any[];
  attendance: any[];
  offerings: any[];
  pledges: any[];
  expenses: any[];
  openingBalances: any[];
}

// ─── Dashboard Page ──────────────────────────────────────────────────────
function Dashboard({ members, meetings, attendance, offerings, pledges, expenses, openingBalances }: DashboardProps) {
  const activeMembers = members.filter(m => m.status === "Active");
  const getOpeningBalance = (c: string) => openingBalances.find(o => o.cell === c)?.amount || 0;
  const totalOpening = getOpeningBalance("A") + getOpeningBalance("B") + getOpeningBalance("Zone");

  const totalOffering = offerings.reduce((s, o) => s + o.amount, 0);
  const totalPledgePaid = pledges.reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalOpening + totalOffering + totalPledgePaid - totalExpenses;

  const avgAtt = (cell) => {
    const cm = meetings.filter(m => m.cell === cell);
    if (!cm.length) return 0;
    const total = cm.reduce((s, m) => s + attendance.filter(a => a.meetingId === m.id && a.status === "Present").length, 0);
    return Math.round(total / cm.length);
  };

  const recentMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

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
        <Stat label="Opening balance" value={fmt(totalOpening)} variant="purple" />
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
  const [form, setForm] = useState({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" });

  const filtered = members.filter(m => filter === "All" || m.cell === filter);
  const roleVariant = { Member: "", Elder: "gold", Deacon: "green", Treasurer: "gold", Secretary: "purple", "Youth Leader": "accent", "Cell Leader": "green", "Women's Chairlady": "purple", "Zone Pastor": "accent" };

  const save = async () => {
    if (!form.name.trim()) return;
    const created = await addMember(form);
    setMembers(p => [...p, created]);
    setForm({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" });
    setShowModal(false);
  };

  return (
    <div>
      <div className="members__header">
        <h2 className="members__title">Members</h2>
        <div className="members__filters">
          {["All", "A", "B"].map(f => (
            <Btn key={f} variant={filter === f ? "primary" : "ghost"} size="sm" onClick={() => setFilter(f)}>
              {f === "All" ? "All cells" : `Cell ${f}`}
            </Btn>
          ))}
          <Btn size="sm" onClick={() => setShowModal(true)}>+ Add member</Btn>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Cell</th><th>Role</th><th>Phone</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td><span className="font-bold">{m.name}</span></td>
                  <td><Badge label={`Cell ${m.cell}`} variant={m.cell === "A" ? "purple" : "green"} /></td>
                  <td><Badge label={m.role} variant={roleVariant[m.role]} /></td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.phone || "—"}</span></td>
                  <td><Badge label={m.status} variant={m.status === "Active" ? "green" : "muted"} /></td>
                  <td className="text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal title="Add new member" onClose={() => setShowModal(false)}>
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
              <option>Treasurer</option>
              <option>Secretary</option>
              <option>Youth Leader</option>
              <option>Cell Leader</option>
              <option>Women's Chairlady</option>
              <option>Zone Pastor</option>
            </select>
          </div>
          <div className="flex gap-2" style={{ marginTop: 4 }}>
            <Btn style={{ flex: 1 }} onClick={save}>Save member</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</Btn>
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
    const formattedMeeting = {
      ...created,
      date: created.date instanceof Date ? created.date.toISOString().slice(0, 10) : created.date,
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
}

// ─── Finance Page ────────────────────────────────────────────────────────
const Finance: React.FC<FinanceProps> = ({ members, meetings, offerings, setOfferings, pledges, setPledges, expenses, setExpenses, openingBalances, setOpeningBalances }) => {
  const [tab, setTab] = useState("offerings");
  const [showModal, setShowModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

  const [offForm, setOffForm] = useState({ meetingId: "", amount: "", collector: "", notes: "" });
  const [pledgeForm, setPledgeForm] = useState({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0" });
  const [expForm, setExpForm] = useState({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" });
  const [openingForm, setOpeningForm] = useState({ cell: "A", amount: "" });

  const getOpeningBalance = (c: string) => openingBalances.find(o => o.cell === c)?.amount || 0;
  const totalOpening = getOpeningBalance("A") + getOpeningBalance("B") + getOpeningBalance("Zone");

  const totalOffering = offerings.reduce((s, o) => s + o.amount, 0);
  const totalPledgePaid = pledges.reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalOpening + totalOffering + totalPledgePaid - totalExpenses;

  const getMtgLabel = id => { const m = meetings.find(x => x.id == id); return m ? `Cell ${m.cell} · ${fmtDate(m.date)}` : "—"; };
  const getMemberName = id => members.find(m => m.id == id)?.name || "—";

  const saveOffering = async () => {
    if (!offForm.meetingId || !offForm.amount) return;
    const amount = parseFloat(offForm.amount);
    const created = await addOffering({ ...offForm, amount });
    setOfferings(p => [...p, created]);
    setOffForm({ meetingId: "", amount: "", collector: "", notes: "" });
    setShowModal(false);
  };

  const savePledge = async () => {
    if (!pledgeForm.eventName || !pledgeForm.memberId || !pledgeForm.pledgeAmount) return;
    const pledgeAmount = parseFloat(pledgeForm.pledgeAmount);
    const paidAmount = parseFloat(pledgeForm.paidAmount || "0");
    const created = await addPledge({ ...pledgeForm, pledgeAmount, paidAmount });
    setPledges(p => [...p, created]);
    setPledgeForm({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0" });
    setShowModal(false);
  };

  const saveExpense = async () => {
    if (!expForm.description || !expForm.amount) return;
    const amount = parseFloat(expForm.amount);
    const created = await addExpense({ ...expForm, amount });
    const formattedExpense = {
      ...created,
      date: created.date instanceof Date ? created.date.toISOString().slice(0, 10) : created.date,
    };
    setExpenses(p => [...p, formattedExpense]);
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

  return (
    <div>
      <div className="finance__header">
        <h2 className="finance__title">Finances</h2>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => setShowOpeningModal(true)}>
            ⚙ Set opening balance
          </Btn>
          <Btn size="sm" onClick={() => setShowModal(true)}>
            + Record {tab === "offerings" ? "offering" : tab === "pledges" ? "pledge" : "expense"}
          </Btn>
        </div>
      </div>

      <div className="finance__stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Stat label="Opening balance" value={fmt(totalOpening)} variant="purple" />
        <Stat label="Total offerings" value={fmt(totalOffering)} variant="green" />
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
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Meeting</th><th>Amount (ZMW)</th><th>Collector</th><th>Notes</th></tr></thead>
              <tbody>
                {offerings.map(o => (
                  <tr key={o.id}>
                    <td>{getMtgLabel(o.meetingId)}</td>
                    <td className="mono finance__amount--positive">{fmt(o.amount)}</td>
                    <td>{o.collector}</td>
                    <td className="finance__note">{o.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "pledges" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Event</th><th>Member</th><th>Cell</th><th>Pledged</th><th>Paid</th><th>Status</th></tr></thead>
              <tbody>
                {pledges.map(p => {
                  const pct = Math.round((p.paidAmount / p.pledgeAmount) * 100);
                  return (
                    <tr key={p.id}>
                      <td><span className="font-bold">{p.eventName}</span></td>
                      <td>{getMemberName(p.memberId)}</td>
                      <td><Badge label={`Cell ${p.cell}`} variant={p.cell === "A" ? "purple" : "green"} /></td>
                      <td className="mono">{fmt(p.pledgeAmount)}</td>
                      <td className="mono finance__amount--positive">{fmt(p.paidAmount)}</td>
                      <td><Badge label={pct >= 100 ? "Fulfilled" : `${pct}%`} variant={pct >= 100 ? "green" : "gold"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "expenses" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Cell</th><th>Category</th><th>Description</th><th>Amount</th><th>Approved by</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td><span className="finance__note text-sm">{fmtDate(e.date)}</span></td>
                    <td><Badge label={`Cell ${e.cell}`} variant={e.cell === "A" ? "purple" : "green"} /></td>
                    <td><Badge label={e.category} variant="accent" /></td>
                    <td>{e.description}</td>
                    <td className="mono finance__amount--negative">{fmt(e.amount)}</td>
                    <td><span className="finance__note text-sm">{e.approvedBy}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <Modal title={`Record ${tab.slice(0, -1)}`} onClose={() => setShowModal(false)}>
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
                <Btn style={{ flex: 1 }} onClick={saveOffering}>Save offering</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</Btn>
              </div>
            </>
          )}
          {tab === "pledges" && (
            <>
              <div>
                <div className="field-label">Event name</div>
                <input className="input" value={pledgeForm.eventName} onChange={e => setPledgeForm({ ...pledgeForm, eventName: e.target.value })} placeholder="e.g. Easter Fundraiser" />
              </div>
              <div>
                <div className="field-label">Cell</div>
                <select className="select" value={pledgeForm.cell} onChange={e => setPledgeForm({ ...pledgeForm, cell: e.target.value })}>
                  <option value="A">Cell A</option>
                  <option value="B">Cell B</option>
                </select>
              </div>
              <div>
                <div className="field-label">Member</div>
                <select className="select" value={pledgeForm.memberId} onChange={e => setPledgeForm({ ...pledgeForm, memberId: e.target.value })}>
                  <option value="">— Select member —</option>
                  {members.filter(m => m.cell === pledgeForm.cell && m.status === "Active").map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
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
                <Btn style={{ flex: 1 }} onClick={savePledge}>Save pledge</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</Btn>
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
                <Btn style={{ flex: 1 }} onClick={saveExpense}>Save expense</Btn>
                <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {showOpeningModal && (
        <Modal title="Set Opening Book Balance" onClose={() => setShowOpeningModal(false)}>
          <div>
            <div className="field-label">Cell / Fund Scope</div>
            <select className="select" value={openingForm.cell} onChange={e => setOpeningForm({ ...openingForm, cell: e.target.value })}>
              <option value="A">Cell A</option>
              <option value="B">Cell B</option>
              <option value="Zone">Zone Fund (Combined)</option>
            </select>
          </div>
          <div>
            <div className="field-label">Opening Balance Amount (ZMW)</div>
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
            This balance will serve as the starting book value for the selected cell or combined fund.
          </div>
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <Btn style={{ flex: 1 }} onClick={saveOpeningBalance}>Save balance</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setShowOpeningModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface Zone4AppProps {
  initialMembers: any[];
  initialMeetings: any[];
  initialAttendance: any[];
  initialOfferings: any[];
  initialPledges: any[];
  initialExpenses: any[];
  initialOpeningBalances: any[];
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
}: Zone4AppProps) {
  const [page, setPage] = useState("dashboard");
  const [members, setMembers] = useState(initialMembers);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [offerings, setOfferings] = useState(initialOfferings);
  const [pledges, setPledges] = useState(initialPledges);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [openingBalances, setOpeningBalances] = useState(initialOpeningBalances);

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
  };

  const nav = [
    { key: "dashboard", label: "Dashboard" },
    { key: "members", label: "Members" },
    { key: "attendance", label: "Attendance" },
    { key: "finance", label: "Finance" },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="app-header">
        <div>
          <div className="app-title">Maranatha Bible Church</div>
          <div className="app-subtitle">Zone 4 · Cell Management System</div>
        </div>
        <div className="flex gap-2">
          <Badge label="Cell A" variant="purple" />
          <Badge label="Cell B" variant="green" />
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
        {page === "attendance" && <Attendance {...props} />}
        {page === "finance" && <Finance {...props} />}
      </main>
    </div>
  );
}
