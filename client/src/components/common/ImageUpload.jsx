import React, { useState } from 'react';
import api from '../../services/api';

const ImageUpload = ({ onUploadComplete, multiple = false }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            if (multiple) {
                Array.from(files).forEach(file => {
                    formData.append('files', file);
                });
            } else {
                formData.append('file', files[0]);
            }

            const response = await api.post('/admin/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 'success') {
                onUploadComplete(response.data.data.file);
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            PNG, JPG or GIF (MAX. 5MB)
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple={multiple}
                        disabled={uploading}
                    />
                </label>
            </div>
            {uploading && (
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                </div>
            )}
            {error && (
                <div className="text-sm text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImageUpload; 