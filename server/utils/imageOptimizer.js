/**
 * Image Optimization Utility
 * Resize and optimize images before upload
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Optimize image: resize, convert to WebP if possible, compress
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save optimized image
 * @param {Object} options - Optimization options
 * @param {number} options.maxWidth - Maximum width (default: 1920)
 * @param {number} options.maxHeight - Maximum height (default: 1920)
 * @param {number} options.quality - JPEG/WebP quality (default: 85)
 * @param {boolean} options.convertToWebP - Convert to WebP format (default: true)
 * @returns {Promise<Object>} Optimization result
 */
async function optimizeImage(inputPath, outputPath, options = {}) {
    try {
        const {
            maxWidth = 1920,
            maxHeight = 1920,
            quality = 85,
            convertToWebP = true
        } = options;

        // Get image metadata
        const metadata = await sharp(inputPath).metadata();
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = metadata.width;
        let height = metadata.height;
        
        if (width > maxWidth || height > maxHeight) {
            if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }
        }

        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Determine output format
        const outputExt = path.extname(outputPath).toLowerCase();
        const shouldUseWebP = convertToWebP && (outputExt === '.webp' || outputExt === '.jpg' || outputExt === '.jpeg');

        let sharpInstance = sharp(inputPath)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            });

        if (shouldUseWebP) {
            // Convert to WebP
            const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            await sharpInstance
                .webp({ quality })
                .toFile(webpPath);
            
            return {
                success: true,
                path: webpPath,
                originalSize: fs.statSync(inputPath).size,
                optimizedSize: fs.statSync(webpPath).size,
                width,
                height,
                format: 'webp'
            };
        } else {
            // Keep original format but optimize
            if (outputExt === '.jpg' || outputExt === '.jpeg') {
                sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
            } else if (outputExt === '.png') {
                sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
            }

            await sharpInstance.toFile(outputPath);

            return {
                success: true,
                path: outputPath,
                originalSize: fs.statSync(inputPath).size,
                optimizedSize: fs.statSync(outputPath).size,
                width,
                height,
                format: outputExt.replace('.', '')
            };
        }
    } catch (error) {
        console.error('[IMAGE OPTIMIZER] Error optimizing image:', error);
        throw error;
    }
}

/**
 * Create thumbnail from image
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save thumbnail
 * @param {number} size - Thumbnail size (default: 300)
 * @returns {Promise<Object>} Thumbnail creation result
 */
async function createThumbnail(inputPath, outputPath, size = 300) {
    try {
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await sharp(inputPath)
            .resize(size, size, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        return {
            success: true,
            path: outputPath,
            size: fs.statSync(outputPath).size
        };
    } catch (error) {
        console.error('[IMAGE OPTIMIZER] Error creating thumbnail:', error);
        throw error;
    }
}

/**
 * Validate image file
 * @param {string} filePath - Path to image file
 * @returns {Promise<boolean>} True if valid image
 */
async function validateImage(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        return metadata.width > 0 && metadata.height > 0;
    } catch (error) {
        return false;
    }
}

module.exports = {
    optimizeImage,
    createThumbnail,
    validateImage
};

