import { MongoClient } from 'mongodb';

// REPLACE 'event-booking' with your actual local database name from MongoDB Compass
const localUri = 'mongodb://localhost:27017/event-booking';
const atlasUri = 'mongodb+srv://aditidhumal08_db_user:mo5GbRhDpQKnbZ22@cluster0.rjxb5wr.mongodb.net/event-booking?retryWrites=true&w=majority&appName=Cluster0';

async function transferData(): Promise<void> {
  console.log('Starting data transfer...');
  
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);
  
  try {
    await localClient.connect();
    console.log('✅ Connected to local database');
    
    await atlasClient.connect();
    console.log('✅ Connected to Atlas database');
    
    const localDb = localClient.db();
    const atlasDb = atlasClient.db();
    
    // Get all collections from local
    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));
    
    for (const coll of collections) {
      const data = await localDb.collection(coll.name).find({}).toArray();
      console.log(`📦 Collection ${coll.name} has ${data.length} documents`);
      
      if (data.length > 0) {
        // Insert into Atlas
        await atlasDb.collection(coll.name).insertMany(data);
        console.log(`✅ Transferred ${data.length} documents from ${coll.name}`);
      }
    }
    
    console.log('🎉 Data transfer complete!');
  } catch (error) {
    console.error('❌ Transfer failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

transferData().catch(console.error);