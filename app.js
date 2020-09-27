const express = require("express");
const cors = require("cors");

const userRoute = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString;
    next();
});

// 3) ROUTES
app.use("/api/v1", userRoute);

app.use((err, req, res, next) => {
    const errorCode = err.statusCode || 500;

    res.status(errorCode).send({
        message: err.message,
    });
});

module.exports = app;
