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
import ejs from 'ejs';
import now from 'performance-now';
import { body, query, param, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import middleware from './helpers/middleware';

dotenv.config();

const DOMPurify = require('dompurify');

const numCPUs = os.cpus().length;
const port = process.env.PORT;

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

  // const allowedIPs = ['153.92.1.221', '127.0.0.1']; // Replace with your allowed IP addresses

  app.use((req, res, next) => {
    // const clientIP = req.ip || req.connection.remoteAddress;
    // if (allowedIPs.includes(clientIP)) {
    //   next();
    // } else {
    //   res.status(403).send('Forbidden');
    // }

    res.setHeader('X-Frame-Options', 'DENY');

    // Sanitize req.body, req.query, req.params, etc.
    sanitizeUserInputs(req.body);
    // sanitizeUserInputs(req.query);
    sanitizeUserInputs(req.params);
    sanitizeUserInputs(req.fileAttrb);

    next();
  });

  function sanitizeUserInputs(inputs) {
    for (const key in inputs) {
      if (typeof inputs[key] === process.env.SANITIZE_KEY) {
        inputs[key] = DOMPurify.sanitize(inputs[key]);
      }
    }
  }

  app.use(
    body().customSanitizer(sanitizeUserInputs),
    // query().customSanitizer(sanitizeUserInputs),
    param().customSanitizer(sanitizeUserInputs),
  );

  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
  app.use(xss());

  app.use(
    sanitizer.clean({
      xss: true,
      noSql: true,
      level: 5,
      forbiddenTags: ['.execute'],
    }),
  );
  app.use(cookieParser());

  // Use helmet middleware
  app.use(helmet());

  // Set additional security headers as needed
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'"],
      },
    }),
  );

  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    }),
  );

  app.use(
    helmet.frameguard({
      action: 'deny',
    }),
  );

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.use(compress());

  const corsOptions = {
    origin: 'http://153.92.1.221:5000/', // Replace with your trusted domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };

  app.use(cors(corsOptions));
  // app.use(cors());

  app.use((req, res, next) => {
    req.context = { models };
    next();
  });

  app.use(morgan('combined'));

  // Middleware to log the execution time of a route
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
