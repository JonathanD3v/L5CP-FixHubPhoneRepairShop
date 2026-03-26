const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Only JPEG, PNG and GIF are allowed.', 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('file');

// Upload media
exports.uploadMedia = catchAsync(async (req, res) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    status: 'error',
                    message: 'File size too large. Maximum size is 5MB.'
                });
            }
            return res.status(400).json({
                status: 'error',
                message: err.message
            });
        } else if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        // Return the file information
        res.json({
            status: 'success',
            data: {
                file: {
                    filename: req.file.filename,
                    path: `/uploads/${req.file.filename}`,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            }
        });
    });
});

// Delete media
exports.deleteMedia = catchAsync(async (req, res) => {
    const filePath = path.join(__dirname, '../../uploads', req.params.id);

    try {
        await fs.promises.access(filePath);
        await fs.promises.unlink(filePath);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        throw new AppError('File not found', 404);
    }
});

// Get all media
exports.getAllMedia = catchAsync(async (req, res) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
        const files = await fs.promises.readdir(uploadDir);
        const fileDetails = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(uploadDir, file);
                const stats = await fs.promises.stat(filePath);
                return {
                    filename: file,
                    path: `/uploads/${file}`,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            })
        );

        res.json({
            status: 'success',
            data: { files: fileDetails }
        });
    } catch (error) {
        throw new AppError('Error reading media directory', 500);
    }
}); 