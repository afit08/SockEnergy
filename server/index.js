// import "dotenv/config";
import config from './config/config';
import express from 'express';
import cors from 'cors';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import middleware from './helpers/middleware';
import morgan from 'morgan';

// for access models to db
import models, { sequelize } from './models/init-models';
import routes from './routes/IndexRoute';
import os from 'os';
import cluster from 'cluster';

// declare port
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
  // parse body params and attach them to req.body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  // use helmet spy bisa dikenali SEO
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
      },
    }),
  );
  app.use(helmet.hsts({ maxAge: 2147483648 }));
  // secure apps by setting various HTTP headers
  app.use(compress());
  // enable CORS - Cross Origin Resource Sharing
  app.use(cors());

  // load models dan simpan di req.context
  app.use(async (req, res, next) => {
    req.context = { models };
    next();
  });

  app.use(morgan('dev'));

  // call routes
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

  // use middleware to handle errors from other modules
  app.use(middleware.handleError);
  app.use(middleware.notFound);

  // set to false agar tidak di drop tables yang ada didatabase
  const dropDatabaseSync = false;

  sequelize.sync({ force: dropDatabaseSync }).then(async () => {
    if (dropDatabaseSync) {
      console.log('Database do not drop');
    }

    app.listen(port, () => {
      console.log(
        `Server is listening on port ${port} ${'with multiple workers'} ${
          process.pid
        }`,
      );
    });
  });
}

export default createServer;
