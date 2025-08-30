import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserIdFromReq(req: Request): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? cookieStore.get("eventhive_token")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userId = await getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const timeRange = searchParams.get("timeRange") || "30"; // days

    if (eventId) {
      // Single event analytics
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizerId: userId },
        include: {
          ticketTypes: true,
          bookings: {
            where: { status: "CONFIRMED" },
            include: {
              ticket: true,
              checkIns: true
            }
          }
        }
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Calculate detailed analytics
      const totalTicketsSold = event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
      const totalRevenue = event.bookings.reduce((sum, booking) => sum + (booking.quantity * booking.ticket.price), 0);
      const totalCheckedIn = event.bookings.reduce((sum, booking) => sum + booking.checkIns.length, 0);

      // Ticket type breakdown
      const ticketTypeAnalytics = event.ticketTypes.map(ticketType => {
        const bookingsForTicket = event.bookings.filter(booking => booking.ticketId === ticketType.id);
        const soldForTicket = bookingsForTicket.reduce((sum, booking) => sum + booking.quantity, 0);
        const revenueForTicket = bookingsForTicket.reduce((sum, booking) => sum + (booking.quantity * booking.ticket.price), 0);

        return {
          ticketType: ticketType.name,
          totalSold: soldForTicket,
          totalRevenue: revenueForTicket,
          remainingCapacity: ticketType.maxQuantity - soldForTicket,
          soldPercentage: Math.round((soldForTicket / ticketType.maxQuantity) * 100)
        };
      });

      // Daily sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailySales = await prisma.booking.findMany({
        where: {
          eventId: eventId,
          status: "CONFIRMED",
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true,
          quantity: true,
          ticket: { select: { price: true } }
        }
      });

      // Group by date
      const salesByDate: { [key: string]: { quantity: number, revenue: number } } = {};
      dailySales.forEach(sale => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!salesByDate[date]) {
          salesByDate[date] = { quantity: 0, revenue: 0 };
        }
        salesByDate[date].quantity += sale.quantity;
        salesByDate[date].revenue += sale.quantity * sale.ticket.price;
      });

      return NextResponse.json({
        ok: true,
        analytics: {
          eventId: event.id,
          eventTitle: event.title,
          summary: {
            totalTicketsSold,
            totalRevenue,
            totalCheckedIn,
            checkInRate: totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 100) : 0
          },
          ticketTypes: ticketTypeAnalytics,
          dailySales: salesByDate
        }
      });

    } else {
      // Overall analytics for all user events
      const events = await prisma.event.findMany({
        where: { organizerId: userId },
        include: {
          bookings: {
            where: { status: "CONFIRMED" },
            include: { ticket: true }
          }
        }
      });

      const totalEvents = events.length;
      const publishedEvents = events.filter(e => e.status === "PUBLISHED").length;
      const totalTicketsSold = events.reduce((sum, event) => 
        sum + event.bookings.reduce((eventSum, booking) => eventSum + booking.quantity, 0), 0
      );
      const totalRevenue = events.reduce((sum, event) => 
        sum + event.bookings.reduce((eventSum, booking) => eventSum + (booking.quantity * booking.ticket.price), 0), 0
      );

      // Top performing events
      const eventPerformance = events.map(event => {
        const eventTicketsSold = event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
        const eventRevenue = event.bookings.reduce((sum, booking) => sum + (booking.quantity * booking.ticket.price), 0);

        return {
          id: event.id,
          title: event.title,
          ticketsSold: eventTicketsSold,
          revenue: eventRevenue,
          status: event.status
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Category breakdown
      const categoryStats: { [key: string]: { events: number, ticketsSold: number, revenue: number } } = {};
      events.forEach(event => {
        if (!categoryStats[event.category]) {
          categoryStats[event.category] = { events: 0, ticketsSold: 0, revenue: 0 };
        }
        categoryStats[event.category].events += 1;
        categoryStats[event.category].ticketsSold += event.bookings.reduce((sum, booking) => sum + booking.quantity, 0);
        categoryStats[event.category].revenue += event.bookings.reduce((sum, booking) => sum + (booking.quantity * booking.ticket.price), 0);
      });

      return NextResponse.json({
        ok: true,
        analytics: {
          summary: {
            totalEvents,
            publishedEvents,
            totalTicketsSold,
            totalRevenue,
            averageRevenuePerEvent: totalEvents > 0 ? Math.round(totalRevenue / totalEvents) : 0
          },
          topEvents: eventPerformance.slice(0, 5),
          categoryBreakdown: categoryStats
        }
      });
    }

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
