import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function verifyAdminAccess(req: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    
    if (!token) return null;
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });
    
    return user?.role === "ADMIN" ? payload.userId : null;
  } catch {
    return null;
  }
}

// Get admin dashboard data
export async function GET(req: Request) {
  const adminId = await verifyAdminAccess(req);
  
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all events with organizer info
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        startAt: true,
        createdAt: true,
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalUsers = users.length;
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'PUBLISHED').length;

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = users.filter(u => 
      new Date(u.createdAt) >= startOfMonth
    ).length;

    // Get booking stats
    const bookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        ticket: {
          select: { price: true }
        }
      }
    });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => 
      sum + (booking.ticket.price * booking.quantity), 0
    );

    const stats = {
      totalUsers,
      totalEvents,
      totalRevenue,
      totalBookings,
      activeEvents,
      newUsersThisMonth
    };

    // Get pending role upgrade requests
    const roleUpgradeRequests = await prisma.roleUpgradeRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      ok: true,
      users,
      events,
      stats,
      roleUpgradeRequests
    });

  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update user role
export async function PUT(req: Request) {
  const adminId = await verifyAdminAccess(req);
  
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    const validRoles = ['ATTENDEE', 'ORGANIZER', 'VOLUNTEER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      ok: true,
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update event status
export async function PATCH(req: Request) {
  const adminId = await verifyAdminAccess(req);
  
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { eventId, status } = body;

    if (!eventId || !status) {
      return NextResponse.json({ error: "Event ID and status are required" }, { status: 400 });
    }

    const validStatuses = ['DRAFT', 'PUBLISHED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    return NextResponse.json({
      ok: true,
      event: updatedEvent
    });

  } catch (error) {
    console.error("Error updating event status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete user (soft delete by changing role) or delete event
export async function DELETE(req: Request) {
  const adminId = await verifyAdminAccess(req);
  
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const eventId = searchParams.get('eventId');

    if (userId) {
      // Suspend user by updating their role to ATTENDEE
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'ATTENDEE' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      return NextResponse.json({
        ok: true,
        message: "User suspended successfully",
        user: updatedUser
      });
    }

    if (eventId) {
      // First check if event has bookings
      const bookingsCount = await prisma.booking.count({
        where: { 
          ticket: {
            eventId: eventId
          }
        }
      });

      if (bookingsCount > 0) {
        // If event has bookings, just cancel it instead of deleting
        const updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: { status: 'CANCELLED' },
          select: {
            id: true,
            title: true,
            status: true
          }
        });

        return NextResponse.json({
          ok: true,
          message: "Event cancelled (has existing bookings)",
          event: updatedEvent
        });
      } else {
        // If no bookings, safe to delete
        // First delete related ticket types
        await prisma.ticketType.deleteMany({
          where: { eventId: eventId }
        });

        // Then delete the event
        await prisma.event.delete({
          where: { id: eventId }
        });

        return NextResponse.json({
          ok: true,
          message: "Event deleted successfully"
        });
      }
    }

    return NextResponse.json({ error: "User ID or Event ID required" }, { status: 400 });

  } catch (error) {
    console.error("Error in delete operation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
