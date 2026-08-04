import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(uri);
    console.log('Connected');
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection not established');
    }

    const auctions = await db.collection('auctions').find().toArray();
    console.log('Auctions count:', auctions.length);

    const bids = await db.collection('bids').find().toArray();
    console.log('Bids count:', bids.length);

    if (bids.length > 0) {
        console.log('First bid:', bids[0]);
        console.log('Bid auctionId type:', typeof bids[0].auctionId, bids[0].auctionId instanceof mongoose.Types.ObjectId);
    }
    
    if (auctions.length > 0) {
        const auctionWithBids = auctions.find(a => bids.some(b => b.auctionId.toString() === a._id.toString()));
        if (auctionWithBids) {
            console.log('Found auction with bids:', auctionWithBids._id);
        } else {
            console.log('No auction found matching any bid');
        }
    }

    process.exit(0);
}
run();
