/**
 * Platform Assets Routes
 * 
 * This file defines the routes for platform assets (images, files, media).
 * All routes follow the pattern /api/v1/platform/assets/[resource-type]/[operation]
 */
import express from 'express';
import multer from 'multer';
import * as assetsController from '../controllers/assetsController';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Image routes
router.get('/images', assetsController.listImages);
router.post('/images/upload', upload.single('file'), assetsController.uploadImage);
router.get('/images/:id', assetsController.getImage);
router.put('/images/:id', assetsController.updateImage);
router.delete('/images/:id', assetsController.softDeleteImage);
router.post('/images/:id/restore', assetsController.restoreImage);
router.get('/images/deleted', assetsController.listDeletedImages);

// New routes for image URL and content
router.get('/images/:id/url', assetsController.getImageUrl);
router.get('/images/:id/content', assetsController.getImageContent);

export default router; 