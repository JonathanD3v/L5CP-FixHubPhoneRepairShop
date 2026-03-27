const Service = require("../../models/Service");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const path = require("path");
const fs = require("fs");

// Get all services with pagination and filtering
exports.getAllServices = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.category && req.query.category !== "all") {
    query.category = req.query.category;
  }
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === "true";
  }

  const [services, total] = await Promise.all([
    Service.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Service.countDocuments(query),
  ]);

  res.json({
    status: "success",
    data: {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get single service
exports.getService = catchAsync(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new AppError("Service not found", 404);
  }
  res.json({
    status: "success",
    data: { service },
  });
});

// Create new service
exports.createService = catchAsync(async (req, res) => {
  // Handle image paths
  let image = "";
  if (req.file) {
    image = `/uploads/services/${req.file.filename}`;
  } else if (
    req.body.image &&
    typeof req.body.image === "string" &&
    req.body.image.trim() !== ""
  ) {
    image = req.body.image;
  }

  const serviceData = {
    ...req.body,
    image,
    price: Number(req.body.price),
    cost: Number(req.body.cost) || 0,
    estimatedTime: Number(req.body.estimatedTime),
    isActive: req.body.isActive !== "false",
    popular: req.body.popular === "true",
  };

  const service = await Service.create(serviceData);
  res.status(201).json({
    status: "success",
    data: { service },
  });
});

// Update service
exports.updateService = catchAsync(async (req, res) => {
  const existingService = await Service.findById(req.params.id);
  if (!existingService) {
    throw new AppError("Service not found", 404);
  }

  // Handle image paths
  let image = existingService.image || "";

  // If a new file is uploaded, delete the old one and use the new one
  if (req.file) {
    // Delete old image file if it exists
    if (existingService.image) {
      const oldImagePath = path.join(
        __dirname,
        "../../uploads",
        existingService.image.replace(/^\/uploads\//, ""),
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    // Set new image path
    image = `/uploads/services/${req.file.filename}`;
  } else if (
    req.body.image &&
    typeof req.body.image === "string" &&
    req.body.image.trim() !== "" &&
    req.body.image !== existingService.image
  ) {
    // Only update image if a new path is provided and it's different from existing
    image = req.body.image;
  }

  const serviceData = {
    ...req.body,
    image,
    price: req.body.price ? Number(req.body.price) : undefined,
    cost: req.body.cost !== undefined ? Number(req.body.cost) : undefined,
    estimatedTime: req.body.estimatedTime
      ? Number(req.body.estimatedTime)
      : undefined,
    isActive:
      req.body.isActive !== undefined
        ? req.body.isActive !== "false"
        : undefined,
    popular:
      req.body.popular !== undefined ? req.body.popular === "true" : undefined,
  };

  const service = await Service.findByIdAndUpdate(req.params.id, serviceData, {
    new: true,
    runValidators: true,
  });

  res.json({
    status: "success",
    data: { service },
  });
});

// Delete service
exports.deleteService = catchAsync(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  // Delete service image file if it exists
  if (service.image) {
    const imagePath = path.join(
      __dirname,
      "../../uploads",
      service.image.replace(/^\/uploads\//, ""),
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Toggle service status
exports.toggleServiceStatus = catchAsync(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  service.isActive = !service.isActive;
  await service.save();

  res.json({
    status: "success",
    data: { service },
  });
});

// Get service categories
exports.getServiceCategories = catchAsync(async (req, res) => {
  const categories = ["Phone", "Laptop", "Tablet", "Computer", "Other"];
  res.json({
    status: "success",
    data: { categories },
  });
});
