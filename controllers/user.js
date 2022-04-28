const User = require('../models/user');
const Blog = require('../models/blog');
const _ = require('lodash');
const formidable = require('formidable');
const fs = require('fs');
const { errorHandler } = require('../helpers/dbErrorHandler');
var path = require('path');

exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    return res.json(req.profile);
};

exports.publicProfile = (req, res) => {
    let username = req.params.username;
    let user;
    let blogs;

    User.findOne({ username }).exec((err, userFromDB) => {
        if (err || !userFromDB) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        user = userFromDB;
        let userId = user._id;
        Blog.find({ postedBy: userId })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name')
            .limit(10)
            .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                user.photo = undefined;
                user.hashed_password = undefined;
                res.json({
                    user,
                    blogs: data
                });
            });
    });
};

exports.update = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtension = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }

        let user = req.profile;
        // user's existing role and email before update
        let existingRole = user.role;
        let existingEmail = user.email;

        if (fields && fields.username && fields.username.length > 12) {
            return res.status(400).json({
                error: 'Username should be less than 12 characters long'
            });
        }

        if (fields.username) {
            fields.username = slugify(fields.username).toLowerCase();
        }

        if (fields.password && fields.password.length < 6) {
            return res.status(400).json({
                error: 'Password should be min 6 characters long'
            });
        }

        user = _.extend(user, fields);
        // user's existing role and email - dont update - keep it same
        user.role = existingRole;
        user.email = existingEmail;

        if (files.photo) {
            if (files.photo.size > 10000000) {
                return res.status(400).json({
                    error: 'Image should be less than 1mb'
                });
            }
            user.photo.data = fs.readFileSync(files.photo.filepath);
            user.photo.contentType = files.photo.type;
        }

        user.save((err, result) => {
            if (err) {
                console.log('profile udpate error', err);
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            user.photo = undefined;
            res.json(user);
        });
    });
};
exports.roleUpdate = (req, res) => {
    User.findByIdAndUpdate(req.body.userId, { role: req.body.role ,username:req.body.username},function (err, docs) {
        if (err){
        console.log(err)
        }
        else{
            res.status(200).json(`role Updated to ${req.body.role ? "author":"user"} and username is ${req.body.username}`)
        }
    })
}
// function showImage() {
//     var img = document.createElement('div');
//     document.body.appendChild(img)
//     img.innerHTML = "<img src='/public/IMG_0596.jpg'></img>";
// }

exports.photo = (req, res) => {
    const username = req.params.username;
    User.findOne({ username }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        if (user.photo.data) {
            
            res.set('Content-Type', user.photo.contentType);
            return res.send(user.photo.data);
        }else{
            
            return res.sendFile(path.join(__dirname,'../public/programmer.png'))
        }
    });
};

exports.allUsers = (req, res) => {
    User.find((err, users) => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
       res.json({users})
    }).select("name email username role");
};