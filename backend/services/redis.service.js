import Redis from 'ioredis';


const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});


redisClient.on('connect', () => {
    console.log('Redis connected');
})

export default redisClient;

/*
12. **`services/redis.service.js`**:
    - **Caching/Session Management**: Contains logic for interacting with a Redis instance.
    - **Use Cases**: Could be used for caching frequently accessed data (like user sessions, project details)
     to improve performance or potentially for managing real-time presence information via Pub/Sub (though [Socket.IO](http://socket.io/)
      often handles presence directly).

Your App
   ↓
Import ioredis
   ↓
Create a connection to Redis server (with host, port, password)
   ↓
Listen for connection events (e.g., "connect")
   ↓
Export the client so all files share the same connection

*/