const User = require("../models/user");
const shortId = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const { errorHandler } = require("../helpers/dbErrorHandler");
const _ = require("lodash");
const { OAuth2Client } = require("google-auth-library");
const fetch = require("node-fetch");
// ("use strict");
const Blog = require('../models/blog')
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    // user: "harshittomer10@gmail.com",
    user: "harshittomer4@gmail.com",
    pass: "6ncVqs5tAUNzKjCh",
    // pass:"NPsnASCptaVDQ9GX"
  },
});

exports.preSignup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is taken",
      });
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `
            <h4>Thanks for becoming part of our dev family</h4>
            <p>Please use the following link to activate your acccount:</p>
            <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
            <hr />
            <p>This email may contain sensitive information</p>
            <p>https://devsblogs.com</p>
        `,
    };

    transporter.sendMail(emailData).then((sent) => {
      return res.json({
        success: true,
        message: `Email has been sent to ${email}.
                  Link will expire in 10min.`,
      });
    });
  });
};


exports.signup = (req, res) => {
  const token = req.body.token;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACCOUNT_ACTIVATION,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link. Signup again",
          });
        }

        const { name, email, password } = jwt.decode(token);

        let username = shortId.generate();
        let profile = `${process.env.CLIENT_URL}/profile/${username}`;

        const user = new User({ name, email, password, profile, username });
        user.save((err, user) => {
          if (err) {
            return res.status(401).json({
              error: errorHandler(err),
            });
          }
          return res.json({
            message: "Signup success! Please signin",
          });
        });
      }
    );
  } else {
    return res.json({
      message: "Something went wrong. Try again",
    });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;
  // check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist. Please signup.",
      });
    }
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match.",
      });
    }
    // generate a token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, { expiresIn: "7d" });
    const { _id, username, name, email, role } = user;
    return res.json({
      token,
      user: { _id, username, name, email, role },
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "Signout success",
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findById({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  if (req.user) {
    const adminUserId = req.user._id;

    User.findById({ _id: adminUserId }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      if (user.role !== 1) {
        return res.status(400).json({
          error: "Admin resource. Access denied",
        });
      }

      req.profile = user;
      next();
    });
  }
  else{
    return res.status(400).json({
      error: "Admin resource. Access denied",
    });
  }
};

exports.authorMiddleware = (req, res, next) => {
  if (req.user) {
    const authorUserId = req.user._id;

    User.findById({ _id: authorUserId }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found",
        });
      }

      if (user.role !== 2) {
        return res.status(400).json({
          error: `Author resource.${user.role} Access denied`,
        });
      }

      req.profile = user;
      next();
    });
  }
  else{
    return res.status(400).json({
      error: "Author resource. Access denied",
    });
  }
};

exports.canUpdateDeleteBlog = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    let authorizedUser =
      data.postedBy._id.toString() === req.profile._id.toString();
    if (!authorizedUser) {
      return res.status(400).json({
        error: "You are not authorized",
      });
    }
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10m",
    });

    // email
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password reset link`,
      html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensitive information</p>
            <p>https://devsblogs.com</p>
        `,
    };
    // populating the db > user > resetPasswordLink
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.json({ error: errorHandler(err) });
      } else {
        transporter.sendMail(emailData).then((sent) => {
          return res.json({
            success: true,
            message: `Email has been sent to ${email}. Link will expire in 10min.`,
          });
        });
      }
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link. Try again",
          });
        }
        User.findOne({ resetPasswordLink }, (err, user) => {
          if (err || !user) {
            return res.status(401).json({
              error: "Something went wrong. Try later",
            });
          }
          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          user = _.extend(user, updatedFields);

          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: errorHandler(err),
              });
            }
            res.json({
              message: `Great! Now you can login with your new password`,
            });
          });
        });
      }
    );
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const idToken = req.body.tokenId;
  if (idToken != undefined) {
    client
      .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
      .then((response) => {
        
        const { email_verified, name, email, jti } = response.payload;
        if (email_verified) {
          User.findOne({ email }).exec((err, user) => {
            if (user) {
              const token = jwt.sign(
                { _id: user._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: "7d",
                }
              );
              res.cookie("token", token, { expiresIn: "7d" });
              const { _id, email, name, role, username } = user;
              return res.json({
                token,
                user: { _id, email, name, role, username },
              });
            } else {
              let username = shortId.generate();
              let profile = `${process.env.CLIENT_URL}/profile/${username}`;
              let password = jti;
              user = new User({ name, email, profile, username, password });
              user.save((err, data) => {
                if (err) {
                  return res.status(400).json({
                    error: errorHandler(err),
                  });
                }
                const token = jwt.sign(
                  { _id: data._id },
                  process.env.JWT_SECRET,
                  { expiresIn: "7d" }
                );
                res.cookie("token", token, { expiresIn: "7d" });
                const { _id, email, name, role, username } = data;
                return res.json({
                  token,
                  user: { _id, email, name, role, username },
                });
              });
            }
          });
        } else {
          return res.status(400).json({
            error: "Google login failed. Try again.",
          });
        }
      });
  }
};

exports.facebookLogin = (req, res) => {
  const { userId, tokenId } = req.body;

  const url = `https://graph.facebook.com/v12.0/${userId}/?fields=id,name,email&access_token=${tokenId}`;
  
  return (
    fetch(url, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        const { name, email } = response;
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "7d",
            });
            

            const { _id, email, name, role, username } = user;
            return res.json({
              token,
              user: { _id, email, name, role, username },
            });
          } else {
            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, profile, username, password });
            user.save((err, data) => {
              if (err) {
                return res.status(400).json({
                  error: errorHandler(err),
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: "7d",
                }
              );
              res.cookie("token", token, { expiresIn: "7d" });
              const { _id, email, name, role, username } = data;

              return res.json({
                token,
                user: { _id, email, name, role, username },
              });
            });
          }
        });
      })
      .catch((error) => {
        res.json({
          error: "Facebook login failed. Try later",
        });
      })
  );
};
