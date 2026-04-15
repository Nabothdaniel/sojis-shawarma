These smoke tests use Node's built-in test runner and expect the local servers to already be running.

Default URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Run:
- `npm run test:frontend`
- `npm run test:backend`
- `npm test`

You can override the targets with:
- `FRONTEND_BASE_URL=http://...`
- `BACKEND_BASE_URL=http://...`
