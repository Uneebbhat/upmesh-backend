import express, { Application, Request, Response } from "express";
import { morganStream } from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import chalk from "chalk";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dbConnect from "./services/dbConnect";
import userRoutes from "./routes/userRoutes.routes";
import ErrorHandler from "./utils/ErrorHandler";

const app: Application = express();

dbConnect();

// Helmet middleware for adding security headers to all responses
app.use(helmet());

const morganFormat = (
  tokens: morgan.TokenIndexer<Request, Response>,
  req: Request,
  res: Response
): string => {
  const status = Number(tokens.status(req, res));

  return [
    // IP - green
    chalk.green(tokens["remote-addr"](req, res) || ""),

    // Timestamp - gray
    chalk.gray(`- [${tokens.date(req, res, "clf")}]`),

    // Method - purple
    chalk.magenta(tokens.method(req, res) || ""),

    // URL - blue
    chalk.blue(tokens.url(req, res) || ""),

    // Protocol and Status - cyan
    chalk.cyan(
      `HTTP/${tokens["http-version"](req, res)} ${tokens.status(req, res)}`
    ),

    // Response time - cyan
    chalk.cyan(`${tokens["response-time"](req, res)} ms`),

    // Referrer - yellow (URL)
    chalk.yellow(`"${tokens.referrer(req, res)}"`),

    // User Agent - gray
    chalk.gray(`"${tokens["user-agent"](req, res)}"`),
  ].join(" ");
};

// Register in app.ts
app.use(morgan(morganFormat, { stream: morganStream }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.all("/*splat", (req: Request, res: Response) => {
  ErrorHandler.send(res, 404, `The URL ${req.originalUrl} doesn't exist`);
});

export default app;
