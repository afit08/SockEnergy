const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

passport.use(
  new GoogleStrategy(
    {
      clientID:
        '199944315367-u54rliij8rgijgfip7nanaqq3fi9qg5e.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // You can perform database operations here, e.g., find or create user
      return done(null, profile);
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
