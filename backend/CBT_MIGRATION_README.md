# CBT to TimelyHub Migration Guide

This guide explains how to migrate all CBT/Kode10x users and data to the main TimelyHub database.

## Prerequisites

1. **MongoDB Atlas Setup**: Ensure you have a MongoDB Atlas cluster set up
2. **Environment Variables**: Set the following in your `.env.local`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/timelyhub
   KODE10X_MONGO_URL=mongodb://localhost:27017/kode10x  # or your Kode10x database URL
   ```

## Migration Process

### Step 1: Install Dependencies
```bash
cd Timely-Hub-Backend-Paschal-Vercel
npm install
```

### Step 2: Run Migration
```bash
npm run migrate-cbt
```

This will:
- Connect to both the Kode10x database and TimelyHub database
- Migrate all schools, users, questions, and quiz attempts
- Handle duplicates and conflicts appropriately
- Provide a detailed migration report

### Step 3: Verify Migration
After migration, check that:
- Users can log in with their existing credentials
- Quiz history is preserved
- Leaderboards show correct data
- School affiliations are maintained

### Step 4: Update Environment Variables
Remove the `KODE10X_MONGO_URL` from your environment variables as it's no longer needed.

## What Gets Migrated

### Schools
- School names and normalized names
- Student counts and statistics

### Users
- User profiles (name, email, password)
- School affiliations
- Quiz scores and completion history
- Role assignments (user/admin)

### Questions
- All quiz questions with options and answers
- Subject categorization

### Quiz Attempts
- Complete quiz attempt history
- Scores and performance metrics
- Session data

## Conflict Resolution

- **Duplicate Emails**: Existing TimelyHub users take precedence
- **Duplicate Schools**: Schools with same normalized name are merged
- **Duplicate Questions**: Questions with same text/subject are skipped
- **Quiz Attempts**: Attempts with same user/subject/timestamp are skipped

## Post-Migration Tasks

1. **Update Frontend**: Ensure all CBT components point to TimelyHub endpoints
2. **Remove Separate Apps**: Delete Kode10x backend and frontend directories
3. **Test Functionality**: Verify all quiz features work correctly
4. **Update Documentation**: Remove references to separate CBT systems

## Troubleshooting

### Migration Fails
- Check database connections
- Ensure environment variables are set correctly
- Verify MongoDB Atlas IP whitelist includes your IP

### Users Can't Login
- Check password hashing (migrated users may need password reset)
- Verify email verification status
- Ensure role mappings are correct

### Missing Data
- Check migration logs for skipped items
- Verify database connections during migration
- Ensure collections exist in source database

## Rollback (If Needed)

If you need to rollback the migration:

1. **Users**: Delete migrated users from TimelyHub database
2. **Schools**: Remove migrated schools (be careful not to delete existing ones)
3. **Questions**: Delete migrated questions
4. **Attempts**: Remove migrated quiz attempts

⚠️ **Warning**: Rollback may cause data loss. Always backup databases before migration.

## Support

If you encounter issues during migration:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set
3. Ensure MongoDB Atlas cluster is accessible
4. Contact the development team for assistance</content>
</xai:function_call=1> 

<xai:function_call name="todowrite">
<parameter name="todos">[{"content":"Create migration script to move CBT/Kode10x users to main TimelyHub database","status":"completed","priority":"high","id":"create_migration_script"}]