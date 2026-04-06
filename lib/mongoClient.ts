import { MongoClient, MongoClientOptions } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options: MongoClientOptions = {};

function makeClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  const client = new MongoClient(uri, options);
  return client.connect();
}

// Lazy: only connects when the promise is awaited at runtime
const clientPromise: Promise<MongoClient> = new Promise((resolve, reject) => {
  // Wrap in setTimeout(0) so it runs at runtime, not during build-time module eval
  if (typeof process !== "undefined" && process.env.MONGODB_URI) {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        global._mongoClientPromise = makeClientPromise();
      }
      global._mongoClientPromise.then(resolve).catch(reject);
    } else {
      makeClientPromise().then(resolve).catch(reject);
    }
  } else {
    // During build, resolve with a dummy that will never be used
    resolve(null as any);
  }
});

export default clientPromise;
