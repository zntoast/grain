import type { GrainDataSnapshot } from '../types';

type FilePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type PermissionMode = 'read' | 'readwrite';

type FileSystemPermissionDescriptor = {
  mode?: PermissionMode;
};

type FileSystemWritableFileStream = WritableStream & {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
};

export type GrainFileHandle = {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
  queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
};

type FileSystemAccessWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
  }) => Promise<GrainFileHandle[]>;
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: FilePickerAcceptType[];
    excludeAcceptAllOption?: boolean;
  }) => Promise<GrainFileHandle>;
};

const DB_NAME = 'grain_data_file';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'primary';

const JSON_FILE_TYPE: FilePickerAcceptType = {
  description: 'Grain data JSON',
  accept: { 'application/json': ['.json'] },
};

export const isFileSystemAccessSupported = () => {
  const browserWindow = window as FileSystemAccessWindow;
  return Boolean(browserWindow.showOpenFilePicker && browserWindow.showSaveFilePicker);
};

const openHandleDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openHandleDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

export const getSavedDataFileHandle = async () => {
  if (!isFileSystemAccessSupported()) return null;
  try {
    return (await withStore('readonly', (store) => store.get(HANDLE_KEY))) as GrainFileHandle | undefined || null;
  } catch {
    return null;
  }
};

export const rememberDataFileHandle = async (handle: GrainFileHandle) => {
  await withStore('readwrite', (store) => store.put(handle, HANDLE_KEY));
};

export const forgetDataFileHandle = async () => {
  await withStore('readwrite', (store) => store.delete(HANDLE_KEY));
};

export const chooseExistingDataFile = async () => {
  const browserWindow = window as FileSystemAccessWindow;
  if (!browserWindow.showOpenFilePicker) {
    throw new Error('当前浏览器不支持直接选择本地数据文件');
  }
  const [handle] = await browserWindow.showOpenFilePicker({
    multiple: false,
    types: [JSON_FILE_TYPE],
    excludeAcceptAllOption: false,
  });
  await rememberDataFileHandle(handle);
  return handle;
};

export const createDataFile = async () => {
  const browserWindow = window as FileSystemAccessWindow;
  if (!browserWindow.showSaveFilePicker) {
    throw new Error('当前浏览器不支持直接创建本地数据文件');
  }
  const handle = await browserWindow.showSaveFilePicker({
    suggestedName: 'grain-data.json',
    types: [JSON_FILE_TYPE],
    excludeAcceptAllOption: false,
  });
  await rememberDataFileHandle(handle);
  return handle;
};

export const ensurePermission = async (handle: GrainFileHandle, mode: PermissionMode) => {
  const descriptor = { mode };
  if (handle.queryPermission && (await handle.queryPermission(descriptor)) === 'granted') {
    return;
  }
  if (handle.requestPermission && (await handle.requestPermission(descriptor)) === 'granted') {
    return;
  }
  throw new Error('没有获得本地数据文件权限');
};

export const writeSnapshotToFile = async (handle: GrainFileHandle, snapshot: GrainDataSnapshot) => {
  await ensurePermission(handle, 'readwrite');
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(snapshot, null, 2));
  await writable.close();
};

export const readSnapshotFromFile = async (handle: GrainFileHandle) => {
  await ensurePermission(handle, 'read');
  const file = await handle.getFile();
  return JSON.parse(await file.text()) as Partial<GrainDataSnapshot>;
};

export const downloadSnapshot = (snapshot: GrainDataSnapshot) => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `grain-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const readSnapshotFromUpload = async (file: File) => {
  return JSON.parse(await file.text()) as Partial<GrainDataSnapshot>;
};
