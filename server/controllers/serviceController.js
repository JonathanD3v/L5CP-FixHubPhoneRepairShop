const Service = require("../models/Service");
const path = require("path");
const fs = require("fs");

exports.createService = async (req, res) => {
  try {
    // Parse form data values to correct types
    const serviceData = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      estimatedTime: req.body.estimatedTime
        ? parseInt(req.body.estimatedTime)
        : undefined,
      isActive: req.body.isActive === "true" || req.body.isActive === true,
      popular: req.body.popular === "true" || req.body.popular === true,
    };

    // Handle image upload
    if (req.file) {
      serviceData.image = `/uploads/services/${req.file.filename}`;
    }

    const service = await Service.create(serviceData);

    res.status(201).json({
      status: "success",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    let query = {};

    // filter by category

    if (category && category !== "all") {
      query.category = category;
    }

    // search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Service.countDocuments(query);

    const services = await Service.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      data: services,
      total,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        status: "error",
        message: "Service not found",
      });
    }
    res.json({
      status: "success",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    // Parse form data values to correct types
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.category !== undefined)
      updateData.category = req.body.category;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.price !== undefined)
      updateData.price = parseFloat(req.body.price);
    if (req.body.estimatedTime !== undefined)
      updateData.estimatedTime = parseInt(req.body.estimatedTime);
    if (req.body.isActive !== undefined)
      updateData.isActive =
        req.body.isActive === "true" || req.body.isActive === true;
    if (req.body.popular !== undefined)
      updateData.popular =
        req.body.popular === "true" || req.body.popular === true;

    // Handle image upload
    if (req.file) {
      // Get existing service to delete old image
      const existingService = await Service.findById(req.params.id);
      if (existingService && existingService.image) {
        const oldImagePath = path.join(__dirname, "..", existingService.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/services/${req.file.filename}`;
    }

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({
        status: "error",
        message: "Service not found",
      });
    }
    res.json({
      status: "success",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({
        status: "error",
        message: "Service not found",
      });
    }
    res.json({
      status: "success",
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        status: "error",
        message: "Service not found",
      });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      status: "success",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getPopularServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(5);

    res.json({
      status: "success",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
