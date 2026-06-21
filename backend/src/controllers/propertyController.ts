import { Request, Response } from 'express';
import { Property } from '../models';
import { AuthRequest, PropertySearchFilters } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// GET /api/properties
export const getProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      city, province, propertyType, status,
      priceMin, priceMax, bedroomsMin, bathroomsMin,
      squareFeetMin, yearBuiltMin, features,
      sortBy = 'listedDate', sortOrder = 'desc',
      page = 1, limit = 20,
      lat, lng, radiusKm,
    } = req.query as Record<string, any>;

    const filter: Record<string, any> = {};

    if (city) {
      // Handle "City, Province, Country" format — extract just the city token
      const cityToken = (city as string).split(',')[0].trim();
      const re = new RegExp(cityToken, 'i');
      filter.$or = [
        { 'address.city': re },
        { 'address.province': re },
        { neighbourhood: re },
      ];
    }
    if (province) filter['address.province'] = province;
    if (propertyType) filter.propertyType = { $in: propertyType.split(',') };
    if (status) filter.status = { $in: status.split(',') };
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    if (bedroomsMin) filter.bedrooms = { $gte: Number(bedroomsMin) };
    if (bathroomsMin) filter.bathrooms = { $gte: Number(bathroomsMin) };
    if (squareFeetMin) filter.squareFeet = { $gte: Number(squareFeetMin) };
    if (yearBuiltMin) filter.yearBuilt = { $gte: Number(yearBuiltMin) };
    if (features) filter.features = { $all: features.split(',') };

    // Geo-spatial query
    if (lat && lng && radiusKm) {
      filter['address.location'] = {
        $geoWithin: {
          $centerSphere: [
            [Number(lng), Number(lat)],
            Number(radiusKm) / 6378.1, // radius in radians
          ],
        },
      };
    }

    const sortObj: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('agent', 'firstName lastName email phone avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

// GET /api/properties/nearby
export const getNearbyProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { lat, lng, maxDistance = 10000 } = req.query; // maxDistance in meters

    if (!lat || !lng) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const properties = await Property.find({
      'address.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(maxDistance),
        },
      },
      status: 'active',
    })
      .populate('agent', 'firstName lastName phone')
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: properties });
  }
);

// GET /api/properties/:id
export const getProperty = asyncHandler(
  async (req: Request, res: Response) => {
    const property = await Property.findById(req.params.id)
      .populate('agent', 'firstName lastName email phone avatar brokerage');

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    // Increment view count
    property.views += 1;
    await property.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, data: property });
  }
);

// POST /api/properties
export const createProperty = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    req.body.agent = req.user!._id;
    req.body.priceHistory = [
      { price: req.body.price, date: new Date(), event: 'listed' },
    ];

    const property = await Property.create(req.body);
    res.status(201).json({ success: true, data: property });
  }
);

// PUT /api/properties/:id
export const updateProperty = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    let property = await Property.findById(req.params.id);
    if (!property) {
      throw new AppError('Property not found', 404);
    }

    // Only allow the listing agent or admin to update
    if (
      property.agent.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      throw new AppError('Not authorized to update this property', 403);
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: property });
  }
);

// DELETE /api/properties/:id
export const deleteProperty = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
      throw new AppError('Property not found', 404);
    }

    if (
      property.agent.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      throw new AppError('Not authorized to delete this property', 403);
    }

    await property.deleteOne();
    res.status(200).json({ success: true, data: null });
  }
);

// GET /api/properties/cities — distinct city list for search autocomplete
export const getCities = asyncHandler(
  async (_req: Request, res: Response) => {
    const cities: string[] = await Property.distinct('address.city');
    const neighbourhoods: string[] = await Property.distinct('neighbourhood');
    const combined = Array.from(
      new Set([...cities, ...neighbourhoods.filter(Boolean)])
    ).sort();
    res.status(200).json({ success: true, data: combined });
  }
);

// GET /api/properties/stats/market
export const getMarketStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { city } = req.query;
    const matchStage: Record<string, any> = {};
    if (city) matchStage['address.city'] = new RegExp(city as string, 'i');

    const stats = await Property.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          medianPrice: { $avg: '$price' }, // simplified
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgDaysOnMarket: { $avg: { $subtract: [new Date(), '$listedDate'] } },
        },
      },
    ]);

    const neighbourhoodStats = await Property.aggregate([
      { $match: { ...matchStage, status: 'active' } },
      {
        $group: {
          _id: '$neighbourhood',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgBedrooms: { $avg: '$bedrooms' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: { byStatus: stats, topNeighbourhoods: neighbourhoodStats },
    });
  }
);
