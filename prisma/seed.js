const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

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

const SEED_CHILDREN = [
  { id: 1, name: "Chipo Banda", cell: "A", gender: "Female", age: 8, parentName: "Joseph Banda", parentPhone: "097-111-0002", status: "Active" },
  { id: 2, name: "Mwansa Tembo", cell: "A", gender: "Male", age: 6, parentName: "Daniel Tembo", parentPhone: "097-111-0004", status: "Active" },
  { id: 3, name: "Luyando Zulu", cell: "B", gender: "Female", age: 10, parentName: "Samuel Zulu", parentPhone: "097-111-0008", status: "Active" },
  { id: 4, name: "Kondwani Mulenga", cell: "B", gender: "Male", age: 5, parentName: "Mary Mulenga", parentPhone: "097-111-0007", status: "Active" },
];

function makeMemberId(num) {
  return `00000000-0000-0000-0000-${num.toString().padStart(12, "0")}`;
}
function makeChildId(num) {
  return `00000000-0000-0000-0005-${num.toString().padStart(12, "0")}`;
}
function makeMeetingId(num) {
  return `00000000-0000-0000-0001-${num.toString().padStart(12, "0")}`;
}
function makeOfferingId(num) {
  return `00000000-0000-0000-0002-${num.toString().padStart(12, "0")}`;
}
function makePledgeId(num) {
  return `00000000-0000-0000-0003-${num.toString().padStart(12, "0")}`;
}
function makeExpenseId(num) {
  return `00000000-0000-0000-0004-${num.toString().padStart(12, "0")}`;
}

async function main() {
  console.log("Starting database seeding...");

  // Clean existing tables in correct order of dependency
  await prisma.sundaySchoolChild.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.offering.deleteMany();
  await prisma.pledge.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing database records.");

  // Seed user (for admin purposes)
  await prisma.user.create({
    data: {
      id: "admin-user-uuid",
      name: "Deacon Admin",
      email: "admin@maranatha.org",
      password: hashPassword("password123"),
      role: "Deacon",
    },
  });

  // Seed Members
  for (const m of SEED_MEMBERS) {
    await prisma.member.create({
      data: {
        id: makeMemberId(m.id),
        name: m.name,
        cell: m.cell,
        role: m.role,
        phone: m.phone,
        status: m.status,
        gender: m.gender,
      },
    });
  }
  console.log("Seeded members.");

  // Seed Meetings
  for (const m of SEED_MEETINGS) {
    await prisma.meeting.create({
      data: {
        id: makeMeetingId(m.id),
        cell: m.cell,
        date: new Date(m.date + "T00:00:00Z"),
        type: m.type,
        notes: m.notes || null,
      },
    });
  }
  console.log("Seeded meetings.");

  // Seed Attendance
  for (const a of SEED_ATTENDANCE) {
    await prisma.attendance.create({
      data: {
        meetingId: makeMeetingId(a.meetingId),
        memberId: makeMemberId(a.memberId),
        status: a.status,
      },
    });
  }
  console.log("Seeded attendance.");

  // Seed Offerings
  for (const o of SEED_OFFERINGS) {
    await prisma.offering.create({
      data: {
        id: makeOfferingId(o.id),
        meetingId: makeMeetingId(o.meetingId),
        amount: o.amount,
        collector: o.collector,
        notes: o.notes || null,
      },
    });
  }
  console.log("Seeded offerings.");

  // Seed Pledges
  for (const p of SEED_PLEDGES) {
    await prisma.pledge.create({
      data: {
        id: makePledgeId(p.id),
        eventName: p.eventName,
        cell: p.cell,
        memberId: makeMemberId(p.memberId),
        pledgeAmount: p.pledgeAmount,
        paidAmount: p.paidAmount,
      },
    });
  }
  console.log("Seeded pledges.");

  // Seed Expenses
  for (const e of SEED_EXPENSES) {
    await prisma.expense.create({
      data: {
        id: makeExpenseId(e.id),
        cell: e.cell,
        date: new Date(e.date + "T00:00:00Z"),
        category: e.category,
        description: e.description,
        amount: e.amount,
        approvedBy: e.approvedBy,
      },
    });
  }
  console.log("Seeded expenses.");

  // Seed Sunday School Children
  for (const c of SEED_CHILDREN) {
    await prisma.sundaySchoolChild.create({
      data: {
        id: makeChildId(c.id),
        name: c.name,
        cell: c.cell,
        gender: c.gender,
        age: c.age,
        parentName: c.parentName,
        parentPhone: c.parentPhone,
        status: c.status,
      },
    });
  }
  console.log("Seeded Sunday School children.");

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
