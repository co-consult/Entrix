export declare class UploadAvatarDto {
    replace?: boolean;
    generateSizes?: boolean;
    outputFormat?: string;
    quality?: number;
    keepMetadata?: boolean;
}
export declare class UploadAvatarResponseDto {
    originalUrl: string;
    thumbnailUrl: string;
    sizes: {
        small: string;
        medium: string;
        large: string;
        xlarge: string;
    };
    uploadedAt: string;
    fileSize: number;
    mimeType: string;
    dimensions: {
        width: number;
        height: number;
    };
}
