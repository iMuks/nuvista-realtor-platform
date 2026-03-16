import { Response } from 'express';
import { Property, Lead, User } from '../models';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

// GET /api/dashboard
export const getDashboardStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const agentId = req.user!._id;
    const isAdmin = req.user!.role === 'admin';
    const agentFilter = isAdmin ? {} : { agent: agentId };
    const leadAgentFilter = isAdmin ? {} : { assignedAgent: agentId };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalListings,
      activeListings,
      totalLeads,
      newLeadsThisWeek,
      soldThisMonth,
      recentProperties,
      recentLeads,
      monthlyData,
      topNeighbourhoods,
      leadsByStatus,
    ] = await Promise.all([
      Property.countDocuments(agentFilter),
      Property.countDocuments({ ...agentFilter, status: 'active' }),
      Lead.countDocuments(leadAgentFilter),
      Lead.countDocuments({
        ...leadAgentFilter,
        createdAt: { $gte: oneWeekAgo },
      }),
      Property.countDocuments({
        ...agentFilter,
        status: 'sold',
        soldDate: { $gte: startOfMonth },
      }),
      Property.find(agentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title address.city price status propertyType bedrooms bathrooms images listedDate')
        .lean(),
      Lead.find(leadAgentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email status score source preferredLocations createdAt')
        .lean(),
      // Monthly performance (last 6 months)
      Property.aggregate([
        {
          $match: {
            ...agentFilter,
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            listings: { $sum: 1 },
            sold: {
              $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] },
            },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', 'sold'] }, '$soldPrice', 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Top neighbourhoods
      Property.aggregate([
        { $match: { ...agentFilter, status: 'active' } },
        {
          $group: {
            _id: '$neighbourhood',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      // Lead pipeline
      Lead.aggregate([
        { $match: leadAgentFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate total revenue
    const totalSoldData = await Property.aggregate([
      { $match: { ...agentFilter, status: 'sold' } },
      { $group: { _id: null, total: { $sum: '$soldPrice' }, count: { $sum: 1 } } },
    ]);
    const totalRevenue = totalSoldData[0]?.total || 0;
    const totalSold = totalSoldData[0]?.count || 0;

    // Average days on market
    const domData = await Property.aggregate([
      { $match: { ...agentFilter, status: 'sold', soldDate: { $exists: true } } },
      {
        $project: {
          dom: {
            $divide: [
              { $subtract: ['$soldDate', '$listedDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $group: { _id: null, avgDOM: { $avg: '$dom' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalListings,
          activeListings,
          totalLeads,
          newLeadsThisWeek,
          totalSold,
          soldThisMonth,
          averageDaysOnMarket: Math.round(domData[0]?.avgDOM || 0),
          totalRevenue,
          conversionRate:
            totalLeads > 0
              ? Math.round((totalSold / totalLeads) * 100 * 10) / 10
              : 0,
        },
        recentProperties,
        recentLeads,
        monthlyPerformance: monthlyData.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          listings: m.listings,
          sold: m.sold,
          revenue: m.revenue,
        })),
        topNeighbourhoods: topNeighbourhoods.map((n) => ({
          name: n._id || 'Unknown',
          count: n.count,
          avgPrice: Math.round(n.avgPrice),
        })),
        leadPipeline: leadsByStatus.reduce(
          (acc: Record<string, number>, item: any) => {
            acc[item._id] = item.count;
            return acc;
          },
          {}
        ),
      },
    });
  }
);
