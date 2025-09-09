const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user:email', 'repo', 'repo:status', 'read:org']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        // Update user info
        user.githubUsername = profile.username;
        user.githubProfileUrl = profile.profileUrl;
        user.githubAccessToken = accessToken;
        user.avatar = profile.photos[0]?.value;
        user.lastLogin = new Date();
        await user.save();
        return done(null, user);
      }

      // Create new user
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

      user = new User({
        githubId: profile.id,
        githubUsername: profile.username,
        githubProfileUrl: profile.profileUrl,
        githubAccessToken: accessToken,
        email: email,
        name: profile.displayName,
        avatar: profile.photos[0]?.value,
        subscriptionTier: 'free',
        lastLogin: new Date(),
      });

      await user.save();
      return done(null, user);

    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));
};

