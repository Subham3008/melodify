import multer from "multer";

const storage = multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| File filter
|--------------------------------------------------------------------------
|
| audio:
| audio/*
|
| cover:
| image/*
|
*/

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.fieldname === "audio") {
    if (!file.mimetype.startsWith("audio/")) {
      callback(new Error("Audio file must be a valid audio file"));

      return;
    }

    callback(null, true);

    return;
  }

  if (file.fieldname === "cover") {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Cover must be a valid image file"));

      return;
    }

    callback(null, true);

    return;
  }

  callback(new Error("Unexpected upload field"));
};

export const adminTrackUpload = multer({
  storage,

  limits: {
    /*
      | 50 MB per uploaded file
      */

    fileSize: 50 * 1024 * 1024,

    files: 2,
  },

  fileFilter,
});
