import { v2 as cloudinary } from 'cloudinary';

export const PATIENT_MEDIA_UPLOAD_PRESET = 'patient_media';

let configured = false;

export function ensureCloudinaryConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
      process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export type PatientMediaResourceType = 'image' | 'raw' | 'video' | 'auto';

export interface PatientMediaUploadResult {
  public_id: string;
  resource_type: string;
  format?: string;
  bytes?: number;
}

export function buildPatientMediaUploadOptions(options: {
  folder: string;
  resource_type?: PatientMediaResourceType;
}) {
  return {
    upload_preset: PATIENT_MEDIA_UPLOAD_PRESET,
    type: 'authenticated' as const,
    folder: options.folder,
    resource_type: options.resource_type ?? 'auto',
  };
}

export function uploadPatientMediaBuffer(
  buffer: Buffer,
  options: { folder: string; resource_type?: PatientMediaResourceType }
): Promise<PatientMediaUploadResult> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      buildPatientMediaUploadOptions(options),
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

function isLegacyPublicCloudinaryUrl(value: string): boolean {
  return (
    value.startsWith('http') &&
    value.includes('cloudinary.com') &&
    value.includes('/upload/') &&
    !value.includes('/authenticated/') &&
    !value.includes('/private/')
  );
}

export function resolvePatientMediaPublicId(storedValue: string): string {
  if (!storedValue.startsWith('http')) {
    return storedValue;
  }

  if (!storedValue.includes('cloudinary.com')) {
    return storedValue;
  }

  try {
    const pathname = new URL(storedValue).pathname;
    const deliveryMatch = pathname.match(
      /\/(?:image|video|raw)\/(?:upload|authenticated|private)\/(.*)/
    );
    if (!deliveryMatch?.[1]) {
      return storedValue;
    }

    let remainder = deliveryMatch[1];
    if (remainder.startsWith('s--')) {
      remainder = remainder.replace(/^s--[^/]+--\//, '');
    }
    if (/^v\d+\//.test(remainder)) {
      remainder = remainder.replace(/^v\d+\//, '');
    }

    const segments = remainder.split('/');
    const last = segments[segments.length - 1] ?? '';
    const withoutExt = last.includes('.') ? last.replace(/\.[^.]+$/, '') : last;
    if (segments.length === 0) {
      return withoutExt;
    }
    segments[segments.length - 1] = withoutExt;
    return segments.filter(Boolean).join('/');
  } catch {
    const fileName = storedValue.split('/').pop()?.split('?')[0] ?? storedValue;
    return fileName.replace(/\.[^.]+$/, '');
  }
}

export function inferPatientMediaResourceType(
  publicId: string,
  fileName?: string
): Exclude<PatientMediaResourceType, 'auto'> {
  const ext =
    fileName?.split('.').pop()?.toLowerCase() ??
    publicId.split('.').pop()?.toLowerCase();

  if (!ext) return 'image';
  if (['pdf', 'doc', 'docx', 'txt', 'dcm', 'dicom', 'rtf'].includes(ext)) {
    return 'raw';
  }
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return 'video';
  }
  return 'image';
}

export function getSignedPatientMediaUrl(
  storedValue: string,
  options?: {
    fileName?: string;
    resourceType?: PatientMediaResourceType;
  }
): string {
  ensureCloudinaryConfigured();

  if (storedValue.startsWith('http') && !storedValue.includes('cloudinary.com')) {
    return storedValue;
  }

  const publicId = resolvePatientMediaPublicId(storedValue);
  const legacyPublic = isLegacyPublicCloudinaryUrl(storedValue);
  const resourceType =
    !options?.resourceType || options.resourceType === 'auto'
      ? inferPatientMediaResourceType(publicId, options?.fileName)
      : options.resourceType;

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: legacyPublic ? 'upload' : 'authenticated',
    secure: true,
    sign_url: !legacyPublic,
  });
}

export async function deletePatientMedia(
  storedValue: string,
  options?: { fileName?: string; resourceType?: PatientMediaResourceType }
) {
  ensureCloudinaryConfigured();
  const publicId = resolvePatientMediaPublicId(storedValue);
  const resourceType =
    !options?.resourceType || options.resourceType === 'auto'
      ? inferPatientMediaResourceType(publicId, options?.fileName)
      : options.resourceType;
  const legacyPublic = isLegacyPublicCloudinaryUrl(storedValue);

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: legacyPublic ? 'upload' : 'authenticated',
  });
}

export function withSignedPatientMediaUrl<T extends { url: string; name?: string }>(
  item: T
): T {
  return {
    ...item,
    url: getSignedPatientMediaUrl(item.url, { fileName: item.name }),
  };
}

export function withSignedPatientMediaUrls<T extends { url: string; name?: string }>(
  items: T[]
): T[] {
  return items.map(withSignedPatientMediaUrl);
}
