import { prisma } from "@/lib/prisma";
import Zone4App from "./Zone4App";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  let userSession = null;
  if (session) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, role: true },
    });
    if (dbUser) {
      userSession = {
        name: dbUser.name || "Deacon Admin",
        email: dbUser.email,
        role: dbUser.role,
      };
    }
  }
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
  });

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
  });

  const attendance = await prisma.attendance.findMany();

  const offerings = await prisma.offering.findMany({
    orderBy: { createdAt: "desc" },
  });

  const pledges = await prisma.pledge.findMany({
    orderBy: { createdAt: "desc" },
  });

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });

  const openingBalances = await prisma.openingBalance.findMany();

  const sundaySchoolChildren = await prisma.sundaySchoolChild.findMany({
    orderBy: { name: "asc" },
  });

  // Serialize records to plain JSON types (Date -> ISO String)
  const serializedMembers = members.map((m) => ({
    id: m.id,
    name: m.name,
    cell: m.cell,
    role: m.role,
    phone: m.phone || "",
    status: m.status,
    gender: m.gender,
  }));

  const serializedMeetings = meetings.map((m) => ({
    id: m.id,
    cell: m.cell,
    date: m.date.toISOString().slice(0, 10),
    type: m.type,
    notes: m.notes || "",
  }));

  const serializedAttendance = attendance.map((a) => ({
    id: a.id,
    meetingId: a.meetingId,
    memberId: a.memberId,
    status: a.status,
  }));

  const serializedOfferings = offerings.map((o) => ({
    id: o.id,
    meetingId: o.meetingId,
    amount: o.amount,
    collector: o.collector,
    notes: o.notes || "",
  }));

  const serializedPledges = pledges.map((p) => ({
    id: p.id,
    eventName: p.eventName,
    cell: p.cell,
    memberId: p.memberId,
    pledgeAmount: p.pledgeAmount,
    paidAmount: p.paidAmount,
  }));

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    cell: e.cell,
    date: e.date.toISOString().slice(0, 10),
    category: e.category,
    description: e.description,
    amount: e.amount,
    approvedBy: e.approvedBy,
  }));

  const serializedOpeningBalances = openingBalances.map((o) => ({
    id: o.id,
    cell: o.cell,
    amount: o.amount,
  }));

  const serializedSundaySchoolChildren = sundaySchoolChildren.map((c) => ({
    id: c.id,
    name: c.name,
    cell: c.cell,
    gender: c.gender,
    age: c.age || "",
    parentName: c.parentName || "",
    parentPhone: c.parentPhone || "",
    status: c.status,
  }));

  return (
    <Zone4App
      initialMembers={serializedMembers}
      initialMeetings={serializedMeetings}
      initialAttendance={serializedAttendance}
      initialOfferings={serializedOfferings}
      initialPledges={serializedPledges}
      initialExpenses={serializedExpenses}
      initialOpeningBalances={serializedOpeningBalances}
      initialSundaySchoolChildren={serializedSundaySchoolChildren}
      userSession={userSession}
    />
  );
}
