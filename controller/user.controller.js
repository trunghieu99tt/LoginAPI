const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Session = require("../models/session.model");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

const addedDate = (days = 7) => {
    var result = new Date();
    result.setDate(result.getDate() + days);
    return result;
};

const createNewSession = async (token) => {
    const expiredDate = addedDate();

    const newSession = await Session.create({
        jwtCode: token,
        expiredDate,
    });
    console.log("newSession", newSession);
    return newSession;
};

exports.signUp = async (req, res, next) => {
    try {
        const checkUsername = await User.findOne({
            username: req.body.username,
        });
        const checkEmail = await User.findOne({ email: req.body.email });

        if (!checkUsername && !checkEmail) {
            const newUser = await User.create(req.body);
            const token = signToken(newUser._id);

            const newSession = createNewSession(token);

            res.status(201).json({
                status: "success",
                token,
                data: {
                    user: newUser,
                },
            });
        } else {
            res.status(422).json({
                status: "fail",
                message:
                    "Username or email is already taken. Please choose another",
            });
        }
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error,
        });
    }
};

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(404).json({ status: "fail", message: "failed" });
        }
        const user = await User.findOne({ username }).select("+password");

        if (user) {
            const correct = await user.correctPassword(password, user.password);

            if (correct) {
                const token = signToken(user._id);
                const newSession = createNewSession(token);

                res.status(200).json({ status: "success", token });
            }
        } else {
            res.status(422).json({
                message: "Incorrect username or password",
            });
        }
    } catch (error) {
        console.log("error", error);
        res.status(404).json({
            message: "Something went wrong",
        });
    }
};

exports.getUser = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            data: {
                user: req.user,
            },
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error,
        });
    }
    next();
};

exports.protect = async (req, res, next) => {
    try {
        let token = null;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];

            const session = await Session.findOne({
                expiredDate: { $lt: new Date() },
                jwtCode: token,
            });
            const sessions = await Session.find();

            if (session) {
                const expiredDate = addedDate();
                await Session.create({
                    jwtCode: token,
                    expiredDate,
                });
            }
        }
        const decoded = await promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        );
        const freshUser = await User.findById(decoded.id);
        if (!freshUser) {
            return res.status(401).json({
                message: "The user belonging to this user does no longer exist",
            });
        }
        req.user = freshUser;
        next();
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: err,
        });
    }
    next();
};
