export const getCloudinaryUrl = (publicId, options = {}) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.error('Cloudinary cloud name not found in environment variables');
    return '';
  }
  
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.effect) transformations.push(`e_${options.effect}`);
  
  const transformationStr = transformations.length > 0 
    ? `${transformations.join(',')}/` 
    : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationStr}${publicId}`;
};