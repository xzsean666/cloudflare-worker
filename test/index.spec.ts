import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Hello World user worker', () => {
	describe('CORS', () => {
		it('allows preflight for allowed origin', async () => {
			const request = new Request('http://example.com/message', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://allowed.example.com',
					'Access-Control-Request-Method': 'GET',
					'Access-Control-Request-Headers': 'Content-Type',
				},
			});
			env.ALLOWED_ORIGINS = 'https://allowed.example.com, https://also-allowed.example.com';
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(204);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.example.com');
		});

		it('blocks requests from disallowed origin', async () => {
			const request = new Request('http://example.com/message', {
				method: 'GET',
				headers: { Origin: 'https://bad.example.com' },
			});
			env.ALLOWED_ORIGINS = 'https://allowed.example.com';
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(403);
		});

		it('adds CORS headers for allowed origin on normal response', async () => {
			const request = new Request('http://example.com/message', {
				method: 'GET',
				headers: { Origin: 'https://allowed.example.com' },
			});
			env.ALLOWED_ORIGINS = 'https://allowed.example.com';
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('Hello, World!');
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://allowed.example.com');
		});
	});
	describe('request for /message', () => {
		it('/ responds with "Hello, World!" (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/message');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});

		it('responds with "Hello, World!" (integration style)', async () => {
			const request = new Request('http://example.com/message');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});
	});

	describe('request for /random', () => {
		it('/ responds with a random UUID (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/random');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});

		it('responds with a random UUID (integration style)', async () => {
			const request = new Request('http://example.com/random');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});
	});
});
