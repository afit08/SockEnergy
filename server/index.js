// import "dotenv/config";
import config from './config/config';
import express from 'express';
import cors from 'cors';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import os from 'os';
import cluster from 'cluster';
import models, { sequelize } from './models/init-models';
import routes from './routes/IndexRoute';
import sanitizer from 'perfect-express-sanitizer';
import bodyParser from 'body-parser';
import { xss } from 'express-xss-sanitizer';
import now from 'performance-now';
import { body, param } from 'express-validator';
import dotenv from 'dotenv';
import middleware from './helpers/middleware';

dotenv.config();

const DOMPurify = require('dompurify');

const numCPUs = os.cpus().length;
const port = process.env.PORT || 3000; // Set default port if not provided in .env

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();

  // Set the view engine to EJS
  app.set('view engine', 'ejs');

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    next();
  });

  function sanitizeUserInputs(inputs) {
    for (const key in inputs) {
      if (typeof inputs[key] === 'string') {
        // Assuming SANITIZE_KEY is a string
        inputs[key] = DOMPurify.sanitize(inputs[key]);
      }
    }
  }

  app.use(
    bodyParser.json({ limit: '5mb' }),
    bodyParser.urlencoded({ extended: true, limit: '5mb' }),
    xss(),
    sanitizer.clean({
      xss: true,
      noSql: true,
      level: 5,
      forbiddenTags: ['.execute'],
    }),
    cookieParser(),
    sanitizeUserInputs,
  );

  app.use(helmet());

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://unpkg.com',
          'https://cdn.quilljs.com',
          'https://cdnjs.cloudflare.com',
          'https://polyfill.io',
          'https://maps.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://www.gstatic.com',
        ],
        styleSrc: [
          "'self'",
          'https://cdn.quilljs.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          'https://www.gstatic.com',
        ],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
      },
    }),
  );

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.use(compress());

  const whitelist = [
    'http://153.92.1.221:3100',
    'http://153.92.1.221:5000',
    'http://127.0.0.1:3100', // Change the port to match your frontend's port
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };

  app.use(cors(corsOptions));

  app.use((req, res, next) => {
    req.context = { models };
    next();
  });

  app.use(morgan('combined'));

  app.use((req, res, next) => {
    const start = now();

    res.on('finish', () => {
      const end = now();
      const duration = end - start;
      console.log(
        `Route ${req.method} ${req.url} executed in ${duration.toFixed(
          2,
        )} milliseconds`,
      );
    });

    next();
  });

  app.use(config.URL_API + '/auth', routes.UserRoute);
  app.use(config.URL_API + '/roles', routes.RolesRoute);
  app.use(config.URL_API + '/categories', routes.CategoriesRoute);
  app.use(config.URL_API + '/products', routes.ProductsRoute);
  app.use(config.URL_API + '/carts', routes.CartsRoute);
  app.use(config.URL_API + '/paymentMethod', routes.PaymentRoute);
  app.use(config.URL_API + '/ongkir', routes.OngkirRoute);
  app.use(config.URL_API + '/galleries', routes.GalleriesRoute);
  app.use(config.URL_API + '/address', routes.AddressRoute);
  app.use(config.URL_API + '/orders', routes.OrderRoute);
  app.use(config.URL_API + '/about', routes.AboutRoute);
  app.use(config.URL_API + '/rating', routes.RatingRoute);

  app.use(middleware.handleError);
  app.use(middleware.notFound);

  sequelize.sync().then(() => {
    app.listen(port, () => {
      console.log(`Worker ${process.pid} is listening on port ${port}`);
    });
  });

  console.log(`Worker ${process.pid} started`);
}
