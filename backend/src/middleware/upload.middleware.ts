import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadPackagePhotos = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  },
}).fields([
  { name: 'weightPhoto', maxCount: 1 },
  { name: 'productPhoto', maxCount: 1 },
]);
