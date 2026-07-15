import { encode } from 'blurhash';

// Generate a blurhash string from a File or an image URL. Resolves to null
// (rather than throwing) on failure so callers can save the image without a
// blurhash instead of blocking the upload.
export async function generateBlurhash(source, options = {}) {
  const { width = 32, height = 32, componentsX = 4, componentsY = 3 } = options;

  try {
    const isFile = source instanceof File;
    const imageUrl = isFile ? URL.createObjectURL(source) : source;

    if (typeof imageUrl !== 'string') {
      throw new Error('Invalid source type. Expected File or string URL.');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    return await new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const blurhash = encode(imageData.data, imageData.width, imageData.height, componentsX, componentsY);
          resolve(blurhash);
        } catch (error) {
          console.error('Error generating blurhash:', error);
          resolve(null);
        } finally {
          if (isFile) URL.revokeObjectURL(imageUrl);
        }
      };

      img.onerror = () => {
        console.error('Error loading image for blurhash generation');
        if (isFile) URL.revokeObjectURL(imageUrl);
        resolve(null);
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error in generateBlurhash:', error);
    return null;
  }
}
