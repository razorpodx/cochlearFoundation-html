import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import exphbs from "express-handlebars";
import helmet from "helmet";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import chalk from 'chalk';
import cron from 'node-cron';

import indexRouter from "#routes/index";





dotenv.config({
  path: ".env",
});


const app = express();

const DB_URL = `${process.env.DB_PROTOCOL}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}/${process.env.DB_NAME}?${process.env.DB_OPTIONS}`;

mongoose.set("useCreateIndex", true);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false)
if (process.env.MODE == "dev") {
  mongoose.set("autoIndex", true);
} else {
  mongoose.set("autoIndex", false);
}
mongoose.connect(DB_URL);
mongoose.connection.on("error", (err) => {
  console.log(
    "%s MongoDB connection error. Please make sure MongoDB is running.",
    chalk.red("✗"),
    err
  );
  process.exit();
});
mongoose.connection.on("connected", () => {
  console.log("%s MongoDB Connected", chalk.green("✔"));
});

//Setup Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// view engine setup
app.set("view engine", "hbs");

app.engine("hbs", exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, "./views/layouts"),
  partialsDir: [path.join(__dirname, "./views/partials")]
}));

app.set("views", path.join(__dirname, "views"));

/**
 * Logger Setup
 * combined - :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
 */
var accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/access.log"),
  { flags: "a" }
);
app.use(logger("combined", { stream: accessLogStream }));

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
