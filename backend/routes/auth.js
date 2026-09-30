require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../email_service');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email and password are required'
      });
    }

    const db = req.app.locals.db;

    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: 'Username or email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await db.query(
      `UPDATE users
       SET email_verification_token = $1,
           email_verification_expires = NOW() + INTERVAL '24 hours'
       WHERE id = $2`,
      [verificationTokenHash, result.rows[0].id]
    );


    try {
      await sendEmail({
        to: email,
        subject: 'Verify your AP-STREAM email',
        text: `Welcome to AP-STREAM. Verify your email here: ${verificationUrl}`,
        html: `<p>Welcome to AP-STREAM.</p>
               <p><a href="${verificationUrl}">Verify your email</a></p>`
      });
    } catch (emailError) {
      console.error('Verification email error:', emailError.message);
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: result.rows[0]
    });

    const verificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await db.query(
      `UPDATE users
       SET email_verified = FALSE,
           email_verification_token = $1,
           email_verification_expires = $2
       WHERE id = $3`,
      [verificationTokenHash, verificationExpires, result.rows[0].id]
    );

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';

    const verificationUrl =
      `${frontendUrl}/verify-email?token=${verificationToken}`;

    let emailVerificationSent = false;

    try {
      await sendEmail({
        to: email,
        subject: 'Verify your AP-STREAM email',
        text:
          `Welcome to AP-STREAM, ${username}.\n\n` +
          `Verify your email here:\n${verificationUrl}\n\n` +
          `This link expires in 24 hours.`,
        html:
          `<h2>Welcome to AP-STREAM</h2>` +
          `<p>Hello ${username},</p>` +
          `<p>Please verify your email address.</p>` +
          `<p><a href="${verificationUrl}">Verify my email</a></p>` +
          `<p>This link expires in 24 hours.</p>`
      });

      emailVerificationSent = true;
    } catch (emailError) {
      console.error('Verification email error:', emailError.message);
    }

    res.status(201).json({
      message: emailVerificationSent
        ? 'User registered successfully. Check your email to verify your account.'
        : 'User registered successfully. Email verification is pending configuration.',
      emailVerificationSent,
      ...(process.env.EMAIL_VERIFICATION_DEV_BYPASS === 'true' && !emailVerificationSent
        ? { verificationUrl }
        : {}),
      user: {
        ...result.rows[0],
        email_verified: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      message: 'Registration failed'
    });
  }
});


// Verify email address
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT id, username, email
       FROM users
       WHERE email_verification_token = $1
         AND email_verification_expires > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid or expired verification link'
      });
    }

    const user = result.rows[0];

    await db.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      message: 'Email verified successfully',
      emailVerified: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Email verification error:', error.message);

    res.status(500).json({
      message: 'Email verification failed'
    });
  }
});


// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT id, username, email
       FROM users
       WHERE email = $1`,
      [email]
    );

    // Always return the same message to avoid revealing
    // whether an email address has an AP-STREAM account.
    const genericMessage =
      'If an account exists for that email, a password reset link has been sent.';

    if (result.rows.length === 0) {
      return res.json({
        message: genericMessage
      });
    }

    const user = result.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetExpires = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await db.query(
      `UPDATE users
       SET password_reset_token = $1,
           password_reset_expires = $2
       WHERE id = $3`,
      [resetTokenHash, resetExpires, user.id]
    );

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your AP-STREAM password',
        text:
          `Hello ${user.username}.\\n\\n` +
          `Reset your AP-STREAM password using this link:\\n${resetUrl}\\n\\n` +
          `This link expires in 1 hour.\\n\\n` +
          `If you did not request this, you can ignore this email.`,
        html:
          `<h2>AP-STREAM Password Reset</h2>` +
          `<p>Hello ${user.username},</p>` +
          `<p>You requested a password reset.</p>` +
          `<p><a href="${resetUrl}">Reset my password</a></p>` +
          `<p>This link expires in 1 hour.</p>` +
          `<p>If you did not request this, you can ignore this email.</p>`
      });
    } catch (emailError) {
      console.error('Password reset email error:', emailError.message);
    }

    res.json({
      message: genericMessage
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);

    res.status(500).json({
      message: 'Password reset request failed'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT id
       FROM users
       WHERE password_reset_token = $1
         AND password_reset_expires > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid or expired password reset link'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL
       WHERE id = $2`,
      [passwordHash, result.rows[0].id]
    );

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);

    res.status(500).json({
      message: 'Password reset failed'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const db = req.app.locals.db;

    const result = await db.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        message: 'JWT_SECRET is not configured'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      message: 'Login failed'
    });
  }
});


const authenticateToken = require('../middleware/auth');

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      message: 'Failed to get user profile'
    });
  }
});
module.exports = router;
