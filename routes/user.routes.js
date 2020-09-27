const express = require("express");

const userController = require("./../controller/user.controller");

const router = express.Router();

router.route("/signup").post(userController.signUp);
router.route("/signin").post(userController.login);

router.use(userController.protect);

router.route("/me").get(userController.getUser);

module.exports = router;
