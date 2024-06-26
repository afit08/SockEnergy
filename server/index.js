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
import { body, query, param, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import middleware from './helpers/middleware';
import { jwtDecode } from 'jwt-decode';
const session = require('express-session');
const passport = require('passport');
const generateToken = require('../server/helpers/jwt-config');
require('../server/helpers/passport-config');
const sequelizeConn = require('../server/helpers/queryConn');

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

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');

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

  // // Use helmet middleware
  // app.use(helmet());

  // Set additional security headers as needed
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [
            "'self'",
            'http://153.92.1.221:5432/',
            'http://153.92.1.221:9000/',
          ],
          scriptSrc: [
            "'self'",
            'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js',
            'http://cdn.quilljs.com/',
            'https://cdnjs.cloudflare.com/',
            'https://polyfill.io/',
            'https://maps.googleapis.com/',
            'https://cdn.jsdelivr.net/',
            'https://www.gstatic.com/',
          ],
          styleSrc: [
            "'self'",
            'http://cdn.quilljs.com/',
            'https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.css',
            'https://cdn.jsdelivr.net/',
            'https://www.gstatic.com/',
          ],
          imgSrc: ["'self'", 'http://153.92.1.221:9000'],
          connectSrc: [
            "'self'",
            'http://153.92.1.221:9000/',
            'http://153.92.1.221:5432/',
          ],
          frameSrc: ["'self'"],
          frameAncestors: ["'none'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com/'],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          manifestSrc: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }),
  );

  app.use(
    session({
      secret: 'YOUR_SESSION_SECRET', // Replace with your session secret
      resave: false,
      saveUninitialized: false,
    }),
  );

  // Initialize Passport.js middleware
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(compress());

  const whitelist = [
    'http://153.92.1.221:3100/',
    'http://153.92.1.221:5000/',
    'http://127.0.0.1:3100',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5173',
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  // Google OAuth2 authentication route
  app.get(
    '/auth/google',
    cors(corsOptions),
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  );

  app.get(
    '/auth/google/callback',
    cors(corsOptions),
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
      const data = {
        sub: req.user._json.sub,
        name: req.user._json.name,
        given_name: req.user._json.given_name,
        family_name: req.user._json.family_name,
        picture: req.user._json.picture,
        email: req.user._json.email,
        locale: req.user._json.locale,
        roleType: 'customer',
      };

      const token = generateToken(data);
      res.redirect(`/login-success?token=${token}`);

      if (token) {
        const decoded = jwtDecode(token);

        try {
          const [role] = await sequelizeConn.query(
            'SELECT * FROM roles WHERE role_name = :roleType',
            {
              replacements: { roleType: decoded.roleType },
              type: sequelizeConn.QueryTypes.SELECT,
            },
          );

          const result = await sequelizeConn.query(
            'INSERT INTO users (user_id, user_name, user_email, user_photo, user_personal_name, user_role_id) VALUES (:userId, :name, :email, :picture, :pesonalName, :roleId)',
            {
              replacements: {
                userId: decoded.sub,
                name: decoded.given_name,
                email: decoded.email,
                pesonalName: decoded.name,
                picture: decoded.picture,
                roleId: role ? role.role_id : null, // Assuming role_name is the correct property to assign to user_role_id
              },
              type: sequelizeConn.QueryTypes.INSERT,
            },
          );

          if (result) {
            console.log('Data saved into database');
          }
        } catch (error) {
          console.error('Error saving data into database:', error);
        }
      }
    },
  );

  // Route to handle successful login with JWT token
  app.get('/login-success', cors(corsOptions), (req, res) => {
    res.json({ token: req.query.token });
  });

  app.get('/', cors(corsOptions), (req, res) => {
    res.send('Hello, world!');
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
  app.use(config.URL_API + '/csrf', routes.csrfRoute);

  app.use(middleware.handleError);
  app.use(middleware.notFound);

  sequelize.sync().then(() => {
    app.listen(port, () => {
      console.log(`Worker ${process.pid} is listening on port ${port}`);
    });
  });

  console.log(`Worker ${process.pid} started`);
}
