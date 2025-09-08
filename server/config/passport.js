const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' 
          ? 'https://crowd-backend-zxxp.onrender.com/api/auth/google/callback'
          : 'http://localhost:3001/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findByGoogleId(profile.id);
          
          if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
          
          // Check if user exists with this email (linking accounts)
          user = await User.findByEmail(profile.emails[0].value);
          
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.loginMethod = 'google';
            user.profilePicture = user.profilePicture || profile.photos[0]?.value;
            user.isVerified = true;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
          
          // Create new user
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            name: profile.displayName,
            profilePicture: profile.photos[0]?.value,
            isVerified: true,
            loginMethod: 'google',
            lastLogin: new Date()
          });
          
          await newUser.save();
          return done(null, newUser);
          
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};