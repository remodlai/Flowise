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

// File routes (all-files)
router.get('/files', assetsController.listFiles);
router.post('/files/upload', upload.single('file'), assetsController.uploadFile);
router.get('/files/:id', assetsController.getFile);
router.put('/files/:id', assetsController.updateFile);
router.delete('/files/:id', assetsController.softDeleteFile);
router.post('/files/:id/restore', assetsController.restoreFile);
router.get('/files/:id/url', assetsController.getFileUrl);
router.get('/files/:id/content', assetsController.getFileContent);

export default router; 