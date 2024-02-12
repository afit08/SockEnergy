// import "dotenv/config";
import config from './config/config';
import express from 'express';
import cors from 'cors';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import middleware from './helpers/middleware';
import morgan from 'morgan';
import os from 'os';
import cluster from 'cluster';
import models, { sequelize } from './models/init-models';
import routes from './routes/IndexRoute';
import sanitizer from 'perfect-express-sanitizer';
import bodyParser from 'body-parser';
import { xss } from 'express-xss-sanitizer';

const port = process.env.PORT || 3000;
const clusterWorkerSize = os.cpus().length;

if (clusterWorkerSize > 1) {
  if (cluster.isMaster) {
    for (let i = 0; i < clusterWorkerSize; i++) {
      cluster.fork();
    }

    cluster.on('exit', function (worker) {
      console.log('Worker', worker.id, ' has exitted.');
    });
  } else {
    createServer();
  }
} else {
  createServer();
}

function createServer() {
  const app = express();
  app.use(bodyParser.json({ limit: '1kb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1kb' }));
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

  // Set up Content Security Policy (CSP) to mitigate XSS attacks
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    }),
  );

  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }),
  );

  app.use(
    helmet.frameguard({
      action: 'deny',
    }),
  );

  app.use(compress());
  app.use(cors());

  app.use((req, res, next) => {
    req.context = { models };
    next();
  });

  app.use(morgan('dev'));

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

  const dropDatabaseSync = false;

  sequelize.sync({ force: dropDatabaseSync }).then(async () => {
    if (dropDatabaseSync) {
      console.log('Database do not drop');
    }

    app.listen(port, process.env.NODE_ENV, () => {
      console.log(
        `Server is listening on port ${port} ${'with multiple workers'} ${
          process.pid
        }`,
      );
    });
  });
}

export default createServer;
