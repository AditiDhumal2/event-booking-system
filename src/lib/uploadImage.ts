import cloudinary from './cloudinary';

export async function uploadImage(imageFile: File): Promise<string> {
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'event-booking',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              console.log('Image uploaded successfully:', result.secure_url);
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed - no result'));
            }
          }
        )
        .end(buffer);
    });
  } catch (error) {
    console.error('Error processing image file:', error);
    throw error;
  }
}

// Optional: Function to delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}