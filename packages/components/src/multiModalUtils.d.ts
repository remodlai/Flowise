/**
 * Multi-Modal Utilities
 *
 * This file contains utilities for handling multi-modal content in messages,
 * particularly focusing on image processing and integration with storage systems.
 * It supports both Supabase Storage and fallback to base64 encoding when needed.
 */
import { IVisionChatModal, ICommonObject, IFileUpload, IMultiModalOption, INodeData, MessageContentImageUrl } from './Interface';
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
export declare const addImagesToMessages: (nodeData: INodeData, options: ICommonObject, multiModalOption?: IMultiModalOption) => Promise<MessageContentImageUrl[]>;
/**
 * Filters uploads to get only audio files
 *
 * @param uploads - Array of file uploads
 * @returns Array of audio file uploads
 */
export declare const getAudioUploads: (uploads: IFileUpload[]) => IFileUpload[];
/**
 * Filters uploads to get only image files
 *
 * @param uploads - Array of file uploads
 * @returns Array of image file uploads
 */
export declare const getImageUploads: (uploads: IFileUpload[]) => IFileUpload[];
/**
 * Type guard to check if a model supports vision capabilities
 *
 * @param value - The value to check
 * @returns Boolean indicating if the model supports vision
 */
export declare const llmSupportsVision: (value: any) => value is IVisionChatModal;
