// ============================================
// CoupleSpace - Storage Service (Web + Native)
// ============================================

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

const BUCKET_NAME = 'chat-media';

interface UploadResult {
    url: string | null;
    error: string | null;
}

// Dosya uzantısını al
const getFileExtension = (uri: string): string => {
    // Data URL için mime type'dan çıkar
    if (uri.startsWith('data:')) {
        const match = uri.match(/data:([^;]+)/);
        if (match) {
            const mimeType = match[1];
            const ext = mimeType.split('/')[1];
            return ext || 'bin';
        }
    }
    // Normal URL için
    const parts = uri.split('.');
    const ext = parts[parts.length - 1]?.split('?')[0]?.toLowerCase();
    return ext || 'bin';
};

// Benzersiz dosya adı oluştur
const generateFileName = (coupleId: string, type: 'image' | 'audio' | 'file', extension: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${coupleId}/${type}/${timestamp}_${random}.${extension}`;
};

// URI'den Blob oluştur (web için)
const uriToBlob = async (uri: string): Promise<Blob> => {
    // Data URL ise direkt blob'a çevir
    if (uri.startsWith('data:')) {
        const response = await fetch(uri);
        return response.blob();
    }

    // Normal URL ise fetch et
    const response = await fetch(uri);
    return response.blob();
};

// URI'den ArrayBuffer oluştur
const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    // Web platformunda veya data/blob URL ise direkt fetch kullan
    if (Platform.OS === 'web' || uri.startsWith('data:') || uri.startsWith('blob:')) {
        const blob = await uriToBlob(uri);
        return blob.arrayBuffer();
    }

    // Native platform için expo-file-system kullan
    try {
        // Legacy API kullan (deprecation warning'i önlemek için)
        const FileSystem = await import('expo-file-system/legacy');
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Base64'ü ArrayBuffer'a çevir
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (err) {
        console.error('FileSystem read error, using fetch fallback:', err);
        // Fallback: fetch ile dene
        const response = await fetch(uri);
        return response.arrayBuffer();
    }
};

// Görsel yükleme
export const uploadImage = async (
    uri: string,
    coupleId: string
): Promise<UploadResult> => {
    try {
        console.log('Uploading image:', { uri: uri.substring(0, 50), coupleId });

        const extension = getFileExtension(uri) || 'jpg';
        const fileName = generateFileName(coupleId, 'image', extension);

        let uploadData: Blob | ArrayBuffer;
        let contentType = `image/${extension}`;

        if (Platform.OS === 'web') {
            uploadData = await uriToBlob(uri);
            // Blob'dan gerçek content type'ı al
            if (uploadData.type) {
                contentType = uploadData.type;
            }
        } else {
            uploadData = await uriToArrayBuffer(uri);
        }

        console.log('Uploading to Supabase:', { fileName, contentType, size: uploadData instanceof Blob ? uploadData.size : (uploadData as ArrayBuffer).byteLength });

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, uploadData, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase image upload error:', error);
            return { url: null, error: error.message };
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        console.log('Image uploaded successfully:', urlData.publicUrl);
        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        console.error('Upload image error:', err);
        return { url: null, error: err instanceof Error ? err.message : 'Görsel yüklenemedi' };
    }
};

// Ses dosyası yükleme
export const uploadAudio = async (
    uri: string,
    coupleId: string
): Promise<UploadResult> => {
    try {
        console.log('Uploading audio:', { uri: uri.substring(0, 50), coupleId });

        const extension = getFileExtension(uri) || 'm4a';
        const fileName = generateFileName(coupleId, 'audio', extension);

        let uploadData: Blob | ArrayBuffer;
        let contentType = `audio/${extension}`;

        if (Platform.OS === 'web') {
            uploadData = await uriToBlob(uri);
            if (uploadData.type) {
                contentType = uploadData.type;
            }
        } else {
            uploadData = await uriToArrayBuffer(uri);
        }

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, uploadData, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase audio upload error:', error);
            return { url: null, error: error.message };
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        console.log('Audio uploaded successfully:', urlData.publicUrl);
        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        console.error('Upload audio error:', err);
        return { url: null, error: err instanceof Error ? err.message : 'Ses dosyası yüklenemedi' };
    }
};

// Dosya yükleme
export const uploadFile = async (
    uri: string,
    coupleId: string,
    mimeType?: string
): Promise<UploadResult> => {
    try {
        console.log('Uploading file:', { uri: uri.substring(0, 50), coupleId, mimeType });

        const extension = getFileExtension(uri);
        const fileName = generateFileName(coupleId, 'file', extension);

        let uploadData: Blob | ArrayBuffer;
        let contentType = mimeType || 'application/octet-stream';

        if (Platform.OS === 'web') {
            uploadData = await uriToBlob(uri);
            if (uploadData.type && !mimeType) {
                contentType = uploadData.type;
            }
        } else {
            uploadData = await uriToArrayBuffer(uri);
        }

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, uploadData, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error('Supabase file upload error:', error);
            return { url: null, error: error.message };
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        console.log('File uploaded successfully:', urlData.publicUrl);
        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        console.error('Upload file error:', err);
        return { url: null, error: err instanceof Error ? err.message : 'Dosya yüklenemedi' };
    }
};

export const StorageService = {
    uploadImage,
    uploadAudio,
    uploadFile,
};
