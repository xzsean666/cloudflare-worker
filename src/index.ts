/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		switch (path) {
			case '/message':
				return new Response('Hello, World!');
			case '/random':
				return new Response(crypto.randomUUID());
			case path.startsWith('/kv/put/') ? path : '': {
				const parts = path.split('/');
				const key = parts[3];
				const value = parts[4];
				if (key && value) {
					await env.KV_TEST.put(key, value);
					return new Response(`Stored ${key}: ${value} in KV!`);
				}
				return new Response('Invalid KV put request. Usage: /kv/put/:key/:value', { status: 400 });
			}
			case path.startsWith('/kv/get/') ? path : '': {
				const parts = path.split('/');
				const key = parts[3];
				if (key) {
					const value = await env.KV_TEST.get(key);
					if (value) {
						return new Response(`Value for ${key}: ${value}`);
					}
					return new Response(`Key ${key} not found in KV.`, { status: 404 });
				}
				return new Response('Invalid KV get request. Usage: /kv/get/:key', { status: 400 });
			}
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
