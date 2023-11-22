export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Check for range request
    if (request.headers.has("Range")) {
      console.log(`Range request detected for: ${request.url}`);
      let response = await fetch(request);
      response = new Response(response.body, response);
      return response;
    }

    let response = await cache.match(cacheKey);

    if (!response) {
      console.log(`Response not in cache, fetching: ${request.url}`);
      response = await fetch(request);
      response = new Response(response.body, response);

      // Set cache-control header
      const cacheControl = determineCacheControl(url);
      response.headers.append("Cache-Control", cacheControl);

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    } else {
      console.log(`Cache hit for: ${request.url}`);
    }

    return response;
  },
};

function determineCacheControl(url) {
  // Cache all content for 2 days
  return "public, max-age=172800"; // 2 days
}
