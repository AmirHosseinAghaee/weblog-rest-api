const Yup = require("yup");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");
const { handleResponse } = require("../utils/response");

let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
  const page = +req.query.page || 1;
  const postPerPage = +req.query.size || 5;

  try {
    const numberOfPosts = await Blog.find({
      status: "public",
    }).countDocuments();

    const posts = await Blog.find({ status: "public" })
      .sort({
        createdAt: "desc",
      })
      .skip((page - 1) * postPerPage)
      .limit(postPerPage);

    handleResponse(res, 200, {
      total: numberOfPosts,
      page,
      itemPerPage: postPerPage,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSinglePost = async (req, res, next) => {
  try {
    const post = await Blog.findOne({ _id: req.params.id }).populate("user");

    if (!post) {
      const error = new Error("پست مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    handleResponse(res, 200, post);
  } catch (err) {
    next(err);
  }
};

exports.handleContactPage = async (req, res, next) => {
  const { fullname, email, message } = req.body;

  const schema = Yup.object().shape({
    fullname: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
    email: Yup.string()
      .email("آدرس ایمیل صحیح نیست")
      .required("آدرس ایمیل الزامی می باشد"),
    message: Yup.string().required("پیام اصلی الزامی می باشد"),
  });

  try {
    await schema.validate(req.body, { abortEarly: false });

    sendEmail(
      email,
      fullname,
      "پیام از طرف وبلاگ",
      `${message} <br/> ایمیل کاربر : ${email}`
    );

    handleResponse(res, 200, "پیام شما با موفقیت ارسال شد");
  } catch (err) {
    next(err);
  }
};
