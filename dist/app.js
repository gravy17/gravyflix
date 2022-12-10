"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const database_config_1 = __importDefault(require("./config/database.config"));
const pages_1 = __importDefault(require("./routes/pages"));
const movies_1 = __importDefault(require("./routes/movies"));
const users_1 = __importDefault(require("./routes/users"));
const APP_NAME = process.env.APP_NAME;
database_config_1.default.sync({ force: false })
    .then(() => {
    console.info("Database connected succcesfully");
})
    .catch((err) => {
    console.error(err);
});
const app = (0, express_1.default)();
// view engine setup
app.set("views", path_1.default.join(__dirname, "..", "views"));
app.set("view engine", "ejs");
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
app.use("/", pages_1.default);
app.use("/api", users_1.default);
app.use("/api/movies", movies_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(err.status || 500);
    if (err.status === 404) {
        res.render("404", {
            status: 404,
            message: "The page you're looking for was not found. Try checking your url for spelling mistakes",
            error: res.locals.error,
            title: APP_NAME + " | 404",
            user: req.user,
        });
    }
    else {
        res.render("500", {
            status: 500,
            message: "The server encountered a problem while processing your request. We'll have this fixed soon",
            error: res.locals.error,
            title: APP_NAME + " | 500",
            user: req.user,
        });
    }
});
exports.default = app;
