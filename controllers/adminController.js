const fs = require("fs");

const multer = require("multer");
const sharp = require("sharp");
const shortId = require("shortid");
const appRoot = require("app-root-path");

const Blog = require("../models/Blog");
const { fileFilter } = require("../utils/multer");
const { handleResponse } = require("../utils/response");

exports.editPost = async (req, res, next) => {
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${shortId.generate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;

  const post = await Blog.findOne({ _id: req.params.id });
  try {
    if (thumbnail.name) await Blog.postValidation({ ...req.body, thumbnail });
    else
      await Blog.postValidation({
        ...req.body,
        thumbnail: {
          name: "placeholder",
          size: 0,
          mimetype: "image/jpeg",
        },
      });

    if (!post) {
      const error = new Error("پستی با این شناسه یافت نشد .");
      error.statusCode = 404;
      throw error;
    }

    if (post.user.toString() != req.userId) {
      const error = new Error("شما مجوز ویرایش این پست را ندارید.");
      error.statusCode = 401;
      throw error;
    } else {
      if (thumbnail.name) {
        fs.unlink(
          `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`,
          async (err) => {
            if (err) console.log(err);
            else {
              await sharp(thumbnail.data)
                .jpeg({ quality: 60 })
                .toFile(uploadPath)
                .catch((err) => console.log(err));
            }
          }
        );
      }

      const { title, status, body } = req.body;
      post.title = title;
      post.status = status;
      post.body = body;
      post.thumbnail = thumbnail.name ? fileName : post.thumbnail;

      await post.save();
      handleResponse(res, 200, post);
    }
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Blog.findByIdAndRemove(req.params.id);
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${post.thumbnail}`;
    fs.unlink(uploadPath, async (err) => {
      if (err) {
        const error = new Error("خطایی در پاک سازی عکس پست رخ داده است");
        error.statusCode = 400;
        throw error;
      } else {
        handleResponse(res, 200, post);
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const thumbnail = req.files ? req.files.thumbnail : {};
  const fileName = `${shortId.generate()}_${thumbnail.name}`;
  const uploadPath = `${appRoot}/public/uploads/thumbnails/${fileName}`;

  try {
    req.body = { ...req.body, thumbnail };

    await Blog.postValidation(req.body);

    await sharp(thumbnail.data)
      .jpeg({ quality: 60 })
      .toFile(uploadPath)
      .catch((err) => console.log(err));

    const blog = await Blog.create({
      ...req.body,
      user: req.userId,
      thumbnail: fileName,
    });
    handleResponse(res, 200, blog);
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = (req, res, next) => {
  try {
    const upload = multer({
      limits: { fileSize: 4000000 },
      fileFilter: fileFilter,
    }).single("image");

    upload(req, res, async (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return handleResponse(
            res,
            400,
            "",
            "حجم عکس ارسالی نباید بیشتر از 4 مگابایت باشد"
          );
        }
        handleResponse(res, 400, err);
      } else {
        if (req.files) {
          const fileName = `${shortId.generate()}_${req.files.image.name}`;
          await sharp(req.files.image.data)
            .jpeg({
              quality: 60,
            })
            .toFile(`./public/uploads/img/${fileName}`)
            .catch((err) => console.log(err));

          handleResponse(
            res,
            200,
            `http://localhost:3000/uploads/img/${fileName}`
          );
        } else {
          handleResponse(res, 400, null, "جهت آپلود باید عکسی انتخاب کنید");
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
