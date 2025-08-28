# Database Setup Guide

This guide will help you set up the MongoDB database system for your puzzle application.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Your MongoDB connection string

## Environment Configuration

1. Create a `.env.local` file in your project root:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle

# Database Name
MONGODB_DB_NAME=puzzle_db

# JWT Secret (for authentication if needed later)
JWT_SECRET=your-super-secret-jwt-key-here

# Environment
NODE_ENV=development

# Port
PORT=3000
```

2. Replace `<db_password>` with your actual MongoDB password

## Installation

1. Install the new dependencies:

```bash
npm install
# or
pnpm install
```

2. The following packages will be installed:
   - `mongodb`: MongoDB driver
   - `mongoose`: MongoDB ODM (Object Document Mapper)

## Database Models

The application includes three main models:

### 1. Puzzle Model (`lib/models/Puzzle.ts`)
- Stores puzzle information (title, description, image, dimensions)
- Manages puzzle pieces and their states
- Includes difficulty levels, categories, and tags
- Tracks completion status and player limits

### 2. User Model (`lib/models/User.ts`)
- Manages user accounts and preferences
- Tracks puzzle statistics and achievements
- Includes user levels based on completion count

### 3. PuzzleSession Model (`lib/models/PuzzleSession.ts`)
- Manages active puzzle sessions
- Tracks participants and their contributions
- Handles real-time collaboration features

## API Endpoints

### Puzzles
- `GET /api/puzzles` - List all puzzles with filtering and pagination
- `POST /api/puzzles` - Create a new puzzle
- `GET /api/puzzles/[id]` - Get a specific puzzle
- `PUT /api/puzzles/[id]` - Update a puzzle
- `DELETE /api/puzzles/[id]` - Delete a puzzle

### Puzzle Pieces
- `GET /api/puzzles/[id]/pieces` - Get all pieces for a puzzle
- `POST /api/puzzles/[id]/pieces` - Place a piece
- `PUT /api/puzzles/[id]/pieces/[pieceId]` - Update a piece

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/[id]` - Get a specific session
- `PUT /api/sessions/[id]` - Update a session
- `DELETE /api/sessions/[id]` - End a session

### Session Participants
- `GET /api/sessions/[id]/participants` - List session participants
- `POST /api/sessions/[id]/participants` - Add a participant
- `DELETE /api/sessions/[id]/participants/[userId]` - Remove a participant

## Database Seeding

To populate your database with sample data:

1. Run the seeder script:

```bash
npx tsx lib/seed-database.ts
```

This will create:
- 5 sample puzzles with different difficulties and categories
- 2 sample users with different skill levels

## Database Connection

The application automatically connects to MongoDB when the server starts. The connection is managed in `lib/database.ts` and includes:

- Connection pooling
- Error handling
- Graceful shutdown
- Environment-based configuration

## Real-time Features

The WebSocket server has been enhanced to:

- Store puzzle state in the database
- Track user participation in sessions
- Sync piece placements across all connected clients
- Maintain session persistence

## Testing the Setup

1. Start the development server:

```bash
npm run dev
```

2. Check the console for successful MongoDB connection
3. Visit `http://localhost:3000/api/puzzles` to see the API in action
4. Use the seeder to populate sample data

## Database Indexes

The models include optimized indexes for:

- Text search on puzzle titles and descriptions
- Filtering by difficulty, category, and status
- Sorting by creation date and player count
- User lookups and session queries

## Monitoring and Maintenance

### Health Checks
- Monitor connection status in server logs
- Check database performance with MongoDB Atlas metrics

### Backup Strategy
- Enable automated backups in MongoDB Atlas
- Consider point-in-time recovery for production

### Scaling Considerations
- Use MongoDB Atlas for automatic scaling
- Implement read replicas for heavy query loads
- Consider sharding for very large datasets

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your connection string
   - Check network access and firewall settings
   - Ensure MongoDB Atlas IP whitelist includes your IP

2. **Authentication Errors**
   - Verify username and password
   - Check database user permissions
   - Ensure the database exists

3. **Performance Issues**
   - Check database indexes
   - Monitor query performance
   - Consider connection pooling settings

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
DEBUG=mongoose:*
```

## Next Steps

After setting up the database:

1. **Authentication System**: Implement user login/registration
2. **File Upload**: Add image upload for puzzle pieces
3. **Analytics**: Create dashboard for puzzle statistics
4. **Caching**: Implement Redis for session caching
5. **Testing**: Add unit and integration tests

## Security Considerations

- Use environment variables for sensitive data
- Implement proper input validation
- Add rate limiting for API endpoints
- Consider MongoDB Atlas security features
- Regular security updates and monitoring

## Support

If you encounter issues:

1. Check the MongoDB Atlas logs
2. Review application console output
3. Verify environment configuration
4. Test database connection separately

---

**Note**: This setup provides a solid foundation for a production-ready puzzle application. Consider implementing additional security measures and monitoring before deploying to production.
