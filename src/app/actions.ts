"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function addMember(data: {
  name: string;
  cell: string;
  role: string;
  phone?: string;
  status: string;
  gender: string;
}) {
  const member = await prisma.member.create({
    data: {
      name: data.name,
      cell: data.cell,
      role: data.role,
      phone: data.phone || null,
      status: data.status,
      gender: data.gender,
    },
  });
  revalidatePath("/");
  return member;
}

export async function toggleMemberStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
  const member = await prisma.member.update({
    where: { id },
    data: { status: newStatus },
  });
  revalidatePath("/");
  return member;
}

export async function deleteMember(id: string) {
  const member = await prisma.member.delete({
    where: { id },
  });
  revalidatePath("/");
  return member;
}

export async function addSundaySchoolChild(data: {
  name: string;
  cell: string;
  gender: string;
  age?: number;
  parentName?: string;
  parentPhone?: string;
  status: string;
}) {
  const child = await prisma.sundaySchoolChild.create({
    data: {
      name: data.name,
      cell: data.cell,
      gender: data.gender,
      age: data.age !== undefined && data.age !== null ? Number(data.age) : null,
      parentName: data.parentName || null,
      parentPhone: data.parentPhone || null,
      status: data.status,
    },
  });
  revalidatePath("/");
  return child;
}

export async function toggleSundaySchoolChildStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
  const child = await prisma.sundaySchoolChild.update({
    where: { id },
    data: { status: newStatus },
  });
  revalidatePath("/");
  return child;
}

export async function deleteSundaySchoolChild(id: string) {
  const child = await prisma.sundaySchoolChild.delete({
    where: { id },
  });
  revalidatePath("/");
  return child;
}

export async function createMeeting(
  meetingData: {
    cell: string;
    date: string;
    type: string;
    notes?: string;
  },
  memberIds: string[]
) {
  // Create meeting and initial attendance in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.create({
      data: {
        cell: meetingData.cell,
        date: new Date(meetingData.date + "T00:00:00Z"),
        type: meetingData.type,
        notes: meetingData.notes || null,
      },
    });

    if (memberIds.length > 0) {
      await tx.attendance.createMany({
        data: memberIds.map((mId) => ({
          meetingId: meeting.id,
          memberId: mId,
          status: "Present",
        })),
      });
    }

    return meeting;
  });

  revalidatePath("/");
  return result;
}

export async function updateAttendance(meetingId: string, memberId: string, status: string) {
  const attendance = await prisma.attendance.upsert({
    where: {
      meetingId_memberId: {
        meetingId,
        memberId,
      },
    },
    update: { status },
    create: {
      meetingId,
      memberId,
      status,
    },
  });
  revalidatePath("/");
  return attendance;
}

export async function addOffering(data: {
  meetingId: string;
  amount: number;
  collector: string;
  notes?: string;
}) {
  const offering = await prisma.offering.create({
    data: {
      meetingId: data.meetingId,
      amount: data.amount,
      collector: data.collector,
      notes: data.notes || null,
    },
  });
  revalidatePath("/");
  return offering;
}

export async function addPledge(data: {
  eventName: string;
  cell: string;
  memberId: string;
  pledgeAmount: number;
  paidAmount: number;
}) {
  const pledge = await prisma.pledge.create({
    data: {
      eventName: data.eventName,
      cell: data.cell,
      memberId: data.memberId,
      pledgeAmount: data.pledgeAmount,
      paidAmount: data.paidAmount,
    },
  });
  revalidatePath("/");
  return pledge;
}

export async function addExpense(data: {
  cell: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  approvedBy: string;
}) {
  const expense = await prisma.expense.create({
    data: {
      cell: data.cell,
      date: new Date(data.date + "T00:00:00Z"),
      category: data.category,
      description: data.description,
      amount: data.amount,
      approvedBy: data.approvedBy,
    },
  });
  revalidatePath("/");
  return expense;
}

export async function setOpeningBalance(cell: string, amount: number) {
  const result = await prisma.openingBalance.upsert({
    where: { cell },
    update: { amount },
    create: { cell, amount },
  });
  revalidatePath("/");
  return result;
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Please fill in all fields" };
    }

    // Resolve client IP from request headers for security tracking
    let ip = "127.0.0.1";
    try {
      const headersList = await headers();
      ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    } catch (e) {
      console.warn("Could not resolve IP from headers:", e);
    }
    
    // Strict rate limit: 5 attempts per 1 minute per IP + email
    const rateLimitKey = `login:${ip}:${email.toLowerCase().trim()}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, 5, 60000);

    if (!rateLimitResult.success) {
      const seconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return { error: `Too many attempts. Please try again in ${seconds} second(s).` };
    }

    // Dynamically auto-seed the default administrator if the user table is completely empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          id: "admin-user-uuid",
          name: "Deacon Admin",
          email: "admin@maranatha.org",
          password: hashPassword("password123"),
          role: "Deacon",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id, user.email, user.role);

    return { success: true };
  } catch (error: any) {
    console.error("Login action critical error:", error);
    return { error: error?.message || "An unexpected server error occurred during login. Please try again." };
  }
}

export async function logoutUser() {
  try {
    await deleteSession();
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Logout failed securely:", error);
    return { error: "Failed to logout securely" };
  }
}
