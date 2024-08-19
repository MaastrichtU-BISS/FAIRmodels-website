
var address = 'https://api.fairmodels.org';	// Production
if (location.hostname === 'localhost') {
    address = 'http://localhost:8000';	// Development
}
export const API_BASE_URL = address;

export const EXECUTOR_BASE_URL = process.env.EXECUTOR_BASE_URL ?? `${API_BASE_URL}/executor`;