import { useState, useMemo } from "react";
import "./App.css";

// ─── Data & Constants ───────────────────────────────────────────────────

const SEED_MEMBERS = [
  { id: 1, name: "Grace Mwansa", cell: "A", role: "Member", phone: "097-111-0001", status: "Active", gender: "Female" },
  { id: 2, name: "Joseph Banda", cell: "A", role: "Member", phone: "097-111-0002", status: "Active", gender: "Male" },
  { id: 3, name: "Ruth Phiri", cell: "A", role: "Elder", phone: "097-111-0003", status: "Active", gender: "Female" },
  { id: 4, name: "Daniel Tembo", cell: "A", role: "Member", phone: "097-111-0004", status: "Active", gender: "Male" },
  { id: 5, name: "Esther Nkole", cell: "A", role: "Member", phone: "097-111-0005", status: "Active", gender: "Female" },
  { id: 6, name: "Peter Chanda", cell: "B", role: "Member", phone: "097-111-0006", status: "Active", gender: "Male" },
  { id: 7, name: "Mary Mulenga", cell: "B", role: "Elder", phone: "097-111-0007", status: "Active", gender: "Female" },
  { id: 8, name: "Samuel Zulu", cell: "B", role: "Member", phone: "097-111-0008", status: "Active", gender: "Male" },
  { id: 9, name: "Naomi Lungu", cell: "B", role: "Member", phone: "097-111-0009", status: "Active", gender: "Female" },
  { id: 10, name: "Elijah Musonda", cell: "B", role: "Member", phone: "097-111-0010", status: "Active", gender: "Male" },
];

const SEED_MEETINGS = [
  { id: 1, cell: "A", date: "2025-05-02", type: "Weekly", notes: "" },
  { id: 2, cell: "B", date: "2025-05-03", type: "Weekly", notes: "" },
  { id: 3, cell: "A", date: "2025-05-09", type: "Weekly", notes: "" },
  { id: 4, cell: "B", date: "2025-05-10", type: "Weekly", notes: "" },
  { id: 5, cell: "Zone", date: "2025-05-14", type: "Zone Meeting", notes: "Combined Zone 4 gathering" },
];

const SEED_ATTENDANCE = [
  { meetingId: 1, memberId: 1, status: "Present" },
  { meetingId: 1, memberId: 2, status: "Present" },
  { meetingId: 1, memberId: 3, status: "Absent" },
  { meetingId: 1, memberId: 4, status: "Present" },
  { meetingId: 1, memberId: 5, status: "Excused" },
  { meetingId: 2, memberId: 6, status: "Present" },
  { meetingId: 2, memberId: 7, status: "Present" },
  { meetingId: 2, memberId: 8, status: "Present" },
  { meetingId: 2, memberId: 9, status: "Absent" },
  { meetingId: 2, memberId: 10, status: "Present" },
  { meetingId: 3, memberId: 1, status: "Present" },
  { meetingId: 3, memberId: 2, status: "Absent" },
  { meetingId: 3, memberId: 3, status: "Present" },
  { meetingId: 3, memberId: 4, status: "Present" },
  { meetingId: 3, memberId: 5, status: "Present" },
  { meetingId: 4, memberId: 6, status: "Present" },
  { meetingId: 4, memberId: 7, status: "Present" },
  { meetingId: 4, memberId: 8, status: "Excused" },
  { meetingId: 4, memberId: 9, status: "Present" },
  { meetingId: 4, memberId: 10, status: "Present" },
  { meetingId: 5, memberId: 1, status: "Present" },
  { meetingId: 5, memberId: 2, status: "Present" },
  { meetingId: 5, memberId: 3, status: "Present" },
  { meetingId: 5, memberId: 4, status: "Absent" },
  { meetingId: 5, memberId: 5, status: "Present" },
  { meetingId: 5, memberId: 6, status: "Present" },
  { meetingId: 5, memberId: 7, status: "Present" },
  { meetingId: 5, memberId: 8, status: "Present" },
  { meetingId: 5, memberId: 9, status: "Excused" },
  { meetingId: 5, memberId: 10, status: "Present" },
];

const SEED_OFFERINGS = [
  { id: 1, meetingId: 1, amount: 450, collector: "Grace Mwansa", notes: "" },
  { id: 2, meetingId: 2, amount: 520, collector: "Peter Chanda", notes: "" },
  { id: 3, meetingId: 3, amount: 380, collector: "Grace Mwansa", notes: "" },
  { id: 4, meetingId: 4, amount: 610, collector: "Mary Mulenga", notes: "" },
  { id: 5, meetingId: 5, amount: 1250, collector: "Grace Mwansa", notes: "Combined Zone 4 offering" },
];

const SEED_PLEDGES = [
  { id: 1, eventName: "Easter Fundraiser", cell: "A", memberId: 1, pledgeAmount: 200, paidAmount: 200 },
  { id: 2, eventName: "Easter Fundraiser", cell: "A", memberId: 2, pledgeAmount: 150, paidAmount: 100 },
  { id: 3, eventName: "Easter Fundraiser", cell: "A", memberId: 4, pledgeAmount: 300, paidAmount: 300 },
  { id: 4, eventName: "Easter Fundraiser", cell: "B", memberId: 6, pledgeAmount: 200, paidAmount: 150 },
  { id: 5, eventName: "Easter Fundraiser", cell: "B", memberId: 7, pledgeAmount: 250, paidAmount: 250 },
];

const SEED_EXPENSES = [
  { id: 1, cell: "A", date: "2025-05-05", category: "Hospitality", description: "Tea & snacks for meeting", amount: 80, approvedBy: "Deacon" },
  { id: 2, cell: "B", date: "2025-05-06", category: "Materials", description: "Printed bible study notes", amount: 45, approvedBy: "Deacon" },
  { id: 3, cell: "A", date: "2025-05-12", category: "Transport", description: "Fuel for home visit", amount: 120, approvedBy: "Deacon" },
];

const fmt = (n) => `K ${Number(n).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ─── UI Base Components ──────────────────────────────────────────────────

const Badge = ({ label, variant }) => (
  <span className={`badge ${variant ? `badge--${variant}` : ""}`}>{label}</span>
);

const Card = ({ children, className = "", style }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

const Stat = ({ label, value, variant }) => (
  <Card className="stat">
    <div className={`stat__value ${variant ? `stat__value--${variant}` : ""}`}>{value}</div>
    <div className="stat__label">{label}</div>
  </Card>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", className = "", active, style }) => (
  <button 
    onClick={onClick} 
    className={`btn btn--${variant} btn--${size} ${active ? `btn--tab--active` : ""} ${className}`}
    style={style}
  >
    {children}
  </button>
);

const Modal = ({ title, onClose, children }) => (
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

// ─── Dashboard Page ──────────────────────────────────────────────────────
function Dashboard({ members, meetings, attendance, offerings, pledges, expenses }) {
  const activeMembers = members.filter(m => m.status === "Active");
  const totalOffering = offerings.reduce((s, o) => s + o.amount, 0);
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

      <div className="dashboard__stats">
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

// ─── Members Page ────────────────────────────────────────────────────────
function Members({ members, setMembers }) {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ name: "", cell: "A", role: "Member", phone: "", status: "Active", gender: "Female" });

  const filtered = members.filter(m => filter === "All" || m.cell === filter);
  const roleVariant = { Member: "", Elder: "gold", Deacon: "green", Treasurer: "gold", Secretary: "purple", "Youth Leader": "accent", "Cell Leader": "green", "Women's Chairlady": "purple", "Zone Pastor": "accent" };

  const save = () => {
    if (!form.name.trim()) return;
    setMembers(p => [...p, { ...form, id: Date.now() }]);
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
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.phone}</span></td>
                  <td><Badge label={m.status} variant={m.status === "Active" ? "green" : "muted"} /></td>
                  <td className="text-right">
                    <Btn variant="ghost" size="sm" onClick={() => setMembers(p => p.map(x => x.id === m.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x))}>
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
function Attendance({ members, meetings, setMeetings, attendance, setAttendance }) {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [cellFilter, setCellFilter] = useState("A");
  const [form, setForm] = useState({ cell: "A", date: new Date().toISOString().slice(0, 10), type: "Weekly", notes: "" });
  const [visitorName, setVisitorName] = useState("");
  const [visitors, setVisitors] = useState({});

  const filteredMeetings = meetings
    .filter(m => cellFilter === "Zone" ? m.cell === "Zone" : m.cell === cellFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const createMeeting = () => {
    const nm = { ...form, id: Date.now() };
    setMeetings(p => [...p, nm]);
    const cellMembers = form.type === "Ladies' Meeting"
      ? members.filter(m => m.status === "Active" && m.gender === "Female")
      : (form.cell === "Zone"
        ? members.filter(m => m.status === "Active")
        : members.filter(m => m.cell === form.cell && m.status === "Active"));
    setAttendance(p => [...p, ...cellMembers.map(m => ({ meetingId: nm.id, memberId: m.id, status: "Present" }))]);
    setActiveMeeting(nm.id);
    setShowNewMeeting(false);
  };

  const getAtt = (meetingId, memberId) => attendance.find(a => a.meetingId === meetingId && a.memberId === memberId)?.status || "Absent";

  const cycleStatus = (meetingId, memberId) => {
    const cycle = { Present: "Absent", Absent: "Excused", Excused: "Present" };
    setAttendance(p => {
      const ex = p.find(a => a.meetingId === meetingId && a.memberId === memberId);
      if (ex) return p.map(a => a.meetingId === meetingId && a.memberId === memberId ? { ...a, status: cycle[a.status] } : a);
      return [...p, { meetingId, memberId, status: "Present" }];
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
  } : {};

  const meetingVisitors = visitors[activeMeeting] || [];

  const MemberRow = ({ m }) => {
    const st = getAtt(meeting.id, m.id);
    const stClass = st === "Absent" ? "attendance-row__status--absent" : st === "Excused" ? "attendance-row__status--excused" : "";
    return (
      <div className="attendance-row">
        <div className="flex items-center">
          <span className="attendance-row__name">{m.name}</span>
          <span className="attendance-row__role">{m.role}</span>
          {isZone && <Badge label={`Cell ${m.cell}`} variant={m.cell === "A" ? "purple" : "green"} />}
        </div>
        <button onClick={() => cycleStatus(meeting.id, m.id)} className={`attendance-row__status ${stClass}`}>
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
                  {[{ label: "Cell A", members: meetingMembersA, variant: "a" }, { label: "Cell B", members: meetingMembersB, variant: "b" }].map(group => (
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
                        setVisitors(v => ({ ...v, [activeMeeting]: [...(v[activeMeeting] || []), visitorName.trim()] }));
                        setVisitorName("");
                      }
                    }}
                  />
                  <Btn size="sm" onClick={() => {
                    if (visitorName.trim()) {
                      setVisitors(v => ({ ...v, [activeMeeting]: [...(v[activeMeeting] || []), visitorName.trim()] }));
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

// ─── Finance Page ────────────────────────────────────────────────────────
function Finance({ members, meetings, offerings, setOfferings, pledges, setPledges, expenses, setExpenses }) {
  const [tab, setTab] = useState("offerings");
  const [showModal, setShowModal] = useState(false);

  const [offForm, setOffForm] = useState({ meetingId: "", amount: "", collector: "", notes: "" });
  const [pledgeForm, setPledgeForm] = useState({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0" });
  const [expForm, setExpForm] = useState({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" });

  const totalOffering = offerings.reduce((s, o) => s + o.amount, 0);
  const totalPledgePaid = pledges.reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalOffering + totalPledgePaid - totalExpenses;

  const getMtgLabel = id => { const m = meetings.find(x => x.id == id); return m ? `Cell ${m.cell} · ${fmtDate(m.date)}` : "—"; };
  const getMemberName = id => members.find(m => m.id == id)?.name || "—";

  const saveOffering = () => {
    if (!offForm.meetingId || !offForm.amount) return;
    setOfferings(p => [...p, { ...offForm, id: Date.now(), amount: parseFloat(offForm.amount) }]);
    setOffForm({ meetingId: "", amount: "", collector: "", notes: "" });
    setShowModal(false);
  };

  const savePledge = () => {
    if (!pledgeForm.eventName || !pledgeForm.memberId || !pledgeForm.pledgeAmount) return;
    setPledges(p => [...p, { ...pledgeForm, id: Date.now(), pledgeAmount: parseFloat(pledgeForm.pledgeAmount), paidAmount: parseFloat(pledgeForm.paidAmount || 0) }]);
    setPledgeForm({ eventName: "", cell: "A", memberId: "", pledgeAmount: "", paidAmount: "0" });
    setShowModal(false);
  };

  const saveExpense = () => {
    if (!expForm.description || !expForm.amount) return;
    setExpenses(p => [...p, { ...expForm, id: Date.now(), amount: parseFloat(expForm.amount) }]);
    setExpForm({ cell: "A", date: new Date().toISOString().slice(0, 10), category: "Hospitality", description: "", amount: "", approvedBy: "Deacon" });
    setShowModal(false);
  };

  return (
    <div>
      <div className="finance__header">
        <h2 className="finance__title">Finances</h2>
        <Btn size="sm" onClick={() => setShowModal(true)}>
          + Record {tab === "offerings" ? "offering" : tab === "pledges" ? "pledge" : "expense"}
        </Btn>
      </div>

      <div className="finance__stats">
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
              <thead><tr><TH>Meeting</TH><TH>Amount (ZMW)</TH><TH>Collector</TH><TH>Notes</TH></tr></thead>
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
              <thead><tr><TH>Event</TH><TH>Member</TH><TH>Cell</TH><TH>Pledged</TH><TH>Paid</TH><TH>Status</TH></tr></thead>
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
              <thead><tr><TH>Date</TH><TH>Cell</TH><TH>Category</TH><TH>Description</TH><TH>Amount</TH><TH>Approved by</TH></tr></thead>
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
    </div>
  );
}

const TH = ({ children }) => <th>{children}</th>;

// ─── Root Component ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [members, setMembers] = useState(SEED_MEMBERS);
  const [meetings, setMeetings] = useState(SEED_MEETINGS);
  const [attendance, setAttendance] = useState(SEED_ATTENDANCE);
  const [offerings, setOfferings] = useState(SEED_OFFERINGS);
  const [pledges, setPledges] = useState(SEED_PLEDGES);
  const [expenses, setExpenses] = useState(SEED_EXPENSES);

  const props = { members, setMembers, meetings, setMeetings, attendance, setAttendance, offerings, setOfferings, pledges, setPledges, expenses, setExpenses };

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
