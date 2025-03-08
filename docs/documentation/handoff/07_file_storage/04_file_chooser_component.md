# Phase 4: File Chooser Component

This document outlines the implementation of a File Chooser Component that allows users to browse, select, and manage previously uploaded files across the Remodl AI platform.

## 4.1 Component Overview

The File Chooser Component provides a unified interface for accessing files stored in Supabase Storage. It enables users to:

1. Browse files by context (user, organization, application)
2. Search and filter files by name, type, and metadata
3. Preview files before selection
4. Select files for use in various platform features
5. Manage files (rename, delete, organize)

## 4.2 Component Architecture

### Component Structure

```
FileChooser/
├── index.tsx                 # Main component export
├── FileChooserDialog.tsx     # Modal dialog component
├── FileChooserButton.tsx     # Trigger button component
├── FileList.tsx              # File listing component
├── FilePreview.tsx           # File preview component
├── FileUpload.tsx            # File upload component
├── FileSearch.tsx            # Search and filter component
├── FileBreadcrumbs.tsx       # Navigation breadcrumbs
└── hooks/
    ├── useFileChooser.ts     # Main hook for file operations
    ├── useFileUpload.ts      # Hook for file upload functionality
    └── useFilePreview.ts     # Hook for file preview functionality
```

### Component Integration

The File Chooser can be integrated in various parts of the platform:

1. **Chat Interface**: For selecting files during conversations
2. **Document Store**: For managing document collections
3. **Content Editor**: For inserting files into content
4. **Settings Pages**: For managing user/organization files

## 4.3 File Chooser Dialog Implementation

```tsx
// packages/ui/src/components/FileChooser/FileChooserDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  CircularProgress
} from '@mui/material';
import FileList from './FileList';
import FilePreview from './FilePreview';
import FileUpload from './FileUpload';
import FileSearch from './FileSearch';
import FileBreadcrumbs from './FileBreadcrumbs';
import { useFileChooser } from './hooks/useFileChooser';

export interface FileChooserDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (files: Array<{
    path: string;
    url: string;
    name: string;
    contentType: string;
    size: number;
  }>) => void;
  multiple?: boolean;
  allowedTypes?: string[];
  context?: 'user' | 'organization' | 'application';
  contextId?: string;
  resourceType?: string;
}

export default function FileChooserDialog({
  open,
  onClose,
  onSelect,
  multiple = false,
  allowedTypes,
  context = 'user',
  contextId,
  resourceType
}: FileChooserDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  
  const {
    files,
    loading,
    error,
    fetchFiles,
    uploadFile,
    deleteFile
  } = useFileChooser({
    context,
    contextId,
    resourceType
  });
  
  // Fetch files when the component mounts or when dependencies change
  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, context, contextId, resourceType, currentPath]);
  
  // Handle file selection
  const handleFileSelect = (file) => {
    if (multiple) {
      const fileIndex = selectedFiles.findIndex(f => f.path === file.path);
      if (fileIndex >= 0) {
        setSelectedFiles(selectedFiles.filter(f => f.path !== file.path));
      } else {
        setSelectedFiles([...selectedFiles, file]);
      }
    } else {
      setSelectedFiles([file]);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (files) => {
    try {
      await Promise.all(files.map(file => uploadFile(file)));
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };
  
  // Handle file deletion
  const handleFileDelete = async (file) => {
    try {
      await deleteFile(file.path);
      setSelectedFiles(selectedFiles.filter(f => f.path !== file.path));
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Handle navigation
  const handleNavigate = (path) => {
    setCurrentPath(path);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle file selection confirmation
  const handleConfirm = () => {
    onSelect(selectedFiles);
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Select Files
      </DialogTitle>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        centered
      >
        <Tab label="Browse" />
        <Tab label="Upload" />
      </Tabs>
      
      <DialogContent>
        {activeTab === 0 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <FileSearch onSearch={handleSearch} />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FileBreadcrumbs
                path={currentPath}
                onNavigate={handleNavigate}
              />
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ color: 'error.main', p: 2 }}>
                Error loading files: {error.message}
              </Box>
            ) : (
              <FileList
                files={files.filter(file => 
                  !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                selectedFiles={selectedFiles}
                onSelect={handleFileSelect}
                onDelete={handleFileDelete}
                onNavigate={handleNavigate}
                allowedTypes={allowedTypes}
              />
            )}
          </Box>
        )}
        
        {activeTab === 1 && (
          <FileUpload
            onUpload={handleFileUpload}
            allowedTypes={allowedTypes}
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedFiles.length === 0}
        >
          Select {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## 4.4 File Chooser Hook Implementation

```tsx
// packages/ui/src/components/FileChooser/hooks/useFileChooser.ts

import { useState, useCallback } from 'react';
import { listFiles, uploadFile as uploadFileToStorage, deleteFile as deleteFileFromStorage } from '@/api/files';

interface UseFileChooserOptions {
  context?: 'user' | 'organization' | 'application';
  contextId?: string;
  resourceType?: string;
}

export function useFileChooser({
  context = 'user',
  contextId,
  resourceType
}: UseFileChooserOptions = {}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch files from the API
  const fetchFiles = useCallback(async (path = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await listFiles({
        context,
        contextId,
        resourceType,
        path
      });
      
      setFiles(response.files);
    } catch (err) {
      setError(err);
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [context, contextId, resourceType]);
  
  // Upload a file
  const uploadFile = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context);
      if (contextId) formData.append('contextId', contextId);
      if (resourceType) formData.append('resourceType', resourceType);
      
      const response = await uploadFileToStorage(formData);
      
      return response;
    } catch (err) {
      setError(err);
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [context, contextId, resourceType]);
  
  // Delete a file
  const deleteFile = useCallback(async (path) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteFileFromStorage(path);
      
      // Remove the file from the local state
      setFiles(files.filter(file => file.path !== path));
      
      return true;
    } catch (err) {
      setError(err);
      console.error('Error deleting file:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [files]);
  
  return {
    files,
    loading,
    error,
    fetchFiles,
    uploadFile,
    deleteFile
  };
}
```

## 4.5 File Preview Component

```tsx
// packages/ui/src/components/FileChooser/FilePreview.tsx

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import {
  IconDownload,
  IconX
} from '@tabler/icons-react';

interface FilePreviewProps {
  file: {
    name: string;
    url: string;
    contentType: string;
    size: number;
  };
  onClose: () => void;
}

export default function FilePreview({ file, onClose }: FilePreviewProps) {
  const isImage = file.contentType.startsWith('image/');
  const isPdf = file.contentType === 'application/pdf';
  const isText = file.contentType.startsWith('text/');
  const isAudio = file.contentType.startsWith('audio/');
  const isVideo = file.contentType.startsWith('video/');
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        position: 'relative',
        maxHeight: '500px',
        overflow: 'auto'
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <IconButton onClick={onClose} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" noWrap>
          {file.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {file.contentType} • {formatFileSize(file.size)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {isImage && (
          <img
            src={file.url}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
          />
        )}
        
        {isPdf && (
          <iframe
            src={`${file.url}#view=FitH`}
            title={file.name}
            width="100%"
            height="300px"
          />
        )}
        
        {isText && (
          <Box
            sx={{
              width: '100%',
              height: '300px',
              overflow: 'auto',
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <iframe
              src={file.url}
              title={file.name}
              width="100%"
              height="100%"
            />
          </Box>
        )}
        
        {isAudio && (
          <audio controls src={file.url} style={{ width: '100%' }} />
        )}
        
        {isVideo && (
          <video
            controls
            src={file.url}
            style={{ maxWidth: '100%', maxHeight: '300px' }}
          />
        )}
        
        {!isImage && !isPdf && !isText && !isAudio && !isVideo && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              width: '100%',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              Preview not available
            </Typography>
            <IconButton
              component="a"
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconDownload />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <IconButton
          component="a"
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconDownload />
        </IconButton>
      </Box>
    </Paper>
  );
}
```

## 4.6 File List Component

```tsx
// packages/ui/src/components/FileChooser/FileList.tsx

import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Grid
} from '@mui/material';
import {
  IconFile,
  IconFileText,
  IconFileZip,
  IconFileSpreadsheet,
  IconFileCode,
  IconFilePdf,
  IconFileMusic,
  IconFileVideo,
  IconPhoto,
  IconFolder,
  IconDotsVertical,
  IconTrash,
  IconDownload,
  IconEye
} from '@tabler/icons-react';
import FilePreview from './FilePreview';

interface FileListProps {
  files: Array<{
    name: string;
    path: string;
    url: string;
    contentType: string;
    size: number;
    isFolder?: boolean;
  }>;
  selectedFiles: any[];
  onSelect: (file: any) => void;
  onDelete: (file: any) => void;
  onNavigate: (path: string) => void;
  allowedTypes?: string[];
}

export default function FileList({
  files,
  selectedFiles,
  onSelect,
  onDelete,
  onNavigate,
  allowedTypes
}: FileListProps) {
  const [previewFile, setPreviewFile] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  
  // Get file icon based on content type
  const getFileIcon = (file) => {
    if (file.isFolder) return <IconFolder />;
    
    const contentType = file.contentType || '';
    
    if (contentType.startsWith('image/')) return <IconPhoto />;
    if (contentType === 'application/pdf') return <IconFilePdf />;
    if (contentType.startsWith('text/')) return <IconFileText />;
    if (contentType.startsWith('audio/')) return <IconFileMusic />;
    if (contentType.startsWith('video/')) return <IconFileVideo />;
    if (contentType.includes('spreadsheet')) return <IconFileSpreadsheet />;
    if (contentType.includes('zip') || contentType.includes('compressed')) return <IconFileZip />;
    if (contentType.includes('javascript') || contentType.includes('json') || contentType.includes('html') || contentType.includes('css')) return <IconFileCode />;
    
    return <IconFile />;
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Check if file is allowed based on content type
  const isFileAllowed = (file) => {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    if (file.isFolder) return true;
    return allowedTypes.some(type => file.contentType.startsWith(type));
  };
  
  // Handle menu open
  const handleMenuOpen = (event, file) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveFile(file);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveFile(null);
  };
  
  // Handle file preview
  const handlePreview = () => {
    setPreviewFile(activeFile);
    handleMenuClose();
  };
  
  // Handle file download
  const handleDownload = () => {
    window.open(activeFile.url, '_blank');
    handleMenuClose();
  };
  
  // Handle file delete
  const handleDelete = () => {
    onDelete(activeFile);
    handleMenuClose();
  };
  
  // Handle folder navigation
  const handleFolderClick = (file) => {
    if (file.isFolder) {
      onNavigate(file.path);
    }
  };
  
  return (
    <Box>
      {files.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No files found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.path}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, file)}
                  >
                    <IconDotsVertical />
                  </IconButton>
                }
                sx={{
                  opacity: isFileAllowed(file) ? 1 : 0.5,
                  pointerEvents: isFileAllowed(file) ? 'auto' : 'none'
                }}
              >
                <ListItemButton
                  onClick={() => file.isFolder ? handleFolderClick(file) : onSelect(file)}
                  selected={selectedFiles.some(f => f.path === file.path)}
                  dense
                >
                  <ListItemIcon>
                    {getFileIcon(file)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={!file.isFolder ? formatFileSize(file.size) : ''}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  {!file.isFolder && (
                    <Checkbox
                      edge="start"
                      checked={selectedFiles.some(f => f.path === file.path)}
                      tabIndex={-1}
                      disableRipple
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(file);
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* File menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {activeFile && !activeFile.isFolder && (
          <MenuItem onClick={handlePreview}>
            <ListItemIcon>
              <IconEye size={18} />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
        )}
        {activeFile && !activeFile.isFolder && (
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <IconDownload size={18} />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <IconTrash size={18} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* File preview dialog */}
      {previewFile && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <FilePreview
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        </Box>
      )}
    </Box>
  );
}
```

## 4.7 Integration with Chat Interface

To integrate the File Chooser with the chat interface, we can add a button that opens the File Chooser dialog:

```tsx
// packages/ui/src/components/Chat/ChatInput.tsx

import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { IconSend, IconPaperclip } from '@tabler/icons-react';
import FileChooserDialog from '../FileChooser/FileChooserDialog';

interface ChatInputProps {
  onSend: (message: string, attachments?: any[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [fileChooserOpen, setFileChooserOpen] = useState(false);
  
  // Handle message send
  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments);
      setMessage('');
      setAttachments([]);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Handle file selection
  const handleFileSelect = (files) => {
    setAttachments([...attachments, ...files]);
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
      <Tooltip title="Attach files">
        <IconButton
          onClick={() => setFileChooserOpen(true)}
          disabled={disabled}
        >
          <IconPaperclip />
        </IconButton>
      </Tooltip>
      
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        sx={{ mx: 1 }}
      />
      
      <Tooltip title="Send message">
        <IconButton
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          color="primary"
        >
          <IconSend />
        </IconButton>
      </Tooltip>
      
      <FileChooserDialog
        open={fileChooserOpen}
        onClose={() => setFileChooserOpen(false)}
        onSelect={handleFileSelect}
        multiple
      />
    </Box>
  );
}
```

## 4.8 API Client Implementation

To support the File Chooser component, we need to implement the API client functions:

```typescript
// packages/ui/src/api/files.js

import { apiRequest } from './api';

/**
 * List files
 * @param {Object} options - List options
 * @returns {Promise<Object>} - List response
 */
export const listFiles = async (options = {}) => {
  const { context, contextId, resourceType, path, limit, offset, sortBy, sortOrder } = options;
  
  const queryParams = new URLSearchParams();
  if (context) queryParams.append('context', context);
  if (contextId) queryParams.append('contextId', contextId);
  if (resourceType) queryParams.append('resourceType', resourceType);
  if (path) queryParams.append('path', path);
  if (limit) queryParams.append('limit', limit.toString());
  if (offset) queryParams.append('offset', offset.toString());
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);
  
  return apiRequest(`/api/v1/files?${queryParams.toString()}`, {
    method: 'GET'
  });
};

/**
 * Upload a file
 * @param {FormData} formData - Form data with file and metadata
 * @returns {Promise<Object>} - Upload response
 */
export const uploadFile = async (formData) => {
  return apiRequest('/api/v1/files', {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type header, it will be set automatically with the boundary
    }
  });
};

/**
 * Upload an image
 * @param {FormData} formData - Form data with image and metadata
 * @returns {Promise<Object>} - Upload response
 */
export const uploadImage = async (formData) => {
  return apiRequest('/api/v1/files/images', {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type header, it will be set automatically with the boundary
    }
  });
};

/**
 * Get file details
 * @param {string} id - File ID (path)
 * @param {Object} options - Options
 * @returns {Promise<Object>} - File details
 */
export const getFile = async (id, options = {}) => {
  const { download } = options;
  
  const queryParams = new URLSearchParams();
  if (download) queryParams.append('download', 'true');
  
  return apiRequest(`/api/v1/files/${id}?${queryParams.toString()}`, {
    method: 'GET'
  });
};

/**
 * Delete a file
 * @param {string} id - File ID (path)
 * @returns {Promise<Object>} - Delete response
 */
export const deleteFile = async (id) => {
  return apiRequest(`/api/v1/files/${id}`, {
    method: 'DELETE'
  });
};
```

## 4.9 Implementation Steps

1. **Create Base Components**:
   - Implement the `FileChooserDialog` component
   - Implement the `FileList` component
   - Implement the `FilePreview` component

2. **Create Hooks**:
   - Implement the `useFileChooser` hook
   - Implement the `useFileUpload` hook
   - Implement the `useFilePreview` hook

3. **Implement API Client**:
   - Create the file API client functions
   - Ensure proper error handling

4. **Integrate with Platform**:
   - Add the File Chooser to the chat interface
   - Add the File Chooser to the document store
   - Add the File Chooser to other relevant parts of the platform

5. **Test Functionality**:
   - Test file browsing and selection
   - Test file upload and deletion
   - Test integration with other platform features

## 4.10 Key Considerations

1. **Performance**: Optimize file listing and preview for large numbers of files
2. **User Experience**: Ensure intuitive navigation and file management
3. **Accessibility**: Implement keyboard navigation and screen reader support
4. **Mobile Support**: Ensure the component works well on mobile devices
5. **Error Handling**: Provide clear feedback for file operations 