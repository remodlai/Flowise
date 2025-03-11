"use strict";
/**
 * Multi-Modal Utilities
 *
 * This file contains utilities for handling multi-modal content in messages,
 * particularly focusing on image processing and integration with storage systems.
 * It supports both Supabase Storage and fallback to base64 encoding when needed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmSupportsVision = exports.getImageUploads = exports.getAudioUploads = exports.addImagesToMessages = void 0;
const storageUtils_1 = require("./storageUtils");
const storageService_1 = require("./storageService");
const errors_1 = require("./errors");
/**
 * Adds images to messages for multi-modal LLM processing
 *
 * This function:
 * 1. Checks if the model supports vision capabilities
 * 2. Processes image uploads from stored files or URLs
 * 3. Uploads images to Supabase Storage with proper metadata
 * 4. Falls back to base64 encoding if storage upload fails
 * 5. Returns properly formatted image content for the LLM
 *
 * @param nodeData - Data from the node
 * @param options - Common options including uploads and chatflow info
 * @param multiModalOption - Options for multi-modal processing
 * @returns Array of image content objects ready for the LLM
 */
const addImagesToMessages = async (nodeData, options, multiModalOption) => {
    const imageContent = [];
    let model = nodeData.inputs?.model;
    if ((0, exports.llmSupportsVision)(model) && multiModalOption) {
        // Image Uploaded
        if (multiModalOption.image && multiModalOption.image.allowImageUploads && options?.uploads && options?.uploads.length > 0) {
            const imageUploads = (0, exports.getImageUploads)(options.uploads);
            // Create authentication context from available information
            const authContext = {
                userId: options.userId || 'anonymous',
                orgId: options.orgId,
                appId: options.chatflowid
            };
            for (const upload of imageUploads) {
                if (upload.type == 'stored-file') {
                    try {
                        // Get the file from storage
                        const contents = await (0, storageUtils_1.getFileFromStorage)(upload.name, options.chatflowid, options.chatId);
                        if (contents) {
                            try {
                                // Try to upload to storage service first
                                const fileBuffer = Buffer.from(contents);
                                const contentType = upload.mime || 'image/jpeg';
                                // Use the application-specific upload function
                                const result = await (0, storageService_1.uploadApplicationFile)(options.chatflowid, fileBuffer, {
                                    name: upload.name,
                                    contentType: contentType,
                                    resourceType: storageService_1.FILE_RESOURCE_TYPES.IMAGE,
                                    resourceId: options.chatId, // Associate with chat ID
                                    isPublic: true,
                                    metadata: {
                                        originalName: upload.name,
                                        chatId: options.chatId,
                                        nodeId: nodeData.id,
                                        width: 1000,
                                        quality: 80
                                    },
                                    virtualPath: 'uploads'
                                }, authContext);
                                if (result.url) {
                                    // Use the URL from the storage service
                                    imageContent.push({
                                        type: 'image_url',
                                        image_url: {
                                            url: result.url
                                        }
                                    });
                                    continue; // Skip base64 encoding
                                }
                            }
                            catch (error) {
                                // Handle storage errors
                                if (error instanceof errors_1.StorageError) {
                                    console.warn(`Storage error (${error.code}): ${error.message}`);
                                }
                                else {
                                    console.warn('Failed to upload to storage, falling back to base64:', error);
                                }
                                // Continue to base64 fallback
                            }
                            // Fallback to base64 encoding if storage upload fails
                            const base64 = Buffer.from(contents).toString('base64');
                            const mimeType = upload.mime || 'image/jpeg';
                            imageContent.push({
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`
                                }
                            });
                        }
                    }
                    catch (error) {
                        console.error('Error processing stored file:', error);
                    }
                }
                else if (upload.type === 'url') {
                    // Handle URL uploads directly
                    imageContent.push({
                        type: 'image_url',
                        image_url: {
                            url: upload.data || '' // Use data property instead of url
                        }
                    });
                }
            }
        }
    }
    return imageContent;
};
exports.addImagesToMessages = addImagesToMessages;
/**
 * Filters uploads to get only audio files
 *
 * @param uploads - Array of file uploads
 * @returns Array of audio file uploads
 */
const getAudioUploads = (uploads) => {
    return uploads.filter((upload) => upload.mime?.startsWith('audio/'));
};
exports.getAudioUploads = getAudioUploads;
/**
 * Filters uploads to get only image files
 *
 * @param uploads - Array of file uploads
 * @returns Array of image file uploads
 */
const getImageUploads = (uploads) => {
    return uploads.filter((upload) => upload.mime?.startsWith('image/'));
};
exports.getImageUploads = getImageUploads;
/**
 * Type guard to check if a model supports vision capabilities
 *
 * @param value - The value to check
 * @returns Boolean indicating if the model supports vision
 */
const llmSupportsVision = (value) => !!value?.multiModalOption;
exports.llmSupportsVision = llmSupportsVision;
//# sourceMappingURL=multiModalUtils.js.map