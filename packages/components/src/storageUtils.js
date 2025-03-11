"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3Config = exports.streamStorageFile = exports.removeFolderFromStorage = exports.removeSpecificFileFromStorage = exports.removeSpecificFileFromUpload = exports.removeFilesFromStorage = exports.getStorageType = exports.getStoragePath = exports.getFileFromStorage = exports.getFileFromUpload = exports.addSingleFileToStorage = exports.addArrayFilesToStorage = exports.addBase64FilesToStorage = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const node_stream_1 = require("node:stream");
const utils_1 = require("./utils");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const addBase64FilesToStorage = async (fileBase64, chatflowid, fileNames) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const mime = splitDataURI[0].split(':')[1].split(';')[0];
        const sanitizedFilename = _sanitizeFilename(filename);
        const Key = chatflowid + '/' + sanitizedFilename;
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        return 'FILE-STORAGE::' + JSON.stringify(fileNames);
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), chatflowid);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const sanitizedFilename = _sanitizeFilename(filename);
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        fileNames.push(sanitizedFilename);
        return 'FILE-STORAGE::' + JSON.stringify(fileNames);
    }
};
exports.addBase64FilesToStorage = addBase64FilesToStorage;
const addArrayFilesToStorage = async (mime, bf, fileName, fileNames, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        return 'FILE-STORAGE::' + JSON.stringify(fileNames);
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        fileNames.push(sanitizedFilename);
        return 'FILE-STORAGE::' + JSON.stringify(fileNames);
    }
};
exports.addArrayFilesToStorage = addArrayFilesToStorage;
const addSingleFileToStorage = async (mime, bf, fileName, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket,
            Key,
            ContentEncoding: 'base64', // required for binary data
            ContentType: mime,
            Body: bf
        });
        await s3Client.send(putObjCmd);
        return 'FILE-STORAGE::' + sanitizedFilename;
    }
    else {
        const dir = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const filePath = path_1.default.join(dir, sanitizedFilename);
        fs_1.default.writeFileSync(filePath, bf);
        return 'FILE-STORAGE::' + sanitizedFilename;
    }
};
exports.addSingleFileToStorage = addSingleFileToStorage;
const getFileFromUpload = async (filePath) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = filePath;
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const getParams = {
            Bucket,
            Key
        };
        const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
        const body = response.Body;
        if (body instanceof node_stream_1.Readable) {
            const streamToString = await body.transformToString('base64');
            if (streamToString) {
                return Buffer.from(streamToString, 'base64');
            }
        }
        // @ts-ignore
        const buffer = Buffer.concat(response.Body.toArray());
        return buffer;
    }
    else {
        return fs_1.default.readFileSync(filePath);
    }
};
exports.getFileFromUpload = getFileFromUpload;
const getFileFromStorage = async (file, ...paths) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = _sanitizeFilename(file);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const getParams = {
            Bucket,
            Key
        };
        const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
        const body = response.Body;
        if (body instanceof node_stream_1.Readable) {
            const streamToString = await body.transformToString('base64');
            if (streamToString) {
                return Buffer.from(streamToString, 'base64');
            }
        }
        // @ts-ignore
        const buffer = Buffer.concat(response.Body.toArray());
        return buffer;
    }
    else {
        const fileInStorage = path_1.default.join((0, exports.getStoragePath)(), ...paths, sanitizedFilename);
        return fs_1.default.readFileSync(fileInStorage);
    }
};
exports.getFileFromStorage = getFileFromStorage;
/**
 * Prepare storage path
 */
const getStoragePath = () => {
    return process.env.BLOB_STORAGE_PATH ? path_1.default.join(process.env.BLOB_STORAGE_PATH) : path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'storage');
};
exports.getStoragePath = getStoragePath;
/**
 * Get the storage type - local or s3
 */
const getStorageType = () => {
    return process.env.STORAGE_TYPE ? process.env.STORAGE_TYPE : 'local';
};
exports.getStorageType = getStorageType;
const removeFilesFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
    }
    else {
        const directory = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        _deleteLocalFolderRecursive(directory);
    }
};
exports.removeFilesFromStorage = removeFilesFromStorage;
const removeSpecificFileFromUpload = async (filePath) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = filePath;
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
    }
    else {
        fs_1.default.unlinkSync(filePath);
    }
};
exports.removeSpecificFileFromUpload = removeSpecificFileFromUpload;
const removeSpecificFileFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
    }
    else {
        const fileName = paths.pop();
        if (fileName) {
            const sanitizedFilename = _sanitizeFilename(fileName);
            paths.push(sanitizedFilename);
        }
        const file = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        fs_1.default.unlinkSync(file);
    }
};
exports.removeSpecificFileFromStorage = removeSpecificFileFromStorage;
const removeFolderFromStorage = async (...paths) => {
    const storageType = (0, exports.getStorageType)();
    if (storageType === 's3') {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        // remove the first '/' if it exists
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await _deleteS3Folder(Key);
    }
    else {
        const directory = path_1.default.join((0, exports.getStoragePath)(), ...paths);
        _deleteLocalFolderRecursive(directory, true);
    }
};
exports.removeFolderFromStorage = removeFolderFromStorage;
const _deleteLocalFolderRecursive = (directory, deleteParentChatflowFolder) => {
    // Console error here as failing is not destructive operation
    if (fs_1.default.existsSync(directory)) {
        if (deleteParentChatflowFolder) {
            fs_1.default.rmSync(directory, { recursive: true, force: true });
        }
        else {
            fs_1.default.readdir(directory, (error, files) => {
                if (error)
                    console.error('Could not read directory');
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const file_path = path_1.default.join(directory, file);
                    fs_1.default.stat(file_path, (error, stat) => {
                        if (error)
                            console.error('File do not exist');
                        if (!stat.isDirectory()) {
                            fs_1.default.unlink(file_path, (error) => {
                                if (error)
                                    console.error('Could not delete file');
                            });
                            if (i === files.length - 1) {
                                fs_1.default.rmSync(directory, { recursive: true, force: true });
                            }
                        }
                        else {
                            _deleteLocalFolderRecursive(file_path);
                        }
                    });
                }
            });
        }
    }
};
const _deleteS3Folder = async (location) => {
    let count = 0; // number of files deleted
    const { s3Client, Bucket } = (0, exports.getS3Config)();
    async function recursiveS3Delete(token) {
        // get the files
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: Bucket,
            Prefix: location,
            ContinuationToken: token
        });
        let list = await s3Client.send(listCommand);
        if (list.KeyCount) {
            const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                Bucket: Bucket,
                Delete: {
                    Objects: list.Contents?.map((item) => ({ Key: item.Key })),
                    Quiet: false
                }
            });
            let deleted = await s3Client.send(deleteCommand);
            // @ts-ignore
            count += deleted.Deleted.length;
            if (deleted.Errors) {
                deleted.Errors.map((error) => console.error(`${error.Key} could not be deleted - ${error.Code}`));
            }
        }
        // repeat if more files to delete
        if (list.NextContinuationToken) {
            await recursiveS3Delete(list.NextContinuationToken);
        }
        // return total deleted count when finished
        return `${count} files deleted from S3`;
    }
    // start the recursive function
    return recursiveS3Delete();
};
const streamStorageFile = async (chatflowId, chatId, fileName) => {
    const storageType = (0, exports.getStorageType)();
    const sanitizedFilename = (0, sanitize_filename_1.default)(fileName);
    if (storageType === 's3') {
        const { s3Client, Bucket } = (0, exports.getS3Config)();
        const Key = chatflowId + '/' + chatId + '/' + sanitizedFilename;
        const getParams = {
            Bucket,
            Key
        };
        const response = await s3Client.send(new client_s3_1.GetObjectCommand(getParams));
        const body = response.Body;
        if (body instanceof node_stream_1.Readable) {
            const blob = await body.transformToByteArray();
            return Buffer.from(blob);
        }
    }
    else {
        const filePath = path_1.default.join((0, exports.getStoragePath)(), chatflowId, chatId, sanitizedFilename);
        //raise error if file path is not absolute
        if (!path_1.default.isAbsolute(filePath))
            throw new Error(`Invalid file path`);
        //raise error if file path contains '..'
        if (filePath.includes('..'))
            throw new Error(`Invalid file path`);
        //only return from the storage folder
        if (!filePath.startsWith((0, exports.getStoragePath)()))
            throw new Error(`Invalid file path`);
        if (fs_1.default.existsSync(filePath)) {
            return fs_1.default.createReadStream(filePath);
        }
        else {
            throw new Error(`File ${fileName} not found`);
        }
    }
};
exports.streamStorageFile = streamStorageFile;
const getS3Config = () => {
    const accessKeyId = process.env.S3_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_STORAGE_SECRET_ACCESS_KEY;
    const region = process.env.S3_STORAGE_REGION;
    const Bucket = process.env.S3_STORAGE_BUCKET_NAME;
    const customURL = process.env.S3_ENDPOINT_URL;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' ? true : false;
    if (!region || !Bucket) {
        throw new Error('S3 storage configuration is missing');
    }
    let credentials;
    if (accessKeyId && secretAccessKey) {
        credentials = {
            accessKeyId,
            secretAccessKey
        };
    }
    const s3Client = new client_s3_1.S3Client({
        credentials,
        region,
        endpoint: customURL,
        forcePathStyle: forcePathStyle
    });
    return { s3Client, Bucket };
};
exports.getS3Config = getS3Config;
const _sanitizeFilename = (filename) => {
    if (filename) {
        let sanitizedFilename = (0, sanitize_filename_1.default)(filename);
        // remove all leading .
        return sanitizedFilename.replace(/^\.+/, '');
    }
    return '';
};
//# sourceMappingURL=storageUtils.js.map