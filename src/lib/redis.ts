import Redis from "ioredis";

function redis() {
  const redis = new Redis();

  return async <T>(
    key: string,
    getter: () => Promise<T>,
    duration = 60 * 60 * 24
  ) => {
    return new Promise<T | null>(async (resolve) => {
      let cached = await redis
        .get(key)
        .then((data) => (data ? (JSON.parse(data) as T) : null))
        .catch(() => null);

      if (!cached) {
        cached = await getter()
          .then(async (data) => {
            await redis.set(key, JSON.stringify(data), "EX", duration);
            return data;
          })
          .catch(() => null);
      }

      resolve(cached);
    });
  };
}

export default redis();

export async function deleteCache(key: string) {
  const redis = new Redis();
  await redis.del(key);
}
