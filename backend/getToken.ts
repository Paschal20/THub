import { userModel } from './src/models/userModel';
import database from './src/database/db';

async function getToken() {
  try {
    await database();
    const users = await userModel.find({});
    console.log('All users:', users.map(u => ({ email: u.email, isEmailVerified: u.isEmailVerified, token: u.emailVerificationToken, tokenLength: u.emailVerificationToken?.length, expires: u.emailVerificationExpires })));
    const user = await userModel.findOne({ email: 'test@example.com' });
    if (user) {
      console.log('User found:', { email: user.email, isEmailVerified: user.isEmailVerified, token: user.emailVerificationToken, tokenLength: user.emailVerificationToken?.length, expires: user.emailVerificationExpires });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

getToken();
